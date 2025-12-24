import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatResponseTime, formatMetricsBreakdown } from '../utils/formatting.js';

export const getMethodTracesSchema = z.object({
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  limit: z.number().max(1000).optional().default(100).describe('Maximum number of traces to return. Default: 100, Max: 1000'),
  minResponseTime: z.number().optional().describe('Minimum response time in milliseconds to filter slow methods'),
  methodName: z.string().optional().describe('Filter by specific method name'),
});

export type GetMethodTracesInput = z.input<typeof getMethodTracesSchema>;

const GET_METHOD_TRACES = gql`
  query GetMethodTraces(
    $startTime: Float
    $endTime: Float
    $limit: Float
    $minValue: Float
    $method: String
    $sortOrder: SortOrderEnum
  ) {
    meteorMethodTraces(
      startTime: $startTime
      endTime: $endTime
      limit: $limit
      minValue: $minValue
      method: $method
      sortOrder: $sortOrder
    ) {
      id
      method
      host
      time
      type
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

interface MethodTrace {
  id: string;
  method: string;
  host: string;
  time: number;
  type: string;
  totalValue: number;
  metrics: {
    total: number;
    wait: number;
    db: number;
    compute: number;
    http: number;
    email: number;
    async: number;
  };
}

interface GetMethodTracesResult {
  meteorMethodTraces: MethodTrace[];
}

export async function getMethodTraces(
  client: MontiGraphQLClient,
  input: GetMethodTracesInput,
) {
  const { data } = await client.query<GetMethodTracesResult>({
    query: GET_METHOD_TRACES,
    variables: {
      startTime: input.startTime ?? getStartTime(1),
      endTime: input.endTime,
      limit: input.limit ?? 100,
      minValue: input.minResponseTime,
      method: input.methodName,
    },
  });

  const traces = data.meteorMethodTraces.map((trace) => ({
    id: trace.id,
    method: trace.method,
    host: trace.host,
    time: new Date(trace.time).toISOString(),
    responseTime: formatResponseTime(trace.totalValue),
    responseTimeMs: trace.totalValue,
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
      methods: [...new Set(traces.map((t) => t.method))],
    },
  };
}
