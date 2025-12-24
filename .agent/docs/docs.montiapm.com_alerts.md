---
url: "https://docs.montiapm.com/alerts"
title: "Alerts"
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

# Alerts

Table of Contents:

- [Creating Alerts](https://docs.montiapm.com/alerts#creating-alerts)
- [Alert Suggestions](https://docs.montiapm.com/alerts#alert-suggestions)
- [Slack Notifications](https://docs.montiapm.com/alerts#slack-notifications)
- [Webhooks](https://docs.montiapm.com/alerts#webhooks)

Alerts monitor a specific metric and notify you when the metric meets conditions you set. They are useful for becoming aware of issues early without having to check Monti APM or be notified by a user about a problem.

## [Creating Alerts](https://docs.montiapm.com/alerts\#creating-alerts)

[![Alert Button](https://docs.montiapm.com/images/alerts-location-2x.png)](https://docs.montiapm.com/images/alerts-location-2x.png)

1. Open the alerts window from the header when viewing an app. If you do not have any alerts, it will show the create screen. Otherwise, click the `Create new` button

[![Create Alert Form](https://docs.montiapm.com/images/create-alert-3x.png)](https://docs.montiapm.com/images/create-alert-3x.png)

2. Fill out the alert form. The form is layed out so you are creating a sentence that explains how the alert works. For example: When method response time is greater than 500ms on any host, then send an email
   - When - the metric to watch
   - Is - the condition the metric should meet to notify you
   - For - how long the condition should be met (in minutes)
   - On - if the condition should be met on any or all hosts before notifying you
3. Add any emails or [webhooks](https://docs.montiapm.com/alerts#webhooks) that should be notified


## [Alert Suggestions](https://docs.montiapm.com/alerts\#alert-suggestions)

These are good starting points for most apps.

- New Errors
- CPU usage is over 80% for one minute
- High memory usage
- Method response time is over 500ms for 2 minutes
- Mongo Pool Checkout max delay is more than 50ms
- Host count is low. If a number of your servers are not responding for several minutes, there is a higher risk of the remaining servers going down

A good practice is after you encounter an issue in production, create an alert that would notify you if it happens again.

However, if you receive too many unimportant alert notifications, you will likely stop paying attention to them and miss an important issue. This is called alert fatigue. If you notice this happening, modify the conditions or duration you are only notified when there is an issue you have to act on.

Is there an alert you've found to be useful? [Let us know.](mailto:hello@montiapm.com)

## [Slack Notifications](https://docs.montiapm.com/alerts\#slack-notifications)

Monti APM is able to send messages to your slack workspace using webhooks.

1. Add the [Incoming WebHooks](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) app to your workspace

[![Incoming WebHooks App](https://docs.montiapm.com/images/slack-webhooks-app.png)](https://docs.montiapm.com/images/slack-webhooks-app.png)

2. Choose a channel for the messages to appear in and click `Add`

[![Configure Incoming WebHooks](https://docs.montiapm.com/images/slack-webhooks-configure.png)](https://docs.montiapm.com/images/slack-webhooks-configure.png)

3. Copy the webhook URL and add it to the alert in Monti APM

[![Add URL To Alert](https://docs.montiapm.com/images/add-webhook.png)](https://docs.montiapm.com/images/add-webhook.png)

To make sure everything works, click the `Fire a Test Alert` button. You should see a new message in slack.

## [Webhooks](https://docs.montiapm.com/alerts\#webhooks)

Webhooks allow Monti APM to notify you when an alert triggers or clears. You can create your own integration or use it to integrate into other services For example, you can send an SMS message with [Zapier](https://zapier.com/apps/sms/integrations/webhook/1677/send-a-webhook-to-a-phone-via-sms).

When an alert is armed, Monti APM sends a POST request to the webhook URL with the content-type `application/json`. The webhook body is in this format:

```js
{
  "name": "Alert name",
  "appId": "app id",
  "enabled": true,
  "appName": "App name",
  "created": "2018-09-16T13:30:40.978Z", // Date alert was created
  "createdBy": "user id", // Id of user who created the alert
  "status": "triggered",
  "result": { // Object with the values used to check if the alert triggered. Format depends on alert type and settings.
    "success": true,
    "data": {
      "server-host-name": {
        "success": true,
        "data": {
          "success": true,
          "data": {
            "value": 56.5,
            "timestamp": 1578970626742
          }
        }
      }
    }
  },
  "triggered": 1578974166802 // Timestamp of when alert triggered
}
```

When the alert is cleared, the webhook body will look like:

```js
{
  "name": "Alert name",
  "appId": "app id",
  "enabled": true,
  "appName": "App name",
  "created": "2018-09-16T13:330:40.978Z",
  "createdBy": "user id", // Id of user who created the alert
  "status": "cleared",
  "triggered": 1596475369935 // Timestamp of when alert triggered
}
```

To test the webhook, click the `Fire a Test Alert` button in the alert edit screen.

[PREVIOUS\\
\\
Analyze Profile](https://docs.montiapm.com/analyze-cpu-profile)

[NEXT\\
\\
Error Tracking](https://docs.montiapm.com/knowledge-base/error-tracking)