#!/bin/bash

# 🚀 Smartling MCP One-Line Installer for Claude Desktop
# Usage: curl -sSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-claude-mcp.sh | bash

set -e

echo "🚀 Smartling MCP Installer for Claude Desktop"
echo "============================================="

# Detect operating system
OS=$(uname -s)
case "$OS" in
    Darwin*)
        CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
        CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
        ;;
    Linux*)
        CLAUDE_CONFIG_DIR="$HOME/.config/claude"
        CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
        ;;
    CYGWIN*|MINGW*)
        CLAUDE_CONFIG_DIR="$APPDATA/Claude"
        CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
        ;;
    *)
        echo "❌ Unsupported operating system: $OS"
        exit 1
        ;;
esac

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

echo "✅ OS: $OS"
echo "✅ Project Directory: $PROJECT_DIR"
echo "✅ Node.js Path: $NODE_PATH"
echo "✅ Claude Config: $CLAUDE_CONFIG_FILE"

# Install dependencies
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1

# Build project
echo "🔨 Building project..."
npm run build > /dev/null 2>&1

# Create Claude config directory
mkdir -p "$CLAUDE_CONFIG_DIR"

# Read credentials
echo ""
echo "🔑 Smartling Credentials Setup"
echo "=============================="
read -p "Enter your Smartling User Identifier: " USER_ID
read -s -p "Enter your Smartling User Secret: " USER_SECRET
echo ""
read -p "Enter your Smartling Account UID (optional): " ACCOUNT_UID

# Check if config file exists and has content
if [[ -f "$CLAUDE_CONFIG_FILE" && -s "$CLAUDE_CONFIG_FILE" ]]; then
    echo "⚠️  Existing Claude config found. Creating backup..."
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    
    # Parse existing config and add our server
    if command -v jq > /dev/null 2>&1; then
        # Use jq if available
        TEMP_CONFIG=$(mktemp)
        jq --arg node_path "$NODE_PATH" \
           --arg project_dir "$PROJECT_DIR" \
           --arg user_id "$USER_ID" \
           --arg user_secret "$USER_SECRET" \
           --arg account_uid "$ACCOUNT_UID" \
           '.mcpServers.smartling = {
              "command": $node_path,
              "args": [$project_dir + "/bin.js"],
              "env": {
                "SMARTLING_USER_IDENTIFIER": $user_id,
                "SMARTLING_USER_SECRET": $user_secret,
                "SMARTLING_BASE_URL": "https://api.smartling.com"
              } + (if $account_uid != "" then {"SMARTLING_ACCOUNT_UID": $account_uid} else {} end)
            }' "$CLAUDE_CONFIG_FILE" > "$TEMP_CONFIG"
        mv "$TEMP_CONFIG" "$CLAUDE_CONFIG_FILE"
    else
        echo "⚠️  jq not found. Overwriting config file..."
        CREATE_NEW_CONFIG=true
    fi
else
    CREATE_NEW_CONFIG=true
fi

# Create new config if needed
if [[ "$CREATE_NEW_CONFIG" == "true" ]]; then
    cat > "$CLAUDE_CONFIG_FILE" << EOF
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
fi

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo "✅ Claude Desktop MCP configured at: $CLAUDE_CONFIG_FILE"
echo "✅ 27 Smartling tools available"
echo ""
echo "🔄 Next steps:"
echo "1. Restart Claude Desktop completely"
echo "2. Try asking: 'Show me my Smartling projects'"
echo ""
echo "🆘 Troubleshooting:"
echo "• If tools don't appear, check Claude's developer console"
echo "• Verify your Smartling credentials are correct"
echo "• On macOS, ensure Claude has necessary permissions"
echo "" 