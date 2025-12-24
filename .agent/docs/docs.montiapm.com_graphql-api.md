---
url: "https://docs.montiapm.com/graphql-api"
title: "API"
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

# API

Most data collected and aggregated for your app can be accessed through our [GraphQL](https://graphql.org/) API. Use it to build custom dashboards, integrations, or explore data in ways not possible through Monti APM's UI. The API is available for all users and apps.

We value any feedback related to the API. Have an idea of something that could be improved? Please [let us know](mailto:hello@montiapm.com).

We have several [example projects](https://github.com/monti-apm/api-examples) showing how the API can be used.

## [Authenticate](https://docs.montiapm.com/graphql-api\#authenticate)

Send a POST request to `https://api.montiapm.com/auth` with a json object in the body:

```js
{
  "appId": "< app id >",
  "appSecret": "< app secret >"
}
```

Replace the app id and app secret with the values for your app. You can view them in the app's setting window on [app.montiapm.com](https://app.montiapm.com/).

The response will be a JWT token. A separate JWT token will be needed for each app.

## [Querying](https://docs.montiapm.com/graphql-api\#querying)

Queries can be sent in a POST request to `https://api.montiapm.com/core`. The `authorization` header should be set to the JWT token created for the app.

## [Documentation](https://docs.montiapm.com/graphql-api\#documentation)

A GraphiQL instance can be accessed at [api.montiapm.com/docs/explore](http://api.montiapm.com/docs/explore.html) to explore and try the API. Documentation is available in the sidebar.

## [Example Queries](https://docs.montiapm.com/graphql-api\#example-queries)

Highest memory usage for each server during the last hour:

```graphql
meteorSystemMetrics (metric:RAM_USAGE, groupByHost:true) {
    host
    percentile(value:100)
}
```

Method traces with response time larger than 1,000ms in the last hour:

```graphql
meteorMethodTraces (minValue:1000) {
    id
    host
    method
    totalValue
}
```

## [Limits](https://docs.montiapm.com/graphql-api\#limits)

Since the schema is not deeply nested, we only rate-limit the root fields (`meteorMethodTraces`, `meteorSystemMetrics`, etc.). They are limited to a total of 5,000 per hour. For example, the following query would count as 2:

```graphql
{
  meteorMethodTraces (minValue:1000) {
      id
      host
      method
      totalValue
  }

  meteorSystemMetrics (metric:RAM_USAGE groupByHost:true) {
      host
      percentile(value:100)
  }
}
```

When there is a `limit` option the maximum it can be set to is 1,000.

The range for metrics (the difference between startTime and endTime) is limited based on the resolution:

- Resolution of `1min` is limited to a range of 1000 minutes
- Resolution of `30min` is limited to a range of 14 days
- Resolution of `3hour` is only limited by the retention of the plan you are using

[PREVIOUS\\
\\
Source Maps](https://docs.montiapm.com/source-maps)

[NEXT\\
\\
GDPR](https://docs.montiapm.com/gdpr)