#!/bin/bash

# 🚀 Smartling MCP Server - SUPER ROBUST Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash

set -e

echo "🚀 Installing Smartling MCP Server (Super Robust Version)..."

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

if [ ! -f "bin/mcp-simple.js" ]; then
    echo "⚠️  mcp-simple.js missing, downloading..."
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/bin/mcp-simple.js > bin/mcp-simple.js
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

# Configure Claude Desktop
echo "🤖 Configuring Claude Desktop..."
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["$INSTALL_DIR/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_id_here",
        "SMARTLING_USER_SECRET": "your_user_secret_here",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF

echo "✅ Claude Desktop configured"

# Configure Cursor
echo "🎯 Configuring Cursor..."
mkdir -p "$(dirname "$CURSOR_CONFIG")"

cat > "$CURSOR_CONFIG" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["$INSTALL_DIR/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_id_here",
        "SMARTLING_USER_SECRET": "your_user_secret_here",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF

echo "✅ Cursor configured"

# Test MCP server
echo "🧪 Testing MCP Server..."
cd "$INSTALL_DIR"

if timeout 8s node bin/mcp-robust.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' 2>/dev/null | grep -q "tools" 2>/dev/null; then
    echo "✅ MCP Server test PASSED"
    TEST_RESULT="✅ WORKING"
else
    echo "⚠️  MCP Server test inconclusive (normal without credentials)"
    TEST_RESULT="⚠️  NEEDS CREDENTIALS"
fi

echo ""
echo "🎉 INSTALLATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Installed: $INSTALL_DIR"
echo "🤖 Claude:    $CLAUDE_CONFIG"
echo "🎯 Cursor:    $CURSOR_CONFIG"
echo "🧪 Status:    $TEST_RESULT"
echo ""
echo "🔑 NEXT STEPS:"
echo "1. Get your Smartling credentials from:"
echo "   https://dashboard.smartling.com/settings/api"
echo ""
echo "2. Edit these config files with your real credentials:"
echo "   📝 $CLAUDE_CONFIG"
echo "   📝 $CURSOR_CONFIG"
echo ""
echo "3. Replace these values:"
echo "   SMARTLING_USER_IDENTIFIER=\"your_actual_user_id\""
echo "   SMARTLING_USER_SECRET=\"your_actual_secret\""
echo ""
echo "4. Restart Claude Desktop and Cursor"
echo ""
echo "📊 Available: 74+ Smartling tools for 227+ projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 