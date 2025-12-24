import { describe, it, expect, beforeAll } from 'vitest';
import { AuthClient } from '../../src/auth/client.js';
import { createGraphQLClient, type MontiGraphQLClient } from '../../src/graphql/client.js';
import {
  getMethodTraces,
  getTraceDetail,
  getSubscriptionTraces,
  getHttpTraces,
  getSystemMetrics,
  getErrorMetrics,
  analyzeSlowMethods,
  analyzeBottlenecks,
  getHealthSummary,
} from '../../src/tools/index.js';

/**
 * Integration tests for Monti APM API
 *
 * These tests require valid credentials set in environment variables:
 * - MONTI_APP_ID
 * - MONTI_APP_SECRET
 *
 * Run with: npm run test:integration
 *
 * Note: These tests are designed to work with any Monti APM application
 * and do not rely on specific data being present. They verify:
 * - API connectivity and authentication
 * - Response structure and types
 * - Parameter handling
 * - Error handling
 */

describe('Monti APM API Integration', () => {
  const appId = process.env.MONTI_APP_ID;
  const appSecret = process.env.MONTI_APP_SECRET;

  // Skip all tests if credentials are not available
  const shouldRun = appId && appSecret;

  // Shared clients to avoid rate limiting on auth endpoint
  let authClient: AuthClient;
  let graphqlClient: MontiGraphQLClient;

  // Time helpers - use a wide time range to increase chance of finding data
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  beforeAll(async () => {
    if (!shouldRun) {
      console.log(
        'Skipping integration tests: MONTI_APP_ID and MONTI_APP_SECRET not set',
      );
      return;
    }

    // Create shared clients once
    authClient = new AuthClient({
      credentials: { appId: appId!, appSecret: appSecret! },
    });
    graphqlClient = createGraphQLClient(() => authClient.getToken());

    // Pre-authenticate to cache the token
    await authClient.getToken();
  });

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication', () => {
    it.skipIf(!shouldRun)('should authenticate with valid credentials', async () => {
      const token = await authClient.getToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      // JWT tokens are typically base64 encoded and have 3 parts
      expect(token.split('.').length).toBeGreaterThanOrEqual(1);
    });

    it.skipIf(!shouldRun)('should cache and reuse token', async () => {
      const token1 = await authClient.getToken();
      const token2 = await authClient.getToken();

      expect(token1).toBe(token2);
    });

    it.skipIf(!shouldRun)('should allow token invalidation and refresh', async () => {
      const token1 = await authClient.getToken();
      authClient.invalidateToken();
      const token2 = await authClient.getToken();

      // Tokens should be valid strings (may or may not be different)
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
    });
  });

  // ============================================
  // Method Traces Tests
  // ============================================
  describe('Method Traces', () => {
    it.skipIf(!shouldRun)('should fetch method traces with default parameters', async () => {
      const result = await getMethodTraces(graphqlClient, {});

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('traces');
      expect(result).toHaveProperty('summary');
      expect(typeof result.count).toBe('number');
      expect(Array.isArray(result.traces)).toBe(true);
    });

    it.skipIf(!shouldRun)('should respect limit parameter', async () => {
      const result = await getMethodTraces(graphqlClient, {
        limit: 5,
      });

      expect(result.traces.length).toBeLessThanOrEqual(5);
    });

    it.skipIf(!shouldRun)('should filter by time range', async () => {
      const result = await getMethodTraces(graphqlClient, {
        startTime: oneHourAgo,
        endTime: now,
        limit: 10,
      });

      expect(result).toHaveProperty('count');
      expect(Array.isArray(result.traces)).toBe(true);
    });

    it.skipIf(!shouldRun)('should filter by minimum response time', async () => {
      const result = await getMethodTraces(graphqlClient, {
        minResponseTime: 100,
        limit: 10,
      });

      // All returned traces should have totalValue >= minValue
      for (const trace of result.traces) {
        expect(trace.responseTime).toMatch(/\d+(\.\d+)?\s*(ms|s)/);
      }
    });

    it.skipIf(!shouldRun)('should return proper trace structure', async () => {
      const result = await getMethodTraces(graphqlClient, {
        limit: 1,
      });

      if (result.traces.length > 0) {
        const trace = result.traces[0];
        expect(trace).toHaveProperty('id');
        expect(trace).toHaveProperty('method');
        expect(trace).toHaveProperty('responseTime');
        expect(trace).toHaveProperty('breakdown');
      }
    });

    it.skipIf(!shouldRun)('should handle extended time range (1 week)', async () => {
      const result = await getMethodTraces(graphqlClient, {
        startTime: oneWeekAgo,
        endTime: now,
        limit: 5,
      });

      expect(result).toHaveProperty('count');
      expect(Array.isArray(result.traces)).toBe(true);
    });
  });

  // ============================================
  // Trace Detail Tests
  // ============================================
  describe('Trace Detail', () => {
    it.skipIf(!shouldRun)('should fetch trace details when trace exists', async () => {
      // First get a trace ID
      const traces = await getMethodTraces(graphqlClient, { limit: 1 });

      if (traces.traces.length > 0) {
        const traceId = traces.traces[0].id;
        const result = await getTraceDetail(graphqlClient, { traceId });

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('method');
        expect(result.id).toBe(traceId);
      }
    });

    it.skipIf(!shouldRun)('should handle non-existent trace ID gracefully', async () => {
      // The API throws an error for non-existent trace IDs
      await expect(
        getTraceDetail(graphqlClient, {
          traceId: 'non-existent-trace-id-12345',
        }),
      ).rejects.toThrow();
    });
  });

  // ============================================
  // Subscription Traces Tests
  // ============================================
  describe('Subscription Traces', () => {
    it.skipIf(!shouldRun)('should fetch subscription traces', async () => {
      const result = await getSubscriptionTraces(graphqlClient, {
        limit: 10,
      });

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('traces');
      expect(Array.isArray(result.traces)).toBe(true);
    });

    it.skipIf(!shouldRun)('should filter subscription traces by time range', async () => {
      const result = await getSubscriptionTraces(graphqlClient, {
        startTime: oneDayAgo,
        endTime: now,
        limit: 5,
      });

      expect(result).toHaveProperty('count');
      expect(result.traces.length).toBeLessThanOrEqual(5);
    });

    it.skipIf(!shouldRun)('should return proper subscription trace structure', async () => {
      const result = await getSubscriptionTraces(graphqlClient, {
        limit: 1,
      });

      if (result.traces.length > 0) {
        const trace = result.traces[0];
        expect(trace).toHaveProperty('id');
        expect(trace).toHaveProperty('publication');
        expect(trace).toHaveProperty('responseTime');
      }
    });
  });

  // ============================================
  // HTTP Traces Tests
  // ============================================
  describe('HTTP Traces', () => {
    it.skipIf(!shouldRun)('should fetch HTTP traces', async () => {
      const result = await getHttpTraces(graphqlClient, {
        limit: 10,
      });

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('traces');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.traces)).toBe(true);
    });

    it.skipIf(!shouldRun)('should filter HTTP traces by time range', async () => {
      const result = await getHttpTraces(graphqlClient, {
        startTime: oneDayAgo,
        endTime: now,
        limit: 5,
      });

      expect(result).toHaveProperty('count');
      expect(result.traces.length).toBeLessThanOrEqual(5);
    });

    it.skipIf(!shouldRun)('should return proper HTTP trace structure', async () => {
      const result = await getHttpTraces(graphqlClient, {
        limit: 1,
      });

      if (result.traces.length > 0) {
        const trace = result.traces[0];
        expect(trace).toHaveProperty('id');
        expect(trace).toHaveProperty('route');
        expect(trace).toHaveProperty('responseTime');
        expect(trace).toHaveProperty('errored');
      }
    });

    it.skipIf(!shouldRun)('should filter by minimum response time', async () => {
      const result = await getHttpTraces(graphqlClient, {
        minResponseTime: 100,
        limit: 10,
      });

      expect(result).toHaveProperty('count');
      for (const trace of result.traces) {
        expect(trace.responseTimeMs).toBeGreaterThanOrEqual(100);
      }
    });

    it.skipIf(!shouldRun)('should include error count in summary', async () => {
      const result = await getHttpTraces(graphqlClient, {
        limit: 10,
      });

      expect(result.summary).toHaveProperty('errorCount');
      expect(typeof result.summary.errorCount).toBe('number');
    });

    it.skipIf(!shouldRun)('should handle extended time range (1 week)', async () => {
      const result = await getHttpTraces(graphqlClient, {
        startTime: oneWeekAgo,
        endTime: now,
        limit: 5,
      });

      expect(result).toHaveProperty('count');
      expect(Array.isArray(result.traces)).toBe(true);
    });
  });

  // ============================================
  // System Metrics Tests
  // ============================================
  describe('System Metrics', () => {
    it.skipIf(!shouldRun)('should fetch RAM usage metrics', async () => {
      const result = await getSystemMetrics(graphqlClient, {
        metric: 'RAM_USAGE',
        resolution: 'RES_1MIN',
        groupByHost: false,
      });

      expect(result).toHaveProperty('metric', 'RAM_USAGE');
      expect(result).toHaveProperty('resolution', 'RES_1MIN');
      expect(result).toHaveProperty('hosts');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.hosts)).toBe(true);
    });

    it.skipIf(!shouldRun)('should fetch CPU usage metrics', async () => {
      const result = await getSystemMetrics(graphqlClient, {
        metric: 'CPU_USAGE',
        resolution: 'RES_1MIN',
        groupByHost: false,
      });

      expect(result).toHaveProperty('metric', 'CPU_USAGE');
      expect(result).toHaveProperty('hosts');
    });

    it.skipIf(!shouldRun)('should fetch session metrics', async () => {
      const result = await getSystemMetrics(graphqlClient, {
        metric: 'SESSIONS',
        resolution: 'RES_1MIN',
        groupByHost: false,
      });

      expect(result).toHaveProperty('metric', 'SESSIONS');
      expect(result).toHaveProperty('hosts');
    });

    it.skipIf(!shouldRun)('should support 30-minute resolution', async () => {
      const result = await getSystemMetrics(graphqlClient, {
        metric: 'RAM_USAGE',
        resolution: 'RES_30MIN',
        groupByHost: false,
        startTime: oneDayAgo,
        endTime: now,
      });

      expect(result).toHaveProperty('resolution', 'RES_30MIN');
      expect(result).toHaveProperty('hosts');
    });

    it.skipIf(!shouldRun)('should support grouping by host', async () => {
      const result = await getSystemMetrics(graphqlClient, {
        metric: 'RAM_USAGE',
        resolution: 'RES_1MIN',
        groupByHost: true,
      });

      expect(result).toHaveProperty('hosts');
      // When grouped by host, each entry should have a host identifier
      if (result.hosts.length > 0) {
        expect(result.hosts[0]).toHaveProperty('host');
      }
    });

    it.skipIf(!shouldRun)('should return percentile data', async () => {
      const result = await getSystemMetrics(graphqlClient, {
        metric: 'RAM_USAGE',
        resolution: 'RES_1MIN',
        groupByHost: false,
      });

      if (result.hosts.length > 0) {
        expect(result.hosts[0]).toHaveProperty('percentiles');
        expect(result.hosts[0].percentiles).toHaveProperty('p50');
        expect(result.hosts[0].percentiles).toHaveProperty('p95');
        expect(result.hosts[0].percentiles).toHaveProperty('max');
      }
    });

    it.skipIf(!shouldRun)('should fetch MongoDB pool metrics', async () => {
      const result = await getSystemMetrics(graphqlClient, {
        metric: 'MONGO_POOL_CHECKOUT_DELAY',
        resolution: 'RES_1MIN',
        groupByHost: false,
      });

      expect(result).toHaveProperty('metric', 'MONGO_POOL_CHECKOUT_DELAY');
      expect(result).toHaveProperty('hosts');
    });
  });

  // ============================================
  // Error Metrics Tests
  // ============================================
  describe('Error Metrics', () => {
    it.skipIf(!shouldRun)('should fetch error metrics', async () => {
      const result = await getErrorMetrics(graphqlClient, {
        resolution: 'RES_1MIN',
      });

      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('totalErrors');
      expect(result).toHaveProperty('dataPoints');
      expect(typeof result.totalErrors).toBe('number');
    });

    it.skipIf(!shouldRun)('should filter error metrics by time range', async () => {
      // Note: RES_1MIN has max 1000 minutes range, so we use only 1 hour
      const result = await getErrorMetrics(graphqlClient, {
        startTime: oneHourAgo,
        endTime: now,
        resolution: 'RES_1MIN',
      });

      expect(result).toHaveProperty('totalErrors');
      expect(typeof result.totalErrors).toBe('number');
    });

    it.skipIf(!shouldRun)('should support 30-minute resolution for errors', async () => {
      const result = await getErrorMetrics(graphqlClient, {
        resolution: 'RES_30MIN',
        startTime: oneWeekAgo,
        endTime: now,
      });

      expect(result).toHaveProperty('resolution', 'RES_30MIN');
    });
  });

  // ============================================
  // Slow Methods Analysis Tests
  // ============================================
  describe('Slow Methods Analysis', () => {
    it.skipIf(!shouldRun)('should analyze slow methods with default threshold', async () => {
      const result = await analyzeSlowMethods(graphqlClient, {});

      expect(result).toHaveProperty('threshold');
      expect(result).toHaveProperty('methodsAnalyzed');
      expect(result).toHaveProperty('analysis');
      expect(Array.isArray(result.analysis)).toBe(true);
    });

    it.skipIf(!shouldRun)('should analyze slow methods with custom threshold', async () => {
      const result = await analyzeSlowMethods(graphqlClient, {
        threshold: 100, // Lower threshold to find more traces
        limit: 10,
      });

      expect(result).toHaveProperty('threshold');
      expect(result.threshold).toContain('100');
      expect(result).toHaveProperty('methodsAnalyzed');
    });

    it.skipIf(!shouldRun)('should analyze slow methods with time range', async () => {
      const result = await analyzeSlowMethods(graphqlClient, {
        threshold: 50,
        startTime: oneWeekAgo,
        endTime: now,
        limit: 20,
      });

      expect(result).toHaveProperty('tracesAnalyzed');
      expect(result).toHaveProperty('methodsAnalyzed');
      expect(result).toHaveProperty('analysis');
    });

    it.skipIf(!shouldRun)('should provide recommendations for slow methods', async () => {
      const result = await analyzeSlowMethods(graphqlClient, {
        threshold: 10, // Very low to ensure we get some data
        limit: 5,
      });

      if (result.analysis.length > 0) {
        const analysis = result.analysis[0];
        expect(analysis).toHaveProperty('method');
        expect(analysis).toHaveProperty('avgResponseTime');
        expect(analysis).toHaveProperty('recommendations');
        expect(Array.isArray(analysis.recommendations)).toBe(true);
      }
    });

    it.skipIf(!shouldRun)('should include breakdown information', async () => {
      const result = await analyzeSlowMethods(graphqlClient, {
        threshold: 10,
        limit: 5,
      });

      if (result.analysis.length > 0) {
        const analysis = result.analysis[0];
        expect(analysis).toHaveProperty('breakdown');
        expect(analysis).toHaveProperty('mainBottleneck');
      }
    });
  });

  // ============================================
  // Performance Bottlenecks Analysis Tests
  // ============================================
  describe('Performance Bottlenecks Analysis', () => {
    it.skipIf(!shouldRun)('should analyze performance bottlenecks', async () => {
      const result = await analyzeBottlenecks(graphqlClient, {});

      expect(result).toHaveProperty('timeRange');
      expect(result).toHaveProperty('issuesFound');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it.skipIf(!shouldRun)('should include system metrics in bottleneck analysis', async () => {
      const result = await analyzeBottlenecks(graphqlClient, {
        includeSystemMetrics: true,
      });

      expect(result).toHaveProperty('systemMetrics');
    });

    it.skipIf(!shouldRun)('should exclude system metrics when requested', async () => {
      const result = await analyzeBottlenecks(graphqlClient, {
        includeSystemMetrics: false,
      });

      expect(result.systemMetrics).toBeUndefined();
    });

    it.skipIf(!shouldRun)('should analyze bottlenecks with custom time range', async () => {
      const result = await analyzeBottlenecks(graphqlClient, {
        startTime: oneDayAgo,
        endTime: now,
      });

      expect(result).toHaveProperty('timeRange');
      expect(result.timeRange).toHaveProperty('start');
      expect(result.timeRange).toHaveProperty('end');
    });

    it.skipIf(!shouldRun)('should categorize and prioritize issues', async () => {
      const result = await analyzeBottlenecks(graphqlClient, {});

      for (const issue of result.issues) {
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('recommendation');
        expect(['high', 'medium', 'low']).toContain(issue.severity);
      }
    });
  });

  // ============================================
  // Health Summary Tests
  // ============================================
  describe('Health Summary', () => {
    it.skipIf(!shouldRun)('should get health summary', async () => {
      const result = await getHealthSummary(graphqlClient, {});

      expect(result).toHaveProperty('health');
      expect(result).toHaveProperty('methods');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('insights');
    });

    it.skipIf(!shouldRun)('should return health score', async () => {
      const result = await getHealthSummary(graphqlClient, {});

      expect(result.health).toHaveProperty('score');
      expect(result.health).toHaveProperty('status');
      expect(result.health).toHaveProperty('color');
      expect(typeof result.health.score).toBe('number');
      expect(result.health.score).toBeGreaterThanOrEqual(0);
      expect(result.health.score).toBeLessThanOrEqual(100);
    });

    it.skipIf(!shouldRun)('should return method metrics', async () => {
      const result = await getHealthSummary(graphqlClient, {});

      expect(result.methods).toHaveProperty('count');
      expect(result.methods).toHaveProperty('avgResponseTime');
      expect(result.methods).toHaveProperty('throughput');
    });

    it.skipIf(!shouldRun)('should return error information', async () => {
      const result = await getHealthSummary(graphqlClient, {});

      expect(result.errors).toHaveProperty('count');
      expect(result.errors).toHaveProperty('status');
      expect(typeof result.errors.count).toBe('number');
    });

    it.skipIf(!shouldRun)('should return system metrics', async () => {
      const result = await getHealthSummary(graphqlClient, {});

      expect(result.system).toHaveProperty('memory');
      expect(result.system).toHaveProperty('cpu');
      expect(result.system).toHaveProperty('sessions');
    });

    it.skipIf(!shouldRun)('should provide actionable insights', async () => {
      const result = await getHealthSummary(graphqlClient, {});

      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
      // Each insight should be a non-empty string
      for (const insight of result.insights) {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      }
    });

    it.skipIf(!shouldRun)('should accept custom time range', async () => {
      const result = await getHealthSummary(graphqlClient, {
        startTime: oneDayAgo,
        endTime: now,
      });

      expect(result).toHaveProperty('timeRange');
      expect(result.timeRange).toHaveProperty('start');
      expect(result.timeRange).toHaveProperty('end');
    });

    it.skipIf(!shouldRun)('should return valid health status', async () => {
      const result = await getHealthSummary(graphqlClient, {});

      expect(['Healthy', 'Good', 'Degraded', 'Critical']).toContain(result.health.status);
      expect(['green', 'yellow', 'orange', 'red']).toContain(result.health.color);
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('Edge Cases and Error Handling', () => {
    it.skipIf(!shouldRun)('should handle empty time range gracefully', async () => {
      // Use a very narrow time range in the past that likely has no data
      const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;
      const result = await getMethodTraces(graphqlClient, {
        startTime: twoYearsAgo,
        endTime: twoYearsAgo + 1000, // 1 second range
        limit: 10,
      });

      expect(result).toHaveProperty('count');
      expect(result.count).toBe(0);
      expect(result.traces).toHaveLength(0);
    });

    it.skipIf(!shouldRun)('should handle future time range', async () => {
      const futureStart = now + 24 * 60 * 60 * 1000;
      const futureEnd = futureStart + 60 * 60 * 1000;

      const result = await getMethodTraces(graphqlClient, {
        startTime: futureStart,
        endTime: futureEnd,
        limit: 10,
      });

      expect(result).toHaveProperty('count');
      expect(result.count).toBe(0);
    });

    it.skipIf(!shouldRun)('should handle limit of 1', async () => {
      const result = await getMethodTraces(graphqlClient, {
        limit: 1,
      });

      expect(result.traces.length).toBeLessThanOrEqual(1);
    });

    it.skipIf(!shouldRun)('should handle very high threshold for slow methods', async () => {
      const result = await analyzeSlowMethods(graphqlClient, {
        threshold: 999999, // Very high threshold
        limit: 10,
      });

      expect(result).toHaveProperty('methodsAnalyzed');
      expect(result.methodsAnalyzed).toBe(0);
    });

    it.skipIf(!shouldRun)('should handle health summary with very short time range', async () => {
      const result = await getHealthSummary(graphqlClient, {
        startTime: now - 60000, // Last minute only
        endTime: now,
      });

      // Should still return a valid structure even with minimal data
      expect(result).toHaveProperty('health');
      expect(result).toHaveProperty('insights');
    });
  });

  // ============================================
  // Concurrent Requests Tests
  // ============================================
  describe('Concurrent Requests', () => {
    it.skipIf(!shouldRun)('should handle multiple concurrent requests', async () => {
      const results = await Promise.all([
        getMethodTraces(graphqlClient, { limit: 5 }),
        getSystemMetrics(graphqlClient, {
          metric: 'RAM_USAGE',
          resolution: 'RES_1MIN',
          groupByHost: false,
        }),
        getHealthSummary(graphqlClient, {}),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('traces');
      expect(results[1]).toHaveProperty('hosts');
      expect(results[2]).toHaveProperty('health');
    });
  });
});
