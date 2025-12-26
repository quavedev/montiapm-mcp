/**
 * Generates the Claude Code subagent markdown template for Meteor performance analysis.
 */

import { THRESHOLDS } from '../knowledge/thresholds.js';
import { METRIC_DEFINITIONS } from '../knowledge/glossary.js';
import { ALL_RECOMMENDATIONS } from '../knowledge/recommendations/index.js';

/**
 * Generate the YAML frontmatter for the subagent.
 */
function generateFrontmatter(): string {
  return `---
name: meteor-performance
description: >
  Expert Meteor and Node.js performance analyst. Use PROACTIVELY after any code changes
  to analyze performance implications, or when investigating slow methods, publications,
  or system resource issues. Queries live Monti APM data and provides documentation-backed
  recommendations.
tools: Read, Grep, Glob, Bash, mcp__montiapm__get_method_traces, mcp__montiapm__get_subscription_traces, mcp__montiapm__get_http_traces, mcp__montiapm__get_system_metrics, mcp__montiapm__get_error_metrics, mcp__montiapm__analyze_slow_methods, mcp__montiapm__analyze_performance_bottlenecks, mcp__montiapm__get_health_summary, mcp__montiapm__get_optimization_advice, mcp__montiapm__explain_metric
model: sonnet
---`;
}

/**
 * Generate the thresholds reference section.
 */
function generateThresholdsSection(): string {
  const thresholdsByCategory: Record<string, string[]> = {};

  for (const t of THRESHOLDS) {
    if (!thresholdsByCategory[t.category]) {
      thresholdsByCategory[t.category] = [];
    }

    const operator = t.higherIsWorse !== false ? '>' : '<';
    thresholdsByCategory[t.category].push(
      `  - ${t.metric}: ${operator}${t.warningValue}${t.unit === 'ratio' ? '' : t.unit} (warning), ${operator}${t.criticalValue}${t.unit === 'ratio' ? '' : t.unit} (critical)`,
    );
  }

  let section = `## Performance Thresholds

Use these thresholds to classify metric severity:

`;

  for (const [category, thresholds] of Object.entries(thresholdsByCategory)) {
    section += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
    section += thresholds.join('\n') + '\n\n';
  }

  return section;
}

/**
 * Generate the metric glossary section.
 */
function generateGlossarySection(): string {
  let section = `## Metric Glossary

Key metrics and their interpretations:

`;

  // Group by related function
  const keyMetrics = [
    'responseTime',
    'waitTime',
    'dbTime',
    'computeTime',
    'httpTime',
    'asyncTime',
    'throughput',
    'observerReuse',
    'lifespan',
    'activeSubs',
    'activeDocs',
    'updateRatio',
    'estimatedMemory',
    'cpuUsage',
    'memoryUsage',
    'eventLoopUtilization',
    'sessions',
  ];

  for (const metricName of keyMetrics) {
    const def = METRIC_DEFINITIONS[metricName];
    if (def) {
      section += `### ${def.name}\n`;
      section += `${def.description}\n`;
      if (def.interpretation) {
        section += `**Interpretation:** ${def.interpretation}\n`;
      }
      if (def.optimizationTips && def.optimizationTips.length > 0) {
        section += `**Tips:**\n`;
        for (const tip of def.optimizationTips) {
          section += `- ${tip}\n`;
        }
      }
      section += '\n';
    }
  }

  return section;
}

/**
 * Generate the recommendations section.
 */
function generateRecommendationsSection(): string {
  let section = `## Optimization Recommendations

Apply these recommendations based on identified bottlenecks:

`;

  const recsByCategory: Record<string, typeof ALL_RECOMMENDATIONS> = {};

  for (const rec of ALL_RECOMMENDATIONS) {
    if (!recsByCategory[rec.category]) {
      recsByCategory[rec.category] = [];
    }
    recsByCategory[rec.category].push(rec);
  }

  for (const [category, recs] of Object.entries(recsByCategory)) {
    section += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    for (const rec of recs) {
      section += `#### ${rec.title}\n`;
      section += `${rec.description}\n`;
      if (rec.docUrl) {
        section += `**Documentation:** ${rec.docUrl}\n`;
      }
      section += `**Actions:**\n`;
      for (const action of rec.actions) {
        section += `- ${action}\n`;
      }
      section += '\n';
    }
  }

  return section;
}

/**
 * Generate code examples for common optimizations.
 */
