import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTraceDetail } from '../../../src/tools/trace-detail.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getTraceDetail', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return trace details with events', async () => {
    const now = Date.now();
    const events = JSON.stringify([
      { type: 'start', at: now, endAt: now + 10 },
      { type: 'db', name: 'users.find', at: now + 10, endAt: now + 60 },
      { type: 'end', at: now + 100, endAt: now + 100 },
    ]);

    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTrace: {
          id: 'trace-123',
          method: 'users.find',
          host: 'server-1',
          time: now,
          type: 'method',
          totalValue: 100,
          errored: false,
          metrics: {
            total: 100,
            wait: 0,
            waitedOn: null,
            db: 50,
            compute: 40,
            http: 0,
            email: 0,
            async: 10,
            fs: 0,
          },
          events,
        },
      },
    });

    const result = await getTraceDetail(mockClient, { traceId: 'trace-123' });

    expect(result.id).toBe('trace-123');
    expect(result.method).toBe('users.find');
    expect(result.timeline).toBeDefined();
    expect(result.timeline).toHaveLength(3);
    expect(result.rawEvents).toHaveLength(3);
    expect(result.responseTime).toBe('100ms');
    expect(result.responseTimeMs).toBe(100);
  });

  it('should handle trace with no events', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTrace: {
          id: 'trace-123',
          method: 'users.find',
          host: 'server-1',
          time: Date.now(),
          type: 'method',
          totalValue: 100,
          errored: false,
          metrics: {
            total: 100,
            wait: 0,
            waitedOn: null,
            db: 50,
            compute: 50,
            http: 0,
            email: 0,
            async: 0,
            fs: 0,
          },
          events: null,
        },
      },
    });

    const result = await getTraceDetail(mockClient, { traceId: 'trace-123' });

    expect(result.id).toBe('trace-123');
    expect(result.timeline).toEqual([]);
    expect(result.rawEvents).toEqual([]);
  });

  it('should return error for non-existent trace', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTrace: null,
      },
    });

    const result = await getTraceDetail(mockClient, { traceId: 'non-existent' });

    expect(result.error).toBe('Trace with ID "non-existent" not found');
  });

  it('should handle invalid JSON in events', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTrace: {
          id: 'trace-123',
          method: 'users.find',
          host: 'server-1',
          time: Date.now(),
          type: 'method',
          totalValue: 100,
          errored: false,
          metrics: {
            total: 100,
            wait: 0,
            waitedOn: null,
            db: 50,
            compute: 50,
            http: 0,
            email: 0,
            async: 0,
            fs: 0,
          },
          events: 'invalid json',
        },
      },
    });

    const result = await getTraceDetail(mockClient, { traceId: 'trace-123' });

    expect(result.id).toBe('trace-123');
    expect(result.timeline).toEqual([]);
    expect(result.rawEvents).toEqual([]);
  });

  it('should format metrics breakdown', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorMethodTrace: {
          id: 'trace-123',
          method: 'users.find',
          host: 'server-1',
          time: Date.now(),
          type: 'method',
          totalValue: 1000,
          errored: false,
          metrics: {
            total: 1000,
            wait: 100,
            waitedOn: null,
            db: 600,
            compute: 200,
            http: 50,
            email: 0,
            async: 50,
            fs: 0,
          },
          events: '[]',
        },
      },
    });

    const result = await getTraceDetail(mockClient, { traceId: 'trace-123' });

    expect(result.breakdown).toContain('DB: 600ms');
    expect(result.breakdown).toContain('Compute: 200ms');
    expect(result.metrics.db).toBe(600);
    expect(result.metrics.compute).toBe(200);
  });
});
