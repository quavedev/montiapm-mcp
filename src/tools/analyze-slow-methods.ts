import { z } from 'zod';
import { gql } from '@apollo/client/core';
import type { MontiGraphQLClient } from '../graphql/client.js';
import { getStartTime } from '../utils/date.js';
import { formatResponseTime, formatMetricsBreakdown } from '../utils/formatting.js';
import { SortOrder } from '../utils/constants.js';
import { advisor } from '../knowledge/advisor.js';

export const analyzeSlowMethodsSchema = z.object({
  threshold: z.number().optional().default(500).describe('Response time threshold in milliseconds. Default: 500ms'),
  startTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: 1 hour ago'),
  endTime: z.number().optional().describe('Unix timestamp in milliseconds. Default: now'),
  limit: z.number().max(100).optional().default(20).describe('Maximum number of methods to analyze. Default: 20'),
});

export type AnalyzeSlowMethodsInput = z.input<typeof analyzeSlowMethodsSchema>;

const GET_METHOD_TRACES = gql`
  query GetSlowMethodTraces(
    $startTime: Float
    $endTime: Float
    $limit: Float
    $minValue: Float
    $sortOrder: SortOrderEnum
  ) {
    meteorMethodTraces(
      startTime: $startTime
      endTime: $endTime
      limit: $limit
      minValue: $minValue
      sortOrder: $sortOrder
    ) {
      id
      method
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

interface MethodTrace {
  id: string;
  method: string;
  host: string;
  time: number;
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

interface MethodAnalysis {
  method: string;
  count: number;
  avgResponseTime: number;
  maxResponseTime: number;
  mainBottleneck: string;
  avgMetrics: {
    wait: number;
    db: number;
    compute: number;
    http: number;
    async: number;
  };
  recommendations: FormattedRecommendation[];
}

interface FormattedRecommendation {
  title: string;
  description: string;
  actions?: string[];
  codeExample?: string;
  documentationUrl: string;
}

function identifyBottleneck(metrics: MethodTrace['metrics']): string {
  const breakdown = {
    db: metrics.db,
    compute: metrics.compute,
    http: metrics.http,
    wait: metrics.wait,
    async: metrics.async,
    email: metrics.email,
  };

  const sorted = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) return 'unknown';

  const [topKey, topValue] = sorted[0];
  const total = metrics.total || 1;
  const percentage = ((topValue / total) * 100).toFixed(0);

  return `${topKey} (${percentage}%)`;
}

function getRecommendations(
  _method: string,
  avgMetrics: MethodAnalysis['avgMetrics'],
  avgTotal: number,
): FormattedRecommendation[] {
  // Use the knowledge base advisor for documentation-backed recommendations
  const analysis = advisor.analyzeMethodMetrics({
    total: avgTotal,
    db: avgMetrics.db,
    compute: avgMetrics.compute,
    http: avgMetrics.http,
    wait: avgMetrics.wait,
    async: avgMetrics.async,
  });

  if (analysis.recommendations.length === 0) {
    return [
      {
        title: 'Performance is balanced',
        description:
          'Method performance is balanced. Monitor for spikes and consider overall throughput optimization.',
        documentationUrl: 'https://docs.montiapm.com/academy/make-your-app-faster',
      },
    ];
  }

  // Format recommendations with documentation links
  return analysis.recommendations.slice(0, 5).map((rec) => ({
    title: rec.title,
    description: rec.description,
    actions: rec.actions,
    codeExample: rec.codeExample,
    documentationUrl: rec.docUrl,
  }));
}

export async function analyzeSlowMethods(
  client: MontiGraphQLClient,
  input: AnalyzeSlowMethodsInput,
) {
  const { data } = await client.query<GetMethodTracesResult>({
    query: GET_METHOD_TRACES,
    variables: {
      startTime: input.startTime ?? getStartTime(1),
      endTime: input.endTime,
      limit: input.limit ?? 20,
      minValue: input.threshold ?? 500,
      sortOrder: SortOrder.DSC,
    },
  });

  const traces = data.meteorMethodTraces;

  if (traces.length === 0) {
    return {
      message: `No methods found with response time >= ${input.threshold}ms in the specified time range`,
      threshold: formatResponseTime(input.threshold ?? 500),
      tracesAnalyzed: 0,
      methodsAnalyzed: 0,
      analysis: [],
    };
  }

  // Group traces by method name
  const methodGroups = new Map<string, MethodTrace[]>();
  for (const trace of traces) {
    const existing = methodGroups.get(trace.method) || [];
    existing.push(trace);
    methodGroups.set(trace.method, existing);
  }

  // Analyze each method group
  const analysis: MethodAnalysis[] = [];

  for (const [method, methodTraces] of methodGroups) {
    const avgMetrics = {
      wait: 0,
      db: 0,
      compute: 0,
      http: 0,
      async: 0,
    };

    let totalResponseTime = 0;
    let maxResponseTime = 0;

    for (const trace of methodTraces) {
      totalResponseTime += trace.totalValue;
      maxResponseTime = Math.max(maxResponseTime, trace.totalValue);

      avgMetrics.wait += trace.metrics.wait;
      avgMetrics.db += trace.metrics.db;
      avgMetrics.compute += trace.metrics.compute;
      avgMetrics.http += trace.metrics.http;
      avgMetrics.async += trace.metrics.async;
    }

    const count = methodTraces.length;
    avgMetrics.wait /= count;
    avgMetrics.db /= count;
    avgMetrics.compute /= count;
    avgMetrics.http /= count;
    avgMetrics.async /= count;

    const avgResponseTime = totalResponseTime / count;

    analysis.push({
      method,
      count,
      avgResponseTime,
      maxResponseTime,
      mainBottleneck: identifyBottleneck({
        total: avgResponseTime,
        ...avgMetrics,
        email: 0,
      }),
      avgMetrics,
      recommendations: getRecommendations(method, avgMetrics, avgResponseTime),
    });
  }

  // Sort by average response time descending
  analysis.sort((a, b) => b.avgResponseTime - a.avgResponseTime);

  return {
    threshold: formatResponseTime(input.threshold ?? 500),
    tracesAnalyzed: traces.length,
    methodsAnalyzed: analysis.length,
    analysis: analysis.map((a) => ({
      method: a.method,
      occurrences: a.count,
      avgResponseTime: formatResponseTime(a.avgResponseTime),
      maxResponseTime: formatResponseTime(a.maxResponseTime),
      mainBottleneck: a.mainBottleneck,
      breakdown: formatMetricsBreakdown({
        db: a.avgMetrics.db,
        compute: a.avgMetrics.compute,
        http: a.avgMetrics.http,
        wait: a.avgMetrics.wait,
        async: a.avgMetrics.async,
      }),
      recommendations: a.recommendations,
    })),
    overallInsights: [
      `Found ${traces.length} slow method calls across ${analysis.length} unique methods`,
      `Slowest method: ${analysis[0]?.method ?? 'N/A'} with avg ${formatResponseTime(analysis[0]?.avgResponseTime ?? 0)}`,
    ],
  };
}
