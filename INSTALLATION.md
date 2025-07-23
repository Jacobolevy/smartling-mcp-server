# Smartling MCP Server - Installation Guide

This **robust MCP server** provides Smartling translation tools with **timeout protection** and access to **227 Wix projects** for Claude Desktop and Cursor.

## 🚀 Quick Installation (Recommended)

### ⚡ One-Line Installation

**Most reliable method - works automatically:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash
```

**What it does:**
- ✅ Downloads complete MCP server to `~/smartling-mcp-server`
- ✅ Configures **both Claude Desktop AND Cursor** automatically
- ✅ Uses **timeout-protected server** (mcp-robust.js)
- ✅ Creates proper config files with correct paths
- ✅ Works on macOS and Linux
- ✅ No prompts - fully automatic

### 🔧 Manual Installation

If you prefer manual setup:

```bash
# Clone the repository
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server

# Run the fixed installer
./install-fixed.sh

# Or install dependencies manually
npm install
```

---

## ⚙️ Add Your Smartling Credentials

After installation, edit the generated config files:

### For Claude Desktop
**File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/smartling-mcp-server/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_actual_user_id",
        "SMARTLING_USER_SECRET": "your_actual_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

### For Cursor
**File:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/smartling-mcp-server/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_actual_user_id",
        "SMARTLING_USER_SECRET": "your_actual_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

**⚠️ Replace:**
- `YOUR_USERNAME` with your actual username
- `your_actual_user_id` with your Smartling User Identifier
- `your_actual_secret` with your Smartling User Secret

---

## 🔑 Getting Smartling Credentials

1. Go to [Smartling Dashboard → Settings → API](https://dashboard.smartling.com/settings/api)
2. Create **User Identifier** and **User Secret**
3. Copy these values to your config files (remove the placeholder text)
4. **Save files and restart Claude Desktop/Cursor**

---

## ✅ Verification

### Test in Claude Desktop or Cursor
Ask: *"How many Smartling tools do you have available?"*

**Expected response:**
```
I have 3 Smartling tools available:
• smartling_get_account_info - Get Smartling account information
• smartling_get_projects - Get list of projects (227 available)
• smartling_diagnostic - Quick diagnostic test
```

### Command Line Testing
```bash
# Test the robust server
cd smartling-mcp-server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node bin/mcp-robust.js

# Test connection
npm run test:connection

# Test specific tool
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "smartling_diagnostic", "arguments": {}}}' | node bin/mcp-robust.js
```

---

## 🐛 Troubleshooting

### Claude Desktop Shows "Service Disruption"
**Issue:** Server hanging due to timeout problems  
**Solution:** Use the fixed installer:
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash
```

The fixed installer uses **mcp-robust.js** with:
- ✅ 8-second timeout protection
- ✅ Better error handling  
- ✅ No more hanging issues

### "0 tools enabled" or "MCP server not found"
**Issue:** Wrong path in configuration  
**Solution:**
- Run the installer again: `./install-fixed.sh`
- Check the path points to `bin/mcp-robust.js`
- Restart Claude Desktop/Cursor completely

### "Could not attach to MCP server"
**Issue:** Missing Node.js or dependencies  
**Solution:**
```bash
# Check Node.js (need 18+)
node --version

# Install dependencies
npm install

# Test server manually
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node bin/mcp-robust.js
```

### Connection Timeout / Proxy Issues
**Issue:** Corporate firewall blocking connections  
**Solution:** Use the chat integration instead:
- See [CHAT-INTEGRATION-GUIDE.md](CHAT-INTEGRATION-GUIDE.md)
- Use [chat-integration.js](chat-integration.js) for direct API calls
- Bypasses MCP server entirely

### "Invalid credentials" errors
**Issue:** Wrong Smartling credentials  
**Solution:**
- Verify at [Smartling API Settings](https://dashboard.smartling.com/settings/api)
- No spaces or quotes around credentials
- Use actual values, not placeholder text

---

## 🛠️ Technical Details

### **Robust MCP Server Features**
- **Server:** `bin/mcp-robust.js` (timeout-protected)
- **Timeout:** 8 seconds maximum per request
- **Error Handling:** Proper recovery and logging
- **Performance:** Optimized for quick responses
- **Projects:** Access to 227 Wix projects

### **Available Tools**
1. **smartling_get_account_info** - Get account information and details
2. **smartling_get_projects** - List translation projects (227 from Wix)
3. **smartling_diagnostic** - Test connection and server health

### **Chat Integration**
For internal chat platforms or proxy environments:
- **[Chat Integration Guide](CHAT-INTEGRATION-GUIDE.md)** - Complete setup
- **[chat-integration.js](chat-integration.js)** - Node.js backend
- **[browser-integration.js](browser-integration.js)** - Web frontend

---

## 🔄 Comparison: Old vs Fixed

| Feature | Old Installer | Fixed Installer |
|---------|---------------|-----------------|
| **Server** | mcp-simple.js | mcp-robust.js |
| **Timeouts** | ❌ None (hangs) | ✅ 8 seconds |
| **Error Handling** | ❌ Basic | ✅ Robust |
| **Claude Desktop** | ❌ Service disruption | ✅ Works reliably |
| **Installation** | ❌ Often fails | ✅ Always works |
| **Tools** | 74 tools | 3 core tools |

---

## 💡 Best Practices

### **For Organizations**
- Use the one-line installer for team deployment
- Store credentials securely (not in config files)
- Test with diagnostic tool before production use
- Use chat integration for internal platforms

### **For Developers**
- The robust server prevents hanging issues
- Chat integration bypasses proxy problems
- All tools have proper metadata and validation
- Full access to 227 Wix translation projects

---

## 📚 Additional Resources

- **[README.md](README.md)** - Quick start guide
- **[CHAT-INTEGRATION-GUIDE.md](CHAT-INTEGRATION-GUIDE.md)** - Internal chat setup
- **[examples/](examples/)** - Usage examples
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guide

---

## 🆕 Recent Updates

- **✅ Fixed installer** (`install-fixed.sh`) - No more hanging
- **✅ Robust server** (`mcp-robust.js`) - Timeout protection  
- **✅ Chat integration** - Direct API access
- **✅ 227 projects** - Full Wix account access
- **✅ Better documentation** - Clearer setup process

---

**🎯 Quick Start:** Run `curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash`, add your credentials, restart Claude Desktop. Done! 