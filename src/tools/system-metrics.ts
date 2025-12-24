import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatBytes, formatPercentage } from '../utils/formatting.js';

export const MetricTypeEnum = z.enum([
  'CPU_USAGE',
  'TOTAL_SYSTEM_MEM',
  'FREE_SYSTEM_MEM',
  'USED_SYSTEM_MEM',
  'RAM_USAGE',
  'SESSIONS',
  'NEW_SESSIONS',
  'MONGO_POOL_CHECKOUT_DELAY',
  'MONGO_POOL_CHECKOUT_MAX_DELAY',
  'MONGO_POOL_PENDING_CHECKOUTS',
]);

export const ResolutionEnum = z.enum([
  'RES_1MIN',
  'RES_30MIN',
  'RES_3HOUR',
]);

export const getSystemMetricsSchema = z.object({
  metric: MetricTypeEnum.describe('Type of system metric to retrieve'),
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  resolution: ResolutionEnum.optional().default('RES_1MIN').describe('Data resolution. Default: RES_1MIN'),
  groupByHost: z.boolean().optional().default(false).describe('Group metrics by server host'),
});

export type GetSystemMetricsInput = z.input<typeof getSystemMetricsSchema>;

const GET_SYSTEM_METRICS = gql`
  query GetSystemMetrics(
    $metric: MeteorSystemMetricsEnum!
    $startTime: Float
    $endTime: Float
    $resolution: MeteorMetricResolution
    $groupByHost: Boolean
  ) {
    meteorSystemMetrics(
      metric: $metric
      startTime: $startTime
      endTime: $endTime
      resolution: $resolution
      groupByHost: $groupByHost
    ) {
      host
      points
      p50: percentile(value: 50)
      p95: percentile(value: 95)
      p99: percentile(value: 99)
      max: percentile(value: 100)
    }
  }
`;

interface SystemMetric {
  host: string | null;
  points: number[][];
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

interface GetSystemMetricsResult {
  meteorSystemMetrics: SystemMetric[];
}

function formatMetricValue(metric: string, value: number): string {
  switch (metric) {
    case 'RAM_USAGE':
      return formatBytes(value);
    case 'CPU_USAGE':
      return formatPercentage(value);
    case 'SESSIONS':
      return value.toString();
    case 'EVENT_LOOP_LAG':
      return `${value.toFixed(2)}ms`;
    case 'GC_MAJOR':
    case 'GC_MINOR':
      return `${value.toFixed(2)}ms`;
    default:
      return value.toString();
  }
}

export async function getSystemMetrics(
  client: MontiGraphQLClient,
  input: GetSystemMetricsInput,
) {
  const { data } = await client.query<GetSystemMetricsResult>({
    query: GET_SYSTEM_METRICS,
    variables: {
      metric: input.metric,
      startTime: input.startTime ?? getStartTime(1),
      endTime: input.endTime,
      resolution: input.resolution ?? 'RES_1MIN',
      groupByHost: input.groupByHost ?? false,
    },
  });

  const metrics = data.meteorSystemMetrics.map((metric) => ({
    host: metric.host || 'all',
    percentiles: {
      p50: formatMetricValue(input.metric, metric.p50),
      p95: formatMetricValue(input.metric, metric.p95),
      p99: formatMetricValue(input.metric, metric.p99),
      max: formatMetricValue(input.metric, metric.max),
    },
    rawPercentiles: {
      p50: metric.p50,
      p95: metric.p95,
      p99: metric.p99,
      max: metric.max,
    },
    dataPoints: metric.points.length,
  }));

  return {
    metric: input.metric,
    resolution: input.resolution ?? 'RES_1MIN',
    hosts: metrics,
    summary: {
      totalDataPoints: metrics.reduce((sum, m) => sum + m.dataPoints, 0),
      overallMax: formatMetricValue(
        input.metric,
        Math.max(...metrics.map((m) => m.rawPercentiles.max)),
      ),
    },
  };
}
