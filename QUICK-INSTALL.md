# 🚀 Smartling MCP - Quick Install Guide

## One-Line Installers

### 📋 Prerequisites
- **Node.js 18.0.0+** installed ([Download here](https://nodejs.org/))
- **Git** (optional, installers have fallback methods)
- **PowerShell** (Windows) or **Terminal** (macOS/Linux)
- **Smartling API credentials** (User ID + Secret)
  - Get from: [Smartling Dashboard → Settings → API](https://dashboard.smartling.com/settings/api)

---

## 🎯 For Cursor IDE

### **Windows (PowerShell)**
```powershell
# Download and run Windows installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-cursor-windows.bat" -OutFile "install-cursor.bat"
.\install-cursor.bat
```

**⚠️ Note:** Cursor on Windows may open additional PowerShell windows - this is a known limitation.

### **macOS/Linux (Terminal)**
```bash
curl -sSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-cursor-mcp.sh | bash
```

**Or locally (if you already have the repository):**
```bash
cd smartling-mcp-server && ./install-cursor-mcp.sh
```

---

## 🎯 For Claude Desktop

### **Windows (PowerShell)**
```powershell
# Download and run Windows installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-claude-windows.bat" -OutFile "install-claude.bat"
.\install-claude.bat
```

### **macOS/Linux (Terminal)**
```bash
curl -sSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-claude-mcp.sh | bash
```

**Or locally (if you already have the repository):**
```bash
cd smartling-mcp-server && ./install-claude-mcp.sh
```

---

## 🎯 For Both (Interactive)

### **Windows (PowerShell)**
```powershell
# Download repository
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server

# Interactive setup
Write-Host "Choose your platform:"
Write-Host "1) Cursor IDE"
Write-Host "2) Claude Desktop"
Write-Host "3) Both"
$choice = Read-Host "Selection"
switch ($choice) {
    1 { .\install-cursor-windows.bat }
    2 { .\install-claude-windows.bat }
    3 { .\install-cursor-windows.bat; .\install-claude-windows.bat }
}
```

### **macOS/Linux (Terminal)**
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

| Platform | Application | Config Location |
|----------|-------------|----------------|
| **Windows** | Cursor | `%USERPROFILE%\.cursor\mcp.json` |
| **Windows** | Claude | `%APPDATA%\Claude\claude_desktop_config.json` |
| **macOS** | Cursor | `~/.cursor/mcp.json` |
| **macOS** | Claude | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | Cursor | `~/.cursor/mcp.json` |
| **Linux** | Claude | `~/.config/claude/claude_desktop_config.json` |

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

**Windows (PowerShell):**
```powershell
# Check required tools
where node    # Node.js required
where git     # Git preferred (PowerShell download as fallback)

# Manual installation
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server
npm install; npm run build
```

**macOS/Linux (Terminal):**
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

### Windows-specific issues?
- **PowerShell windows opening**: This is a known Cursor limitation on Windows, not an installer issue
- **Bash not recognized**: Use PowerShell installers (`.bat` files) instead of bash commands
- **Git not found**: The installer will use PowerShell download as fallback
- **Permission errors**: Try running PowerShell as Administrator if needed

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