import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Exercises the real built stdio entry point. No Salesforce credentials are
// passed and no tool is invoked, so this never accesses Salesforce data.
test('stdio initialization, ping, and tool discovery remain compatible', async () => {
  const client = new Client({ name: 'protocol-compatibility-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/index.js'],
    env: { PATH: process.env.PATH ?? '' },
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    assert.equal(client.getServerVersion().name, 'salesforce-mcp-server');
    await client.ping();
    const { tools } = await client.listTools();
    assert.equal(tools.length, 15);
    assert.equal(new Set(tools.map(tool => tool.name)).size, tools.length);
    for (const name of ['salesforce_query_records', 'salesforce_dml_records', 'salesforce_manage_debug_logs']) {
      assert.ok(tools.some(tool => tool.name === name), `${name} is discoverable`);
    }
    for (const tool of tools) assert.equal(tool.inputSchema.type, 'object');
  } finally {
    await client.close();
  }
});
