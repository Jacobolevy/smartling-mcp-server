# 🚀 Smartling MCP - Quick Install Guide

## One-Line Installers

### 📋 Prerequisites
- **Node.js 18.0.0+** installed
- **Smartling API credentials** (User ID + Secret)
  - Get from: [Smartling Dashboard → Settings → API](https://dashboard.smartling.com/settings/api)

---

## 🎯 For Cursor IDE

```bash
curl -sSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-cursor-mcp.sh | bash
```

**Or locally (if you already have the repository):**
```bash
cd smartling-mcp-server && ./install-cursor-mcp.sh
```

---

## 🎯 For Claude Desktop

```bash
curl -sSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-claude-mcp.sh | bash
```

**Or locally (if you already have the repository):**
```bash
cd smartling-mcp-server && ./install-claude-mcp.sh
```

---

## 🎯 For Both (Interactive)

```bash
# Download and setup for both platforms
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server
echo "Choose your platform:"
echo "1) Cursor IDE"
echo "2) Claude Desktop" 
echo "3) Both"
read -p "Selection: " choice
case $choice in
  1) ./install-cursor-mcp.sh ;;
  2) ./install-claude-mcp.sh ;;
  3) ./install-cursor-mcp.sh && ./install-claude-mcp.sh ;;
esac
```

---

## ✅ What the Installer Does

1. **📥 Downloads:** Automatically clones/downloads the repository
2. **🔍 Auto-detects:** Node.js path, project directory, OS
3. **📦 Installs:** Dependencies and builds the project
4. **⚙️ Configures:** MCP server settings automatically
5. **🔑 Prompts:** For your Smartling credentials securely
6. **📝 Creates:** Proper config files in the right locations
7. **🛡️ Preserves:** Existing MCP server configurations (doesn't overwrite)

---

## 🔑 Smartling API Credentials

Before running the installer, get your credentials from:
**[Smartling Dashboard → Settings → API](https://dashboard.smartling.com/settings/api)**

**Required:**
- **User Identifier:** Your Smartling API user ID
- **User Secret:** Your Smartling API secret key

**Optional:**
- **Account UID:** Your Smartling account ID (for multi-account access)

**💡 Tip:** The installer will prompt for these during setup, so have them ready!

---

## 🗂️ Config File Locations

| Platform | Config Location |
|----------|----------------|
| **Cursor** | `~/.cursor/mcp.json` |
| **Claude (macOS)** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude (Linux)** | `~/.config/claude/claude_desktop_config.json` |
| **Claude (Windows)** | `%APPDATA%/Claude/claude_desktop_config.json` |

---

## 🔧 After Installation

1. **Restart** your AI application completely
2. **Test** with: *"Show me my Smartling projects"*
3. **Enjoy** 35 Smartling tools integrated! 🎉

---

## 🆘 Troubleshooting

### Tools not appearing?
```bash
# Check Node.js version
node --version  # Should be 18.0.0+

# Verify config file exists
ls -la ~/.cursor/mcp.json
# or
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Test direct execution
node /path/to/smartling-mcp-server/bin.js --help
```

### Permission issues?
```bash
# Fix permissions
chmod +x /path/to/smartling-mcp-server/bin.js

# On macOS, grant Claude necessary permissions in System Preferences
```

### Installation failed?
```bash
# Ensure you have required tools
which node    # Node.js required
which git     # Git preferred (curl/wget as fallback)
which unzip   # Required for zip download fallback

# Manual installation
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server
npm install && npm run build
```

### Credential issues?
- Verify credentials at: https://dashboard.smartling.com/settings/api
- Ensure User ID and Secret are correct
- Check that you have access to the projects you want to manage
- Account UID is optional unless you need multi-account access

### Still having issues?
1. Check application logs/developer console
2. Verify Smartling credentials are correct
3. Ensure project was built successfully: `npm run build`

---

## 🌟 Features Available

- **📊 Project Management** - View and manage 229+ Wix projects
- **🔄 Translation Jobs** - Create, authorize, and track jobs  
- **📁 File Management** - Upload/download translation files
- **🔍 String Search** - Find and manage translation strings
- **✅ Quality Control** - Run automated quality checks
- **📚 Glossary Management** - Manage translation glossaries
- **🔗 Webhooks** - Set up automation triggers

**All from your favorite AI assistant!** 🤖✨ 