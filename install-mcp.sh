#!/bin/bash

# Smartling MCP Server - Local Auto-Installer
# Use this when you already have the code downloaded
# For one-line install, use: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash

set -e

echo "🚀 Smartling MCP Server Local Installer"
echo "========================================"

# Get the current directory (where the script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_SERVER_PATH="$SCRIPT_DIR/bin/mcp-robust.js"

echo "📁 Installation directory: $SCRIPT_DIR"
echo "🔧 Using robust server: $MCP_SERVER_PATH"

# Check if the MCP server file exists
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "❌ Error: Robust MCP server not found at $MCP_SERVER_PATH"
    echo "   Make sure you're in the smartling-mcp-server directory"
    echo "   If missing, download from: https://github.com/Jacobolevy/smartling-mcp-server"
    exit 1
fi

# Make server executable
chmod +x "$MCP_SERVER_PATH"

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
        "SMARTLING_USER_IDENTIFIER": "your_user_id_here",
        "SMARTLING_USER_SECRET": "your_user_secret_here",
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
echo "✅ Cursor: $CURSOR_CONFIG"

# Configure Claude Desktop
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
echo "🤖 Configuring Claude Desktop..."
create_config "$CLAUDE_CONFIG"
echo "✅ Claude Desktop: $CLAUDE_CONFIG"

# Install npm dependencies
echo "📦 Installing dependencies..."
npm install

# Test installation
echo "🧪 Testing installation..."
if echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node "$MCP_SERVER_PATH" 2>/dev/null | grep -q '"tools"'; then
    echo "✅ Server test passed"
else
    echo "⚠️  Server test failed (normal without credentials)"
fi

echo ""
echo "🎉 Local Installation Complete!"
echo "==============================="
echo ""
echo "⚠️  NEXT: Add your Smartling credentials"
echo ""
echo "📝 Edit these files and replace placeholders:"
echo "   • Cursor: $CURSOR_CONFIG"
echo "   • Claude Desktop: $CLAUDE_CONFIG"
echo ""
echo "🔑 Replace with your actual credentials:"
echo "   • your_user_id_here → Your Smartling User Identifier"
echo "   • your_user_secret_here → Your Smartling User Secret"
echo ""
echo "🔗 Get credentials at: https://dashboard.smartling.com/settings/api"
echo ""
echo "🚀 After adding credentials:"
echo "   1. Restart Claude Desktop/Cursor completely"
echo "   2. Ask: 'How many Smartling tools do you have?'"
echo "   3. Should see: 3 tools (account_info, projects, diagnostic)"
echo ""
echo "🛠️ Features:"
echo "   • Timeout protection (8 seconds max)"
echo "   • Access to 227 Wix projects"
echo "   • Robust error handling"
echo ""
echo "💡 For one-line remote install, use:"
echo "   curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash" 