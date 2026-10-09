import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthClient } from './auth/client.js';
import { createGraphQLClient, type MontiGraphQLClient } from './graphql/client.js';
import {
  getMethodTraces,
  getMethodTracesSchema,
  getTraceDetail,
  getTraceDetailSchema,
  getSubscriptionTraces,
  getSubscriptionTracesSchema,
  getSystemMetrics,
  getSystemMetricsSchema,
  getErrorMetrics,
  getErrorMetricsSchema,
  analyzeSlowMethods,
  analyzeSlowMethodsSchema,
  analyzeBottlenecks,
  analyzeBottlenecksSchema,
  getHealthSummary,
  getHealthSummarySchema,
  getHttpTraces,
  getHttpTracesSchema,
  getOptimizationAdvice,
  getOptimizationAdviceSchema,
  explainMetric,
  explainMetricSchema,
  getErrorTraces,
  getErrorTracesSchema,
  getErrorTraceDetail,
  getErrorTraceDetailSchema,
  getHttpBreakdown,
  getHttpBreakdownSchema,
  getMethodBreakdown,
  getMethodBreakdownSchema,
  getPubBreakdown,
  getPubBreakdownSchema,
  getHttpMetrics,
  getHttpMetricsSchema,
} from './tools/index.js';

export interface MontiAppConfig {
  /** Name used to select the app through the `app` tool argument. */
  name: string;
  appId: string;
  appSecret: string;
  region?: string;
}

export interface MontiMcpServerOptions {
  /** Single-app mode. Ignored when `apps` is set. */
  appId?: string;
  appSecret?: string;
  region?: string;
  /** Multi-app mode: every tool gets a required `app` argument. */
  apps?: MontiAppConfig[];
}

export function resolveApps(options: MontiMcpServerOptions): MontiAppConfig[] {
  if (options.apps && options.apps.length > 0) {
    const names = new Set<string>();
    for (const app of options.apps) {
      if (!app.name || !app.appId || !app.appSecret) {
        throw new Error('Each Monti app needs name, appId and appSecret');
      }
      if (names.has(app.name)) {
        throw new Error(`Duplicate Monti app name: ${app.name}`);
      }
      names.add(app.name);
    }
    return options.apps;
  }
  if (!options.appId || !options.appSecret) {
    throw new Error('Provide appId and appSecret, or a non-empty apps list');
  }
  return [{ name: 'default', appId: options.appId, appSecret: options.appSecret, region: options.region }];
}

function createAppClient(app: MontiAppConfig): MontiGraphQLClient {
  // Derive base URL from region
  const baseUrl = app.region ? `https://api-${app.region}.montiapm.com` : 'https://api.montiapm.com';

  const authClient = new AuthClient({
    credentials: { appId: app.appId, appSecret: app.appSecret },
    authEndpoint: `${baseUrl}/auth`,
  });

  return createGraphQLClient(() => authClient.getToken(), `${baseUrl}/core`);
}

type AnyObjectSchema = z.ZodObject<z.ZodRawShape>;

