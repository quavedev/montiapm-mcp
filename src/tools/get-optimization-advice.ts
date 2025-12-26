/**
 * Get Optimization Advice Tool
 *
 * Queries live Monti APM data and applies the knowledge base
 * to provide contextual, documentation-backed recommendations.
 */

import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { advisor } from '../knowledge/advisor.js';
import type { MetricCategory, Severity, Recommendation } from '../knowledge/types.js';

export const getOptimizationAdviceSchema = z.object({
  category: z
    .enum(['methods', 'publications', 'system'])
    .describe('The category to analyze: methods, publications, or system'),
  startTime: z
    .number()
    .optional()
    .describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z
    .number()
    .optional()
    .describe('Unix timestamp in milliseconds. Default: now'),
  limit: z
    .number()
    .max(100)
    .optional()
    .default(20)
    .describe('Maximum number of items to analyze. Default: 20'),
});

export type GetOptimizationAdviceInput = z.input<typeof getOptimizationAdviceSchema>;

// GraphQL queries for fetching live data
const GET_METHOD_BREAKDOWN = gql`
  query GetMethodBreakdown($startTime: Float, $endTime: Float, $limit: Float) {
    meteorMethodBreakdown(startTime: $startTime, endTime: $endTime, limit: $limit) {
      name
      count
      responseTime
      waitTime
      dbTime
      httpTime
      emailTime
      asyncTime
      computeTime
    }
  }
`;

const GET_PUB_BREAKDOWN = gql`
  query GetPubBreakdown($startTime: Float, $endTime: Float, $limit: Float) {
    meteorPubBreakdown(startTime: $startTime, endTime: $endTime, limit: $limit) {
      name
      count
      responseTime
      lifeTime
      activeSubs
      activeDocs
      observerReuse
      polledDocuments
      liveAddedDocuments
      liveChangedDocuments
      liveRemovedDocuments
      initiallyAddedDocuments
    }
  }
`;

const GET_SYSTEM_METRICS = gql`
  query GetSystemMetrics($startTime: Float, $endTime: Float, $resolution: MetricsResolution) {
    meteorSystemMetrics(startTime: $startTime, endTime: $endTime, resolution: $resolution) {
      time
      cpuUsage
      memory
      sessions
      eventLoopTime
    }
  }
`;

interface MethodBreakdown {
  name: string;
  count: number;
  responseTime: number;
  waitTime: number;
  dbTime: number;
  httpTime: number;
  emailTime: number;
  asyncTime: number;
  computeTime: number;
}

interface PubBreakdown {
  name: string;
  count: number;
  responseTime: number;
  lifeTime: number;
  activeSubs: number;
  activeDocs: number;
  observerReuse: number;
  polledDocuments: number;
  liveAddedDocuments: number;
  liveChangedDocuments: number;
  liveRemovedDocuments: number;
  initiallyAddedDocuments: number;
}

interface SystemMetric {
  time: number;
  cpuUsage: number;
  memory: number;
  sessions: number;
  eventLoopTime: number;
}

interface FormattedRecommendation {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  actions: string[];
  codeExample?: string;
  documentationUrl: string;
}

function formatRecommendation(rec: Recommendation): FormattedRecommendation {
  return {
    id: rec.id,
    severity: rec.severity,
    title: rec.title,
    description: rec.description,
    actions: rec.actions,
    codeExample: rec.codeExample,
    documentationUrl: rec.docUrl,
  };
}

