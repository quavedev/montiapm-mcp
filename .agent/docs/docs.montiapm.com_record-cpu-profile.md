---
url: "https://docs.montiapm.com/record-cpu-profile"
title: "Record CPU Profile"
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

# Record CPU Profile

When your app is using a large amount of CPU, or there are large compute times in methods or publications and you don't know what is causing it, the first step is to take a cpu profile. CPU Profiles show what functions were running, how long they ran, and what called them, which can be used to know where to optimize your app to make it more efficient and faster.

Monti APM provides the [montiapm:profiler](https://atmospherejs.com/montiapm/profiler#cpu-profiler-for-monti-apm) package to simplify recording CPU profiles. There are three different ways to record a profile with the package:

## [Remote Profile](https://docs.montiapm.com/record-cpu-profile\#remote-profile)

Remote profiles let you easily take a profile while your app is running in production. To take the profile:

1. Go to the [Tools tab](https://app.montiapm.com/apps/AUTO/tools/cpu-profiler) for one of your apps, and click on `Take a Remote Profile`
2. Give your profile a name, and decide how long it should run. Remote profiles have a noticeable overhead, so it is usually better to pick a shorter duration

[![Creating remote Profile](https://docs.montiapm.com/images/remote-profile.png)](https://docs.montiapm.com/images/remote-profile.png)

3. After you click save, it will show you a command to run in the browser's console. Copy this command, go to your app, and run it in the browser's console

The profile will now be available in Monti APM to [analyze](https://docs.montiapm.com/analyze-cpu-profile).

## [Continuous Profiling](https://docs.montiapm.com/record-cpu-profile\#continuous-profiling)

> This feature is in beta. During the beta, it is available for both the Startup and Pro plans. After the beta, it will only be part of the Pro plan.

Instead of only taking a profile when you tell it to, continuous profiling constantly records and saves cpu profiles so you always have the information you need to investigate issues.

The continuous profiler is designed to have a low overhead, around 2% additional cpu usage.

To enable, add the [montiapm:profiler](https://atmospherejs.com/montiapm/profiler#cpu-profiler-for-monti-apm) package to your app, and add this to a server file:

```js
import { Monti } from 'meteor/montiapm:agent';

if (Meteor.isProduction) {
  Monti.startContinuousProfiling();
}
```

After you deploy your app, Monti APM will start recording profiles. You can view them by going to the [Tools tab](https://app.montiapm.com/apps/AUTO/tools/cpu-profiler).

[![Select cpu profile](https://docs.montiapm.com/images/continuous-profiling.png)](https://docs.montiapm.com/images/continuous-profiling.png)

It shows a chart with the CPU usage for a host. You can use the dropdown to select a different host, or drag on the chart to select a time period.

After you select a time period, it will load the profiles and let you [analyze](https://docs.montiapm.com/analyze-cpu-profile) them.

[![Select cpu profile](https://docs.montiapm.com/images/continuous-profile-selection.png)](https://docs.montiapm.com/images/continuous-profile-selection.png)

You can drag the edges of the selection to resize it, or drag the middle of the selection to move it.

#### [Limitations](https://docs.montiapm.com/record-cpu-profile\#limitations)

We do not recommend using continuous profiling on Windows since v8 on Windows uses a large amount of CPU while profiling.

Meteor 1.9 or newer is recommended since older versions of Node had memory leaks while profiling.

The selection is limited to a maximum of 60 minutes. We are working on increasing the limit so any range can be selected.

The v8 profiler is a sampling profiler - at a regular interval it records the current stack trace of the running function, and uses those samples to estimate how long each function ran. Continuous profilers take fewer samples to reduce their overhead, so it is less accurate when looking at very short time ranges or functions that have small self and total times.

## [Local Profiles](https://docs.montiapm.com/record-cpu-profile\#local-profiles)

Local profiles can be taken without connecting your app to Monti APM. It is mostly useful in development, but can also be used in production if you can copy files from the server.

To enable, add the [montiapm:profiler](https://atmospherejs.com/montiapm/profiler#cpu-profiler-for-monti-apm) package to your app and set the `MONTI_PROFILE_LOCALLY=1` env var before starting the app.

When you want to take a profile, go to your app and open the browser's console. In the console, run:

```js
Monti.profileCpu(<seconds>)

// Example:
Monti.profileCpu(10);
```

The package will save the profile in the temp folder. The exact location is shown in the app's server logs.

You can then go to [Monti Debug](https://app.montiapm.com/debug?page=cpu-profiler) to analyze your profile.

[PREVIOUS\\
\\
System](https://docs.montiapm.com/dashboards/system-dashboard)

[NEXT\\
\\
Analyze Profile](https://docs.montiapm.com/analyze-cpu-profile)