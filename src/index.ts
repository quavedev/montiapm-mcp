#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMontiMcpServer } from './server.js';
import { readServerOptionsFromEnv } from './config.js';
import { handleGenerateAgent } from './agent/generate.js';

async function main() {
  const args = process.argv.slice(2);

  // Handle --generate-agent flag
  if (args.includes('--generate-agent')) {
    await handleGenerateAgent(args);
    return;
  }

  let server;
  try {
    server = createMontiMcpServer(readServerOptionsFromEnv(process.env));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error('');
    console.error('Configure one app with MONTI_APP_ID and MONTI_APP_SECRET, or several apps with MONTI_APPS:');
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
    console.error('');
    console.error('  MONTI_APPS=\'[{"name":"api","appId":"<id>","appSecret":"<secret>"},{"name":"jobs","appId":"<id>","appSecret":"<secret>"}]\'');
    process.exit(1);
  }

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
