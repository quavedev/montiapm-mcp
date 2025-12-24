---
url: "https://docs.montiapm.com/academy/live-queries"
title: "Optimizing Your Meteor App for Live Queries"
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

# Optimizing Your Meteor App for Live Queries

Live Query support is one of the major features of Meteor. A new Live Query is normally created when you return a cursor from a publication. Meteor will then reactively watch the query and send changes to the client.

Monti APM also tracks live queries created inside publications with the [`cursor.observe`](https://docs.meteor.com/api/collections.html#Mongo-Cursor-observe) and [`cursor.observeChanges`](https://docs.meteor.com/api/collections.html#Mongo-Cursor-observeChanges) api's. Those api's are used by many packages that help with publications, such as [zodern:relay](https://github.com/zodern/meteor-relay) or [peerlibrary:reactive-publish](https://github.com/peerlibrary/meteor-reactive-publish).

> What is the difference between an observer and live query?
>
> Observers are how you create live queries in Meteor. Meteor doesn't use the term live query as much anymore, though it is used as the name for similar features in other projects. You can consider it as another name for observers.

In order to detect these changes, Live Queries do some amazing work behind the scenes. This work requires cpu cycles and make live queries a major factor affecting your app’s CPU usage and scalability.

However, the number of Live Queries itself does not cause many issues. These are the factors affecting the CPU usage:

- Number of documents fetched by Live Queries
- Number of live changes happening
- Number of oplog notifications Meteor is receiving

Fortunately, there are ways to optimize our apps for better-utilized Live Queries. Let’s take a look.

### [Try to fetch as little as possible](https://docs.montiapm.com/academy/live-queries\#try-to-fetch-as-little-as-possible)

This is the rule of thumb you can apply for any app. But you can’t decide which publication to optimize until you go live or launch a load test. After that, you can use Monti to find out which publications fetch a lot of data from MongoDB. Here’s how to:

[![Publications](https://docs.montiapm.com/images/live-queries-fetched-documents.gif)](https://docs.montiapm.com/images/live-queries-fetched-documents.gif)

- Go to Monti APM’s Live Queries tab
- Sort the publications by “Fetched Documents”

Now you can see a set of publications sorted by the number of documents they fetched from MongoDB. Here are some optimizations you can apply to them:

- If the "Observer Lifetime" is short, try to use [SubsManager](https://github.com/kadirahq/subs-manager) to reduce the throughput.
- If the "Observer Reuse Ratio" is low, try to reduce it. We’ll talk more about this in a second.
- If possible, try to reduce the number of documents fetched by changing your code. For instance, You could use a limit when fetching data.

### [Reuse observers as much as possible](https://docs.montiapm.com/academy/live-queries\#reuse-observers-as-much-as-possible)

When you create a Live Query, it’ll create an observer internally. Observers are responsible for watching changes in the DB and notifying the Live Query. However, if there is an existing observer for a similar query, Meteor won’t create a new observer.

To be a similar query, both the query and the options passed to `Collection.find()` should be the same.

**Now let’s try to find some Live Queries to optimize**

- Sort publications by “Fetched Documents.”
- Then, check their Observer Reuse value.
- If that’s low, then we can optimize.

There are few things you can do to increase your observer reuse ratio. Take a look at [this guide](https://docs.montiapm.com/academy/improving-cpu-network-usage).

### [Optimize busy Live Queries](https://docs.montiapm.com/academy/live-queries\#optimize-busy-live-queries)

Another key point is to identify busy subscriptions and try to optimize them. A busy subscription is a subscription that triggers a lot of events, such as added, changed or removed, after it is created.

To identify busy subscriptions, with “Observer Changes: Live Updates”. These are the busy publications in your app.

[![Sort publications](https://docs.montiapm.com/images/sort-publications.gif)](https://docs.montiapm.com/images/sort-publications.gif)

> We calculate Live Updates by combining all the Observer Changes events except “Added (Initially)”.

Now that you know the busy publications in your app, try to see whether there is any chance to reduce the changes in those queries. Sometimes, you can add a field filter and try to avoid unnecessary changes, but it’s totally dependent on your app.

### [Prevent unwanted oplog notifications](https://docs.montiapm.com/academy/live-queries\#prevent-unwanted-oplog-notifications)

Meteor watches the MongoDB oplog to see changes happening in the MongoDB. Whenever something changes in the database, Meteor will receive the change as a notification. The notification is attached to a collection. Then, Meteor will forward this notification to most of the observers created for that collection.

Now let’s try to see whether we are getting unwanted oplog notifications or not.

For this, look at the trends of observer changes with the trends of oplog notifications. If there is a big difference in trends (but not in the count), that means there are some unwanted notifications.

[![Observer and Oplog changes](https://docs.montiapm.com/images/observer-and-oplog-changes.gif)](https://docs.montiapm.com/images/observer-and-oplog-changes.gif)

This is how you can check trends

This is usually because of doing bulk write operations in the DB. In that case, Meteor will also get those operations and try to handle them, even if there are no observers related to those updates. There is no direct fix; the only option is to avoid those bulk updates.

There are a few ways to improve this:

- If you can, avoid the bulk updates
- Move the collections with the bulk updates to a separate database and [manually connect](http://stackoverflow.com/a/20537457) to that database without the oplog. Observers will then poll the database every 10 seconds instead of following the oplog
- Switch to [cultofcoders:redis-oplog](https://github.com/Meteor-Community-Packages/redis-oplog). This replaces following the Mongo oplog with a more efficient implementation that uses redis. However, changes to the database made outside of the Meteor app are not detected by observers
- [Exclude](https://github.com/meteor/meteor/pull/13009) the collections from oplog tailing. Observers for those collections will use polling instead

* * *

These are just a couple of ways to optimize your app for Live Queries. Some of these fixes are very easy to implement. Always try to fix the subscriptions that are used frequently; otherwise this may lead to premature optimization.

[PREVIOUS\\
\\
Improve CPU & Network Usage](https://docs.montiapm.com/academy/improving-cpu-network-usage)

[NEXT\\
\\
Optimize for Oplog Integration](https://docs.montiapm.com/academy/optimize-your-app-for-oplog)