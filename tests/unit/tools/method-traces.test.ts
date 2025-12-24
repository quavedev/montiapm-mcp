import { describe, it, expect, vi } from 'vitest';
import { getMethodTraces } from '../../../src/tools/method-traces.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getMethodTraces', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return method traces with proper formatting', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'users.find',
            host: 'server-1',
            time: Date.now(),
            type: 'method',
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

    const result = await getMethodTraces(mockClient, { limit: 10 });

    expect(result.count).toBe(1);
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0].method).toBe('users.find');
    expect(result.traces[0].responseTime).toContain('150');
  });

  it('should handle empty traces', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [],
      },
    });

    const result = await getMethodTraces(mockClient, {});

    expect(result.count).toBe(0);
    expect(result.traces).toHaveLength(0);
    expect(result.summary.avgResponseTime).toBe('N/A');
  });

  it('should calculate summary statistics correctly', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTraces: [
          {
            id: 'trace-1',
            method: 'method1',
            host: 'server-1',
            time: Date.now(),
            type: 'method',
            totalValue: 100,
            errored: false,
            metrics: { total: 100, wait: 0, waitedOn: null, db: 50, compute: 50, http: 0, email: 0, async: 0, fs: 0 },
          },
          {
            id: 'trace-2',
            method: 'method2',
            host: 'server-1',
            time: Date.now(),
            type: 'method',
            totalValue: 200,
            errored: true,
            metrics: { total: 200, wait: 0, waitedOn: null, db: 100, compute: 100, http: 0, email: 0, async: 0, fs: 0 },
          },
        ],
      },
    });

    const result = await getMethodTraces(mockClient, {});

    expect(result.count).toBe(2);
    expect(result.summary.methods).toHaveLength(2);
    expect(result.summary.methods).toContain('method1');
    expect(result.summary.methods).toContain('method2');
    expect(result.summary.avgResponseTime).toBe('150ms');
    expect(result.summary.maxResponseTime).toBe('200ms');
  });

  it('should pass correct variables to query', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { meteorMethodTraces: [] },
    });

    const startTime = Date.now() - 3600000;
    const endTime = Date.now();

    await getMethodTraces(mockClient, {
      startTime,
      endTime,
      limit: 50,
      minResponseTime: 100,
      methodName: 'users.find',
    });

    expect(mockQuery).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: expect.objectContaining({
        startTime,
        endTime,
        limit: 50,
        minValue: 100,
        method: 'users.find',
      }),
    });
  });
});
