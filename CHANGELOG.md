# Changelog

## 1.3.0

- Added `get_error_traces` tool for retrieving error occurrence traces, with filtering by type (`METHOD`, `SUBSCRIPTION`, `CLIENT`), status (`NEW`, `IGNORED`, `FIXED`), exact message, host, and time range. Returns formatted traces plus a summary of unique messages and type counts.
- Added `get_error_trace_detail` tool for fetching full details of a specific error trace by ID, including parsed stack traces and client environment info (browser, userId, IP, URL).
- Registered the new tools in the MCP server and updated the barrel export in `src/tools/index.ts`.
- Added unit tests covering happy paths, empty results, null/invalid stacks, missing traces, and query variable forwarding.
- Updated `README.md` and `CLAUDE.md` with the new tool descriptions and a note about running `codegen` before building.

See [#2](https://github.com/quavedev/montiapm-mcp/pull/2).
