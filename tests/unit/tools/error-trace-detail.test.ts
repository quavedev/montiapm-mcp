import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getErrorTraceDetail } from '../../../src/tools/error-trace-detail.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getErrorTraceDetail', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error trace detail with client info', async () => {
    const now = Date.now();
    const stacks = JSON.stringify([{ stack: 'Error: fail\n  at handler.js:42' }]);

    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTrace: {
          id: 'err-123',
          type: 'CLIENT',
          message: 'Uncaught TypeError',
          stacks,
          time: now,
          host: 'server-1',
          subType: 'TypeError',
          info: {
            browser: 'Chrome 120',
            userId: 'user-456',
            resolution: '1920x1080',
            ip: '192.168.1.1',
            clientArch: 'web.browser',
            url: 'https://app.example.com/dashboard',
          },
        },
      },
    });

    const result = await getErrorTraceDetail(mockClient, { traceId: 'err-123' });

    expect(result.id).toBe('err-123');
    expect(result.type).toBe('CLIENT');
    expect(result.subType).toBe('TypeError');
    expect(result.message).toBe('Uncaught TypeError');
    expect(result.host).toBe('server-1');
    expect(result.time).toBe(new Date(now).toISOString());
    expect(result.stacks).toHaveLength(1);
    expect(result.info).toEqual({
      browser: 'Chrome 120',
      userId: 'user-456',
      resolution: '1920x1080',
      ip: '192.168.1.1',
      clientArch: 'web.browser',
      url: 'https://app.example.com/dashboard',
    });
  });

  it('should return error when trace not found', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTrace: null,
      },
    });

    const result = await getErrorTraceDetail(mockClient, { traceId: 'non-existent' });

    expect(result.error).toBe('Error trace with ID "non-existent" not found');
  });

  it('should handle invalid JSON in stacks', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTrace: {
          id: 'err-123',
          type: 'METHOD',
          message: 'Some error',
          stacks: 'invalid json {{{',
          time: Date.now(),
          host: 'server-1',
          subType: null,
          info: null,
        },
      },
    });

    const result = await getErrorTraceDetail(mockClient, { traceId: 'err-123' });

    expect(result.id).toBe('err-123');
    expect(result.stacks).toEqual([]);
  });

  it('should handle trace with null info and stacks', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTrace: {
          id: 'err-123',
          type: 'METHOD',
          message: 'Server error',
          stacks: null,
          time: Date.now(),
          host: 'server-1',
          subType: null,
          info: null,
        },
      },
    });

    const result = await getErrorTraceDetail(mockClient, { traceId: 'err-123' });

    expect(result.id).toBe('err-123');
    expect(result.stacks).toEqual([]);
    expect(result.info).toBeNull();
    expect(result.subType).toBeNull();
  });

  it('should parse stacks correctly', async () => {
    const stackData = [
      { stack: 'Error: first\n  at a.js:1' },
      { stack: 'Error: second\n  at b.js:2' },
    ];

    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTrace: {
          id: 'err-123',
          type: 'METHOD',
          message: 'Multi-stack error',
          stacks: JSON.stringify(stackData),
          time: Date.now(),
          host: 'server-1',
          subType: 'RangeError',
          info: null,
        },
      },
    });

    const result = await getErrorTraceDetail(mockClient, { traceId: 'err-123' });

    expect(result.stacks).toEqual(stackData);
    expect(result.stacks).toHaveLength(2);
  });
});
