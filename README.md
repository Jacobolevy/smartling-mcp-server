# Smartling MCP Server

A comprehensive Model Context Protocol (MCP) server that provides **74 Smartling tools** for translation management in Claude Desktop, Cursor, and other MCP-compatible applications.

## 🚀 Quick Installation

### Option 1: Auto-Installer (Recommended)

**macOS/Linux:**
```bash
cd smartling-mcp-server-main
./install-mcp.sh
```

**Windows:**
```cmd
cd smartling-mcp-server-main
install-mcp.bat
```

The auto-installer automatically:
- ✅ Detects your installation directory
- ✅ Configures Cursor and Claude Desktop
- ✅ Installs dependencies
- ✅ Creates config files with correct paths

### Option 2: One-Command Installation

```bash
curl -L https://github.com/Jacobolevy/smartling-mcp-server/archive/main.zip -o smartling-mcp.zip && \
unzip smartling-mcp.zip && \
cd smartling-mcp-server-main && \
./install-mcp.sh
```

### After Installation

1. **Add your Smartling credentials** to the generated config files
2. **Restart** Claude Desktop or Cursor
3. **Verify**: Ask "How many Smartling tools do you have?" → Should show **74 tools**

## 🔑 Smartling Credentials

Get your credentials from [Smartling Dashboard → Settings → API](https://dashboard.smartling.com/settings/api):
- **User Identifier**: Your API user identifier
- **User Secret**: Your API secret key

## 📋 What's Included

### 74 Comprehensive Smartling Tools:

**Core Functions (20 tools)**
- Project management (list, details, create)
- File operations (upload, download, status, delete)
- String management (search, translate, tag)
- Locale management

**Translation Workflows (15 tools)**
- Job management (create, authorize, close)
- Translation status tracking
- Workflow management
- Vendor assignment

**Quality & Analysis (12 tools)**
- Quality checks and reporting
- Translation statistics
- Progress tracking
- Analytics

**Advanced Features (15 tools)**
- Glossary management
- Context and visual context
- Webhook configuration
- Batch operations

**Management & Admin (12 tools)**
- User and people management
- Reports and estimates
- Issue tracking
- Diagnostic tools

## 🔧 Manual Configuration

If you prefer manual setup, see [INSTALLATION.md](INSTALLATION.md) for detailed instructions.

**Example Configuration:**

```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/path/to/smartling-mcp-server/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier",
        "SMARTLING_USER_SECRET": "your_user_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

## ✅ Verification

Test your installation:

```bash
# Test server directly
npm run test:mcp

# Count tools (should show 74)
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node bin/mcp-simple.js | grep -o '"name":"[^"]*"' | wc -l
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "0 tools enabled" | Use auto-installer to fix paths |
| "Could not attach to MCP server" | Check Node.js installation and run `npm install` |
| "Invalid credentials" | Verify credentials at [Smartling API Settings](https://dashboard.smartling.com/settings/api) |
| Still having issues? | Run auto-installer again or restart your computer |

## 📚 Documentation

- **[Installation Guide](INSTALLATION.md)** - Complete setup instructions
- **[Usage Examples](examples/usage-examples.md)** - How to use the tools
- **[Contributing Guide](CONTRIBUTING.md)** - Development instructions

## 🆕 Latest Updates

- **✅ Auto-installer scripts** for universal compatibility
- **✅ 74 tools** (up from 9 in basic version)
- **✅ Universal path detection** works on any system
- **✅ Full Claude Desktop and Cursor support**
- **✅ Robust error handling** and crash protection

## 🔒 Security

- Keep your Smartling API credentials secure
- Don't commit credentials to version control
- Use environment variables in production
- Regularly rotate your API keys

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Jacobolevy/smartling-mcp-server/issues)
- **Documentation**: See `INSTALLATION.md` for detailed setup
- **API Reference**: [Smartling API Documentation](https://developers.smartling.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
