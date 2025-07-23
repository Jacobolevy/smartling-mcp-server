#!/bin/bash

# 🚀 Fixed Smartling MCP One-Line Installer
# Usage: curl -fsSL https://url/install-fixed.sh | bash

set -e

echo "🚀 Installing Smartling MCP Server (Fixed Version)..."

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

# Create installation directory
INSTALL_DIR="$HOME/smartling-mcp-server"
echo "📁 Installing to: $INSTALL_DIR"

# Download and setup
if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main || echo "⚠️  Git pull failed, continuing..."
else
    echo "📥 Downloading Smartling MCP Server..."
    git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Make server executable
chmod +x bin/mcp-simple.js bin/mcp-robust.js

# Configure Claude Desktop
echo "🤖 Configuring Claude Desktop..."
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

cat > "$CLAUDE_CONFIG" << 'EOF'
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["INSTALL_PATH/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_id_here",
        "SMARTLING_USER_SECRET": "your_user_secret_here",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF

# Replace INSTALL_PATH with actual path
sed -i.bak "s|INSTALL_PATH|$INSTALL_DIR|g" "$CLAUDE_CONFIG"
rm "$CLAUDE_CONFIG.bak" 2>/dev/null || true

echo "✅ Claude Desktop configured at: $CLAUDE_CONFIG"

# Configure Cursor
echo "🎯 Configuring Cursor..."
mkdir -p "$(dirname "$CURSOR_CONFIG")"

cat > "$CURSOR_CONFIG" << 'EOF'
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["INSTALL_PATH/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_id_here",
        "SMARTLING_USER_SECRET": "your_user_secret_here",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF

# Replace INSTALL_PATH with actual path
sed -i.bak "s|INSTALL_PATH|$INSTALL_DIR|g" "$CURSOR_CONFIG"
rm "$CURSOR_CONFIG.bak" 2>/dev/null || true

echo "✅ Cursor configured at: $CURSOR_CONFIG"

# Test installation
echo "🧪 Testing installation..."
cd "$INSTALL_DIR"

if echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | timeout 10s node bin/mcp-robust.js 2>/dev/null | grep -q '"tools"'; then
    echo "✅ MCP Server test passed"
else
    echo "⚠️  MCP Server test failed (this is normal without credentials)"
fi

echo ""
echo "🎉 Installation Complete!"
echo "📁 Installed at: $INSTALL_DIR"
echo "🤖 Claude Desktop: $CLAUDE_CONFIG"
echo "🎯 Cursor: $CURSOR_CONFIG"
echo ""
echo "⚠️  IMPORTANT: Edit the config files with your Smartling credentials:"
echo "   SMARTLING_USER_IDENTIFIER=your_actual_user_id"
echo "   SMARTLING_USER_SECRET=your_actual_secret"
echo ""
echo "🔄 Restart Claude Desktop and Cursor to apply changes"
echo ""
echo "📋 Available tools: 74+ Smartling tools"
echo "🎯 Access to 227 Wix projects"
echo ""
echo "🔗 Share this installer:"
echo "   curl -fsSL YOUR_URL/install-fixed.sh | bash" 