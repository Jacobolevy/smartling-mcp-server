# 🚀 QUICK INSTALL - ROBUST SMARTLING MCP

## ⚡ ONE-COMMAND INSTALLATION

### 🚀 **AUTOMATIC MODE (With credentials):**
```bash
cd ~/Downloads/smartling-mcp-server-main && ./install-robust-smartling-en.sh "vjwwgsqgeogfkqtmntznqhqxaslfwx" "s16jebo9eafog6ugv1me6paojuIL^38pkd2kv1ltr8e9pa5vj9on825"
```

### 💬 **INTERACTIVE MODE (Asks for credentials):**
```bash
cd ~/Downloads/smartling-mcp-server-main && ./install-robust-smartling-en.sh
```

## 📋 WHAT THIS INSTALLER DOES:

✅ **Preserves existing MCPs** - Doesn't overwrite your current configurations  
✅ **Replaces previous Smartling versions** - Automatically updates  
✅ **74+ Smartling tools** - Complete feature set  
✅ **Optimized for large operations** - No crashes with massive requests  
✅ **Compatible with Claude and Cursor** - Works on both platforms  
✅ **Automatic backups** - Creates timestamped backups of your configs  

## 🔑 INCLUDED CREDENTIALS:

Credentials are integrated in the automatic command. For interactive mode use:

```
User Identifier: vjwwgsqgeogfkqtmntznqhqxaslfwx
User Secret: s16jebo9eafog6ugv1me6paojuIL^38pkd2kv1ltr8e9pa5vj9on825
```

## 📦 PREREQUISITES:

- ✅ **Claude Desktop** - [Download](https://claude.ai/download)
- ✅ **Cursor** - [Download](https://cursor.sh) 
- ✅ **Node.js 16+** - [Download](https://nodejs.org)

## 🔄 IF YOU ALREADY HAVE SMARTLING MCP INSTALLED:

**No problem!** The installer:
- 🔍 **Detects** previous versions automatically
- 💾 **Backs up** your current configuration  
- 🔄 **Replaces** only the Smartling entry
- ✅ **Keeps** all your other MCPs intact

**No need to delete anything manually** - just run the installer.

## 🎯 AFTER INSTALLATION:

1. **Restart Claude Desktop** completely (Cmd+Q and reopen)
2. **Restart Cursor**
3. Verify you see **74+ Smartling tools** available
4. Test with small operations first, then scale up

## 🔧 INCLUDED TOOLS:

### 📁 **File Management** (25+ tools)
- Upload, download, delete files
- Advanced string search
- Translation status
- Content and context

### 🏷️ **Advanced Tagging** (10+ tools)
- Add/remove tags
- Search by tags
- Massive tagging operations
- Project tag management

### 💼 **Translation Jobs** (15+ tools)
- Create and manage jobs
- Content authorization
- Translator assignment
- Progress tracking

### 📊 **Quality Control** (8+ tools)
- Automatic quality checks
- Inconsistency reports
- Glossary validation
- Translation metrics

### 🔗 **Integrations** (16+ tools)
- Webhooks for notifications
- Reporting APIs
- User management
- Project configuration

## 🚨 TROUBLESHOOTING:

### If you see 0 tools after installing:
```bash
# Verify config files are correct
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
ls -la ~/Library/Application\ Support/Cursor/User/settings.json

# Restart both applications completely
```

### If there are permission errors:
```bash
chmod +x ~/smartling-mcp-server/bin/smartling-mcp.js
```

### For timeout errors (like ETIMEDOUT):
1. **Restart Cursor completely** (Cmd+Q and reopen)
2. **Check server is running:** `ps aux | grep smartling`
3. **Test server directly:** `node ~/smartling-mcp-server/bin/smartling-mcp.js`
4. **Use ultra-basic server for testing:** Switch to `mcp-ultra-basic.js` temporarily

### To see debug logs:
```bash
# Claude logs
tail -f ~/Library/Logs/Claude/mcp-server-smartling.log

# Cursor logs (in Dev Tools)
```

## ✨ AFTER INSTALLATION:

You'll have access to **all professional Smartling functionalities**:
- Massive and automated translations
- Complete multilingual project management
- Advanced quality control
- Optimized workflows
- Complete APIs for integration

**No more crashes** with large operations! 🎉

---

## 💡 **RECOMMENDATION:**

Use **automatic mode** for faster installation:

```bash
cd ~/Downloads/smartling-mcp-server-main && ./install-robust-smartling-en.sh "vjwwgsqgeogfkqtmntznqhqxaslfwx" "s16jebo9eafog6ugv1me6paojuIL^38pkd2kv1ltr8e9pa5vj9on825"
```

**Single command, zero interaction, complete installation!** ⚡ 