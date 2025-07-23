#!/usr/bin/env node

console.error("🔧 Ultra-Basic Smartling MCP Server starting...");

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Minimal server state
let initialized = false;

// Send JSON-RPC response
function sendResponse(id, result = null, error = null) {
  const response = {
    jsonrpc: "2.0",
    id: id
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result || {};
  }
  
  console.log(JSON.stringify(response));
}

// Handle JSON-RPC requests
function handleRequest(request) {
  console.error(`📨 Request: ${request.method} (id: ${request.id})`);
  
  try {
    switch (request.method) {
      case 'initialize':
        initialized = true;
        sendResponse(request.id, {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "smartling-ultra-basic", 
            version: "1.0.0"
          },
          capabilities: {
            tools: {}
          }
        });
        break;

      case 'notifications/initialized':
        // Notifications don't get a response - just log
        console.error(`✅ Server initialized notification received`);
        return; // Don't send response for notifications

      case 'tools/list':
        if (!initialized) {
          sendResponse(request.id, null, {
            code: -32002,
            message: "Server not initialized"
          });
          return;
        }
        
        sendResponse(request.id, {
          tools: [
            {
              name: "test_connection",
              description: "Test if MCP server is working",
              inputSchema: {
                type: "object",
                properties: {},
                required: []
              }
            }
          ]
        });
        break;

      case 'resources/list':
        sendResponse(request.id, {
          resources: []
        });
        break;

      case 'prompts/list':
        sendResponse(request.id, {
          prompts: []
        });
        break;

      case 'tools/call':
        if (!initialized) {
          sendResponse(request.id, null, {
            code: -32002,
            message: "Server not initialized"
          });
          return;
        }

        const toolName = request.params?.name;
        
        if (toolName === 'test_connection') {
          sendResponse(request.id, {
            content: [{
              type: "text",
              text: "✅ MCP Server is working! Connection successful."
            }]
          });
        } else {
          sendResponse(request.id, null, {
            code: -32601,
            message: `Unknown tool: ${toolName}`
          });
        }
        break;

      default:
        if (request.id !== undefined) {
          sendResponse(request.id, null, {
            code: -32601,
            message: `Unknown method: ${request.method}`
          });
        }
    }
  } catch (error) {
    console.error(`❌ Error handling request: ${error.message}`);
    if (request.id !== undefined) {
      sendResponse(request.id, null, {
        code: -32603,
        message: "Internal error"
      });
    }
  }
}

// Process input line by line
rl.on('line', (line) => {
  if (!line.trim()) return;
  
  try {
    const request = JSON.parse(line);
    handleRequest(request);
  } catch (error) {
    console.error(`❌ Invalid JSON: ${error.message}`);
  }
});

rl.on('close', () => {
  console.error("📡 MCP connection closed");
  process.exit(0);
});

console.error("✅ Ultra-Basic MCP Server ready"); 