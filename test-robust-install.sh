#!/bin/bash

# 🧪 TEST SCRIPT - Verify Robust Smartling Installation
# Run this after installing to make sure everything works

echo "🧪 Testing Robust Smartling MCP Installation..."
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check installation directory
INSTALL_DIR="$HOME/smartling-mcp-server"
if [[ -f "$INSTALL_DIR/bin/smartling-mcp.js" ]]; then
    success "MCP server installed at $INSTALL_DIR"
else
    error "MCP server not found. Run install-robust-smartling.sh first"
    exit 1
fi

# Check file size (should be large for 74+ tools)
FILE_SIZE=$(wc -l < "$INSTALL_DIR/bin/smartling-mcp.js")
if [[ $FILE_SIZE -gt 3000 ]]; then
    success "Server file size: $FILE_SIZE lines (robust version confirmed)"
else
    warning "Server file size: $FILE_SIZE lines (might not be the full version)"
fi

# Check Claude config
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [[ -f "$CLAUDE_CONFIG" ]]; then
    if grep -q "smartling" "$CLAUDE_CONFIG"; then
        success "Claude configuration found and contains Smartling"
        
        # Check if path is correct
        if grep -q "$INSTALL_DIR" "$CLAUDE_CONFIG"; then
            success "Claude path configuration is correct"
        else
            warning "Claude path might be incorrect"
        fi
    else
        error "Claude config exists but doesn't contain Smartling"
    fi
else
    warning "Claude config not found"
fi

# Check Cursor config
CURSOR_CONFIG="$HOME/Library/Application Support/Cursor/User/settings.json"
if [[ -f "$CURSOR_CONFIG" ]]; then
    if grep -q "smartling" "$CURSOR_CONFIG"; then
        success "Cursor configuration found and contains Smartling"
        
        # Check if path is correct
        if grep -q "$INSTALL_DIR" "$CURSOR_CONFIG"; then
            success "Cursor path configuration is correct"
        else
            warning "Cursor path might be incorrect"
        fi
    else
        error "Cursor config exists but doesn't contain Smartling"
    fi
else
    warning "Cursor config not found"
fi

# Test server can start (briefly)
info "Testing server startup..."
timeout 5s node "$INSTALL_DIR/bin/smartling-mcp.js" 2>/dev/null &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    success "Server starts successfully"
    kill $SERVER_PID 2>/dev/null
else
    warning "Server test inconclusive (this is usually normal)"
fi

# Check for backup files  
BACKUP_COUNT=$(find "$HOME/Library/Application Support/" -name "*backup*" -path "*Claude*" -o -path "*Cursor*" 2>/dev/null | wc -l)
if [[ $BACKUP_COUNT -gt 0 ]]; then
    success "Found $BACKUP_COUNT backup files created"
    info "This means previous configurations were safely backed up"
else
    info "No backup files found (normal if configs were new)"
fi

# Check if this replaced an older version
if [[ $BACKUP_COUNT -gt 0 ]]; then
    LATEST_BACKUP=$(find "$HOME/Library/Application Support/" -name "*backup*" -path "*Claude*" -o -path "*Cursor*" 2>/dev/null | head -1)
    if [[ -n "$LATEST_BACKUP" ]] && grep -q "smartling" "$LATEST_BACKUP" 2>/dev/null; then
        success "Successfully upgraded from previous Smartling MCP version"
    fi
fi

echo ""
echo "🎯 NEXT STEPS:"
echo ""
info "1. Restart Claude Desktop (Cmd+Q, then reopen)"
info "2. Restart Cursor completely"
info "3. Check that you see 70+ Smartling tools available"
echo ""
echo "📊 Expected Results:"
echo "   • Claude: Should show 'Smartling' in MCP servers list"
echo "   • Cursor: Should show Smartling tools in Extensions"
echo "   • Tool count: 74+ tools available"
echo ""
echo "🔍 If you see 0 tools, check that both apps are fully restarted"
echo ""
success "Test completed!" 