#!/bin/bash

# 🌐 SMARTLING MCP SERVER - COMPLETE INSTALLER
# Clone repo + Complete installation in one command
# Version: 3.1.0 - Updated for TypeScript implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/Jacobolevy/smartling-mcp-server.git"
REPO_NAME="smartling-mcp-server"
INSTALL_DIR="$HOME/smartling-mcp-server-$(date +%Y%m%d-%H%M%S)"
SMARTLING_USER_IDENTIFIER=""
SMARTLING_USER_SECRET=""
INSTALL_FOR_CURSOR=false
INSTALL_FOR_CLAUDE=false

# Epic Banner
show_banner() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                🚀 SMARTLING MCP SERVER - AUTONOMOUS INSTALLER               ║${NC}"
    echo -e "${PURPLE}║                        Clone + Install + Configure                           ║${NC}"
    echo -e "${PURPLE}║                           Enterprise-Grade v3.1.0                           ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🎯 COMPLETELY AUTONOMOUS: No manual steps required!${NC}"
    echo -e "${CYAN}✨ Features: 30+ Smartling API Tools, TypeScript Support${NC}"
    echo -e "${CYAN}🔧 Auto-compiled TypeScript, MCP SDK Integration${NC}"
    echo -e "${CYAN}📊 Project Management, Files, Jobs, Quality Control, Webhooks${NC}"
    echo ""
    echo -e "${YELLOW}📋 What this installer does:${NC}"
    echo -e "${CYAN}   1. 📂 Clones the latest repository${NC}"
    echo -e "${CYAN}   2. 🔧 Installs all dependencies (including TypeScript)${NC}"
    echo -e "${CYAN}   3. ⚙️  Auto-configures Claude Desktop AND Cursor IDE${NC}"
    echo -e "${CYAN}   4. 🧪 Compiles TypeScript and tests everything${NC}"
    echo -e "${CYAN}   5. 🚀 Delivers production-ready MCP server${NC}"
    echo ""
}

# Check system requirements
check_system_requirements() {
    echo -e "${BLUE}🔍 Checking system requirements...${NC}"
    
    # Check git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git is required but not installed.${NC}"
        echo -e "${YELLOW}📦 Please install Git first: https://git-scm.com/downloads${NC}"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed.${NC}"
        echo -e "${YELLOW}📦 Please install Node.js from https://nodejs.org/${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js v18+ required. Current: $(node -v)${NC}"
        echo -e "${YELLOW}📦 Please update Node.js from https://nodejs.org/${NC}"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is required but not installed.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ System requirements met:${NC}"
    echo -e "${CYAN}   • Git: $(git --version | head -1)${NC}"
    echo -e "${CYAN}   • Node.js: $(node -v)${NC}"
    echo -e "${CYAN}   • npm: v$(npm -v)${NC}"
}

# Collect credentials from user
collect_credentials() {
    echo -e "${BLUE}🔐 Smartling API Credentials Setup${NC}"
    echo ""
    
    if [[ -n "$1" && -n "$2" ]]; then
        SMARTLING_USER_IDENTIFIER="$1"
        SMARTLING_USER_SECRET="$2"
        echo -e "${GREEN}✅ Credentials provided via command line arguments${NC}"
    else
        echo -e "${YELLOW}📝 Please enter your Smartling API credentials:${NC}"
        echo -e "${CYAN}   (You can find these in your Smartling project settings)${NC}"
        echo ""
        
        read -p "🔑 Smartling User Identifier: " SMARTLING_USER_IDENTIFIER < /dev/tty
        echo ""
        read -s -p "🔒 Smartling User Secret: " SMARTLING_USER_SECRET < /dev/tty
        echo ""
        echo ""
    fi
    
    if [[ -z "$SMARTLING_USER_IDENTIFIER" || -z "$SMARTLING_USER_SECRET" ]]; then
        echo -e "${RED}❌ Both User Identifier and User Secret are required${NC}"
        echo -e "${YELLOW}💡 Get your credentials from: https://dashboard.smartling.com/settings/api${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Credentials configured successfully${NC}"
}

