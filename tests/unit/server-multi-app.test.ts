import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { server as mswServer } from '../setup.js';
import { createMontiMcpServer, type MontiMcpServerOptions } from '../../src/server.js';

async function connect(options: MontiMcpServerOptions) {
  const server = createMontiMcpServer(options);
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

describe('createMontiMcpServer tool registration', () => {
  let authCalls: string[];

  beforeEach(() => {
    authCalls = [];
    mswServer.use(
      http.post('https://api.montiapm.com/auth', async ({ request }) => {
        const body = (await request.json()) as { appId: string };
        authCalls.push(body.appId);
        return HttpResponse.text(`token-${body.appId}`);
      }),
      http.post('https://api.montiapm.com/core', ({ request }) => {
        const token = request.headers.get('authorization');
        return HttpResponse.json({
          data: { httpBreakdown: [{ name: `GET-/from-${token}`, sortedValue: 10, throughput: 1 }] },
        });
      }),
    );
  });

  it('single-app mode exposes the breakdown tools without an app argument', async () => {
    const client = await connect({ appId: 'one', appSecret: 's' });
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);

    expect(names).toEqual(
      expect.arrayContaining(['get_http_breakdown', 'get_method_breakdown', 'get_pub_breakdown', 'get_http_metrics']),
    );
    expect(names).not.toContain('list_apps');
    const breakdown = tools.find((tool) => tool.name === 'get_http_breakdown');
    expect(breakdown?.inputSchema.properties).not.toHaveProperty('app');

    const result = await client.callTool({ name: 'get_http_breakdown', arguments: {} });
    const payload = JSON.parse((result.content as { text: string }[])[0].text);
    expect(payload.rows[0].name).toBe('GET-/from-token-one');
    expect(payload).not.toHaveProperty('app');
  });

  it('multi-app mode routes each call to the selected app', async () => {
    const client = await connect({
      apps: [
        { name: 'api', appId: 'api-id', appSecret: 'x' },
        { name: 'jobs', appId: 'jobs-id', appSecret: 'y' },
      ],
    });
    const { tools } = await client.listTools();
    const breakdown = tools.find((tool) => tool.name === 'get_http_breakdown');
    expect(breakdown?.inputSchema.properties).toHaveProperty('app');
    expect(breakdown?.inputSchema.required).toContain('app');
    const explain = tools.find((tool) => tool.name === 'explain_metric');
    expect(explain?.inputSchema.properties).not.toHaveProperty('app');

    const listed = await client.callTool({ name: 'list_apps', arguments: {} });
    expect(JSON.parse((listed.content as { text: string }[])[0].text).apps.map((a: { name: string }) => a.name)).toEqual([
      'api',
      'jobs',
    ]);

    const result = await client.callTool({ name: 'get_http_breakdown', arguments: { app: 'jobs' } });
    const payload = JSON.parse((result.content as { text: string }[])[0].text);
    expect(payload.app).toBe('jobs');
    expect(payload.rows[0].name).toBe('GET-/from-token-jobs-id');
    expect(authCalls).toEqual(['jobs-id']);
  });

  it('multi-app mode rejects an unknown app', async () => {
    const client = await connect({
      apps: [
        { name: 'api', appId: 'api-id', appSecret: 'x' },
        { name: 'jobs', appId: 'jobs-id', appSecret: 'y' },
      ],
    });
    const result = await client.callTool({ name: 'get_http_breakdown', arguments: { app: 'nope' } });
    expect(result.isError).toBe(true);
    expect(authCalls).toEqual([]);
  });
});
