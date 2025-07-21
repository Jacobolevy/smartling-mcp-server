# 🌟 Smartling MCP Server

A complete **Model Context Protocol (MCP)** server for **Smartling** translation services. Works seamlessly with **Claude Desktop**, **Cursor**, and other MCP-compatible clients.

## ✨ Features

- 🔧 **71 Translation Tools** - Complete Smartling API coverage
- 🤖 **MCP Compatible** - Works with Claude, Cursor, and other MCP clients  
- 🚀 **Easy Installation** - Simple setup script
- 🔒 **Secure** - Your credentials stay local
- 🌍 **No Dependencies** - Pure Node.js implementation
- ⚡ **Fast Setup** - Ready in under 2 minutes

## 📦 Installation

```bash
# Download the project
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server

# Quick setup
chmod +x setup.sh
./setup.sh
```

## 🚀 Quick Start

### 1. Get Your Smartling Credentials

1. Log in to [Smartling Dashboard](https://dashboard.smartling.com)
2. Go to **Account Settings** → **API**
3. Copy your **User Identifier** and **User Secret**

### 2. Set Environment Variables

```bash
# Required credentials
export SMARTLING_USER_IDENTIFIER="your_user_identifier_here"
export SMARTLING_USER_SECRET="your_user_secret_here"

# Optional: Custom API base URL (defaults to https://api.smartling.com)
export SMARTLING_BASE_URL="https://api.smartling.com"
```

### 3. Test Installation

```bash
# Test the installation
npm test

# Count available tools (should show 71)
npm run count-tools
```

### 4. Configure Your MCP Client

Add to your MCP client configuration:

#### For Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
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

#### For Cursor (`~/.cursor/mcp.json`):

```json
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

## 🛠 Available Tools

### 📁 Project Management
- `smartling_list_projects` - List all projects
- `smartling_get_project_details` - Get project information
- `smartling_create_project` - Create new project

### 📄 File Operations  
- `smartling_upload_file` - Upload source files
- `smartling_download_file` - Download translated files
- `smartling_list_files` - List project files
- `smartling_get_file_status` - Check file translation status
- `smartling_delete_file` - Remove files

### 💼 Job Management
- `smartling_create_job` - Create translation jobs
- `smartling_list_jobs` - List all jobs
- `smartling_get_job_details` - Get job information
- `smartling_update_job` - Modify existing jobs
- `smartling_cancel_job` - Cancel jobs

### 🏷 String Management
- `smartling_get_strings` - Retrieve translatable strings
- `smartling_update_string` - Modify string translations

### 🔖 Tagging
- `smartling_add_tags` - Tag strings and files
- `smartling_remove_tags` - Remove tags
- `smartling_list_tags` - List available tags

### ✅ Quality Assurance
- `smartling_run_quality_check` - Run QA checks
- `smartling_get_quality_report` - Get QA reports

### 📚 Glossary
- `smartling_create_glossary` - Create glossaries
- `smartling_list_glossaries` - List glossaries
- `smartling_update_glossary` - Modify glossaries

### 🔔 Webhooks
- `smartling_create_webhook` - Set up webhooks
- `smartling_list_webhooks` - List webhooks
- `smartling_delete_webhook` - Remove webhooks

## 🔧 CLI Options

```bash
smartling-mcp-server [options]

Options:
  --help, -h     Show help message
  --version, -v  Show version information  
  --config       Show configuration status
  --port PORT    Set custom port (default: 3000)
```

## 🌐 API Endpoints

When running, the server provides:

- `GET /health` - Health check endpoint
- `GET /tools` - List all available MCP tools
- `POST /execute/{tool_name}` - Execute specific tools

## 🔒 Security

- **Local execution** - Your credentials never leave your machine
- **HTTPS support** - Secure API communications
- **Environment variables** - Credentials stored securely
- **No data persistence** - No local data storage

## 🐛 Troubleshooting

### Check Configuration
```bash
smartling-mcp-server --config
```

### Common Issues

**Authentication Error:**
```bash
# Verify your credentials are set
echo $SMARTLING_USER_IDENTIFIER
echo $SMARTLING_USER_SECRET
```

**Port Already in Use:**
```bash
# Use a different port
smartling-mcp-server --port 8080
```

**Permission Denied:**
```bash
# Install with proper permissions
sudo npm install -g smartling-mcp-server
```

## 📖 Examples

### Using with Claude Desktop

Once configured, you can ask Claude:

> "List all my Smartling projects"

> "Upload this file to project ABC123 for translation"

> "Check the status of job XYZ"

### Using with Cursor

Configure the MCP server in Cursor to get translation assistance directly in your editor.

## 🔗 Links

- **GitHub Repository**: https://github.com/Jacobolevy/smartling-mcp-server
- **Issues & Support**: https://github.com/Jacobolevy/smartling-mcp-server/issues
- **Smartling API Docs**: https://help.smartling.com/hc/en-us/articles/360008030994
- **MCP Specification**: https://modelcontextprotocol.io/

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

**Made with ❤️ for the translation community**