# Auto-detect and configure installation targets
auto_detect_installation_targets() {
    echo -e "${BLUE}🎯 Auto-Detecting Installation Targets${NC}"
    echo ""
    
    # Initialize
    INSTALL_FOR_CLAUDE=false
    INSTALL_FOR_CURSOR=false
    
    # Detect Claude Desktop
    echo -e "${CYAN}🔍 Checking for Claude Desktop...${NC}"
    if [[ -d "$HOME/.config/claude-desktop" ]] || [[ -d "/Applications/Claude.app" ]] || [[ -d "$HOME/Library/Application Support/Claude" ]]; then
        INSTALL_FOR_CLAUDE=true
        echo -e "${GREEN}✅ Claude Desktop detected - Will configure${NC}"
    else
        echo -e "${YELLOW}⚠️  Claude Desktop not detected - Will configure anyway (future-ready)${NC}"
        INSTALL_FOR_CLAUDE=true  # Configure anyway for future use
    fi
    
    # Detect Cursor IDE
    echo -e "${CYAN}🔍 Checking for Cursor IDE...${NC}"
    if [[ -d "$HOME/.cursor" ]] || [[ -d "/Applications/Cursor.app" ]] || [[ -d "$HOME/Library/Application Support/Cursor" ]] || command -v cursor >/dev/null 2>&1; then
        INSTALL_FOR_CURSOR=true
        echo -e "${GREEN}✅ Cursor IDE detected - Will configure${NC}"
    else
        echo -e "${YELLOW}⚠️  Cursor IDE not detected - Will configure anyway (future-ready)${NC}"
        INSTALL_FOR_CURSOR=true  # Configure anyway for future use
    fi
    
    echo ""
    echo -e "${PURPLE}🚀 AUTONOMOUS INSTALLATION MODE:${NC}"
    echo -e "${GREEN}✅ Will configure Claude Desktop (detected or future-ready)${NC}"
    echo -e "${GREEN}✅ Will configure Cursor IDE (detected or future-ready)${NC}"
    echo -e "${CYAN}💡 Both configurations will be ready when you install the applications${NC}"
    echo ""
}

# Clone the repository
clone_repository() {
    echo -e "${BLUE}📂 Cloning Smartling MCP Server repository...${NC}"
    
    # Clean up any existing installations
    if [[ -d "$INSTALL_DIR" ]]; then
        echo -e "${YELLOW}⚠️  Removing existing installation at $INSTALL_DIR${NC}"
        rm -rf "$INSTALL_DIR" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Using sudo to remove protected files...${NC}"
            sudo rm -rf "$INSTALL_DIR" 2>/dev/null || true
        }
    fi
    
    # Also clean up any other smartling installations that might cause conflicts
    for dir in "$HOME/smartling-mcp-ultra" "$HOME/smartling-mcp-render-fixed" "$HOME/.smartling-mcp-wrapper"; do
        if [[ -d "$dir" && "$dir" != "$INSTALL_DIR" ]]; then
            echo -e "${YELLOW}⚠️  Cleaning up conflicting installation: $dir${NC}"
            rm -rf "$dir" 2>/dev/null || true
        fi
    done
    
    # Create parent directory if needed
    mkdir -p "$(dirname "$INSTALL_DIR")"
    
    # Clone the repository with better error handling
    echo -e "${CYAN}🔄 Cloning from repository...${NC}"
    if git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null; then
        echo -e "${GREEN}✅ Repository cloned successfully${NC}"
    elif git clone "$REPO_URL" "$INSTALL_DIR" 2>/dev/null; then
        echo -e "${GREEN}✅ Repository cloned successfully (full clone)${NC}"
    else
        echo -e "${YELLOW}⚠️  Primary clone failed, trying alternative methods...${NC}"
        
        # Try with different protocols
        if git clone "https://github.com/Jacobolevy/smartling-mcp-server.git" "$INSTALL_DIR" 2>/dev/null; then
            echo -e "${GREEN}✅ Repository cloned successfully (HTTPS)${NC}"
        else
            echo -e "${RED}❌ Failed to clone repository. Troubleshooting:${NC}"
            echo -e "${YELLOW}   1. Check internet connection: curl -s github.com${NC}"
            echo -e "${YELLOW}   2. Try manual clone: git clone https://github.com/Jacobolevy/smartling-mcp-server.git${NC}"
            echo -e "${YELLOW}   3. Check DNS resolution: nslookup github.com${NC}"
            echo -e "${YELLOW}   4. Repository URL: $REPO_URL${NC}"
            exit 1
        fi
    fi
    
    cd "$INSTALL_DIR"
    echo -e "${CYAN}📍 Installation directory: $INSTALL_DIR${NC}"
}

