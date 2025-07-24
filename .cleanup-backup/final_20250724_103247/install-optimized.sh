#!/bin/bash
set -e

# Ultra-Optimized Smartling MCP Installer
# Uses mcp-batch-optimized.js - No bloat, just results

echo "🚀 Installing Smartling MCP (Batch-Optimized)..."

# Essential functions only
die() { echo "❌ $1" >&2; exit 1; }
ok() { echo "✅ $1"; }

# Quick prerequisite checks
command -v node >/dev/null || die "Node.js required"
[[ $(node -v | cut -d. -f1 | tr -d v) -ge 16 ]] || die "Node.js 16+ required"

# Get credentials (parameters or prompt)
if [[ $# -eq 2 ]]; then
    USER_ID="$1"
    SECRET="$2"
else
    read -p "Smartling User ID: " USER_ID
    read -p "Smartling Secret: " SECRET
fi
[[ -n "$USER_ID" && -n "$SECRET" ]] || die "Credentials required"

# Installation
INSTALL_DIR="$HOME/smartling-mcp-server"
mkdir -p "$INSTALL_DIR/bin"

# Copy optimized server
[[ -f "./bin/mcp-batch-optimized.js" ]] || die "Run from smartling-mcp-server directory"
cp "./bin/mcp-batch-optimized.js" "$INSTALL_DIR/bin/mcp-batch-optimized.js"
chmod +x "$INSTALL_DIR/bin/mcp-batch-optimized.js"

# Config template
CONFIG_JSON='{
  "command": "node",
  "args": ["'$INSTALL_DIR'/bin/mcp-batch-optimized.js"],
  "env": {
    "SMARTLING_USER_IDENTIFIER": "'$USER_ID'",
    "SMARTLING_USER_SECRET": "'$SECRET'",
    "SMARTLING_BASE_URL": "https://api.smartling.com"
  }
}'

# Simple config merger
merge_config() {
    local file="$1" key="$2"
    mkdir -p "$(dirname "$file")"
    [[ -f "$file" ]] && cp "$file" "$file.bak"
    
    python3 -c "
import json
try: 
    with open('$file') as f: cfg = json.load(f)
except: 
    cfg = {}
cfg.setdefault('$key', {})['smartling'] = $CONFIG_JSON
with open('$file', 'w') as f: 
    json.dump(cfg, f, indent=2)
" 2>/dev/null || {
    # Fallback if python fails
    echo "{\"$key\":{\"smartling\":$CONFIG_JSON}}" > "$file"
}
}

# Configure apps (only if they exist)
CLAUDE_DIR="$HOME/Library/Application Support/Claude"
CURSOR_DIR="$HOME/Library/Application Support/Cursor/User"

[[ -d "$CLAUDE_DIR" ]] && merge_config "$CLAUDE_DIR/claude_desktop_config.json" "mcpServers"
[[ -d "$CURSOR_DIR" ]] && merge_config "$CURSOR_DIR/settings.json" "mcp.servers"

ok "Installed Smartling MCP with batch optimization"
echo "Restart Claude/Cursor to activate. 74+ tools available." 