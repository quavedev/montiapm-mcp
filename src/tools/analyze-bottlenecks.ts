import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatResponseTime, formatBytes, formatPercentage } from '../utils/formatting.js';
import { advisor } from '../knowledge/advisor.js';
import { REDIS_OPLOG_RECOMMENDATIONS } from '../knowledge/recommendations/index.js';

export const analyzeBottlenecksSchema = z.object({
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  includeSystemMetrics: z.boolean().optional().default(true).describe('Include system metrics in analysis'),
});

export type AnalyzeBottlenecksInput = z.input<typeof analyzeBottlenecksSchema>;

const GET_METHOD_BREAKDOWN = gql`
  query GetMethodBreakdown(
    $startTime: Float
    $endTime: Float
    $limit: Float
    $sortField: MeteorMethodBreakdownSortEnum!
  ) {
    meteorMethodBreakdown(
      startTime: $startTime
      endTime: $endTime
      limit: $limit
      sortField: $sortField
      sortOrder: DSC
    ) {
      name
      sortedValue
      throughput
    }
  }
`;

const GET_PUB_BREAKDOWN = gql`
  query GetPubBreakdown(
    $startTime: Float
    $endTime: Float
    $limit: Float
    $sortField: MeteorPubBreakdownSortEnum!
  ) {
    meteorPubBreakdown(
      startTime: $startTime
      endTime: $endTime
      limit: $limit
      sortField: $sortField
      sortOrder: DSC
    ) {
      name
      sortedValue
      throughput
    }
  }
`;

const GET_SYSTEM_METRICS = gql`
  query GetSystemMetrics(
    $startTime: Float
    $endTime: Float
    $metric: MeteorSystemMetricsEnum!
    $resolution: MeteorMetricResolution
  ) {
    meteorSystemMetrics(
      startTime: $startTime
      endTime: $endTime
      metric: $metric
      resolution: $resolution
    ) {
      p50: percentile(value: 50)
      p95: percentile(value: 95)
      max: percentile(value: 100)
    }
  }
`;

interface BreakdownItem {
  name: string;
  sortedValue: number;
  throughput: number;
}

interface SystemMetric {
  p50: number;
  p95: number;
  max: number;
}

interface GetMethodBreakdownResult {
  meteorMethodBreakdown: BreakdownItem[];
}

interface GetPubBreakdownResult {
  meteorPubBreakdown: BreakdownItem[];
}

interface GetSystemMetricsResult {
  meteorSystemMetrics: SystemMetric[];
}

interface BottleneckIssue {
  category: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  documentationUrl?: string;
  details: Record<string, string | number>;
}

interface DocumentedRecommendation {
  title: string;
  description: string;
  actions?: string[];
  codeExample?: string;
  documentationUrl: string;
}

