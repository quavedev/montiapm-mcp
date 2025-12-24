---
url: "https://docs.montiapm.com/source-maps"
title: "Source Maps"
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

# Source Maps

To improve loading time, Meteor minifies the app's code to reduce its size. However, it makes error traces much more difficult to understand.

Monti APM supports production client source maps. By using the source maps, Monti APM can modify the error stack traces to reference the line, column, and method name in the source file instead of the minified file.

For example, it can convert stack traces from:

```
TypeError: Cannot read property 'count' of undefined
    at Object.counter (https://example.com/app/app.js?hash=79071b18ec083b74de90664a13966115e626e92b:81:7)
    at https://example.com/packages/blaze.js?hash=a1ff2d6d5ecd59ee11e2ba260b8650a9d1140f59:3051:16
    at https://example.com/packages/blaze.js?hash=a1ff2d6d5ecd59ee11e2ba260b8650a9d1140f59:1715:16
```

To:

```
TypeError: Cannot read property 'count' of undefined
    at count (meteor://💻app/client/main.js:13:39)
    at https://example.com/packages/blaze.js?hash=a1ff2d6d5ecd59ee11e2ba260b8650a9d1140f59:3051:16
    at https://example.com/packages/blaze.js?hash=a1ff2d6d5ecd59ee11e2ba260b8650a9d1140f59:1715:16
```

## [Enable](https://docs.montiapm.com/source-maps\#enable)

### [1\. Change the app's minifier](https://docs.montiapm.com/source-maps\#1.-change-the-app's-minifier)

The default minifier package Meteor uses doesn't generate source maps. You can replace it with one that does by running these commands:

```text
meteor remove standard-minifier-js
meteor add zodern:standard-minifier-js
```

When your Meteor app uses a minifier that creates source maps, Monti APM will automatically use them.

You can learn more about `zodern:standard-minifier-js` on its [Github page](https://github.com/zodern/minify-js-sourcemaps).

### [2\. Update the agent](https://docs.montiapm.com/source-maps\#2.-update-the-agent)

Private source maps requires `montiapm:agent` version 2.33.0 or newer. You can update by running:

```bash
meteor update montiapm:agent
```

### [3\. Make the source maps private](https://docs.montiapm.com/source-maps\#3.-make-the-source-maps-private)

To block public access to your source maps, you can run:

```text
meteor add zodern:hide-production-sourcemaps
```

## [Disable](https://docs.montiapm.com/source-maps\#disable)

Since you have to opt into production source maps being generated, Monti APM uploads source maps by default in production, and disables uploading in development. To override the default, you can set the option with one of the following methods:

### [Environment Variable](https://docs.montiapm.com/source-maps\#environment-variable)

```bash
export MONTI_UPLOAD_SOURCEMAPS=false
```

### [Meteor Settings](https://docs.montiapm.com/source-maps\#meteor-settings)

```js
"monti": {
  "options": {
    "uploadSourceMaps": false
  }
}
```

### [Code](https://docs.montiapm.com/source-maps\#code)

```js
Monti.connect('<app id>', '<app secret>', {
  uploadSourceMaps: false
});
```

## [How it works](https://docs.montiapm.com/source-maps\#how-it-works)

Every 20 - 40 seconds, the Monti APM Agent sends statistics to Monti APM and receives a list of source maps that are needed by new errors. The agent uploads any of those source maps it finds to Monti APM. The source maps are cached for up to 2 weeks.

The error trace could be shown in the UI before the source maps were available.

## [Feedback](https://docs.montiapm.com/source-maps\#feedback)

If you think Monti APM could have done a better job with an error, please share it with us. You can do this by clicking `SHARE THIS`, and pasting the link in the Support window (click `Support` in the upper left corner).

[PREVIOUS\\
\\
Error Tracking](https://docs.montiapm.com/knowledge-base/error-tracking)

[NEXT\\
\\
API](https://docs.montiapm.com/graphql-api)