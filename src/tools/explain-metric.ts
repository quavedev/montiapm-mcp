/**
 * Explain Metric Tool
 *
 * Returns metric definitions and optimization tips from the knowledge base.
 */

import { z } from 'zod';
import { advisor } from '../knowledge/advisor.js';
import { getAllMetricNames } from '../knowledge/glossary.js';

export const explainMetricSchema = z.object({
  metric: z
    .string()
    .describe(
      'The metric name to explain (e.g., "observerReuse", "waitTime", "responseTime")',
    ),
});

export type ExplainMetricInput = z.input<typeof explainMetricSchema>;

export async function explainMetric(input: ExplainMetricInput) {
  const definition = advisor.explainMetric(input.metric);

  if (!definition) {
    // Try to find similar metrics
    const allMetrics = getAllMetricNames();
    const lowerInput = input.metric.toLowerCase();
    const suggestions = allMetrics.filter(
      (m) =>
        m.toLowerCase().includes(lowerInput) ||
        lowerInput.includes(m.toLowerCase()),
    );

    return {
      found: false,
      metric: input.metric,
      message: `Unknown metric: "${input.metric}".`,
      suggestions:
        suggestions.length > 0
          ? suggestions
          : allMetrics.slice(0, 10),
      availableMetrics: allMetrics,
    };
  }

  return {
    found: true,
    metric: input.metric,
    definition: {
      name: definition.name,
      description: definition.description,
      formula: definition.formula,
      interpretation: definition.interpretation,
      relatedMetrics: definition.relatedMetrics,
      optimizationTips: definition.optimizationTips,
      documentationUrl: definition.docUrl,
    },
  };
}

/**
 * List all available metrics.
 */
export const listMetricsSchema = z.object({
  search: z
    .string()
    .optional()
    .describe('Optional search term to filter metrics'),
});

export type ListMetricsInput = z.input<typeof listMetricsSchema>;

export async function listMetrics(input: ListMetricsInput) {
  if (input.search) {
    const results = advisor.searchMetrics(input.search);
    return {
      searchTerm: input.search,
      count: results.length,
      metrics: results.map((def) => ({
        name: def.name,
        description: def.description,
        documentationUrl: def.docUrl,
      })),
    };
  }

  const allMetrics = getAllMetricNames();
  return {
    count: allMetrics.length,
    metrics: allMetrics,
  };
}
