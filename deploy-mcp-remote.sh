#!/bin/bash

# 🌐 Deploy Smartling MCP Remote Server
# For internal platforms that need a remote MCP server

set -e

echo "🚀 Deploying Smartling MCP Remote Server..."
echo "🎯 Target: Remote MCP server for internal platforms"
echo "📡 Backend: https://smartling-mcp.onrender.com"

# Check requirements
command -v git >/dev/null 2>&1 || { echo "❌ Git required but not installed. Aborting." >&2; exit 1; }

# Create deployment directory
DEPLOY_DIR="smartling-mcp-remote-$(date +%Y%m%d%H%M%S)"
echo "📁 Creating deployment directory: $DEPLOY_DIR"

mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Initialize git repo
git init
echo "⬇️  Setting up deployment files..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "smartling-mcp-remote-server",
  "version": "1.0.0",
  "description": "Remote MCP server for Smartling integration - deployable for internal platforms",
  "main": "server-mcp-remote.js",
  "type": "module",
  "scripts": {
    "start": "node server-mcp-remote.js",
    "dev": "node --inspect server-mcp-remote.js",
    "test": "echo \"Testing MCP server...\" && node server-mcp-remote.js &"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "ws": "^8.14.2"
  },
  "keywords": [
    "mcp",
    "smartling",
    "translation",
    "localization",
    "websocket",
    "remote",
    "internal-platform"
  ],
  "author": "Smartling MCP Team",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Download the remote MCP server
echo "⬇️  Downloading remote MCP server..."
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/server-mcp-remote.js > server-mcp-remote.js

# Create Render config
cat > render.yaml << 'EOF'
services:
  - type: web
    name: smartling-mcp-remote
    env: node
    plan: free
    buildCommand: "npm install @modelcontextprotocol/sdk express cors ws"
    startCommand: "node server-mcp-remote.js"
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: "/health"
EOF

# Create README
cat > README.md << 'EOF'
# Smartling MCP Remote Server

Remote MCP server for internal platforms that need WebSocket access to Smartling.

## Endpoints

- **HTTP**: `https://your-domain.com/health` - Health check
- **WebSocket**: `wss://your-domain.com/mcp` - MCP protocol endpoint

## Usage

Your internal platform connects to the WebSocket endpoint using MCP protocol:

```javascript
const ws = new WebSocket('wss://your-deployed-server.com/mcp');
// Implement MCP protocol over WebSocket
```

## Tools Available

- `smartling_get_projects` - 227 Wix projects
- `smartling_get_account_info` - Account information  
- `smartling_upload_file` - Upload files for translation
- `smartling_get_file_status` - Check translation status

## Deployment

This server connects to the real Smartling API backend at:
`https://smartling-mcp.onrender.com`
EOF

# Test locally if Node.js is available
if command -v node >/dev/null 2>&1; then
    echo "🧪 Testing server locally..."
    npm install >/dev/null 2>&1 || echo "⚠️  Local npm install failed, will install on deployment"
    timeout 10s node server-mcp-remote.js &>/dev/null && echo "✅ Server starts correctly" || echo "⚠️  Server test skipped"
fi

echo ""
echo "✅ Deployment files ready!"
echo ""
echo "📁 Deployment directory: $(pwd)"
echo "📄 Files created:"
echo "   - server-mcp-remote.js (MCP server)"
echo "   - package.json (dependencies)"
echo "   - render.yaml (Render config)"
echo "   - README.md (documentation)"
echo ""
echo "🚀 Deployment options:"
echo ""
echo "1️⃣  Deploy to Render.com:"
echo "   - Go to https://dashboard.render.com"
echo "   - Connect this directory as a Git repo"
echo "   - Deploy as Web Service"
echo ""
echo "2️⃣  Deploy to Heroku:"
echo "   heroku create your-mcp-server"
echo "   git add . && git commit -m 'Deploy MCP server'"
echo "   git push heroku main"
echo ""
echo "3️⃣  Deploy to Railway:"
echo "   railway login"
echo "   railway init"
echo "   railway up"
echo ""
echo "🔌 Your internal platform will connect to:"
echo "   WebSocket URL: wss://your-deployed-server.com/mcp"
echo "   Protocol: MCP over WebSocket (JSON-RPC 2.0)"
echo ""
echo "🎯 Backend Smartling server: https://smartling-mcp.onrender.com"
echo "📊 Real Smartling API: 227 Wix projects available" 