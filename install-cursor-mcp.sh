#!/bin/bash

# 🚀 Smartling MCP One-Line Installer for Cursor
# Usage: curl -sSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-cursor-mcp.sh | bash

set -e

echo "🚀 Smartling MCP Installer for Cursor"
echo "====================================="

# Detect project directory
PROJECT_DIR="$(pwd)"
if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
    echo "❌ Error: Run this script from the smartling-mcp-server directory"
    exit 1
fi

# Detect Node.js path
NODE_PATH=$(which node)
if [[ -z "$NODE_PATH" ]]; then
    echo "❌ Error: Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Project Directory: $PROJECT_DIR"
echo "✅ Node.js Path: $NODE_PATH"

# Install dependencies
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1

# Build project
echo "🔨 Building project..."
npm run build > /dev/null 2>&1

# Create Cursor MCP config
CURSOR_CONFIG_DIR="$HOME/.cursor"
CURSOR_CONFIG_FILE="$CURSOR_CONFIG_DIR/mcp.json"

mkdir -p "$CURSOR_CONFIG_DIR"

# Read credentials
echo ""
echo "🔑 Smartling Credentials Setup"
echo "=============================="
read -p "Enter your Smartling User Identifier: " USER_ID
read -s -p "Enter your Smartling User Secret: " USER_SECRET
echo ""
read -p "Enter your Smartling Account UID (optional): " ACCOUNT_UID

# Create MCP configuration
cat > "$CURSOR_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "$NODE_PATH",
      "args": ["$PROJECT_DIR/bin.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$USER_ID",
        "SMARTLING_USER_SECRET": "$USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"$(if [[ -n "$ACCOUNT_UID" ]]; then echo ",
        \"SMARTLING_ACCOUNT_UID\": \"$ACCOUNT_UID\""; fi)
      }
    }
  }
}
EOF

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo "✅ Cursor MCP configured at: $CURSOR_CONFIG_FILE"
echo "✅ 27 Smartling tools available"
echo ""
echo "🔄 Next steps:"
echo "1. Restart Cursor completely"
echo "2. Try asking: 'Show me my Smartling projects'"
echo ""
echo "🆘 Troubleshooting:"
echo "• If tools don't appear, check Cursor's MCP server logs"
echo "• Verify your Smartling credentials are correct"
echo "" 