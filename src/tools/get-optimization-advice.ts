/**
 * Get Optimization Advice Tool
 *
 * Queries live Monti APM data and applies the knowledge base
 * to provide contextual, documentation-backed recommendations.
 */

import { z } from 'zod';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { advisor } from '../knowledge/advisor.js';
import type { MetricCategory, Severity, Recommendation } from '../knowledge/types.js';
import {
  GetMethodTracesDocument,
  GetPubTracesDocument,
  GetSystemMetricsDocument,
} from '../graphql/generated/graphql.js';

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

// Aggregated method data from traces
interface MethodAggregation {
  name: string;
  count: number;
  totalResponseTime: number;
  totalWaitTime: number;
  totalDbTime: number;
  totalHttpTime: number;
  totalEmailTime: number;
  totalAsyncTime: number;
  totalComputeTime: number;
}

// Aggregated publication data from traces
interface PubAggregation {
  name: string;
  count: number;
  totalResponseTime: number;
  totalWaitTime: number;
  totalDbTime: number;
  totalComputeTime: number;
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
  // Query method traces and aggregate by method name
  const { data } = await client.query({
    query: GetMethodTracesDocument,
    variables: { startTime, endTime, limit: limit * 10 }, // Get more traces to aggregate
  });

  const traces = data.meteorMethodTraces ?? [];

  if (traces.length === 0) {
    return {
      category: 'methods' as MetricCategory,
      itemsAnalyzed: 0,
      issues: [],
      recommendations: [],
      summary: 'No method data found in the specified time range.',
    };
  }

  // Aggregate traces by method name
  const aggregations = new Map<string, MethodAggregation>();

  for (const trace of traces) {
    if (!trace?.method) continue;

    const existing = aggregations.get(trace.method);
    const metrics = trace.metrics;

    if (existing) {
      existing.count++;
      existing.totalResponseTime += metrics?.total ?? 0;
      existing.totalWaitTime += metrics?.wait ?? 0;
      existing.totalDbTime += metrics?.db ?? 0;
      existing.totalHttpTime += metrics?.http ?? 0;
      existing.totalEmailTime += metrics?.email ?? 0;
      existing.totalAsyncTime += metrics?.async ?? 0;
      existing.totalComputeTime += metrics?.compute ?? 0;
    } else {
      aggregations.set(trace.method, {
        name: trace.method,
        count: 1,
        totalResponseTime: metrics?.total ?? 0,
        totalWaitTime: metrics?.wait ?? 0,
        totalDbTime: metrics?.db ?? 0,
        totalHttpTime: metrics?.http ?? 0,
        totalEmailTime: metrics?.email ?? 0,
        totalAsyncTime: metrics?.async ?? 0,
        totalComputeTime: metrics?.compute ?? 0,
      });
    }
  }

  const methods = Array.from(aggregations.values()).slice(0, limit);

  const allRecommendations: FormattedRecommendation[] = [];
  const issues: Array<{ method: string; issue: string; severity: Severity }> = [];

