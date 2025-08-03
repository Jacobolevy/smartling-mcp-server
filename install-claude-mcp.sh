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

# Check if we're already in the project directory
if [[ -f "package.json" ]] && grep -q "smartling-mcp-server" package.json 2>/dev/null; then
    echo "✅ Already in smartling-mcp-server directory"
    PROJECT_DIR="$(pwd)"
else
    echo "📥 Downloading smartling-mcp-server..."
    
    # Check if git is available
    if command -v git &> /dev/null; then
        # Use git clone if available
        if [[ -d "smartling-mcp-server" ]]; then
            echo "🔄 Directory exists, checking if it's a valid git repository..."
            cd smartling-mcp-server
            if git status &> /dev/null; then
                echo "✅ Valid git repository, updating..."
                
                # Check if there are local changes that might conflict
                if ! git diff-index --quiet HEAD -- 2>/dev/null; then
                    echo "⚠️  Local changes detected, discarding them to get latest version..."
                    git reset --hard HEAD
                fi
                
                # Fetch the latest changes
                git fetch origin main
                
                # Reset to the latest remote version to avoid any conflicts
                echo "🔄 Updating to latest version..."
                git reset --hard origin/main
            else
                echo "⚠️  Invalid git repository, recreating..."
                cd ..
                mv smartling-mcp-server smartling-mcp-server.backup.$(date +%Y%m%d-%H%M%S)
                git clone https://github.com/Jacobolevy/smartling-mcp-server.git
                cd smartling-mcp-server
            fi
        else
            git clone https://github.com/Jacobolevy/smartling-mcp-server.git
            cd smartling-mcp-server
        fi
    else
        # Fallback to downloading zip
        echo "📦 Git not found, downloading zip..."
        if [[ -d "smartling-mcp-server" ]]; then
            echo "⚠️  Directory exists, backing up..."
            mv smartling-mcp-server smartling-mcp-server.backup.$(date +%Y%m%d-%H%M%S)
        fi
        if command -v curl &> /dev/null; then
            curl -L https://github.com/Jacobolevy/smartling-mcp-server/archive/refs/heads/main.zip -o smartling-mcp-server.zip
            unzip -q smartling-mcp-server.zip
            mv smartling-mcp-server-main smartling-mcp-server
            cd smartling-mcp-server
            rm ../smartling-mcp-server.zip
        elif command -v wget &> /dev/null; then
            wget https://github.com/Jacobolevy/smartling-mcp-server/archive/refs/heads/main.zip -O smartling-mcp-server.zip
            unzip -q smartling-mcp-server.zip
            mv smartling-mcp-server-main smartling-mcp-server
            cd smartling-mcp-server
            rm ../smartling-mcp-server.zip
        else
            echo "❌ Error: Neither git, curl, nor wget found. Please install one of them first."
            exit 1
        fi
    fi
    
    PROJECT_DIR="$(pwd)"
fi

# Verify we're in the right directory
if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
    echo "❌ Error: Could not find package.json in $PROJECT_DIR"
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

# Check for existing credentials first
EXISTING_USER_ID=""
EXISTING_USER_SECRET=""
EXISTING_ACCOUNT_UID=""

if [[ -f "$CLAUDE_CONFIG_FILE" && -s "$CLAUDE_CONFIG_FILE" ]] && command -v jq > /dev/null 2>&1; then
    echo "🔍 Checking for existing Smartling credentials..."
    EXISTING_USER_ID=$(jq -r '.mcpServers.smartling.env.SMARTLING_USER_IDENTIFIER // ""' "$CLAUDE_CONFIG_FILE" 2>/dev/null)
    EXISTING_USER_SECRET=$(jq -r '.mcpServers.smartling.env.SMARTLING_USER_SECRET // ""' "$CLAUDE_CONFIG_FILE" 2>/dev/null)
    EXISTING_ACCOUNT_UID=$(jq -r '.mcpServers.smartling.env.SMARTLING_ACCOUNT_UID // ""' "$CLAUDE_CONFIG_FILE" 2>/dev/null)
fi

# Setup credentials
echo ""
echo "🔑 Smartling Credentials Setup"
echo "=============================="

