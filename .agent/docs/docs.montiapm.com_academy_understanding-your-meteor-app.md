---
url: "https://docs.montiapm.com/academy/understanding-your-meteor-app"
title: "Understanding Your Meteor App with Monti Debug"
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

# Understanding Your Meteor App with Monti Debug

Writing a Meteor app is fun and saves a lot of your development time compared with developing in a traditional way. Although it’s easy to write Meteor apps, there are many things happening behind the scenes. To write better apps, you need to understand what they do behind the scenes. Then you can easily optimize your app and create a nice experience for the end user.

Optimizing an app includes optimizing both the server-side code as well the client-side code. Most of the time, it’s a mix of both. So, it’s a good idea to see how the server side and client side work together.

## [Welcome To Monti Debug](https://docs.montiapm.com/academy/understanding-your-meteor-app\#welcome-to-monti-debug)

[Monti Debug](https://github.com/monti-apm/monti-debug) is a tool that helps you to see what’s happening in your app from the perspective of a single client. It can also see what’s happening in your server as well.

It’s easy to get started with Monti Debug. This is all you have to do:

- First, install Monti Debug with: `meteor add montiapm:debug`.
- Then run your app. (Let's assume your app runs on port 3000)
- After that, visit [https://debug.montiapm.com](https://debug.montiapm.com/)
- Then connect to [http://localhost:3000](http://localhost:3000/) from the Monti Debug UI

In this guide, we’ll explore Monti Debug’s UI and how to understand Meteor apps using it. Then, we’ll show you a demo on how to use Monti Debug in a real app.

Once you have started debugging, you’ll see an interface like this:

[![Monti Debug Overview](https://docs.montiapm.com/images/monti-debug-overview.png)](https://docs.montiapm.com/images/monti-debug-overview.png)

This is a unified view of what’s happening inside your app over the last couple of minutes.

Let’s look at some of these views.

### [Event Stream](https://docs.montiapm.com/academy/understanding-your-meteor-app\#event-stream)

Event Stream is the main part of Monti Debug. It shows what really happened in your app as a timeline. It includes all route changes, DDP activities, events and a few other things

[![Monti Debug event stream](https://docs.montiapm.com/images/event-stream.png)](https://docs.montiapm.com/images/event-stream.png)

At a glance, you should be able to understand some of these events, like `Route` and `Subscribe`. But there are some events you need to look at more closely. Let’s discuss.

> The bullet numbers are the numbers in the above screenshot.

1. Our app subscribed to the `core.lesson` publication. That subscription has a unique ID of `AXgmMb3npXpvk73Ly`. It’s generated by client-side Meteor code.
2. Then one of your documents in the lessons collection was changed. In Meteor, it’s not possible to identify which subscription triggered a live update. But, in this case we are pretty sure: it was the above subscription.
3. Then we got a DDP message called ready for the subscription with ID `AXgmMb3npXpvk73Ly`. It indicates that our subscription has sent all of the initial dataset to the client and the client can start working with the subscription data.
4. We called a Meteor method named `core.visitStep`. Its ID is 6.
5. Then we got a DDP message called `updated` for the above method. An `updated` message is a core part of the DDP protocol and indicates your method has pushed all of the changed data to the clients that are watching that data. This is also used in the latency compensation. Additionally, Meteor **only** calls the callback for the Meteor method once it sees this message.

### [Client Activities](https://docs.montiapm.com/academy/understanding-your-meteor-app\#client-activities)

The “Client Activities” view is a very important part of Monti Debug. It shows the performance metrics for Blaze and how your app is behaving on the client side.

Monti Debug tracks a lot of Blaze related activities. Those activities show the time spent by the CPU. It groups activities into following categories.

- View Creation – This shows the time spent by the CPU calling `onCreated` callbacks.
- View Destruction – This shows the time spent by the CPU calling `onDestroyed` callbacks.
- View Renders – This shows the time spent by the CPU calling `onRendered` callbacks.
- DOM Creation – This shows the time spent by the CPU creating DOM elements for Blaze views.
- DOM Destruction – This shows the time spent by the CPU destroying DOM elements related to Blaze views.
- Helpers - This shows the time spent by helpers in our app (Currently Monti Debug tracks template helpers only).
- Autoruns – This shows the time spent by autoruns in our app. Currently, we track autoruns created inside templates only.

Now that we know what are tracking in terms of Client Activities, let’s try to interpret several UI elements in the Client Activites view.

[![Monti Debug client activities](https://docs.montiapm.com/images/client-activities.png)](https://docs.montiapm.com/images/client-activities.png)

> The bullet numbers are the numbers in the above screenshot.

1. This is the time spent by Blaze doing stuff in that given second. Here we only track ~80% of the time Blaze spent on the CPU. According to the above chart, our app spent ~200ms of CPU time rendering our templates.
2. The vertical red bar on the chart shows the selected time and the details below the chart are for that time.
3. In this chart, we are looking at a specific time. Clicking on the `Back to Live button` will cause the live data to be shown as they arrive.
4. In the detailed view below the chart, individual items are sorted by `elaspedTime`. This is the amount of time they were running on the CPU. But, it’s possible to sort items by the number of times they were executed.
5. This is a progress bar showing the percentage of time that activity group spent running on the CPU.
6. This is the time that activity group spent running on the CPU.
7. This is the number of activities for that activity group.
8. This is a breakdown of the activities and their corresponding execution times.

## [Demo: Using Monti Debug](https://docs.montiapm.com/academy/understanding-your-meteor-app\#demo%3A-using-monti-debug)

In the following demo, we are going to see how to use Monti Debug in the Discover Meteor's [Microscope](https://github.com/DiscoverMeteor/Microscope) app and what we can improve.

optimize microscope with kadira debug - YouTube

[Photo image of Arunoda Prageeth Susiripala Manameldura](https://www.youtube.com/channel/UC6ABSyRbYDjvn87xexjreNQ?embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

Arunoda Prageeth Susiripala Manameldura

1.72K subscribers

[optimize microscope with kadira debug](https://www.youtube.com/watch?v=y6u5nJE-NPE)

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

[Watch on](https://www.youtube.com/watch?v=y6u5nJE-NPE&embeds_referring_euri=https%3A%2F%2Fdocs.montiapm.com%2F)

0:00

0:00 / 5:36

•Live

•

[PREVIOUS\\
\\
Managing Wait Time](https://docs.montiapm.com/academy/managing-waittime)

[NEXT\\
\\
Reduce Bandwidth and CPU Waste](https://docs.montiapm.com/academy/reduce-bandwidth-cpu-waste)