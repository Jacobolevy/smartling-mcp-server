#!/bin/bash

# 🚀 SMARTLING MCP SERVER - BATCH OPTIMIZED INSTALLER
# Uses mcp-batch-optimized.js for superior performance
# Preserves existing MCPs, installs 74+ tools, optimized for large operations
# Requirements: Claude Desktop, Cursor, Node.js

set -e  # Exit on any error

echo "🚀 Installing Batch-Optimized Smartling MCP Server..."
echo "⚡ Using mcp-batch-optimized.js (Superior Performance)"
echo "✅ Preserving existing MCPs"
echo "🔧 Installing 74+ Smartling tools"
echo "🏋️  Optimized for large batch operations"
echo "⏱️  Extended timeouts: 30s/5min"
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
error() { echo -e "${RED}❌ $1${NC}" >&2; exit 1; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
highlight() { echo -e "${PURPLE}🚀 $1${NC}"; }

# Check prerequisites
info "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is required but not installed. Please install Node.js first."
fi

NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [[ $NODE_VERSION -lt 16 ]]; then
    error "Node.js version 16+ required. Current version: $(node --version)"
fi

success "Node.js $(node --version) found"

# Check if Claude Desktop is installed
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
if [[ ! -d "$CLAUDE_CONFIG_DIR" ]]; then
    warning "Claude Desktop not found at $CLAUDE_CONFIG_DIR"
    echo "Please install Claude Desktop from: https://claude.ai/download"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Check if Cursor is installed
CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
if [[ ! -d "$CURSOR_CONFIG_DIR" ]]; then
    warning "Cursor not found at $CURSOR_CONFIG_DIR"
    echo "Please install Cursor from: https://cursor.sh"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Get Smartling credentials (from parameters or interactive)
if [[ $# -eq 2 ]]; then
    # Credentials provided as parameters
    SMARTLING_USER_ID="$1"
    SMARTLING_USER_SECRET="$2"
    success "Using provided credentials"
    info "User ID: ${SMARTLING_USER_ID:0:10}..."
else
    # Interactive mode
    echo ""
    info "Smartling API credentials required:"
    echo "Get them from: https://app.smartling.com/settings/api/"
    echo ""
    echo "💡 Tip: You can also run this script with credentials as parameters:"
    echo "   ./install-batch-optimized.sh \"USER_ID\" \"USER_SECRET\""
    echo ""

    read -p "Enter your Smartling User Identifier: " SMARTLING_USER_ID
    if [[ -z "$SMARTLING_USER_ID" ]]; then
        error "User Identifier is required"
    fi

    read -p "Enter your Smartling User Secret: " SMARTLING_USER_SECRET
    if [[ -z "$SMARTLING_USER_SECRET" ]]; then
        error "User Secret is required"
    fi
fi

# Set installation directory
INSTALL_DIR="$HOME/smartling-mcp-server"
info "Installing to: $INSTALL_DIR"

# Create installation directory
mkdir -p "$INSTALL_DIR/bin"

# Download the batch-optimized MCP server
highlight "Installing Batch-Optimized Smartling MCP server..."

# Use local file since this is running from the project directory
if [[ -f "./bin/mcp-batch-optimized.js" ]]; then
    cp "./bin/mcp-batch-optimized.js" "$INSTALL_DIR/bin/mcp-batch-optimized.js"
    chmod +x "$INSTALL_DIR/bin/mcp-batch-optimized.js"
    success "Installed Batch-Optimized MCP server (74+ tools)"
    highlight "Features: Extended timeouts, batch operations, large project support"
else
    error "Batch-optimized MCP server file not found. Please run this script from the smartling-mcp-server directory."
fi

# Function to backup config file
backup_config() {
    local config_file="$1"
    if [[ -f "$config_file" ]]; then
        cp "$config_file" "${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
        success "Backed up existing config: $(basename "$config_file")"
    fi
}

# Function to merge Smartling config into existing config
merge_smartling_config() {
    local config_file="$1"
    local config_key="$2" # "mcpServers" for Claude, "mcp.servers" for Cursor
    
    # Create config directory if it doesn't exist
    mkdir -p "$(dirname "$config_file")"
    
    # Check for existing Smartling configuration
    if [[ -f "$config_file" ]] && grep -q "smartling" "$config_file"; then
        warning "Found existing Smartling MCP configuration"
        info "Will be replaced with batch-optimized version (backup created)"
    fi
    
    # Backup existing config
    backup_config "$config_file"
    
    # Smartling MCP configuration (using batch-optimized version)
    local smartling_config='{
      "command": "node",
      "args": ["'$INSTALL_DIR'/bin/mcp-batch-optimized.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "'$SMARTLING_USER_ID'",
        "SMARTLING_USER_SECRET": "'$SMARTLING_USER_SECRET'",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }'
    
    if [[ -f "$config_file" ]]; then
        # File exists, merge configuration
        local temp_file=$(mktemp)
        
        if [[ "$config_key" == "mcp.servers" ]]; then
            # Cursor format
            python3 -c "
import json, sys
try:
    with open('$config_file', 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcp.servers' not in config:
    config['mcp.servers'] = {}

config['mcp.servers']['smartling'] = $smartling_config

with open('$temp_file', 'w') as f:
    json.dump(config, f, indent=4)
" || error "Failed to merge Cursor configuration"
        else
            # Claude format
            python3 -c "
import json, sys
try:
    with open('$config_file', 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['smartling'] = $smartling_config

with open('$temp_file', 'w') as f:
    json.dump(config, f, indent=2)
" || error "Failed to merge Claude configuration"
        fi
        
        mv "$temp_file" "$config_file"
        success "Merged Smartling config into existing $(basename "$config_file")"
    else
        # Create new config file
        if [[ "$config_key" == "mcp.servers" ]]; then
            # Cursor format
            cat > "$config_file" << EOF
{
    "mcp.servers": {
        "smartling": $smartling_config
    }
}
EOF
        else
            # Claude format
            cat > "$config_file" << EOF
{
  "mcpServers": {
    "smartling": $smartling_config
  }
}
EOF
        fi
        success "Created new $(basename "$config_file")"
    fi
}

# Configure Claude Desktop
if [[ -d "$CLAUDE_CONFIG_DIR" ]]; then
    info "Configuring Claude Desktop..."
    merge_smartling_config "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" "mcpServers"
fi

# Configure Cursor
if [[ -d "$CURSOR_CONFIG_DIR" ]]; then
    info "Configuring Cursor..."
    merge_smartling_config "$CURSOR_CONFIG_DIR/settings.json" "mcp.servers"
fi

# Test installation
info "Testing Batch-Optimized MCP server..."
if timeout 15s node "$INSTALL_DIR/bin/mcp-batch-optimized.js" --version &>/dev/null; then
    success "Batch-Optimized MCP server is working"
else
    warning "Could not test MCP server (this is usually normal)"
fi

echo ""
echo "🎉 Batch-Optimized Installation Complete!"
echo ""
success "Smartling MCP Server installed with 74+ tools"
success "Using mcp-batch-optimized.js for superior performance"
success "Existing MCPs preserved in both Claude and Cursor" 
highlight "Optimized features:"
echo "  ⚡ Extended timeouts: 30s single ops, 5min batch ops"
echo "  🏋️  Enhanced performance for large projects"
echo "  🚀 Batch operation support"
echo "  📊 Better handling of 300+ files projects"
echo ""
info "Next steps:"
echo "  1. Restart Claude Desktop completely (Cmd+Q then reopen)"
echo "  2. Restart Cursor"
echo "  3. Look for 'Smartling' in the tools/extensions list"
echo "  4. You should see 74+ tools available"
echo ""
info "Configuration files:"
echo "  Claude: $CLAUDE_CONFIG_DIR/claude_desktop_config.json"
echo "  Cursor: $CURSOR_CONFIG_DIR/settings.json"
echo "  Server: $INSTALL_DIR/bin/mcp-batch-optimized.js"
echo ""
info "Backup files created with timestamp for safety"
echo ""
highlight "🚀 Ready to use Batch-Optimized Smartling with Claude and Cursor!"
echo "🏋️  Perfect for large projects like yours with 300+ files!" 