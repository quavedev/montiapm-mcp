---
url: "https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security"
title: "How to Protect Sensitive Information for Security Concerns"
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

# How to Protect Sensitive Information for Security Concerns

We collect three main types of data from your apps: metrics, traces, and errors. Metrics normally contain time related data and some values. But traces contains sensitive information like:

- Database query selectors
- Parameters for methods and publications
- URLs for HTTP requests
- Email addresses when sending emails

We take necessary measures to protect your data. But, no one can make 100% assurance on security these days. So, if you feel uncomfortable sending the above data, you should strip them before sending to Monti APM. Monti APM provides a few ways to do that.

> If you are more comfortable with storing the data in your environment, we provide an on-prem version of Monti APM. Please contact us at [hello@montiapm.com](mailto:hello@montiapm.com) for more details.

## [Traces](https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security\#traces)

> If you strip trace data, you won't get the full benefit of traces since they won't have some useful information like query selectors.

### [Strip All Information](https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security\#strip-all-information)

You can use the `stripSensitiveThorough` built-in filter to remove all potentially sensitive information:

```js
Monti.tracer.addFilter(Monti.Tracer.stripSensitiveThorough());
```

> There is also a more customizable `stripSensitive` filter. If you do not need the customization, we recommend using `stripSensitiveThorough`.

### [Strip Selectively](https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security\#strip-selectively)

You may want to selectively strip some information. Here is an example to strip only selectors from a given set of collections:

```js
Monti.tracer.addFilter(Monti.Tracer.stripSelectors([ "coll1", "coll2" ]));
```

Here's an another example to strip `start`, `http`, and `email` events, and selectors for two collections:

```js
Monti.tracer.addFilter(Monti.Tracer.stripSensitive([ "start", "http", "email" ]));
Monti.tracer.addFilter(Monti.Tracer.stripSelectors([ "coll1", "coll2" ]));
```

Here's how to filter by individual method/subscription.

```js
Monti.tracer.addFilter(Monti.Tracer.stripSelectors([ "coll1", "coll2" ], 'method', 'my-method-name'));
Monti.tracer.addFilter(Monti.Tracer.stripSelectors([ "coll1", "coll2" ], 'sub', 'my-sub-name'));
```

You can also write your own filters. Learn more in the [agent documentation](https://github.com/monti-apm/monti-apm-agent?tab=readme-ov-file#filtering-trace-data).

## [Errors](https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security\#errors)

### [IP Addresses](https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security\#ip-addresses)

By default, Monti APM collects the ip address for client errors. You can configure this with the [`recordIPAddress`](https://github.com/monti-apm/monti-apm-agent?tab=readme-ov-file#options) option.

### [Filtering Errors](https://docs.montiapm.com/knowledge-base/how-to-protect-sensitive-information-for-security\#filtering-errors)

Learn how to filter errors in the [error tracking article](https://docs.montiapm.com/knowledge-base/error-tracking/#filtering-errors).

_This content originally appeared in the Kadira Knowledge Base._

[PREVIOUS\\
\\
null(autopublish) Publication](https://docs.montiapm.com/knowledge-base/what-is-null(autopublish)-publication)

[NEXT\\
\\
Custom Hostname](https://docs.montiapm.com/knowledge-base/send-data-with-a-custom-hostname)