async function analyzeMethodsCategory(
  client: MontiGraphQLClient,
  startTime: number,
  endTime: number | undefined,
  limit: number,
) {
  const { data } = await client.query<{ meteorMethodBreakdown: MethodBreakdown[] }>({
    query: GET_METHOD_BREAKDOWN,
    variables: { startTime, endTime, limit },
  });

  const methods = data.meteorMethodBreakdown;

  if (methods.length === 0) {
    return {
      category: 'methods' as MetricCategory,
      itemsAnalyzed: 0,
      issues: [],
      recommendations: [],
      summary: 'No method data found in the specified time range.',
    };
  }

  const allRecommendations: FormattedRecommendation[] = [];
  const issues: Array<{ method: string; issue: string; severity: Severity }> = [];

  for (const method of methods) {
    const analysis = advisor.analyzeMethodMetrics({
      total: method.responseTime,
      db: method.dbTime,
      compute: method.computeTime,
      http: method.httpTime,
      wait: method.waitTime,
      async: method.asyncTime,
      email: method.emailTime,
    });

    if (analysis.severity !== 'info') {
      issues.push({
        method: method.name,
        issue: `Response time: ${method.responseTime}ms, main bottleneck: ${analysis.bottleneck}`,
        severity: analysis.severity,
      });
    }

    for (const rec of analysis.recommendations) {
      if (!allRecommendations.some((r) => r.id === rec.id)) {
        allRecommendations.push(formatRecommendation(rec));
      }
    }
  }

  // Sort issues by severity
  issues.sort((a, b) => {
    const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return order[a.severity] - order[b.severity];
  });

  // Calculate aggregate stats
  const avgResponseTime =
    methods.reduce((sum, m) => sum + m.responseTime, 0) / methods.length;
  const totalCalls = methods.reduce((sum, m) => sum + m.count, 0);

  return {
    category: 'methods' as MetricCategory,
    itemsAnalyzed: methods.length,
    aggregateStats: {
      averageResponseTime: `${avgResponseTime.toFixed(0)}ms`,
      totalCalls,
      slowestMethod: methods.sort((a, b) => b.responseTime - a.responseTime)[0]?.name ?? 'N/A',
    },
    issues: issues.slice(0, 10),
    recommendations: allRecommendations.slice(0, 10),
    summary:
      issues.length > 0
        ? `Found ${issues.length} methods with performance issues. Focus on ${issues[0]?.method ?? 'the slowest methods'} first.`
        : 'Method performance looks healthy. Continue monitoring for changes.',
  };
}

async function analyzePublicationsCategory(
  client: MontiGraphQLClient,
  startTime: number,
  endTime: number | undefined,
  limit: number,
) {
  const { data } = await client.query<{ meteorPubBreakdown: PubBreakdown[] }>({
    query: GET_PUB_BREAKDOWN,
    variables: { startTime, endTime, limit },
  });

  const pubs = data.meteorPubBreakdown;

  if (pubs.length === 0) {
    return {
      category: 'publications' as MetricCategory,
      itemsAnalyzed: 0,
      issues: [],
      recommendations: [],
      summary: 'No publication data found in the specified time range.',
    };
  }

  const allRecommendations: FormattedRecommendation[] = [];
  const issues: Array<{ publication: string; issue: string; severity: Severity }> = [];

  for (const pub of pubs) {
    const analysis = advisor.analyzePublicationMetrics({
      responseTime: pub.responseTime,
      observerReuse: pub.observerReuse,
      activeSubs: pub.activeSubs,
      activeDocs: pub.activeDocs,
      lifespan: pub.lifeTime,
      updateRatio:
        pub.initiallyAddedDocuments > 0
          ? (pub.liveChangedDocuments + pub.liveAddedDocuments) / pub.initiallyAddedDocuments
          : 0,
    });

    for (const issue of analysis.issues) {
      issues.push({
        publication: pub.name,
        issue,
        severity: analysis.severity,
      });
    }

    for (const rec of analysis.recommendations) {
      if (!allRecommendations.some((r) => r.id === rec.id)) {
        allRecommendations.push(formatRecommendation(rec));
      }
    }
  }

  // Calculate aggregate stats
  const avgObserverReuse =
    pubs.reduce((sum, p) => sum + (p.observerReuse || 0), 0) / pubs.length;
  const totalActiveDocs = pubs.reduce((sum, p) => sum + (p.activeDocs || 0), 0);

  return {
    category: 'publications' as MetricCategory,
    itemsAnalyzed: pubs.length,
    aggregateStats: {
      averageObserverReuse: `${(avgObserverReuse * 100).toFixed(1)}%`,
      totalActiveDocs,
      lowestObserverReuse: pubs
        .filter((p) => p.observerReuse !== null)
        .sort((a, b) => a.observerReuse - b.observerReuse)[0]?.name ?? 'N/A',
    },
    issues: issues.slice(0, 10),
    recommendations: allRecommendations.slice(0, 10),
    summary:
      avgObserverReuse < 0.75
        ? `Observer reuse is below optimal (${(avgObserverReuse * 100).toFixed(1)}%). Consider implementing namespaces with redis-oplog.`
        : `Observer reuse is healthy at ${(avgObserverReuse * 100).toFixed(1)}%. Continue monitoring.`,
  };
}

