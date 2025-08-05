#!/bin/bash

echo "🚀 Setting up GitHub repository for Smartling MCP Server..."

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI not detected. We will use manual setup."
    MANUAL_SETUP=true
else
    MANUAL_SETUP=false
fi

# Initialize Git repository if it doesn't exist
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git branch -M main
else
    echo "✅ Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/

# TypeScript
*.tsbuildinfo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs
*.log

# Distribution packages
smartling-mcp-distributable/
smartling-mcp-server.zip

# Temporary files
tmp/
temp/
EOF
fi

# Add files to repository
echo "📋 Adding files to repository..."
git add .
git add .env.example
git add .github/workflows/deploy.yml

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No new changes to commit"
else
    echo "💾 Creating initial commit..."
    git commit -m "feat: Add Smartling MCP Server with HTTP API support

Features:
- Complete MCP server for Smartling API
- 27+ tools for translation management
- HTTP server for cloud deployment
- Support for Railway, Docker
- Comprehensive documentation
- Automated deployment workflows"
fi

# Remote repository configuration
echo ""
echo "🔗 Remote repository configuration:"
echo ""

if [ "$MANUAL_SETUP" = true ]; then
    echo "📋 MANUAL GITHUB SETUP:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: smartling-mcp-server"
    echo "3. Description: Complete MCP Server for Smartling Translation Management API"
    echo "4. Public or Private (your choice)"
    echo "5. DO NOT initialize with README, .gitignore or license"
    echo ""
    echo "6. After creating the repo, run:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/smartling-mcp-server.git"
    echo "   git push -u origin main"
    echo ""
else
    echo "🤖 Do you want to create the repository automatically with GitHub CLI? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🚀 Creating repository on GitHub..."
        gh repo create smartling-mcp-server \
            --description "Complete MCP Server for Smartling Translation Management API" \
            --public \
            --source=. \
            --remote=origin \
            --push
        
        echo "✅ Repository created and code uploaded!"
    else
        echo "📋 To create manually, follow the instructions above."
    fi
fi

echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1. 📁 GitHub Repository: Ready"
echo "2. 🌐 Deploy to Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect GitHub"
echo "   - Import your repository"
echo "   - Configure environment variables"
echo ""
echo "3. 🔧 Environment variables in Railway:"
echo "   SMARTLING_USER_IDENTIFIER=your_user_identifier"
echo "   SMARTLING_USER_SECRET=your_user_secret"
echo ""
echo "4. 🚀 Final URL: https://smartling-mcp-server.railway.app"
echo ""
echo "📚 See DEPLOYMENT.md for advanced options"
echo ""
echo "✅ Your MCP Server will be available 24/7 without maintaining local files!" 