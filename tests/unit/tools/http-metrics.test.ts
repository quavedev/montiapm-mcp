import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHttpMetrics } from '../../../src/tools/http-metrics.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getHttpMetrics', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a timestamped series for a route', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { httpMetrics: [{ host: null, p50: 90.123, p95: 120.5, max: 130, points: [102.366, null, 85.06] }] },
    });

    const result = await getHttpMetrics(mockClient, {
      route: 'POST-/api/pods',
      startTime: Date.UTC(2026, 0, 1),
      endTime: Date.UTC(2026, 0, 1, 1, 30),
    });

    expect(mockQuery.mock.calls[0][0].variables).toMatchObject({
      metric: 'RESPONSE_TIME',
      resolution: 'RES_30MIN',
      route: 'POST-/api/pods',
      groupByHost: false,
    });
    expect(result.unit).toBe('avg ms per request');
    expect(result.series[0].host).toBe('all');
    expect(result.series[0].bucketValues).toEqual({ p50: 90.12, p95: 120.5, max: 130 });
    expect(result.series[0].points).toEqual([
      { time: '2026-01-01T00:00:00.000Z', value: 102.37 },
      { time: '2026-01-01T00:30:00.000Z', value: null },
      { time: '2026-01-01T01:00:00.000Z', value: 85.06 },
    ]);
  });

  it('handles no data', async () => {
    mockQuery.mockResolvedValueOnce({ data: { httpMetrics: [] } });
    const result = await getHttpMetrics(mockClient, { metric: 'THROUGHPUT' });
    expect(result.series).toEqual([]);
    expect(result.unit).toBe('requests/min');
    expect(result.route).toBe('all routes');
  });
});
