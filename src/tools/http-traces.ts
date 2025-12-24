import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatResponseTime, formatMetricsBreakdown } from '../utils/formatting.js';
import { SortOrder } from '../utils/constants.js';

export const getHttpTracesSchema = z.object({
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  limit: z.number().max(1000).optional().default(100).describe('Maximum number of traces to return. Default: 100, Max: 1000'),
  minResponseTime: z.number().optional().describe('Minimum response time in milliseconds to filter slow requests'),
  route: z.string().optional().describe('Filter by specific HTTP route (e.g., "/api/users")'),
  host: z.string().optional().describe('Filter by server host'),
});

export type GetHttpTracesInput = z.input<typeof getHttpTracesSchema>;

const GET_HTTP_TRACES = gql`
  query GetHttpTraces(
    $startTime: Float
    $endTime: Float
    $limit: Float
    $minValue: Float
    $route: String
    $host: String
    $sortOrder: SortOrderEnum
  ) {
    httpTraces(
      startTime: $startTime
      endTime: $endTime
      limit: $limit
      minValue: $minValue
      route: $route
      host: $host
      sortOrder: $sortOrder
    ) {
      id
      route
      host
      time
      totalValue
      errored
      metrics {
        total
        wait
        waitedOn
        db
        compute
        http
        email
        async
        fs
      }
    }
  }
`;

interface HttpTrace {
  id: string;
  route: string;
  host: string;
  time: number;
  totalValue: number;
  errored: boolean;
  metrics: {
    total: number;
    wait: number;
    db: number;
    compute: number;
    http: number;
    email: number;
    async: number;
    fs: number;
  };
}

interface GetHttpTracesResult {
  httpTraces: HttpTrace[];
}

export async function getHttpTraces(
  client: MontiGraphQLClient,
  input: GetHttpTracesInput,
) {
  const { data } = await client.query<GetHttpTracesResult>({
    query: GET_HTTP_TRACES,
    variables: {
      startTime: input.startTime ?? getStartTime(1),
      endTime: input.endTime,
      limit: input.limit ?? 100,
      minValue: input.minResponseTime,
      route: input.route,
      host: input.host,
      sortOrder: SortOrder.DSC,
    },
  });

  const traces = data.httpTraces.map((trace) => ({
    id: trace.id,
    route: trace.route,
    host: trace.host,
    time: new Date(trace.time).toISOString(),
    responseTime: formatResponseTime(trace.totalValue),
    responseTimeMs: trace.totalValue,
    errored: trace.errored,
    breakdown: formatMetricsBreakdown(trace.metrics),
    metrics: trace.metrics,
  }));

  return {
    count: traces.length,
    traces,
    summary: {
      avgResponseTime: traces.length > 0
        ? formatResponseTime(
            traces.reduce((sum, t) => sum + t.responseTimeMs, 0) / traces.length,
          )
        : 'N/A',
      maxResponseTime: traces.length > 0
        ? formatResponseTime(Math.max(...traces.map((t) => t.responseTimeMs)))
        : 'N/A',
      routes: [...new Set(traces.map((t) => t.route))],
      errorCount: traces.filter((t) => t.errored).length,
    },
  };
}