export function createMontiMcpServer(options: MontiMcpServerOptions): McpServer {
  const server = new McpServer({
    name: 'montiapm',
    version: '1.0.0',
  });

  const apps = resolveApps(options);
  const clients = new Map(apps.map((app) => [app.name, createAppClient(app)]));
  const isMultiApp = apps.length > 1;
  const appNames = apps.map((app) => app.name) as [string, ...string[]];
  const appArgument = z
    .enum(appNames)
    .describe(`Monti app to query. One of: ${appNames.join(', ')}. Each app is a separate Meteor server with its own data.`);

  function register<S extends AnyObjectSchema>(
    name: string,
    meta: { title: string; description: string },
    schema: S,
    run: (client: MontiGraphQLClient, input: z.output<S>) => unknown,
    { appScoped = true }: { appScoped?: boolean } = {},
  ) {
    const needsApp = appScoped && isMultiApp;
    server.registerTool(
      name,
      {
        title: meta.title,
        description: meta.description,
        inputSchema: needsApp ? { ...schema.shape, app: appArgument } : schema.shape,
      },
      async (params: Record<string, unknown>) => {
        const { app, ...rest } = params;
        const appName = needsApp ? appArgument.parse(app) : apps[0].name;
        const client = clients.get(appName) as MontiGraphQLClient;
        const input = schema.parse(rest) as z.output<S>;
        const result = await run(client, input);
        const payload = needsApp && result && typeof result === 'object' ? { app: appName, ...result } : result;
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
        };
      },
    );
  }

  if (isMultiApp) {
    register(
      'list_apps',
      {
        title: 'List Monti Apps',
        description: 'List the Monti apps this server can query. Pass one of the names as the `app` argument of the other tools.',
      },
      z.object({}),
      () => ({ apps: apps.map((app) => ({ name: app.name, region: app.region ?? 'default' })) }),
      { appScoped: false },
    );
  }

  register(
    'get_method_traces',
    {
      title: 'Get Method Traces',
      description:
        'Retrieve Meteor method execution traces with performance metrics. Returns traces sorted by response time with breakdown of time spent in DB, compute, HTTP, etc. IMPORTANT: Default time range is last 1 hour. If no data is returned, try a wider startTime (e.g., 24 hours or 1 week ago in milliseconds).',
    },
    getMethodTracesSchema,
    (client, input) => getMethodTraces(client, input),
  );

  register(
    'get_trace_detail',
    {
      title: 'Get Trace Detail',
      description:
        'Get detailed events timeline for a specific method trace. Returns the full breakdown of what happened during the method execution.',
    },
    getTraceDetailSchema,
    (client, input) => getTraceDetail(client, input),
  );

  register(
    'get_subscription_traces',
    {
      title: 'Get Subscription Traces',
      description:
        'Retrieve Meteor publication/subscription traces. Shows how long subscriptions take to become ready and what time is spent in DB operations. IMPORTANT: Default time range is last 1 hour. If no data is returned (especially when filtering by publication name), try a wider startTime (e.g., 24 hours or 1 week ago in milliseconds).',
    },
    getSubscriptionTracesSchema,
    (client, input) => getSubscriptionTraces(client, input),
  );

  register(
    'get_system_metrics',
    {
      title: 'Get System Metrics',
      description:
        'Retrieve system performance metrics including RAM usage, CPU usage, active sessions, event loop latency, and garbage collection stats.',
    },
    getSystemMetricsSchema,
    (client, input) => getSystemMetrics(client, input),
  );

  register(
    'get_error_metrics',
    {
      title: 'Get Error Metrics',
      description:
        'Retrieve error count metrics over time. Shows how many errors occurred and whether error rates are trending up or down.',
    },
    getErrorMetricsSchema,
    (client, input) => getErrorMetrics(client, input),
  );

  register(
    'analyze_slow_methods',
    {
      title: 'Analyze Slow Methods',
      description:
        'Analyze and summarize slow method patterns. Identifies methods above a response time threshold and provides recommendations for optimization. IMPORTANT: Default time range is last 1 hour. For comprehensive analysis, use a wider startTime (e.g., 24 hours or 1 week ago).',
    },
    analyzeSlowMethodsSchema,
    (client, input) => analyzeSlowMethods(client, input),
  );

  register(
    'analyze_performance_bottlenecks',
    {
      title: 'Analyze Performance Bottlenecks',
      description:
        'Comprehensive analysis of performance bottlenecks across methods, publications, and system resources. Identifies high-priority issues with recommendations. IMPORTANT: Default time range is last 1 hour. For comprehensive analysis, use a wider startTime (e.g., 24 hours or 1 week ago).',
    },
    analyzeBottlenecksSchema,
    (client, input) => analyzeBottlenecks(client, input),
  );

  register(
    'get_health_summary',
    {
      title: 'Get Health Summary',
      description:
        'Get an overall health summary of the application including a health score, key metrics, and actionable insights. IMPORTANT: Default time range is last 1 hour. For a more representative summary, use a wider startTime (e.g., 24 hours ago).',
    },
    getHealthSummarySchema,
    (client, input) => getHealthSummary(client, input),
  );

  register(
    'get_http_traces',
    {
      title: 'Get HTTP Traces',
      description:
        'Retrieve HTTP request traces with performance metrics. Shows response times and breakdown of time spent in DB, compute, HTTP calls, etc. for HTTP routes. IMPORTANT: Default time range is last 1 hour. If no data is returned, try a wider startTime (e.g., 24 hours or 1 week ago in milliseconds).',
    },
    getHttpTracesSchema,
    (client, input) => getHttpTraces(client, input),
  );

  register(
    'get_optimization_advice',
    {
      title: 'Get Optimization Advice',
      description:
        'Get contextual optimization advice based on live Monti APM data. Analyzes methods, publications, or system metrics and provides documentation-backed recommendations including Redis-Oplog namespace patterns for improved reactivity. Categories: methods, publications, system.',
    },
    getOptimizationAdviceSchema,
    (client, input) => getOptimizationAdvice(client, input),
  );

  register(
    'explain_metric',
    {
      title: 'Explain Metric',
      description:
        'Get detailed explanation of a Monti APM metric including definition, formula, interpretation, and optimization tips. Available metrics include: responseTime, observerReuse, waitTime, dbTime, throughput, subRate, and more.',
    },
    explainMetricSchema,
    (_client, input) => explainMetric(input),
    { appScoped: false },
  );

  register(
    'get_error_traces',
    {
      title: 'Get Error Traces',
      description:
        'Retrieve error occurrence traces with details including error message, type, stack traces, and host. Supports filtering by error type (METHOD, SUBSCRIPTION, CLIENT), status (NEW, IGNORED, FIXED), and exact error message. IMPORTANT: Default time range is last 1 hour. If no data is returned, try a wider startTime.',
    },
    getErrorTracesSchema,
    (client, input) => getErrorTraces(client, input),
  );

  register(
    'get_error_trace_detail',
    {
      title: 'Get Error Trace Detail',
      description:
        'Get full details of a specific error trace including stack traces and client environment info (browser, userId, IP, URL). Use an error trace ID obtained from get_error_traces.',
    },
    getErrorTraceDetailSchema,
    (client, input) => getErrorTraceDetail(client, input),
  );

  register(
    'get_http_breakdown',
    {
      title: 'Get HTTP Route Breakdown',
      description:
        'Rank every HTTP route by one field over a time window (the Monti HTTP dashboard table). Default sortField IMPACT = total time each route cost, the best way to find which REST endpoints to optimize first. Use RES_TIME for average latency, DB/COMPUTE/ASYNC/HTTP_TIME to see where a route spends its time, THROUGHPUT for volume, _4xx/_5xx for failures. Works even when get_http_traces is empty. IMPORTANT: Default time range is last 1 hour; pass startTime for longer windows (free plans keep about 8 hours).',
    },
    getHttpBreakdownSchema,
    (client, input) => getHttpBreakdown(client, input),
  );

  register(
    'get_method_breakdown',
    {
      title: 'Get Method Breakdown',
      description:
        'Rank every Meteor method by one field over a time window (the Monti Methods dashboard table). Default sortField RESPONSE_TIME; each row also has estimatedTotalTime (average × throughput × window), an upper bound that overstates rarely called methods because Monti averages throughput over active minutes. Use DB_TIME/WAIT_TIME/COMPUTE_TIME/HTTP_TIME to see where time goes, THROUGHPUT for volume. Works even when get_method_traces is empty. IMPORTANT: Default time range is last 1 hour.',
    },
    getMethodBreakdownSchema,
    (client, input) => getMethodBreakdown(client, input),
  );

  register(
    'get_pub_breakdown',
    {
      title: 'Get Publication Breakdown',
      description:
        'Rank every publication by one field over a time window (the Monti Pub/Sub dashboard table). Default sortField RESPONSE_TIME (ms until ready). Use SUB_RATE, FETCHED_DOCUMENTS, OBSERVER_REUSE_RATIO, LIVE_*_DOCUMENTS or *_SIZE fields to find costly or poorly reused publications. Works even when get_subscription_traces is empty. IMPORTANT: Default time range is last 1 hour.',
    },
    getPubBreakdownSchema,
    (client, input) => getPubBreakdown(client, input),
  );

  register(
    'get_http_metrics',
    {
      title: 'Get HTTP Metrics',
      description:
        'Time series for one HTTP route (or all routes): RESPONSE_TIME (average ms per bucket), THROUGHPUT (requests/min), or responses by status class (_1xx.._5xx). Use it to see when a route got slower and whether it is a sustained regression or a spike. Route names come from get_http_breakdown, e.g. "POST-/api/v1/users". IMPORTANT: Default time range is last 1 hour.',
    },
    getHttpMetricsSchema,
    (client, input) => getHttpMetrics(client, input),
  );

  return server;
}
