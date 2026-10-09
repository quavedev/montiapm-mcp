import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getHttpBreakdown,
  getMethodBreakdown,
  getPubBreakdown,
  getBreakdownUnit,
} from '../../../src/tools/breakdown.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('breakdown tools', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ranks HTTP routes by IMPACT by default and reports total time', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        httpBreakdown: [
          { name: 'POST-/api/pods', sortedValue: 5_909_393, throughput: 11.02 },
          { name: 'GET-/api/users', sortedValue: 2_346_557, throughput: 91.85 },
        ],
      },
    });

    const result = await getHttpBreakdown(mockClient, { startTime: 0, endTime: 8 * 3600_000 });

    const variables = mockQuery.mock.calls[0][0].variables;
    expect(variables).toMatchObject({ sortField: 'IMPACT', sortOrder: 'DSC', limit: 20, startTime: 0 });
    expect(result.unit).toBe('totalMs');
    expect(result.count).toBe(2);
    expect(result.rows[0]).toMatchObject({ name: 'POST-/api/pods', throughputPerMin: 11.02 });
    expect(result.rows[0].formattedValue).toBe('98.49min');
    expect(result.rows[0]).not.toHaveProperty('estimatedTotalTimeMs');
  });

  it('uses IMPACT as the real total for HTTP RES_TIME instead of avg × throughput × window', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: { httpBreakdown: [{ name: 'PUT-/api/host', sortedValue: 4600, throughput: 1.106 }] },
      })
      .mockResolvedValueOnce({
        data: { httpBreakdown: [{ name: 'PUT-/api/host', sortedValue: 23_000, throughput: 1.106 }] },
      });

    const result = await getHttpBreakdown(mockClient, { sortField: 'RES_TIME', startTime: 0, endTime: 8 * 3600_000 });

    expect(mockQuery.mock.calls[1][0].variables).toMatchObject({ sortField: 'IMPACT', limit: 200, startTime: 0 });
    // avg × throughput × window would be ~40.7 min for 5 real calls
    expect(result.rows[0]).toMatchObject({
      estimatedTotalTimeMs: 23_000,
      estimatedTotalTime: '23.00s',
      estimatedTotalTimeSource: 'impact',
      totalResponseTimeMs: 23_000,
    });
    expect(result).not.toHaveProperty('note');
  });

  it('caps HTTP sub-timings at IMPACT and labels them as upper bounds', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: {
          httpBreakdown: [
            { name: 'POST-/api/pods', sortedValue: 1000, throughput: 10 },
            { name: 'GET-/rare', sortedValue: 1000, throughput: 10 },
            { name: 'GET-/no-impact', sortedValue: 1000, throughput: 10 },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          httpBreakdown: [
            { name: 'POST-/api/pods', sortedValue: 10_000_000, throughput: 10 },
            { name: 'GET-/rare', sortedValue: 5_000, throughput: 10 },
            { name: 'GET-/no-impact', sortedValue: null, throughput: null },
          ],
        },
      });

    const result = await getHttpBreakdown(mockClient, { sortField: 'DB', startTime: 0, endTime: 60 * 60_000 });

    expect(result.unit).toBe('avgMs');
    // 1000 ms × 10/min × 60 min
    expect(result.rows[0]).toMatchObject({ estimatedTotalTimeMs: 600_000, estimatedTotalTimeSource: 'upperBound' });
    expect(result.rows[0].formattedValue).toBe('1.00s');
    expect(result.rows[1]).toMatchObject({ estimatedTotalTimeMs: 5_000, totalResponseTimeMs: 5_000 });
    expect(result.rows[2]).toMatchObject({ estimatedTotalTimeMs: 600_000 });
    expect(result.rows[2]).not.toHaveProperty('totalResponseTimeMs');
    expect(result.note).toContain('upperBound');
  });

  it('falls back to upper bounds when the IMPACT query fails', async () => {
    mockQuery
      .mockResolvedValueOnce({ data: { httpBreakdown: [{ name: 'r', sortedValue: 100, throughput: 1 }] } })
      .mockRejectedValueOnce(new Error('rate limited'));

    const result = await getHttpBreakdown(mockClient, { sortField: 'RES_TIME', startTime: 0, endTime: 60_000 });

    expect(result.rows[0]).toMatchObject({ estimatedTotalTimeMs: 100, estimatedTotalTimeSource: 'upperBound' });
    expect(result.rows[0]).not.toHaveProperty('totalResponseTimeMs');
  });

  it('labels method estimates as upper bounds', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { meteorMethodBreakdown: [{ name: 'm', sortedValue: 200, throughput: 2 }] },
    });

    const result = await getMethodBreakdown(mockClient, { startTime: 0, endTime: 10 * 60_000 });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(result.rows[0]).toMatchObject({ estimatedTotalTimeMs: 4_000, estimatedTotalTimeSource: 'upperBound' });
    expect(result.note).toContain('overstates');
  });

  it('queries method and publication breakdowns with their own enums', async () => {
    mockQuery
      .mockResolvedValueOnce({ data: { meteorMethodBreakdown: [{ name: 'm', sortedValue: 50, throughput: 1 }] } })
      .mockResolvedValueOnce({ data: { meteorPubBreakdown: [{ name: 'p', sortedValue: 42.5, throughput: null }] } });

    const methods = await getMethodBreakdown(mockClient, { sortField: 'DB_TIME', limit: 5 });
    const pubs = await getPubBreakdown(mockClient, { sortField: 'OBSERVER_REUSE_RATIO' });

    expect(mockQuery.mock.calls[0][0].variables).toMatchObject({ sortField: 'DB_TIME', limit: 5 });
    expect(methods.rows[0].formattedValue).toBe('50ms');
    expect(pubs.unit).toBe('percent');
    expect(pubs.rows[0].formattedValue).toBe('42.5%');
    expect(pubs.rows[0]).not.toHaveProperty('estimatedTotalTimeMs');
  });

  it('handles empty and null rows', async () => {
    mockQuery
      .mockResolvedValueOnce({ data: { httpBreakdown: [{ name: 'x', sortedValue: null, throughput: null }] } })
      .mockResolvedValueOnce({ data: { httpBreakdown: [] } });
    const result = await getHttpBreakdown(mockClient, { sortField: 'RES_TIME' });
    expect(result.rows[0].formattedValue).toBe('N/A');
    expect(result.rows[0]).not.toHaveProperty('estimatedTotalTimeMs');
  });

  it('rejects unknown sort fields', async () => {
    await expect(
      getHttpBreakdown(mockClient, { sortField: 'NOPE' as never }),
    ).rejects.toThrow();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('maps sort fields to units', () => {
    expect(getBreakdownUnit('http', 'THROUGHPUT')).toBe('perMin');
    expect(getBreakdownUnit('http', '_5xx')).toBe('count');
    expect(getBreakdownUnit('method', 'WAIT_TIME')).toBe('avgMs');
    expect(getBreakdownUnit('method', 'SENT_MSG_SIZE')).toBe('bytes');
    expect(getBreakdownUnit('pub', 'SUB_RATE')).toBe('perMin');
    expect(getBreakdownUnit('pub', 'FETCHED_DOCUMENTS')).toBe('count');
  });
});
