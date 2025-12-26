import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatResponseTime, formatBytes, formatPercentage } from '../utils/formatting.js';
import { REDIS_OPLOG_RECOMMENDATIONS } from '../knowledge/recommendations/index.js';

export const getHealthSummarySchema = z.object({
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
});

export type GetHealthSummaryInput = z.input<typeof getHealthSummarySchema>;

const GET_METHOD_BREAKDOWN = gql`
  query GetMethodBreakdownSummary(
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

const GET_ERROR_METRICS = gql`
  query GetErrorMetricsSummary(
    $metric: MeteorErrorMetricsEnum!
    $startTime: Float
    $endTime: Float
    $resolution: MeteorMetricResolution
  ) {
    meteorErrorMetrics(
      metric: $metric
      startTime: $startTime
      endTime: $endTime
      resolution: $resolution
    ) {
      points
    }
  }
`;

const GET_SYSTEM_SUMMARY = gql`
  query GetSystemSummary(
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

interface ErrorMetric {
  points: number[];
}

interface SystemMetric {
  p50: number;
  p95: number;
  max: number;
}

interface GetMethodBreakdownResult {
  meteorMethodBreakdown: BreakdownItem[];
}

interface GetErrorMetricsResult {
  meteorErrorMetrics: ErrorMetric[];
}

interface GetSystemSummaryResult {
  meteorSystemMetrics: SystemMetric[];
}

function getHealthScore(
  avgResponseTime: number,
  errorCount: number,
  cpuP95: number,
  memoryP95: number,
): { score: number; status: string; color: string } {
  let score = 100;

  // Deduct for slow response time
  if (avgResponseTime > 500) score -= 20;
  else if (avgResponseTime > 200) score -= 10;

  // Deduct for errors
  if (errorCount > 100) score -= 30;
  else if (errorCount > 10) score -= 15;
  else if (errorCount > 0) score -= 5;

  // Deduct for high CPU
  if (cpuP95 > 90) score -= 20;
  else if (cpuP95 > 70) score -= 10;

  // Deduct for high memory
  const memoryGB = memoryP95 / (1024 * 1024 * 1024);
  if (memoryGB > 2) score -= 20;
  else if (memoryGB > 1) score -= 10;

  score = Math.max(0, Math.min(100, score));

  let status: string;
  let color: string;

  if (score >= 90) {
    status = 'Healthy';
    color = 'green';
  } else if (score >= 70) {
    status = 'Good';
    color = 'yellow';
  } else if (score >= 50) {
    status = 'Degraded';
    color = 'orange';
  } else {
    status = 'Critical';
    color = 'red';
  }

  return { score, status, color };
}

export async function getHealthSummary(
  client: MontiGraphQLClient,
  input: GetHealthSummaryInput,
) {
  const startTime = input.startTime ?? getStartTime(1);
  const endTime = input.endTime;

  // Fetch all metrics in parallel
  const [methodResult, errorResult, ramResult, cpuResult, sessionResult] =
    await Promise.allSettled([
      client.query<GetMethodBreakdownResult>({
        query: GET_METHOD_BREAKDOWN,
        variables: { startTime, endTime, limit: 100, sortField: 'RESPONSE_TIME' },
      }),
      client.query<GetErrorMetricsResult>({
        query: GET_ERROR_METRICS,
        variables: { metric: 'ERROR_COUNT', startTime, endTime, resolution: 'RES_1MIN' },
      }),
      client.query<GetSystemSummaryResult>({
        query: GET_SYSTEM_SUMMARY,
        variables: { startTime, endTime, metric: 'RAM_USAGE', resolution: 'RES_1MIN' },
      }),
      client.query<GetSystemSummaryResult>({
        query: GET_SYSTEM_SUMMARY,
        variables: { startTime, endTime, metric: 'CPU_USAGE', resolution: 'RES_1MIN' },
      }),
      client.query<GetSystemSummaryResult>({
        query: GET_SYSTEM_SUMMARY,
        variables: { startTime, endTime, metric: 'SESSIONS', resolution: 'RES_1MIN' },
      }),
    ]);

  // Process method metrics
  let methodSummary = {
    totalMethods: 0,
    avgResponseTime: 0,
    totalThroughput: 0,
    slowestMethod: 'N/A',
    slowestMethodTime: 0,
  };

  if (methodResult.status === 'fulfilled') {
    const methods = methodResult.value.data.meteorMethodBreakdown;
    if (methods.length > 0) {
      const totalResponseTime = methods.reduce(
        (sum, m) => sum + m.sortedValue * m.throughput,
        0,
      );
      const totalThroughput = methods.reduce((sum, m) => sum + m.throughput, 0);
      const avgResponseTime =
        totalThroughput > 0 ? totalResponseTime / totalThroughput : 0;

      const slowest = methods.reduce(
        (prev, curr) => (curr.sortedValue > prev.sortedValue ? curr : prev),
        methods[0],
      );

      methodSummary = {
        totalMethods: methods.length,
        avgResponseTime,
        totalThroughput,
        slowestMethod: slowest.name,
        slowestMethodTime: slowest.sortedValue,
      };
    }
  }

  // Process error metrics - calculate total from points
  let errorCount = 0;
  if (errorResult.status === 'fulfilled') {
    const errorMetrics = errorResult.value.data.meteorErrorMetrics[0];
    if (errorMetrics?.points) {
      errorCount = errorMetrics.points.reduce((sum, count) => sum + (count || 0), 0);
    }
  }

  // Process system metrics
  let ramMetrics: SystemMetric | null = null;
  let cpuMetrics: SystemMetric | null = null;
  let sessionMetrics: SystemMetric | null = null;

  if (ramResult.status === 'fulfilled') {
    ramMetrics = ramResult.value.data.meteorSystemMetrics[0] ?? null;
  }
  if (cpuResult.status === 'fulfilled') {
    cpuMetrics = cpuResult.value.data.meteorSystemMetrics[0] ?? null;
  }
  if (sessionResult.status === 'fulfilled') {
    sessionMetrics = sessionResult.value.data.meteorSystemMetrics[0] ?? null;
  }

  // Calculate health score
  const health = getHealthScore(
    methodSummary.avgResponseTime,
    errorCount,
    cpuMetrics?.p95 ?? 0,
    ramMetrics?.p95 ?? 0,
  );

  return {
    timeRange: {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime ?? Date.now()).toISOString(),
    },
    health: {
      score: health.score,
      status: health.status,
      color: health.color,
    },
    methods: {
      count: methodSummary.totalMethods,
      avgResponseTime: formatResponseTime(methodSummary.avgResponseTime),
      throughput: methodSummary.totalThroughput.toFixed(2) + ' req/min',
      slowestMethod: methodSummary.slowestMethod,
      slowestMethodTime: formatResponseTime(methodSummary.slowestMethodTime),
    },
    errors: {
      count: errorCount,
      status: errorCount === 0 ? 'No errors' : errorCount < 10 ? 'Low' : 'High',
    },
    system: {
      memory: ramMetrics
        ? {
            p50: formatBytes(ramMetrics.p50),
            p95: formatBytes(ramMetrics.p95),
            max: formatBytes(ramMetrics.max),
          }
        : null,
      cpu: cpuMetrics
        ? {
            p50: formatPercentage(cpuMetrics.p50),
            p95: formatPercentage(cpuMetrics.p95),
            max: formatPercentage(cpuMetrics.max),
          }
        : null,
      sessions: sessionMetrics
        ? {
            p50: Math.round(sessionMetrics.p50),
            p95: Math.round(sessionMetrics.p95),
            max: Math.round(sessionMetrics.max),
          }
        : null,
    },
    insights: generateInsights(methodSummary, errorCount, cpuMetrics, ramMetrics),
    recommendations: generateRecommendations(methodSummary, errorCount, cpuMetrics, ramMetrics),
    documentationLinks: {
      performance: 'https://docs.montiapm.com/academy/make-your-app-faster',
      memory: 'https://docs.montiapm.com/academy/optimize-memory-usage',
      observers: 'https://docs.montiapm.com/academy/improving-cpu-network-usage',
      redisOplog: 'https://github.com/cult-of-coders/redis-oplog/blob/master/docs/finetuning.md',
    },
  };
}

