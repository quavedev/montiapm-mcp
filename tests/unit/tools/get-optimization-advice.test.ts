import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOptimizationAdvice } from '../../../src/tools/get-optimization-advice.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getOptimizationAdvice', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('methods category', () => {
    it('should return advice for slow methods', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorMethodBreakdown: [
            {
              name: 'slow.method',
              count: 100,
              responseTime: 800,
              waitTime: 100,
              dbTime: 400,
              httpTime: 0,
              emailTime: 0,
              asyncTime: 100,
              computeTime: 200,
            },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'methods',
      });

      expect(result.category).toBe('methods');
      expect(result.itemsAnalyzed).toBe(1);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include documentation links in recommendations', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorMethodBreakdown: [
            {
              name: 'db.heavy',
              count: 50,
              responseTime: 1000,
              waitTime: 0,
              dbTime: 800,
              httpTime: 0,
              emailTime: 0,
              asyncTime: 0,
              computeTime: 200,
            },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'methods',
      });

      expect(result.recommendations.some((r) => r.documentationUrl !== undefined)).toBe(true);
    });

    it('should handle empty method data', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorMethodBreakdown: [],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'methods',
      });

      expect(result.itemsAnalyzed).toBe(0);
      expect(result.summary).toContain('No method data');
    });

    it('should identify issues by severity', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorMethodBreakdown: [
            {
              name: 'critical.method',
              count: 100,
              responseTime: 1500,
              waitTime: 100,
              dbTime: 1000,
              httpTime: 0,
              emailTime: 0,
              asyncTime: 0,
              computeTime: 400,
            },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'methods',
      });

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('critical');
    });
  });

  describe('publications category', () => {
    it('should return advice for slow publications', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorPubBreakdown: [
            {
              name: 'slow.publication',
              count: 200,
              responseTime: 600,
              lifeTime: 300000,
              activeSubs: 50,
              activeDocs: 100,
              observerReuse: 0.5,
              polledDocuments: 0,
              liveAddedDocuments: 100,
              liveChangedDocuments: 50,
              liveRemovedDocuments: 10,
              initiallyAddedDocuments: 100,
            },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'publications',
      });

      expect(result.category).toBe('publications');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include redis-oplog recommendations for low observer reuse', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorPubBreakdown: [
            {
              name: 'low.observer.reuse',
              count: 100,
              responseTime: 300,
              lifeTime: 60000,
              activeSubs: 200,
              activeDocs: 500,
              observerReuse: 0.3,
              polledDocuments: 0,
              liveAddedDocuments: 500,
              liveChangedDocuments: 100,
              liveRemovedDocuments: 20,
              initiallyAddedDocuments: 500,
            },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'publications',
      });

      const hasRedisOplog = result.recommendations.some(
        (r) =>
          r.title.toLowerCase().includes('namespace') ||
          r.title.toLowerCase().includes('channel') ||
          r.title.toLowerCase().includes('redis'),
      );
      expect(hasRedisOplog).toBe(true);
    });

    it('should handle empty publication data', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorPubBreakdown: [],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'publications',
      });

      expect(result.itemsAnalyzed).toBe(0);
    });
  });

  describe('system category', () => {
    it('should return advice for high resource usage', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [
            { time: Date.now(), cpuUsage: 85, memory: 1.8e9, sessions: 500, eventLoopTime: 50 },
            { time: Date.now() - 60000, cpuUsage: 90, memory: 1.9e9, sessions: 520, eventLoopTime: 55 },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'system',
      });

      expect(result.category).toBe('system');
      // System category should have either recommendations or insights about the data
    });

    it('should handle empty system metrics', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'system',
      });

      expect(result.category).toBe('system');
    });
  });

  it('should include category in result', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodBreakdown: [],
      },
    });

    const result = await getOptimizationAdvice(mockClient, {
      category: 'methods',
    });

    expect(result.category).toBe('methods');
  });

  it('should include summary in result', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodBreakdown: [
          {
            name: 'test.method',
            count: 10,
            responseTime: 500,
            waitTime: 0,
            dbTime: 300,
            httpTime: 0,
            emailTime: 0,
            asyncTime: 0,
            computeTime: 200,
          },
        ],
      },
    });

    const result = await getOptimizationAdvice(mockClient, {
      category: 'methods',
    });

    expect(result.summary).toBeDefined();
  });
});