  for (const method of methods) {
    const avgResponseTime = method.totalResponseTime / method.count;
    const avgDbTime = method.totalDbTime / method.count;
    const avgComputeTime = method.totalComputeTime / method.count;
    const avgHttpTime = method.totalHttpTime / method.count;
    const avgWaitTime = method.totalWaitTime / method.count;
    const avgAsyncTime = method.totalAsyncTime / method.count;
    const avgEmailTime = method.totalEmailTime / method.count;

    const analysis = advisor.analyzeMethodMetrics({
      total: avgResponseTime,
      db: avgDbTime,
      compute: avgComputeTime,
      http: avgHttpTime,
      wait: avgWaitTime,
      async: avgAsyncTime,
      email: avgEmailTime,
    });

    if (analysis.severity !== 'info') {
      issues.push({
        method: method.name,
        issue: `Avg response time: ${avgResponseTime.toFixed(0)}ms, main bottleneck: ${analysis.bottleneck}`,
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
  const totalResponseTime = methods.reduce((sum, m) => sum + m.totalResponseTime, 0);
  const totalCalls = methods.reduce((sum, m) => sum + m.count, 0);
  const avgResponseTime = totalCalls > 0 ? totalResponseTime / totalCalls : 0;

  const sortedByAvgTime = [...methods].sort(
    (a, b) => b.totalResponseTime / b.count - a.totalResponseTime / a.count,
  );

  return {
    category: 'methods' as MetricCategory,
    itemsAnalyzed: methods.length,
    aggregateStats: {
      averageResponseTime: `${avgResponseTime.toFixed(0)}ms`,
      totalCalls,
      slowestMethod: sortedByAvgTime[0]?.name ?? 'N/A',
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
  // Query publication traces and aggregate by publication name
  const { data } = await client.query({
    query: GetPubTracesDocument,
    variables: { startTime, endTime, limit: limit * 10 }, // Get more traces to aggregate
  });

  const traces = data.meteorPubTraces ?? [];

  if (traces.length === 0) {
    return {
      category: 'publications' as MetricCategory,
      itemsAnalyzed: 0,
      issues: [],
      recommendations: [],
      summary: 'No publication data found in the specified time range.',
    };
  }

  // Aggregate traces by publication name
  const aggregations = new Map<string, PubAggregation>();

  for (const trace of traces) {
    if (!trace?.publication) continue;

    const existing = aggregations.get(trace.publication);
    const metrics = trace.metrics;

    if (existing) {
      existing.count++;
      existing.totalResponseTime += metrics?.total ?? 0;
      existing.totalWaitTime += metrics?.wait ?? 0;
      existing.totalDbTime += metrics?.db ?? 0;
      existing.totalComputeTime += metrics?.compute ?? 0;
    } else {
      aggregations.set(trace.publication, {
        name: trace.publication,
        count: 1,
        totalResponseTime: metrics?.total ?? 0,
        totalWaitTime: metrics?.wait ?? 0,
        totalDbTime: metrics?.db ?? 0,
        totalComputeTime: metrics?.compute ?? 0,
      });
    }
  }

  const pubs = Array.from(aggregations.values()).slice(0, limit);

  const allRecommendations: FormattedRecommendation[] = [];
  const issues: Array<{ publication: string; issue: string; severity: Severity }> = [];

  for (const pub of pubs) {
    const avgResponseTime = pub.totalResponseTime / pub.count;
    const avgDbTime = pub.totalDbTime / pub.count;

    // Analyze publication metrics with available data
    // Note: observer reuse, active subs/docs not available in trace data
    const analysis = advisor.analyzePublicationMetrics({
      responseTime: avgResponseTime,
      observerReuse: 1, // Default to 100% when not available
      activeSubs: 0,
      activeDocs: 0,
      lifespan: 0,
      updateRatio: 0,
    });

    // Also check for slow response times
    if (avgResponseTime > 1000) {
      issues.push({
        publication: pub.name,
        issue: `High avg response time: ${avgResponseTime.toFixed(0)}ms`,
        severity: avgResponseTime > 3000 ? 'critical' : avgResponseTime > 2000 ? 'high' : 'medium',
      });
    }

    if (avgDbTime > 500) {
      issues.push({
        publication: pub.name,
        issue: `High DB time: ${avgDbTime.toFixed(0)}ms - consider adding indexes`,
        severity: avgDbTime > 1000 ? 'high' : 'medium',
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
  const totalResponseTime = pubs.reduce((sum, p) => sum + p.totalResponseTime, 0);
  const totalCalls = pubs.reduce((sum, p) => sum + p.count, 0);
  const avgResponseTime = totalCalls > 0 ? totalResponseTime / totalCalls : 0;

  const sortedByAvgTime = [...pubs].sort(
    (a, b) => b.totalResponseTime / b.count - a.totalResponseTime / a.count,
  );

  return {
    category: 'publications' as MetricCategory,
    itemsAnalyzed: pubs.length,
    aggregateStats: {
      averageResponseTime: `${avgResponseTime.toFixed(0)}ms`,
      totalSubscriptions: totalCalls,
      slowestPublication: sortedByAvgTime[0]?.name ?? 'N/A',
    },
    issues: issues.slice(0, 10),
    recommendations: allRecommendations.slice(0, 10),
    summary:
      issues.length > 0
        ? `Found ${issues.length} publication performance issues. Focus on ${issues[0]?.publication ?? 'the slowest publications'} first.`
        : 'Publication performance looks healthy. Continue monitoring for changes.',
  };
}

async function analyzeSystemCategory(
  client: MontiGraphQLClient,
  startTime: number,
  endTime: number | undefined,
) {
  // Query each system metric type separately
  const [cpuResult, ramResult, sessionsResult] = await Promise.all([
    client.query({
      query: GetSystemMetricsDocument,
      variables: { metric: 'CPU_USAGE', startTime, endTime, resolution: 'RES_1MIN' },
    }),
    client.query({
      query: GetSystemMetricsDocument,
      variables: { metric: 'RAM_USAGE', startTime, endTime, resolution: 'RES_1MIN' },
    }),
    client.query({
      query: GetSystemMetricsDocument,
      variables: { metric: 'SESSIONS', startTime, endTime, resolution: 'RES_1MIN' },
    }),
  ]);

  const cpuMetrics = cpuResult.data.meteorSystemMetrics ?? [];
  const ramMetrics = ramResult.data.meteorSystemMetrics ?? [];
  const sessionsMetrics = sessionsResult.data.meteorSystemMetrics ?? [];

  const totalMetricsCount = cpuMetrics.length + ramMetrics.length + sessionsMetrics.length;

  if (totalMetricsCount === 0) {
    return {
      category: 'system' as MetricCategory,
      itemsAnalyzed: 0,
      issues: [],
      recommendations: [],
      summary: 'No system metrics found in the specified time range.',
    };
  }

  // Extract percentiles from metrics
  // CPU is a percentage (0-100)
  const avgCpu = cpuMetrics[0]?.p50 ?? 0;
  const maxCpu = cpuMetrics[0]?.p95 ?? 0;

  // RAM is in bytes
  const avgMemory = ramMetrics[0]?.p50 ?? 0;
  const maxMemory = ramMetrics[0]?.p95 ?? 0;

  // Sessions is a count
  const avgSessions = sessionsMetrics[0]?.p50 ?? 0;

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
    itemsAnalyzed: totalMetricsCount,
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
