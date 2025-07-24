#!/bin/bash

# 🧹 Markdown Cleanup Script
# Removes unnecessary documentation files, keeping only essentials

echo "🧹 Starting markdown cleanup..."

# Create backup directory
BACKUP_DIR=".cleanup-backup/markdown_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup in: $BACKUP_DIR"

# Function to safely remove markdown files (with backup)
remove_md() {
    local file="$1"
    if [[ -f "$file" ]]; then
        echo "🗑️  Removing: $file"
        cp "$file" "$BACKUP_DIR/" 2>/dev/null
        rm "$file"
    fi
}

echo ""
echo "📋 ESSENTIAL FILES TO KEEP:"
echo "  ✅ README.md - Main repository documentation"
echo "  ✅ INSTALLATION.md - Installation instructions"
echo "  ✅ CHANGELOG.md - Change history"
echo "  ✅ CONTRIBUTING.md - Contributor guidelines"
echo "  ✅ examples/usage-examples.md - Usage examples"
echo "  ✅ HOW-TO-USE-OPTIMIZED.md - Optimizations guide"
echo ""

echo "🗑️  REMOVING REDUNDANT/UNNECESSARY FILES:"

# Remove redundant installation guides
remove_md "QUICK-INSTALL-ROBUST-EN.md"
remove_md "PREREQUISITES.md"
remove_md "BATCH-OPTIMIZED-INSTALLER.md"

# Remove internal documentation
remove_md "WHAT-TO-SUBMIT.md"
remove_md "INTERNAL-DEPLOYMENT.md"
remove_md "DEPLOYMENT.md"

# Remove technical guides not essential for end users
remove_md "CI-CD-GUIDE.md"
remove_md "CHAT-INTEGRATION-GUIDE.md"

# Remove optimization reports (too technical)
remove_md "FINAL-OPTIMIZATION-SUMMARY.md"
remove_md "REPOSITORY-OPTIMIZATION-REPORT.md"
remove_md "OPTIMIZATION-REPORT.md"

# Remove disabled workflows readme
remove_md ".github/workflows-disabled/README.md"

# Count removed files
REMOVED_COUNT=$(ls "$BACKUP_DIR" | wc -l)

echo ""
echo "✅ Markdown cleanup completed!"
echo "📊 Files removed: $REMOVED_COUNT"
echo "💾 Backup location: $BACKUP_DIR"
echo ""

echo "📋 REMAINING ESSENTIAL DOCUMENTATION:"
find . -name "*.md" | grep -v node_modules | grep -v .cleanup-backup | sort | while read file; do
    lines=$(wc -l < "$file")
    echo "  ✅ $file ($lines lines)"
done

echo ""
echo "🎯 BENEFITS ACHIEVED:"
echo "  - 📄 Reduced documentation complexity"
echo "  - 🧹 Eliminated redundant installation guides"
echo "  - 🗑️ Removed internal/technical documentation"
echo "  - 📖 Kept only user-essential files"
echo "  - 💾 Safe backups created for all removals"

echo ""
echo "🚀 Repository documentation is now optimized and focused!" 