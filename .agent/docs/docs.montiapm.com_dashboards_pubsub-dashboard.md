---
url: "https://docs.montiapm.com/dashboards/pubsub-dashboard"
title: "PubSub Dashboard"
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

# PubSub Dashboard

This dashboard shows you the performance of Meteor [publications](https://docs.meteor.com/api/meteor.html#pubsub). Details on the observers created by publications is available in the [Live Queries dashboard](https://docs.montiapm.com/dashboards/live-queries-dashboard).

## [PubSub Summary](https://docs.montiapm.com/dashboards/pubsub-dashboard\#pubsub-summary)

Pubsub Summary is a set of important performance metrics related to your publications. These are the metrics:

- Response Time - Average time spent on the server for a subscription to become ready or error
- Sub Rate - Number of new subscriptions per minute
- Active Subs (Average) - The average number of active subs per host

## [Average Response Time](https://docs.montiapm.com/dashboards/pubsub-dashboard\#average-response-time)

[![Average Response Time](https://docs.montiapm.com/images/average-response-time.png)](https://docs.montiapm.com/images/average-response-time.png)

This chart shows the average response time for sending the initial data set for subscriptions. We calculate this metric when we detect `this.ready()` for a publication. This chart shows you whether your subscriptions are slow to process initially.

To inspect a trace of a subscription at a particular point in time, find that point on the chart and click it. You'll get a few sample publication traces you can analyze. It is impossible to send all the traces processed in your app to Monti APM so the agent picks traces for outliers (unusually slow subscriptions) to send.

By selecting a point on the chart, you can also view a detailed breakdown of the response times.

## [Sub Rate (Subscriptions Per Minute)](https://docs.montiapm.com/dashboards/pubsub-dashboard\#sub-rate-(subscriptions-per-minute))

This chart shows the number of new subscriptions created each minute.

## [Sub Rate and Response Time](https://docs.montiapm.com/dashboards/pubsub-dashboard\#sub-rate-and-response-time)

This chart combines the two previous charts so you can easily see if the numbers are correlated.

## [Active Subs and Average Lifetime](https://docs.montiapm.com/dashboards/pubsub-dashboard\#active-subs-and-average-lifetime)

[![Active Subs and Average Lifetime](https://docs.montiapm.com/images/average-subs-and-average-lifetime.png)](https://docs.montiapm.com/images/average-subs-and-average-lifetime.png)

This chart shows the number of active subscriptions on the server and the average lifetime of a subscription. With this information, we can see how busy our subscriptions are in terms of quantity and lifetime.

## [Publication Breakdown](https://docs.montiapm.com/dashboards/pubsub-dashboard\#publication-breakdown)

The Publication Breakdown allows you to sort by different values and find out how your publications work. These are the values you can sort:

- [Sub Rate](https://docs.montiapm.com/knowledge-base/glossary#sub-rate)
- Unsub Rate
- [Response Time](https://docs.montiapm.com/knowledge-base/glossary#response-time)
- Low [Observer Reuse](https://docs.montiapm.com/knowledge-base/glossary#observer-reuse)
- High [Observer Reuse](https://docs.montiapm.com/knowledge-base/glossary#observer-reuse)
- Shortest [Lifespan](https://docs.montiapm.com/knowledge-base/glossary#lifespan)
- [Active Subs](https://docs.montiapm.com/knowledge-base/glossary#active-subs)
- Created Observers
- Deleted Observers
- Reused Observers
- Total Observer Handlers

By sorting with different values, you can understand a lot about your publications. Please see these relevant Academy Articles.

- Response Time - [Make your app faster](https://docs.montiapm.com/academy/make-your-app-faster)
- Low Observer Reuse - [Improve CPU & Network Usage](https://docs.montiapm.com/academy/improving-cpu-network-usage)
- Shortest Lifespan - [Improve User Experience](https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste)
- [What is null(autopublish) publication?](https://docs.montiapm.com/knowledge-base/what-is-null(autopublish)-publication)

[PREVIOUS\\
\\
Methods](https://docs.montiapm.com/dashboards/methods-dashboard)

[NEXT\\
\\
Live Queries](https://docs.montiapm.com/dashboards/live-queries-dashboard)