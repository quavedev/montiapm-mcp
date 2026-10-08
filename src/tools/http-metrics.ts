import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';

export const HttpMetricEnum = z.enum(['RESPONSE_TIME', 'THROUGHPUT', '_1xx', '_2xx', '_3xx', '_4xx', '_5xx']);

const RESOLUTION_MS = {
  RES_1MIN: 60_000,
  RES_30MIN: 30 * 60_000,
  RES_3HOUR: 3 * 60 * 60_000,
} as const;

export const getHttpMetricsSchema = z.object({
  metric: HttpMetricEnum.optional().default('RESPONSE_TIME').describe(
    'RESPONSE_TIME = average ms per request in each bucket, THROUGHPUT = requests/min, _1xx.._5xx = responses by status class',
  ),
  route: z.string().optional().describe(
    'Route as named by Monti, e.g. "POST-/api/v1/users" (method-prefixed; get names from get_http_breakdown). Omit for all routes.',
  ),
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  resolution: z.enum(['RES_1MIN', 'RES_30MIN', 'RES_3HOUR']).optional().default('RES_30MIN').describe('Bucket size. Default: RES_30MIN'),
  groupByHost: z.boolean().optional().default(false).describe('Return one series per server host'),
  host: z.string().optional().describe('Filter by server host'),
});

export type GetHttpMetricsInput = z.input<typeof getHttpMetricsSchema>;

const GET_HTTP_METRICS = gql`
  query GetHttpMetrics(
    $startTime: Float
    $endTime: Float
    $metric: HttpMetricsEnum!
    $resolution: MeteorMetricResolution
    $route: String
    $host: String
    $groupByHost: Boolean
  ) {
    httpMetrics(
      startTime: $startTime
      endTime: $endTime
      metric: $metric
      resolution: $resolution
      route: $route
      host: $host
      groupByHost: $groupByHost
    ) {
      host
      p50: percentile(value: 50)
      p95: percentile(value: 95)
      max: percentile(value: 100)
      points
    }
  }
`;

interface HttpMetricSeries {
  host: string | null;
  p50: number | null;
  p95: number | null;
  max: number | null;
  points: (number | null)[];
}

const round = (value: number | null) => (value === null || value === undefined ? null : Math.round(value * 100) / 100);

/**
 * Time series for one HTTP route (or all routes). `p50/p95/max` summarize the
 * bucket values, so for RESPONSE_TIME they describe how the per-bucket average
 * moved over the window, not per-request percentiles.
 */
export async function getHttpMetrics(client: MontiGraphQLClient, input: GetHttpMetricsInput) {
  const parsed = getHttpMetricsSchema.parse(input);
  const startTime = parsed.startTime ?? getStartTime(1);
  const endTime = parsed.endTime ?? Date.now();
  const { data } = await client.query<{ httpMetrics: HttpMetricSeries[] }>({
    query: GET_HTTP_METRICS,
    variables: {
      startTime,
      endTime,
      metric: parsed.metric,
      resolution: parsed.resolution,
      route: parsed.route,
      host: parsed.host,
      groupByHost: parsed.groupByHost,
    },
  });

  const step = RESOLUTION_MS[parsed.resolution];
  const series = (data.httpMetrics ?? []).map((s) => ({
    host: s.host ?? 'all',
    bucketValues: { p50: round(s.p50), p95: round(s.p95), max: round(s.max) },
    points: (s.points ?? []).map((value, index) => ({
      time: new Date(startTime + index * step).toISOString(),
      value: round(value),
    })),
  }));

  return {
    metric: parsed.metric,
    route: parsed.route ?? 'all routes',
    resolution: parsed.resolution,
    unit: parsed.metric === 'RESPONSE_TIME' ? 'avg ms per request' : parsed.metric === 'THROUGHPUT' ? 'requests/min' : 'responses',
    timeRange: { start: new Date(startTime).toISOString(), end: new Date(endTime).toISOString() },
    series,
  };
}