async function analyzeSystemCategory(
  client: MontiGraphQLClient,
  startTime: number,
  endTime: number | undefined,
) {
  const { data } = await client.query<{ meteorSystemMetrics: SystemMetric[] }>({
    query: GET_SYSTEM_METRICS,
    variables: { startTime, endTime, resolution: 'MIN_1' },
  });

  const metrics = data.meteorSystemMetrics;

  if (metrics.length === 0) {
    return {
      category: 'system' as MetricCategory,
      itemsAnalyzed: 0,
      issues: [],
      recommendations: [],
      summary: 'No system metrics found in the specified time range.',
    };
  }

  // Calculate aggregates
  const avgCpu = metrics.reduce((sum, m) => sum + (m.cpuUsage || 0), 0) / metrics.length;
  const maxCpu = Math.max(...metrics.map((m) => m.cpuUsage || 0));
  const avgMemory = metrics.reduce((sum, m) => sum + (m.memory || 0), 0) / metrics.length;
  const maxMemory = Math.max(...metrics.map((m) => m.memory || 0));
  const avgSessions = metrics.reduce((sum, m) => sum + (m.sessions || 0), 0) / metrics.length;

  // Get recommendations based on system metrics
  const context = {
    category: 'system' as MetricCategory,
    metrics: {
      cpuUsage: avgCpu,
      cpuP95: maxCpu,
      memoryUsage: avgMemory,
      sessions: avgSessions,
    },
  };

  const advice = advisor.analyze(context);

  const issues: Array<{ metric: string; issue: string; severity: Severity }> = [];
  const allRecommendations: FormattedRecommendation[] = [];

  if (avgCpu > 70) {
    issues.push({
      metric: 'CPU',
      issue: `Average CPU usage is high: ${avgCpu.toFixed(1)}%`,
      severity: avgCpu > 90 ? 'critical' : 'high',
    });
  }

  if (avgMemory > 1.5 * 1024 * 1024 * 1024) {
    const memGB = avgMemory / (1024 * 1024 * 1024);
    issues.push({
      metric: 'Memory',
      issue: `Average memory usage is high: ${memGB.toFixed(2)}GB`,
      severity: avgMemory > 2 * 1024 * 1024 * 1024 ? 'critical' : 'high',
    });
  }

  for (const a of advice) {
    for (const rec of a.recommendations) {
      if (!allRecommendations.some((r) => r.id === rec.id)) {
        allRecommendations.push(formatRecommendation(rec));
      }
    }
  }

  return {
    category: 'system' as MetricCategory,
    itemsAnalyzed: metrics.length,
    aggregateStats: {
      averageCpu: `${avgCpu.toFixed(1)}%`,
      peakCpu: `${maxCpu.toFixed(1)}%`,
      averageMemory: `${(avgMemory / (1024 * 1024)).toFixed(0)}MB`,
      peakMemory: `${(maxMemory / (1024 * 1024)).toFixed(0)}MB`,
      averageSessions: Math.round(avgSessions),
    },
    issues,
    recommendations: allRecommendations.slice(0, 10),
    summary:
      issues.length > 0
        ? `Found ${issues.length} system resource concerns. ${issues[0]?.issue ?? ''}`
        : 'System resources look healthy. Continue monitoring for changes.',
  };
}

export async function getOptimizationAdvice(
  client: MontiGraphQLClient,
  input: GetOptimizationAdviceInput,
) {
  const startTime = input.startTime ?? getStartTime(1);
  const endTime = input.endTime;
  const limit = input.limit ?? 20;

  switch (input.category) {
    case 'methods':
      return analyzeMethodsCategory(client, startTime, endTime, limit);

    case 'publications':
      return analyzePublicationsCategory(client, startTime, endTime, limit);

    case 'system':
      return analyzeSystemCategory(client, startTime, endTime);

    default:
      throw new Error(`Unknown category: ${input.category}`);
  }
}
