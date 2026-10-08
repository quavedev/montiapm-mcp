import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatBytes, formatResponseTime } from '../utils/formatting.js';
import { SortOrder } from '../utils/constants.js';

/**
 * Breakdown tools rank every route, method, or publication by one field.
 * They use the aggregated breakdown queries behind the Monti dashboard
 * tables, so they return data even when no individual traces were sampled.
 */

export const HttpBreakdownSortEnum = z.enum([
  'IMPACT',
  'THROUGHPUT',
  'RES_TIME',
  'DB',
  'EMAIL',
  'ASYNC',
  'FS',
  'COMPUTE',
  'HTTP_TIME',
  '_1xx',
  '_2xx',
  '_3xx',
  '_4xx',
  '_5xx',
]);

export const MethodBreakdownSortEnum = z.enum([
  'THROUGHPUT',
  'RESPONSE_TIME',
  'WAIT_TIME',
  'WAITED_ON',
  'DB_TIME',
  'HTTP_TIME',
  'EMAIL_TIME',
  'ASYNC_TIME',
  'COMPUTE_TIME',
  'SENT_MSG_SIZE',
  'FETCHED_DOC_SIZE',
]);

export const PubBreakdownSortEnum = z.enum([
  'SUB_RATE',
  'UNSUB_RATE',
  'WAITED_ON',
  'RESPONSE_TIME',
  'OBSERVER_REUSE_RATIO',
  'LIFE_TIME',
  'ACTIVE_SUBS',
  'CREATED_OBSERVERS',
  'DELETED_OBSERVERS',
  'CACHED_OBSERVERS',
  'TOTAL_OBSERVER_HANDLERS',
  'TOTAL_OBSERVER_CHANGES',
  'TOTAL_LIVE_UPDATES',
  'OPLOG_NOTIFICATIONS',
  'UPDATE_RATIO',
  'FETCHED_DOCUMENTS',
  'INITIALLY_ADDED_DOCUMENTS',
  'LIVE_ADDED_DOCUMENTS',
  'LIVE_CHANGED_DOCUMENTS',
  'LIVE_REMOVED_DOCUMENTS',
  'INITIALLY_SENT_MSG_SIZE',
  'LIVE_SENT_MSG_SIZE',
  'POLLED_DOC_SIZE',
  'FETCHED_DOC_SIZE',
  'INITIALLY_FETCHED_DOC_SIZE',
  'LIVE_FETCHED_DOC_SIZE',
]);

const baseShape = {
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  limit: z.number().min(1).max(200).optional().default(20).describe('Maximum number of rows. Default: 20, Max: 200'),
  sortOrder: z.enum(['DSC', 'ASC']).optional().default('DSC').describe('DSC (largest first, default) or ASC'),
  host: z.string().optional().describe('Filter by server host'),
};

export const getHttpBreakdownSchema = z.object({
  ...baseShape,
  sortField: HttpBreakdownSortEnum.optional().default('IMPACT').describe(
    'Field to rank routes by. IMPACT = total time spent (ms) in the window, the best default to find what costs the most. RES_TIME/DB/COMPUTE/ASYNC/HTTP_TIME/EMAIL/FS = average ms per request. THROUGHPUT = requests/min. _1xx.._5xx = responses by status class.',
  ),
});

export const getMethodBreakdownSchema = z.object({
  ...baseShape,
  sortField: MethodBreakdownSortEnum.optional().default('RESPONSE_TIME').describe(
    'Field to rank methods by. *_TIME, RESPONSE_TIME and WAITED_ON = average ms per call. THROUGHPUT = calls/min. *_SIZE = bytes.',
  ),
});

export const getPubBreakdownSchema = z.object({
  ...baseShape,
  sortField: PubBreakdownSortEnum.optional().default('RESPONSE_TIME').describe(
    'Field to rank publications by. RESPONSE_TIME and WAITED_ON = average ms until ready. SUB_RATE/UNSUB_RATE = per min. OBSERVER_REUSE_RATIO = %. *_SIZE = bytes. Others are counts.',
  ),
});

export type GetHttpBreakdownInput = z.input<typeof getHttpBreakdownSchema>;
export type GetMethodBreakdownInput = z.input<typeof getMethodBreakdownSchema>;
export type GetPubBreakdownInput = z.input<typeof getPubBreakdownSchema>;

type Kind = 'http' | 'method' | 'pub';