if [[ -n "$EXISTING_USER_ID" && -n "$EXISTING_USER_SECRET" ]]; then
    echo "✅ Found existing credentials!"
    echo "   User ID: ${EXISTING_USER_ID:0:8}***"
    echo "   Account UID: ${EXISTING_ACCOUNT_UID:-"(not set)"}"
    echo ""
    read -p "Keep existing credentials? (Y/n): " KEEP_EXISTING
    
    if [[ "$KEEP_EXISTING" =~ ^[Nn]$ ]]; then
        echo "📝 Enter new credentials:"
        read -p "Enter your Smartling User Identifier: " USER_ID
        read -s -p "Enter your Smartling User Secret: " USER_SECRET
        echo ""
        read -p "Enter your Smartling Account UID (optional): " ACCOUNT_UID
    else
        echo "🔄 Using existing credentials..."
        USER_ID="$EXISTING_USER_ID"
        USER_SECRET="$EXISTING_USER_SECRET" 
        ACCOUNT_UID="$EXISTING_ACCOUNT_UID"
    fi
else
    echo "📝 No existing credentials found. Please enter your Smartling credentials:"
    read -p "Enter your Smartling User Identifier: " USER_ID
    read -s -p "Enter your Smartling User Secret: " USER_SECRET
    echo ""
    read -p "Enter your Smartling Account UID (optional): " ACCOUNT_UID
fi

# Check if config file exists and has content
if [[ -f "$CLAUDE_CONFIG_FILE" && -s "$CLAUDE_CONFIG_FILE" ]]; then
    echo "⚠️  Existing Claude config found. Creating backup..."
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    
    # Parse existing config and add our server
    if command -v jq > /dev/null 2>&1; then
        # Use jq if available
        TEMP_CONFIG=$(mktemp)
        if [[ -n "$ACCOUNT_UID" ]]; then
            # With Account UID
            jq --arg node_path "$NODE_PATH" \
               --arg project_dir "$PROJECT_DIR" \
               --arg user_id "$USER_ID" \
               --arg user_secret "$USER_SECRET" \
               --arg account_uid "$ACCOUNT_UID" \
               '
               # Ensure mcpServers exists
               if .mcpServers == null then .mcpServers = {} else . end |
               .mcpServers.smartling = {
                  "command": $node_path,
                  "args": [$project_dir + "/bin.js"],
                  "env": {
                    "SMARTLING_USER_IDENTIFIER": $user_id,
                    "SMARTLING_USER_SECRET": $user_secret,
                    "SMARTLING_BASE_URL": "https://api.smartling.com",
                    "SMARTLING_ACCOUNT_UID": $account_uid
                  }
                }' "$CLAUDE_CONFIG_FILE" > "$TEMP_CONFIG"
        else
            # Without Account UID
            jq --arg node_path "$NODE_PATH" \
               --arg project_dir "$PROJECT_DIR" \
               --arg user_id "$USER_ID" \
               --arg user_secret "$USER_SECRET" \
               '
               # Ensure mcpServers exists
               if .mcpServers == null then .mcpServers = {} else . end |
               .mcpServers.smartling = {
                  "command": $node_path,
                  "args": [$project_dir + "/bin.js"],
                  "env": {
                    "SMARTLING_USER_IDENTIFIER": $user_id,
                    "SMARTLING_USER_SECRET": $user_secret,
                    "SMARTLING_BASE_URL": "https://api.smartling.com"
                  }
                }' "$CLAUDE_CONFIG_FILE" > "$TEMP_CONFIG"
        fi
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
echo "✅ Project downloaded to: $PROJECT_DIR"
echo "✅ Claude Desktop MCP configured at: $CLAUDE_CONFIG_FILE"
echo "✅ 35 Smartling tools available"
echo ""
echo "🔄 Next steps:"
echo "1. Restart Claude Desktop completely"
echo "2. Try asking: 'Show me my Smartling projects'"
echo ""
echo "🔑 Smartling Credentials Required:"
echo "• User Identifier: Your Smartling API user ID"
echo "• User Secret: Your Smartling API secret key"
echo "• Account UID: Your Smartling account ID (optional)"
echo "• Get these from: https://dashboard.smartling.com/settings/api"
echo ""
echo "💡 Need help with API credentials?"
echo "• Login to Smartling Dashboard → Settings → API"
echo "• Create new API credentials if needed"
echo "• Copy User Identifier and User Secret for the installer"
echo ""
echo "🆘 Troubleshooting:"
echo "• If tools don't appear, check Claude's developer console"
echo "• Verify your Smartling credentials are correct"
echo "• On macOS, ensure Claude has necessary permissions"
echo "• Ensure you have access to the Smartling projects you want to manage"
echo "" 