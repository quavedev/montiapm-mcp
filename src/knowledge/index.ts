/**
 * Knowledge Base Module
 *
 * Provides documentation-backed optimization recommendations
 * for Meteor/Monti APM applications.
 *
 * Sources:
 * - Monti APM Documentation (https://docs.montiapm.com)
 * - Meteor Performance Guide (https://guide.meteor.com/performance-improvement)
 * - Redis-Oplog (https://github.com/cult-of-coders/redis-oplog)
 * - Meteor Blog (https://blog.meteor.com)
 */

// Types
export type {
  MetricCategory,
  Severity,
  BottleneckType,
  Threshold,
  MetricContext,
  Recommendation,
  Pattern,
  MetricDefinition,
  OptimizationAdvice,
  ThresholdEvaluation,
} from './types.js';

// Thresholds
export {
  THRESHOLDS,
  evaluateThreshold,
  getThresholdsForCategory,
  getThreshold,
  severityOrder,
  compareSeverity,
} from './thresholds.js';

// Recommendations
export {
  ALL_RECOMMENDATIONS,
  getRecommendationsByCategory,
  getRecommendationsByBottleneck,
  getRecommendationById,
  getApplicableRecommendations,
  getRedisOplogRecommendations,
  METHOD_RECOMMENDATIONS,
  PUBLICATION_RECOMMENDATIONS,
  REDIS_OPLOG_RECOMMENDATIONS,
  SYSTEM_RECOMMENDATIONS,
  BUNDLE_RECOMMENDATIONS,
} from './recommendations/index.js';

// Glossary
export {
  METRIC_DEFINITIONS,
  getMetricDefinition,
  getAllMetricNames,
  searchMetrics,
} from './glossary.js';

// Advisor
export { OptimizationAdvisor, advisor } from './advisor.js';
