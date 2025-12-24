---
url: "https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste"
title: "Reduce Bandwidth and CPU Waste"
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

# Reduce Bandwidth and CPU Waste

It is common in Meteor apps to unsubscribe to all previous subscriptions when entering into a new route or removing a component from the screen. Read [this article](https://web.archive.org/web/20170518132004mp_/http://meteorhacks.com/meteor-subscription-optimizations.html) to learn more about this.

## [Why is this bad?](https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste\#why-is-this-bad%3F)

This causes two main issues:

1. The user has to wait between routes, even for a recently visited route.
2. There is an increase in subscription rate, which introduces cpu and network issues.

## [Identifying this issue](https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste\#identifying-this-issue)

With Monti APM you can identify the subscriptions that have this issue and apply a fix.

First visit the Pub/Sub dashboard. Then sort publications by "Shortest Lifespan". Next, Select publications with the short lifespan and high sub rate.

[![Sort with Shortest Lifespan](https://docs.montiapm.com/images/sort-with-shortest-lifespan.png)](https://docs.montiapm.com/images/sort-with-shortest-lifespan.png)

Publications identified by the above selection criteria have the shortest lifespan and high subscription rates, which means they are subscribed and unsubscribed very rapidly. The following fixes can be applied to resolve the issue.

## [Potential Fix](https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste\#potential-fix)

Fixing this issue is not that hard by using a subscription manager. Two popular options are:

- [meteorhacks:subs-manager](https://github.com/meteorhacks/subs-manager)
- [ccorcos:subs-cache](https://github.com/ccorcos/meteor-subs-cache)

Instead of using `Meteor.subscribe`, create a subscription manager and subscribe with that.

```js
const subs = new SubsManager();

Router.map(function() {
  this.route('home', {
    path: '/',
    waitOn: function() {
      return subs.subscribe('postList');
    }
  });

  this.route('singlePost', {
    path: '/post/:id',
    waitOn: function() {
      return subs.subscribe('singlePost', this.params.id);
    }
  });
})
```

See the [Subscriptions Manager docs](https://github.com/meteorhacks/subs-manager) for more information.

If you have a lot of users, fixing this issue will greatly help you reduce CPU cycles and Bandwidth.

[PREVIOUS\\
\\
Understanding Your Meteor App with Monti Debug](https://docs.montiapm.com/academy/understanding-your-meteor-app)

[NEXT\\
\\
Finding Hidden Secrets](https://docs.montiapm.com/academy/insights)