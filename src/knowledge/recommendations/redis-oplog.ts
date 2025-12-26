/**
 * Redis-Oplog optimization recommendations for scoped reactivity.
 * Based on https://github.com/cult-of-coders/redis-oplog documentation.
 */

import type { Recommendation } from '../types.js';

const REDIS_OPLOG_DOCS = 'https://github.com/cult-of-coders/redis-oplog';

export const REDIS_OPLOG_RECOMMENDATIONS: Recommendation[] = [
  // Namespace for Multi-Tenant
  {
    id: 'use-namespaces',
    bottleneckType: 'no_namespaces',
    category: 'publications',
    severity: 'high',
    title: 'Use Redis-Oplog Namespaces for Multi-Tenant Apps',
    description:
      'Namespaces prefix Redis channels with collection names, enabling efficient multi-tenant isolation and reducing unnecessary reactivity processing.',
    actions: [
      'Add namespace option to publications based on tenant/company ID',
      'Apply matching namespaces to all mutations (insert, update, remove)',
      'Ensure consistency between publication and mutation namespaces',
      'Consider using collection-level configuration for automatic namespacing',
    ],
    codeExample: `// Publication with namespace scoping
Meteor.publish('companyUsers', function(companyId) {
  check(companyId, String);

  if (!this.userId) {
    return this.ready();
  }

  // Only receives updates for this specific company
  return Users.find(
    { companyId },
    { namespace: 'company::' + companyId }
  );
});

// Mutations must use matching namespace
Users.insert(userData, {
  namespace: 'company::' + userData.companyId
});

Users.update(
  { _id: userId },
  { $set: { name: newName } },
  { namespace: 'company::' + companyId }
);

Users.remove(userId, {
  namespace: 'company::' + companyId
});`,
    docUrl: `${REDIS_OPLOG_DOCS}/blob/master/docs/finetuning.md`,
    applicableWhen: (metrics) =>
      metrics.observerReuse < 0.5 || metrics.activeSubs > 100,
  },

  // Channels for Focused Reactivity
  {
    id: 'use-channels',
    bottleneckType: 'low_observer_reuse',
    category: 'publications',
    severity: 'high',
    title: 'Use Channels for Focused Reactivity',
    description:
      'Custom channels enable laser-focused reactivity layers, particularly useful for chat applications with parent threads or nested data structures.',
    actions: [
      'Define channels based on logical groupings (e.g., thread ID, room ID)',
      'Apply channel option to both publications and mutations',
      'Use channels for chat messages, comments, or any nested collections',
      'Consider multiple channels for documents that belong to multiple groups',
    ],
    codeExample: `// Chat messages scoped to thread
Meteor.publish('messagesByThread', function(threadId) {
  check(threadId, String);

  return Messages.find(
    { threadId },
    { channel: 'threads::' + threadId + '::messages' }
  );
});

// New message triggers update only for that thread's subscribers
Messages.insert(messageData, {
  channel: 'threads::' + messageData.threadId + '::messages'
});

// For documents belonging to multiple channels
Meteor.publish('notifications', function() {
  return Notifications.find(
    { userId: this.userId },
    {
      channels: [
        'user::' + this.userId + '::notifications',
        'global::notifications'
      ]
    }
  );
});

// Mutation can target multiple channels
Notifications.insert(data, {
  channels: [
    'user::' + data.userId + '::notifications',
    'global::notifications'
  ]
});`,
    docUrl: `${REDIS_OPLOG_DOCS}/blob/master/docs/finetuning.md`,
    applicableWhen: (metrics) =>
      metrics.observerReuse < 0.6 || metrics.liveUpdates > 1000,
  },

  // Disable Reactivity for Batch Operations
  {
    id: 'disable-reactivity-batch',
    bottleneckType: 'cpu',
    category: 'methods',
    severity: 'medium',
    title: 'Disable Redis Publishing for Batch Operations',
    description:
      'Use {pushToRedis: false} for bulk operations to prevent performance degradation from sending thousands of Redis messages.',
    actions: [
      'Add pushToRedis: false to bulk inserts, updates, and removes',
      'Manually notify clients after batch completion if needed',
      'Consider using synthetic mutations for batch completion notification',
    ],
    codeExample: `Meteor.methods({
  async importBulkData(records) {
    check(records, [Object]);

    // Disable reactivity for bulk insert
    for (const record of records) {
      await Records.insertAsync(record, { pushToRedis: false });
    }

    // Or use rawCollection for even better performance
    await Records.rawCollection().insertMany(records);

    // Optionally notify clients that import is complete
    // using a synthetic mutation or a separate notification
    return { imported: records.length };
  },

  async bulkArchive(selector) {
    // Disable for bulk updates
    const result = await Posts.updateAsync(
      selector,
      { $set: { archived: true, archivedAt: new Date() } },
      { multi: true, pushToRedis: false }
    );

    return { archived: result };
  }
});`,
    docUrl: `${REDIS_OPLOG_DOCS}/blob/master/docs/finetuning.md`,
    applicableWhen: () => true, // Always applicable for batch operations
  },

  // Collection-Level Configuration
  {
    id: 'collection-level-config',
    bottleneckType: 'no_namespaces',
    category: 'publications',
    severity: 'medium',
    title: 'Use Collection-Level Redis-Oplog Configuration',
    description:
      'Configure namespaces and channels at the collection level for consistent, automatic scoping without repeating options everywhere.',
    actions: [
      'Use configureRedisOplog() on collections',
      'Define mutation and cursor configuration functions',
      'Extract scoping logic from individual publications',
      'Ensure all access patterns are covered',
    ],
    codeExample: `// Configure once at collection definition
Messages.configureRedisOplog({
  // Automatic namespace for all mutations
  mutation(options, { event, selector, modifier, doc }) {
    let threadId;

    if (event === 'insert' && doc.threadId) {
      threadId = doc.threadId;
    } else if (selector && selector.threadId) {
      threadId = selector.threadId;
    }

    if (threadId) {
      options.namespace = 'threads::' + threadId;
    }
  },

  // Automatic namespace for all cursors
  cursor(options, selector) {
    if (selector && selector.threadId) {
      options.namespace = 'threads::' + selector.threadId;
    }
  }
});

// Now publications and mutations automatically get namespaced
Meteor.publish('threadMessages', function(threadId) {
  // No need to specify namespace - it's automatic!
  return Messages.find({ threadId });
});

Messages.insert({ threadId, text: 'Hello' });
// Automatically namespaced to threads::{threadId}`,
    docUrl: `${REDIS_OPLOG_DOCS}/blob/master/docs/finetuning.md`,
    applicableWhen: (metrics) => metrics.activeSubs > 50,
  },

  // Synthetic Mutations
  {
    id: 'synthetic-mutations',
    bottleneckType: 'db',
    category: 'publications',
    severity: 'low',
    title: 'Use Synthetic Mutations for UI State',
    description:
      'Transmit temporary state changes (like typing indicators, online status) without database writes using SyntheticMutator.',
    actions: [
      'Identify real-time UI states that do not need persistence',
      'Use SyntheticMutator.update for temporary reactive updates',
      'Ideal for typing indicators, cursor positions, game states',
      'Reduces database writes while maintaining reactivity',
    ],
    codeExample: `import { SyntheticMutator } from 'meteor/cultofcoders:redis-oplog';

// Typing indicator without database writes
Meteor.methods({
  'messages.startTyping'(threadId) {
    check(threadId, String);

    // This updates the client's minimongo without touching the database
    SyntheticMutator.update(
      Threads,
      threadId,
      {
        $addToSet: { currentlyTyping: this.userId }
      },
      { namespace: 'threads::' + threadId }
    );

    // Auto-remove after 5 seconds
    Meteor.setTimeout(() => {
      Meteor.call('messages.stopTyping', threadId);
    }, 5000);
  },

  'messages.stopTyping'(threadId) {
    check(threadId, String);

    SyntheticMutator.update(
      Threads,
      threadId,
      {
        $pull: { currentlyTyping: this.userId }
      },
      { namespace: 'threads::' + threadId }
    );
  }
});

// Online presence without database writes
Meteor.publish('onlineUsers', function(roomId) {
  // Track connection, use synthetic mutations
  const userId = this.userId;

  if (userId) {
    SyntheticMutator.update(Rooms, roomId, {
      $addToSet: { onlineUsers: userId }
    });

    this.onStop(() => {
      SyntheticMutator.update(Rooms, roomId, {
        $pull: { onlineUsers: userId }
      });
    });
  }

  return Rooms.find(roomId, { fields: { onlineUsers: 1 } });
});`,
    docUrl: `${REDIS_OPLOG_DOCS}/blob/master/docs/finetuning.md`,
    applicableWhen: () => true, // Always applicable as an optimization technique
  },

  // Optimistic UI
  {
    id: 'configure-optimistic',
    bottleneckType: 'wait',
    category: 'methods',
    severity: 'low',
    title: 'Configure Optimistic UI Settings',
    description:
      'Redis-Oplog supports optimistic updates for better perceived performance. Configure based on your consistency requirements.',
    actions: [
      'Enable optimistic: true for latency-tolerant operations',
      'Disable for operations requiring strict consistency',
      'Configure defaults in Meteor.settings',
    ],
    codeExample: `// In settings.json
{
  "redisOplog": {
    "redis": {
      "port": 6379,
      "host": "127.0.0.1"
    },
    "mutationDefaults": {
      "optimistic": true,  // Enable optimistic updates by default
      "pushToRedis": true
    }
  }
}

// Override for specific operations that need strict consistency
Payments.insert(paymentData, {
  optimistic: false  // Wait for confirmation before UI update
});

// Enable for better UX on non-critical updates
Comments.insert(commentData, {
  optimistic: true  // Update UI immediately
});`,
    docUrl: `${REDIS_OPLOG_DOCS}`,
    applicableWhen: () => true,
  },

  // Direct Channel Listening
  {
    id: 'direct-id-queries',
    bottleneckType: 'low_observer_reuse',
    category: 'publications',
    severity: 'low',
    title: 'Leverage Direct ID-Based Queries',
    description:
      'Redis-Oplog optimizes ID-based queries by listening to specific document channels instead of the main collection channel.',
    actions: [
      'Use {_id: {$in: ids}} queries when possible',
      'These bypass main collection channel, reducing event processing',
      'Great for watching specific documents by ID',
    ],
    codeExample: `// This query is automatically optimized by redis-oplog
// It listens only to items::id1, items::id2, etc.
// instead of the main items channel
Meteor.publish('selectedItems', function(itemIds) {
  check(itemIds, [String]);

  // Limit the number of IDs to prevent abuse
  const safeIds = itemIds.slice(0, 50);

  // Redis-oplog will listen to specific document channels
  return Items.find({
    _id: { $in: safeIds }
  });
});

// This is more efficient than a complex selector
// because it doesn't need to process all collection events`,
    docUrl: `${REDIS_OPLOG_DOCS}/blob/master/docs/how_it_works.md`,
    applicableWhen: () => true,
  },
];
