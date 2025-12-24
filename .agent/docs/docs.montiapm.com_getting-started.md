---
url: "https://docs.montiapm.com/getting-started"
title: "Getting Started With Monti APM"
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

# Getting Started With Monti APM

This guide will help you get started with Monti APM to understand how your app behaves and how to use the information.

## [Install and Configure The Agent](https://docs.montiapm.com/getting-started\#install-and-configure-the-agent)

Add our Meteor package by running:

```
meteor add montiapm:agent
```

Next, configure your app by adding this code into any file in your app's server directory.

```js
Monti.connect('<appId>', '<appSecret>')
```

You can find the appId and appSecret in the app's settings page in Monti APM.

> It is very important to add this code in the server directory. If you do not, your Monti APM app credentials could be exposed to the client.

## [Auto Connect](https://docs.montiapm.com/getting-started\#auto-connect)

Monti APM agent has the ability to automatically connect to Monti APM if credentials are present either through [`Meteor.settings`](https://docs.meteor.com/#meteor_settings) or environment variables without the need to explicitly call `Monti.connect` from your code.

### [Using Meteor Settings](https://docs.montiapm.com/getting-started\#using-meteor-settings)

Add a `monti` object to your app's `settings.json` file.

```js
{
  "packages": { ... },
  "public": { ... },

  "monti": {
    "appId": "<appId>",
    "appSecret": "<appSecret>",
    "options": {

    }
  }
}
```

### [Using Environment Variables](https://docs.montiapm.com/getting-started\#using-environment-variables)

Set the following environment variables before you start your app, or configure them when deploying your app.

```shell
export MONTI_APP_ID=<appId>
export MONTI_APP_SECRET=<appSecret>
```

> You can also specify options with environment variables. To learn more, look at the [options documentation](https://github.com/monti-apm/monti-apm-agent#list-of-options).
>
> For example: if you want to see where each event in traces was started, you can use this environment variable:
>
> `MONTI_EVENT_STACK_TRACE=true`

After you've successfully connected your app with Monti APM, you'll be able to see messages like the ones below, which indicate you've successfully authenticated with Monti APM.

```shell
  $ meteor
  [[[[[ ~/projects/my-meteor-app ]]]]]

  => Started proxy.
  => Started MongoDB.
  => Started your app.

  I20240612-10:54:27.357(-5)? Monti APM: Connected
  => App running at: http://localhost:3000/
```

_**After about one minute, your data will be processed and be available on the UI.**_

> If you are connecting to Monti APM behind an enterprise firewall or using a HTTP/HTTPS proxy, you need to configure the agent for that. Learn more in [this article](https://docs.montiapm.com/knowledge-base/using-monti-with-enterprise-firewall).

## [Monti APM Dashboard](https://docs.montiapm.com/getting-started\#monti-apm-dashboard)

The Monti APM Dashboard is very nicely designed and super easy to use. Yep, it's a Meteor App too. This is the overview of the Monti APM Dashboard.

[![Monti APM Dashboard](https://docs.montiapm.com/images/overview-2.png)](https://docs.montiapm.com/images/overview-2.png)

## [How to Use Monti APM](https://docs.montiapm.com/getting-started\#how-to-use-monti-apm)

Let's assume you've added Monti APM and it has enough information (about 30 minutes of runtime data) to provide a good analysis. There is no right or wrong way to use Monti APM but I will suggest two ways to get started.

### [Finding and Fixing Bottlenecks in Meteor Methods](https://docs.montiapm.com/getting-started\#finding-and-fixing-bottlenecks-in-meteor-methods)

For a typical Meteor application, the average [Response Time](https://docs.montiapm.com/knowledge-base/glossary#response-time) of a Meteor Method should not be more than 200ms. If it is more than this, in many cases there are ways to improve performance.

- First, click on **Methods** on the Main Menu and look at the Response Time.
- Also look at the Response Time graph for any spikes.
- If you find places where the Response Time is higher than 200ms, click the **Detailed View** button on the Sub Menu.
- Then find the Response Time and click on the spike in the graph.
- This will show a set of traced methods at that time.
- Click on a trace to see exactly what has happened on that method at that time.
- Follow this [guide](https://docs.montiapm.com/academy/make-your-app-faster) to understand the traced data and improve your method accordingly.

Finding Bottlenecks in Meteor Methods and Fixing Them - YouTube

[Photo image of Arunoda Prageeth Susiripala Manameldura](https://www.youtube.com/channel/UC6ABSyRbYDjvn87xexjreNQ?embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

Arunoda Prageeth Susiripala Manameldura

1.72K subscribers

[Finding Bottlenecks in Meteor Methods and Fixing Them](https://www.youtube.com/watch?v=4vt2M7-bsDQ)

Arunoda Prageeth Susiripala Manameldura

Search

Watch later

Share

Copy link

Info

Shopping

Tap to unmute

If playback doesn't begin shortly, try restarting your device.

More videos

## More videos

You're signed out

Videos you watch may be added to the TV's watch history and influence TV recommendations. To avoid this, cancel and sign in to YouTube on your computer.

CancelConfirm

Share

Include playlist

An error occurred while retrieving sharing information. Please try again later.

[Watch on](https://www.youtube.com/watch?v=4vt2M7-bsDQ&embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

0:00

0:00 / 0:28

•Live

•

> You can follow the [same process](https://www.youtube.com/watch?v=CQtmnzIlzE4&feature=youtu.be) for PubSub.

### [Finding Methods You Need to Improve](https://docs.montiapm.com/getting-started\#finding-methods-you-need-to-improve)

In your app, you might be using many Meteor Methods. You may need to improve all of them. It is a good idea to start, though, with the ones that have more impact. We’ve identified that if you can improve a method with higher Throughput, it will impact more on the total performance gain. To do this, follow these steps:

- Click on the **Detailed View** of Methods.
- Sort the Methods Breakdown by [Throughput](https://docs.montiapm.com/knowledge-base/glossary#throughput) (the default sort criteria).
- Click on a method name in the Methods Breakdown.
- In the [Recommendations](https://docs.montiapm.com/dashboards/methods-dashboard#method-recommendations) section, you will see the impact you can have if you improve the selected method.
- Click on the Response Time Graph and find a trace.
- Analyze it with this [guide](https://docs.montiapm.com/academy/make-your-app-faster/) and improve your method if possible.
- Do the same for all methods.

Finding Meteor Methods You Need to Improve - YouTube

[Photo image of Arunoda Prageeth Susiripala Manameldura](https://www.youtube.com/channel/UC6ABSyRbYDjvn87xexjreNQ?embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

Arunoda Prageeth Susiripala Manameldura

1.72K subscribers

[Finding Meteor Methods You Need to Improve](https://www.youtube.com/watch?v=REUrBU7x6GU)

Arunoda Prageeth Susiripala Manameldura

Search

Watch later

Share

Copy link

Info

Shopping

Tap to unmute

If playback doesn't begin shortly, try restarting your device.

More videos

## More videos

You're signed out

Videos you watch may be added to the TV's watch history and influence TV recommendations. To avoid this, cancel and sign in to YouTube on your computer.

CancelConfirm

Share

Include playlist

An error occurred while retrieving sharing information. Please try again later.

[Watch on](https://www.youtube.com/watch?v=REUrBU7x6GU&embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

0:00

0:00 / 0:58

•Live

•

> You can follow the [same process](https://www.youtube.com/watch?v=CTk0Qvj0n6Y&feature=youtu.be) for PubSub, but you will need to sort the Pub/Sub Breakdown by SubRate instead of Throughput.

If you need help or more information, don't hesitate to raise a discussion at our [official repo](https://github.com/monti-apm/feedback) or contact us using the Support button in our App. Good luck and don't forget to share your experience with us.

[PREVIOUS\\
\\
Introduction](https://docs.montiapm.com/introduction)

[NEXT\\
\\
Welcome](https://docs.montiapm.com/academy/welcome)