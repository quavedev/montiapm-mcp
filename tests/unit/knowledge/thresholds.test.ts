import { describe, it, expect } from 'vitest';
import {
  evaluateThreshold,
  getThresholdsForCategory,
  severityOrder,
  THRESHOLDS,
} from '../../../src/knowledge/thresholds.js';

describe('knowledge/thresholds', () => {
  describe('THRESHOLDS', () => {
    it('should have thresholds for all major categories', () => {
      const categories = [...new Set(THRESHOLDS.map((t) => t.category))];
      expect(categories).toContain('methods');
      expect(categories).toContain('publications');
      expect(categories).toContain('system');
    });

    it('should have valid threshold values', () => {
      for (const threshold of THRESHOLDS) {
        // For higherIsWorse=true, warning should be <= critical
        // For higherIsWorse=false, warning should be >= critical
        if (threshold.higherIsWorse !== false) {
          expect(threshold.warningValue).toBeLessThanOrEqual(threshold.criticalValue);
        } else {
          expect(threshold.warningValue).toBeGreaterThanOrEqual(threshold.criticalValue);
        }
        expect(threshold.metric).toBeTruthy();
        expect(threshold.docUrl).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('getThresholdsForCategory', () => {
    it('should return thresholds for methods category', () => {
      const methodThresholds = getThresholdsForCategory('methods');
      expect(methodThresholds.length).toBeGreaterThan(0);
      expect(methodThresholds.every((t) => t.category === 'methods')).toBe(true);
    });

    it('should return thresholds for publications category', () => {
      const pubThresholds = getThresholdsForCategory('publications');
      expect(pubThresholds.length).toBeGreaterThan(0);
      expect(pubThresholds.every((t) => t.category === 'publications')).toBe(true);
    });

    it('should return thresholds for system category', () => {
      const sysThresholds = getThresholdsForCategory('system');
      expect(sysThresholds.length).toBeGreaterThan(0);
      expect(sysThresholds.every((t) => t.category === 'system')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const unknown = getThresholdsForCategory('unknown' as never);
      expect(unknown).toEqual([]);
    });
  });

  describe('evaluateThreshold', () => {
    it('should return info for values below warning threshold', () => {
      const result = evaluateThreshold('responseTime', 200);
      expect(result.severity).toBe('info');
    });

    it('should return high for values at or above warning threshold', () => {
      const result = evaluateThreshold('responseTime', 500);
      expect(result.severity).toBe('high');
    });

    it('should return critical for values at or above critical threshold', () => {
      const result = evaluateThreshold('responseTime', 1000);
      expect(result.severity).toBe('critical');
    });

    it('should return info for unknown metrics', () => {
      const result = evaluateThreshold('unknownMetric', 9999);
      expect(result.severity).toBe('info');
    });

    it('should include threshold info in result', () => {
      const result = evaluateThreshold('responseTime', 600);
      expect(result.threshold).toBeDefined();
      expect(result.threshold?.metric).toBe('responseTime');
    });

    it('should handle higherIsWorse=false metrics', () => {
      // For observerReuse, lower is worse
      const lowReuse = evaluateThreshold('observerReuse', 0.4);
      expect(lowReuse.severity).toBe('critical');

      const goodReuse = evaluateThreshold('observerReuse', 0.9);
      expect(goodReuse.severity).toBe('info');
    });

    it('should calculate percentage of threshold', () => {
      const result = evaluateThreshold('responseTime', 750);
      expect(result.percentOfThreshold).toBeGreaterThan(0);
    });
  });

  describe('severityOrder', () => {
    it('should order critical as most severe', () => {
      expect(severityOrder('critical')).toBeLessThan(severityOrder('high'));
    });

    it('should order high before medium', () => {
      expect(severityOrder('high')).toBeLessThan(severityOrder('medium'));
    });

    it('should order medium before low', () => {
      expect(severityOrder('medium')).toBeLessThan(severityOrder('low'));
    });

    it('should order low before info', () => {
      expect(severityOrder('low')).toBeLessThan(severityOrder('info'));
    });
  });
});
