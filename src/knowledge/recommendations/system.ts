/**
 * System optimization recommendations for CPU, memory, and scaling.
 * Based on Monti APM docs and Meteor Guide.
 */

import type { Recommendation } from '../types.js';

const DOCS_BASE = 'https://docs.montiapm.com';
const METEOR_GUIDE = 'https://guide.meteor.com';

export const SYSTEM_RECOMMENDATIONS: Recommendation[] = [
  // CPU Recommendations
  {
    id: 'high-cpu-profile',
    bottleneckType: 'cpu',
    category: 'system',
    severity: 'high',
    title: 'Record CPU Profile to Identify Bottlenecks',
    description:
      'High CPU usage requires profiling to identify which functions consume the most processing time.',
    actions: [
      'Use Monti APM to record a CPU profile',
      'Analyze the flame graph to find hot paths',
      'Look for unexpected synchronous operations',
      'Identify methods or publications causing high CPU',
    ],
    codeExample: `// In Monti APM Dashboard:
// 1. Go to CPU Profiling
// 2. Click "Record Profile"
// 3. Select duration (30-60 seconds recommended)
// 4. Reproduce the high CPU scenario
// 5. Analyze the flame graph

// Common CPU hogs to look for:
// - JSON.parse/stringify on large objects
// - Regular expressions on large strings
// - Synchronous crypto operations
// - Complex array operations (sort, filter, reduce)`,
    docUrl: `${DOCS_BASE}/record-cpu-profile`,
    applicableWhen: (metrics) =>
      metrics.cpuUsage > 70 || metrics.cpuP95 > 80,
  },

  {
    id: 'event-loop-optimization',
    bottleneckType: 'cpu',
    category: 'system',
    severity: 'high',
    title: 'Optimize Event Loop Utilization',
    description:
      'High event loop utilization indicates the Node.js single thread is saturated, causing request queuing.',
    actions: [
      'Break up long synchronous operations',
      'Use setImmediate to yield to event loop',
      'Move CPU-intensive work to worker threads',
      'Consider horizontal scaling',
    ],
    codeExample: `// Break up long operations
async function processLargeArray(items) {
  const CHUNK_SIZE = 100;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    await processChunk(chunk);

    // Yield to event loop between chunks
    await new Promise(resolve => setImmediate(resolve));
  }
}

// Use worker threads for CPU-intensive work
import { Worker } from 'worker_threads';

function runInWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-computation.js', {
      workerData: data
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}`,
    docUrl: `${DOCS_BASE}/knowledge-base/glossary`,
    applicableWhen: (metrics) => metrics.eventLoopUtilization > 70,
  },

  // Memory Recommendations
  {
    id: 'high-memory-investigation',
    bottleneckType: 'memory',
    category: 'system',
    severity: 'high',
    title: 'Investigate High Memory Usage',
    description:
      'High memory usage may indicate memory leaks, large datasets in publications, or inefficient caching.',
    actions: [
      'Check publication memory estimates in Monti APM',
      'Look for publications with low observer reuse',
      'Review in-memory caches for unbounded growth',
      'Take heap snapshots to identify large objects',
    ],
    codeExample: `// Check Monti APM for:
// 1. Publications with high "Estimated Memory"
// 2. Low "Observer Reuse" ratios
// 3. High "Active Docs" counts

// Common memory issues:

// 1. Unbounded caches - add size limits
const cache = new Map();
const MAX_CACHE_SIZE = 1000;

function setCache(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

// 2. Large objects in session - use references instead
// Bad: storing full documents in session
Session.set('currentUser', Meteor.user());

// Good: store only ID
Session.set('currentUserId', Meteor.userId());

// 3. Listener leaks - always clean up
const listener = () => { /* ... */ };
emitter.on('event', listener);
// Make sure to remove when done:
emitter.off('event', listener);`,
    docUrl: `${DOCS_BASE}/academy/optimize-memory-usage`,
    applicableWhen: (metrics) => metrics.memoryUsage > 1.5 * 1024 * 1024 * 1024,
  },

  {
    id: 'improve-observer-reuse',
    bottleneckType: 'memory',
    category: 'system',
    severity: 'medium',
    title: 'Improve Observer Reuse to Reduce Memory',
    description:
      'Low observer reuse causes duplicate data in memory. V8 can share objects when observers are reused.',
    actions: [
      'Review publications with low observer reuse ratios',
      'Normalize query parameters (timestamps, limits)',
      'Use redis-oplog namespaces for better isolation',
      'Target 75%+ observer reuse ratio',
    ],
    codeExample: `// Memory formula:
// Estimated Memory = (Active Docs × Avg Doc Size) × (1 - Observer Reuse Ratio)

// Example: 10,000 docs × 1KB × (1 - 0.25) = 7.5MB wasted
// With 75% reuse: 10,000 docs × 1KB × (1 - 0.75) = 2.5MB

// See publication recommendations for observer reuse patterns`,
    docUrl: `${DOCS_BASE}/academy/optimize-memory-usage`,
    applicableWhen: (metrics) =>
      metrics.observerReuse < 0.75 && metrics.memoryUsage > 500 * 1024 * 1024,
  },

  // Scaling Recommendations
  {
    id: 'vertical-scaling',
    bottleneckType: 'cpu',
    category: 'system',
    severity: 'medium',
    title: 'Consider Vertical Scaling',
    description:
      'If consistently hitting resource limits, adding CPU and RAM to existing instances may help.',
    actions: [
      'Review resource usage patterns over time',
      'Increase container/VM resources',
      'Monitor if bottleneck shifts to other resources',
      'Vertical scaling has limits - consider horizontal for long term',
    ],
    codeExample: `// Galaxy scaling example:
// 1. Go to App Settings > Containers
// 2. Increase container size (Compact → Standard → Double)

// For self-hosted:
// - Increase Node.js heap size
// node --max-old-space-size=4096 main.js

// Monitor after scaling:
// - CPU should drop proportionally
// - Memory headroom should increase
// - Response times should improve`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) =>
      metrics.cpuP95 > 80 || metrics.memoryUsage > 1.5 * 1024 * 1024 * 1024,
  },

  {
    id: 'horizontal-scaling',
    bottleneckType: 'cpu',
    category: 'system',
    severity: 'medium',
    title: 'Implement Horizontal Scaling',
    description:
      'Distribute load across multiple container instances for better scalability and redundancy.',
    actions: [
      'Configure sticky sessions for WebSocket connections',
      'Use shared session store (Redis) if needed',
      'Set up load balancer with health checks',
      'Configure autoscaling triggers',
    ],
    codeExample: `// Galaxy autoscaling settings:
// - Min containers: 2 (for redundancy)
// - Max containers: based on expected load
// - Scale up trigger: 30% CPU or 40% memory
// - Scale down trigger: lower thresholds with delay

// Nginx sticky session example:
upstream meteor {
  ip_hash;  # Sticky sessions by IP
  server app1:3000;
  server app2:3000;
}

// Or use Redis for session sharing:
// meteor add session
// Configure MONGO_URL to shared database
// Configure Redis for redis-oplog`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) => metrics.sessions > 500,
  },

  {
    id: 'autoscaling-triggers',
    bottleneckType: 'cpu',
    category: 'system',
    severity: 'low',
    title: 'Configure Autoscaling Triggers',
    description:
      'Set up automatic scaling based on CPU, memory, and connection thresholds.',
    actions: [
      'Configure scale-up at 30% CPU or 40% memory',
      'Set scale-down at lower thresholds with delay',
      'Adjust based on traffic patterns (business hours vs off-hours)',
      'Revisit settings after each optimization round',
    ],
    codeExample: `// Recommended Galaxy autoscaling configuration:
{
  "containers": {
    "min": 2,
    "max": 10
  },
  "triggers": {
    "scaleUp": {
      "cpu": 30,
      "memory": 40,
      "connections": 500
    },
    "scaleDown": {
      "cpu": 10,
      "memory": 20,
      "delay": 300  // Wait 5 minutes before scaling down
    }
  }
}

// Time-based scaling for predictable patterns:
// - Increase min containers before business hours
// - Decrease during known low-traffic periods`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) => metrics.sessions > 200,
  },

  // Caching Recommendations
  {
    id: 'implement-redis-cache',
    bottleneckType: 'db',
    category: 'system',
    severity: 'medium',
    title: 'Implement Redis Caching',
    description:
      'Cache frequently accessed queries and computed data in Redis to reduce database load.',
    actions: [
      'Identify hot queries using Monti APM',
      'Implement cache-aside pattern',
      'Set appropriate TTLs based on data freshness requirements',
      'Implement cache invalidation on writes',
    ],
    codeExample: `import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});
await redis.connect();

// Cache-aside pattern
async function getPopularPosts() {
  const CACHE_KEY = 'popular_posts';
  const CACHE_TTL = 300; // 5 minutes

  // Try cache first
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const posts = await Posts.find(
    { isPublished: true },
    {
      sort: { views: -1 },
      limit: 10,
      fields: { title: 1, summary: 1, views: 1 }
    }
  ).fetchAsync();

  // Store in cache
  await redis.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(posts));

  return posts;
}

// Invalidate on write
Posts.after.update(function(userId, doc) {
  if (doc.views > 1000) {
    redis.del('popular_posts');
  }
});`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) =>
      metrics.dbTime > 200 || metrics.responseTime > 500,
  },

  // Connection Management
  {
    id: 'high-session-count',
    bottleneckType: 'memory',
    category: 'system',
    severity: 'medium',
    title: 'Optimize for High Session Counts',
    description:
      'Large numbers of concurrent sessions require careful resource management and may indicate need for scaling.',
    actions: [
      'Review subscription patterns for unnecessary live queries',
      'Implement connection pooling if using external services',
      'Consider WebSocket connection limits per instance',
      'Scale horizontally to distribute connections',
    ],
    codeExample: `// Monitor session distribution in Monti APM:
// System Dashboard > Sessions metric

// Per-container recommendation:
// - Compact: ~500 sessions
// - Standard: ~1000 sessions
// - Double: ~2000 sessions

// If sessions are unevenly distributed:
// - Check sticky session configuration
// - Review load balancer health checks

// Reduce session memory footprint:
// - Minimize per-connection state
// - Use efficient subscription patterns
// - Consider methods over subscriptions for static data`,
    docUrl: `${DOCS_BASE}/dashboards/system-dashboard`,
    applicableWhen: (metrics) => metrics.sessions > 1000,
  },
];
