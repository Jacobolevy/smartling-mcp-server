#!/bin/bash

# 🔧 FIX CURSOR TIMEOUT - Switch to Robust Server
echo "🚨 Fixing Cursor ETIMEDOUT error..."
echo "Switching to timeout-protected robust server"
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

# Check current server
CURSOR_CONFIG="$HOME/Library/Application Support/Cursor/User/settings.json"
if [[ -f "$CURSOR_CONFIG" ]]; then
    if grep -q "mcp-ultra-basic" "$CURSOR_CONFIG"; then
        warning "Found ultra-basic server (causes timeouts)"
        info "Switching to robust timeout-protected server..."
    elif grep -q "mcp-simple-test" "$CURSOR_CONFIG"; then
        warning "Found test server (limited functionality)"
        info "Switching to robust server..."
    else
        info "Current server configuration:"
        grep -A 3 -B 1 "smartling" "$CURSOR_CONFIG" || echo "No smartling config found"
    fi
else
    error "Cursor config not found at $CURSOR_CONFIG"
    exit 1
fi

# Backup current config
cp "$CURSOR_CONFIG" "${CURSOR_CONFIG}.backup.timeout.$(date +%Y%m%d_%H%M%S)"
success "Backed up current config"

# Install robust server if not available
ROBUST_SERVER="$HOME/smartling-mcp-server/bin/smartling-mcp.js"
if [[ ! -f "$ROBUST_SERVER" ]]; then
    warning "Robust server not found, installing..."
    mkdir -p "$HOME/smartling-mcp-server/bin"
    
    if [[ -f "./bin/mcp-simple.js" ]]; then
        cp "./bin/mcp-simple.js" "$ROBUST_SERVER"
        chmod +x "$ROBUST_SERVER"
        success "Installed robust server (74+ tools, timeout-protected)"
    else
        error "Cannot find source server. Please run from smartling-mcp-server directory."
        exit 1
    fi
else
    success "Robust server already installed"
fi

# Update Cursor config to use robust server
python3 -c "
import json
import sys

config_file = '$CURSOR_CONFIG'
robust_server = '$ROBUST_SERVER'

try:
    with open(config_file, 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcp.servers' not in config:
    config['mcp.servers'] = {}

# Configure robust server with timeout protection
config['mcp.servers']['smartling'] = {
    'command': 'node',
    'args': [robust_server],
    'env': {
        'SMARTLING_USER_IDENTIFIER': 'vjwwgsqgeogfkqtmntznqhqxaslfwx',
        'SMARTLING_USER_SECRET': 's16jebo9eafog6ugv1me6paojuIL^38pkd2kv1ltr8e9pa5vj9on825',
        'SMARTLING_BASE_URL': 'https://api.smartling.com',
        'MCP_TIMEOUT': '300000',
        'MCP_BATCH_TIMEOUT': '600000'
    }
}

with open(config_file, 'w') as f:
    json.dump(config, f, indent=4)

print('✅ Updated Cursor config with robust server')
" || error "Failed to update Cursor configuration"

success "Configured timeout-protected robust server"

# Kill any existing MCP processes
pkill -f "smartling" 2>/dev/null || true
success "Cleared existing MCP processes"

echo ""
echo "🎯 NEXT STEPS TO FIX TIMEOUT:"
echo ""
info "1. RESTART CURSOR COMPLETELY:"
echo "   - Cmd+Q to quit Cursor"
echo "   - Wait 5 seconds"
echo "   - Reopen Cursor"
echo ""
info "2. TEST GRADUALLY:"
echo "   - Try small operations first"
echo "   - Verify you see 74+ tools (not just 1)"
echo "   - If still timeout, try ultra-basic server"
echo ""
info "3. IF STILL HAVING ISSUES:"
echo "   - Switch to ultra-basic: ./switch-to-ultra-basic.sh"
echo "   - Check logs: tail -f ~/Library/Logs/Cursor/*"
echo ""

success "Timeout fix applied - restart Cursor now!" 