/**
 * Central registry for all optimization recommendations.
 */

import type { Recommendation, MetricCategory, BottleneckType } from '../types.js';
import { METHOD_RECOMMENDATIONS } from './methods.js';
import { PUBLICATION_RECOMMENDATIONS } from './publications.js';
import { REDIS_OPLOG_RECOMMENDATIONS } from './redis-oplog.js';
import { SYSTEM_RECOMMENDATIONS } from './system.js';
import { BUNDLE_RECOMMENDATIONS } from './bundle.js';

/**
 * All recommendations combined into a single array.
 */
export const ALL_RECOMMENDATIONS: Recommendation[] = [
  ...METHOD_RECOMMENDATIONS,
  ...PUBLICATION_RECOMMENDATIONS,
  ...REDIS_OPLOG_RECOMMENDATIONS,
  ...SYSTEM_RECOMMENDATIONS,
  ...BUNDLE_RECOMMENDATIONS,
];

/**
 * Get recommendations by category.
 */
export function getRecommendationsByCategory(
  category: MetricCategory,
): Recommendation[] {
  return ALL_RECOMMENDATIONS.filter((r) => r.category === category);
}

/**
 * Get recommendations by bottleneck type.
 */
export function getRecommendationsByBottleneck(
  bottleneckType: BottleneckType,
): Recommendation[] {
  return ALL_RECOMMENDATIONS.filter((r) => r.bottleneckType === bottleneckType);
}

/**
 * Get a specific recommendation by ID.
 */
export function getRecommendationById(id: string): Recommendation | undefined {
  return ALL_RECOMMENDATIONS.find((r) => r.id === id);
}

/**
 * Get applicable recommendations based on current metrics.
 */
export function getApplicableRecommendations(
  metrics: Record<string, number>,
  category?: MetricCategory,
): Recommendation[] {
  let recommendations = ALL_RECOMMENDATIONS;

  if (category) {
    recommendations = recommendations.filter((r) => r.category === category);
  }

  return recommendations.filter((r) => {
    try {
      return r.applicableWhen(metrics);
    } catch {
      return false;
    }
  });
}

/**
 * Get Redis-Oplog specific recommendations.
 * These are always included when observer/reactivity issues are detected.
 */
export function getRedisOplogRecommendations(): Recommendation[] {
  return REDIS_OPLOG_RECOMMENDATIONS;
}

// Re-export individual recommendation sets for direct access
export {
  METHOD_RECOMMENDATIONS,
  PUBLICATION_RECOMMENDATIONS,
  REDIS_OPLOG_RECOMMENDATIONS,
  SYSTEM_RECOMMENDATIONS,
  BUNDLE_RECOMMENDATIONS,
};
