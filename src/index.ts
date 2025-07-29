#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

import { SmartlingClient } from './smartling-client.js';
import { addProjectTools } from './tools/projects.js';
import { addFileTools } from './tools/files.js';
import { addJobTools } from './tools/jobs.js';
import { addQualityTools } from './tools/quality.js';
import { addTaggingTools } from './tools/tagging.js';
import { addGlossaryTools } from './tools/glossary.js';
import { addWebhookTools } from './tools/webhooks.js';

dotenv.config();

console.log('--------------------------------');
console.log('Starting Smartling MCP Server');
console.log('--------------------------------');

// Validate required environment variables
if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
  throw new Error('SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
}

const server = new McpServer(
  {
    name: 'smartling-mcp-server',
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

const smartlingClient = new SmartlingClient({
  userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
  userSecret: process.env.SMARTLING_USER_SECRET,
  baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
});

// Add all tool groups
addProjectTools(server, smartlingClient);
addFileTools(server, smartlingClient);
addJobTools(server, smartlingClient);
addQualityTools(server, smartlingClient);
addTaggingTools(server, smartlingClient);
addGlossaryTools(server, smartlingClient);
addWebhookTools(server, smartlingClient);

console.log('Starting server');
const transport = new StdioServerTransport();
console.log('Connecting to transport');
await server.connect(transport);
console.log('Server connected');
