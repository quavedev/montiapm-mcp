/**
 * Optimization Advisor - Core logic for analyzing metrics
 * and providing documentation-backed recommendations.
 */

import type {
  MetricCategory,
  MetricContext,
  OptimizationAdvice,
  Recommendation,
  Severity,
  MetricDefinition,
} from './types.js';
import {
  evaluateThreshold,
  getThresholdsForCategory,
  severityOrder,
} from './thresholds.js';
import {
  getApplicableRecommendations,
  getRecommendationsByCategory,
  REDIS_OPLOG_RECOMMENDATIONS,
} from './recommendations/index.js';
import { getMetricDefinition, getAllMetricNames, searchMetrics } from './glossary.js';

/**
 * The main optimization advisor class.
 * Analyzes metrics and provides contextual recommendations.
 */
export class OptimizationAdvisor {
  /**
   * Analyze metrics and provide documentation-backed recommendations.
   *
   * @param context - The metric context to analyze
   * @returns Array of optimization advice sorted by severity
   */
  analyze(context: MetricContext): OptimizationAdvice[] {
    const advice: OptimizationAdvice[] = [];
    const seenRecommendations = new Set<string>();

    // Get thresholds for the category
    const categoryThresholds = getThresholdsForCategory(context.category);

    // Evaluate each threshold
    for (const threshold of categoryThresholds) {
      const value = context.metrics[threshold.metric];
      if (value === undefined) continue;

      const evaluation = evaluateThreshold(threshold.metric, value);

      // Only create advice for concerning severities
      if (evaluation.severity === 'info') continue;

      // Find applicable recommendations for this context
      const applicableRecs = this.findApplicableRecommendations(
        context.metrics,
        context.category,
        seenRecommendations,
      );

      if (applicableRecs.length > 0) {
        advice.push({
          severity: evaluation.severity,
          category: context.category,
          issue: `${threshold.description}: ${this.formatValue(value, threshold.unit)} (threshold: ${this.formatValue(threshold.warningValue, threshold.unit)})`,
          recommendations: applicableRecs,
          patterns: [], // Patterns could be added later
          documentationLinks: [
            threshold.docUrl,
            ...applicableRecs.map((r) => r.docUrl),
          ].filter((url, i, arr) => arr.indexOf(url) === i), // Dedupe
        });
      }
    }

    // Always check for redis-oplog recommendations when observer/reactivity issues detected
    if (
      context.category === 'publications' ||
      context.category === 'observers'
    ) {
      const redisOplogAdvice = this.getRedisOplogAdvice(context);
      if (redisOplogAdvice) {
        advice.push(redisOplogAdvice);
      }
    }

    // Sort by severity (most severe first)
    return advice.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
  }

  /**
   * Get Redis-Oplog specific recommendations when observer/reactivity issues are detected.
   */
  private getRedisOplogAdvice(context: MetricContext): OptimizationAdvice | null {
    const observerReuse = context.metrics.observerReuse ?? context.metrics.observerReuseRatio;
    const activeSubs = context.metrics.activeSubs ?? 0;
    const liveUpdates = context.metrics.liveUpdates ?? 0;

    // Check if redis-oplog recommendations would be helpful
    const shouldRecommendRedisOplog =
      (observerReuse !== undefined && observerReuse < 0.75) ||
      activeSubs > 100 ||
      liveUpdates > 1000;

    if (!shouldRecommendRedisOplog) {
      return null;
    }

    // Filter to applicable redis-oplog recommendations
    const applicableRecs = REDIS_OPLOG_RECOMMENDATIONS.filter((r) => {
      try {
        return r.applicableWhen(context.metrics);
      } catch {
        return false;
      }
    });

    if (applicableRecs.length === 0) {
      // Return top 3 general redis-oplog recommendations
      return {
        severity: 'medium',
        category: context.category,
        issue:
          'Consider using Redis-Oplog for improved reactivity performance',
        recommendations: REDIS_OPLOG_RECOMMENDATIONS.slice(0, 3),
        patterns: [],
        documentationLinks: [
          'https://github.com/cult-of-coders/redis-oplog',
          'https://github.com/cult-of-coders/redis-oplog/blob/master/docs/finetuning.md',
        ],
      };
    }

    return {
      severity: observerReuse !== undefined && observerReuse < 0.5 ? 'high' : 'medium',
      category: context.category,
      issue: 'Redis-Oplog optimizations recommended for better reactivity performance',
      recommendations: applicableRecs,
      patterns: [],
      documentationLinks: [
        'https://github.com/cult-of-coders/redis-oplog',
        ...applicableRecs.map((r) => r.docUrl),
      ].filter((url, i, arr) => arr.indexOf(url) === i),
    };
  }

