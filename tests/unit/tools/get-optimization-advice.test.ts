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
          meteorMethodTraces: [
            {
              id: 'trace1',
              method: 'slow.method',
              host: 'host1',
              time: Date.now(),
              type: 'method',
              totalValue: 800,
              errored: false,
              metrics: {
                total: 800,
                wait: 100,
                db: 400,
                compute: 200,
                http: 0,
                email: 0,
                async: 100,
                fs: 0,
              },
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
          meteorMethodTraces: [
            {
              id: 'trace1',
              method: 'db.heavy',
              host: 'host1',
              time: Date.now(),
              type: 'method',
              totalValue: 1000,
              errored: false,
              metrics: {
                total: 1000,
                wait: 0,
                db: 800,
                compute: 200,
                http: 0,
                email: 0,
                async: 0,
                fs: 0,
              },
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
          meteorMethodTraces: [],
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
          meteorMethodTraces: [
            {
              id: 'trace1',
              method: 'critical.method',
              host: 'host1',
              time: Date.now(),
              type: 'method',
              totalValue: 1500,
              errored: false,
              metrics: {
                total: 1500,
                wait: 100,
                db: 1000,
                compute: 400,
                http: 0,
                email: 0,
                async: 0,
                fs: 0,
              },
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
          meteorPubTraces: [
            {
              id: 'trace1',
              publication: 'slow.publication',
              host: 'host1',
              time: Date.now(),
              type: 'sub',
              totalValue: 1500, // High response time to trigger issues
              errored: false,
              metrics: {
                total: 1500,
                wait: 0,
                db: 1000,
                compute: 500,
                http: 0,
                email: 0,
                async: 0,
                fs: 0,
              },
            },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'publications',
      });

      expect(result.category).toBe('publications');
      // Should have issues for slow publications
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should identify high DB time in publications', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorPubTraces: [
            {
              id: 'trace1',
              publication: 'db.heavy.pub',
              host: 'host1',
              time: Date.now(),
              type: 'sub',
              totalValue: 800,
              errored: false,
              metrics: {
                total: 800,
                wait: 0,
                db: 600, // High DB time
                compute: 200,
                http: 0,
                email: 0,
                async: 0,
                fs: 0,
              },
            },
          ],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'publications',
      });

      // Should have issues for high DB time
      const hasDbIssue = result.issues.some((i) => i.issue.toLowerCase().includes('db'));
      expect(hasDbIssue).toBe(true);
    });

    it('should handle empty publication data', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorPubTraces: [],
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
      // System category makes 3 separate calls for CPU, RAM, SESSIONS
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [{ host: null, points: [], p50: 85, p95: 90, p99: 95, max: 100 }],
        },
      });
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [
            { host: null, points: [], p50: 1.8e9, p95: 1.9e9, p99: 2e9, max: 2.1e9 },
          ],
        },
      });
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [{ host: null, points: [], p50: 500, p95: 520, p99: 550, max: 600 }],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'system',
      });

      expect(result.category).toBe('system');
      // High CPU (85%) and high memory (1.8GB) should generate issues
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle empty system metrics', async () => {
      // System category makes 3 separate calls for CPU, RAM, SESSIONS
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [],
        },
      });
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [],
        },
      });
      mockQuery.mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [],
        },
      });

      const result = await getOptimizationAdvice(mockClient, {
        category: 'system',
      });

      expect(result.category).toBe('system');
      expect(result.itemsAnalyzed).toBe(0);
    });
  });

  it('should include category in result', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [],
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
        meteorMethodTraces: [
          {
            id: 'trace1',
            method: 'test.method',
            host: 'host1',
            time: Date.now(),
            type: 'method',
            totalValue: 500,
            errored: false,
            metrics: {
              total: 500,
              wait: 0,
              db: 300,
              compute: 200,
              http: 0,
              email: 0,
              async: 0,
              fs: 0,
            },
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
