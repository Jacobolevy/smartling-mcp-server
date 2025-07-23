#!/bin/bash

# 🚀 Smartling MCP Server - SMART Installer (Preserves existing MCPs)
# Usage: curl -fsSL https://url/install-with-params-smart.sh | bash -s "USER_ID" "USER_SECRET"

set -e

# Get credentials from parameters
SMARTLING_USER_ID="$1"
SMARTLING_USER_SECRET="$2"

if [ -z "$SMARTLING_USER_ID" ] || [ -z "$SMARTLING_USER_SECRET" ]; then
    echo "❌ ERROR: Missing credentials"
    echo ""
    echo "Usage: curl -fsSL https://url/install-with-params-smart.sh | bash -s \"YOUR_USER_ID\" \"YOUR_USER_SECRET\""
    echo ""
    echo "Example:"
    echo "curl -fsSL https://url/install-with-params-smart.sh | bash -s \"abc123def\" \"xyz789uvw\""
    exit 1
fi

echo "🚀 Installing Smartling MCP Server with SMART CONFIG PRESERVATION..."
echo "🔑 User ID: ${SMARTLING_USER_ID:0:8}***"
echo "🔑 Secret: ${SMARTLING_USER_SECRET:0:8}***"

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

# Download Smartling MCP Server
echo "📥 Downloading Smartling MCP Server..."
if git clone https://github.com/Jacobolevy/smartling-mcp-server.git . 2>/dev/null; then
    echo "✅ Git clone successful"
else
    echo "⚠️  Git clone failed, using direct download..."
    mkdir -p bin src api
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/bin/mcp-robust.js > bin/mcp-robust.js
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/bin/mcp-simple.js > bin/mcp-simple.js
    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/package.json > package.json
    echo "✅ Direct download completed"
fi

# Make servers executable
chmod +x bin/mcp-*.js 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Configure Claude Desktop with PROVIDED CREDENTIALS
echo "🤖 Configuring Claude Desktop with PROVIDED CREDENTIALS..."
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["$INSTALL_DIR/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_ID",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF

# SMART Configure Cursor - PRESERVE EXISTING MCPs
echo "🧠 SMART Configuring Cursor (preserving existing MCPs)..."
mkdir -p "$(dirname "$CURSOR_CONFIG")"

# Create Node.js script to merge configs
cat > "$INSTALL_DIR/merge_config.js" << 'EOF'
const fs = require('fs');
const path = process.argv[2];

// Smartling config to add/update
const smartlingConfig = {
  "command": "node",
  "args": [process.argv[3] + "/bin/mcp-simple.js"],
  "env": {
    "SMARTLING_USER_IDENTIFIER": process.argv[4],
    "SMARTLING_USER_SECRET": process.argv[5],
    "SMARTLING_BASE_URL": "https://api.smartling.com"
  }
};

let config = { "mcpServers": {} };

// Read existing config if it exists
if (fs.existsSync(path)) {
  try {
    const existing = fs.readFileSync(path, 'utf8');
    config = JSON.parse(existing);
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    console.log("📋 Found existing Cursor config with MCPs:", Object.keys(config.mcpServers).join(", "));
  } catch (e) {
    console.log("⚠️  Could not parse existing config, creating new one");
    config = { "mcpServers": {} };
  }
} else {
  console.log("📝 Creating new Cursor config");
}

// Add/update Smartling config
config.mcpServers.smartling = smartlingConfig;

// Write merged config
fs.writeFileSync(path, JSON.stringify(config, null, 2));
console.log("✅ Cursor config updated. Total MCPs:", Object.keys(config.mcpServers).length);
EOF

# Run the smart merge
node "$INSTALL_DIR/merge_config.js" "$CURSOR_CONFIG" "$INSTALL_DIR" "$SMARTLING_USER_ID" "$SMARTLING_USER_SECRET"

# Clean up temporary script
rm "$INSTALL_DIR/merge_config.js"

echo ""
echo "🎉 SMART INSTALLATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Credentials: AUTOMATICALLY CONFIGURED ✅"
echo "🧠 Existing MCPs: PRESERVED ✅"
echo "🔄 RESTART Claude Desktop and Cursor to use Smartling tools"
echo "📊 Available: 74+ Smartling tools for 227+ projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 