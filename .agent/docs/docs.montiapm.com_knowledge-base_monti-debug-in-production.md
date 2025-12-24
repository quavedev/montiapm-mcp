---
url: "https://docs.montiapm.com/knowledge-base/monti-debug-in-production"
title: "Monti Debug in Production"
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

# Monti Debug in Production

You can use [Monti Debug](https://github.com/monti-apm/monti-debug#using-with-production-apps) in production apps to check the end to end performance of your app. It's a useful tool to find bottlenecks in your app and ways to fix them.

Before you start a session, you need to do some **configuration**.

## [Add a debug auth key to your app](https://docs.montiapm.com/knowledge-base/monti-debug-in-production\#add-a-debug-auth-key-to-your-app)

You don't want anyone unauthorized to view the Monti Debug data for your app. In production, Monti Debug requires you to set a debug auth key. When starting a Monti Debug session, you will provide this key to authenticate.

> You must add this key to your app, otherwise Monti Debug won't work in production.

You have two options to add the debug auth key:

### [1\. Using Environment Variables](https://docs.montiapm.com/knowledge-base/monti-debug-in-production\#1.-using-environment-variables)

Set the `MONTI_DEBUG_AUTH_KEY` environment variable in your production deployment:

```js
MONTI_DEBUG_AUTH_KEY=<your very long password>
```

### [2\. Using Meteor Settings](https://docs.montiapm.com/knowledge-base/monti-debug-in-production\#2.-using-meteor-settings)

You can also use Meteor Settings to configure the debug auth key. This is how to do it:

```js
{
  "public": {},

  "monti": {
    "debug": {
      "authKey": "<your very long key>"
    }
  }
}
```

_This content originally appeared in the Kadira Knowledge Base._

[PREVIOUS\\
\\
Custom Hostname](https://docs.montiapm.com/knowledge-base/send-data-with-a-custom-hostname)

[NEXT\\
\\
Using Behind Firewall](https://docs.montiapm.com/knowledge-base/using-monti-with-enterprise-firewall)