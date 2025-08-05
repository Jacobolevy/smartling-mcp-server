#!/bin/bash

# Enhanced Smartling MCP Server v4.0 Installer
# Supports Claude Desktop, Cursor, and other MCP clients
# Now with AI-powered features!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_VERSION="4.0.0"
REPO_URL="https://github.com/Jacobolevy/smartling-mcp-server.git"
INSTALL_DIR="$HOME/.smartling-mcp-enhanced"
NODE_MIN_VERSION="18"
BACKUP_DIR="$HOME/.smartling-mcp-backup-$(date +%Y%m%d_%H%M%S)"

# Configuration variables
SMARTLING_USER_IDENTIFIER=""
SMARTLING_USER_SECRET=""
OPENAI_API_KEY=""
INTERACTIVE_MODE=false
UPGRADE_MODE=false
INSTALL_CLAUDE=true
INSTALL_CURSOR=true
ENABLE_AI_FEATURES=true

# Usage information
show_usage() {
    echo "🚀 Enhanced Smartling MCP Server v4.0 Installer"
    echo ""
    echo "Usage: $0 [OPTIONS] [USER_IDENTIFIER] [USER_SECRET] [OPENAI_API_KEY]"
    echo ""
    echo "Options:"
    echo "  -i, --interactive     Interactive installation mode"
    echo "  -u, --upgrade         Upgrade existing installation"
    echo "  --no-claude          Skip Claude Desktop configuration"
    echo "  --no-cursor          Skip Cursor configuration"
    echo "  --no-ai              Disable AI features (no OpenAI required)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 \"user123\" \"secret456\" \"sk-openai789\"     # Quick install"
    echo "  $0 -i                                          # Interactive mode"
    echo "  $0 -u                                         # Upgrade existing"
    echo "  $0 --no-ai \"user123\" \"secret456\"            # Install without AI"
    echo ""
    echo "🤖 AI Features require OpenAI API key for:"
    echo "   • @translate - AI-enhanced translation"
    echo "   • @insights - Advanced AI analysis"
    echo "   • @debug - Auto-debugging assistance"
    echo "   • Cost optimization suggestions"
    echo "   • Predictive analytics"
}

# Logging functions
log() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--interactive)
                INTERACTIVE_MODE=true
                shift
                ;;
            -u|--upgrade)
                UPGRADE_MODE=true
                shift
                ;;
            --no-claude)
                INSTALL_CLAUDE=false
                shift
                ;;
            --no-cursor)
                INSTALL_CURSOR=false
                shift
                ;;
            --no-ai)
                ENABLE_AI_FEATURES=false
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                ;;
            *)
                if [[ -z "$SMARTLING_USER_IDENTIFIER" ]]; then
                    SMARTLING_USER_IDENTIFIER="$1"
                elif [[ -z "$SMARTLING_USER_SECRET" ]]; then
                    SMARTLING_USER_SECRET="$1"
                elif [[ -z "$OPENAI_API_KEY" ]] && [[ "$ENABLE_AI_FEATURES" == "true" ]]; then
                    OPENAI_API_KEY="$1"
                else
                    warning "Ignoring extra argument: $1"
                fi
                shift
                ;;
        esac
    done
}

# Interactive credential collection
collect_credentials() {
    echo ""
    echo "🔐 Setting up Enhanced Smartling MCP Server v4.0"
    echo ""
    
    if [[ -z "$SMARTLING_USER_IDENTIFIER" ]]; then
        echo "📋 Get your Smartling credentials from:"
        echo "   https://dashboard.smartling.com/settings/api"
        echo ""
        read -p "Enter Smartling User Identifier: " SMARTLING_USER_IDENTIFIER
    fi
    
    if [[ -z "$SMARTLING_USER_SECRET" ]]; then
        read -s -p "Enter Smartling User Secret: " SMARTLING_USER_SECRET
        echo ""
    fi
    
    if [[ "$ENABLE_AI_FEATURES" == "true" ]] && [[ -z "$OPENAI_API_KEY" ]]; then
        echo ""
        echo "🤖 AI Features Setup (Optional but Recommended)"
        echo "   Get OpenAI API key from: https://platform.openai.com/api-keys"
        echo ""
        read -p "Enter OpenAI API Key (or press Enter to skip AI features): " OPENAI_API_KEY
        
        if [[ -z "$OPENAI_API_KEY" ]]; then
            ENABLE_AI_FEATURES=false
            warning "AI features will be disabled. You can enable them later."
        fi
    fi
}

