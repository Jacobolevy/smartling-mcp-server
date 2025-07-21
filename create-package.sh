#!/bin/bash

# 📦 Create Smartling MCP Server Distribution Package
# This script creates a complete distribution package ready for sharing

set -e  # Exit on any error

echo "🚀 Creating Smartling MCP Server Distribution Package..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="smartling-mcp-server-v${VERSION}"
DIST_DIR="smartling-mcp-distributable"

print_status "Creating package version: ${VERSION}"

# Create distribution directory
print_status "Creating distribution directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Essential files to include
print_status "Copying essential files..."
cp -r bin/ "$DIST_DIR/"
cp -r src/ "$DIST_DIR/"
cp package.json "$DIST_DIR/"
cp README.md "$DIST_DIR/"
cp LICENSE "$DIST_DIR/"
cp INSTALLATION.md "$DIST_DIR/"
cp QUICK-INSTALL.md "$DIST_DIR/"
cp CONTRIBUTING.md "$DIST_DIR/"
cp CHANGELOG.md "$DIST_DIR/"
cp .env.example "$DIST_DIR/"
cp .gitignore "$DIST_DIR/"

# Copy examples if they exist
if [ -d "examples" ]; then
    print_status "Copying examples..."
    cp -r examples/ "$DIST_DIR/"
fi

# Create setup script for the distribution
print_status "Creating setup script..."
cat > "$DIST_DIR/setup.sh" << 'EOF'
#!/bin/bash

# 🚀 Smartling MCP Server Setup Script
echo "🌟 Setting up Smartling MCP Server..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
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
npm install

# Create .env file from example
if [ ! -f ".env" ]; then
    echo "🔧 Creating environment configuration..."
    cp .env.example .env
    echo "📝 Please edit .env file with your Smartling credentials"
else
    echo "⚠️  .env file already exists, skipping creation"
fi

# Make scripts executable
chmod +x bin/mcp-simple.js

# Test installation
echo "🧪 Testing installation..."
if npm test; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Edit .env file with your Smartling API credentials"
    echo "2. Add MCP server to your Claude/Cursor configuration"
    echo "3. Test with: npm run test:connection"
    echo ""
    echo "📚 Read INSTALLATION.md for detailed setup instructions"
else
    echo "❌ Setup test failed. Check your configuration."
    exit 1
fi
EOF

chmod +x "$DIST_DIR/setup.sh"

# Create installation instructions specific to the package
print_status "Creating package-specific README..."
cat > "$DIST_DIR/README-PACKAGE.md" << EOF
# 📦 Smartling MCP Server Distribution Package

Version: ${VERSION}
Package Date: $(date '+%Y-%m-%d %H:%M:%S')

## 🚀 Quick Start

1. **Run setup**:
   \`\`\`bash
   chmod +x setup.sh
   ./setup.sh
   \`\`\`

2. **Configure credentials**:
   Edit the \`.env\` file with your Smartling API credentials

3. **Follow installation guide**:
   See \`INSTALLATION.md\` for complete setup instructions

## 📁 Package Contents

- \`bin/\` - MCP server executable
- \`src/\` - Source code
- \`examples/\` - Usage examples  
- \`setup.sh\` - Automated setup script
- \`INSTALLATION.md\` - Complete installation guide
- \`QUICK-INSTALL.md\` - Quick setup guide
- \`.env.example\` - Environment template

## 🔧 Available Tools: 53

This package includes complete Smartling API coverage with tools for:
- Translation management
- File operations
- Quality assurance
- Project workflows
- And much more!

## 📞 Support

- Documentation: See included README.md
- Issues: https://github.com/Jacobolevy/smartling-mcp-server/issues
- Examples: Check examples/ folder
EOF

# Create package info file
print_status "Creating package info..."
cat > "$DIST_DIR/package-info.json" << EOF
{
  "name": "smartling-mcp-server",
  "version": "${VERSION}",
  "packageDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tools": 53,
  "compatibility": ["Claude Desktop", "Cursor", "MCP Clients"],
  "nodejs": ">=18.0.0",
  "license": "MIT"
}
EOF

# Clean up node_modules if present (not needed in distribution)
if [ -d "$DIST_DIR/node_modules" ]; then
    print_status "Removing node_modules from distribution..."
    rm -rf "$DIST_DIR/node_modules"
fi

# Create ZIP archive
print_status "Creating ZIP archive..."
cd "$DIST_DIR"
zip -r "../${PACKAGE_NAME}.zip" . -x "*.DS_Store" "*.log"
cd ..

# Display success information
echo ""
print_success "Package created successfully!"
echo ""
echo "📦 Package details:"
echo "   Name: ${PACKAGE_NAME}"
echo "   Location: ${PWD}/${PACKAGE_NAME}.zip"
echo "   Size: $(du -h "${PACKAGE_NAME}.zip" | cut -f1)"
echo ""
echo "📁 Distribution folder: ${DIST_DIR}/"
echo ""
echo "🚀 Ready to share!"
echo "   Users can extract and run: ./setup.sh"
echo ""

# Optional: Test the package
read -p "🧪 Do you want to test the package? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Testing package..."
    cd "$DIST_DIR"
    if ./setup.sh; then
        print_success "Package test completed successfully!"
    else
        print_error "Package test failed!"
    fi
    cd ..
fi

print_success "Distribution package creation completed!" 