import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getErrorTraces } from '../../../src/tools/error-traces.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';
import { SortOrder } from '../../../src/utils/constants.js';

describe('getErrorTraces', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error traces with proper formatting', async () => {
    const now = Date.now();
    const stacks = JSON.stringify([{ stack: 'Error: something\n  at foo.js:1' }]);

    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTraces: [
          {
            id: 'err-1',
            type: 'METHOD',
            message: 'Cannot read property of undefined',
            stacks,
            time: now,
            host: 'server-1',
            subType: 'TypeError',
          },
        ],
      },
    });

    const result = await getErrorTraces(mockClient, {});

    expect(result.count).toBe(1);
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0].id).toBe('err-1');
    expect(result.traces[0].type).toBe('METHOD');
    expect(result.traces[0].message).toBe('Cannot read property of undefined');
    expect(result.traces[0].subType).toBe('TypeError');
    expect(result.traces[0].host).toBe('server-1');
    expect(result.traces[0].stacks).toHaveLength(1);
    expect(result.traces[0].time).toBe(new Date(now).toISOString());
  });

  it('should handle empty traces', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTraces: [],
      },
    });

    const result = await getErrorTraces(mockClient, {});

    expect(result.count).toBe(0);
    expect(result.traces).toHaveLength(0);
    expect(result.summary.uniqueMessages).toEqual([]);
    expect(result.summary.typeCounts).toEqual({});
  });

  it('should calculate summary correctly', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTraces: [
          {
            id: 'err-1',
            type: 'METHOD',
            message: 'Error A',
            stacks: null,
            time: Date.now(),
            host: 'server-1',
            subType: null,
          },
          {
            id: 'err-2',
            type: 'METHOD',
            message: 'Error B',
            stacks: null,
            time: Date.now(),
            host: 'server-1',
            subType: null,
          },
          {
            id: 'err-3',
            type: 'CLIENT',
            message: 'Error A',
            stacks: null,
            time: Date.now(),
            host: 'server-2',
            subType: null,
          },
        ],
      },
    });

    const result = await getErrorTraces(mockClient, {});

    expect(result.count).toBe(3);
    expect(result.summary.uniqueMessages).toHaveLength(2);
    expect(result.summary.uniqueMessages).toContain('Error A');
    expect(result.summary.uniqueMessages).toContain('Error B');
    expect(result.summary.typeCounts).toEqual({ METHOD: 2, CLIENT: 1 });
  });

  it('should pass correct variables to query', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { meteorErrorTraces: [] },
    });

    const startTime = Date.now() - 3600000;
    const endTime = Date.now();

    await getErrorTraces(mockClient, {
      startTime,
      endTime,
      limit: 50,
      message: 'Some error',
      type: 'METHOD',
      status: 'NEW',
      sortOrder: 'ASC',
      sortField: 'TOTAL_VALUE',
    });

    expect(mockQuery).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: expect.objectContaining({
        startTime,
        endTime,
        limit: 50,
        message: 'Some error',
        type: 'METHOD',
        status: 'NEW',
        sortOrder: 'ASC',
        sortField: 'TOTAL_VALUE',
      }),
    });
  });

  it('should use default variables when none provided', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { meteorErrorTraces: [] },
    });

    await getErrorTraces(mockClient, {});

    expect(mockQuery).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: expect.objectContaining({
        limit: 5,
        sortOrder: SortOrder.DSC,
        sortField: 'START_TIME',
        message: undefined,
        type: undefined,
        status: undefined,
      }),
    });
  });

  it('should handle traces with null stacks', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTraces: [
          {
            id: 'err-1',
            type: 'METHOD',
            message: 'Error',
            stacks: null,
            time: Date.now(),
            host: 'server-1',
            subType: null,
          },
        ],
      },
    });

    const result = await getErrorTraces(mockClient, {});

    expect(result.traces[0].stacks).toEqual([]);
  });

  it('should handle traces with invalid JSON stacks', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTraces: [
          {
            id: 'err-1',
            type: 'METHOD',
            message: 'Error',
            stacks: 'not valid json',
            time: Date.now(),
            host: 'server-1',
            subType: null,
          },
        ],
      },
    });

    const result = await getErrorTraces(mockClient, {});

    expect(result.traces[0].stacks).toEqual([]);
  });

  it('should parse valid JSON stacks', async () => {
    const stackData = [{ stack: 'Error\n  at file.js:10' }, { stack: 'Error\n  at other.js:5' }];

    mockQuery.mockResolvedValueOnce({
      data: {
        meteorErrorTraces: [
          {
            id: 'err-1',
            type: 'METHOD',
            message: 'Error',
            stacks: JSON.stringify(stackData),
            time: Date.now(),
            host: 'server-1',
            subType: null,
          },
        ],
      },
    });

    const result = await getErrorTraces(mockClient, {});

    expect(result.traces[0].stacks).toEqual(stackData);
  });
});
