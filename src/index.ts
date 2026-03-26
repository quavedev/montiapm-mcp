#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMontiMcpServer } from './server.js';
import { handleGenerateAgent } from './agent/generate.js';

async function main() {
  const args = process.argv.slice(2);

  // Handle --generate-agent flag
  if (args.includes('--generate-agent')) {
    await handleGenerateAgent(args);
    return;
  }

  const appId = process.env.MONTI_APP_ID;
  const appSecret = process.env.MONTI_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('Error: MONTI_APP_ID and MONTI_APP_SECRET environment variables are required');
    console.error('');
    console.error('Set these variables in your MCP client configuration:');
    console.error('  {');
    console.error('    "mcpServers": {');
    console.error('      "montiapm": {');
    console.error('        "command": "npx",');
    console.error('        "args": ["@quave/montiapm-mcp"],');
    console.error('        "env": {');
    console.error('          "MONTI_APP_ID": "<your-app-id>",');
    console.error('          "MONTI_APP_SECRET": "<your-app-secret>"');
    console.error('        }');
    console.error('      }');
    console.error('    }');
    console.error('  }');
    process.exit(1);
  }

  const region = process.env.MONTI_REGION;

  const server = createMontiMcpServer({ appId, appSecret, region });
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
