import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
} from './tools/index.js';

export interface MontiMcpServerOptions {
  appId: string;
  appSecret: string;
}

export function createMontiMcpServer(options: MontiMcpServerOptions): McpServer {
  const server = new McpServer({
    name: 'montiapm',
    version: '1.0.0',
  });

  // Set up authentication
  const authClient = new AuthClient({
    credentials: {
      appId: options.appId,
      appSecret: options.appSecret,
    },
  });

  // Create GraphQL client
  const graphqlClient: MontiGraphQLClient = createGraphQLClient(() =>
    authClient.getToken(),
  );

  // Register tools
  server.registerTool(
    'get_method_traces',
    {
      title: 'Get Method Traces',
      description:
        'Retrieve Meteor method execution traces with performance metrics. Returns traces sorted by response time with breakdown of time spent in DB, compute, HTTP, etc. IMPORTANT: Default time range is last 1 hour. If no data is returned, try a wider startTime (e.g., 24 hours or 1 week ago in milliseconds).',
      inputSchema: getMethodTracesSchema.shape,
    },
    async (params) => {
      const input = getMethodTracesSchema.parse(params);
      const result = await getMethodTraces(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_trace_detail',
    {
      title: 'Get Trace Detail',
      description:
        'Get detailed events timeline for a specific method trace. Returns the full breakdown of what happened during the method execution.',
      inputSchema: getTraceDetailSchema.shape,
    },
    async (params) => {
      const input = getTraceDetailSchema.parse(params);
      const result = await getTraceDetail(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_subscription_traces',
    {
      title: 'Get Subscription Traces',
      description:
        'Retrieve Meteor publication/subscription traces. Shows how long subscriptions take to become ready and what time is spent in DB operations. IMPORTANT: Default time range is last 1 hour. If no data is returned (especially when filtering by publication name), try a wider startTime (e.g., 24 hours or 1 week ago in milliseconds).',
      inputSchema: getSubscriptionTracesSchema.shape,
    },
    async (params) => {
      const input = getSubscriptionTracesSchema.parse(params);
      const result = await getSubscriptionTraces(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_system_metrics',
    {
      title: 'Get System Metrics',
      description:
        'Retrieve system performance metrics including RAM usage, CPU usage, active sessions, event loop latency, and garbage collection stats.',
      inputSchema: getSystemMetricsSchema.shape,
    },
    async (params) => {
      const input = getSystemMetricsSchema.parse(params);
      const result = await getSystemMetrics(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_error_metrics',
    {
      title: 'Get Error Metrics',
      description:
        'Retrieve error count metrics over time. Shows how many errors occurred and whether error rates are trending up or down.',
      inputSchema: getErrorMetricsSchema.shape,
    },
    async (params) => {
      const input = getErrorMetricsSchema.parse(params);
      const result = await getErrorMetrics(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'analyze_slow_methods',
    {
      title: 'Analyze Slow Methods',
      description:
        'Analyze and summarize slow method patterns. Identifies methods above a response time threshold and provides recommendations for optimization. IMPORTANT: Default time range is last 1 hour. For comprehensive analysis, use a wider startTime (e.g., 24 hours or 1 week ago).',
      inputSchema: analyzeSlowMethodsSchema.shape,
    },
    async (params) => {
      const input = analyzeSlowMethodsSchema.parse(params);
      const result = await analyzeSlowMethods(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'analyze_performance_bottlenecks',
    {
      title: 'Analyze Performance Bottlenecks',
      description:
        'Comprehensive analysis of performance bottlenecks across methods, publications, and system resources. Identifies high-priority issues with recommendations. IMPORTANT: Default time range is last 1 hour. For comprehensive analysis, use a wider startTime (e.g., 24 hours or 1 week ago).',
      inputSchema: analyzeBottlenecksSchema.shape,
    },
    async (params) => {
      const input = analyzeBottlenecksSchema.parse(params);
      const result = await analyzeBottlenecks(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_health_summary',
    {
      title: 'Get Health Summary',
      description:
        'Get an overall health summary of the application including a health score, key metrics, and actionable insights. IMPORTANT: Default time range is last 1 hour. For a more representative summary, use a wider startTime (e.g., 24 hours ago).',
      inputSchema: getHealthSummarySchema.shape,
    },
    async (params) => {
      const input = getHealthSummarySchema.parse(params);
      const result = await getHealthSummary(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_http_traces',
    {
      title: 'Get HTTP Traces',
      description:
        'Retrieve HTTP request traces with performance metrics. Shows response times and breakdown of time spent in DB, compute, HTTP calls, etc. for HTTP routes. IMPORTANT: Default time range is last 1 hour. If no data is returned, try a wider startTime (e.g., 24 hours or 1 week ago in milliseconds).',
      inputSchema: getHttpTracesSchema.shape,
    },
    async (params) => {
      const input = getHttpTracesSchema.parse(params);
      const result = await getHttpTraces(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_optimization_advice',
    {
      title: 'Get Optimization Advice',
      description:
        'Get contextual optimization advice based on live Monti APM data. Analyzes methods, publications, or system metrics and provides documentation-backed recommendations including Redis-Oplog namespace patterns for improved reactivity. Categories: methods, publications, system.',
      inputSchema: getOptimizationAdviceSchema.shape,
    },
    async (params) => {
      const input = getOptimizationAdviceSchema.parse(params);
      const result = await getOptimizationAdvice(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'explain_metric',
    {
      title: 'Explain Metric',
      description:
        'Get detailed explanation of a Monti APM metric including definition, formula, interpretation, and optimization tips. Available metrics include: responseTime, observerReuse, waitTime, dbTime, throughput, subRate, and more.',
      inputSchema: explainMetricSchema.shape,
    },
    async (params) => {
      const input = explainMetricSchema.parse(params);
      const result = await explainMetric(input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_error_traces',
    {
      title: 'Get Error Traces',
      description:
        'Retrieve error occurrence traces with details including error message, type, stack traces, and host. Supports filtering by error type (METHOD, SUBSCRIPTION, CLIENT), status (NEW, IGNORED, FIXED), and exact error message. IMPORTANT: Default time range is last 1 hour. If no data is returned, try a wider startTime.',
      inputSchema: getErrorTracesSchema.shape,
    },
    async (params) => {
      const input = getErrorTracesSchema.parse(params);
      const result = await getErrorTraces(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_error_trace_detail',
    {
      title: 'Get Error Trace Detail',
      description:
        'Get full details of a specific error trace including stack traces and client environment info (browser, userId, IP, URL). Use an error trace ID obtained from get_error_traces.',
      inputSchema: getErrorTraceDetailSchema.shape,
    },
    async (params) => {
      const input = getErrorTraceDetailSchema.parse(params);
      const result = await getErrorTraceDetail(graphqlClient, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  return server;
}
