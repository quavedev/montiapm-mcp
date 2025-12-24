---
url: "https://docs.montiapm.com/dashboards/live-queries-dashboard"
title: "Live Queries Dashboard"
---

[![Monti APM](https://docs.montiapm.com/images/logo.png)](https://docs.montiapm.com/)

- [Documentation](https://docs.montiapm.com/)
- [Website](https://montiapm.com/)
- [Dashboard](https://app.montiapm.com/)

- [Documentation](https://docs.montiapm.com/)
- [Website](https://montiapm.com/)
- [Dashboard](https://app.montiapm.com/)

- [Introduction](https://docs.montiapm.com/introduction)
- [Getting Started](https://docs.montiapm.com/getting-started)
- #### Meteor Academy

- [Welcome](https://docs.montiapm.com/academy/welcome)
- [Make Your App Faster](https://docs.montiapm.com/academy/make-your-app-faster)
- [Reducing PubSub Data Usage](https://docs.montiapm.com/academy/reducing-pubsub-data-usage)
- [Know Your Observers](https://docs.montiapm.com/academy/know-your-observers)
- [Improve CPU & Network Usage](https://docs.montiapm.com/academy/improving-cpu-network-usage)
- [Optimizing for Live Queries](https://docs.montiapm.com/academy/live-queries)
- [Optimize for Oplog Integration](https://docs.montiapm.com/academy/optimize-your-app-for-oplog)
- [Optimize Memory Usage](https://docs.montiapm.com/academy/optimize-memory-usage)
- [Managing Wait Time](https://docs.montiapm.com/academy/managing-waittime)
- [Understanding Your Meteor App with Monti Debug](https://docs.montiapm.com/academy/understanding-your-meteor-app)
- [Reduce Bandwidth and CPU Waste](https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste)
- [Finding Hidden Secrets](https://docs.montiapm.com/academy/insights)
- [Understanding Mean, Histogram and Percentiles](https://docs.montiapm.com/academy/mean-histogram-and-percentiles)
- [Debugging Response Time Bottlenecks](https://docs.montiapm.com/academy/debugging-response-time-bottlenecks)
- #### Dashboards

- [Overview](https://docs.montiapm.com/dashboards/overview-dashboard)
- [Methods](https://docs.montiapm.com/dashboards/methods-dashboard)
- [PubSub](https://docs.montiapm.com/dashboards/pubsub-dashboard)
- [Live Queries](https://docs.montiapm.com/dashboards/live-queries-dashboard)
- [Jobs](https://docs.montiapm.com/dashboards/jobs-dashboard)
- [System](https://docs.montiapm.com/dashboards/system-dashboard)
- #### CPU Profiling

- [Record Profile](https://docs.montiapm.com/record-cpu-profile)
- [Analyze Profile](https://docs.montiapm.com/analyze-cpu-profile)
- #### Features

- [Alerts](https://docs.montiapm.com/alerts)
- [Error Tracking](https://docs.montiapm.com/knowledge-base/error-tracking)
- [Source Maps](https://docs.montiapm.com/source-maps)
- [API](https://docs.montiapm.com/graphql-api)
- #### Other Resources

- [GDPR](https://docs.montiapm.com/gdpr)
- [Glossary](https://docs.montiapm.com/knowledge-base/glossary)
- [null(autopublish) Publication](https://docs.montiapm.com/knowledge-base/what-is-null(autopublish)-publication)
- [Protect Sensitive Information](https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security)
- [Custom Hostname](https://docs.montiapm.com/knowledge-base/send-data-with-a-custom-hostname)
- [Monti Debug in Production](https://docs.montiapm.com/knowledge-base/monti-debug-in-production)
- [Using Behind Firewall](https://docs.montiapm.com/knowledge-base/using-monti-with-enterprise-firewall)

# Live Queries Dashboard

## [Live Queries Summary](https://docs.montiapm.com/dashboards/live-queries-dashboard\#live-queries-summary)

This is a set of important metrics of your app's Live Queries. It includes following metrics:

- [Fetched Documents](https://docs.montiapm.com/dashboards/live-queries-dashboard#fetched-documents)
- [Live Updates](https://docs.montiapm.com/knowledge-base/glossary#live-updates)
- [Observer Reuse Ratio](https://docs.montiapm.com/knowledge-base/glossary#observer-reuse-ratio)
- [Observe Lifetime](https://docs.montiapm.com/knowledge-base/glossary#observer-lifetime)

## [Fetched Documents](https://docs.montiapm.com/dashboards/live-queries-dashboard\#fetched-documents)

This is the number of documents fetched from MongoDB via [observers](https://docs.montiapm.com/knowledge-base/glossary#observer). Meteor fetches documents from MongoDB in a few different cases. Here are some of them:

- When a new observer is created (for the initial dataset)
- Every 10 seconds, if this observer is not using the oplog
- When the observer’s internal buffer becomes empty (with oplog observers only)

## [Observer Changes](https://docs.montiapm.com/dashboards/live-queries-dashboard\#observer-changes)

Once an [observer](https://docs.montiapm.com/knowledge-base/glossary#observer) is created, it’ll trigger events in a few different scenarios. Here's a list of those event types:

- Added (Initially) - When an observer is created for the first time, it’ll fetch the initial set of documents from MongoDB and trigger this event for each document
- Added - If a new document satisfies the query, then the observer will trigger this event with that document
- Updated - If there is a change to an already added document, then the observer will trigger this event with the changes
- Removed - If an existing document does not satisfy the query, then the observer will trigger this event with that document’s ID

## [Oplog Notifications](https://docs.montiapm.com/dashboards/live-queries-dashboard\#oplog-notifications)

Meteor watches the MongoDB oplog to observe changes happening in the MongoDB. If something happens in the DB, Meteor will receive it as a notification. The notification is attached to a collection. Then, Meteor will forward this notification to most of the observers created for that collection.

There are few different types of oplog notifications. They are:

- Inserted - When a new document is added to the collection
- Updated - When a document is updated in the collection
- Removed - When a document is removed from the collection

Meteor will receive all these notification regardless of whether it has a related observer or not.

## [Total/Reused Observer Handlers](https://docs.montiapm.com/dashboards/live-queries-dashboard\#total%2Freused-observer-handlers)

When a new [Live Query](https://docs.montiapm.com/knowledge-base/glossary#live-query) is created, it’ll create a new [observer](https://docs.montiapm.com/knowledge-base/glossary#observer) that watches the DB for changes. If there is an observer already created for the query, Live Query won’t create a new observer. Instead, it’ll reuse an existing observer.

There is always a handler that sits between the Live Query and the observer.

- Total Observer Handlers refer to the total number of handlers.
- Reused Observer Handlers refer to handler sites between the Live Query and an already created observer.

If the reused count is close to total count, that means Live Queries have created a fewer number of actual observers, which is the ideal case.

Check this [guide](https://docs.montiapm.com/academy/improving-cpu-network-usage#how-to-reuse-observer) to learn how to increase the Reused Observer Handlers count.

## [Live Query Publication Breakdown](https://docs.montiapm.com/dashboards/live-queries-dashboard\#live-query-publication-breakdown)

This is a breakdown of publications sorted by the different metrics related to [Live Queries](https://docs.montiapm.com/knowledge-base/glossary#live-query). They include:

- [Fetched Documents](https://docs.montiapm.com/dashboards/live-queries-dashboard#fetched-documents)
- [Observer Reuse](https://docs.montiapm.com/knowledge-base/glossary#observer-reuse-ratio): Descending
- [Observer Reuse](https://docs.montiapm.com/knowledge-base/glossary#observer-reuse-ratio): Ascending
- [Observer Changes: Total](https://docs.montiapm.com/dashboards/live-queries-dashboard#observer-changes)
- [Observer Changes: Live Updates](https://docs.montiapm.com/knowledge-base/glossary#live-updates)
- [Observer Changes: Added (Initially)](https://docs.montiapm.com/dashboards/live-queries-dashboard#observer-changes)
- [Observer Changes: Added](https://docs.montiapm.com/dashboards/live-queries-dashboard#observer-changes)
- [Observer Changes: Changed](https://docs.montiapm.com/dashboards/live-queries-dashboard#observer-changes)
- [Observer Changes: Removed](https://docs.montiapm.com/dashboards/live-queries-dashboard#observer-changes)
- [Oplog Notifications: Low](https://docs.montiapm.com/dashboards/live-queries-dashboard#oplog-notifications)

_This content originally appeared in the Kadira Knowledge Base._

[PREVIOUS\\
\\
PubSub](https://docs.montiapm.com/dashboards/pubsub-dashboard)

[NEXT\\
\\
Jobs](https://docs.montiapm.com/dashboards/jobs-dashboard)