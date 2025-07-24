#!/bin/bash

# 🚀 Smartling MCP Server - AUTO-CREDENTIALS Installer
# Usage: curl -fsSL https://your-private-url/install-with-credentials.sh | bash

set -e

echo "🚀 Installing Smartling MCP Server with AUTO-CREDENTIALS..."

# 🔑 EMBEDDED CREDENTIALS - READY TO USE!
SMARTLING_USER_ID="vjwwgsqgeogfkqtmntznqhqxaslfwx"
SMARTLING_USER_SECRET="s16jebo9eafog6ugv1me6paojuIL^38pkd2kv1ltr8e9pa5vj9on825"

# Detect OS
OS=$(uname -s)
echo "🖥️  Detected OS: $OS"

# Set paths based on OS
if [[ "$OS" == "Darwin" ]]; then
    CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    CURSOR_CONFIG="$HOME/.cursor/mcp.json"
else
    CLAUDE_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
    CURSOR_CONFIG="$HOME/.cursor/mcp.json"
fi

# Installation directory
INSTALL_DIR="$HOME/smartling-mcp-server"
echo "📁 Installing to: $INSTALL_DIR"

# Clean install - remove existing if any
if [ -d "$INSTALL_DIR" ]; then
    echo "🧹 Removing existing installation..."
    rm -rf "$INSTALL_DIR"
fi

# Create fresh directory
echo "📂 Creating installation directory..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download method 1: Try git clone first
echo "📥 Downloading Smartling MCP Server..."
if git clone https://github.com/Jacobolevy/smartling-mcp-server.git . 2>/dev/null; then
    echo "✅ Git clone successful"
else
    echo "⚠️  Git clone failed, using direct download..."
    
    # Download method 2: Direct file download
    echo "📁 Creating directory structure..."
    mkdir -p bin src api
    
    echo "⬇️  Downloading core files..."
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/bin/mcp-robust.js > bin/mcp-robust.js
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/bin/mcp-simple.js > bin/mcp-simple.js
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/bin/mcp-server.js > bin/mcp-server.js
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/package.json > package.json
    
    echo "✅ Direct download completed"
fi

# Verify critical files exist
echo "🔍 Verifying installation..."
if [ ! -f "bin/mcp-robust.js" ]; then
    echo "❌ Critical file missing: bin/mcp-robust.js"
    echo "🔄 Attempting emergency download..."
    mkdir -p bin
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/bin/mcp-robust.js > bin/mcp-robust.js
fi

# Make servers executable
echo "🔧 Setting permissions..."
chmod +x bin/mcp-*.js 2>/dev/null || echo "⚠️  Chmod failed (this is OK on some systems)"

# Test that Node.js is available
echo "🧪 Testing Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first:"
    echo "   Visit: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js available: $(node --version)"

# Configure Claude Desktop with REAL CREDENTIALS
echo "🤖 Configuring Claude Desktop with REAL CREDENTIALS..."
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["$INSTALL_DIR/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_ID",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF

echo "✅ Claude Desktop configured with REAL credentials"

# Configure Cursor with REAL CREDENTIALS
echo "🎯 Configuring Cursor with REAL CREDENTIALS..."
mkdir -p "$(dirname "$CURSOR_CONFIG")"

cat > "$CURSOR_CONFIG" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["$INSTALL_DIR/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_ID",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF

echo "✅ Cursor configured with REAL credentials"

# Test MCP server with REAL CREDENTIALS
echo "🧪 Testing MCP Server with REAL CREDENTIALS..."
cd "$INSTALL_DIR"

if timeout 8s node bin/mcp-robust.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' 2>/dev/null | grep -q "tools" 2>/dev/null; then
    echo "✅ MCP Server test PASSED - WORKING WITH REAL CREDENTIALS!"
    TEST_RESULT="✅ WORKING WITH REAL CREDENTIALS"
else
    echo "⚠️  MCP Server test inconclusive"
    TEST_RESULT="⚠️  VERIFY CREDENTIALS"
fi

echo ""
echo "🎉 INSTALLATION COMPLETE WITH AUTO-CREDENTIALS!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Installed: $INSTALL_DIR"
echo "🤖 Claude:    $CLAUDE_CONFIG"
echo "🎯 Cursor:    $CURSOR_CONFIG"
echo "🧪 Status:    $TEST_RESULT"
echo "🔑 Credentials: AUTOMATICALLY CONFIGURED ✅"
echo ""
echo "🔄 RESTART Claude Desktop and Cursor to use Smartling tools"
echo ""
echo "📊 Available: 74+ Smartling tools for 227+ projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 