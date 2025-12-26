import { describe, it, expect } from 'vitest';
import { advisor, OptimizationAdvisor } from '../../../src/knowledge/advisor.js';

describe('knowledge/advisor', () => {
  describe('OptimizationAdvisor', () => {
    it('should be a singleton instance', () => {
      expect(advisor).toBeInstanceOf(OptimizationAdvisor);
    });
  });

  describe('analyzeMethodMetrics', () => {
    it('should identify DB as bottleneck when db time is highest', () => {
      const result = advisor.analyzeMethodMetrics({
        total: 1000,
        db: 600,
        compute: 200,
        http: 100,
        wait: 50,
        async: 50,
      });

      expect(result.bottleneck).toContain('db');
      expect(result.bottleneck).toContain('60%');
      expect(result.severity).toBe('critical');
    });

    it('should identify compute as bottleneck when compute time is highest', () => {
      const result = advisor.analyzeMethodMetrics({
        total: 500,
        db: 50,
        compute: 350,
        http: 50,
        wait: 25,
        async: 25,
      });

      expect(result.bottleneck).toContain('compute');
    });

    it('should identify HTTP as bottleneck when HTTP time is highest', () => {
      const result = advisor.analyzeMethodMetrics({
        total: 800,
        db: 100,
        compute: 100,
        http: 500,
        wait: 50,
        async: 50,
      });

      expect(result.bottleneck).toContain('http');
    });

    it('should return recommendations for slow methods', () => {
      const result = advisor.analyzeMethodMetrics({
        total: 600,
        db: 400,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].docUrl).toBeDefined();
    });

    it('should classify severity based on response time', () => {
      expect(advisor.analyzeMethodMetrics({ total: 150 }).severity).toBe('info');
      expect(advisor.analyzeMethodMetrics({ total: 250 }).severity).toBe('low');
      expect(advisor.analyzeMethodMetrics({ total: 400 }).severity).toBe('medium');
      expect(advisor.analyzeMethodMetrics({ total: 700 }).severity).toBe('high');
      expect(advisor.analyzeMethodMetrics({ total: 1500 }).severity).toBe('critical');
    });

    it('should return wait-related recommendations for high wait time', () => {
      const result = advisor.analyzeMethodMetrics({
        total: 500,
        wait: 300,
        db: 100,
        compute: 100,
      });

      expect(result.recommendations.some((r) => r.title.toLowerCase().includes('unblock'))).toBe(
        true,
      );
    });
  });

  describe('analyzePublicationMetrics', () => {
    it('should identify low observer reuse issues', () => {
      const result = advisor.analyzePublicationMetrics({
        observerReuse: 0.4,
      });

      expect(result.issues.some((i) => i.toLowerCase().includes('observer reuse'))).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('should identify slow publication response', () => {
      const result = advisor.analyzePublicationMetrics({
        responseTime: 600,
      });

      expect(result.issues.some((i) => i.toLowerCase().includes('slow'))).toBe(true);
    });

    it('should identify high document count', () => {
      const result = advisor.analyzePublicationMetrics({
        activeDocs: 1000,
      });

      expect(result.issues.some((i) => i.toLowerCase().includes('document count'))).toBe(true);
    });

    it('should return redis-oplog recommendations', () => {
      const result = advisor.analyzePublicationMetrics({
        observerReuse: 0.5,
      });

      expect(
        result.recommendations.some(
          (r) =>
            r.title.toLowerCase().includes('namespace') ||
            r.title.toLowerCase().includes('redis') ||
            r.title.toLowerCase().includes('channel'),
        ),
      ).toBe(true);
    });
  });

  describe('explainMetric', () => {
    it('should return definition for known metrics', () => {
      const result = advisor.explainMetric('responseTime');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Response Time');
      expect(result?.description).toBeDefined();
    });

    it('should return null for unknown metrics', () => {
      const result = advisor.explainMetric('unknownMetricName');
      expect(result).toBeNull();
    });

    it('should include optimization tips', () => {
      const result = advisor.explainMetric('observerReuse');
      expect(result?.optimizationTips).toBeDefined();
      expect(result!.optimizationTips!.length).toBeGreaterThan(0);
    });
  });

  describe('listMetrics', () => {
    it('should return array of metric names', () => {
      const metrics = advisor.listMetrics();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics).toContain('responseTime');
      expect(metrics).toContain('observerReuse');
    });
  });

  describe('searchMetrics', () => {
    it('should find metrics by keyword', () => {
      const results = advisor.searchMetrics('response');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((m) => m.name.toLowerCase().includes('response'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = advisor.searchMetrics('xyznonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getRecommendationsForCategory', () => {
    it('should return recommendations for methods category', () => {
      const recs = advisor.getRecommendationsForCategory('methods');
      expect(recs.length).toBeGreaterThan(0);
      expect(recs.every((r) => r.category === 'methods')).toBe(true);
    });

    it('should return recommendations for publications category', () => {
      const recs = advisor.getRecommendationsForCategory('publications');
      expect(recs.length).toBeGreaterThan(0);
      expect(recs.every((r) => r.category === 'publications')).toBe(true);
    });
  });

  describe('getApplicableRecommendations', () => {
    it('should return recommendations applicable to given metrics', () => {
      const recs = advisor.getApplicableRecommendations({ db: 500, total: 600 }, 'methods');
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should filter by category when provided', () => {
      const methodRecs = advisor.getApplicableRecommendations({ db: 500 }, 'methods');
      expect(methodRecs.every((r) => r.category === 'methods')).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should return advice for concerning method metrics', () => {
      const advice = advisor.analyze({
        category: 'methods',
        metrics: {
          responseTime: 800,
          dbTime: 500,
        },
      });

      expect(advice.length).toBeGreaterThan(0);
      expect(advice[0].severity).toBeDefined();
      expect(advice[0].recommendations.length).toBeGreaterThan(0);
    });

    it('should include redis-oplog advice for publications with low observer reuse', () => {
      const advice = advisor.analyze({
        category: 'publications',
        metrics: {
          observerReuse: 0.4,
          activeSubs: 200,
        },
      });

      const hasRedisOplogAdvice = advice.some(
        (a) =>
          a.issue.toLowerCase().includes('redis') ||
          a.recommendations.some(
            (r) =>
              r.title.toLowerCase().includes('namespace') ||
              r.title.toLowerCase().includes('channel'),
          ),
      );
      expect(hasRedisOplogAdvice).toBe(true);
    });

    it('should sort advice by severity', () => {
      const advice = advisor.analyze({
        category: 'methods',
        metrics: {
          responseTime: 1500,
          dbTime: 1000,
          waitTime: 300,
        },
      });

      if (advice.length >= 2) {
        const severityOrderMap = ['critical', 'high', 'medium', 'low', 'info'];
        const firstIndex = severityOrderMap.indexOf(advice[0].severity);
        const secondIndex = severityOrderMap.indexOf(advice[1].severity);
        expect(firstIndex).toBeLessThanOrEqual(secondIndex);
      }
    });
  });
});
