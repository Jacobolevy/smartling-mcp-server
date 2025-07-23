#!/bin/bash

# 🔧 SWITCH TO ULTRA-BASIC SERVER (For Cursor Timeout Debugging)
echo "🧪 Switching to Ultra-Basic Server..."
echo "This will give you 1 working tool to test connectivity"
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Backup Cursor config
CURSOR_CONFIG="$HOME/Library/Application Support/Cursor/User/settings.json"
cp "$CURSOR_CONFIG" "${CURSOR_CONFIG}.backup.ultrabasic.$(date +%Y%m%d_%H%M%S)"
success "Backed up current config"

# Install ultra-basic server
ULTRA_BASIC_SERVER="$HOME/smartling-mcp-server/bin/mcp-ultra-basic.js"
mkdir -p "$HOME/smartling-mcp-server/bin"

if [[ -f "./bin/mcp-ultra-basic.js" ]]; then
    cp "./bin/mcp-ultra-basic.js" "$ULTRA_BASIC_SERVER"
    chmod +x "$ULTRA_BASIC_SERVER"
    success "Installed ultra-basic server (1 tool, no timeouts)"
else
    error "Cannot find ultra-basic server. Please run from smartling-mcp-server directory."
    exit 1
fi

# Update Cursor config
python3 -c "
import json

config_file = '$CURSOR_CONFIG'
ultra_basic_server = '$ULTRA_BASIC_SERVER'

try:
    with open(config_file, 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcp.servers' not in config:
    config['mcp.servers'] = {}

# Configure ultra-basic server (no external connections)
config['mcp.servers']['smartling'] = {
    'command': 'node',
    'args': [ultra_basic_server],
    'env': {
        'NODE_ENV': 'test'
    }
}

with open(config_file, 'w') as f:
    json.dump(config, f, indent=4)

print('✅ Configured ultra-basic server')
" || error "Failed to configure ultra-basic server"

# Kill existing processes
pkill -f "smartling" 2>/dev/null || true
success "Cleared existing MCP processes"

echo ""
warning "TEMPORARY DEBUG MODE ACTIVE"
echo ""
info "What this gives you:"
echo "  • 1 working tool: test_connection"
echo "  • No network calls (no timeouts)"
echo "  • Confirms MCP protocol is working"
echo ""
info "Next steps:"
echo "  1. Restart Cursor (Cmd+Q and reopen)"
echo "  2. Test the 'test_connection' tool"
echo "  3. If it works, the issue is with the robust server"
echo "  4. If it doesn't work, it's a Cursor MCP configuration issue"
echo ""
info "To go back to robust server:"
echo "  ./fix-cursor-timeout.sh"
echo ""
success "Ultra-basic server configured - restart Cursor now!" 