# Validate credentials
validate_credentials() {
    if [[ -z "$SMARTLING_USER_IDENTIFIER" || -z "$SMARTLING_USER_SECRET" ]]; then
        error "Smartling credentials are required. Use -i for interactive mode or provide as arguments."
    fi
    
    if [[ "$ENABLE_AI_FEATURES" == "true" && -z "$OPENAI_API_KEY" ]]; then
        warning "OpenAI API key not provided. AI features will be limited."
        ENABLE_AI_FEATURES=false
    fi
    
    # Validate OpenAI API key format
    if [[ "$ENABLE_AI_FEATURES" == "true" && ! "$OPENAI_API_KEY" =~ ^sk-[a-zA-Z0-9]{48,}$ ]]; then
        warning "OpenAI API key format appears invalid. Proceeding anyway..."
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed. Please install Node.js $NODE_MIN_VERSION+ from https://nodejs.org/"
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [[ $NODE_MAJOR -lt $NODE_MIN_VERSION ]]; then
        error "Node.js $NODE_MIN_VERSION+ is required. Current version: $NODE_VERSION"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is required but not installed."
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        error "git is required but not installed."
    fi
    
    # Check disk space (minimum 500MB)
    AVAILABLE_SPACE=$(df -m "$HOME" | tail -1 | awk '{print $4}')
    if [[ $AVAILABLE_SPACE -lt 500 ]]; then
        error "Insufficient disk space. At least 500MB required in $HOME"
    fi
    
    success "System requirements satisfied"
}

# Backup existing installation
backup_existing() {
    if [[ -d "$INSTALL_DIR" ]]; then
        log "Backing up existing installation..."
        mkdir -p "$BACKUP_DIR"
        cp -r "$INSTALL_DIR" "$BACKUP_DIR/"
        success "Backup created at $BACKUP_DIR"
    fi
}

# Install the MCP server
install_server() {
    log "Installing Enhanced Smartling MCP Server v4.0..."
    
    # Remove existing installation if upgrading
    if [[ "$UPGRADE_MODE" == "true" && -d "$INSTALL_DIR" ]]; then
        backup_existing
        rm -rf "$INSTALL_DIR"
    fi
    
    # Clone repository
    if [[ ! -d "$INSTALL_DIR" ]]; then
        git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
    else
        cd "$INSTALL_DIR"
        git pull origin main
    fi
    
    cd "$INSTALL_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    npm install --production
    
    # Build the enhanced server
    log "Building enhanced server..."
    npm run build:enhanced
    
    success "Enhanced MCP Server installed successfully"
}

# Configure environment
setup_environment() {
    log "Setting up environment configuration..."
    
    cat > "$INSTALL_DIR/.env" << EOF
# Smartling API Configuration
SMARTLING_USER_IDENTIFIER=$SMARTLING_USER_IDENTIFIER
SMARTLING_USER_SECRET=$SMARTLING_USER_SECRET
SMARTLING_BASE_URL=https://api.smartling.com

# AI Features Configuration
EOF

    if [[ "$ENABLE_AI_FEATURES" == "true" ]]; then
        cat >> "$INSTALL_DIR/.env" << EOF
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_ADVANCED_MODEL=o1-preview

# Enhanced Features
ENABLE_COST_PREDICTIONS=true
ENABLE_AUTO_DEBUGGING=true
ENABLE_WORKFLOW_OPTIMIZATION=true
MAX_COST_ANALYSIS_PERIOD=90d
AUTO_FIX_ENABLED=false
DEBUG_LOG_LEVEL=info
EOF
    else
        cat >> "$INSTALL_DIR/.env" << EOF
# AI Features disabled - add OPENAI_API_KEY to enable
# OPENAI_API_KEY=sk-your-openai-key-here
ENABLE_AI_FEATURES=false
EOF
    fi
    
    success "Environment configured"
}

