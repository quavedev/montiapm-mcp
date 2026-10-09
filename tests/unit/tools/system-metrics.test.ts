import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSystemMetrics } from '../../../src/tools/system-metrics.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getSystemMetrics', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return RAM metrics', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: 'server-1',
            // Monti reports memory in MB
            points: [[Date.now(), 512]],
            p50: 500,
            p95: 1702,
            p99: 650,
            max: 2048,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'RAM_USAGE',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('RAM_USAGE');
    expect(result.hosts).toHaveLength(1);
    expect(result.rawUnit).toBe('MB');
    expect(result.hosts[0].percentiles).toMatchObject({ p50: '500.00 MB', p95: '1.66 GB', max: '2.00 GB' });
    expect(result.hosts[0].rawPercentiles.p95).toBe(1702);
    expect(result.summary.overallMax).toBe('2.00 GB');
  });

  it('formats system memory metrics from MB', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { meteorSystemMetrics: [{ host: null, points: [], p50: 15987.1, p95: 15987.1, p99: 15987.1, max: 15987.1 }] },
    });

    const result = await getSystemMetrics(mockClient, { metric: 'TOTAL_SYSTEM_MEM' });

    expect(result.hosts[0].percentiles.max).toBe('15.61 GB');
  });

  it('should return CPU metrics', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: null,
            points: [[Date.now(), 45.5]],
            p50: 45,
            p95: 65,
            p99: 80,
            max: 95,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'CPU_USAGE',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('CPU_USAGE');
    expect(result.hosts[0].percentiles.p50).toContain('%');
  });

  it('should handle empty metrics', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'SESSIONS',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.hosts).toHaveLength(0);
  });

  it('should group by host when requested', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: 'server-1',
            points: [[Date.now(), 50]],
            p50: 50,
            p95: 60,
            p99: 70,
            max: 80,
          },
          {
            host: 'server-2',
            points: [[Date.now(), 40]],
            p50: 40,
            p95: 50,
            p99: 60,
            max: 70,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'CPU_USAGE',
      resolution: 'RES_1MIN',
      groupByHost: true,
    });

    expect(result.hosts).toHaveLength(2);
    expect(result.hosts[0].host).toBe('server-1');
    expect(result.hosts[1].host).toBe('server-2');
  });

  it('should return SESSIONS metrics as plain numbers', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: null,
            points: [[Date.now(), 150]],
            p50: 150,
            p95: 190,
            p99: 195,
            max: 200,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'SESSIONS',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('SESSIONS');
    expect(result.hosts[0].percentiles.p50).toBe('150');
  });

  it('should return MONGO_POOL_CHECKOUT_DELAY metrics in ms', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: null,
            points: [[Date.now(), 10.5]],
            p50: 10.5,
            p95: 14.2,
            p99: 15.0,
            max: 15.8,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'MONGO_POOL_CHECKOUT_DELAY',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('MONGO_POOL_CHECKOUT_DELAY');
    expect(result.hosts[0].percentiles.p50).toBe('10.50ms');
  });

  it('should return NEW_SESSIONS metrics', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: null,
            points: [[Date.now(), 100]],
            p50: 100,
            p95: 140,
            p99: 145,
            max: 150,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'NEW_SESSIONS',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('NEW_SESSIONS');
    expect(result.hosts[0].percentiles.p50).toBe('100');
  });

  it('should return FREE_SYSTEM_MEM metrics formatted from MB', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: null,
            points: [[Date.now(), 1024]],
            p50: 1024,
            p95: 900,
            p99: 800,
            max: 700,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'FREE_SYSTEM_MEM',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('FREE_SYSTEM_MEM');
    expect(result.hosts[0].percentiles.p50).toBe('1.00 GB');
  });
});