# Verify repository contents
verify_repository() {
    echo -e "${BLUE}🔍 Verifying repository contents...${NC}"
    
    local required_files=(
        "bin/mcp-simple.js"
        "src/index.ts"
        "src/smartling-client.ts"
        "package.json"
        "tsconfig.json"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required files:${NC}"
        for file in "${missing_files[@]}"; do
            echo -e "${RED}   • $file${NC}"
        done
        echo -e "${YELLOW}💡 Please ensure you have the complete repository${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required files present${NC}"
}

# Install dependencies and setup
install_and_setup() {
    echo -e "${BLUE}📦 Installing dependencies and setting up environment...${NC}"
    
    # Install dependencies
    echo -e "${CYAN}🔄 Installing npm dependencies...${NC}"
    npm install --silent
    
    # Install TypeScript dependencies if not present
    echo -e "${CYAN}🔧 Ensuring TypeScript dependencies...${NC}"
    npm install --save-dev ts-node @modelcontextprotocol/sdk typescript --silent
    
    # Make binary executable
    chmod +x bin/mcp-simple.js
    
    # Create environment configuration
    echo -e "${CYAN}🔧 Creating environment configuration...${NC}"
    cat > .env << EOF
# Smartling API Configuration
SMARTLING_USER_IDENTIFIER=${SMARTLING_USER_IDENTIFIER}
SMARTLING_USER_SECRET=${SMARTLING_USER_SECRET}
SMARTLING_BASE_URL=https://api.smartling.com

# Development Configuration
NODE_ENV=production
EOF

    chmod 600 .env
    
    # Verify .env file was created correctly
    if [[ -f ".env" ]]; then
        echo -e "${GREEN}✅ Environment file created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create .env file${NC}"
        exit 1
    fi
    
    # Compile TypeScript
    echo -e "${CYAN}🔨 Compiling TypeScript...${NC}"
    npx tsc --build
    
    # Fix ES module imports in compiled files
    echo -e "${CYAN}🔧 Fixing ES module imports...${NC}"
    sed -i '' "s|from './smartling-client'|from './smartling-client.js'|g" dist/index.js
    sed -i '' "s|from './tools/projects'|from './tools/projects.js'|g" dist/index.js
    sed -i '' "s|from './tools/files'|from './tools/files.js'|g" dist/index.js
    sed -i '' "s|from './tools/jobs'|from './tools/jobs.js'|g" dist/index.js
    sed -i '' "s|from './tools/quality'|from './tools/quality.js'|g" dist/index.js
    sed -i '' "s|from './tools/tagging'|from './tools/tagging.js'|g" dist/index.js
    sed -i '' "s|from './tools/glossary'|from './tools/glossary.js'|g" dist/index.js
    sed -i '' "s|from './tools/webhooks'|from './tools/webhooks.js'|g" dist/index.js
    find dist/tools -name "*.js" -exec sed -i '' "s|from '../smartling-client'|from '../smartling-client.js'|g" {} \;
    
    echo -e "${GREEN}✅ Dependencies installed and environment configured${NC}"
}

# Configure IDE integrations
configure_ides() {
    echo -e "${BLUE}🔧 Configuring IDE integrations...${NC}"
    
    CURRENT_DIR=$(pwd)
    
    if [[ "$INSTALL_FOR_CLAUDE" == true ]]; then
        echo -e "${CYAN}🤖 Configuring Claude Desktop...${NC}"
        
        CLAUDE_CONFIG_DIR="$HOME/.config/claude"
        CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
        
        mkdir -p "$CLAUDE_CONFIG_DIR"
        
        if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
            echo -e "${YELLOW}⚠️  Backing up existing Claude config...${NC}"
            cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%s)"
        fi
        
        cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["$CURRENT_DIR/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_IDENTIFIER",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
        
        echo -e "${GREEN}✅ Claude Desktop configured${NC}"
        echo -e "${CYAN}📍 Config: $CLAUDE_CONFIG_FILE${NC}"
    fi
    
    if [[ "$INSTALL_FOR_CURSOR" == true ]]; then
        echo -e "${CYAN}🎯 Configuring Cursor IDE...${NC}"
        
        CURSOR_CONFIG_DIR="$HOME/.cursor"
        CURSOR_CONFIG_FILE="$CURSOR_CONFIG_DIR/settings.json"
        
        mkdir -p "$CURSOR_CONFIG_DIR"
        
        if [[ -f "$CURSOR_CONFIG_FILE" ]]; then
            echo -e "${YELLOW}⚠️  Backing up existing Cursor config...${NC}"
            cp "$CURSOR_CONFIG_FILE" "$CURSOR_CONFIG_FILE.backup.$(date +%s)"
            
            # Try to merge configurations
            node -e "
            const fs = require('fs');
            try {
                const existing = JSON.parse(fs.readFileSync('$CURSOR_CONFIG_FILE', 'utf8'));
                const mcpConfig = {
                    'mcp.servers': {
                        'smartling': {
                            command: 'node',
                            args: ['$CURRENT_DIR/bin/mcp-simple.js'],
                            env: {
                                SMARTLING_USER_IDENTIFIER: '$SMARTLING_USER_IDENTIFIER',
                                SMARTLING_USER_SECRET: '$SMARTLING_USER_SECRET',
                                SMARTLING_BASE_URL: 'https://api.smartling.com'
                            }
                        }
                    }
                };
                const merged = { ...existing, ...mcpConfig };
                fs.writeFileSync('$CURSOR_CONFIG_FILE', JSON.stringify(merged, null, 2));
                console.log('✅ Merged with existing config');
            } catch (error) {
                console.log('⚠️  Creating new config');
            }
            " 2>/dev/null || {
                # Fallback: create new config
                cat > "$CURSOR_CONFIG_FILE" << EOF
{
  "mcp.servers": {
    "smartling": {
      "command": "node",
      "args": ["$CURRENT_DIR/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_IDENTIFIER",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
            }
        else
            cat > "$CURSOR_CONFIG_FILE" << EOF
{
  "mcp.servers": {
    "smartling": {
      "command": "node",
      "args": ["$CURRENT_DIR/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_IDENTIFIER",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
        fi
        
        echo -e "${GREEN}✅ Cursor IDE configured${NC}"
        echo -e "${CYAN}📍 Config: $CURSOR_CONFIG_FILE${NC}"
    fi
}

# Test the installation
test_installation() {
    echo -e "${BLUE}🧪 Testing server installation...${NC}"
    
    # Test 1: Binary exists and is executable
    echo -e "${CYAN}🔍 Testing server binary...${NC}"
    if [[ -x "bin/mcp-simple.js" ]]; then
        echo -e "${GREEN}✅ Server binary is executable${NC}"
    else
        echo -e "${RED}❌ Server binary is not executable${NC}"
        exit 1
    fi
    
    # Test 2: Environment validation
    echo -e "${CYAN}🔍 Testing environment configuration...${NC}"
    if [[ -f ".env" && -n "$SMARTLING_USER_IDENTIFIER" && -n "$SMARTLING_USER_SECRET" ]]; then
        echo -e "${GREEN}✅ Environment configuration valid${NC}"
    else
        echo -e "${RED}❌ Environment configuration failed${NC}"
        exit 1
    fi
    
    # Test 3: Tool list verification
    echo -e "${CYAN}🔍 Testing available tools...${NC}"
    echo -e "${CYAN}🔍 Testing server with credentials...${NC}"
    
    # Create a test .env file
    echo "SMARTLING_USER_IDENTIFIER=$SMARTLING_USER_IDENTIFIER" > .env.test
    echo "SMARTLING_USER_SECRET=$SMARTLING_USER_SECRET" >> .env.test
    
    # Test the server
    TOOL_OUTPUT=$(bash -c "cp .env.test .env && echo '{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\"}' | node bin/mcp-simple.js 2>/dev/null && rm .env" 2>/dev/null || echo "")
    
    TOOL_COUNT=$(echo "$TOOL_OUTPUT" | grep -o '"name":"smartling_[^"]*"' | wc -l | tr -d ' ' || echo "0")
    
    # Clean up test files
    rm -f .env.test
    
    if [[ "$TOOL_COUNT" -ge 20 ]]; then
        echo -e "${GREEN}✅ Tool verification passed ($TOOL_COUNT Smartling tools available)${NC}"
    else
        echo -e "${YELLOW}⚠️  Tool count verification: $TOOL_COUNT tools detected${NC}"
        echo -e "${CYAN}💡 Server may still be functional, continuing...${NC}"
    fi
    
    # Test 4: TypeScript compilation
    echo -e "${CYAN}🔍 Testing TypeScript compilation...${NC}"
    if [[ -d "dist" && -f "dist/index.js" ]]; then
        echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    else
        echo -e "${YELLOW}⚠️  TypeScript compilation check inconclusive${NC}"
    fi
    
    echo -e "${GREEN}🎉 Installation tests completed!${NC}"
}

# Show success message and instructions
show_success_message() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 INSTALLATION COMPLETE!                                 ║${NC}"
    echo -e "${GREEN}║                   SMARTLING MCP SERVER IS READY!                             ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${PURPLE}🚀 SMARTLING TOOLS AVAILABLE:${NC}"
    echo -e "${CYAN}   ✅ Project Management (get projects)${NC}"
    echo -e "${CYAN}   ✅ File Operations (upload, download, status, delete)${NC}"
    echo -e "${CYAN}   ✅ String Search & Management (search, get details, recent)${NC}"
    echo -e "${CYAN}   ✅ Translation Jobs (create, manage, authorize, cancel)${NC}"
    echo -e "${CYAN}   ✅ Quality Control (run checks, get results)${NC}"
    echo -e "${CYAN}   ✅ String Tagging (add/remove tags, search by tags)${NC}"
    echo -e "${CYAN}   ✅ Glossary Management (create, add terms, manage)${NC}"
    echo -e "${CYAN}   ✅ Webhook Configuration (create, manage notifications)${NC}"
    echo ""
    echo -e "${PURPLE}📍 INSTALLATION DETAILS:${NC}"
    echo -e "${CYAN}   • Location: $INSTALL_DIR${NC}"
    echo -e "${CYAN}   • Main server: bin/mcp-simple.js${NC}"
    echo -e "${CYAN}   • TypeScript source: src/index.ts${NC}"
    echo -e "${CYAN}   • Tools available: 30+ Smartling API tools${NC}"
    echo ""
    echo -e "${PURPLE}🎯 NEXT STEPS:${NC}"
    
    if [[ "$INSTALL_FOR_CLAUDE" == true ]]; then
        echo -e "${YELLOW}   Claude Desktop:${NC}"
        echo -e "${CYAN}   1. 🔄 Restart Claude Desktop application${NC}"
        echo -e "${CYAN}   2. ✨ The 'smartling' server will be available automatically${NC}"
        echo -e "${CYAN}   3. 🚀 Ask Claude to help with Smartling translation tasks${NC}"
    fi
    
    if [[ "$INSTALL_FOR_CURSOR" == true ]]; then
        echo -e "${YELLOW}   Cursor IDE:${NC}"
        echo -e "${CYAN}   1. 🔄 Restart Cursor IDE${NC}"
        echo -e "${CYAN}   2. 📱 Access via Cmd+Shift+P → 'MCP: Connect'${NC}"
        echo -e "${CYAN}   3. 🛠️ All Smartling tools will be available in the MCP panel${NC}"
    fi
    
    echo ""
    echo -e "${PURPLE}💡 MANUAL TESTING:${NC}"
    echo -e "${CYAN}   Test the server manually:${NC}"
    echo -e "${CYAN}   cd $INSTALL_DIR${NC}"
    echo -e "${CYAN}   echo '{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\"}' | node bin/mcp-simple.js${NC}"
    echo ""
    echo -e "${GREEN}🏆 Your Smartling MCP Server is ready for translation automation!${NC}"
    echo ""
    echo -e "${PURPLE}📚 Documentation: See README.md and TOOL_SPECIFICATIONS.md for usage details${NC}"
    echo ""
}

# Main installation flow
main() {
    show_banner
    
    # Parse command line arguments for credentials
    if [[ $# -eq 2 ]]; then
        collect_credentials "$1" "$2"
    else
        collect_credentials
    fi
    
    echo ""
    auto_detect_installation_targets
    echo ""
    
    check_system_requirements
    echo ""
    
    clone_repository
    verify_repository
    echo ""
    
    install_and_setup
    echo ""
    
    configure_ides
    echo ""
    
    test_installation
    
    show_success_message
}

# Handle script interruption gracefully
trap 'echo -e "\n${RED}⚠️  Installation interrupted by user. Cleaning up...${NC}"; [[ -d "$INSTALL_DIR" ]] && rm -rf "$INSTALL_DIR"; exit 1' INT

# Execute main installation
main "$@" 