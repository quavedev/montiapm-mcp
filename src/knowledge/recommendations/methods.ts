/**
 * Method optimization recommendations from Monti APM docs and Meteor Guide.
 */

import type { Recommendation } from '../types.js';

const DOCS_BASE = 'https://docs.montiapm.com';
const METEOR_GUIDE = 'https://guide.meteor.com';

export const METHOD_RECOMMENDATIONS: Recommendation[] = [
  // Database Recommendations
  {
    id: 'db-add-indexes',
    bottleneckType: 'db',
    category: 'methods',
    severity: 'high',
    title: 'Add MongoDB Indexes',
    description:
      'Database queries taking more than 100ms typically need indexes. Use the ESR (Equality, Sort, Range) method for compound index design.',
    actions: [
      'Identify slow queries using Monti APM traces',
      'Run MongoDB explain() to analyze query execution plan',
      'Create compound indexes following ESR order: Equality fields first, then Sort fields, then Range fields',
      'Ensure indexes fit in memory for optimal performance',
      'Avoid RegEx queries - they scan entire collections',
    ],
    codeExample: `// ESR Index Pattern: Equality, Sort, Range
// For query: { status: 'active', category: 'news' }, sort: { createdAt: -1 }
Posts.createIndex({
  status: 1,      // Equality
  category: 1,    // Equality
  createdAt: -1   // Sort
});

// Always add limits to prevent full collection scans
Posts.find(selector, { limit: 50 });`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) =>
      metrics.db > 100 || (metrics.db / (metrics.total || 1)) > 0.5,
  },

  {
    id: 'db-batch-queries',
    bottleneckType: 'db',
    category: 'methods',
    severity: 'medium',
    title: 'Batch Database Queries',
    description:
      'Avoid N+1 query problems by batching related data retrieval. Fetch all related documents in a single query.',
    actions: [
      'Identify loops that make individual database queries',
      'Collect all IDs first, then fetch in a single query using $in',
      'Use MongoDB aggregation for complex multi-collection retrievals',
    ],
    codeExample: `// Bad: N+1 queries
const posts = Posts.find().fetch();
posts.forEach(post => {
  const author = Users.findOne(post.authorId); // N queries!
});

// Good: Batched query
const posts = Posts.find().fetch();
const authorIds = posts.map(p => p.authorId);
const authors = Users.find({ _id: { $in: authorIds } }).fetch();
const authorMap = Object.fromEntries(authors.map(a => [a._id, a]));`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) => metrics.db > 200,
  },

  // Wait Time Recommendations
  {
    id: 'use-unblock',
    bottleneckType: 'wait',
    category: 'methods',
    severity: 'high',
    title: 'Use this.unblock() to Reduce Wait Time',
    description:
      'Methods and subscriptions from the same client are processed sequentially. Use this.unblock() for independent operations to allow parallel processing.',
    actions: [
      'Identify methods with high wait time in Monti APM traces',
      'Add this.unblock() at the start of methods that do not depend on other DDP messages',
      'Be careful with methods that need to maintain order with other operations',
      'Consider the user experience - some operations should block to prevent race conditions',
    ],
    codeExample: `Meteor.methods({
  detectCountry() {
    this.unblock(); // Allow other messages to process in parallel

    // This HTTP call won't block other methods from this client
    const response = HTTP.get('https://geo.api.example.com/detect');
    return response.data.country;
  },

  sendWelcomeEmail(userId) {
    this.unblock(); // Email sending shouldn't block the client

    Email.send({
      to: user.email,
      subject: 'Welcome!',
      text: 'Thanks for signing up.'
    });
  }
});`,
    docUrl: `${DOCS_BASE}/academy/managing-waittime`,
    applicableWhen: (metrics) =>
      metrics.wait > 100 || (metrics.wait / (metrics.total || 1)) > 0.3,
  },

  // Compute Recommendations
  {
    id: 'offload-heavy-tasks',
    bottleneckType: 'compute',
    category: 'methods',
    severity: 'high',
    title: 'Offload Heavy Tasks to Workers',
    description:
      'Heavy tasks that consume significant CPU should be moved to separate worker processes to prevent blocking the main event loop.',
    actions: [
      'Identify CPU-intensive methods using Monti APM',
      'Move heavy computations to a separate worker service',
      'Use job queues (like Bull or Agenda) to manage background tasks',
      'Return immediately to the client and notify when complete',
    ],
    codeExample: `// Instead of processing in the method:
Meteor.methods({
  async generateReport(params) {
    this.unblock();

    // Queue the job instead of processing inline
    const jobId = await Jobs.insert({
      type: 'generate-report',
      params,
      status: 'pending',
      createdAt: new Date()
    });

    // Return immediately - process in worker
    return { jobId, status: 'queued' };
  }
});

// In a separate worker process:
// Poll for jobs and process them without blocking main app`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) =>
      metrics.compute > 200 || (metrics.compute / (metrics.total || 1)) > 0.4,
  },

  {
    id: 'cache-computed-results',
    bottleneckType: 'compute',
    category: 'methods',
    severity: 'medium',
    title: 'Cache Computed Results',
    description:
      'Cache expensive computations using Redis or in-memory caching to avoid repeated calculations.',
    actions: [
      'Identify repetitive expensive calculations',
      'Implement caching with appropriate TTL',
      'Use Redis for distributed caching across instances',
      'Invalidate cache when underlying data changes',
    ],
    codeExample: `import { createClient } from 'redis';

const redis = createClient();

Meteor.methods({
  async getExpensiveAnalytics(params) {
    const cacheKey = \`analytics:\${JSON.stringify(params)}\`;

    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Compute if not cached
    const result = await expensiveComputation(params);

    // Cache for 5 minutes
    await redis.setEx(cacheKey, 300, JSON.stringify(result));

    return result;
  }
});`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) => metrics.compute > 150,
  },

  // HTTP Recommendations
  {
    id: 'cache-http-responses',
    bottleneckType: 'http',
    category: 'methods',
    severity: 'medium',
    title: 'Cache External HTTP Responses',
    description:
      'Cache responses from external APIs to reduce latency and avoid rate limits.',
    actions: [
      'Identify frequently called external APIs',
      'Implement caching with appropriate TTL based on data freshness requirements',
      'Handle cache invalidation properly',
      'Consider fallback strategies for API failures',
    ],
    codeExample: `const apiCache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function fetchWithCache(url) {
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url);
  const data = await response.json();

  apiCache.set(url, { data, timestamp: Date.now() });
  return data;
}`,
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    applicableWhen: (metrics) =>
      metrics.http > 500 || (metrics.http / (metrics.total || 1)) > 0.3,
  },

  {
    id: 'parallelize-http-calls',
    bottleneckType: 'http',
    category: 'methods',
    severity: 'medium',
    title: 'Parallelize HTTP Calls',
    description:
      'Make independent HTTP calls in parallel using Promise.all instead of sequential awaits.',
    actions: [
      'Identify sequential HTTP calls that are independent',
      'Use Promise.all to run them concurrently',
      'Handle partial failures gracefully with Promise.allSettled if needed',
    ],
    codeExample: `// Bad: Sequential calls
async function fetchAllData() {
  const users = await fetch('/api/users').then(r => r.json());
  const posts = await fetch('/api/posts').then(r => r.json());
  const comments = await fetch('/api/comments').then(r => r.json());
  return { users, posts, comments };
}

// Good: Parallel calls
async function fetchAllData() {
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  return { users, posts, comments };
}`,
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    applicableWhen: (metrics) => metrics.http > 300,
  },

  // Email Recommendations
  {
    id: 'defer-email-sending',
    bottleneckType: 'email',
    category: 'methods',
    severity: 'medium',
    title: 'Defer Email Sending',
    description:
      'Use Meteor.defer() to send emails asynchronously, preventing method response delays.',
    actions: [
      'Wrap Email.send calls with Meteor.defer()',
      'Consider using a proper email queue for reliability',
      'Log email sending status for debugging',
    ],
    codeExample: `Meteor.methods({
  createAccount(userData) {
    const userId = Accounts.createUser(userData);

    // Don't wait for email to send
    Meteor.defer(() => {
      try {
        Email.send({
          to: userData.email,
          subject: 'Welcome!',
          text: 'Thanks for signing up.'
        });
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    });

    return userId; // Returns immediately
  }
});`,
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    applicableWhen: (metrics) => metrics.email > 100,
  },

  // Async Recommendations
  {
    id: 'optimize-async-operations',
    bottleneckType: 'async',
    category: 'methods',
    severity: 'medium',
    title: 'Optimize Async Operations',
    description:
      'Ensure promises are properly parallelized and not awaited sequentially when they can run concurrently.',
    actions: [
      'Review async/await patterns for unnecessary sequential execution',
      'Use Promise.all for independent async operations',
      'Consider using Promise.allSettled when partial failures are acceptable',
    ],
    codeExample: `// Bad: Sequential async
async function processItems(items) {
  const results = [];
  for (const item of items) {
    results.push(await processItem(item)); // Waits for each
  }
  return results;
}

// Good: Parallel async
async function processItems(items) {
  return Promise.all(items.map(item => processItem(item)));
}

// Good: Parallel with controlled concurrency
import pLimit from 'p-limit';
const limit = pLimit(5); // Max 5 concurrent

async function processItems(items) {
  return Promise.all(
    items.map(item => limit(() => processItem(item)))
  );
}`,
    docUrl: `${DOCS_BASE}/academy/make-your-app-faster`,
    applicableWhen: (metrics) =>
      (metrics.async / (metrics.total || 1)) > 0.3,
  },

  // Rate Limiting
  {
    id: 'implement-rate-limiting',
    bottleneckType: 'compute',
    category: 'methods',
    severity: 'medium',
    title: 'Implement Rate Limiting',
    description:
      'Add rate limiting to prevent self-inflicted DDoS from users repeatedly triggering expensive operations.',
    actions: [
      'Install the ddp-rate-limiter package',
      'Configure rate limits for expensive methods',
      'Set different limits for authenticated vs anonymous users',
      'Log rate limit hits for monitoring',
    ],
    codeExample: `import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

// Limit expensive method to 5 calls per 10 seconds per user
DDPRateLimiter.addRule({
  type: 'method',
  name: 'generateExpensiveReport',
  userId(userId) { return true; }, // Apply to all users
  connectionId() { return true; }
}, 5, 10000);

// Stricter limit for anonymous users
DDPRateLimiter.addRule({
  type: 'method',
  name: 'search',
  userId(userId) { return !userId; }, // Only anonymous
  connectionId() { return true; }
}, 2, 5000);`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: () => true, // Always applicable as a best practice
  },
];
