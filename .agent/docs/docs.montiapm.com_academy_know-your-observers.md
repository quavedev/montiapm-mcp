---
url: "https://docs.montiapm.com/academy/know-your-observers"
title: "Know Your Observers"
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

# Know Your Observers

[Observers](https://docs.meteor.com/api/collections.html#Mongo-Cursor-observe) are among the key components of Meteor. They take care of observing documents on MongoDB and notifying of changes. We usually create observers inside publications. Here are a few common ways to create observers:

- When we return cursors from a publication
- When we create an advanced publication using [`cursor.observeChanges`](https://docs.meteor.com/api/collections.html#Mongo-Cursor-observeChanges)
- When we use one of the packages which permits reactive joins.

Creating observers results in higher CPU and RAM usage because of the work required to detect changes. Fortunately, meteor doesn't create new observers for identical cursors that have the same query selector, fields and sort specifiers. This is normally knows as ["observer reuse"](https://docs.montiapm.com/knowledge-base/glossary#observer-reuse) and you can check it using Kadira's PubSub dashboard.

## [Monitoring observers with Monti APM](https://docs.montiapm.com/academy/know-your-observers\#monitoring-observers-with-monti-apm)

With Monti APM, you can monitor observers and find out which publications are responsible for creating them. You can also use Monti APM to detect observer leaks, especially if you are working with advance publications and reactive joins.

Let’s discuss how to use Monti APM’s Observer Monitoring to detect performance issues. We’re going to use a sample app which has several observers related performance issues.

### [High observer usage](https://docs.montiapm.com/academy/know-your-observers\#high-observer-usage)

High Observer Usage describes a situation in which a large number of observers are being created. We need to find out which publication is responsible and take appropriate action.

See the following video:

A lot of observers in a meteor app - YouTube

[Photo image of Arunoda Prageeth Susiripala Manameldura](https://www.youtube.com/channel/UC6ABSyRbYDjvn87xexjreNQ?embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

Arunoda Prageeth Susiripala Manameldura

1.72K subscribers

[A lot of observers in a meteor app](https://www.youtube.com/watch?v=9OAWAIGkB4E)

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

[Watch on](https://www.youtube.com/watch?v=9OAWAIGkB4E&embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

0:00

0:00 / 1:04

•Live

•

You can see how both “Observer Created” and “Observer Deleted” counts are high. Then we can sort publications by Observer Created and find out the exact publication. Then we can check whether that’s something legitimate or not.

### [Observer leaks](https://docs.montiapm.com/academy/know-your-observers\#observer-leaks)

High CPU and RAM usage(and growing) is detected in our app. With Observer Monitoring, we can easily find out which publications are responsible for this leak. See the following video:

Observer leak in a Meteor app - YouTube

[Photo image of Arunoda Prageeth Susiripala Manameldura](https://www.youtube.com/channel/UC6ABSyRbYDjvn87xexjreNQ?embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

Arunoda Prageeth Susiripala Manameldura

1.72K subscribers

[Observer leak in a Meteor app](https://www.youtube.com/watch?v=z3aXAK4ru88)

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

[Watch on](https://www.youtube.com/watch?v=z3aXAK4ru88&embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

0:00

0:00 / 1:05

•Live

•

Observer Info shows that many observers are being created without being deleted. That’s the reason for the high CPU and RAM usage. This is termed an ‘observer leak’.

> Generally, both "Observer Created" and "Observer Deleted" needs to be identical in the long run (24 hours). If not, there seems be a observer leak in your app.

### [Low observer reuse](https://docs.montiapm.com/academy/know-your-observers\#low-observer-reuse)

Our sample app has a very low percentage of observer reuse. Observer Info shows us that many observer handlers are being created with a very low percentage of reused observers. In most of these cases we can improve observer reuse and boost performance of both Mongo and Meteor.

> An observer handler is created every time `cursor.observeChanges` is invoked. However, Meteor does not create an observer for each observer handler. It will try to reuse an already cached observer: if it cannot, then a new observer will be created.

see following video:

Learn observer reuse value of a Meteor app - YouTube

[Photo image of Arunoda Prageeth Susiripala Manameldura](https://www.youtube.com/channel/UC6ABSyRbYDjvn87xexjreNQ?embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

Arunoda Prageeth Susiripala Manameldura

1.72K subscribers

[Learn observer reuse value of a Meteor app](https://www.youtube.com/watch?v=bDLszm_sw8E)

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

[Watch on](https://www.youtube.com/watch?v=bDLszm_sw8E&embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

0:00

0:00 / 0:47

•Live

•

You can learn how to improve Observer Reuse by following [this article](https://docs.montiapm.com/academy/improving-cpu-network-usage/).

[PREVIOUS\\
\\
Reducing PubSub Data Usage](https://docs.montiapm.com/academy/reducing-pubsub-data-usage)

[NEXT\\
\\
Improve CPU & Network Usage](https://docs.montiapm.com/academy/improving-cpu-network-usage)