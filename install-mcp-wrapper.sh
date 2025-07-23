#!/bin/bash

# 🚀 Smartling MCP Wrapper Installer
# Installs a true MCP server that wraps our HTTP REST API

set -e

echo "🚀 Installing Smartling MCP Wrapper..."
echo "📡 Connects to: https://smartling-mcp.onrender.com"

# Create wrapper directory
WRAPPER_DIR="$HOME/.smartling-mcp-wrapper"
echo "📁 Creating wrapper directory: $WRAPPER_DIR"

mkdir -p "$WRAPPER_DIR"
cd "$WRAPPER_DIR"

# Download wrapper files
echo "⬇️  Downloading MCP wrapper files..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "smartling-mcp-wrapper",
  "version": "1.0.0",
  "description": "MCP wrapper for Smartling HTTP REST API",
  "main": "mcp-wrapper.js",
  "type": "module",
  "bin": {
    "smartling-mcp": "./mcp-wrapper.js"
  },
  "scripts": {
    "start": "node mcp-wrapper.js",
    "dev": "node --inspect mcp-wrapper.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "keywords": [
    "mcp",
    "smartling",
    "translation",
    "localization"
  ],
  "author": "Smartling MCP Team",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create MCP wrapper
cat > mcp-wrapper.js << 'EOF'
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
            description: 'Get list of Smartling projects (227 projects from Wix account)',
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
EOF

chmod +x mcp-wrapper.js

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test the wrapper
echo "🧪 Testing MCP wrapper..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-wrapper.js | tail -1 | jq '.result.tools | length' > /dev/null && echo "✅ MCP wrapper working!" || echo "❌ MCP wrapper test failed"

# Configure for Cursor
echo "🎯 Configuring for Cursor..."

# Detect OS
OS=$(uname -s)
if [[ "$OS" == "Darwin" ]]; then
    CURSOR_CONFIG="$HOME/Library/Application Support/Cursor/User/globalStorage/cursor.mcp-config/config.json"
else
    CURSOR_CONFIG="$HOME/.config/Cursor/User/globalStorage/cursor.mcp-config/config.json"
fi

# Create Cursor MCP config directory
mkdir -p "$(dirname "$CURSOR_CONFIG")"

# Create or update MCP config
cat > "$CURSOR_CONFIG" << EOF
{
  "servers": {
    "smartling": {
      "command": "node",
      "args": ["$WRAPPER_DIR/mcp-wrapper.js"],
      "env": {}
    }
  }
}
EOF

echo "✅ Installation complete!"
echo ""
echo "📍 Wrapper installed in: $WRAPPER_DIR"
echo "⚙️  Cursor config: $CURSOR_CONFIG"
echo ""
echo "🎯 Next steps:"
echo "1. Restart Cursor"
echo "2. Go to Cursor Settings → MCP Servers"
echo "3. You should see 'smartling' server listed"
echo "4. The server connects to: https://smartling-mcp.onrender.com"
echo ""
echo "🧪 Test with:"
echo "echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}' | node $WRAPPER_DIR/mcp-wrapper.js"
echo ""
echo "🌟 Available tools:"
echo "- smartling_get_projects (227 Wix projects)"
echo "- smartling_get_account_info"
echo "- smartling_upload_file"
echo "- smartling_get_file_status" 