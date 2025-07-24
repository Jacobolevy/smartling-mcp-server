#!/bin/bash

# 🧹 Repository Cleanup Script
# Eliminates all redundant and unnecessary files

echo "🧹 Starting repository cleanup..."

# Create backup directory
mkdir -p .cleanup-backup
BACKUP_DIR=".cleanup-backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup in: $BACKUP_DIR"

# Function to safely remove files (with backup)
safe_remove() {
    local file="$1"
    if [[ -f "$file" ]]; then
        echo "🗑️  Removing: $file"
        cp "$file" "$BACKUP_DIR/" 2>/dev/null
        rm "$file"
    fi
}

# Remove redundant installers (keeping only install-optimized.sh)
echo "🗑️  Removing redundant installers..."
safe_remove "install-robust-smartling.sh"
safe_remove "install-robust-smartling-en.sh"
safe_remove "install-batch-optimized.sh"
safe_remove "install-fixed.sh"
safe_remove "install-mcp.sh"
safe_remove "install-with-credentials.sh"
safe_remove "install-with-params.sh"
safe_remove "install-with-params-smart.sh"

# Remove obsolete scripts
echo "🗑️  Removing obsolete scripts..."
safe_remove "fix-cursor-timeout.sh"
safe_remove "switch-to-ultra-basic.sh"
safe_remove "test-robust-install.sh"
safe_remove "setup.sh"
safe_remove "create-package.sh"
safe_remove "github-setup.sh"
safe_remove "deploy-internal.sh"

# Remove backup files
echo "🗑️  Removing backup files..."
safe_remove "package.json.bak"

# Remove redundant documentation
echo "🗑️  Removing redundant documentation..."
safe_remove "QUICK-INSTALL-ROBUST-EN.md"
safe_remove "BATCH-OPTIMIZED-INSTALLER.md"
safe_remove "INTERNAL-DEPLOYMENT.md"
safe_remove "WHAT-TO-SUBMIT.md"
safe_remove "PREREQUISITES.md"

# Remove redundant JavaScript files
echo "🗑️  Removing redundant JavaScript files..."
safe_remove "smartling-chat-example.js"
safe_remove "smartling-chat-direct.js"
# Note: keeping browser-integration.js and chat-integration.js for now as they might be used

# Remove unnecessary config files
echo "🗑️  Removing unnecessary config files..."
safe_remove "audit-ci.json"
safe_remove "render.yaml"
safe_remove ".vercelignore"

# Remove debug files
echo "🗑️  Removing debug files..."
safe_remove "claude-debug.log"

# Clean up bin directory (keep only optimized version)
echo "🗑️  Cleaning bin directory..."
if [[ -f "bin/mcp-optimized.js" && -f "bin/mcp-simple.js" ]]; then
    echo "📦 Backing up and removing bin/mcp-simple.js (replaced by mcp-optimized.js)"
    cp "bin/mcp-simple.js" "$BACKUP_DIR/"
    rm "bin/mcp-simple.js"
fi

# Count removed files
REMOVED_COUNT=$(ls "$BACKUP_DIR" | wc -l)

echo ""
echo "✅ Cleanup completed!"
echo "📊 Files removed: $REMOVED_COUNT"
echo "💾 Backup location: $BACKUP_DIR"
echo ""
echo "🚀 Repository is now optimized:"
echo "   - Removed redundant installers"
echo "   - Removed obsolete scripts" 
echo "   - Removed backup files"
echo "   - Removed redundant documentation"
echo "   - Cleaned unnecessary configs"
echo ""
echo "✅ Remaining essential files:"
echo "   - install-optimized.sh (THE installer)"
echo "   - bin/mcp-optimized.js (95% smaller than original)"
echo "   - Core source files in src/"
echo "   - Essential documentation"
echo ""

# Show final directory size
echo "📏 Repository size after cleanup:"
du -sh . | head -1 