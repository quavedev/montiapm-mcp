import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeBottlenecks } from '../../../src/tools/analyze-bottlenecks.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('analyzeBottlenecks', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze bottlenecks', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: {
          meteorMethodBreakdown: [
            { name: 'slow.method', sortedValue: 2000, throughput: 10 },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          meteorPubBreakdown: [
            { name: 'slow.pub', sortedValue: 1000, throughput: 5 },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [{ p50: 50, p95: 70, max: 90 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [{ p50: 1024 * 1024 * 500, p95: 1024 * 1024 * 700, max: 1024 * 1024 * 900 }],
        },
      });

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issuesFound).toBeGreaterThan(0);
    expect(result.issues).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should identify slow methods', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: {
          meteorMethodBreakdown: [
            { name: 'very.slow', sortedValue: 5000, throughput: 100 },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { meteorPubBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 30, p95: 50, max: 60 }] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 1024 * 1024 * 500, p95: 1024 * 1024 * 600, max: 1024 * 1024 * 700 }] },
      });

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issues.some(i => i.category === 'Slow Methods')).toBe(true);
  });

  it('should identify slow publications', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: { meteorMethodBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: {
          meteorPubBreakdown: [
            { name: 'slow.publication', sortedValue: 3000, throughput: 50 },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 30, p95: 50, max: 60 }] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 1024 * 1024 * 500, p95: 1024 * 1024 * 600, max: 1024 * 1024 * 700 }] },
      });

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issues.some(i => i.category === 'Slow Publications')).toBe(true);
  });

  it('should identify high CPU usage', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: { meteorMethodBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorPubBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 1024 * 1024 * 500, p95: 1024 * 1024 * 600, max: 1024 * 1024 * 700 }] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 80, p95: 95, max: 100 }] },
      });

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issues.some(i => i.category === 'CPU Usage')).toBe(true);
  });

  it('should identify high memory usage', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: { meteorMethodBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorPubBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: {
          meteorSystemMetrics: [{
            p50: 1024 * 1024 * 1024 * 1.2,
            p95: 1024 * 1024 * 1024 * 1.8,
            max: 1024 * 1024 * 1024 * 2.5
          }]
        },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 30, p95: 50, max: 60 }] },
      });

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issues.some(i => i.category === 'Memory Usage')).toBe(true);
  });

  it('should handle query errors gracefully', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'));

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issuesFound).toBe(0);
    expect(result.summary).toContain('No significant');
  });

  it('should exclude system metrics when requested', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: { meteorMethodBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorPubBreakdown: [] },
      });

    const result = await analyzeBottlenecks(mockClient, { includeSystemMetrics: false });

    expect(result.systemMetrics).toBeUndefined();
  });

  it('should identify high volume methods with moderate response time', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: {
          meteorMethodBreakdown: [
            { name: 'high.volume.method', sortedValue: 300, throughput: 2000 },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { meteorPubBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 30, p95: 50, max: 60 }] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [{ p50: 1024 * 1024 * 500, p95: 1024 * 1024 * 600, max: 1024 * 1024 * 700 }] },
      });

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issues.some(i => i.category === 'High Volume Methods')).toBe(true);
  });

  it('should handle missing breakdown data gracefully', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: { meteorMethodBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorPubBreakdown: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [] },
      })
      .mockResolvedValueOnce({
        data: { meteorSystemMetrics: [] },
      });

    const result = await analyzeBottlenecks(mockClient, {});

    expect(result.issuesFound).toBe(0);
  });
});
