# Changelog

## 1.5.0

- Added `get_http_breakdown`, `get_method_breakdown` and `get_pub_breakdown` tools. They rank every route, method or publication by a chosen field (impact, response time, DB/compute/wait time, throughput, status class, observer reuse, fetched documents, and more) using the aggregated breakdown queries behind the Monti dashboards. Per-request averages also include `estimatedTotalTime` (average × throughput × window).
- Added `get_http_metrics` for a time series of one route's response time, throughput or status class.
- Added multi-app support: `MONTI_APPS` (JSON array of `{ name, appId, appSecret, region? }`) lets one server query several Monti apps. With two or more apps, data tools take a required `app` argument, results include `app`, and a `list_apps` tool lists the names. Single-app configuration is unchanged.
- `get_method_traces`, `get_subscription_traces` and `get_http_traces` now return a `note` when no traces were sampled, pointing to the breakdown tools.

See [#3](https://github.com/quavedev/montiapm-mcp/issues/3).

## 1.4.0

- Added optional `MONTI_REGION` environment variable for regional API endpoint support. When set, the auth and GraphQL endpoints use `api-{region}.montiapm.com` (e.g. `api-us.montiapm.com` for `MONTI_REGION=us`) instead of the default `api.montiapm.com`.
- Updated `README.md` with the new environment variable documentation.

See [#1](https://github.com/quavedev/montiapm-mcp/pull/1).

## 1.3.0

- Added `get_error_traces` tool for retrieving error occurrence traces, with filtering by type (`METHOD`, `SUBSCRIPTION`, `CLIENT`), status (`NEW`, `IGNORED`, `FIXED`), exact message, host, and time range. Returns formatted traces plus a summary of unique messages and type counts.
- Added `get_error_trace_detail` tool for fetching full details of a specific error trace by ID, including parsed stack traces and client environment info (browser, userId, IP, URL).
- Registered the new tools in the MCP server and updated the barrel export in `src/tools/index.ts`.
- Added unit tests covering happy paths, empty results, null/invalid stacks, missing traces, and query variable forwarding.
- Updated `README.md` and `CLAUDE.md` with the new tool descriptions and a note about running `codegen` before building.

See [#2](https://github.com/quavedev/montiapm-mcp/pull/2).
