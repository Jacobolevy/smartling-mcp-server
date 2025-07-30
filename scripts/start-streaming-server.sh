#!/bin/bash

# Smartling MCP Streaming Server Deployment Script
# Supports local, tunnel, and cloud deployment options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
PORT=${PORT:-3000}
HTTPS_PORT=${HTTPS_PORT:-3443}
DEPLOYMENT_TYPE=${1:-"local"}
TUNNEL_SERVICE=${2:-"ngrok"}

echo -e "${PURPLE}🚀 Smartling MCP Streaming Server Deployment${NC}"
echo -e "${CYAN}Version: 3.0.0 - OAuth 2.1 + MCP Compliant${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to build the project
build_project() {
    echo -e "${YELLOW}🔨 Building project...${NC}"
    npm run build
    echo -e "${GREEN}✅ Project built successfully${NC}"
}

# Function to generate SSL certificates
generate_ssl() {
    if [ "$SSL_GENERATE" = "true" ] || [ "$1" = "true" ]; then
        echo -e "${YELLOW}🔐 Generating SSL certificates...${NC}"
        SSL_GENERATE=true npm run start:streaming
        echo -e "${GREEN}✅ SSL certificates generated${NC}"
    fi
}

# Function to start local server
start_local() {
    echo -e "${BLUE}🌐 Starting local server...${NC}"
    echo -e "${CYAN}HTTP Port: ${PORT}${NC}"
    echo -e "${CYAN}HTTPS Port: ${HTTPS_PORT}${NC}"
    echo ""
    
    PORT=$PORT HTTPS_PORT=$HTTPS_PORT node dist/streaming-server.js &
    SERVER_PID=$!
    
    sleep 3
    
    echo -e "${GREEN}✅ Server started successfully!${NC}"
    echo -e "${CYAN}📡 HTTP URL: http://localhost:${PORT}${NC}"
    echo -e "${CYAN}🔒 HTTPS URL: https://localhost:${HTTPS_PORT}${NC}"
    echo -e "${CYAN}📚 Documentation: http://localhost:${PORT}/${NC}"
    echo -e "${CYAN}🔧 Health Check: http://localhost:${PORT}/health${NC}"
    echo ""
    echo -e "${YELLOW}Note: These URLs are only accessible locally${NC}"
    echo -e "${YELLOW}For public access, use tunnel or cloud deployment options${NC}"
}

# Function to start with ngrok tunnel
start_with_ngrok() {
    if ! command_exists ngrok; then
        echo -e "${RED}❌ ngrok not found. Installing...${NC}"
        echo -e "${YELLOW}Please install ngrok from https://ngrok.com/${NC}"
        echo -e "${YELLOW}Or run: brew install ngrok (macOS)${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🌍 Starting server with ngrok tunnel...${NC}"
    
    # Start the server in background
    PORT=$PORT HTTPS_PORT=$HTTPS_PORT node dist/streaming-server.js &
    SERVER_PID=$!
    
    sleep 3
    
    # Start ngrok tunnel
    echo -e "${YELLOW}🔗 Creating ngrok tunnel...${NC}"
    ngrok http $PORT --log=stdout > ngrok.log 2>&1 &
    NGROK_PID=$!
    
    sleep 5
    
    # Get the public URL
    PUBLIC_URL=$(curl -s localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep https | cut -d'"' -f4)
    
    if [ -n "$PUBLIC_URL" ]; then
        echo -e "${GREEN}✅ Tunnel created successfully!${NC}"
        echo -e "${CYAN}🌍 Public URL: ${PUBLIC_URL}${NC}"
        echo -e "${CYAN}📡 Streaming: ${PUBLIC_URL}/stream/:toolName${NC}"
        echo -e "${CYAN}🔄 Events: ${PUBLIC_URL}/events${NC}"
        echo -e "${CYAN}📚 Documentation: ${PUBLIC_URL}/${NC}"
        echo -e "${CYAN}🔧 Health Check: ${PUBLIC_URL}/health${NC}"
        echo ""
        echo -e "${GREEN}🎉 Your Smartling MCP Server is now publicly accessible!${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop both server and tunnel${NC}"
    else
        echo -e "${RED}❌ Failed to create ngrok tunnel${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
}

# Function to start with cloudflare tunnel
start_with_cloudflare() {
    if ! command_exists cloudflared; then
        echo -e "${RED}❌ cloudflared not found.${NC}"
        echo -e "${YELLOW}Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🌍 Starting server with Cloudflare tunnel...${NC}"
    
    # Start the server in background
    PORT=$PORT HTTPS_PORT=$HTTPS_PORT node dist/streaming-server.js &
    SERVER_PID=$!
    
    sleep 3
    
    # Start cloudflare tunnel
    echo -e "${YELLOW}🔗 Creating Cloudflare tunnel...${NC}"
    cloudflared tunnel --url http://localhost:$PORT &
    TUNNEL_PID=$!
    
    echo -e "${GREEN}✅ Cloudflare tunnel started!${NC}"
    echo -e "${YELLOW}Check the terminal output above for your public URL${NC}"
}

