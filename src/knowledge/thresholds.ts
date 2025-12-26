/**
 * Metric thresholds derived from Monti APM documentation,
 * Meteor Performance Guide, and best practices.
 */

import type { Threshold, Severity, ThresholdEvaluation } from './types.js';

/**
 * Base documentation URLs for references.
 */
const DOCS_BASE = 'https://docs.montiapm.com';
const METEOR_GUIDE = 'https://guide.meteor.com';

/**
 * All metric thresholds organized by category.
 */
export const THRESHOLDS: Threshold[] = [
  // ===================
  // METHOD THRESHOLDS
  // ===================
  {
    metric: 'responseTime',
    category: 'methods',
    warningValue: 500,
    criticalValue: 1000,
    unit: 'ms',
    description: 'Average method response time',
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    higherIsWorse: true,
  },
  {
    metric: 'dbTime',
    category: 'methods',
    warningValue: 100,
    criticalValue: 300,
    unit: 'ms',
    description: 'Database query time - values above 100ms may need indexes',
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    higherIsWorse: true,
  },
  {
    metric: 'dbTimeRatio',
    category: 'methods',
    warningValue: 0.5,
    criticalValue: 0.7,
    unit: 'ratio',
    description: 'Database time as proportion of total response time',
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    higherIsWorse: true,
  },
  {
    metric: 'waitTime',
    category: 'methods',
    warningValue: 100,
    criticalValue: 300,
    unit: 'ms',
    description: 'Time spent waiting in queue due to DDP message ordering',
    docUrl: `${DOCS_BASE}/academy/managing-waittime`,
    higherIsWorse: true,
  },
  {
    metric: 'waitTimeRatio',
    category: 'methods',
    warningValue: 0.3,
    criticalValue: 0.5,
    unit: 'ratio',
    description: 'Wait time as proportion of total response time',
    docUrl: `${DOCS_BASE}/academy/managing-waittime`,
    higherIsWorse: true,
  },
  {
    metric: 'computeTime',
    category: 'methods',
    warningValue: 200,
    criticalValue: 500,
    unit: 'ms',
    description: 'CPU computation time in method',
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    higherIsWorse: true,
  },
  {
    metric: 'computeTimeRatio',
    category: 'methods',
    warningValue: 0.4,
    criticalValue: 0.6,
    unit: 'ratio',
    description: 'Compute time as proportion of total response time',
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    higherIsWorse: true,
  },
  {
    metric: 'httpTime',
    category: 'methods',
    warningValue: 500,
    criticalValue: 2000,
    unit: 'ms',
    description: 'Time spent on external HTTP calls',
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    higherIsWorse: true,
  },
  {
    metric: 'httpTimeRatio',
    category: 'methods',
    warningValue: 0.3,
    criticalValue: 0.5,
    unit: 'ratio',
    description: 'HTTP time as proportion of total response time',
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    higherIsWorse: true,
  },
  {
    metric: 'asyncTimeRatio',
    category: 'methods',
    warningValue: 0.3,
    criticalValue: 0.5,
    unit: 'ratio',
    description: 'Async operation time as proportion of total',
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    higherIsWorse: true,
  },

  // ===================
  // PUBLICATION THRESHOLDS
  // ===================
  {
    metric: 'pubResponseTime',
    category: 'publications',
    warningValue: 300,
    criticalValue: 500,
    unit: 'ms',
    description: 'Publication response time until ready message',
    docUrl: `${DOCS_BASE}/dashboards/pubsub-dashboard`,
    higherIsWorse: true,
  },
  {
    metric: 'subRate',
    category: 'publications',
    warningValue: 100,
    criticalValue: 500,
    unit: 'subs/min',
    description: 'Subscription rate - high values may indicate missing pagination',
    docUrl: `${DOCS_BASE}/knowledge-base/glossary`,
    higherIsWorse: true,
  },
  {
    metric: 'updateRatio',
    category: 'publications',
    warningValue: 1.0,
    criticalValue: 5.0,
    unit: 'ratio',
    description: 'Ratio of updates to initial data - high values indicate frequent changes',
    docUrl: `${DOCS_BASE}/knowledge-base/glossary`,
    higherIsWorse: true,
  },
  {
    metric: 'lifespan',
    category: 'publications',
    warningValue: 60000,
    criticalValue: 30000,
    unit: 'ms',
    description: 'Subscription lifespan - very short lifespans may indicate issues',
    docUrl: `${DOCS_BASE}/knowledge-base/glossary`,
    higherIsWorse: false,
  },

  // ===================
  // OBSERVER THRESHOLDS
  // ===================
  {
    metric: 'observerReuse',
    category: 'observers',
    warningValue: 0.75,
    criticalValue: 0.5,
    unit: 'ratio',
    description: 'Observer reuse ratio - above 75% is optimal',
    docUrl: `${DOCS_BASE}/academy/improving-cpu-network-usage`,
    higherIsWorse: false,
  },
  {
    metric: 'observerLifetime',
    category: 'observers',
    warningValue: 60000,
    criticalValue: 30000,
    unit: 'ms',
    description: 'Observer lifetime - short lifetimes may indicate churn',
    docUrl: `${DOCS_BASE}/academy/know-your-observers`,
    higherIsWorse: false,
  },
  {
    metric: 'estimatedMemory',
    category: 'observers',
    warningValue: 100 * 1024 * 1024, // 100MB
    criticalValue: 500 * 1024 * 1024, // 500MB
    unit: 'bytes',
    description: 'Estimated memory usage by publications',
    docUrl: `${DOCS_BASE}/academy/optimize-memory-usage`,
    higherIsWorse: true,
  },

  // ===================
  // SYSTEM THRESHOLDS
  // ===================
  {
    metric: 'cpuUsage',
    category: 'system',
    warningValue: 70,
    criticalValue: 90,
    unit: '%',
    description: 'CPU usage percentage',
    docUrl: `${DOCS_BASE}/dashboards/system-dashboard`,
    higherIsWorse: true,
  },
  {
    metric: 'cpuP95',
    category: 'system',
    warningValue: 80,
    criticalValue: 95,
    unit: '%',
    description: 'CPU usage 95th percentile',
    docUrl: `${DOCS_BASE}/dashboards/system-dashboard`,
    higherIsWorse: true,
  },
  {
    metric: 'memoryUsage',
    category: 'system',
    warningValue: 1.5 * 1024 * 1024 * 1024, // 1.5GB
    criticalValue: 2 * 1024 * 1024 * 1024, // 2GB
    unit: 'bytes',
    description: 'RAM usage',
    docUrl: `${DOCS_BASE}/academy/optimize-memory-usage`,
    higherIsWorse: true,
  },
  {
    metric: 'eventLoopUtilization',
    category: 'system',
    warningValue: 70,
    criticalValue: 90,
    unit: '%',
    description: 'Event loop utilization - Node.js single-threaded processing',
    docUrl: `${DOCS_BASE}/knowledge-base/glossary`,
    higherIsWorse: true,
  },
  {
    metric: 'sessions',
    category: 'system',
    warningValue: 1000,
    criticalValue: 5000,
    unit: 'count',
    description: 'Active session count',
    docUrl: `${DOCS_BASE}/dashboards/system-dashboard`,
    higherIsWorse: true,
  },

  // ===================
  // ERROR THRESHOLDS
  // ===================
  {
    metric: 'errorRate',
    category: 'errors',
    warningValue: 0.01,
    criticalValue: 0.05,
    unit: 'ratio',
    description: 'Error rate as fraction of total requests',
    docUrl: `${DOCS_BASE}/knowledge-base/error-tracking`,
    higherIsWorse: true,
  },
  {
    metric: 'errorCount',
    category: 'errors',
    warningValue: 10,
    criticalValue: 100,
    unit: 'count/hour',
    description: 'Total error count per hour',
    docUrl: `${DOCS_BASE}/knowledge-base/error-tracking`,
    higherIsWorse: true,
  },

  // ===================
  // BUNDLE THRESHOLDS
  // ===================
  {
    metric: 'bundleSize',
    category: 'bundle',
    warningValue: 2 * 1024 * 1024, // 2MB
    criticalValue: 5 * 1024 * 1024, // 5MB
    unit: 'bytes',
    description: 'JavaScript bundle size',
    docUrl: 'https://blog.meteor.com/first-load-optimization-with-meteor-7cd896fa217d',
    higherIsWorse: true,
  },
  {
    metric: 'firstLoadTime',
    category: 'bundle',
    warningValue: 3000,
    criticalValue: 5000,
    unit: 'ms',
    description: 'Time to first meaningful paint',
    docUrl: 'https://blog.meteor.com/first-load-optimization-with-meteor-7cd896fa217d',
    higherIsWorse: true,
  },
];

