import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { SortOrder } from '../utils/constants.js';

export const getErrorTracesSchema = z.object({
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  limit: z.number().max(1000).optional().default(5).describe('Maximum number of traces to return. Default: 5, Max: 1000'),
  host: z.string().optional().describe('Filter by server host'),
  message: z.string().optional().describe('Filter to errors with the exact name'),
  type: z.enum(['METHOD', 'SUBSCRIPTION', 'CLIENT']).optional().describe('Filter errors by type'),
  status: z.enum(['NEW', 'IGNORED', 'FIXED']).optional().describe('Filter errors by their status'),
  sortOrder: z.enum(['ASC', 'DSC']).optional().default('DSC').describe('Direction to sort results. Default: DSC'),
  sortField: z.enum(['START_TIME', 'TOTAL_VALUE']).optional().default('START_TIME').describe('Trace property to use for sorting. Default: START_TIME'),
});

export type GetErrorTracesInput = z.input<typeof getErrorTracesSchema>;

const GET_ERROR_TRACES = gql`
  query GetErrorTraces(
    $startTime: Float
    $endTime: Float
    $limit: Float
    $message: String
    $type: MeteorErrorTypeEnum
    $status: MeteorErrorStatusEnum
    $sortOrder: SortOrderEnum
    $sortField: TraceSortEnum
  ) {
    meteorErrorTraces(
      startTime: $startTime
      endTime: $endTime
      limit: $limit
      message: $message
      type: $type
      status: $status
      sortOrder: $sortOrder
      sortField: $sortField
    ) {
      id
      type
      message
      stacks
      time
      host
      subType
    }
  }
`;

interface ErrorTrace {
  id: string;
  type: string;
  message: string;
  stacks: string | null;
  time: number;
  host: string;
  subType: string | null;
}

interface GetErrorTracesResult {
  meteorErrorTraces: ErrorTrace[];
}

function parseStacks(stacks: string | null): unknown[] {
  if (!stacks) return [];
  try {
    return JSON.parse(stacks) as unknown[];
  } catch {
    return [];
  }
}

export async function getErrorTraces(
  client: MontiGraphQLClient,
  input: GetErrorTracesInput,
) {
  const { data } = await client.query<GetErrorTracesResult>({
    query: GET_ERROR_TRACES,
    variables: {
      startTime: input.startTime ?? getStartTime(1),
      endTime: input.endTime,
      limit: input.limit ?? 5,
      message: input.message,
      type: input.type,
      status: input.status,
      sortOrder: input.sortOrder ?? SortOrder.DSC,
      sortField: input.sortField ?? 'START_TIME',
    },
  });

  const traces = data.meteorErrorTraces.map((trace) => ({
    id: trace.id,
    type: trace.type,
    subType: trace.subType,
    message: trace.message,
    host: trace.host,
    time: new Date(trace.time).toISOString(),
    stacks: parseStacks(trace.stacks),
  }));

  const typeCounts: Record<string, number> = {};
  for (const trace of traces) {
    const t = trace.type ?? 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  return {
    count: traces.length,
    traces,
    summary: {
      uniqueMessages: [...new Set(traces.map((t) => t.message))],
      typeCounts,
    },
  };
}
