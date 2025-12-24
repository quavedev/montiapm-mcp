---
url: "https://docs.montiapm.com/academy/managing-waittime"
title: "Managing Wait Time"
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

# Managing Wait Time

If you've ever looked at a Monti APM trace, you should've seen the waitTime. In this article, I'll explain to you about the waitTime and how you can manage it. waitTime is not something evil, but you need to learn how to manage it.

## [What is wait time?](https://docs.montiapm.com/academy/managing-waittime\#what-is-wait-time%3F)

Internally, Meteor executes all the DDP messages for a given client sequentially. Let me explain with an example:

> When I refer to "DDP messages", they include subscriptions, unsubscribes, and method calls made to the server.

Let's say I have a **blog** running with Meteor. When a user visits a page, a few things are happening behind the scenes:

1. a subscription to get postList (which will be shown in the sidebar)
2. a call to the detectCountry method to get the country from the IP address
3. a subscription to get the blogPost
4. a subscription to get comments
5. a subscription to get categories

Meteor processes all these DDP messages in a sequence by default. The `detectCountry` method has to wait for the `postList` subscription to become ready, and the `categories` subscription has to wait for the previous 3 subscriptions and one method call to finish before it can start. So, categories will be executed at the end and the result will be delayed!

You see this behavior by analyzing a trace for the categories subscription:

[![Showing Meteor WaitTime](https://docs.montiapm.com/images/showing-meteor-waittime.png)](https://docs.montiapm.com/images/showing-meteor-waittime.png)

You can clearly see it has a waitTime of **6415** milliseconds due to waiting on the method and subscriptions.

## [Using this.unblock](https://docs.montiapm.com/academy/managing-waittime\#using-this.unblock)

Now let's think about these DDP messages:

- the `detectCountry` method has no dependencies on other DDP messages
- all the other DDP messages should load after the blogPost subscription

By looking at the rules above, we don't need detectCountry to block any other messages in particular, since it took almost 5 seconds to execute.

So we can invoke this.unblock inside the method body as shown below and tell Meteor to stop blocking other messages.

```js
Meteor.methods({
  detectCountry: function() {
    this.unblock();
    // other logic
  }
});
```

We need the blogPost subscription to load before the others but the other subscriptions may execute in parallel. So, we can add this.unblock inside blogPost publications as well.

> If you are using a Meteor release older than 2.3, `this.unblock` is not available in publications. You can add it with [lamhieu:unblock](https://github.com/lh0x00/meteor-unblock) (for Meteor 1.7 or newer) or [meteorhacks:unblock](https://github.com/meteorhacks/unblock) (for older Meteor releases)

Now we've added the necessary optimizations. Let's run the app and see what's happening right now:

[![Meteor WaitTime fixed](https://docs.montiapm.com/images/meteor-waittime-fixed.png)](https://docs.montiapm.com/images/meteor-waittime-fixed.png)

Wow, that's great. We've reduced the initial subscription load time from **6415 to 360** milliseconds. That's a huge achievement.

If you carefully look at the above trace, we still have the waitList because the `blogPost` subscription is a blocking one. But you can clearly see that other messages don't block the execution.

## [Unblock Carefully](https://docs.montiapm.com/academy/managing-waittime\#unblock-carefully)

`this.unblock` cannot be enabled for all methods and subscriptions by default since it might give you some [unexpected behaviors](https://web.archive.org/web/20170518121334mp_/https://meteorhacks.com/understanding-meteor-wait-time-and-this-unblock.html#why-thisunblock-does-not-always-work). Iif your methods and subscriptions don't depend on others, there is a good chance you can unblock them and reduce the waitTime. It all depends on your app.

If you need to ask a specific question related to your app, please post to our [repository](https://github.com/monti-apm/feedback/discussions) and let's carry on the discussion.

[PREVIOUS\\
\\
Optimize Memory Usage](https://docs.montiapm.com/academy/optimize-memory-usage)

[NEXT\\
\\
Understanding Your Meteor App with Monti Debug](https://docs.montiapm.com/academy/understanding-your-meteor-app)