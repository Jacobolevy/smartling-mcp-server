#!/bin/bash

# Smartling MCP Server - Auto-Installer
# This script automatically configures Cursor and Claude Desktop with the correct paths

set -e

echo "🚀 Smartling MCP Server Auto-Installer"
echo "======================================"

# Get the current directory (where the script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_SERVER_PATH="$SCRIPT_DIR/bin/mcp-simple.js"

echo "📁 Detected installation directory: $SCRIPT_DIR"
echo "🔧 MCP Server path: $MCP_SERVER_PATH"

# Check if the MCP server file exists
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "❌ Error: MCP server file not found at $MCP_SERVER_PATH"
    echo "   Please run this script from the smartling-mcp-server directory"
    exit 1
fi

# Function to create/update configuration
create_config() {
    local config_file="$1"
    local config_dir=$(dirname "$config_file")
    
    # Create directory if it doesn't exist
    mkdir -p "$config_dir"
    
    # Create the configuration
    cat > "$config_file" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "YOUR_USER_IDENTIFIER_HERE",
        "SMARTLING_USER_SECRET": "YOUR_USER_SECRET_HERE",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
}

# Configure Cursor
CURSOR_CONFIG="$HOME/.cursor/mcp.json"
echo "🎯 Configuring Cursor..."
create_config "$CURSOR_CONFIG"
echo "✅ Cursor configuration created at: $CURSOR_CONFIG"

# Configure Claude Desktop
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
echo "🤖 Configuring Claude Desktop..."
create_config "$CLAUDE_CONFIG"
echo "✅ Claude Desktop configuration created at: $CLAUDE_CONFIG"

# Install npm dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎉 Installation Complete!"
echo "======================================"
echo ""
echo "⚠️  IMPORTANT: You need to add your Smartling credentials!"
echo ""
echo "📝 Edit these files and replace the placeholder values:"
echo "   • Cursor: $CURSOR_CONFIG"
echo "   • Claude: $CLAUDE_CONFIG"
echo ""
echo "🔑 Replace these values:"
echo "   • YOUR_USER_IDENTIFIER_HERE → Your Smartling User Identifier"
echo "   • YOUR_USER_SECRET_HERE → Your Smartling User Secret"
echo ""
echo "🚀 After adding credentials:"
echo "   1. Restart Cursor/Claude Desktop"
echo "   2. You should see 74 Smartling tools available!"
echo ""
echo "📋 Need help finding your credentials?"
echo "   Visit: https://dashboard.smartling.com/settings/api"
echo "" 