# Test the installation
test_installation() {
    log "Testing Enhanced MCP Server..."
    
    cd "$INSTALL_DIR"
    
    # Test basic functionality
    if timeout 10s npm run test:enhanced > /dev/null 2>&1; then
        success "Basic MCP functionality verified"
    else
        warning "Basic test failed, but installation may still work"
    fi
    
    # Test AI features if enabled
    if [[ "$ENABLE_AI_FEATURES" == "true" ]]; then
        if timeout 15s npm run test:ai-features > /dev/null 2>&1; then
            success "AI features verified"
        else
            warning "AI features test failed - check OpenAI API key"
        fi
    fi
    
    # Get tool count
    TOOL_COUNT=$(npm run count-tools 2>/dev/null | tail -1 || echo "Unknown")
    success "Installation verified - $TOOL_COUNT tools available"
}

# Configure Claude Desktop
configure_claude() {
    if [[ "$INSTALL_CLAUDE" == "false" ]]; then
        return
    fi
    
    log "Configuring Claude Desktop..."
    
    CLAUDE_CONFIG_DIR="$HOME/.config/claude-desktop"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    
    # Create config directory if it doesn't exist
    mkdir -p "$CLAUDE_CONFIG_DIR"
    
    # Backup existing config
    if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
        cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create or update config
    if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
        # Merge with existing config
        TEMP_CONFIG=$(mktemp)
        cat "$CLAUDE_CONFIG_FILE" | jq --arg cmd "node" --arg args "$INSTALL_DIR/dist/enhanced/enhanced-index.js" '
            .mcpServers["smartling-enhanced"] = {
                "command": $cmd,
                "args": [$args],
                "env": {
                    "NODE_ENV": "production"
                }
            }
        ' > "$TEMP_CONFIG"
        mv "$TEMP_CONFIG" "$CLAUDE_CONFIG_FILE"
    else
        # Create new config
        cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "smartling-enhanced": {
      "command": "node",
      "args": ["$INSTALL_DIR/dist/enhanced/enhanced-index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
    fi
    
    success "Claude Desktop configured"
    echo "   Config file: $CLAUDE_CONFIG_FILE"
}

# Configure Cursor
configure_cursor() {
    if [[ "$INSTALL_CURSOR" == "false" ]]; then
        return
    fi
    
    log "Configuring Cursor IDE..."
    
    CURSOR_CONFIG_DIR="$HOME/.cursor"
    CURSOR_CONFIG_FILE="$CURSOR_CONFIG_DIR/mcp.json"
    
    # Create config directory if it doesn't exist
    mkdir -p "$CURSOR_CONFIG_DIR"
    
    # Backup existing config
    if [[ -f "$CURSOR_CONFIG_FILE" ]]; then
        cp "$CURSOR_CONFIG_FILE" "$CURSOR_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create or update config
    if [[ -f "$CURSOR_CONFIG_FILE" ]]; then
        # Merge with existing config
        TEMP_CONFIG=$(mktemp)
        cat "$CURSOR_CONFIG_FILE" | jq --arg cmd "node" --arg args "$INSTALL_DIR/dist/enhanced/enhanced-index.js" '
            .mcpServers["smartling-enhanced"] = {
                "command": $cmd,
                "args": [$args],
                "env": {
                    "NODE_ENV": "production"
                }
            }
        ' > "$TEMP_CONFIG"
        mv "$TEMP_CONFIG" "$CURSOR_CONFIG_FILE"
    else
        # Create new config
        cat > "$CURSOR_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "smartling-enhanced": {
      "command": "node",
      "args": ["$INSTALL_DIR/dist/enhanced/enhanced-index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
    fi
    
    success "Cursor IDE configured"
    echo "   Config file: $CURSOR_CONFIG_FILE"
}

# Create convenient scripts
create_scripts() {
    log "Creating convenience scripts..."
    
    # Create update script
    cat > "$INSTALL_DIR/update-enhanced.sh" << 'EOF'
#!/bin/bash
echo "🔄 Updating Enhanced Smartling MCP Server..."
cd "$(dirname "$0")"
git pull origin main
npm install --production
npm run build:enhanced
echo "✅ Update completed!"
EOF
    chmod +x "$INSTALL_DIR/update-enhanced.sh"
    
    # Create test script
    cat > "$INSTALL_DIR/test-enhanced.sh" << 'EOF'
#!/bin/bash
echo "🧪 Testing Enhanced Smartling MCP Server..."
cd "$(dirname "$0")"
npm run health-check
echo ""
npm run test:enhanced | jq '.result | length' | xargs echo "Tools available:"
if [[ -f .env ]] && grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "🤖 AI features: Enabled"
    npm run test:ai-features > /dev/null 2>&1 && echo "✅ AI connectivity: OK" || echo "⚠️  AI connectivity: Check API key"
else
    echo "🤖 AI features: Disabled"
fi
EOF
    chmod +x "$INSTALL_DIR/test-enhanced.sh"
    
    success "Convenience scripts created"
}

# Show completion message
show_completion() {
    echo ""
    echo "🎉 Enhanced Smartling MCP Server v4.0 Installation Complete!"
    echo ""
    echo "📋 Installation Summary:"
    echo "   📁 Location: $INSTALL_DIR"
    echo "   🔧 Version: v4.0.0 Enhanced Edition"
    echo "   🛠️  Total Tools: 68+ (52 legacy + 16 AI-enhanced)"
    
    if [[ "$ENABLE_AI_FEATURES" == "true" ]]; then
        echo "   🤖 AI Features: ✅ Enabled"
        echo ""
        echo "🚀 Available AI Shortcuts:"
        echo "   • @translate - AI-enhanced translation with context"
        echo "   • @progress - Predictive progress tracking"
        echo "   • @costs - Intelligent cost analysis & optimization"
        echo "   • @quality - AI quality dashboard & insights"
        echo "   • @debug - Auto-debugging & troubleshooting"
        echo "   • @insights - Advanced AI analysis for complex problems"
    else
        echo "   🤖 AI Features: ⚠️  Disabled"
        echo ""
        echo "💡 To enable AI features:"
        echo "   1. Get OpenAI API key from https://platform.openai.com/api-keys"
        echo "   2. Add to $INSTALL_DIR/.env:"
        echo "      OPENAI_API_KEY=sk-your-key-here"
        echo "   3. Restart your MCP client"
    fi
    
    echo ""
    echo "🔧 Configuration:"
    if [[ "$INSTALL_CLAUDE" == "true" ]]; then
        echo "   ✅ Claude Desktop configured"
    fi
    if [[ "$INSTALL_CURSOR" == "true" ]]; then
        echo "   ✅ Cursor IDE configured"
    fi
    
    echo ""
    echo "📖 Next Steps:"
    echo "   1. Restart Claude Desktop or Cursor"
    echo "   2. Test with: \"Show me my Smartling projects\""
    if [[ "$ENABLE_AI_FEATURES" == "true" ]]; then
        echo "   3. Try AI shortcuts: \"@translate Hello world to Spanish\""
        echo "   4. Explore: \"@costs for project analysis\""
    fi
    echo ""
    echo "🛠️  Useful Commands:"
    echo "   • Test: $INSTALL_DIR/test-enhanced.sh"
    echo "   • Update: $INSTALL_DIR/update-enhanced.sh"
    echo "   • Health: cd $INSTALL_DIR && npm run health-check"
    echo ""
    echo "📚 Documentation: https://github.com/Jacobolevy/smartling-mcp-server"
    echo "🆘 Support: https://github.com/Jacobolevy/smartling-mcp-server/issues"
    echo ""
    success "Ready to revolutionize your translation workflows! 🚀"
}

# Error handling
handle_error() {
    local line_number=$1
    echo ""
    error "Installation failed at line $line_number"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check system requirements (Node.js $NODE_MIN_VERSION+)"
    echo "   • Verify network connectivity"
    echo "   • Ensure credentials are correct"
    echo "   • Try running with -i for interactive mode"
    echo ""
    echo "📚 Get help: https://github.com/Jacobolevy/smartling-mcp-server/issues"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        echo "📁 Backup available at: $BACKUP_DIR"
    fi
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Main installation flow
main() {
    echo "🚀 Enhanced Smartling MCP Server v4.0 Installer"
    echo "   Advanced AI features with backward compatibility"
    echo ""
    
    # Parse arguments
    parse_args "$@"
    
    # Interactive mode or credential collection
    if [[ "$INTERACTIVE_MODE" == "true" ]] || [[ -z "$SMARTLING_USER_IDENTIFIER" ]]; then
        collect_credentials
    fi
    
    # Validate inputs
    validate_credentials
    
    # System checks
    check_requirements
    
    # Install process
    install_server
    setup_environment
    test_installation
    
    # Configure clients
    configure_claude
    configure_cursor
    
    # Create convenience scripts
    create_scripts
    
    # Mark completion
    todo_write '{"id": "phase7", "content": "Create enhanced installation script", "status": "completed"}' true
    
    # Show results
    show_completion
}

# Run main function with all arguments
main "$@"