interface Recommendation {
  title: string;
  description: string;
  documentationUrl: string;
}

function generateRecommendations(
  methodSummary: {
    avgResponseTime: number;
    totalMethods: number;
    slowestMethod: string;
    slowestMethodTime: number;
  },
  _errorCount: number,
  cpuMetrics: SystemMetric | null,
  ramMetrics: SystemMetric | null,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (methodSummary.avgResponseTime > 500) {
    recommendations.push({
      title: 'Optimize slow methods',
      description: 'Use the analyze_slow_methods tool to identify bottlenecks in your methods',
      documentationUrl: 'https://docs.montiapm.com/academy/make-your-app-faster',
    });
  }

  if (ramMetrics && ramMetrics.p95 > 1.5 * 1024 * 1024 * 1024) {
    recommendations.push({
      title: 'Improve observer reuse',
      description: 'High memory usage can be reduced by improving observer reuse with redis-oplog namespaces',
      documentationUrl: 'https://docs.montiapm.com/academy/optimize-memory-usage',
    });
  }

  if (cpuMetrics && cpuMetrics.p95 > 80) {
    recommendations.push({
      title: 'Record CPU profile',
      description: 'Identify CPU-intensive operations by recording and analyzing a CPU profile',
      documentationUrl: 'https://docs.montiapm.com/record-cpu-profile',
    });
  }

  // Always include top redis-oplog recommendation
  const topRedisOplog = REDIS_OPLOG_RECOMMENDATIONS[0];
  if (topRedisOplog) {
    recommendations.push({
      title: topRedisOplog.title,
      description: topRedisOplog.description,
      documentationUrl: topRedisOplog.docUrl,
    });
  }

  return recommendations;
}

