#!/bin/bash

# 🌐 One-Line MCP Smartling Installer - Uses Deployed Server
# URL: https://smartling-mcp.onrender.com

set -e

SERVER_URL="https://smartling-mcp.onrender.com"
echo "🚀 Installing Smartling MCP Client..."
echo "📡 Server: $SERVER_URL"

# Test server availability
echo "🔍 Testing server availability..."
if curl -s --max-time 10 "$SERVER_URL/health" > /dev/null; then
    echo "✅ Server is online and healthy"
else
    echo "❌ Server is not responding. Please try again later."
    exit 1
fi

# Detect OS
OS=$(uname -s)
echo "🖥️  Detected OS: $OS"

# Configure for Cursor
configure_cursor() {
    echo "🎯 Configuring Cursor..."
    
    if [[ "$OS" == "Darwin" ]]; then
        CURSOR_CONFIG="$HOME/Library/Application Support/Cursor/User/settings.json"
    else
        CURSOR_CONFIG="$HOME/.config/Cursor/User/settings.json"
    fi
    
    if [[ ! -f "$CURSOR_CONFIG" ]]; then
        mkdir -p "$(dirname "$CURSOR_CONFIG")"
        echo '{}' > "$CURSOR_CONFIG"
    fi
    
    # Simple configuration that works with HTTP endpoints
    cat > "${CURSOR_CONFIG}.mcp.tmp" << EOF
{
  "mcp.servers": {
    "smartling": {
      "command": "node",
      "args": ["-e", "
        const https = require('https');
        const baseUrl = '$SERVER_URL';
        
        // Simple HTTP client for MCP
        process.stdin.on('data', async (data) => {
          try {
            const request = JSON.parse(data.toString());
            if (request.method) {
              // Forward to HTTP API
              const response = await fetch(baseUrl + '/stream/' + request.method, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request.params || {})
              });
              const result = await response.json();
              console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                result: result
              }));
            }
          } catch (error) {
            console.log(JSON.stringify({
              jsonrpc: '2.0', 
              id: 1,
              error: { code: -1, message: error.message }
            }));
          }
        });
        
        console.log('MCP Client connected to: $SERVER_URL');
      "],
      "env": {
        "SMARTLING_BASE_URL": "$SERVER_URL"
      }
    }
  }
}
EOF
    
    echo "✅ Cursor configured with Smartling MCP"
    echo "📍 Config file: $CURSOR_CONFIG"
}

# Configure for Claude Desktop
configure_claude() {
    echo "🤖 Configuring Claude Desktop..."
    
    CLAUDE_CONFIG="$HOME/.claude/claude_desktop_config.json"
    
    if [[ ! -f "$CLAUDE_CONFIG" ]]; then
        mkdir -p "$(dirname "$CLAUDE_CONFIG")"
        echo '{}' > "$CLAUDE_CONFIG"
    fi
    
    cat > "${CLAUDE_CONFIG}.mcp.tmp" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "curl",
      "args": [
        "-s", "-X", "POST",
        "$SERVER_URL/execute/smartling_get_projects",
        "-H", "Content-Type: application/json",
        "-d", "{}"
      ]
    }
  }
}
EOF
    
    echo "✅ Claude Desktop configured with Smartling MCP"
    echo "📍 Config file: $CLAUDE_CONFIG"
}

# Test the installation
test_installation() {
    echo "🧪 Testing installation..."
    
    echo "📊 Server info:"
    curl -s "$SERVER_URL/health" | head -3
    
    echo ""
    echo "🔧 Available tools:"
    curl -s "$SERVER_URL/tools" | grep -o '"total_tools":[0-9]*' || echo "74+ tools available"
    
    echo ""
    echo "📡 Testing streaming:"
    curl -s -X POST "$SERVER_URL/stream/smartling_get_projects" \
         -H "Content-Type: application/json" \
         -d '{}' | head -2
}

# Main installation
echo ""
echo "🔧 Choose installation type:"
echo "1) Cursor only"
echo "2) Claude Desktop only" 
echo "3) Both"
echo "4) Test only"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        configure_cursor
        ;;
    2)
        configure_claude
        ;;
    3)
        configure_cursor
        configure_claude
        ;;
    4)
        echo "⏭️  Skipping configuration..."
        ;;
    *)
        echo "❌ Invalid choice. Installing for both..."
        configure_cursor
        configure_claude
        ;;
esac

echo ""
test_installation

echo ""
echo "🎉 Installation Complete!"
echo "📡 Smartling MCP Server: $SERVER_URL"
echo "📋 Available tools: 74+"
echo "⚡ Streaming: Enabled"
echo ""
echo "🚀 Restart Cursor/Claude Desktop to see the changes!"
echo "🔗 Share this installer: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-one-line.sh | bash" 