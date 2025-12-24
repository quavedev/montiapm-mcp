---
url: "https://docs.montiapm.com/dashboards/methods-dashboard"
title: "Methods Dashboard"
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

# Methods Dashboard

This dashboard shows the performance of [Meteor Methods](https://docs.montiapm.com/dashboards/methods-dashboard) in your app.

## [Methods Summary](https://docs.montiapm.com/dashboards/methods-dashboard\#methods-summary)

 [![Methods Summary](https://docs.montiapm.com/images/methods-summary.png)](https://docs.montiapm.com/images/methods-summary.png)

Methods Summary shows the summary of the method in the selected date range. If a method is selected, then the summary will be for that specific method. Otherwise, it summarizes all of the methods.

Here is a list of the metrics shown in the widget:

- **Response Time** \- The average response time per method, in milliseconds
- **Throughput** \- The number of method calls received per minute
- **Total Methods** \- Total number of method calls received, including errors

## [Response Time Breakdown with Traces](https://docs.montiapm.com/dashboards/methods-dashboard\#response-time-breakdown-with-traces)

[![Response Time Breakdown](https://docs.montiapm.com/images/response-time-breakdown.png)](https://docs.montiapm.com/images/response-time-breakdown.png)

Response Time Breakdown shows the response time, broken down by how much time was spent in different categories:

- **db** \- Time spent on database activities, including read and write operations.
- **http** \- Time spent waiting on HTTP requests
- **compute** \- Time spent on CPU-intensive tasks inside a method (e.g. time spent sorting and calculating a value).
- **async** \- Time spent on async activities, especially with NPM modules.
- **email** \- Time spent sending emails.
- **wait** \- Time the method spent waiting to be processed. This metric is important because methods from a single client are processed sequentially, and so a method can sometimes idle in the queue waiting for earlier methods to finish.

Additionally, if you like to inspect a trace of a method call at a particular point, find that point on the chart and click it. You'll get a few sample method traces that you can analyze.

## [Throughput (Requests Per Minute)](https://docs.montiapm.com/dashboards/methods-dashboard\#throughput-(requests-per-minute))

[![Requests Per Minute](https://docs.montiapm.com/images/throughput-requests-per-minute.png)](https://docs.montiapm.com/images/throughput-requests-per-minute.png)

This chart shows the number of method calls per minute.

## [Average Response Time](https://docs.montiapm.com/dashboards/methods-dashboard\#average-response-time)

[![Average Response Time Chart](https://docs.montiapm.com/images/average-response-time-milliseconds.png)](https://docs.montiapm.com/images/average-response-time-milliseconds.png)

The chart above shows the average response time for method calls in milliseconds for the selected date range

## [Error Rate](https://docs.montiapm.com/dashboards/methods-dashboard\#error-rate)

This chart shows the percentage of method calls that errored.

## [Method Breakdown](https://docs.montiapm.com/dashboards/methods-dashboard\#method-breakdown)

[![Method Breakdown](https://docs.montiapm.com/images/method-breakdown.png)](https://docs.montiapm.com/images/method-breakdown.png)

This chart allows you to drill down into the methods. It shows a list of methods sorted by a metric, which can be selected on top. In the chart above, methods have been sorted by average response time. Options for sorting are shown below.

[![Method Sort Options](https://docs.montiapm.com/images/method-sort-options.png)](https://docs.montiapm.com/images/method-sort-options.png)

For each method, two progress bars are shown. The green progress bar represents the sorted metric, while the orange bar represents the throughput of the metric. Sometimes, even though the metric value is high, it may not have a considerable amount of throughput. The throughput bar on this chart enables you to detect that situation.

[![Methods Graph](https://docs.montiapm.com/images/methods-graph.png)](https://docs.montiapm.com/images/methods-graph.png)

Another feature of this chart is the ability to select the method. Once you have selected a method, all the other graphs will show data corresponding to the selected method.

## [Trace Explorer](https://docs.montiapm.com/dashboards/methods-dashboard\#trace-explorer)

[![Method Explorer](https://docs.montiapm.com/images/method-explorer.png)](https://docs.montiapm.com/images/method-explorer.png)

The trace explorer is a core feature of Monti APM. It shows you graphically what happened in a specific method call. It can be used to identify problems and find solutions easily. You might think of it as a graphical stack trace for a Meteor method.

In the example above, Method Explorer is showing a method call to the \`hello\`\` method that took 13,803ms to complete. The call waited in the queue for 11,162ms while five other methods were being processed.

The example also shows a HTTP GET request with 1,625ms, as well as some other DB operations.

_This content originally appeared in the Kadira Knowledge Base._

[PREVIOUS\\
\\
Overview](https://docs.montiapm.com/dashboards/overview-dashboard)

[NEXT\\
\\
PubSub](https://docs.montiapm.com/dashboards/pubsub-dashboard)