---
url: "https://docs.montiapm.com/academy/insights"
title: "Monti Insights - Finding Hidden Secrets in Your Meteor App"
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

# Monti Insights - Finding Hidden Secrets in Your Meteor App

We keep a huge amount of data about your application as metrics. Even though they are metrics, you can use them to identify patterns in your app. You can use **Monti Insights** to play around with those metrics and find hidden secrets.

[![Monti Insights - CPU Usage vs Active Sessions](https://docs.montiapm.com/images/cpu-usage-vs-active-sessions.png)](https://docs.montiapm.com/images/cpu-usage-vs-active-sessions.png)

Monti Insights can find relationships in your application and make predictions based on those relationships. Thus, you can use it as a capacity planning tool. There are many things you can do with those relationships.

Watch the following video. It's an overview of how to use Monti Insights. After you’ve seen it, I'll show you what kind of insights you can derive.

Kadira Insights - find hidden secrets in your Meteor apps. - YouTube

[Photo image of Arunoda Prageeth Susiripala Manameldura](https://www.youtube.com/channel/UC6ABSyRbYDjvn87xexjreNQ?embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

Arunoda Prageeth Susiripala Manameldura

1.72K subscribers

[Kadira Insights - find hidden secrets in your Meteor apps.](https://www.youtube.com/watch?v=Xnd2Sa4s4Uk)

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

[Watch on](https://www.youtube.com/watch?v=Xnd2Sa4s4Uk&embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

0:00

0:00 / 2:29

•Live

•

## [Finding Relationships](https://docs.montiapm.com/academy/insights\#finding-relationships)

In this guide, I’ll use data from a production Meteor web app.

First, we will try to find some relationships between metrics in that app. Let's begin.

**What is responsible for the CPU utilized by the app?**

[![Monti Insights - Active Sessions vs CPU Usage](https://docs.montiapm.com/images/active-sessions-vs-cpu-usage.png)](https://docs.montiapm.com/images/active-sessions-vs-cpu-usage.png)

For the above, we will try to relate active sessions and average CPU usage. And there is a very strong relationship (see the correlation coefficient value, which is very close to 1).

Next, look at the slope of the line. We can see that CPU usage is increasing with the number of active sessions. You can also try to relate sub rate and created observers with CPU usage. By doing so you will see some other relations also.

**What we can derive from the above relationship?**

With this information, we now know that active session, sub rate and some other factors are responsible for the CPU usage directly. If we can reduce the sub rate somehow, that’ll reduce the CPU usage. Likewise, we can take decisions based on the derived information.

Likewise, you can get answers for questions like these as well:

- Does my application require more RAM?
- Is there any relationship between the number of active sessions and RAM?
- Is there any relationship between RAM and CPU usage?

## [Capacity Planning](https://docs.montiapm.com/academy/insights\#capacity-planning)

Another useful aspect of Monti Insights is that it can be used for capacity planning. Let me show you how.

First, let's try to relate CPU usage and RAM.

[![Monti Insights - CPU Usage vs RAM](https://docs.montiapm.com/images/cpu-usage-vs-ram.png)](https://docs.montiapm.com/images/cpu-usage-vs-ram.png)

Those two also have a strong relationship. This app is hosted on [modulus.io](http://modulus.io/) and I know from experience that 6% CPU is the maximum this app can reach. (That’s because [modulus.io](http://modulus.io/) gives us a shared VM and its CPU usage is capped at ~6%.)

So, now let's try to make some predictions. Based on the above, even if our app uses the maximum CPU, it will only need 227 MB of RAM. But one instance of modulus has 396 MB of RAM. Hence, we know that we need more CPU rather than more RAM. Maybe we can move into another cloud that offers more CPU.

Now, let's try to do the capacity planning. Try to relate **active sessions and CPU usage**.

[![Monti Insights - Predictions](https://docs.montiapm.com/images/predictions.png)](https://docs.montiapm.com/images/predictions.png)

Based on this, we can only have 232 active sessions inside one instance. So, we can predict how many instances we need to handle a given load.

* * *

These use cases are just a few uses of Monti Insights. Now you can mix and match all kinds of metric and discover hidden secrets about your app.

[PREVIOUS\\
\\
Reduce Bandwidth and CPU Waste](https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste)

[NEXT\\
\\
Understanding Mean, Histogram and Percentiles](https://docs.montiapm.com/academy/mean-histogram-and-percentiles)