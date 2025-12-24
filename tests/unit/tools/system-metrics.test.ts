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
            points: [[Date.now(), 1024 * 1024 * 512]],
            p50: 1024 * 1024 * 500,
            p95: 1024 * 1024 * 600,
            p99: 1024 * 1024 * 650,
            max: 1024 * 1024 * 700,
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
    expect(result.hosts[0].percentiles).toBeDefined();
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

  it('should return EVENT_LOOP_LAG metrics in ms', async () => {
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
      metric: 'EVENT_LOOP_LAG',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('EVENT_LOOP_LAG');
    expect(result.hosts[0].percentiles.p50).toBe('10.50ms');
  });

  it('should return GC_MAJOR metrics in ms', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: null,
            points: [[Date.now(), 100.5]],
            p50: 100.5,
            p95: 140.2,
            p99: 145.0,
            max: 150.8,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'GC_MAJOR',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('GC_MAJOR');
    expect(result.hosts[0].percentiles.p50).toBe('100.50ms');
  });

  it('should return GC_MINOR metrics in ms', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorSystemMetrics: [
          {
            host: null,
            points: [[Date.now(), 10.25]],
            p50: 10.25,
            p95: 14.75,
            p99: 15.0,
            max: 15.5,
          },
        ],
      },
    });

    const result = await getSystemMetrics(mockClient, {
      metric: 'GC_MINOR',
      resolution: 'RES_1MIN',
      groupByHost: false,
    });

    expect(result.metric).toBe('GC_MINOR');
    expect(result.hosts[0].percentiles.p50).toBe('10.25ms');
  });
});
