import { describe, it, expect } from 'vitest';
import { explainMetric } from '../../../src/tools/explain-metric.js';

describe('explainMetric', () => {
  describe('known metrics', () => {
    it('should explain responseTime metric', async () => {
      const result = await explainMetric({ metric: 'responseTime' });

      expect(result.found).toBe(true);
      expect(result.definition.name).toBe('Response Time');
      expect(result.definition.description).toBeDefined();
    });

    it('should explain observerReuse metric', async () => {
      const result = await explainMetric({ metric: 'observerReuse' });

      expect(result.found).toBe(true);
      expect(result.definition.name).toBe('Observer Reuse');
      expect(result.definition.optimizationTips).toBeDefined();
      expect(result.definition.optimizationTips.length).toBeGreaterThan(0);
    });

    it('should explain waitTime metric', async () => {
      const result = await explainMetric({ metric: 'waitTime' });

      expect(result.found).toBe(true);
      expect(result.definition.name).toBe('Wait Time');
    });

    it('should explain dbTime metric', async () => {
      const result = await explainMetric({ metric: 'dbTime' });

      expect(result.found).toBe(true);
      expect(result.definition.description).toContain('database');
    });

    it('should explain throughput metric', async () => {
      const result = await explainMetric({ metric: 'throughput' });

      expect(result.found).toBe(true);
      expect(result.definition.name).toBe('Throughput');
    });

    it('should explain subRate metric', async () => {
      const result = await explainMetric({ metric: 'subRate' });

      expect(result.found).toBe(true);
      expect(result.definition.name).toBe('SubRate');
    });

    it('should explain cpuUsage metric', async () => {
      const result = await explainMetric({ metric: 'cpuUsage' });

      expect(result.found).toBe(true);
      expect(result.definition.name).toBe('CPU Usage');
    });

    it('should explain memoryUsage metric', async () => {
      const result = await explainMetric({ metric: 'memoryUsage' });

      expect(result.found).toBe(true);
      expect(result.definition.name).toBe('Memory Usage');
    });
  });

  describe('unknown metrics', () => {
    it('should return not found for unknown metric', async () => {
      const result = await explainMetric({ metric: 'unknownMetricName' });

      expect(result.found).toBe(false);
      expect(result.message).toContain('Unknown metric');
    });

    it('should list available metrics when not found', async () => {
      const result = await explainMetric({ metric: 'invalidMetric' });

      expect(result.availableMetrics).toBeDefined();
      expect(Array.isArray(result.availableMetrics)).toBe(true);
      expect(result.availableMetrics.length).toBeGreaterThan(0);
    });

    it('should provide suggestions for partial matches', async () => {
      const result = await explainMetric({ metric: 'response' });

      expect(result.found).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.some((s: string) => s.includes('response'))).toBe(true);
    });
  });

  describe('metric properties', () => {
    it('should include documentation URL', async () => {
      const result = await explainMetric({ metric: 'responseTime' });

      expect(result.definition.documentationUrl).toBeDefined();
      expect(result.definition.documentationUrl).toMatch(/^https?:\/\//);
    });

    it('should include interpretation when available', async () => {
      const result = await explainMetric({ metric: 'observerReuse' });

      expect(result.definition.interpretation).toBeDefined();
    });

    it('should include formula when available', async () => {
      const result = await explainMetric({ metric: 'networkLatency' });

      expect(result.definition.formula).toBeDefined();
    });

    it('should include related metrics when available', async () => {
      const result = await explainMetric({ metric: 'responseTime' });

      expect(result.definition.relatedMetrics).toBeDefined();
      expect(Array.isArray(result.definition.relatedMetrics)).toBe(true);
    });
  });
});
