import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSlowMethods } from '../../../src/tools/analyze-slow-methods.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('analyzeSlowMethods', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze slow methods', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'slow.method',
            host: 'server-1',
            time: Date.now(),
            totalValue: 1000,
            errored: false,
            metrics: {
              total: 1000,
              wait: 100,
              waitedOn: null,
              db: 600,
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

    const result = await analyzeSlowMethods(mockClient, {
      threshold: 500,
    });

    expect(result.methodsAnalyzed).toBe(1);
    expect(result.analysis).toHaveLength(1);
    expect(result.analysis[0].method).toBe('slow.method');
    expect(result.analysis[0].recommendations).toBeDefined();
  });

  it('should identify DB bottleneck', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'db.heavy',
            host: 'server-1',
            time: Date.now(),
            totalValue: 1000,
            errored: false,
            metrics: {
              total: 1000,
              wait: 0,
              waitedOn: null,
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

    const result = await analyzeSlowMethods(mockClient, {});

    expect(result.analysis[0].mainBottleneck).toContain('db');
    // Recommendations are now objects with title, description, and documentationUrl
    expect(result.analysis[0].recommendations.some((r: { title: string; description: string }) =>
      r.title.toLowerCase().includes('index') || r.description.toLowerCase().includes('database')
    )).toBe(true);
  });

  it('should identify compute bottleneck', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'cpu.heavy',
            host: 'server-1',
            time: Date.now(),
            totalValue: 1000,
            errored: false,
            metrics: {
              total: 1000,
              wait: 0,
              waitedOn: null,
              db: 100,
              compute: 800,
              http: 0,
              email: 0,
              async: 100,
              fs: 0,
            },
          },
        ],
      },
    });

    const result = await analyzeSlowMethods(mockClient, {});

    expect(result.analysis[0].mainBottleneck).toContain('compute');
  });

  it('should handle empty results', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [],
      },
    });

    const result = await analyzeSlowMethods(mockClient, { threshold: 500 });

    expect(result.methodsAnalyzed).toBe(0);
    expect(result.message).toContain('No methods found');
  });

  it('should group multiple traces of same method', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'same.method',
            host: 'server-1',
            time: Date.now(),
            totalValue: 500,
            errored: false,
            metrics: { total: 500, wait: 0, waitedOn: null, db: 250, compute: 250, http: 0, email: 0, async: 0, fs: 0 },
          },
          {
            id: 'trace-2',
            method: 'same.method',
            host: 'server-1',
            time: Date.now(),
            totalValue: 700,
            errored: false,
            metrics: { total: 700, wait: 0, waitedOn: null, db: 350, compute: 350, http: 0, email: 0, async: 0, fs: 0 },
          },
        ],
      },
    });

    const result = await analyzeSlowMethods(mockClient, {});

    expect(result.methodsAnalyzed).toBe(1);
    expect(result.analysis[0].occurrences).toBe(2);
  });

  it('should recommend optimizing HTTP when HTTP time is significant', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'http.heavy',
            host: 'server-1',
            time: Date.now(),
            totalValue: 1000,
            errored: false,
            metrics: { total: 1000, wait: 0, waitedOn: null, db: 100, compute: 100, http: 700, email: 0, async: 100, fs: 0 },
          },
        ],
      },
    });

    const result = await analyzeSlowMethods(mockClient, {});

    expect(result.analysis[0].recommendations.some((r: { title: string; description: string }) =>
      r.title.toLowerCase().includes('http') || r.description.toLowerCase().includes('http')
    )).toBe(true);
  });

  it('should recommend optimizing async when async time is significant', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'async.heavy',
            host: 'server-1',
            time: Date.now(),
            totalValue: 1000,
            errored: false,
            metrics: { total: 1000, wait: 0, waitedOn: null, db: 100, compute: 100, http: 0, email: 0, async: 700, fs: 0 },
          },
        ],
      },
    });

    const result = await analyzeSlowMethods(mockClient, {});

    expect(result.analysis[0].recommendations.some((r: { title: string; description: string }) =>
      r.title.toLowerCase().includes('async') || r.description.toLowerCase().includes('async') || r.description.toLowerCase().includes('promises')
    )).toBe(true);
  });

  it('should provide default recommendation when performance is balanced', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'balanced.method',
            host: 'server-1',
            time: Date.now(),
            totalValue: 1000,
            errored: false,
            metrics: { total: 1000, wait: 0, waitedOn: null, db: 200, compute: 200, http: 200, email: 0, async: 200, fs: 0 },
          },
        ],
      },
    });

    const result = await analyzeSlowMethods(mockClient, {});

    // With balanced metrics (no single bottleneck), advisor returns general recommendations like rate limiting or caching
    expect(result.analysis[0].recommendations.some((r: { title: string; description: string }) =>
      r.title.toLowerCase().includes('rate limit') || r.title.toLowerCase().includes('cache')
    )).toBe(true);
  });

  it('should recommend unblock when wait time is significant', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'wait.heavy',
            host: 'server-1',
            time: Date.now(),
            totalValue: 1000,
            errored: false,
            metrics: { total: 1000, wait: 500, waitedOn: null, db: 100, compute: 100, http: 0, email: 0, async: 0, fs: 0 },
          },
        ],
      },
    });

    const result = await analyzeSlowMethods(mockClient, {});

    expect(result.analysis[0].recommendations.some((r: { title: string; description: string }) =>
      r.title.toLowerCase().includes('wait') || r.title.toLowerCase().includes('unblock') || r.description.toLowerCase().includes('unblock') || r.description.toLowerCase().includes('queuing')
    )).toBe(true);
  });
});
