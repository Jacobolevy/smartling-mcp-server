# ⚡ Quick Installation - Smartling MCP Server

Get up and running with the Smartling MCP Server in **under 2 minutes** with **all 74 tools**.

## 🚀 Quick Local Install

```bash
# Download and setup
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server
chmod +x setup.sh
./setup.sh
```

## 🔑 Get Your Smartling Credentials

1. Go to [Smartling Dashboard](https://dashboard.smartling.com) → **Account Settings** → **API**
2. Copy your **User Identifier** and **User Secret**
3. Edit `.env` file with your credentials

## ⚙️ Quick Setup

### For Claude Desktop:
```bash
# Add to: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/full/path/to/smartling-mcp-server-main/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier",
        "SMARTLING_USER_SECRET": "your_user_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

### For Cursor:
```bash
# Add to: ~/.cursor/mcp.json
{
  "mcpServers": {
    "Smartling": {
      "command": "node",
      "args": ["/full/path/to/smartling-mcp-server-main/bin/mcp-simple.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier",
        "SMARTLING_USER_SECRET": "your_user_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

## ✅ Verify Installation

```bash
# Test the server
npm test

# Count tools (should show 74)
npm run count-tools
```

## 🛠️ What You Get

**74 Smartling tools** including:
- String search, tagging, and management
- File operations (upload/download)
- Job and workflow management  
- Quality assurance checks
- Glossary management
- Webhook integration
- Reports and analytics
- People and vendor management

## 📚 Full Documentation

For detailed setup instructions, see `INSTALLATION.md` 