#!/usr/bin/env node

/**
 * Smartling MCP Remote Server
 * MCP server deployable for internal platforms via WebSocket/HTTP
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebSocketServerTransport } from '@modelcontextprotocol/sdk/server/websocket.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';

const SMARTLING_SERVER_URL = 'https://smartling-mcp.onrender.com';

class SmartlingRemoteMCPServer {
  constructor() {
    this.app = express();
    this.setupExpressApp();
    
    this.server = new Server(
      {
        name: 'smartling-mcp-remote',
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

  setupExpressApp() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'smartling-mcp-remote',
        version: '1.0.0',
        protocol: 'MCP over WebSocket',
        smartling_server: SMARTLING_SERVER_URL,
        websocket_endpoint: '/mcp',
        timestamp: new Date().toISOString()
      });
    });

    // Documentation
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Smartling MCP Remote Server',
        version: '1.0.0',
        description: 'Remote MCP server for internal platforms',
        protocol: 'MCP over WebSocket',
        endpoints: {
          'GET /health': 'Health check',
          'WS /mcp': 'MCP WebSocket endpoint',
          'GET /': 'This documentation'
        },
        connection: {
          websocket_url: `ws://${req.get('host')}/mcp`,
          websocket_url_secure: `wss://${req.get('host')}/mcp`
        },
        smartling_integration: {
          backend_server: SMARTLING_SERVER_URL,
          tools_available: 4,
          real_api: true
        },
        usage: {
          client_example: 'WebSocket connection to /mcp endpoint',
          protocol: 'JSON-RPC 2.0 over WebSocket'
        }
      });
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    
    process.on('SIGINT', async () => {
      console.log('\nShutting down MCP server...');
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
            description: 'Get list of Smartling projects (227 projects from Wix account)',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Account ID (optional, uses default b0f6a896)',
                },
                limit: {
                  type: 'number',
                  description: 'Number of projects to return (default: 50)'
                }
              },
            },
          },
          {
            name: 'smartling_get_account_info',
            description: 'Get Smartling account information for Wix',
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
                  description: 'Project ID from Smartling',
                },
                fileUri: {
                  type: 'string',
                  description: 'Unique file URI identifier',
                },
                fileType: {
                  type: 'string',
                  description: 'File type (json, properties, xml, etc.)',
                },
                content: {
                  type: 'string',
                  description: 'File content to translate',
                },
              },
              required: ['projectId', 'fileUri', 'fileType', 'content'],
            },
          },
          {
            name: 'smartling_get_file_status',
            description: 'Get translation status of a file',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project ID',
                },
                fileUri: {
                  type: 'string',
                  description: 'File URI to check',
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
        console.error(`Tool execution error for ${name}:`, error.message);
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

  async start(port = 3000) {
    const deploymentPort = parseInt(process.env.PORT || port);

    // Start HTTP server
    const httpServer = this.app.listen(deploymentPort, '0.0.0.0', () => {
      console.log(`🌐 HTTP Server running on port ${deploymentPort}`);
      console.log(`📡 Health check: http://0.0.0.0:${deploymentPort}/health`);
      console.log(`📚 Documentation: http://0.0.0.0:${deploymentPort}/`);
    });

    // Start WebSocket server for MCP
    const wss = new WebSocketServer({ 
      server: httpServer, 
      path: '/mcp'
    });

    wss.on('connection', async (ws, request) => {
      console.log(`🔌 MCP WebSocket connection from ${request.socket.remoteAddress}`);
      
      const transport = new WebSocketServerTransport(ws);
      
      try {
        await this.server.connect(transport);
        console.log('✅ MCP server connected via WebSocket');
      } catch (error) {
        console.error('❌ MCP connection error:', error);
        ws.close();
      }
    });

    console.log(`🚀 Smartling MCP Remote Server started`);
    console.log(`🔌 WebSocket MCP endpoint: ws://0.0.0.0:${deploymentPort}/mcp`);
    console.log(`📊 Backend Smartling server: ${SMARTLING_SERVER_URL}`);
    console.log(`🎯 Ready for internal platform connections`);

    return httpServer;
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SmartlingRemoteMCPServer();
  const port = parseInt(process.env.PORT || '3000');

  server.start(port).catch(console.error);
}

export { SmartlingRemoteMCPServer }; 