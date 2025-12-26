/**
 * Publication and subscription optimization recommendations
 * from Monti APM docs and Meteor Guide.
 */

import type { Recommendation } from '../types.js';

const DOCS_BASE = 'https://docs.montiapm.com';
const METEOR_GUIDE = 'https://guide.meteor.com';

export const PUBLICATION_RECOMMENDATIONS: Recommendation[] = [
  // Field Filtering
  {
    id: 'field-filtering',
    bottleneckType: 'db',
    category: 'publications',
    severity: 'high',
    title: 'Use Field Filtering in Publications',
    description:
      'Only publish required fields to reduce network bandwidth, memory usage, and database load.',
    actions: [
      'Identify publications that return more fields than needed',
      'Add fields projection to limit returned data',
      'Create computed/summary fields for large text content',
      'Consider different projections for list vs detail views',
    ],
    codeExample: `// Bad: Publishing all fields
Meteor.publish('posts', function() {
  return Posts.find({});
});

// Good: Only publish required fields
Meteor.publish('posts', function() {
  return Posts.find({}, {
    fields: {
      title: 1,
      summary: 1,      // Use summary instead of full content
      authorId: 1,
      createdAt: 1,
      commentCount: 1  // Computed field instead of fetching comments
    }
  });
});

// For detail view, publish more fields
Meteor.publish('postDetail', function(postId) {
  return Posts.find({ _id: postId }, {
    fields: {
      title: 1,
      content: 1,      // Full content only for detail view
      authorId: 1,
      createdAt: 1,
      tags: 1
    }
  });
});`,
    docUrl: `${DOCS_BASE}/academy/reducing-pubsub-data-usage`,
    applicableWhen: (metrics) =>
      metrics.responseTime > 200 || metrics.estimatedMemory > 50 * 1024 * 1024,
  },

  // Pagination
  {
    id: 'implement-pagination',
    bottleneckType: 'db',
    category: 'publications',
    severity: 'high',
    title: 'Implement Pagination in Publications',
    description:
      'Always add limits to cursors to prevent publishing large datasets that impact performance.',
    actions: [
      'Add limit parameter to publications',
      'Implement cursor-based or offset pagination',
      'Consider infinite scroll with incremental loading',
      'Set reasonable default limits',
    ],
    codeExample: `// Bad: No limit - could return thousands of documents
Meteor.publish('allPosts', function() {
  return Posts.find({});
});

// Good: Paginated publication
Meteor.publish('posts', function(page = 1, limit = 20) {
  check(page, Match.Integer);
  check(limit, Match.Integer);

  const safeLimit = Math.min(limit, 100); // Cap maximum
  const skip = (page - 1) * safeLimit;

  return Posts.find({}, {
    sort: { createdAt: -1 },
    skip,
    limit: safeLimit,
    fields: { title: 1, summary: 1, createdAt: 1 }
  });
});

// Better: Cursor-based pagination (more efficient)
Meteor.publish('postsAfter', function(lastCreatedAt, limit = 20) {
  const selector = lastCreatedAt
    ? { createdAt: { $lt: lastCreatedAt } }
    : {};

  return Posts.find(selector, {
    sort: { createdAt: -1 },
    limit: Math.min(limit, 100)
  });
});`,
    docUrl: `${DOCS_BASE}/academy/reducing-pubsub-data-usage`,
    applicableWhen: (metrics) =>
      metrics.activeDocs > 100 || metrics.subRate > 50,
  },

  // Null Check Pattern
  {
    id: 'null-check-userid',
    bottleneckType: 'low_observer_reuse',
    category: 'publications',
    severity: 'medium',
    title: 'Check userId Before Returning Cursor',
    description:
      'Publications should check if the user is logged in before returning cursors to prevent unnecessary observers for anonymous users.',
    actions: [
      'Add this.userId check at the start of publications',
      'Call this.ready() and return for anonymous users if appropriate',
      'This prevents creating unique observers for each anonymous session',
    ],
    codeExample: `// Bad: Creates observer even for anonymous users
Meteor.publish('userDashboard', function() {
  return DashboardData.find({ userId: this.userId });
  // If this.userId is null, creates a unique query each time
});

// Good: Check userId first
Meteor.publish('userDashboard', function() {
  if (!this.userId) {
    return this.ready(); // No data for anonymous users
  }

  return DashboardData.find({ userId: this.userId });
});

// For public data with user-specific additions
Meteor.publish('publicPosts', function() {
  const cursors = [Posts.find({ isPublic: true })];

  if (this.userId) {
    cursors.push(Posts.find({ authorId: this.userId }));
  }

  return cursors;
});`,
    docUrl: `${DOCS_BASE}/academy/improving-cpu-network-usage`,
    applicableWhen: (metrics) => metrics.observerReuse < 0.75,
  },

  // Methods vs Publications
  {
    id: 'use-methods-not-pubs',
    bottleneckType: 'high_update_ratio',
    category: 'publications',
    severity: 'medium',
    title: 'Use Methods Instead of Publications',
    description:
      'Replace publications with methods when live data updates are not essential, reducing WebSocket overhead.',
    actions: [
      'Identify publications where data rarely changes',
      'Replace with methods using .fetchAsync()',
      'Implement manual refresh in the UI when needed',
      'Reduces server memory and connection overhead',
    ],
    codeExample: `// Instead of a publication:
Meteor.publish('historicalData', function(year) {
  return HistoricalData.find({ year });
});

// Use a method for static/rarely-changing data:
Meteor.methods({
  async getHistoricalData(year) {
    check(year, Number);

    return HistoricalData.find(
      { year },
      { fields: { month: 1, value: 1 } }
    ).fetchAsync();
  }
});

// Client-side usage:
const data = await Meteor.callAsync('getHistoricalData', 2024);
// Manually refresh when needed instead of maintaining subscription`,
    docUrl: `${METEOR_GUIDE}/performance-improvement`,
    applicableWhen: (metrics) =>
      metrics.updateRatio < 0.1 || metrics.lifespan > 300000,
  },

  // Server-Side Aggregations
  {
    id: 'server-side-aggregation',
    bottleneckType: 'db',
    category: 'publications',
    severity: 'medium',
    title: 'Use Server-Side Aggregations',
    description:
      'Perform counts and aggregations on the server instead of publishing all documents for client-side calculation.',
    actions: [
      'Use publish-counts or tmeasday:publish-counts package for counts',
      'Create computed/denormalized fields for frequently needed aggregations',
      'Use MongoDB aggregation pipeline for complex calculations',
    ],
    codeExample: `import { Counts } from 'meteor/tmeasday:publish-counts';

// Bad: Publishing all docs just to count them
Meteor.publish('allCommentsForCount', function(postId) {
  return Comments.find({ postId }); // Client will just count these
});

// Good: Publish just the count
Meteor.publish('commentCount', function(postId) {
  Counts.publish(this, 'comments-' + postId,
    Comments.find({ postId })
  );
});

// Client-side usage:
Counts.get('comments-' + postId);

// For complex aggregations, use methods:
Meteor.methods({
  async getPostStats(postId) {
    const [result] = await Posts.rawCollection().aggregate([
      { $match: { _id: postId } },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments'
        }
      },
      {
        $project: {
          commentCount: { $size: '$comments' },
          avgRating: { $avg: '$comments.rating' }
        }
      }
    ]).toArray();
    return result;
  }
});`,
    docUrl: `${DOCS_BASE}/academy/reducing-pubsub-data-usage`,
    applicableWhen: (metrics) =>
      metrics.activeDocs > 500 || metrics.estimatedMemory > 100 * 1024 * 1024,
  },

  // Observer Normalization
  {
    id: 'normalize-queries',
    bottleneckType: 'low_observer_reuse',
    category: 'publications',
    severity: 'high',
    title: 'Normalize Queries for Observer Reuse',
    description:
      'Standardize query parameters to maximize observer reuse, reducing database load and memory consumption.',
    actions: [
      'Round timestamps to hour boundaries',
      'Normalize user-provided limits to fixed increments',
      'Ensure query selectors and options are identical for reuse',
      'Use consistent sort orders',
    ],
    codeExample: `// Bad: Each user gets a unique query - no observer reuse
Meteor.publish('recentPosts', function() {
  const oneHourAgo = new Date(Date.now() - 3600000);
  return Posts.find({ createdAt: { $gte: oneHourAgo } });
});

// Good: Normalized to hour boundary - observers can be reused
Meteor.publish('recentPosts', function() {
  const now = Date.now();
  const currentHour = now - (now % 3600000); // Round to hour
  const oneHourAgo = new Date(currentHour - 3600000);

  return Posts.find({ createdAt: { $gte: oneHourAgo } });
});

// Bad: User-specified limits create unique queries
Meteor.publish('posts', function(limit) {
  return Posts.find({}, { limit });
});

// Good: Normalize limits to standard values
Meteor.publish('posts', function(requestedLimit) {
  const standardLimits = [10, 25, 50, 100];
  const limit = standardLimits.find(l => l >= requestedLimit) || 100;

  return Posts.find({}, { limit });
});`,
    docUrl: `${DOCS_BASE}/academy/improving-cpu-network-usage`,
    applicableWhen: (metrics) => metrics.observerReuse < 0.75,
  },

  // Short Lifespan
  {
    id: 'investigate-short-lifespan',
    bottleneckType: 'low_observer_reuse',
    category: 'publications',
    severity: 'medium',
    title: 'Investigate Short Subscription Lifespans',
    description:
      'Very short subscription lifespans may indicate unnecessary resubscription due to reactive dependencies or routing issues.',
    actions: [
      'Check for reactive dependencies causing resubscriptions',
      'Ensure route parameters are stable',
      'Consider subscription caching with SubsCache',
      'Review component mounting/unmounting patterns',
    ],
    codeExample: `// Using SubsCache to prevent unnecessary resubscription
import { SubsCache } from 'meteor/ccorcos:subs-cache';

const subsCache = new SubsCache({
  expireAfter: 5, // Keep subscriptions for 5 minutes after last use
  cacheLimit: 10  // Cache up to 10 subscriptions
});

// In your component:
Template.postsList.onCreated(function() {
  // This subscription will be reused if component remounts quickly
  this.autorun(() => {
    subsCache.subscribe('posts', Session.get('category'));
  });
});

// Or with React:
function PostsList({ category }) {
  useTracker(() => {
    subsCache.subscribe('posts', category);
    return Posts.find({ category }).fetch();
  }, [category]);
}`,
    docUrl: `${DOCS_BASE}/knowledge-base/glossary`,
    applicableWhen: (metrics) => metrics.lifespan < 30000,
  },
];
