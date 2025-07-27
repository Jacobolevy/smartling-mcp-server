#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';

import { SmartlingClient } from './smartling-client';
import { projectTools, handleProjectTools } from './tools/projects';
import { fileTools, handleFileTools } from './tools/files';
import { jobTools, handleJobTools } from './tools/jobs';
import { qualityTools, handleQualityTools } from './tools/quality';
import { taggingTools, handleTaggingTools } from './tools/tagging';
import { glossaryTools, handleGlossaryTools } from './tools/glossary';
import { webhookTools, handleWebhookTools } from './tools/webhooks';

dotenv.config();

class SmartlingMCPServer {
  private server: Server;
  private smartlingClient: SmartlingClient;

  constructor() {
    this.server = new Server(
      {
        name: 'smartling-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Validate required environment variables
    if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
      throw new Error('SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
    }

    this.smartlingClient = new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET,
      baseUrl: process.env.SMARTLING_BASE_URL,
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ...projectTools,
          ...fileTools,
          ...jobTools,
          ...qualityTools,
          ...taggingTools,
          ...glossaryTools,
          ...webhookTools,
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        if (projectTools.some(tool => tool.name === name)) {
          result = await handleProjectTools(name, args || {}, this.smartlingClient);
        } else if (fileTools.some(tool => tool.name === name)) {
          result = await handleFileTools(name, args || {}, this.smartlingClient);
        } else if (jobTools.some(tool => tool.name === name)) {
          result = await handleJobTools(name, args || {}, this.smartlingClient);
        } else if (qualityTools.some(tool => tool.name === name)) {
          result = await handleQualityTools(name, args || {}, this.smartlingClient);
        } else if (taggingTools.some(tool => tool.name === name)) {
          result = await handleTaggingTools(name, args || {}, this.smartlingClient);
        } else if (glossaryTools.some(tool => tool.name === name)) {
          result = await handleGlossaryTools(name, args || {}, this.smartlingClient);
        } else if (webhookTools.some(tool => tool.name === name)) {
          result = await handleWebhookTools(name, args || {}, this.smartlingClient);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Tool execution error for ${name}:`, errorMessage);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool "${name}": ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Smartling MCP Server v2.0 running on stdio');
    console.error('Available tools: Projects, Files, Jobs, Quality Checks, Tagging, Glossaries, Webhooks');
  }
}

const server = new SmartlingMCPServer();
server.run().catch((error) => {
  console.error('Failed to start Smartling MCP server:', error);
  process.exit(1);
});