/**
 * Mapping from severity to numeric order for sorting.
 */
const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

/**
 * Get severity order for sorting (lower = more severe).
 */
export function severityOrder(severity: Severity): number {
  return SEVERITY_ORDER[severity];
}

/**
 * Compare two severity levels.
 * Returns negative if a is more severe, positive if b is more severe.
 */
export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}

/**
 * Evaluate a metric value against its threshold.
 *
 * @param metricName - Name of the metric to evaluate
 * @param value - Current value of the metric
 * @returns Evaluation result with severity and threshold info
 */
export function evaluateThreshold(
  metricName: string,
  value: number,
): ThresholdEvaluation {
  const threshold = THRESHOLDS.find((t) => t.metric === metricName);

  if (!threshold) {
    return {
      severity: 'info',
      threshold: null,
      value,
      percentOfThreshold: 0,
    };
  }

  const higherIsWorse = threshold.higherIsWorse !== false;

  let severity: Severity;
  let percentOfThreshold: number;

  if (higherIsWorse) {
    // For metrics where higher values are worse (e.g., response time, CPU)
    if (value >= threshold.criticalValue) {
      severity = 'critical';
      percentOfThreshold = (value / threshold.criticalValue) * 100;
    } else if (value >= threshold.warningValue) {
      severity = 'high';
      percentOfThreshold = (value / threshold.warningValue) * 100;
    } else if (value >= threshold.warningValue * 0.7) {
      severity = 'medium';
      percentOfThreshold = (value / threshold.warningValue) * 100;
    } else if (value >= threshold.warningValue * 0.5) {
      severity = 'low';
      percentOfThreshold = (value / threshold.warningValue) * 100;
    } else {
      severity = 'info';
      percentOfThreshold = (value / threshold.warningValue) * 100;
    }
  } else {
    // For metrics where lower values are worse (e.g., observer reuse)
    if (value <= threshold.criticalValue) {
      severity = 'critical';
      percentOfThreshold = (threshold.criticalValue / Math.max(value, 0.01)) * 100;
    } else if (value <= threshold.warningValue) {
      severity = 'high';
      percentOfThreshold = (threshold.warningValue / value) * 100;
    } else {
      severity = 'info';
      percentOfThreshold = (threshold.warningValue / value) * 100;
    }
  }

  return {
    severity,
    threshold,
    value,
    percentOfThreshold,
  };
}

/**
 * Get all thresholds for a specific category.
 */
export function getThresholdsForCategory(
  category: string,
): Threshold[] {
  return THRESHOLDS.filter((t) => t.category === category);
}

/**
 * Get a specific threshold by metric name.
 */
export function getThreshold(metricName: string): Threshold | undefined {
  return THRESHOLDS.find((t) => t.metric === metricName);
}
