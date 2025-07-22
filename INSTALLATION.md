# Smartling MCP Server - Installation Guide

This MCP server provides **74 Smartling tools** for translation management in Claude Desktop and Cursor.

## 🚀 Quick Installation (Recommended)

### Option A: Automatic Installation Script

**For macOS/Linux:**
```bash
# 1. Download and extract the MCP server
# 2. Navigate to the directory
cd smartling-mcp-server-main

# 3. Run the auto-installer
./install-mcp.sh

# 4. Add your Smartling credentials to the generated config files
# 5. Restart Claude Desktop/Cursor
```

**For Windows:**
```cmd
# 1. Download and extract the MCP server
# 2. Navigate to the directory
cd smartling-mcp-server-main

# 3. Run the auto-installer
install-mcp.bat

# 4. Add your Smartling credentials to the generated config files
# 5. Restart Claude Desktop/Cursor
```

The auto-installer will:
- ✅ Detect your installation directory automatically
- ✅ Configure both Cursor and Claude Desktop
- ✅ Install all dependencies
- ✅ Create config files with the correct paths

### Option B: One-Command Installation

```bash
# Download, extract, and install in one command
curl -L https://github.com/Jacobolevy/smartling-mcp-server/archive/main.zip -o smartling-mcp.zip && \
unzip smartling-mcp.zip && \
cd smartling-mcp-server-main && \
./install-mcp.sh
```

---

## 🔧 Manual Installation (Advanced Users)

If you prefer to configure manually or the automatic installer doesn't work:

### Step 1: Download and Setup

```bash
# Clone or download the repository
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server

# Install dependencies
npm install
```

### Step 2: Configure MCP Clients

You need to update the configuration files for your MCP clients. **Replace `/YOUR/PATH/HERE/` with your actual installation path.**

#### For Claude Desktop

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/YOUR/PATH/HERE/smartling-mcp-server/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier",
        "SMARTLING_USER_SECRET": "your_user_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

#### For Cursor

Edit: `~/.cursor/mcp.json` (macOS/Linux) or `%USERPROFILE%\.cursor\mcp.json` (Windows)

```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/YOUR/PATH/HERE/smartling-mcp-server/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier",
        "SMARTLING_USER_SECRET": "your_user_secret", 
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

**⚠️ Important:** Replace:
- `/YOUR/PATH/HERE/` with your actual installation directory
- `your_user_identifier` with your Smartling User Identifier
- `your_user_secret` with your Smartling User Secret

---

## 🔑 Getting Smartling Credentials

1. Go to [Smartling Dashboard](https://dashboard.smartling.com/settings/api)
2. Navigate to **Settings** → **API**
3. Create a new **User Identifier** and **User Secret**
4. Copy these values to your configuration files

---

## ✅ Verification

After installation:

1. **Restart** Claude Desktop or Cursor completely
2. In a new conversation, ask: *"How many Smartling tools do you have available?"*
3. You should see: **"I have 74 Smartling tools available"**

---

## 🔧 Troubleshooting

### "0 tools enabled" or "MCP server not found"

**Issue:** Wrong path in configuration
**Solution:** 
- Verify the path in your config file points to `bin/mcp-simple.js`
- Use the auto-installer to detect the correct path automatically

### "Could not attach to MCP server"

**Issue:** Missing dependencies or incorrect Node.js path
**Solution:**
```bash
# Reinstall dependencies
npm install

# Check Node.js installation
which node  # Should show: /usr/local/bin/node or similar

# Test the server manually
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node bin/mcp-simple.js
```

### "Invalid credentials" errors

**Issue:** Incorrect Smartling credentials
**Solution:**
- Verify your credentials at [Smartling API Settings](https://dashboard.smartling.com/settings/api)
- Make sure there are no extra spaces or characters in your config

### Still having issues?

1. Run the auto-installer again: `./install-mcp.sh`
2. Check that all 74 tools load: `npm run test:mcp`
3. Restart your computer to clear all caches

---

## 📋 Available Tools

This MCP server provides **74 comprehensive Smartling tools** including:

### Core Functions
- Project management (list, details, create)
- File operations (upload, download, status)
- String management (search, translate, tag)
- Job management (create, authorize, close)

### Advanced Features  
- Quality checks and reporting
- Glossary management
- Webhook configuration
- Batch operations
- Context management
- Translation statistics

### Complete Tool List
All 74 tools are automatically available after successful installation. No additional configuration required.

---

## 🆕 What's New

- **✅ Auto-installer scripts** for easy setup
- **✅ Universal path detection** - works on any system
- **✅ 74 tools** (increased from 9 in basic version)
- **✅ Full Claude Desktop and Cursor compatibility**
- **✅ Robust error handling** and crash protection
- **✅ Support for resources/list and prompts/list** methods

---

## 💡 Tips

- Use the **auto-installer** for the easiest setup experience
- The server uses `mcp-simple.js` (74 tools) not `mcp-server.js` (9 tools)
- Restart your MCP clients after any configuration changes
- Keep your Smartling credentials secure and don't commit them to version control 