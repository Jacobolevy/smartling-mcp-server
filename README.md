# Smartling MCP Server

A **robust Model Context Protocol (MCP) server** that provides Smartling translation tools for Claude Desktop, Cursor, and other MCP-compatible applications. Includes **timeout protection** and **227 Wix projects access**.

## 🚀 Quick Installation

### ⚡ One-Line Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash
```

**What it does:**
- ✅ Downloads and installs complete MCP server
- ✅ Configures **both Claude Desktop AND Cursor**
- ✅ Uses **timeout-protected server** (no hanging)
- ✅ Works on macOS and Linux
- ✅ Fully automatic (no prompts)

### 🔧 Manual Installation

If you prefer manual setup:

```bash
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server
./install-fixed.sh
```

### ⚙️ Add Your Credentials

Edit the generated config files with your Smartling credentials:

**Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Cursor:** `~/.cursor/mcp.json`

Replace:
```json
"SMARTLING_USER_IDENTIFIER": "your_user_id_here",
"SMARTLING_USER_SECRET": "your_user_secret_here"
```

### 🔑 Get Smartling Credentials

1. Go to [Smartling Dashboard → Settings → API](https://dashboard.smartling.com/settings/api)
2. Create **User Identifier** and **User Secret**
3. Copy to your config files
4. **Restart Claude Desktop/Cursor**

## ✅ Verification

Ask Claude Desktop or Cursor:
> "How many Smartling tools do you have available?"

**Expected response:**
```
I have 3 Smartling tools available:
• smartling_get_account_info - Get account information
• smartling_get_projects - Get list of projects (227 available)
• smartling_diagnostic - Quick diagnostic test
```

## 🛠️ Technical Features

### **Robust MCP Server**
- **⏱️ Timeout Protection**: 8-second max per request (no hanging)
- **🛡️ Error Handling**: Proper error recovery and logging
- **🚀 Fast Performance**: Optimized for quick responses
- **📊 Project Access**: Full access to 227 Wix projects

### **Tools Available**
- **smartling_get_account_info**: Get Smartling account information
- **smartling_get_projects**: List translation projects (227 from Wix)
- **smartling_diagnostic**: Test connection and health

### **Chat Integration**
For internal chat platforms, see:
- **[Chat Integration Guide](CHAT-INTEGRATION-GUIDE.md)** - Direct integration
- **[chat-integration.js](chat-integration.js)** - Node.js backend
- **[browser-integration.js](browser-integration.js)** - Web frontend

## 📋 Configuration Example

**Claude Desktop config:**
```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/path/to/smartling-mcp-server/bin/mcp-robust.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier",
        "SMARTLING_USER_SECRET": "your_user_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

## 🧪 Testing

Test your installation:
```bash
# Test connection
npm run test:connection

# Test MCP protocol
npm run test:mcp

# Test diagnostic tool
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "smartling_diagnostic", "arguments": {}}}' | node bin/mcp-robust.js
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Service disruption" in Claude | Server hanging - **use install-fixed.sh** |
| "0 tools enabled" | Wrong path - **run installer again** |
| "Connection timeout" | Firewall/proxy - **use chat integration** |
| "Could not attach to MCP server" | Missing Node.js - **install Node.js 18+** |

### **If Claude Desktop hangs:**
The original installer had timeout issues. **Use install-fixed.sh** which includes:
- ✅ **mcp-robust.js** - Timeout-protected server
- ✅ **8-second timeouts** - No more hanging
- ✅ **Proper error handling** - Better reliability

## 📚 Documentation

- **[INSTALLATION.md](INSTALLATION.md)** - Detailed setup guide
- **[CHAT-INTEGRATION-GUIDE.md](CHAT-INTEGRATION-GUIDE.md)** - Internal chat integration
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guide
- **[examples/](examples/)** - Usage examples

## 🌟 Key Advantages

### **For Organizations:**
- **🏢 Enterprise Ready**: Tested with Wix's 227 projects
- **🔒 Secure**: API credential management
- **⚡ Reliable**: Timeout protection and error handling
- **🔌 Easy Integration**: Works with existing tools

### **For Developers:**
- **📡 Direct API Access**: Bypass proxy issues
- **🎯 Chat Integration**: Ready for internal platforms
- **🛠️ Extensible**: Add more tools easily
- **📋 Well Documented**: Complete guides and examples

## 🆕 Recent Updates

- **✅ Fixed installer** - No more hanging issues
- **✅ Timeout protection** - 8-second max per request
- **✅ Chat integration** - Ready for internal platforms
- **✅ 227 projects** - Full Wix account access
- **✅ Robust error handling** - Better reliability

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Jacobolevy/smartling-mcp-server/issues)
- **Installation Help**: Run `./install-fixed.sh` again
- **API Documentation**: [Smartling Developers](https://developers.smartling.com/)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**🎯 TL;DR:** Run `curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash`, add your Smartling credentials, restart Claude Desktop. Done! 🚀
