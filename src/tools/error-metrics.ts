import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { ResolutionEnum } from './system-metrics.js';

export const getErrorMetricsSchema = z.object({
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  resolution: ResolutionEnum.optional().default('RES_1MIN').describe('Data resolution. Default: RES_1MIN'),
});

export type GetErrorMetricsInput = z.input<typeof getErrorMetricsSchema>;

const GET_ERROR_METRICS = gql`
  query GetErrorMetrics(
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
      host
      points
      percentile(value: 95)
    }
  }
`;

interface ErrorMetric {
  host: string | null;
  points: number[];
  percentile: number;
}

interface GetErrorMetricsResult {
  meteorErrorMetrics: ErrorMetric[];
}

export async function getErrorMetrics(
  client: MontiGraphQLClient,
  input: GetErrorMetricsInput,
) {
  const { data } = await client.query<GetErrorMetricsResult>({
    query: GET_ERROR_METRICS,
    variables: {
      metric: 'ERROR_COUNT',
      startTime: input.startTime ?? getStartTime(1),
      endTime: input.endTime,
      resolution: input.resolution ?? 'RES_1MIN',
    },
  });

  const metrics = data.meteorErrorMetrics[0];

  if (!metrics) {
    return {
      totalErrors: 0,
      dataPoints: 0,
      resolution: input.resolution ?? 'RES_1MIN',
      message: 'No error metrics found for the specified time range',
    };
  }

  // Points is a simple array of error counts
  const points = metrics.points;
  const totalErrors = points.reduce((sum, count) => sum + (count || 0), 0);

  // Calculate error rate trend
  let trend = 'stable';
  if (points.length >= 2) {
    const firstHalf = points.slice(0, Math.floor(points.length / 2));
    const secondHalf = points.slice(Math.floor(points.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, count) => sum + (count || 0), 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, count) => sum + (count || 0), 0) / secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.2) {
      trend = 'increasing';
    } else if (secondHalfAvg < firstHalfAvg * 0.8) {
      trend = 'decreasing';
    }
  }

  return {
    totalErrors,
    dataPoints: points.length,
    resolution: input.resolution ?? 'RES_1MIN',
    trend,
    recentErrors: points.slice(-10).map((count, index) => ({
      index: points.length - 10 + index,
      count,
    })),
  };
}
