---
url: "https://docs.montiapm.com/dashboards/jobs-dashboard"
title: "Jobs Dashboard"
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

# Jobs Dashboard

This dashboard shows the performance of jobs in your app. Jobs can be:

- cron jobs, such as with [meteor-synced-cron](https://github.com/percolatestudio/meteor-synced-cron)
- jobs from a job queue, such as with [BullMQ](https://bullmq.io/)
- any custom traces you create with `Monti.traceJob`

Monti APM automatically tracks jobs in these packages:

- `percolate:synced-cron`
- `littledata:synced-cron`
- `@hokify/agenda`
- `agenda`
- `bullmq`
- `quave:synced-cron`

Are you using another open source job package? Please [create an issue](https://github.com/monti-apm/monti-apm-agent/issues) on GitHub and we'll look into automatically tracking jobs in it.

Jobs monitoring requires version 2.50 or 3.0.0-beta.11 or newer of `montiapm:agent`

## [Custom Traces](https://docs.montiapm.com/dashboards/jobs-dashboard\#custom-traces)

You can use `Monti.traceJob` to track any function or job in your app. The traces and metrics will appear in the Jobs Dashboard.

The full documentation for custom traces is in the [agent documentation](https://github.com/monti-apm/monti-apm-agent?tab=readme-ov-file#custom-traces).

Here is an example:

```js
setInterval(() => {
  Monti.traceJob({ name: 'remove expired messages' }, async () => {
    await Messages.removeAsync({ expiresAt: { $lt: new Date() } })
  });
}, 1000 * 30);
```

## [Jobs Summary](https://docs.montiapm.com/dashboards/jobs-dashboard\#jobs-summary)

The Jobs summary shows you the summary for the selected job, or all jobs if none are selected.

The metrics are:

- **Throughput** \- the number of jobs completed each minute
- **Duration** \- how long it takes to complete a single job
- **Delay** \- the amount of time between when the job was created or was scheduled to run and when it started being processed
- **Error Rate** \- the percentage of jobs that errored

## [Job Breakdown](https://docs.montiapm.com/dashboards/jobs-dashboard\#job-breakdown)

The breakdown shows a list of the different jobs in your app. It always shows the throughput for each job. You can also choose a second metric to view with the sort option. The metrics are:

- **Throughput** \- the number of jobs completed each minute
- **Pending Jobs** \- the number of jobs waiting to run
- **Errored jobs** \- the number of jobs that errored
- **Job Duration** \- the average amount of time it takes for a job to run
- **Job Delay** \- how long a job waits to run after it was scheduled
- **Impact** \- how much impact it could have optimizing the job, based on throughput and duration
- **DB Time** \- the average time spent on database operations in each job
- **Async Time** \- the average time spent on async operations in each job
- **Compute Time** \- the average time spent doing compute in each job
- **Email Time** \- the average time spent sending email in each job
- **FS Time** \- the average time spent on accessing the filesystem in each job
- **HTTP Time** \- the average time spent making HTTP requests in each job

## [Job Duration with Traces](https://docs.montiapm.com/dashboards/jobs-dashboard\#job-duration-with-traces)

The Job Duration chart shows the job duration, broken down by how much time was spent in different categories:

- **db** \- Time spent on database activities, including read and write operations.
- **http** \- Time spent waiting on HTTP requests
- **compute** \- Time spent on CPU-intensive tasks inside a method (e.g. time spent sorting and calculating a value).
- **async** \- Time spent on async activities, especially with NPM modules.
- **email** \- Time spent sending emails.
- **fs** \- Time spent accessing the file system

Additionally, if you like to inspect a trace of a job at a particular point, find that point on the chart and click it. You'll get a few sample traces that you can analyze. Or you can click `view all traces` to see a full list you can sort.

## [Added and Completed Jobs](https://docs.montiapm.com/dashboards/jobs-dashboard\#added-and-completed-jobs)

This chart shows the number of jobs added compared to the number of jobs completed.

The added metric is only tracked for job queues. Other types of jobs will not show any added jobs.

You can manually record created jobs by calling [`Monti.recordNewJob('job name')`](https://github.com/monti-apm/monti-apm-agent?tab=readme-ov-file#new-jobs). Learn more in the [agent documentation](https://github.com/monti-apm/monti-apm-agent?tab=readme-ov-file#new-jobs).

## [Error Rate](https://docs.montiapm.com/dashboards/jobs-dashboard\#error-rate)

This chart shows the percentage of jobs that have errored.

## [Job Delay](https://docs.montiapm.com/dashboards/jobs-dashboard\#job-delay)

This chart shows the amount of time from when the job was scheduled to run to when it did run.

This metric is automatically tracked for job queues. When using `Monti.traceJob`, you can pass the delay as waitTime:

```js
// waitTime is in milliseconds
Monti.traceJob({ name: 'job name', waitTime: 100}, () => {
  // code to trace
});
```

## [Running Jobs](https://docs.montiapm.com/dashboards/jobs-dashboard\#running-jobs)

This chart shows the number of jobs currently running, at the moment the agent sent the metrics to Monti APM.

## [Pending Jobs](https://docs.montiapm.com/dashboards/jobs-dashboard\#pending-jobs)

This chart shows the number of jobs waiting to be processed. Currently, Monti APM does not track this metric by default to avoid causing performance issues.

You can manually track it by having your app occasionally call [`Monti.recordPendingJobs('job name', pendingCount)`](https://github.com/monti-apm/monti-apm-agent?tab=readme-ov-file#pending-jobs) to update the value. Learn more in the [agent documentation](https://github.com/monti-apm/monti-apm-agent?tab=readme-ov-file#pending-jobs).

[PREVIOUS\\
\\
Live Queries](https://docs.montiapm.com/dashboards/live-queries-dashboard)

[NEXT\\
\\
System](https://docs.montiapm.com/dashboards/system-dashboard)