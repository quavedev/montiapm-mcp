---
url: "https://docs.montiapm.com/knowledge-base/using-monti-with-enterprise-firewall"
title: "Using Monti APM with enterprise firewall / proxy"
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

# Using Monti APM with enterprise firewall / proxy

## [Enterprise Firewall](https://docs.montiapm.com/knowledge-base/using-monti-with-enterprise-firewall\#enterprise-firewall)

If your app deployed on a restricted environment with tight firewall rules, you have two options:

1. Use our on-prem version of Monti APM to store all data within your environment. Please contact us at [hello@montiapm.com](mailto:hello@montiapm.com) to discuss this option.
2. allow access to Monti APM through your firewall.

Our `montiapm:agent` Meteor package uses HTTPS traffic to send data to our infrastructure. Here's the endpoint information:

- host: [engine.montiapm.com](http://engine.montiapm.com/) (or [engine-us.montiapm.com](http://engine-us.montiapm.com/) for the US region)
- port: 443

If your trying to use the Monti APM dashboard behind a firewall, you need to allow access to it also. Here's the information.:

- host: [app.montiapm.com](http://app.montiapm.com/)
- port: 443

## [HTTP/HTTPS Proxies](https://docs.montiapm.com/knowledge-base/using-monti-with-enterprise-firewall\#http%2Fhttps-proxies)

If you are accessing internet via a proxy, you will need to apply the following changes:

```js
Monti.connect("appId", "password", {
  proxy: "http://your-http-proxy.com:port"
});
```

You can also configure above options with Meteor settings or using environment variables. Learn how in the [auto connect](https://docs.montiapm.com/getting-started#auto-connect) docs.

_This content originally appeared in the Kadira Knowledge Base._

[PREVIOUS\\
\\
Monti Debug in Production](https://docs.montiapm.com/knowledge-base/monti-debug-in-production)