/**
 * Type definitions for the Monti APM knowledge base system.
 * These types support the optimization advisor that provides
 * documentation-backed recommendations.
 */

/**
 * Categories of metrics and recommendations.
 */
export type MetricCategory =
  | 'methods'
  | 'publications'
  | 'observers'
  | 'system'
  | 'errors'
  | 'bundle';

/**
 * Severity levels for issues and recommendations.
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Types of performance bottlenecks that can be identified.
 */
export type BottleneckType =
  | 'db'
  | 'compute'
  | 'http'
  | 'wait'
  | 'async'
  | 'email'
  | 'memory'
  | 'cpu'
  | 'observer_leak'
  | 'low_observer_reuse'
  | 'high_update_ratio'
  | 'large_bundle'
  | 'no_namespaces';

/**
 * A metric threshold definition with warning and critical levels.
 */
export interface Threshold {
  /** Metric identifier (e.g., 'responseTime', 'observerReuse') */
  metric: string;
  /** Category this threshold applies to */
  category: MetricCategory;
  /** Value at which a warning should be triggered */
  warningValue: number;
  /** Value at which a critical alert should be triggered */
  criticalValue: number;
  /** Unit of measurement (e.g., 'ms', '%', 'bytes') */
  unit: string;
  /** Human-readable description of this threshold */
  description: string;
  /** URL to relevant documentation */
  docUrl: string;
  /** Whether higher values are worse (true) or better (false) */
  higherIsWorse?: boolean;
}

/**
 * Context containing current metric values for analysis.
 */
export interface MetricContext {
  /** Category of metrics being analyzed */
  category: MetricCategory;
  /** Current metric values as key-value pairs */
  metrics: Record<string, number>;
  /** Optional throughput value (requests/min) */
  throughput?: number;
  /** Optional time range for the metrics */
  timeRange?: {
    start: number;
    end: number;
  };
}

/**
 * A recommendation for addressing a performance issue.
 */
export interface Recommendation {
  /** Unique identifier for this recommendation */
  id: string;
  /** Type of bottleneck this addresses */
  bottleneckType: BottleneckType;
  /** Category this recommendation applies to */
  category: MetricCategory;
  /** Severity level of the issue this addresses */
  severity: Severity;
  /** Short title for the recommendation */
  title: string;
  /** Detailed description of the recommendation */
  description: string;
  /** Step-by-step actions to implement this recommendation */
  actions: string[];
  /** Optional code example showing the fix */
  codeExample?: string;
  /** URL to relevant documentation */
  docUrl: string;
  /** Function to determine if this recommendation applies given metrics */
  applicableWhen: (metrics: Record<string, number>) => boolean;
}

/**
 * A code pattern that can be used to optimize performance.
 */
export interface Pattern {
  /** Unique identifier for this pattern */
  id: string;
  /** Name of the pattern */
  name: string;
  /** Category this pattern applies to */
  category: MetricCategory;
  /** Description of the problem this pattern solves */
  problem: string;
  /** Description of the solution */
  solution: string;
  /** Code example demonstrating the pattern */
  codeExample: string;
  /** Expected improvement from applying this pattern */
  expectedImprovement: string;
  /** URL to relevant documentation */
  docUrl: string;
}

/**
 * Definition of a metric from the Monti APM glossary.
 */
export interface MetricDefinition {
  /** Metric name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Formula for calculating this metric (if applicable) */
  formula?: string;
  /** How to interpret this metric's values */
  interpretation: string;
  /** Related metrics that should be considered together */
  relatedMetrics: string[];
  /** Tips for optimizing this metric */
  optimizationTips?: string[];
  /** URL to documentation */
  docUrl: string;
}

/**
 * Result of analyzing metrics with the optimization advisor.
 */
export interface OptimizationAdvice {
  /** Severity of the identified issue */
  severity: Severity;
  /** Category of the issue */
  category: MetricCategory;
  /** Description of the issue found */
  issue: string;
  /** Applicable recommendations for this issue */
  recommendations: Recommendation[];
  /** Related patterns that could help */
  patterns: Pattern[];
  /** Links to relevant documentation */
  documentationLinks: string[];
}

/**
 * Result from threshold evaluation.
 */
export interface ThresholdEvaluation {
  /** Severity based on threshold comparison */
  severity: Severity;
  /** The threshold that was matched (if any) */
  threshold: Threshold | null;
  /** The actual value that was evaluated */
  value: number;
  /** Percentage of threshold reached */
  percentOfThreshold: number;
}
