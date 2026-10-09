# Changelog

## 1.5.2

- The npm package now ships only the built `dist/` bundle, `README.md` and `CHANGELOG.md`, through a `files` list. Earlier versions also included `src/`, `tests/`, `scripts/` and config files.
- Normalized the `bin` path to `dist/index.js` so `npm publish` no longer warns about it.

## 1.5.1

- Fixed memory units. Monti reports `RAM_USAGE` and `TOTAL/FREE/USED_SYSTEM_MEM` in MB, but they were formatted as bytes, so 1,702 MB was shown as "1.66 KB". `get_system_metrics`, `get_health_summary`, `analyze_performance_bottlenecks` and `get_optimization_advice` now convert MB to bytes before formatting and before applying memory thresholds. `get_system_metrics` adds `rawUnit: "MB"` for memory metrics; `rawPercentiles` are unchanged.
- Fixed `estimatedTotalTime` in the breakdown tools, which overstated rarely called items because Monti averages per-item throughput over active minutes. For HTTP routes, rows now include `totalResponseTime` from IMPACT, and `RES_TIME` estimates use it directly. Other estimates are capped at IMPACT when available. Each estimate has an `estimatedTotalTimeSource` (`impact` or `upperBound`), and responses with upper bounds include a `note`.

See [#5](https://github.com/quavedev/montiapm-mcp/issues/5).

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
