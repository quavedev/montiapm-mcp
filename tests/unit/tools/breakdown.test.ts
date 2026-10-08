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

  it('adds estimated total time for per-request averages', async () => {
    mockQuery.mockResolvedValueOnce({
      data: { httpBreakdown: [{ name: 'POST-/api/pods', sortedValue: 1000, throughput: 10 }] },
    });

    const result = await getHttpBreakdown(mockClient, { sortField: 'DB', startTime: 0, endTime: 60 * 60_000 });

    expect(result.unit).toBe('avgMs');
    // 1000 ms × 10/min × 60 min
    expect(result.rows[0].estimatedTotalTimeMs).toBe(600_000);
    expect(result.rows[0].formattedValue).toBe('1.00s');
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
    mockQuery.mockResolvedValueOnce({ data: { httpBreakdown: [{ name: 'x', sortedValue: null, throughput: null }] } });
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
