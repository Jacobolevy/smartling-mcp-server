#!/usr/bin/env node

/**
 * Smartling MCP Wrapper Server
 * True MCP protocol server that wraps our HTTP REST API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';

const SMARTLING_SERVER_URL = 'https://smartling-mcp.onrender.com';

class SmartlingMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'smartling-mcp-wrapper',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'smartling_get_projects',
            description: 'Get list of Smartling projects',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Account ID (optional, uses default b0f6a896)',
                },
              },
            },
          },
          {
            name: 'smartling_get_account_info',
            description: 'Get Smartling account information',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'smartling_upload_file',
            description: 'Upload file to Smartling for translation',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project ID',
                },
                fileUri: {
                  type: 'string',
                  description: 'File URI',
                },
                fileType: {
                  type: 'string',
                  description: 'File type (json, properties, etc.)',
                },
                content: {
                  type: 'string',
                  description: 'File content',
                },
              },
              required: ['projectId', 'fileUri', 'fileType', 'content'],
            },
          },
          {
            name: 'smartling_get_file_status',
            description: 'Get file translation status',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project ID',
                },
                fileUri: {
                  type: 'string',
                  description: 'File URI',
                },
              },
              required: ['projectId', 'fileUri'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Call our HTTP REST API
        const result = await this.callSmartlingHTTP(name, args || {});
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Smartling API error: ${error.message}`
        );
      }
    });
  }

  async callSmartlingHTTP(toolName, args) {
    return new Promise((resolve, reject) => {
      // Set default account ID if not provided
      if (toolName === 'smartling_get_projects' && !args.accountId) {
        args.accountId = 'b0f6a896';
      }

      const postData = JSON.stringify(args);
      
      const options = {
        hostname: 'smartling-mcp.onrender.com',
        port: 443,
        path: `/execute/${toolName}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              resolve(result.result);
            } else {
              reject(new Error(result.error || 'Unknown error'));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Smartling MCP Wrapper Server running on stdio');
  }
}

const server = new SmartlingMCPServer();
server.run().catch(console.error); 