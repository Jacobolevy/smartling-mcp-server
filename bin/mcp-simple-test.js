#!/usr/bin/env node

/**
 * 🧪 Simple MCP Test Server
 * Basic server to test MCP connectivity
 */

const readline = require('readline');

class SimpleMCPServer {
  sendResponse(response) {
    console.log(JSON.stringify(response));
  }

  sendError(message, id = null) {
    this.sendResponse({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message
      }
    });
  }

  async handleInitialize(id, params) {
    this.sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'smartling-test',
          version: '1.0.0'
        }
      }
    });
  }

  async handleListTools(id) {
    this.sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'test_connection',
            description: 'Test MCP connection',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      }
    });
  }

  async handleCallTool(id, params) {
    if (params.name === 'test_connection') {
      this.sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: '✅ MCP Connection successful!'
            }
          ]
        }
      });
    } else {
      this.sendError(`Unknown tool: ${params.name}`, id);
    }
  }

  async handleMessage(message) {
    try {
      const { jsonrpc, id, method, params } = JSON.parse(message);

      if (jsonrpc !== '2.0') {
        this.sendError('Invalid JSON-RPC version', id);
        return;
      }

      switch (method) {
        case 'initialize':
          await this.handleInitialize(id, params);
          break;
        case 'tools/list':
          await this.handleListTools(id);
          break;
        case 'tools/call':
          await this.handleCallTool(id, params);
          break;
        default:
          this.sendError(`Unknown method: ${method}`, id);
      }
    } catch (error) {
      this.sendError(`Invalid JSON-RPC message: ${error.message}`);
    }
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        this.handleMessage(line.trim());
      }
    });

    // Log to stderr, not stdout
    process.stderr.write('🧪 Simple MCP Test Server started\n');
  }
}

// Start the server
const server = new SimpleMCPServer();
server.start(); 