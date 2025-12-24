---
url: "https://docs.montiapm.com/academy/reducing-pubsub-data-usage"
title: "Reducing PubSub Data Usage"
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

# Reducing PubSub Data Usage

Publications are the main place where your app sends data to the client when a client subscribes to it. Meteor caches a copy of each client's data in the server's memory. For example, let's say a single client has approximately 2MB of subscription data. If you have 1000 concurrent clients connecting to your app, Meteor caches approximately 2GB (2MB \* 1000) of client data in the server's memory.

If your app sends a large amount of data, it will take a considerable amount of time for it to reach the client (especially when utilizing mobile networks). So it is very important to reduce the amount of data your app sends to clients, both for server performance and to provide a fast experience for your users. Let’s see what we can do about it.

> Fetching a lot of data (~1 MB per each subscription) from the DB and sending them to the client takes considerable amount of CPU. This will lead to a major bottleneck in your app's scalability.

## [Use Field Filtering](https://docs.montiapm.com/academy/reducing-pubsub-data-usage\#use-field-filtering)

Most of the time, you don't need to publish all the fields of the MongoDB documents. Try using field filtering to remove the data your client doesn't need. For example, imagine your app is a blog and a typical blog post looks like this in MongoDB:

```js
    {
      "_id": "this is the id",
      "title": "This is my summery",
      "content": "This is my content and it is very very long"
    }
```

Your home page contains a list of all blog posts and their titles. This is the publication used for that:

```js
    Meteor.publish('getTitles', function() {
      return Posts.find();
    });
```

In this case, you are also sending the `content` field to the client, but the client does not need it. Thus, the optimized version excludes `content` by using field filtering:

```js
    Meteor.publish('getTitles', function() {
      return Posts.find({}, {fields: {title: 1}});
    });
```

Use Meteor Documentation to learn more about [field filtering](https://docs.meteor.com/api/collections.html#fieldspecifiers).

## [Restructure Your Application](https://docs.montiapm.com/academy/reducing-pubsub-data-usage\#restructure-your-application)

With some small changes, you can greatly reduce the amount of data you send to the client.

Let's look at an example. You have a Meteor app for your blog. The blog has 200 articles, and you are sending all of the titles to the client. However, your users only need to know about the more recent articles. You could send the last 20 articles instead of all of them. Making this change reduces the required memory by a factor of 10. The following example shows how to implement this modification:

```js
    Meteor.publish('getTitles', function() {
      return Posts.find({}, {fields: {title: 1}, limit: 20});
    });
```

This is just an example. You can use paginations or implement a similar technique. Refer to the [Pagination subscriptions](https://guide.meteor.com/data-loading#pagination) section of the Meteor Guide, or the Meteorpedia article on [infinite scrolling](http://www.meteorpedia.com/read/Infinite_Scrolling) for implementing paginations with Meteor.

## [Restructure Your Data](https://docs.montiapm.com/academy/reducing-pubsub-data-usage\#restructure-your-data)

What if you want a content summary along with the title for your blog posts? In this case, you may decide to send the `content` to the client too, and you can show a summary based on that to the client. This works, but there is better way.

You can create a summary when you are creating and editing the blog post and assign it to a new field called `summary`. Then you can send that field instead of `content`, reducing the data usage. See below:

```js
    Meteor.publish('getTitles', function() {
      return Posts.find({}, {fields: {title: 1, summary: 1}, limit: 20});
    });
```

## [Counting On The Server Side](https://docs.montiapm.com/academy/reducing-pubsub-data-usage\#counting-on-the-server-side)

Sometimes, especially when you are building dashboard and charts, you might need to count the number of documents for some queries. For that, you should not send documents to the client and do the counts on the client side.

Best way is to count them in the server side using a package like [publish-counts](https://github.com/percolatestudio/publish-counts).

You may also consider using [MongoDB aggregation techniques](https://docs.montiapm.com/academy/make-your-app-faster#do-server-side-aggregations) to get a summery of data and send them to the client.

These are only some of the tips you can use to save subscription data, save server memory usage, and reduce latency.

[PREVIOUS\\
\\
Make Your App Faster](https://docs.montiapm.com/academy/make-your-app-faster)

[NEXT\\
\\
Know Your Observers](https://docs.montiapm.com/academy/know-your-observers)