export async function analyzeBottlenecks(
  client: MontiGraphQLClient,
  input: AnalyzeBottlenecksInput,
) {
  const startTime = input.startTime ?? getStartTime(1);
  const endTime = input.endTime;

  const issues: BottleneckIssue[] = [];

  // Fetch method breakdown - sorted by response time
  let methodBreakdown: BreakdownItem[] = [];
  try {
    const methodResult = await client.query<GetMethodBreakdownResult>({
      query: GET_METHOD_BREAKDOWN,
      variables: {
        startTime,
        endTime,
        limit: 20,
        sortField: 'RESPONSE_TIME',
      },
    });
    methodBreakdown = methodResult.data.meteorMethodBreakdown;
  } catch {
    // Method breakdown may not be available
  }

  // Fetch pub breakdown
  let pubBreakdown: BreakdownItem[] = [];
  try {
    const pubResult = await client.query<GetPubBreakdownResult>({
      query: GET_PUB_BREAKDOWN,
      variables: {
        startTime,
        endTime,
        limit: 20,
        sortField: 'RESPONSE_TIME',
      },
    });
    pubBreakdown = pubResult.data.meteorPubBreakdown;
  } catch {
    // Pub breakdown may not be available
  }

  // Analyze methods using the knowledge base advisor
  for (const method of methodBreakdown) {
    if (method.sortedValue > 1000) {
      const analysis = advisor.analyzeMethodMetrics({
        total: method.sortedValue,
      });

      const topRec = analysis.recommendations[0];
      issues.push({
        category: 'Slow Methods',
        severity: method.sortedValue > 5000 ? 'high' : 'medium',
        description: `Method "${method.name}" has high response time`,
        recommendation: topRec
          ? `${topRec.title}: ${topRec.description}`
          : 'Investigate this method for database queries, external HTTP calls, or heavy computation',
        documentationUrl: topRec?.docUrl ?? 'https://docs.montiapm.com/academy/make-your-app-faster',
        details: {
          method: method.name,
          avgResponseTime: formatResponseTime(method.sortedValue),
          throughput: method.throughput.toFixed(2) + ' req/min',
        },
      });
    }

    if (method.throughput > 1000 && method.sortedValue > 200) {
      issues.push({
        category: 'High Volume Methods',
        severity: 'medium',
        description: `Method "${method.name}" has high throughput with moderate response time`,
        recommendation:
          'Consider caching or rate limiting this method to reduce server load',
        documentationUrl: 'https://guide.meteor.com/performance-improvement',
        details: {
          method: method.name,
          avgResponseTime: formatResponseTime(method.sortedValue),
          throughput: method.throughput.toFixed(2) + ' req/min',
        },
      });
    }
  }

  // Analyze publications with redis-oplog recommendations
  for (const pub of pubBreakdown) {
    if (pub.sortedValue > 500) {
      const pubAnalysis = advisor.analyzePublicationMetrics({
        responseTime: pub.sortedValue,
      });

      const topRec = pubAnalysis.recommendations[0];
      issues.push({
        category: 'Slow Publications',
        severity: pub.sortedValue > 2000 ? 'high' : 'medium',
        description: `Publication "${pub.name}" has high initial load time`,
        recommendation: topRec
          ? `${topRec.title}: ${topRec.description}`
          : 'Optimize publication queries, add indexes, or reduce initial data sent',
        documentationUrl: topRec?.docUrl ?? 'https://docs.montiapm.com/academy/reducing-pubsub-data-usage',
        details: {
          publication: pub.name,
          avgResponseTime: formatResponseTime(pub.sortedValue),
          subRate: pub.throughput.toFixed(2) + ' sub/min',
        },
      });
    }
  }

  // Fetch and analyze system metrics if requested
  let systemAnalysis: Record<string, unknown> = {};

  if (input.includeSystemMetrics !== false) {
    try {
      const [ramResult, cpuResult] = await Promise.all([
        client.query<GetSystemMetricsResult>({
          query: GET_SYSTEM_METRICS,
          variables: { startTime, endTime, metric: 'RAM_USAGE', resolution: 'RES_1MIN' },
        }),
        client.query<GetSystemMetricsResult>({
          query: GET_SYSTEM_METRICS,
          variables: { startTime, endTime, metric: 'CPU_USAGE', resolution: 'RES_1MIN' },
        }),
      ]);

      const ramMetrics = ramResult.data.meteorSystemMetrics[0];
      const cpuMetrics = cpuResult.data.meteorSystemMetrics[0];

      if (ramMetrics) {
        systemAnalysis = {
          ...systemAnalysis,
          memory: {
            p50: formatBytes(ramMetrics.p50),
            p95: formatBytes(ramMetrics.p95),
            max: formatBytes(ramMetrics.max),
          },
        };

        // Check for memory issues
        if (ramMetrics.max > 1.5 * 1024 * 1024 * 1024) {
          // > 1.5GB
          issues.push({
            category: 'Memory Usage',
            severity: ramMetrics.max > 2 * 1024 * 1024 * 1024 ? 'high' : 'medium',
            description: 'High memory usage detected',
            recommendation:
              'Check for memory leaks, optimize observer usage, improve observer reuse with redis-oplog namespaces, or increase server capacity',
            documentationUrl: 'https://docs.montiapm.com/academy/optimize-memory-usage',
            details: {
              maxMemory: formatBytes(ramMetrics.max),
              p95Memory: formatBytes(ramMetrics.p95),
            },
          });
        }
      }

      if (cpuMetrics) {
        systemAnalysis = {
          ...systemAnalysis,
          cpu: {
            p50: formatPercentage(cpuMetrics.p50),
            p95: formatPercentage(cpuMetrics.p95),
            max: formatPercentage(cpuMetrics.max),
          },
        };

        if (cpuMetrics.p95 > 80) {
          issues.push({
            category: 'CPU Usage',
            severity: cpuMetrics.p95 > 95 ? 'high' : 'medium',
            description: 'High CPU usage detected',
            recommendation:
              'Record a CPU profile to identify hot paths, consider horizontal scaling or moving heavy tasks to workers',
            documentationUrl: 'https://docs.montiapm.com/record-cpu-profile',
            details: {
              p95CPU: formatPercentage(cpuMetrics.p95),
              maxCPU: formatPercentage(cpuMetrics.max),
            },
          });
        }
      }
    } catch {
      // System metrics may not be available
    }
  }

  // Sort issues by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Always include top redis-oplog recommendations for reactivity optimization
  const redisOplogRecommendations: DocumentedRecommendation[] =
    REDIS_OPLOG_RECOMMENDATIONS.slice(0, 3).map((rec) => ({
      title: rec.title,
      description: rec.description,
      actions: rec.actions,
      codeExample: rec.codeExample,
      documentationUrl: rec.docUrl,
    }));

  return {
    timeRange: {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime ?? Date.now()).toISOString(),
    },
    issuesFound: issues.length,
    issues,
    systemMetrics: input.includeSystemMetrics !== false ? systemAnalysis : undefined,
    redisOplogRecommendations,
    summary:
      issues.length === 0
        ? 'No significant performance bottlenecks detected'
        : `Found ${issues.length} potential bottleneck(s): ${issues.filter((i) => i.severity === 'high').length} high, ${issues.filter((i) => i.severity === 'medium').length} medium severity`,
  };
}
