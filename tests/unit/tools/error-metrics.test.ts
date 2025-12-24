import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getErrorMetrics } from '../../../src/tools/error-metrics.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getErrorMetrics', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error metrics', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorMetrics: [
          {
            host: null,
            points: [5, 3, 2, 0, 1, 4],
            percentile: 5,
          },
        ],
      },
    });

    const result = await getErrorMetrics(mockClient, {});

    expect(result.totalErrors).toBe(15);
    expect(result.dataPoints).toBe(6);
  });

  it('should calculate trend as increasing', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorMetrics: [
          {
            host: null,
            points: [1, 1, 1, 5, 5, 5],
            percentile: 5,
          },
        ],
      },
    });

    const result = await getErrorMetrics(mockClient, {});

    expect(result.trend).toBe('increasing');
  });

  it('should calculate trend as decreasing', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorMetrics: [
          {
            host: null,
            points: [10, 10, 10, 2, 2, 2],
            percentile: 10,
          },
        ],
      },
    });

    const result = await getErrorMetrics(mockClient, {});

    expect(result.trend).toBe('decreasing');
  });

  it('should calculate trend as stable', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorMetrics: [
          {
            host: null,
            points: [5, 5, 5, 5, 5, 5],
            percentile: 5,
          },
        ],
      },
    });

    const result = await getErrorMetrics(mockClient, {});

    expect(result.trend).toBe('stable');
  });

  it('should handle empty metrics', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorMetrics: [],
      },
    });

    const result = await getErrorMetrics(mockClient, {});

    expect(result.totalErrors).toBe(0);
    expect(result.message).toContain('No error metrics');
  });

  it('should handle null metrics', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorMetrics: [null],
      },
    });

    const result = await getErrorMetrics(mockClient, {});

    expect(result.totalErrors).toBe(0);
  });
});
