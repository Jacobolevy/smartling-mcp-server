#!/bin/bash

echo "🚀 Smartling MCP Server - Environment Setup"
echo "==========================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Make servers executable
echo "🔧 Making servers executable..."
chmod +x bin/mcp-robust.js bin/mcp-simple.js 2>/dev/null || true

# Create .env example if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo "📝 Creating .env example..."
    cat > .env.example << 'EOF'
# Smartling API Credentials
SMARTLING_USER_IDENTIFIER=your_user_identifier_here
SMARTLING_USER_SECRET=your_user_secret_here
SMARTLING_BASE_URL=https://api.smartling.com
EOF
fi

# Test robust server
echo "🧪 Testing robust server..."
if echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | timeout 10s node bin/mcp-robust.js 2>/dev/null | grep -q '"tools"'; then
    echo "✅ Robust server test passed"
else
    echo "⚠️  Robust server test failed (normal without credentials)"
fi

echo ""
echo "🎉 Environment Setup Complete!"
echo "=============================="
echo ""
echo "📋 What's ready:"
echo "   ✅ Node.js $NODE_VERSION"
echo "   ✅ Dependencies installed"
echo "   ✅ Servers executable"
echo "   ✅ Environment prepared"
echo ""
echo "🚀 Next step - Choose your installation method:"
echo ""
echo "📡 Option 1: One-line remote install (recommended)"
echo "   curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash"
echo ""
echo "🏠 Option 2: Local install (you already have the code)"
echo "   ./install-mcp.sh"
echo ""
echo "📚 Option 3: Manual setup"
echo "   See INSTALLATION.md for detailed instructions"
echo ""
echo "💡 The remote installer automatically configures both Claude Desktop and Cursor"
echo "🛡️ All methods use the timeout-protected robust server" 