function generateInsights(
  methodSummary: {
    avgResponseTime: number;
    totalMethods: number;
    slowestMethod: string;
    slowestMethodTime: number;
  },
  errorCount: number,
  cpuMetrics: SystemMetric | null,
  ramMetrics: SystemMetric | null,
): string[] {
  const insights: string[] = [];

  if (methodSummary.avgResponseTime > 500) {
    insights.push(
      `Average response time (${formatResponseTime(methodSummary.avgResponseTime)}) is above recommended threshold of 500ms`,
    );
  } else if (methodSummary.avgResponseTime < 100) {
    insights.push(
      `Excellent response times with average of ${formatResponseTime(methodSummary.avgResponseTime)}`,
    );
  }

  if (methodSummary.slowestMethodTime > 1000) {
    insights.push(
      `Method "${methodSummary.slowestMethod}" needs attention with ${formatResponseTime(methodSummary.slowestMethodTime)} response time`,
    );
  }

  if (errorCount > 0) {
    insights.push(
      `${errorCount} error(s) detected in the time range. Review error logs for details.`,
    );
  }

  if (cpuMetrics && cpuMetrics.p95 > 80) {
    insights.push(
      `CPU usage is high (p95: ${formatPercentage(cpuMetrics.p95)}). Consider scaling or optimizing compute-heavy operations.`,
    );
  }

  if (ramMetrics && ramMetrics.p95 > 1.5 * 1024 * 1024 * 1024) {
    insights.push(
      `Memory usage is elevated (p95: ${formatBytes(ramMetrics.p95)}). Check for memory leaks or consider increasing capacity.`,
    );
  }

  if (insights.length === 0) {
    insights.push('Application is performing well with no immediate concerns.');
  }

  return insights;
}
