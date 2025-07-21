#!/bin/bash

echo "🚀 Setting up Smartling MCP Server..."

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

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "🔧 Creating configuration file..."
    cat > .env << 'EOF'
# Smartling API Credentials
SMARTLING_USER_IDENTIFIER=your_user_identifier_here
SMARTLING_USER_SECRET=your_user_secret_here
SMARTLING_BASE_URL=https://api.smartling.com

# Debug mode (optional)
DEBUG=false
EOF
else
    echo "⚠️  .env file already exists, skipping creation"
fi

# Make MCP server executable
chmod +x bin/mcp-simple.js

# Test installation
echo "🧪 Testing installation..."
if npm test > /dev/null 2>&1; then
    echo "✅ Installation test passed"
else
    echo "⚠️  Installation test failed, but this might be normal without credentials"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Smartling credentials"
echo "2. Configure MCP server in Claude Desktop or Cursor"
echo "3. Start using all 74 Smartling tools!"
echo ""
echo "📚 Read INSTALLATION.md for detailed instructions"
echo "📋 Tool count: $(grep -c "name: 'smartling_" bin/mcp-simple.js) tools available" 