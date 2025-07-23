#!/usr/bin/env node

/**
 * 🔧 ROBUST SMARTLING MCP SERVER
 * ✅ Fixed timeouts and hanging issues
 * ✅ Proper error handling for Claude Desktop
 */

const https = require('https');
const readline = require('readline');

const TIMEOUT_MS = 60000; // 60 seconds max per request (for batch operations)
const SMARTLING_SERVER_URL = 'https://smartling-mcp.onrender.com';

class RobustSmartlingMCPServer {
  constructor() {
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    // Prevent crashes
    process.on('uncaughtException', (error) => {
      console.error(`UNCAUGHT EXCEPTION: ${error.message}`);
      this.sendError(999, 'Internal server error', error.message);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(`UNHANDLED REJECTION: ${reason}`);
      this.sendError(999, 'Promise rejection', String(reason));
    });
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      result: result
    };
    console.log(JSON.stringify(response));
  }

  sendError(id, code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      error: {
        code: code,
        message: message,
        data: data
      }
    };
    console.log(JSON.stringify(response));
  }

  async handleToolsList(id) {
    try {
      const tools = [
        {
          name: 'smartling_get_account_info',
          description: 'Get Smartling account information (fast)',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'smartling_get_projects',
          description: 'Get list of Smartling projects (227 available)',
          inputSchema: {
            type: 'object',
            properties: {
              accountId: {
                type: 'string',
                description: 'Account ID (optional, uses default b0f6a896)'
              },
              limit: {
                type: 'number',
                description: 'Number of projects to return (default: 5 for speed)',
                default: 5
              }
            },
            required: []
          }
        },
        {
          name: 'smartling_diagnostic',
          description: 'Quick diagnostic test',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ];

      this.sendResponse(id, { tools });
    } catch (error) {
      this.sendError(id, -32603, 'Failed to list tools', error.message);
    }
  }

  async callSmartlingWithTimeout(toolName, args = {}) {
    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout after ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);

      // Default account ID
      if (toolName === 'smartling_get_projects' && !args.accountId) {
        args.accountId = 'b0f6a896';
      }

      // Limit projects for speed
      if (toolName === 'smartling_get_projects' && !args.limit) {
        args.limit = 5; // Only get 5 projects for speed
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
          'User-Agent': 'RobustSmartlingMCP/1.0'
        },
        timeout: TIMEOUT_MS - 1000 // Leave 1s buffer
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
          // Prevent memory issues
          if (data.length > 50000) {
            clearTimeout(timeout);
            reject(new Error('Response too large'));
          }
        });
        
        res.on('end', () => {
          clearTimeout(timeout);
          try {
            const result = JSON.parse(data);
            resolve(result.success ? result.result : result);
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        clearTimeout(timeout);
        reject(error);
      });

      req.on('timeout', () => {
        clearTimeout(timeout);
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  async handleToolCall(id, name, args) {
    try {
      console.error(`🔧 Calling tool: ${name}`);
      
      // Quick diagnostic
      if (name === 'smartling_diagnostic') {
        this.sendResponse(id, {
          status: 'healthy',
          server: 'robust-mcp',
          timestamp: new Date().toISOString(),
          timeout_ms: TIMEOUT_MS
        });
        return;
      }

      // Call Smartling with timeout
      const result = await this.callSmartlingWithTimeout(name, args);
      
      console.error(`✅ Tool ${name} completed`);
      this.sendResponse(id, result);
      
    } catch (error) {
      console.error(`❌ Tool ${name} failed: ${error.message}`);
      this.sendError(id, -32603, `Tool execution failed: ${error.message}`, {
        tool: name,
        args: args,
        timeout_ms: TIMEOUT_MS
      });
    }
  }

  async handleMessage(line) {
    try {
      const message = JSON.parse(line);
      const { id, method, params } = message;

      console.error(`📨 Request: ${method} (id: ${id})`);

      switch (method) {
        case 'initialize':
          this.sendResponse(id, {
            capabilities: { tools: {} },
            serverInfo: { 
              name: 'robust-smartling-mcp', 
              version: '1.0.0' 
            }
          });
          break;

        case 'tools/list':
          await this.handleToolsList(id);
          break;

        case 'tools/call':
          const { name, arguments: args } = params;
          await this.handleToolCall(id, name, args || {});
          break;

        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      console.error(`❌ Message handling error: ${error.message}`);
      this.sendError(null, -32700, 'Parse error', error.message);
    }
  }

  start() {
    console.error('🚀 Robust Smartling MCP Server started');
    console.error(`⏱️  Timeout: ${TIMEOUT_MS}ms per request`);
    console.error('🔗 Backend: https://smartling-mcp.onrender.com');
    console.error('✅ Ready for Claude Desktop');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        // Handle each message with timeout
        Promise.race([
          this.handleMessage(line.trim()),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Message timeout')), TIMEOUT_MS)
          )
        ]).catch((error) => {
          console.error(`❌ Message timeout: ${error.message}`);
          this.sendError(null, -32603, 'Request timeout', {
            timeout_ms: TIMEOUT_MS,
            message: error.message
          });
        });
      }
    });

    rl.on('close', () => {
      console.error('📡 MCP connection closed');
      process.exit(0);
    });
  }
}

// Start the robust server
const server = new RobustSmartlingMCPServer();
server.start(); 