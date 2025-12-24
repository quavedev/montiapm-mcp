import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHttpTraces } from '../../../src/tools/http-traces.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getHttpTraces', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return HTTP traces with proper formatting', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        httpTraces: [
          {
            id: 'trace-1',
            route: '/api/users',
            host: 'server-1',
            time: Date.now(),
            totalValue: 150,
            errored: false,
            metrics: {
              total: 150,
              wait: 10,
              waitedOn: null,
              db: 100,
              compute: 30,
              http: 0,
              email: 0,
              async: 10,
              fs: 0,
            },
          },
        ],
      },
    });

    const result = await getHttpTraces(mockClient, { limit: 10 });

    expect(result.count).toBe(1);
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0].route).toBe('/api/users');
    expect(result.traces[0].responseTime).toContain('150');
    expect(result.traces[0].errored).toBe(false);
  });

  it('should handle empty traces', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        httpTraces: [],
      },
    });

    const result = await getHttpTraces(mockClient, {});

    expect(result.count).toBe(0);
    expect(result.traces).toHaveLength(0);
    expect(result.summary.avgResponseTime).toBe('N/A');
    expect(result.summary.errorCount).toBe(0);
  });

  it('should calculate summary statistics correctly', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        httpTraces: [
          {
            id: 'trace-1',
            route: '/api/users',
            host: 'server-1',
            time: Date.now(),
            totalValue: 100,
            errored: false,
            metrics: { total: 100, wait: 0, waitedOn: null, db: 50, compute: 50, http: 0, email: 0, async: 0, fs: 0 },
          },
          {
            id: 'trace-2',
            route: '/api/posts',
            host: 'server-1',
            time: Date.now(),
            totalValue: 200,
            errored: true,
            metrics: { total: 200, wait: 0, waitedOn: null, db: 100, compute: 100, http: 0, email: 0, async: 0, fs: 0 },
          },
        ],
      },
    });

    const result = await getHttpTraces(mockClient, {});

    expect(result.count).toBe(2);
    expect(result.summary.routes).toHaveLength(2);
    expect(result.summary.routes).toContain('/api/users');
    expect(result.summary.routes).toContain('/api/posts');
    expect(result.summary.avgResponseTime).toBe('150ms');
    expect(result.summary.maxResponseTime).toBe('200ms');
    expect(result.summary.errorCount).toBe(1);
  });

  it('should pass correct variables to query', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { httpTraces: [] },
    });

    const startTime = Date.now() - 3600000;
    const endTime = Date.now();

    await getHttpTraces(mockClient, {
      startTime,
      endTime,
      limit: 50,
      minResponseTime: 100,
      route: '/api/users',
      host: 'server-1',
    });

    expect(mockQuery).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: expect.objectContaining({
        startTime,
        endTime,
        limit: 50,
        minValue: 100,
        route: '/api/users',
        host: 'server-1',
        sortOrder: 'DESC',
      }),
    });
  });

  it('should track errored traces correctly', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        httpTraces: [
          {
            id: 'trace-1',
            route: '/api/users',
            host: 'server-1',
            time: Date.now(),
            totalValue: 100,
            errored: true,
            metrics: { total: 100, wait: 0, waitedOn: null, db: 0, compute: 100, http: 0, email: 0, async: 0, fs: 0 },
          },
          {
            id: 'trace-2',
            route: '/api/users',
            host: 'server-1',
            time: Date.now(),
            totalValue: 150,
            errored: true,
            metrics: { total: 150, wait: 0, waitedOn: null, db: 0, compute: 150, http: 0, email: 0, async: 0, fs: 0 },
          },
          {
            id: 'trace-3',
            route: '/api/posts',
            host: 'server-1',
            time: Date.now(),
            totalValue: 50,
            errored: false,
            metrics: { total: 50, wait: 0, waitedOn: null, db: 0, compute: 50, http: 0, email: 0, async: 0, fs: 0 },
          },
        ],
      },
    });

    const result = await getHttpTraces(mockClient, {});

    expect(result.summary.errorCount).toBe(2);
    expect(result.traces.filter(t => t.errored)).toHaveLength(2);
  });
});
