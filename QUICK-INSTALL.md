# ⚡ Quick Installation - Smartling MCP Server

Get Smartling translation tools working in **Claude Desktop and Cursor** in **under 1 minute**.

## 🚀 Super Quick Install (30 seconds)

**Copy and paste this one command:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh | bash
```

**That's it!** 🎉

The installer automatically:
- ✅ Downloads the complete MCP server
- ✅ Configures **both Claude Desktop AND Cursor**
- ✅ Sets up timeout-protected server (no hanging)
- ✅ Creates proper config files

## 🔑 Add Your Credentials (30 seconds)

1. **Get credentials:** [Smartling Dashboard → API Settings](https://dashboard.smartling.com/settings/api)
2. **Edit files and replace placeholders:**

**Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
"SMARTLING_USER_IDENTIFIER": "your_actual_user_id_here",
"SMARTLING_USER_SECRET": "your_actual_secret_here"
```

**Cursor:** `~/.cursor/mcp.json`
```json
"SMARTLING_USER_IDENTIFIER": "your_actual_user_id_here", 
"SMARTLING_USER_SECRET": "your_actual_secret_here"
```

## ✅ Test (10 seconds)

1. **Restart** Claude Desktop or Cursor
2. **Ask:** *"How many Smartling tools do you have?"*
3. **Should see:**
   ```
   I have 3 Smartling tools available:
   • smartling_get_account_info
   • smartling_get_projects (227 available)
   • smartling_diagnostic
   ```

**✅ Working? Perfect!**  
**❌ Not working? See troubleshooting below.**

---

## 🐛 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| "Service disruption" | **✅ You have the timeout-protected server** |
| "0 tools enabled" | Run installer again + restart app |
| "MCP server not found" | Check credentials, restart computer |
| Still broken? | Use [INSTALLATION.md](INSTALLATION.md) |

---

## 🛠️ What You Get

### **Core Smartling Tools:**
- **Account Info** - Get Smartling account details
- **Projects** - Access to 227 Wix translation projects  
- **Diagnostic** - Test connection and health

### **Chat Integration:**
For internal chat platforms:
- **[chat-integration.js](chat-integration.js)** - Node.js backend
- **[browser-integration.js](browser-integration.js)** - Web frontend
- **[CHAT-INTEGRATION-GUIDE.md](CHAT-INTEGRATION-GUIDE.md)** - Complete guide

### **Robust & Reliable:**
- **⏱️ 8-second timeouts** - No more hanging
- **🛡️ Error handling** - Proper crash protection
- **🚀 Fast responses** - Optimized performance

---

## 💡 Pro Tips

- **One-liner works on macOS and Linux**
- **Automatically configures both Claude Desktop AND Cursor**
- **No prompts or interaction needed**
- **Timeout-protected server prevents hanging**
- **Ready for internal chat integration**

---

## 📚 More Info

- **[README.md](README.md)** - Complete overview
- **[INSTALLATION.md](INSTALLATION.md)** - Detailed setup guide
- **[CHAT-INTEGRATION-GUIDE.md](CHAT-INTEGRATION-GUIDE.md)** - Internal chat setup

---

**🎯 TL;DR:** One command → Add credentials → Restart → Done! 🚀 