const QUERIES: Record<Kind, { field: string; query: ReturnType<typeof gql> }> = {
  http: {
    field: 'httpBreakdown',
    query: gql`
      query GetHttpBreakdown(
        $startTime: Float
        $endTime: Float
        $limit: Float
        $host: String
        $sortOrder: SortOrderEnum
        $sortField: HttpBreakdownSortEnum
      ) {
        httpBreakdown(
          startTime: $startTime
          endTime: $endTime
          limit: $limit
          host: $host
          sortOrder: $sortOrder
          sortField: $sortField
        ) {
          name
          sortedValue
          throughput
        }
      }
    `,
  },
  method: {
    field: 'meteorMethodBreakdown',
    query: gql`
      query GetMethodBreakdownRanking(
        $startTime: Float
        $endTime: Float
        $limit: Float
        $host: String
        $sortOrder: SortOrderEnum
        $sortField: MeteorMethodBreakdownSortEnum
      ) {
        meteorMethodBreakdown(
          startTime: $startTime
          endTime: $endTime
          limit: $limit
          host: $host
          sortOrder: $sortOrder
          sortField: $sortField
        ) {
          name
          sortedValue
          throughput
        }
      }
    `,
  },
  pub: {
    field: 'meteorPubBreakdown',
    query: gql`
      query GetPubBreakdownRanking(
        $startTime: Float
        $endTime: Float
        $limit: Float
        $host: String
        $sortOrder: SortOrderEnum
        $sortField: MeteorPubBreakdownSortEnum
      ) {
        meteorPubBreakdown(
          startTime: $startTime
          endTime: $endTime
          limit: $limit
          host: $host
          sortOrder: $sortOrder
          sortField: $sortField
        ) {
          name
          sortedValue
          throughput
        }
      }
    `,
  },
};

interface BreakdownItem {
  name: string;
  sortedValue: number | null;
  throughput: number | null;
}

type Unit = 'totalMs' | 'avgMs' | 'perMin' | 'bytes' | 'percent' | 'count';

/** Unit of `sortedValue` for a sort field. */
export function getBreakdownUnit(kind: Kind, sortField: string): Unit {
  if (kind === 'http' && sortField === 'IMPACT') return 'totalMs';
  if (sortField === 'THROUGHPUT' || sortField === 'SUB_RATE' || sortField === 'UNSUB_RATE') return 'perMin';
  if (sortField.endsWith('_SIZE')) return 'bytes';
  if (sortField === 'OBSERVER_REUSE_RATIO' || sortField === 'UPDATE_RATIO') return 'percent';
  if (
    sortField.endsWith('_TIME') ||
    sortField === 'RESPONSE_TIME' ||
    sortField === 'WAITED_ON' ||
    sortField === 'LIFE_TIME' ||
    (kind === 'http' && ['RES_TIME', 'DB', 'EMAIL', 'ASYNC', 'FS', 'COMPUTE'].includes(sortField))
  ) {
    return 'avgMs';
  }
  return 'count';
}

function formatValue(unit: Unit, value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  switch (unit) {
    case 'totalMs':
    case 'avgMs':
      return formatResponseTime(value);
    case 'perMin':
      return `${value.toFixed(2)}/min`;
    case 'bytes':
      return formatBytes(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    default:
      return String(Math.round(value * 100) / 100);
  }
}

async function getBreakdown(
  client: MontiGraphQLClient,
  kind: Kind,
  input: {
    startTime?: number;
    endTime?: number;
    limit?: number;
    sortOrder?: 'DSC' | 'ASC';
    sortField: string;
    host?: string;
  },
) {
  const startTime = input.startTime ?? getStartTime(1);
  const endTime = input.endTime ?? Date.now();
  const { field, query } = QUERIES[kind];
  const { data } = await client.query<Record<string, BreakdownItem[]>>({
    query,
    variables: {
      startTime,
      endTime,
      limit: input.limit ?? 20,
      host: input.host,
      sortOrder: input.sortOrder ?? SortOrder.DSC,
      sortField: input.sortField,
    },
  });

  const unit = getBreakdownUnit(kind, input.sortField);
  const windowMinutes = (endTime - startTime) / 60000;
  const rows = (data[field] ?? []).map((item) => ({
    name: item.name,
    value: item.sortedValue,
    formattedValue: formatValue(unit, item.sortedValue),
    throughputPerMin: item.throughput,
    // For per-request averages, avg × throughput × window is the total time
    // the item cost, which is what to optimize first.
    ...(unit === 'avgMs' && item.sortedValue !== null && item.throughput !== null
      ? {
          estimatedTotalTime: formatResponseTime(item.sortedValue * item.throughput * windowMinutes),
          estimatedTotalTimeMs: Math.round(item.sortedValue * item.throughput * windowMinutes),
        }
      : {}),
  }));

  return {
    sortField: input.sortField,
    unit,
    timeRange: { start: new Date(startTime).toISOString(), end: new Date(endTime).toISOString() },
    count: rows.length,
    rows,
  };
}

export async function getHttpBreakdown(client: MontiGraphQLClient, input: GetHttpBreakdownInput) {
  const parsed = getHttpBreakdownSchema.parse(input);
  return getBreakdown(client, 'http', parsed);
}

export async function getMethodBreakdown(client: MontiGraphQLClient, input: GetMethodBreakdownInput) {
  const parsed = getMethodBreakdownSchema.parse(input);
  return getBreakdown(client, 'method', parsed);
}

export async function getPubBreakdown(client: MontiGraphQLClient, input: GetPubBreakdownInput) {
  const parsed = getPubBreakdownSchema.parse(input);
  return getBreakdown(client, 'pub', parsed);
}