  /**
   * Find applicable recommendations based on metrics.
   */
  private findApplicableRecommendations(
    metrics: Record<string, number>,
    category: MetricCategory,
    seenIds: Set<string>,
  ): Recommendation[] {
    const applicable: Recommendation[] = [];

    const categoryRecs = getRecommendationsByCategory(category);

    for (const rec of categoryRecs) {
      if (seenIds.has(rec.id)) continue;

      try {
        if (rec.applicableWhen(metrics)) {
          applicable.push(rec);
          seenIds.add(rec.id);
        }
      } catch {
        // Skip recommendations with evaluation errors
      }
    }

    // Sort by severity
    return applicable.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
  }

  /**
   * Format a metric value with its unit for display.
   */
  private formatValue(value: number, unit: string): string {
    switch (unit) {
      case 'ms':
        if (value >= 60000) {
          return `${(value / 60000).toFixed(1)}min`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}s`;
        }
        return `${Math.round(value)}ms`;

      case 'bytes':
        if (value >= 1024 * 1024 * 1024) {
          return `${(value / (1024 * 1024 * 1024)).toFixed(2)}GB`;
        } else if (value >= 1024 * 1024) {
          return `${(value / (1024 * 1024)).toFixed(2)}MB`;
        } else if (value >= 1024) {
          return `${(value / 1024).toFixed(2)}KB`;
        }
        return `${value}B`;

      case '%':
        return `${value.toFixed(1)}%`;

      case 'ratio':
        return `${(value * 100).toFixed(1)}%`;

      case 'count':
      case 'count/hour':
      case 'subs/min':
        return `${Math.round(value)} ${unit}`;

      default:
        return `${value} ${unit}`;
    }
  }

  /**
   * Get explanation for a specific metric.
   */
  explainMetric(metricName: string): MetricDefinition | null {
    return getMetricDefinition(metricName) ?? null;
  }

  /**
   * List all available metric names.
   */
  listMetrics(): string[] {
    return getAllMetricNames();
  }

  /**
   * Search metrics by keyword.
   */
  searchMetrics(keyword: string): MetricDefinition[] {
    return searchMetrics(keyword);
  }

  /**
   * Get all recommendations for a specific category.
   */
  getRecommendationsForCategory(category: MetricCategory): Recommendation[] {
    return getRecommendationsByCategory(category);
  }

  /**
   * Get recommendations applicable to given metrics, regardless of category.
   */
  getApplicableRecommendations(
    metrics: Record<string, number>,
    category?: MetricCategory,
  ): Recommendation[] {
    return getApplicableRecommendations(metrics, category);
  }

  /**
   * Analyze method metrics and return specific recommendations.
   * Convenience method for the analyze-slow-methods tool.
   */
  analyzeMethodMetrics(metrics: {
    total: number;
    db?: number;
    compute?: number;
    http?: number;
    wait?: number;
    async?: number;
    email?: number;
  }): {
    recommendations: Recommendation[];
    bottleneck: string;
    severity: Severity;
  } {
    const total = metrics.total || 1;

    // Calculate ratios
    const enrichedMetrics: Record<string, number> = {
      responseTime: total,
      total,
      db: metrics.db ?? 0,
      dbTime: metrics.db ?? 0,
      dbTimeRatio: (metrics.db ?? 0) / total,
      compute: metrics.compute ?? 0,
      computeTime: metrics.compute ?? 0,
      computeTimeRatio: (metrics.compute ?? 0) / total,
      http: metrics.http ?? 0,
      httpTime: metrics.http ?? 0,
      httpTimeRatio: (metrics.http ?? 0) / total,
      wait: metrics.wait ?? 0,
      waitTime: metrics.wait ?? 0,
      waitTimeRatio: (metrics.wait ?? 0) / total,
      async: metrics.async ?? 0,
      asyncTimeRatio: (metrics.async ?? 0) / total,
      email: metrics.email ?? 0,
    };

    // Find applicable recommendations
    const recommendations = this.getApplicableRecommendations(
      enrichedMetrics,
      'methods',
    );

    // Identify main bottleneck
    const components = [
      { name: 'db', value: metrics.db ?? 0 },
      { name: 'compute', value: metrics.compute ?? 0 },
      { name: 'http', value: metrics.http ?? 0 },
      { name: 'wait', value: metrics.wait ?? 0 },
      { name: 'async', value: metrics.async ?? 0 },
      { name: 'email', value: metrics.email ?? 0 },
    ].filter((c) => c.value > 0);

    const sorted = components.sort((a, b) => b.value - a.value);
    const bottleneck =
      sorted.length > 0
        ? `${sorted[0].name} (${((sorted[0].value / total) * 100).toFixed(0)}%)`
        : 'unknown';

    // Determine severity based on response time
    let severity: Severity = 'info';
    if (total >= 1000) {
      severity = 'critical';
    } else if (total >= 500) {
      severity = 'high';
    } else if (total >= 300) {
      severity = 'medium';
    } else if (total >= 200) {
      severity = 'low';
    }

    return {
      recommendations,
      bottleneck,
      severity,
    };
  }

  /**
   * Analyze publication metrics and return specific recommendations.
   * Convenience method for publication analysis.
   */
  analyzePublicationMetrics(metrics: {
    responseTime?: number;
    observerReuse?: number;
    activeSubs?: number;
    activeDocs?: number;
    updateRatio?: number;
    lifespan?: number;
    estimatedMemory?: number;
  }): {
    recommendations: Recommendation[];
    issues: string[];
    severity: Severity;
  } {
    const issues: string[] = [];
    let maxSeverity: Severity = 'info';

    const enrichedMetrics: Record<string, number> = {
      pubResponseTime: metrics.responseTime ?? 0,
      responseTime: metrics.responseTime ?? 0,
      observerReuse: metrics.observerReuse ?? 1,
      activeSubs: metrics.activeSubs ?? 0,
      activeDocs: metrics.activeDocs ?? 0,
      updateRatio: metrics.updateRatio ?? 0,
      lifespan: metrics.lifespan ?? 60000,
      estimatedMemory: metrics.estimatedMemory ?? 0,
    };

    // Check observer reuse
    if (metrics.observerReuse !== undefined && metrics.observerReuse < 0.75) {
      issues.push(
        `Low observer reuse: ${(metrics.observerReuse * 100).toFixed(0)}% (target: >75%)`,
      );
      maxSeverity = metrics.observerReuse < 0.5 ? 'high' : 'medium';
    }

    // Check response time
    if (metrics.responseTime !== undefined && metrics.responseTime > 300) {
      issues.push(`Slow publication response: ${metrics.responseTime}ms`);
      if (metrics.responseTime > 500) {
        maxSeverity = 'high';
      }
    }

    // Check active docs
    if (metrics.activeDocs !== undefined && metrics.activeDocs > 500) {
      issues.push(`High document count: ${metrics.activeDocs} (consider pagination)`);
    }

    // Get recommendations
    const recommendations = this.getApplicableRecommendations(
      enrichedMetrics,
      'publications',
    );

    // Always include redis-oplog recommendations
    const redisRecs = REDIS_OPLOG_RECOMMENDATIONS.filter((r) => {
      try {
        return r.applicableWhen(enrichedMetrics);
      } catch {
        return false;
      }
    });

    return {
      recommendations: [...recommendations, ...redisRecs].slice(0, 10),
      issues,
      severity: maxSeverity,
    };
  }
}

/**
 * Singleton instance of the advisor.
 */
export const advisor = new OptimizationAdvisor();
