import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { formatResponseTime, formatMetricsBreakdown } from '../utils/formatting.js';

export const getTraceDetailSchema = z.object({
  traceId: z.string().describe('The trace ID to retrieve details for'),
});

export type GetTraceDetailInput = z.input<typeof getTraceDetailSchema>;

const GET_TRACE_DETAIL = gql`
  query GetMethodTrace($traceId: String!) {
    meteorMethodTrace(traceId: $traceId) {
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
      events
      stacks
    }
  }
`;

interface TraceDetail {
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
  events: string;
}

interface GetTraceDetailResult {
  meteorMethodTrace: TraceDetail | null;
}

interface TraceEvent {
  type: string;
  name?: string;
  at: number;
  endAt?: number;
  value?: number;
  [key: string]: unknown;
}

export async function getTraceDetail(
  client: MontiGraphQLClient,
  input: GetTraceDetailInput,
) {
  const { data } = await client.query<GetTraceDetailResult>({
    query: GET_TRACE_DETAIL,
    variables: {
      traceId: input.traceId,
    },
  });

  if (!data.meteorMethodTrace) {
    return {
      error: `Trace with ID "${input.traceId}" not found`,
    };
  }

  const trace = data.meteorMethodTrace;

  // Parse events JSON
  let parsedEvents: TraceEvent[] = [];
  try {
    parsedEvents = JSON.parse(trace.events || '[]') as TraceEvent[];
  } catch {
    // Events may not be valid JSON
  }

  // Format events timeline
  const timeline = parsedEvents.map((event) => {
    const duration = event.endAt
      ? formatResponseTime(event.endAt - event.at)
      : 'N/A';

    return {
      type: event.type,
      name: event.name || event.type,
      startTime: new Date(event.at).toISOString(),
      duration,
      durationMs: event.endAt ? event.endAt - event.at : undefined,
    };
  });

  return {
    id: trace.id,
    method: trace.method,
    host: trace.host,
    time: new Date(trace.time).toISOString(),
    responseTime: formatResponseTime(trace.totalValue),
    responseTimeMs: trace.totalValue,
    breakdown: formatMetricsBreakdown(trace.metrics),
    metrics: trace.metrics,
    timeline,
    rawEvents: parsedEvents,
  };
}
