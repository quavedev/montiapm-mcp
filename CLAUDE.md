# Monti APM MCP Server

## Overview
TypeScript MCP server for Monti APM - enables AI assistants to query
Meteor application performance data via GraphQL.

## Tech Stack
- **MCP SDK:** @modelcontextprotocol/sdk
- **GraphQL:** Apollo Client 4 + GraphQL Code Generator
- **Testing:** Vitest with MSW for mocking
- **Build:** tsup (esbuild-based bundler) for ESM output

## Key Commands
```bash
npm run build          # Build project with tsup
npm run dev            # Run in development mode
npm run test           # Run unit tests in watch mode
npm run test:run       # Run unit tests once
npm run test:integration # Run integration tests (requires credentials)
npm run codegen        # Generate GraphQL types
npm run codegen:watch  # Watch mode for codegen
npm run typecheck      # Type check without emitting
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| `MONTI_APP_ID` | Monti APM App ID (from app settings) |
| `MONTI_APP_SECRET` | Monti APM App Secret (from app settings) |

## Architecture

### Directory Structure
```
src/
├── auth/           # Authentication with Monti APM API
├── graphql/        # Apollo Client and GraphQL operations
│   ├── client.ts   # Apollo Client setup
│   ├── operations/ # .graphql operation documents
│   └── generated/  # AUTO-GENERATED, DO NOT EDIT
├── tools/          # MCP tool implementations
└── utils/          # Shared utilities
```

### Key Design Decisions
1. **Apollo Client 4** - Uses modern Apollo patterns with ErrorLink
2. **GraphQL Code Generator** - Static types from schema introspection
3. **Custom Schema Loader** - Handles authenticated introspection
4. **Single App Per Instance** - Credentials via environment variables

## GraphQL Code Generation

Run `npm run codegen` after modifying `.graphql` files in `src/graphql/operations/`.

Generated types are in `src/graphql/generated/graphql.ts` - **DO NOT EDIT** this file manually.

### Schema Introspection
The schema is loaded via authenticated introspection using `schema-loader.ts`.
Requires valid `MONTI_APP_ID` and `MONTI_APP_SECRET` environment variables.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `get_method_traces` | Retrieve method execution traces |
| `get_trace_detail` | Get detailed events for a specific trace |
| `get_subscription_traces` | Retrieve subscription/publication traces |
| `get_observer_traces` | Retrieve observer traces |
| `get_system_metrics` | Retrieve system metrics (RAM, CPU, Sessions) |
| `get_error_metrics` | Retrieve error count metrics |
| `analyze_slow_methods` | Analyze and summarize slow method patterns |
| `analyze_performance_bottlenecks` | Identify performance bottlenecks |
| `get_health_summary` | Get overall application health summary |

## API Reference

### Monti APM Endpoints
- **Auth:** `POST https://api.montiapm.com/auth`
- **GraphQL:** `POST https://api.montiapm.com/core`
- **Docs:** `https://api.montiapm.com/docs/explore.html`

### Rate Limits
- 5,000 requests/hour per app
- Max 1,000 records per query

## Testing

### Test Coverage Requirements
**Maintain minimum 95% statement coverage.** Run `npm run test:run -- --coverage` to verify.

Coverage breakdown:
- `src/tools/` - Target 99%+ (core business logic)
- `src/graphql/` - Target 100% (API client layer)
- `src/auth/` - Target 100% (authentication)
- `src/utils/` - Target 99%+ (utility functions)
- `src/server.ts` - Tool handlers tested via tool function tests

### Unit Tests
Located in `tests/unit/`. Uses Vitest with MSW for API mocking.

```bash
npm run test:run              # Run once
npm run test:run -- --coverage # With coverage report
npm run test                  # Watch mode
```

### Integration Tests
Located in `tests/integration/`. Requires real credentials in `.env`.

```bash
MONTI_APP_ID=<id> MONTI_APP_SECRET=<secret> npm run test:integration
```

## Common Issues

### "Token expired or invalid"
- Check that `MONTI_APP_ID` and `MONTI_APP_SECRET` are correct
- JWT tokens expire - the client handles refresh automatically

### "Rate limit exceeded"
- API is limited to 5,000 requests/hour
- Reduce query frequency or batch requests

### GraphQL Code Generation Fails
- Ensure credentials are set in environment
- Run `npm run codegen` with valid credentials
