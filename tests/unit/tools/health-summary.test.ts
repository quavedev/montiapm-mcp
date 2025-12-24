import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHealthSummary } from '../../../src/tools/health-summary.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getHealthSummary', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockResponses = (overrides: {
    methods?: unknown[];
    errors?: { points: number[] };
    ram?: { p50: number; p95: number; max: number };
    cpu?: { p50: number; p95: number; max: number };
    sessions?: { p50: number; p95: number; max: number };
  } = {}) => {
    return [
      { data: { meteorMethodBreakdown: overrides.methods ?? [] } },
      { data: { meteorErrorMetrics: [overrides.errors ?? { points: [] }] } },
      { data: { meteorSystemMetrics: [overrides.ram ?? { p50: 512 * 1024 * 1024, p95: 600 * 1024 * 1024, max: 700 * 1024 * 1024 }] } },
      { data: { meteorSystemMetrics: [overrides.cpu ?? { p50: 30, p95: 50, max: 60 }] } },
      { data: { meteorSystemMetrics: [overrides.sessions ?? { p50: 100, p95: 150, max: 200 }] } },
    ];
  };

  it('should return health summary', async () => {
    const responses = createMockResponses({
      methods: [
        { name: 'method1', sortedValue: 100, throughput: 10 },
        { name: 'method2', sortedValue: 150, throughput: 5 },
      ],
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.health).toBeDefined();
    expect(result.health.score).toBeGreaterThanOrEqual(0);
    expect(result.health.score).toBeLessThanOrEqual(100);
    expect(result.methods).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.system).toBeDefined();
    expect(result.insights).toBeDefined();
  });

  it('should calculate healthy score', async () => {
    const responses = createMockResponses({
      methods: [
        { name: 'method1', sortedValue: 50, throughput: 10 },
      ],
      errors: { points: [] },
      cpu: { p50: 20, p95: 30, max: 40 },
      ram: { p50: 100 * 1024 * 1024, p95: 200 * 1024 * 1024, max: 300 * 1024 * 1024 },
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.health.status).toBe('Healthy');
    expect(result.health.color).toBe('green');
    expect(result.health.score).toBeGreaterThanOrEqual(90);
  });

  it('should detect degraded health due to high errors', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 50, throughput: 10 }],
      errors: { points: Array(100).fill(5) }, // Many errors
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.health.score).toBeLessThan(100);
  });

  it('should detect issues with slow response time', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'slow.method', sortedValue: 2000, throughput: 10 }],
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.insights.some(i => i.toLowerCase().includes('response time'))).toBe(true);
  });

  it('should handle query failures gracefully', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('API error'));

    const result = await getHealthSummary(mockClient, {});

    expect(result.health).toBeDefined();
    expect(result.insights).toBeDefined();
  });

  it('should identify slowest method', async () => {
    const responses = createMockResponses({
      methods: [
        { name: 'fast.method', sortedValue: 50, throughput: 10 },
        { name: 'slow.method', sortedValue: 1500, throughput: 5 },
      ],
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.methods.slowestMethod).toBe('slow.method');
  });

  it('should generate CPU insight when p95 is high', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 50, throughput: 10 }],
      cpu: { p50: 70, p95: 85, max: 95 },
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.insights.some(i => i.toLowerCase().includes('cpu'))).toBe(true);
  });

  it('should generate memory insight when p95 is high', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 50, throughput: 10 }],
      ram: { p50: 1024 * 1024 * 1024, p95: 2 * 1024 * 1024 * 1024, max: 2.5 * 1024 * 1024 * 1024 },
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.insights.some(i => i.toLowerCase().includes('memory'))).toBe(true);
  });

  it('should generate error insight when errors are detected', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 50, throughput: 10 }],
      errors: { points: [1, 2, 3, 4, 5] },
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.insights.some(i => i.toLowerCase().includes('error'))).toBe(true);
  });

  it('should provide positive insight when all metrics are good', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 50, throughput: 10 }],
      errors: { points: [] },
      cpu: { p50: 20, p95: 30, max: 40 },
      ram: { p50: 100 * 1024 * 1024, p95: 200 * 1024 * 1024, max: 300 * 1024 * 1024 },
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.insights.some(i => i.toLowerCase().includes('performing well') || i.toLowerCase().includes('excellent'))).toBe(true);
  });

  it('should return Good status when score is between 70-89', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 600, throughput: 10 }], // Slow response time
      errors: { points: [1, 2, 3] }, // Some errors
      cpu: { p50: 50, p95: 60, max: 70 },
      ram: { p50: 500 * 1024 * 1024, p95: 600 * 1024 * 1024, max: 700 * 1024 * 1024 },
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.health.status).toBe('Good');
    expect(result.health.color).toBe('yellow');
  });

  it('should return Degraded status when score is between 50-69', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 600, throughput: 10 }], // Slow response time (-20)
      errors: { points: Array(20).fill(5) }, // Many errors (-15)
      cpu: { p50: 80, p95: 75, max: 85 }, // Moderate CPU (-10)
      ram: { p50: 500 * 1024 * 1024, p95: 600 * 1024 * 1024, max: 700 * 1024 * 1024 },
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.health.status).toBe('Degraded');
    expect(result.health.color).toBe('orange');
  });

  it('should return Critical status when score is below 50', async () => {
    const responses = createMockResponses({
      methods: [{ name: 'method1', sortedValue: 600, throughput: 10 }], // Slow response time (-20)
      errors: { points: Array(200).fill(10) }, // Many errors (-30)
      cpu: { p50: 95, p95: 95, max: 100 }, // High CPU (-20)
      ram: { p50: 2.5 * 1024 * 1024 * 1024, p95: 3 * 1024 * 1024 * 1024, max: 3.5 * 1024 * 1024 * 1024 }, // High memory (-20)
    });

    mockQuery
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2])
      .mockResolvedValueOnce(responses[3])
      .mockResolvedValueOnce(responses[4]);

    const result = await getHealthSummary(mockClient, {});

    expect(result.health.status).toBe('Critical');
    expect(result.health.color).toBe('red');
  });
});