function generateCodeExamplesSection(): string {
  return `## Common Code Patterns

### ESR Index Pattern (Equality, Sort, Range)
\`\`\`javascript
// For query: { status: 'active', category: 'news' }, sort: { createdAt: -1 }
Posts.createIndex({
  status: 1,      // Equality
  category: 1,    // Equality
  createdAt: -1   // Sort
});
\`\`\`

### this.unblock() for Parallel Processing
\`\`\`javascript
Meteor.methods({
  sendNotification(userId) {
    this.unblock(); // Allow other methods from this client to run

    // HTTP/email operations won't block other methods
    Email.send({ to: user.email, subject: 'Notification', text: '...' });
  }
});
\`\`\`

### Redis-Oplog Namespace Pattern
\`\`\`javascript
// Publication with namespace scoping
Meteor.publish('companyUsers', function(companyId) {
  if (!this.userId) return this.ready();

  return Users.find(
    { companyId },
    { namespace: 'company::' + companyId }
  );
});

// Mutations must use matching namespace
Users.insert(userData, { namespace: 'company::' + userData.companyId });
\`\`\`

### Field Filtering in Publications
\`\`\`javascript
Meteor.publish('posts', function() {
  return Posts.find({}, {
    fields: {
      title: 1,
      summary: 1,      // Use summary instead of full content
      authorId: 1,
      createdAt: 1,
      commentCount: 1  // Computed field instead of fetching comments
    }
  });
});
\`\`\`

### Batched Database Queries
\`\`\`javascript
// Instead of N+1 queries in a loop:
const posts = Posts.find().fetch();
const authorIds = posts.map(p => p.authorId);
const authors = Users.find({ _id: { $in: authorIds } }).fetch();
const authorMap = Object.fromEntries(authors.map(a => [a._id, a]));
\`\`\`

### Normalized Queries for Observer Reuse
\`\`\`javascript
Meteor.publish('recentPosts', function() {
  const now = Date.now();
  const currentHour = now - (now % 3600000); // Round to hour
  const oneHourAgo = new Date(currentHour - 3600000);

  return Posts.find({ createdAt: { $gte: oneHourAgo } });
});
\`\`\`
`;
}

/**
 * Generate the analysis workflow section.
 */
function generateWorkflowSection(): string {
  return `## Analysis Workflow

When analyzing performance issues, follow this workflow:

### 1. Get Overall Health
Start with \`get_health_summary\` to understand the current state:
- Health score (0-100)
- Key metrics: response time, error rate, CPU, memory
- Top issues identified

### 2. Identify Bottlenecks
Use \`analyze_performance_bottlenecks\` to find:
- Slowest methods and their breakdown (DB, compute, HTTP, wait)
- Publication issues (observer reuse, document counts)
- System resource pressure

### 3. Deep Dive into Slow Operations
For methods: \`get_method_traces\` with filtering by name/time
For publications: \`get_subscription_traces\`
For HTTP routes: \`get_http_traces\`

### 4. Get Targeted Advice
Use \`get_optimization_advice\` with category:
- 'methods' - Method optimization recommendations
- 'publications' - Publication/subscription advice
- 'system' - CPU, memory, scaling recommendations

### 5. Explain Metrics
When users ask about specific metrics, use \`explain_metric\`:
- Provides definition, interpretation, and optimization tips
- Links to relevant documentation

### 6. Correlate with Code
After identifying bottlenecks:
- Use Read/Grep/Glob to find relevant code
- Look for the patterns described in recommendations
- Suggest specific code changes based on findings

## MCP Tool Reference

| Tool | Use When |
|------|----------|
| \`get_health_summary\` | Starting analysis, quick status check |
| \`analyze_slow_methods\` | High response times reported |
| \`analyze_performance_bottlenecks\` | Comprehensive analysis needed |
| \`get_method_traces\` | Investigating specific method behavior |
| \`get_subscription_traces\` | Publication/subscription issues |
| \`get_http_traces\` | HTTP route performance |
| \`get_system_metrics\` | CPU, memory, session monitoring |
| \`get_error_metrics\` | Error rate investigation |
| \`get_optimization_advice\` | Getting category-specific recommendations |
| \`explain_metric\` | Understanding what a metric means |
`;
}

/**
 * Generate the complete subagent template.
 */
export function generateSubagentTemplate(): string {
  const frontmatter = generateFrontmatter();

  const systemPrompt = `# Meteor Performance Analyst

You are an expert Meteor and Node.js performance analyst. Your role is to:

1. **Diagnose Performance Issues** - Use Monti APM tools to query live performance data
2. **Identify Bottlenecks** - Analyze method, publication, and system metrics
3. **Provide Recommendations** - Give actionable, documentation-backed optimization advice
4. **Correlate with Code** - Find relevant code and suggest specific improvements

## Key Principles

- Always start with data: query Monti APM before making recommendations
- Be specific: reference actual methods/publications by name
- Provide code examples: show exactly what to change
- Link to documentation: include relevant URLs for further reading
- Consider trade-offs: explain implications of each optimization

${generateThresholdsSection()}
${generateGlossarySection()}
${generateRecommendationsSection()}
${generateCodeExamplesSection()}
${generateWorkflowSection()}
`;

  return `${frontmatter}\n\n${systemPrompt}`;
}
