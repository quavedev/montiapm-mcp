---
url: "https://docs.montiapm.com/knowledge-base/error-tracking"
title: "Error Tracking"
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

# Error Tracking

## [Error Tracking - Introduction](https://docs.montiapm.com/knowledge-base/error-tracking\#error-tracking---introduction)

Monti APM has a built in error tracking solution which can be used to track both client and server errors. It is enabled by default.

**Type of Errors Monti APM Tracks**

Monti APM can track both server and client side errors alike. See a list of errors Monti APM can track

**Server Side**

- Server Crash - Errors caused to crash your server
- Method Errors - Errors thrown inside Meteor methods
- Subscriptions Errors - Errors thrown inside the publication (when you subscribed)
- Internal Meteor Errors - Errors thrown inside Meteor core platform

**Client Side**

- Internal Meteor Errors (via Meteor.\_debug)
- Errors captured via window.onerror
- Unhandled promise rejections

### [Error Traces](https://docs.montiapm.com/knowledge-base/error-tracking\#error-traces)

Monti APM not only tracks errors, but it also trace errors and shows the context for your error. It includes, all the major events related to the trace. Then you can easily reproduce and fix the error very quickly. See below for some error traces which has been captured with Monti APM.

## [Tracking Custom Errors](https://docs.montiapm.com/knowledge-base/error-tracking\#tracking-custom-errors)

By default, Monti APM tracks all uncaught or unhandled errors for you. However, if you need to handle errors yourself you will need to report the error to Monti APM as well. Here are the some of the options:

### [Option 1 - Re-throw the Error\*\*](https://docs.montiapm.com/knowledge-base/error-tracking\#option-1---re-throw-the-error**)

The easiest option is capture the error and then throw the error. Monti APM will capture the error and you can see it in the UI.

```js
try {
  // your code which may throw some errors
} catch(ex) {
  // handle your error and throw again
  throw ex;
}
```

**Option 2 - Use Monti.trackError**

Other option is to use Monti.trackError API. Which is available on both client and the server. See how it can used.

```js
try {
  functionThatCouldFail();
} catch (err) {
  Monti.trackError(
    err,
    { type: 'payment', subType: 'stripe-payment' } // optional
  );
}
```

Monti APM can use source maps to show where in the original code the error occurred. Learn more in our article on [source maps](https://docs.montiapm.com/source-maps).

## [Filtering Errors](https://docs.montiapm.com/knowledge-base/error-tracking\#filtering-errors)

You might not want to track every error in your app. The agent allows you to filter out errors you do not want to track.

### [Error Filtering API](https://docs.montiapm.com/knowledge-base/error-tracking\#error-filtering-api)

This api is available on both client and the server.

Each error that occurred in your app goes through error filters before being sent to Monti APM. If one of the error filters rejects an error, it won't be sent to Monti APM.

Here is out to create an error filter:

```js
Monti.errors.addFilter(function(errorType, message, error) {
  // filter out all client errors
  if(errorType == 'client') {
    return false;
  }

  // return true to indicate this error is allowed to be tracked
  return true;
});
```

These are the parameters passed to the filter.

**errorType**

Here are some of the available types:

- client - a client error
- method - a method error
- sub - a subscription error
- server-crash - an uncaught exception which crash the app
- server-internal - an internal meteor framework error

**client** error type is available inside the client side only(on both in the browser and cordova context) only. All other types are available on the server only.

**message**

actual error message

**error**

actual error object (if any)

### [Built-in Filters](https://docs.montiapm.com/knowledge-base/error-tracking\#built-in-filters)

Monti APM comes with a few pre-defined filters to make your life easy. We'll be adding more as we understand more common errors.

**Filter Validation Errors**

Errors created with Meteor.Error inside Meteor methods and publications are normally validations. You may not need to track them at all. If so, you can use a built-in filter as shown below to filter out those errors.

```js
Monti.errors.addFilter(Monti.errorFilters.filterValidationErrors);
```

> Make sure to add the above filter on the server side.

**Filter Common Platform Errors**

There are some platform level errors which cannot be prevented. DDP and sockjs heartbeat issues are a few of those. This filter will filter out those errors.

```js
Monti.errors.addFilter(Monti.errorFilters.filterCommonMeteorErrors);
```

> Make sure to add the above filter on both the server and client

## [Disable Error Tracking](https://docs.montiapm.com/knowledge-base/error-tracking\#disable-error-tracking)

If you need to disable error tracking, you have two options:

### [Option 1 - Disable when connecting](https://docs.montiapm.com/knowledge-base/error-tracking\#option-1---disable-when-connecting)

The best option is to ask Monti APM to not to track errors when connecting. See below:

```js
var montiOptions = {enableErrorTracking: false }
Monti.connect('appId', 'appSecret', montiOptions);
```

If you are using Meteor settings to configure Monti APM, you can use following method:

```js
{
  ...

  "monti": {
    "appId": "appId",
    "appSecret": "appSecret",
    "options": {
      "enableErrorTracking": false
    }
  }

  ...
}
```

### [Options 2 - Use Monti.disableErrorTracking](https://docs.montiapm.com/knowledge-base/error-tracking\#options-2---use-monti.disableerrortracking)

You may need to disable error tracking in runtime or you might be using Environment Variables to configure Monti APM. For those situations, use the following API to disable error tracking.

```js
Monti.disableErrorTracking();
```

If you need to enable it back, use the following API:

```js
Monti.enableErrorTracking();
```

_This content originally appeared in the Kadira Knowledge Base._

[PREVIOUS\\
\\
Alerts](https://docs.montiapm.com/alerts)

[NEXT\\
\\
Source Maps](https://docs.montiapm.com/source-maps)