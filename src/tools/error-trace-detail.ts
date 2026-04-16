import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';

export const getErrorTraceDetailSchema = z.object({
  traceId: z.string().describe('The error trace ID to retrieve details for'),
});

export type GetErrorTraceDetailInput = z.input<typeof getErrorTraceDetailSchema>;

const GET_ERROR_TRACE = gql`
  query GetErrorTrace($traceId: String!) {
    meteorErrorTrace(traceId: $traceId) {
      id
      type
      message
      stacks
      time
      host
      subType
      info {
        browser
        userId
        resolution
        ip
        clientArch
        url
      }
    }
  }
`;

interface ErrorClientInfo {
  browser: string | null;
  userId: string | null;
  resolution: string | null;
  ip: string | null;
  clientArch: string | null;
  url: string | null;
}

interface ErrorTraceDetail {
  id: string;
  type: string;
  message: string;
  stacks: string | null;
  time: number;
  host: string;
  subType: string | null;
  info: ErrorClientInfo | null;
}

interface GetErrorTraceResult {
  meteorErrorTrace: ErrorTraceDetail | null;
}

function parseStacks(stacks: string | null): unknown[] {
  if (!stacks) return [];
  try {
    return JSON.parse(stacks) as unknown[];
  } catch {
    return [];
  }
}

export async function getErrorTraceDetail(
  client: MontiGraphQLClient,
  input: GetErrorTraceDetailInput,
) {
  const { data } = await client.query<GetErrorTraceResult>({
    query: GET_ERROR_TRACE,
    variables: {
      traceId: input.traceId,
    },
  });

  if (!data.meteorErrorTrace) {
    return {
      error: `Error trace with ID "${input.traceId}" not found`,
    };
  }

  const trace = data.meteorErrorTrace;

  return {
    id: trace.id,
    type: trace.type,
    subType: trace.subType,
    message: trace.message,
    host: trace.host,
    time: new Date(trace.time).toISOString(),
    stacks: parseStacks(trace.stacks),
    info: trace.info,
  };
}
