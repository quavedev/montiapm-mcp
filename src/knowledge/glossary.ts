/**
 * Metric definitions and glossary from Monti APM documentation.
 * Based on https://docs.montiapm.com/knowledge-base/glossary
 */

import type { MetricDefinition } from './types.js';

const DOCS_BASE = 'https://docs.montiapm.com';

/**
 * Complete glossary of Monti APM metrics.
 */
export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // Response Time Metrics
  responseTime: {
    name: 'Response Time',
    description:
      'The time the server takes to execute your method or publication, including wait time.',
    interpretation:
      'For publications, this is calculated until the server emits the ready message - the time to fetch all cursor data and push to client.',
    relatedMetrics: ['waitTime', 'dbTime', 'computeTime', 'totalResponseTime'],
    optimizationTips: [
      'Break down into component times (DB, compute, wait) to identify bottleneck',
      'Target < 500ms for most methods',
      'Use this.unblock() if wait time is high',
    ],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#response-time`,
  },

  totalResponseTime: {
    name: 'Total Response Time',
    description:
      'The sum of response times from all subscriptions or method calls within the selected time frame.',
    interpretation:
      'Useful for understanding aggregate server load rather than individual request performance.',
    relatedMetrics: ['responseTime', 'throughput'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#total-response-time`,
  },

  waitTime: {
    name: 'Wait Time',
    description:
      'Time spent waiting in queue due to DDP message ordering from the same client.',
    interpretation:
      'High wait time indicates methods/subscriptions are blocking each other. Use this.unblock() for independent operations.',
    relatedMetrics: ['responseTime', 'waitedOn'],
    optimizationTips: [
      'Add this.unblock() at start of independent methods',
      'Be careful with methods that need to maintain order',
      'High wait time often indicates blocking HTTP or email calls',
    ],
    docUrl: `${DOCS_BASE}/academy/managing-waittime`,
  },

  dbTime: {
    name: 'Database Time',
    description: 'Time spent on MongoDB database operations.',
    interpretation:
      'Queries taking > 100ms likely need indexes. Check query patterns and add appropriate compound indexes.',
    relatedMetrics: ['responseTime', 'computeTime'],
    optimizationTips: [
      'Add indexes for queries > 100ms',
      'Use ESR pattern: Equality, Sort, Range',
      'Add limits to all queries',
      'Avoid RegEx queries',
    ],
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
  },

  computeTime: {
    name: 'Compute Time',
    description: 'CPU time spent on computation within the method or publication.',
    interpretation:
      'High compute time may indicate CPU-intensive operations that could block the event loop.',
    relatedMetrics: ['responseTime', 'eventLoopUtilization'],
    optimizationTips: [
      'Cache computed results when possible',
      'Move heavy computation to workers',
      'Break up long synchronous operations',
    ],
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
  },

  httpTime: {
    name: 'HTTP Time',
    description: 'Time spent making external HTTP requests.',
    interpretation:
      'External API calls can significantly impact response time. Consider caching and parallel requests.',
    relatedMetrics: ['responseTime', 'asyncTime'],
    optimizationTips: [
      'Cache API responses with appropriate TTL',
      'Use Promise.all for independent requests',
      'Set reasonable timeouts',
    ],
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
  },

  asyncTime: {
    name: 'Async Time',
    description: 'Time spent in async operations (promises, callbacks).',
    interpretation:
      'High async time may indicate sequential awaits that could be parallelized.',
    relatedMetrics: ['responseTime', 'httpTime'],
    optimizationTips: [
      'Use Promise.all for independent operations',
      'Avoid sequential awaits in loops',
      'Consider p-limit for controlled concurrency',
    ],
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
  },

  emailTime: {
    name: 'Email Time',
    description: 'Time spent sending emails.',
    interpretation:
      'Email sending should be deferred to avoid blocking the method response.',
    relatedMetrics: ['responseTime', 'waitTime'],
    optimizationTips: [
      'Use Meteor.defer() for email sending',
      'Consider a job queue for reliability',
      'Log email status for debugging',
    ],
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
  },

  // Throughput Metrics
  throughput: {
    name: 'Throughput',
    description: 'The rate of messages processed, measured in methods per minute.',
    interpretation:
      'Higher throughput indicates more traffic. Compare with response time to understand capacity.',
    relatedMetrics: ['responseTime', 'subRate'],
    optimizationTips: [
      'Optimize high-throughput methods first for maximum impact',
      'Consider rate limiting to prevent overload',
    ],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#throughput`,
  },

  subRate: {
    name: 'SubRate',
    description: 'The number of subscriptions made within a minute.',
    interpretation:
      'High subRate may indicate frequent resubscription or lack of caching.',
    relatedMetrics: ['throughput', 'lifespan'],
    optimizationTips: [
      'Use SubsCache to prevent unnecessary resubscription',
      'Check for reactive dependencies causing resubscribes',
      'Consider methods for static data',
    ],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#subrate`,
  },

  // Network Metrics
  networkLatency: {
    name: 'Network Latency',
    description:
      'Estimated time spent sending data to the client, calculated from data size and bandwidth.',
    formula: 'Network Latency = Data sent to clients / Bandwidth',
    interpretation:
      'High network latency may indicate publishing too much data. Consider field filtering.',
    relatedMetrics: ['totalNetworkLatency', 'activeDocs'],
    optimizationTips: [
      'Use field projections to limit data',
      'Implement pagination',
      'Create summary fields for large content',
    ],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#network-latency`,
  },

  totalNetworkLatency: {
    name: 'Total Network Latency',
    description:
      'Sum of network latency from all subscriptions within the selected time frame.',
    interpretation: 'Aggregate network impact across all publications.',
    relatedMetrics: ['networkLatency'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#total-network-latency`,
  },

  // Observer Metrics
  observerReuse: {
    name: 'Observer Reuse',
    description:
      'Percentage of observers reused in your publication. Meteor reuses observers for identical cursors.',
    interpretation:
      'Above 75% is optimal. Low reuse means creating redundant observers, wasting CPU, memory, and database resources.',
    relatedMetrics: ['observerReuseRatio', 'observerLifetime', 'estimatedMemory'],
    optimizationTips: [
      'Normalize query parameters (timestamps, limits)',
      'Check userId before returning cursors',
      'Use redis-oplog namespaces for isolation',
      'Ensure identical selectors and options',
    ],
    docUrl: `${DOCS_BASE}/academy/improving-cpu-network-usage`,
  },

  observerReuseRatio: {
    name: 'Observer Reuse Ratio',
    description:
      'Percentage of reused observer handlers in Live Queries.',
    interpretation:
      'Close to 100% means most observers are reused (optimal). Close to 0% means little reuse.',
    relatedMetrics: ['observerReuse', 'liveUpdates'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#observer-reuse-ratio`,
  },

  observerLifetime: {
    name: 'Observer Lifetime',
    description: 'The lifetime of an observer from creation to destruction.',
    interpretation:
      'Very short lifetimes may indicate observer churn or frequent resubscription.',
    relatedMetrics: ['observerReuse', 'lifespan'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#observer-lifetime`,
  },

  liveUpdates: {
    name: 'Live Updates',
    description:
      'Count of all observer activities after initialization - all changes except "Added (initially)".',
    interpretation:
      'High live updates indicate frequent data changes being pushed to clients.',
    relatedMetrics: ['updateRatio', 'observerReuse'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#live-updates`,
  },

  // Publication Metrics
  lifespan: {
    name: 'Lifespan',
    description:
      'Average lifetime of a subscription from request to unsubscription or disconnect.',
    interpretation:
      'Very short lifespans may indicate issues with reactive dependencies or routing.',
    relatedMetrics: ['subRate', 'observerLifetime'],
    optimizationTips: [
      'Use SubsCache for frequently accessed subscriptions',
      'Check for unnecessary reactive dependencies',
      'Review component mounting patterns',
    ],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#lifespan`,
  },

  activeSubs: {
    name: 'Active Subs',
    description: 'Number of active subscriptions in the selected time range.',
    interpretation:
      'High active subs with low observer reuse indicates inefficient subscription patterns.',
    relatedMetrics: ['observerReuse', 'activeDocs'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#active-subs`,
  },

  activeDocs: {
    name: 'Active Docs',
    description: 'Number of documents that exist inside the publications.',
    interpretation:
      'Large numbers of active docs increase memory usage. Consider pagination.',
    relatedMetrics: ['estimatedMemory', 'activeSubs'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#estimated-memory-usage`,
  },

  updateRatio: {
    name: 'Update Ratio',
    description:
      'Percentage of updated data against total data sent to client.',
    formula: 'Update Ratio = Total updated data / Total added data',
    interpretation:
      'Low ratio means data rarely changes (consider methods instead of pubs). High ratio (>100%) means lots of updates after initial add.',
    relatedMetrics: ['liveUpdates', 'networkLatency'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#update-ratio`,
  },

  estimatedMemory: {
    name: 'Estimated Memory Usage',
    description:
      'Estimated memory used by publications. V8 caches objects, so actual usage is typically lower.',
    formula:
      'Memory Usage = (Active Docs × Average Doc Size) × (1 - Observer Reuse Ratio)',
    interpretation:
      'Higher observer reuse dramatically reduces memory consumption through V8 object sharing.',
    relatedMetrics: ['activeDocs', 'observerReuse', 'memoryUsage'],
    optimizationTips: [
      'Improve observer reuse to reduce memory',
      'Limit document counts with pagination',
      'Use field projections to reduce doc size',
    ],
    docUrl: `${DOCS_BASE}/academy/optimize-memory-usage`,
  },

  // System Metrics
  cpuUsage: {
    name: 'CPU Usage',
    description: 'Percentage of CPU being used by the application.',
    interpretation:
      'Consistently high CPU may require optimization or scaling.',
    relatedMetrics: ['cpuP95', 'eventLoopUtilization'],
    optimizationTips: [
      'Record CPU profile to identify hot paths',
      'Move heavy computation to workers',
      'Consider horizontal scaling',
    ],
    docUrl: `${DOCS_BASE}/dashboards/system-dashboard`,
  },

  cpuP95: {
    name: 'CPU P95',
    description: '95th percentile of CPU usage.',
    interpretation:
      'P95 above 80% indicates frequent CPU saturation during peak load.',
    relatedMetrics: ['cpuUsage', 'eventLoopUtilization'],
    docUrl: `${DOCS_BASE}/dashboards/system-dashboard`,
  },

  memoryUsage: {
    name: 'Memory Usage',
    description: 'RAM usage of the application.',
    interpretation:
      'Continuously increasing memory may indicate a leak. Sudden spikes may indicate inefficient data handling.',
    relatedMetrics: ['estimatedMemory', 'sessions'],
    optimizationTips: [
      'Check publication memory estimates',
      'Improve observer reuse',
      'Review in-memory caches for unbounded growth',
    ],
    docUrl: `${DOCS_BASE}/academy/optimize-memory-usage`,
  },

  eventLoopUtilization: {
    name: 'Event Loop Utilization',
    description:
      'Percentage of time the Node.js event loop is actively processing.',
    formula:
      'Event Loop Utilization = (Time spent on Event Loop / Total time elapsed) × 100',
    interpretation:
      'High utilization indicates the single thread is saturated, causing request queuing.',
    relatedMetrics: ['cpuUsage', 'responseTime'],
    optimizationTips: [
      'Break up long synchronous operations',
      'Use setImmediate to yield to event loop',
      'Move CPU-intensive work to workers',
    ],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#event-loop-utilization`,
  },

  sessions: {
    name: 'Sessions',
    description: 'Number of active client sessions/connections.',
    interpretation:
      'High session counts require more memory and connection management.',
    relatedMetrics: ['memoryUsage', 'activeSubs'],
    docUrl: `${DOCS_BASE}/dashboards/system-dashboard`,
  },

  // Live Query Metrics
  liveQuery: {
    name: 'Live Query',
    description:
      'A cursor returned from a publication that watches changes in the DB and sends them to clients.',
    interpretation:
      'Each live query creates or reuses an observer to watch for changes.',
    relatedMetrics: ['observer', 'observerReuse'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#live-query`,
  },

  observer: {
    name: 'Observer',
    description:
      'Watches the DB for changes on a Live Query. Can be Oplog-based (real-time) or Polling-based.',
    interpretation:
      'Oplog observers are more efficient. Polling observers are fallback for unsupported queries.',
    relatedMetrics: ['liveQuery', 'observerReuse'],
    docUrl: `${DOCS_BASE}/knowledge-base/glossary#observer`,
  },
};

/**
 * Get a metric definition by name.
 */
export function getMetricDefinition(
  metricName: string,
): MetricDefinition | undefined {
  return METRIC_DEFINITIONS[metricName];
}

/**
 * Get all metric names.
 */
export function getAllMetricNames(): string[] {
  return Object.keys(METRIC_DEFINITIONS);
}

/**
 * Search metric definitions by keyword.
 */
export function searchMetrics(keyword: string): MetricDefinition[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(METRIC_DEFINITIONS).filter(
    (def) =>
      def.name.toLowerCase().includes(lowerKeyword) ||
      def.description.toLowerCase().includes(lowerKeyword),
  );
}
