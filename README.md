# Monti APM MCP Server

An MCP (Model Context Protocol) server that enables AI assistants to interact with [Monti APM](https://montiapm.com/) for Meteor application performance monitoring.

## Features

- Query method execution traces with performance breakdowns
- Retrieve subscription/publication performance data
- Monitor HTTP request performance and errors
- Monitor system metrics (RAM, CPU, sessions, MongoDB pool)
- Track error rates and trends
- Analyze slow methods with actionable recommendations
- Identify performance bottlenecks across your app
- Get comprehensive health summaries with scores

## Quick Start

### 1. Get Your Credentials

1. Log in to [Monti APM Dashboard](https://app.montiapm.com/)
2. Go to your app's **Settings** page
3. Copy your **App ID** and **App Secret**

### 2. Configure Claude Code

Add to your `~/.claude/mcp_servers.json`:

```json
{
  "mcpServers": {
    "montiapm": {
      "command": "npx",
      "args": ["@quave/montiapm-mcp"],
      "env": {
        "MONTI_APP_ID": "your-app-id-here",
        "MONTI_APP_SECRET": "your-app-secret-here",
        "MONTI_REGION": "us"
      }
    }
  }
}
```

### 3. Restart Claude Code

After saving the config, restart Claude Code to load the MCP server.

### 4. Start Asking Questions

You can now ask Claude to analyze your Meteor app's performance:

```
"Give me a health summary of my application"
"What are the slowest methods in my app?"
"Show me error trends from the last hour"
```

## Claude Code Subagent

Generate a specialized Claude Code subagent for Meteor performance analysis:

```bash
npx @quave/montiapm-mcp --generate-agent
```

This creates `.claude/agents/meteor-performance.md` with:
- Expert knowledge of Meteor performance optimization
- Pre-configured access to all Monti APM MCP tools
- Documentation-backed thresholds and recommendations
- Code examples for common optimization patterns

**Options:**
- `--output <path>` - Custom output path (default: `.claude/agents/meteor-performance.md`)
- `--stdout` - Print to stdout instead of file
- `--force` - Overwrite existing file

After running, Claude Code will automatically use this subagent when:
- Analyzing performance issues
- Investigating slow methods and publications
- Reviewing code changes for performance implications
- Getting optimization recommendations

## How to Use

### Diagnosing Slow Performance

Ask Claude to identify performance issues:

```
"My app feels slow. Can you analyze what's causing it?"
"Show me the top 10 slowest method calls from the last hour"
"Which methods are spending the most time in database operations?"
"Analyze performance bottlenecks in my app"
```

### Investigating Specific Methods

Drill down into specific methods:

```
"Show me traces for the 'users.update' method"
"Get details for trace ID abc123"
"Why is my 'posts.list' method taking so long?"
```

### Monitoring Publications

Analyze subscription performance:

```
"Show me slow publications"
"Which subscriptions are taking the longest to load?"
"Get traces for the 'userProfile' publication"
```

### Monitoring HTTP Routes

Analyze HTTP request performance:

```
"Show me slow HTTP requests"
"Which API routes are taking the longest?"
"Get traces for the /api/users route"
"Are there any HTTP errors in my app?"
```

### System Health

Check overall system health:

```
"What's my app's memory usage looking like?"
"Show me CPU usage over the last 2 hours"
"How many active sessions do I have?"
"Give me a complete health report"
```

### Error Tracking

Investigate errors:

```
"Are there any error spikes recently?"
"Show me error trends for the last 24 hours"
"Is my error rate increasing or decreasing?"
```

### Getting Recommendations

Get actionable advice:

```
"What should I optimize first in my app?"
"Give me recommendations for improving performance"
"Analyze slow methods and tell me how to fix them"
```

## Available Tools

### Trace Analysis

| Tool | Description |
|------|-------------|
| `get_method_traces` | Retrieve method execution traces with time spent in DB, compute, HTTP, etc. |
| `get_trace_detail` | Get detailed events timeline for a specific trace |
| `get_subscription_traces` | Retrieve publication/subscription traces |
| `get_http_traces` | Retrieve HTTP request traces with performance metrics |

### Metrics

| Tool | Description |
|------|-------------|
| `get_system_metrics` | Get RAM, CPU, sessions, and MongoDB pool metrics |
| `get_error_metrics` | Get error count metrics and trends over time |

### Analysis

| Tool | Description |
|------|-------------|
| `analyze_slow_methods` | Identify slow methods with optimization recommendations |
| `analyze_performance_bottlenecks` | Comprehensive bottleneck analysis across methods, pubs, and system |
| `get_health_summary` | Overall app health score (0-100) with insights |

## Example Conversations

### Example 1: Quick Health Check

**You:** "How is my Meteor app doing?"

**Claude:** *Uses `get_health_summary` tool and responds with:*
- Health score: 85/100 (Good)
- Average response time: 145ms
- No errors in the last hour
- Memory usage is stable
- Insight: "Application is performing well with no immediate concerns."

### Example 2: Investigating Slow Methods

**You:** "My users are complaining the app is slow. Help me find out why."

**Claude:** *Uses `analyze_slow_methods` and `analyze_performance_bottlenecks` tools:*
- Found 3 methods with response time > 500ms
- `orders.search` is the slowest at 2.3s average
- Main bottleneck: Database operations (78% of time)
- Recommendation: "Add indexes to the orders collection, particularly on the fields used in search queries"

### Example 3: Debugging a Specific Issue

**You:** "The checkout flow is timing out. Check the 'cart.checkout' method."

**Claude:** *Uses `get_method_traces` filtered by method name:*
- Found 15 traces for `cart.checkout` in the last hour
- Average response time: 4.2s (very high!)
- Breakdown: DB: 3.1s, HTTP: 0.8s, Compute: 0.3s
- "The method is spending 74% of time in database operations. Let me get a detailed trace..."

*Uses `get_trace_detail`:*
- Timeline shows 12 sequential MongoDB queries
- Recommendation: "Batch these queries or use MongoDB aggregation pipeline"

## Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONTI_APP_ID` | Yes | Your Monti APM application ID |
| `MONTI_APP_SECRET` | Yes | Your Monti APM application secret |
| `MONTI_REGION` | No | Region code (e.g. `us`). When set, endpoints use `api-{region}.montiapm.com` instead of `api.montiapm.com` |

### Tool Parameters

Most tools accept these common parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `startTime` | Unix timestamp in milliseconds | 1 hour ago |
| `endTime` | Unix timestamp in milliseconds | Now |
| `limit` | Maximum results to return | 100 |

### System Metrics Types

Available metrics for `get_system_metrics`:

- `CPU_USAGE` - CPU utilization percentage
- `RAM_USAGE` - Memory used by the app
- `SESSIONS` - Active DDP sessions
- `NEW_SESSIONS` - New sessions per minute
- `MONGO_POOL_CHECKOUT_DELAY` - MongoDB connection pool wait time

### Resolution Options

For time-series data:

- `RES_1MIN` - 1-minute resolution (max 1000 minutes range)
- `RES_30MIN` - 30-minute resolution (max 14 days range)
- `RES_3HOUR` - 3-hour resolution (limited by plan retention)

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/quavedev/montiapm-mcp.git
cd montiapm-mcp
npm install
```

### Commands

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Run unit tests
npm run test

# Run integration tests (requires credentials)
MONTI_APP_ID=xxx MONTI_APP_SECRET=xxx npm run test:integration

# Type check
npm run typecheck

# Generate GraphQL types (requires credentials)
MONTI_APP_ID=xxx MONTI_APP_SECRET=xxx npm run codegen
```

### Project Structure

```
src/
├── auth/           # Authentication with Monti APM API
├── graphql/        # Apollo Client and GraphQL operations
│   ├── client.ts   # Apollo Client setup
│   ├── operations/ # GraphQL operation documents
│   └── generated/  # Auto-generated types (DO NOT EDIT)
├── tools/          # MCP tool implementations
├── utils/          # Shared utilities
├── server.ts       # MCP server setup
└── index.ts        # Entry point
```

## API Rate Limits

- 5,000 requests/hour per app
- Max 1,000 records per query
- Resolution limits: 1min (1000 min range), 30min (14 days), 3hour (plan retention)

## Troubleshooting

### "Token expired or invalid"
- Verify your `MONTI_APP_ID` and `MONTI_APP_SECRET` are correct
- Check if credentials are properly passed to the MCP server

### "Rate limit exceeded"
- API is limited to 5,000 requests/hour
- Reduce query frequency or increase time ranges

### No data returned
- Check that your Meteor app is sending data to Monti APM
- Verify the time range includes periods with activity

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Links

- [Monti APM Documentation](https://docs.montiapm.com/)
- [Monti APM API Explorer](https://api.montiapm.com/docs/explore.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
