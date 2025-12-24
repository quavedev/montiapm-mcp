---
url: "https://docs.montiapm.com/academy/optimize-your-app-for-oplog"
title: "Optimize Your Meteor App for Oplog Integration"
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

# Optimize Your Meteor App for Oplog Integration

[Oplog integration](https://github.com/meteor/meteor/blob/devel/docs/long-form/oplog-observe-driver.md) gives a huge performance boost for Meteor apps, and it's recommended to use oplog with every production Meteor app.

Meteor supports most of the queries with oplog, but there are some edge cases where observers will fall back into an inefficient poll and diff implementation. It's very hard to implement oplog support for those queries (though with Mongo Change Streams it might now be possible).

Therefore, some of the queries in your app may fail to use oplog even if you've integrated oplog support into your app. I will show what those unsupported queries are and how to identify them easily.

## [When You can't Use Oplog](https://docs.montiapm.com/academy/optimize-your-app-for-oplog\#when-you-can't-use-oplog)

Let me show you those edge cases in which oplog support cannot be enabled.

### [Limit Without Sort](https://docs.montiapm.com/academy/optimize-your-app-for-oplog\#limit-without-sort)

If your query has a limit but not a sort specifier, your query can't take advantage of oplog. See below:

```js
Posts.find({category: "meteor"}, {limit: 10});
```

If you add a sort specifier, you can get rid of this issue.

### [Unsupported Operators](https://docs.montiapm.com/academy/optimize-your-app-for-oplog\#unsupported-operators)

Meteor’s oplog integration does not support the `$where` operator or any geo–location specific operators. Therefore, you will need to find an alternative if you require oplog support for those queries.

### [Unsupported Projections](https://docs.montiapm.com/academy/optimize-your-app-for-oplog\#unsupported-projections)

Meteor’s oplog integration relies on MiniMongo for projections. MiniMongo does not support all of the projection operators. One such operator is `$elemMatch`. If you are using such operators in your query, your query won't receive the oplog support.

### [Invalid Selectors](https://docs.montiapm.com/academy/optimize-your-app-for-oplog\#invalid-selectors)

Sometimes, it's possible to have invalid selectors in some of your queries. This may be the result of some runtime behavior. For an example, check out following code:

```js
var remainder = getConfig('remainder');
Posts.find({users: {$mod: [10, remainder]}})
```

Due to a runtime error, it is possible to have the remainder listed as `null`. MiniMongo requires the `$mod` array to be filled with two numbers; therefore, oplog support won't be enabled for the above query.

### [Unsupported Sort Operators](https://docs.montiapm.com/academy/optimize-your-app-for-oplog\#unsupported-sort-operators)

Oplog implementation relies on MiniMongo for the sorting behavior. Again, MiniMongo does not support all of MongoDB's sorting operators and features. If you use any unsupported feature, your observer can't take advantage of the oplog. See the following query for an example:

```js
Posts.find({}, {sort: {$natural: -1}, limit: 10});
```

Because it is using `$natural`, it won't be able to get the oplog support.

## [Identify Above Scenarios](https://docs.montiapm.com/academy/optimize-your-app-for-oplog\#identify-above-scenarios)

Now you clearly know why some of your observers cannot use oplog support. But it can be hard to find the reason for such queries in production, especially with invalid selectors.

[Monti APM](https://montiapm.com/) shows you whether oplog is enabled or not for your observers via its [tracing](https://docs.montiapm.com/dashboards/pubsub-dashboard#response-time-with-traces) support. When the oplog is not used, it will show you why.

[![Oplog Debugging Support in Monti APM](https://docs.montiapm.com/images/oplog-debugging.png)](https://docs.montiapm.com/images/oplog-debugging.png)

Now you know how to optimize your app for Meteor’s oplog integration and find out whether oplog support is enabled for your individual observers. If it is not, Monti APM will help you to determine the reason and fix it.

[PREVIOUS\\
\\
Optimizing for Live Queries](https://docs.montiapm.com/academy/live-queries)

[NEXT\\
\\
Optimize Memory Usage](https://docs.montiapm.com/academy/optimize-memory-usage)