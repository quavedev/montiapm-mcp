---
url: "https://docs.montiapm.com/academy/make-your-app-faster"
title: "Make Your App Faster"
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

# Make Your App Faster

This guide will help you to speed up your methods and publications by following a few techniques. First let's try to speed up methods; later on I'll show you how to apply these techniques for publications as well.

Open the [Methods Dashboard](https://app.montiapm.com/apps/AUTO/dashboard/methods) to follow along.

## [Throughput matters](https://docs.montiapm.com/academy/make-your-app-faster\#throughput-matters)

First you need to sort your methods by throughput and optimize methods from top to bottom. This way you focus on the methods utilized the most by your users, which will save you resources since you’ll be optimizing what your users care about.

[![Methods Sort by Throughput](https://docs.montiapm.com/images/methods-sort-by-througput.png)](https://docs.montiapm.com/images/methods-sort-by-througput.png)

Click on a method and you'll see the Response Time Breakdown. If the response time is above 500ms, you might need to worry about the method. Click on the Response Time Breakdown graph and analyze some traces to see what's really happening inside your app.

[![Sample Method Trace](https://docs.montiapm.com/images/sample-method-trace.png)](https://docs.montiapm.com/images/sample-method-trace.png)

Then you can use the following guides to optimize if some parts of your traces are slower.

## [Indexes](https://docs.montiapm.com/academy/make-your-app-faster\#indexes)

Normally, your database queries should take no more than 300 ms. If they take more than that, you'll likely need an index for your query. You should add an index (or allocate an index) for all the queries you use, especially for methods with high throughput. Otherwise you'll have a hard time when your database is larger and you have plenty of users using your app.

### [What is an index?](https://docs.montiapm.com/academy/make-your-app-faster\#what-is-an-index%3F)

MongoDB stores your data on the hard disk, without any order and in some random places. Now, let's say you have 1,000 documents and you need to find a single document. MongoDB needs to start from the first document and traverse until it finds the document you are looking for. This is inefficient, and quickly becomes slow if you have a large number of documents or many requests.

An index is a better way to find documents. It is a sorted list that maintains a pointer to the specific document in the database. Indexes are also stored on the hard disk, but are loaded into the memory when used. Since the index is sorted, MongoDB can find your document quickly. This comes at a cost—you need to create indexes for all queries to find them faster. However, there are some ways to use a single index for multiple queries.

### [Learn indexing](https://docs.montiapm.com/academy/make-your-app-faster\#learn-indexing)

Learning how to use an index is a big topic and needs to be taught correctly. Refer to the following MongoDB documentation, which is really useful:

- [MongoDB Index Documentation](http://docs.mongodb.org/manual/indexes/)

You can also watch the following videos extracted from [MongoDB for DBA](https://university.mongodb.com/courses/M201/about) course.

- [Index Overview](https://youtu.be/dTN1pRMa83E)
- [Explain](https://youtu.be/OnQrHff0Yno)
- [Optimizing your CRUD Operations](https://youtu.be/VCvvV_PsREI)
- [Basic Benchmarking](https://youtu.be/kcJK1R1hIgc)

## [Optimizing HTTP calls, email sending, and third party NPM modules](https://docs.montiapm.com/academy/make-your-app-faster\#optimizing-http-calls%2C-email-sending%2C-and-third-party-npm-modules)

All methods interacting with third party services take a considerable amount of time to complete. Using these calls in a method will cause two main issues:

1. Other methods from the same client will have to wait for the completion of the current method.
2. They will slow down the method itself.

You can use `this.unblock()` to ask Meteor not to wait on this method. Sometimes it is not wise to use `this.unblock()`. Refer our article on [Managing WaitTime](https://docs.montiapm.com/academy/managing-waittime) to learn more about `this.unblock()`

For emails, you can also use `Meteor.defer`, as shown below:

```js
Meteor.methods({
  addNewPost: function(email, message) {
    // do the method logic
    Meteor.defer(function() {
      // send emails to all the subscribers
      Emails.send({});
    });
  }
});
```

With this, your method does not include the time used to send the email. This is completely okay, since adding a new post does not need to wait for sending emails, as it is a background operation. That's what `Meteor.defer` does.

### [Do server-side aggregations](https://docs.montiapm.com/academy/make-your-app-faster\#do-server-side-aggregations)

Sometimes you'll receive a lot of data for the method and do some calculations inside it. This will increase the Response Time of your app as well as the CPU usage. MongoDB aggregations is the best and most efficient option. Let's say you need to count the number of posts by each category. This is how you can do it with aggregations:

```js
const result = Posts.rawCollection.aggregate([\
  {$group: {_id: "$category", count: {$sum: 1}}}\
])
```

Refer to the MongoDB aggregation [documentation](http://docs.mongodb.org/manual/applications/aggregation/) for more information. Also refer to the following videos extracted from the [MongoDB for DBAs](https://university.mongodb.com/courses/M121/about) course :

- [Part 1](https://youtu.be/jQu96KOQv4k)
- [Part 2](https://youtu.be/5WZ3Q3BZEU4)

### [Reduce wait time](https://docs.montiapm.com/academy/make-your-app-faster\#reduce-wait-time)

With traces, you can find out the wait time and the methods and subscriptions for the current method.

[![Meteor Wait Time](https://docs.montiapm.com/images/meteor-wait-time.png)](https://docs.montiapm.com/images/meteor-wait-time.png)

Find those methods and subscriptions and reduce their Response Time by applying the above techniques.

## [A note on Publications](https://docs.montiapm.com/academy/make-your-app-faster\#a-note-on-publications)

You can follow the same process above for publications as well. However, instead of sorting with throughput, you need to sort with SubRate.

> If your Meteor app is using a Meteor release older than 2.3, `this.unblock` is not available in publications. You can add it with [lamhieu:unblock](https://github.com/lh0x00/meteor-unblock) (for Meteor 1.7 or newer) or [meteorhacks:unblock](https://github.com/meteorhacks/unblock) (for older Meteor releases)

[PREVIOUS\\
\\
Welcome](https://docs.montiapm.com/academy/welcome)

[NEXT\\
\\
Reducing PubSub Data Usage](https://docs.montiapm.com/academy/reducing-pubsub-data-usage)