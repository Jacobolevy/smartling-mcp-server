#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as dotenv from 'dotenv';

import { SmartlingClient } from './smartling-client.js';
import { addProjectTools } from './tools/projects.js';
import { addFileTools } from './tools/files.js';
import { addJobTools } from './tools/jobs.js';
import { addQualityTools } from './tools/quality.js';
import { addTaggingTools } from './tools/tagging.js';
import { addGlossaryTools } from './tools/glossary.js';
import { addWebhookTools } from './tools/webhooks.js';
import { addStringTools } from './tools/strings.js';
import { addContextTools } from './tools/context.js';
import { addLocaleTools } from './tools/locales.js';
import { addReportTools } from './tools/reports.js';

// Load environment variables
dotenv.config();

// Configuration schema for Smithery
export const configSchema = z.object({
  SMARTLING_USER_IDENTIFIER: z.string().describe("Smartling User Identifier for API authentication"),
  SMARTLING_USER_SECRET: z.string().describe("Smartling User Secret for API authentication"),
  SMARTLING_BASE_URL: z.string().default("https://api.smartling.com").describe("Smartling API base URL"),
  OPENAI_API_KEY: z.string().optional().describe("OpenAI API key for AI-powered features (optional but recommended)"),
});

type Config = z.infer<typeof configSchema>;

// Smithery default export function
export default function createSmartlingMCP({ config }: { config: Config }) {
  // Create MCP server
  const server = new McpServer(
    {
      name: 'smartling-mcp-server',
      version: '4.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize Smartling client with config
  const smartlingClient = new SmartlingClient({
    userIdentifier: config.SMARTLING_USER_IDENTIFIER,
    userSecret: config.SMARTLING_USER_SECRET,
    baseUrl: config.SMARTLING_BASE_URL,
  });

  // Add all tool groups
  addProjectTools(server, smartlingClient);
  addFileTools(server, smartlingClient);
  addJobTools(server, smartlingClient);
  addQualityTools(server, smartlingClient);
  addTaggingTools(server, smartlingClient);
  addGlossaryTools(server, smartlingClient);
  addWebhookTools(server, smartlingClient);
  addStringTools(server, smartlingClient);
  addContextTools(server, smartlingClient);
  addLocaleTools(server, smartlingClient);
  addReportTools(server, smartlingClient);

  return server.server;
}

// Check argv to determine if we're being used with npx or directly
const isDirectExecution = process.argv[1]?.endsWith('index.ts') || 
  process.argv[1]?.endsWith('index.js') ||
  process.argv.includes('--stdio') ||
  process.argv.includes('npx');

// Main function for direct execution (backward compatibility)
async function main() {
  

    console.error('🚀 Starting Smartling MCP Server v4.0.0');
    console.error('📝 Environment check:');
    console.error(`   - SMARTLING_USER_IDENTIFIER: ${process.env.SMARTLING_USER_IDENTIFIER ? '✅ Set' : '❌ Missing'}`);
    console.error(`   - SMARTLING_USER_SECRET: ${process.env.SMARTLING_USER_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.error(`   - SMARTLING_BASE_URL: ${process.env.SMARTLING_BASE_URL || 'https://api.smartling.com (default)'}`);
    console.error(`   - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '⚠️ Optional (for AI features)'}`);
    console.error('');

    // Validate required environment variables
    if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
      throw new Error('SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
    }

    // Use environment variables as config
    const config: Config = {
      SMARTLING_USER_IDENTIFIER: process.env.SMARTLING_USER_IDENTIFIER,
      SMARTLING_USER_SECRET: process.env.SMARTLING_USER_SECRET,
      SMARTLING_BASE_URL: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    };

    // Create server using the default export function
    const mcpServer = createSmartlingMCP({ config });
    
    console.error('🔧 Registering tools...');
    console.error('   ✅ All tools registered');

    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\n🔄 Graceful shutdown initiated...');
      await mcpServer.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('\n🔄 Graceful shutdown initiated...');
      await mcpServer.close();
      process.exit(0);
    });

    console.error('🌐 Connecting to transport...');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('✅ MCP server ready and connected!');
}

// Only run main if this is the main module
if (isDirectExecution) {
  main().catch((error) => {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  });
}
