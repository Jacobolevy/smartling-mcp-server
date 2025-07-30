#!/bin/bash

# 🚀 Smartling MCP One-Line Installer for Cursor
# Usage: curl -sSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-cursor-mcp.sh | bash

set -e

echo "🚀 Smartling MCP Installer for Cursor"
echo "====================================="

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
                git pull origin main
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

# Check if config file exists and has content
if [[ -f "$CURSOR_CONFIG_FILE" && -s "$CURSOR_CONFIG_FILE" ]]; then
    echo "⚠️  Existing Cursor config found. Creating backup..."
    cp "$CURSOR_CONFIG_FILE" "$CURSOR_CONFIG_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    
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
                }' "$CURSOR_CONFIG_FILE" > "$TEMP_CONFIG"
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
                }' "$CURSOR_CONFIG_FILE" > "$TEMP_CONFIG"
        fi
        mv "$TEMP_CONFIG" "$CURSOR_CONFIG_FILE"
    else
        echo "⚠️  jq not found. Overwriting config file..."
        CREATE_NEW_CONFIG=true
    fi
else
    CREATE_NEW_CONFIG=true
fi

# Create new config if needed
if [[ "$CREATE_NEW_CONFIG" == "true" ]]; then
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
fi

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo "✅ Project downloaded to: $PROJECT_DIR"
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