# Function to start with localtunnel
start_with_localtunnel() {
    if ! command_exists lt; then
        echo -e "${YELLOW}📦 Installing localtunnel...${NC}"
        npm install -g localtunnel
    fi
    
    echo -e "${BLUE}🌍 Starting server with localtunnel...${NC}"
    
    # Start the server in background
    PORT=$PORT HTTPS_PORT=$HTTPS_PORT node dist/streaming-server.js &
    SERVER_PID=$!
    
    sleep 3
    
    # Start localtunnel
    echo -e "${YELLOW}🔗 Creating localtunnel...${NC}"
    lt --port $PORT --subdomain smartling-mcp-${USER:-user} &
    TUNNEL_PID=$!
    
    sleep 3
    
    echo -e "${GREEN}✅ Localtunnel started!${NC}"
    echo -e "${CYAN}🌍 Public URL: https://smartling-mcp-${USER:-user}.loca.lt${NC}"
    echo -e "${YELLOW}Note: You may need to click 'Continue' on the localtunnel page${NC}"
}

# Function to show usage
show_usage() {
    echo -e "${CYAN}Usage: $0 [DEPLOYMENT_TYPE] [TUNNEL_SERVICE]${NC}"
    echo ""
    echo -e "${YELLOW}Deployment Types:${NC}"
    echo -e "  ${GREEN}local${NC}      - Start server locally (default)"
    echo -e "  ${GREEN}tunnel${NC}     - Start with public tunnel"
    echo -e "  ${GREEN}cloud${NC}      - Deploy to cloud (placeholder)"
    echo -e "  ${GREEN}ssl${NC}        - Start with SSL certificates"
    echo ""
    echo -e "${YELLOW}Tunnel Services (when using 'tunnel'):${NC}"
    echo -e "  ${GREEN}ngrok${NC}      - Ngrok tunnel (default, requires account)"
    echo -e "  ${GREEN}cloudflare${NC} - Cloudflare tunnel (free)"
    echo -e "  ${GREEN}localtunnel${NC}- Localtunnel (free, simple)"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  ${CYAN}$0 local${NC}                    # Local server only"
    echo -e "  ${CYAN}$0 tunnel ngrok${NC}             # Public access via ngrok"
    echo -e "  ${CYAN}$0 tunnel cloudflare${NC}        # Public access via Cloudflare"
    echo -e "  ${CYAN}$0 tunnel localtunnel${NC}       # Public access via localtunnel"
    echo -e "  ${CYAN}$0 ssl${NC}                      # Local with SSL certificates"
    echo ""
    echo -e "${YELLOW}Environment Variables:${NC}"
    echo -e "  ${GREEN}PORT${NC}           - HTTP port (default: 3000)"
    echo -e "  ${GREEN}HTTPS_PORT${NC}     - HTTPS port (default: 3443)"
    echo -e "  ${GREEN}SSL_GENERATE${NC}   - Generate SSL certs (true/false)"
    echo -e "  ${GREEN}ENABLE_OAUTH${NC}   - Enable OAuth 2.1 (true/false)"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null || true
    fi
    if [ ! -z "$TUNNEL_PID" ]; then
        kill $TUNNEL_PID 2>/dev/null || true
    fi
    rm -f ngrok.log
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
case "$1" in
    "help" | "-h" | "--help")
        show_usage
        exit 0
        ;;
    "local")
        install_deps
        build_project
        start_local
        ;;
    "ssl")
        install_deps
        build_project
        generate_ssl true
        start_local
        ;;
    "tunnel")
        install_deps
        build_project
        case "$TUNNEL_SERVICE" in
            "ngrok")
                start_with_ngrok
                ;;
            "cloudflare")
                start_with_cloudflare
                ;;
            "localtunnel")
                start_with_localtunnel
                ;;
            *)
                echo -e "${RED}❌ Unknown tunnel service: $TUNNEL_SERVICE${NC}"
                echo -e "${YELLOW}Supported: ngrok, cloudflare, localtunnel${NC}"
                exit 1
                ;;
        esac
        ;;
    "cloud")
        echo -e "${YELLOW}🚧 Cloud deployment not implemented yet${NC}"
        echo -e "${CYAN}Consider using Railway, Heroku, or Vercel for cloud deployment${NC}"
        exit 1
        ;;
    *)
        install_deps
        build_project
        start_local
        ;;
esac

# Keep the script running
if [ "$DEPLOYMENT_TYPE" != "local" ] && [ "$DEPLOYMENT_TYPE" != "ssl" ]; then
    echo ""
    echo -e "${GREEN}🌟 Server is running! Press Ctrl+C to stop.${NC}"
    wait
fi 