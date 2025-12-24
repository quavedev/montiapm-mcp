---
url: "https://docs.montiapm.com/dashboards/overview-dashboard"
title: "Overview Dashboard"
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

# Overview Dashboard

## [Dashboard Summary](https://docs.montiapm.com/dashboards/overview-dashboard\#dashboard-summary)

 [![Dashboard Summary](https://docs.montiapm.com/images/overview-summary.png)](https://docs.montiapm.com/images/overview-summary.png)

Dashboard Summary is a set of important performance metrics for your application. These are the metrics:

- Pub/Sub Res. Time - Average time taken to process your publications in the server
- Method Res. Time - Average time taken to process your methods in the server
- Memory Usage/Host - Average memory usage of all of your hosts, based on the RSS size.
- CPU Usage - Average cpu usage of all your hosts
- Sessions/Host - Shows the average number of sessions per host

## [Memory Usage/Host (MB)](https://docs.montiapm.com/dashboards/overview-dashboard\#memory-usage%2Fhost-(mb))

This charts shows the average memory usage across all the hosts in the given time range. We use [RSS](https://en.wikipedia.org/wiki/Resident_set_size) as the memory usage, which represents the amount of physical memory usage by the process. More detailed memory metrics are available in the [system dashboard](https://docs.montiapm.com/dashboards/system-dashboard).

## [CPU Usage](https://docs.montiapm.com/dashboards/overview-dashboard\#cpu-usage)

[![CPU Usage Chart](https://docs.montiapm.com/images/cpu-usage-chart.png)](https://docs.montiapm.com/images/cpu-usage-chart.png)

This charts shows the CPU usage in percentage of your app. Each core represents 100%, so if your app is fully using two cores the usage would be 200%.

## [Total Sessions](https://docs.montiapm.com/dashboards/overview-dashboard\#total-sessions)

This chart shows the number of active sessions in the given time range.

## [Active Subscription](https://docs.montiapm.com/dashboards/overview-dashboard\#active-subscription)

This chart shows the average number of subscriptions for a host across all hosts in the given time range.

## [New Observers](https://docs.montiapm.com/dashboards/overview-dashboard\#new-observers)

This chart shows the number of new Observers initiated in the given time range.

Meteor is able to [reuse observers](https://docs.montiapm.com/knowledge-base/glossary#observer-reuse) for identical cursors. The chart does not show reused observers and instead shows the actual number of observers created.

_This content originally appeared in the Kadira Knowledge Base._

[PREVIOUS\\
\\
Debugging Response Time Bottlenecks](https://docs.montiapm.com/academy/debugging-response-time-bottlenecks)

[NEXT\\
\\
Methods](https://docs.montiapm.com/dashboards/methods-dashboard)