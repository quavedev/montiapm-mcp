import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatResponseTime, formatMetricsBreakdown } from '../utils/formatting.js';

export const getSubscriptionTracesSchema = z.object({
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  limit: z.number().max(1000).optional().default(100).describe('Maximum number of traces to return. Default: 100, Max: 1000'),
  minResponseTime: z.number().optional().describe('Minimum response time in milliseconds'),
  publication: z.string().optional().describe('Filter by specific publication name'),
});

export type GetSubscriptionTracesInput = z.input<typeof getSubscriptionTracesSchema>;

const GET_SUBSCRIPTION_TRACES = gql`
  query GetPubTraces(
    $startTime: Float
    $endTime: Float
    $limit: Float
    $minValue: Float
    $publication: String
    $sortOrder: SortOrderEnum
  ) {
    meteorPubTraces(
      startTime: $startTime
      endTime: $endTime
      limit: $limit
      minValue: $minValue
      publication: $publication
      sortOrder: $sortOrder
    ) {
      id
      publication
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

interface SubscriptionTrace {
  id: string;
  publication: string;
  host: string;
  time: number;
  type: string;
  totalValue: number;
  metrics: {
    total: number;
    wait: number;
    db: number;
    compute: number;
  };
}

interface GetSubscriptionTracesResult {
  meteorPubTraces: SubscriptionTrace[];
}

export async function getSubscriptionTraces(
  client: MontiGraphQLClient,
  input: GetSubscriptionTracesInput,
) {
  const { data } = await client.query<GetSubscriptionTracesResult>({
    query: GET_SUBSCRIPTION_TRACES,
    variables: {
      startTime: input.startTime ?? getStartTime(1),
      endTime: input.endTime,
      limit: input.limit ?? 100,
      minValue: input.minResponseTime,
      publication: input.publication,
    },
  });

  const traces = data.meteorPubTraces.map((trace) => ({
    id: trace.id,
    publication: trace.publication,
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
      publications: [...new Set(traces.map((t) => t.publication))],
    },
  };
}
