---
url: "https://docs.montiapm.com/academy/debugging-response-time-bottlenecks"
title: "Debugging Response Time Bottlenecks"
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

# Debugging Response Time Bottlenecks

We all want to build faster Meteor apps. Improving the server-side response time is an important factor in building fast apps.

In Monti APM, we have few tools to help you to debug response time bottlenecks in your app. I will show you how to use them.

This is a case study where we debug a sudden response time increase. Look at the following graph:

[![Response time](https://docs.montiapm.com/images/response-time.png)](https://docs.montiapm.com/images/response-time.png)

**We can see a spike in the response time at the end of the graph.**

So, we can clicked on that spike. Then we'll get a response time distribution like this:

[![Response time distribution](https://docs.montiapm.com/images/response-time-distribution.png)](https://docs.montiapm.com/images/response-time-distribution.png)

This is the response time histogram for that time. It also shows summary measurements, like median and percentiles.

> If you want to refresh your knowledge about [mean, histograms and percentiles](https://docs.montiapm.com/academy/mean-histogram-and-percentiles), read this article.

Here, the median is about **535 milliseconds**. That means 50% of our users had a response time lower than 535 milliseconds. That's good.

Have a look at the **99th** percentile. It has a huge value. It seems like an outlier and a specific case.

But interestingly, our **90th and 95th** percentiles are also quite high. That's seems like an issue. So let's investigate:

[![Response time distribution two](https://docs.montiapm.com/images/response-time-distribution-2.png)](https://docs.montiapm.com/images/response-time-distribution-2.png)

Here our 90th percentile is 42,429 milliseconds. So we can click on the relevant bin on the histogram to see some traces:

[![Response time traces](https://docs.montiapm.com/images/response-time-traces.gif)](https://docs.montiapm.com/images/response-time-traces.gif)

Let's look at one of those traces:

[![Trace](https://docs.montiapm.com/images/trace.png)](https://docs.montiapm.com/images/trace.png)

On looking at a trace, it seems like there is a waitTime issue. Actually, this happens when we re-deploy our app. All the subscriptions need to be re-run and that's why there is this issue a very big responseTime in the login method.

> We can also look at the login method at that time and find out what's really happened for that as well.

This is how you can use Monti APM to debug a response time issue in your app. Depending on your app and the case, the individual steps could change slightly, but this is the process you can use.

* * *

Congratulations, you've reached the end of the Meteor Academy

* * *

[PREVIOUS\\
\\
Understanding Mean, Histogram and Percentiles](https://docs.montiapm.com/academy/mean-histogram-and-percentiles)

[NEXT\\
\\
Overview](https://docs.montiapm.com/dashboards/overview-dashboard)