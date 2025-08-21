# Smartling MCP Server

A Model Context Protocol (MCP) server that provides Smartling translation tools for Claude Desktop, Cursor, and other MCP-compatible applications.

## 🚀 Quick Installation

### Prerequisites
- Node.js 18.0.0 or higher
- Smartling API credentials (User Identifier and User Secret)

### Installation Steps
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/smartling-mcp-server.git
cd smartling-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Setup environment variables
cp config-example.env .env
# Edit .env with your Smartling credentials
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

## 🛠️ Available Tools

### Core Features
- **Project Management**: Access and manage translation projects
- **File Operations**: Upload, download, and manage translation files
- **Job Management**: Create and manage translation jobs
- **String Operations**: Search, filter, and manage translation strings
- **Quality Assurance**: Run quality checks on translations
- **Locales**: Manage project locales and supported languages
- **Glossaries**: Manage translation glossaries and terms
- **Context**: Upload and manage visual context for translators
- **Webhooks**: Set up notifications for translation events
- **Reports**: Generate progress and analytics reports

### New synthetic status and endpoints

- Synthetic translation status: `AWAITING_AUTHORIZATION` computed by backend. Available via advanced MCP search and HTTP endpoint.
- Robust file source retrieval: URI encoding by segments, pagination with retries.
- Project-wide aggregated search when no `fileUri` is provided with limited concurrency.
- Batching for string translations.

HTTP endpoint:

`GET /projects/:projectId/awaiting-authorization?locales=es-ES,fr-FR&files=wix-premium/messages/file1.properties`

Example response:

```
{
  "totalAwaiting": 123,
  "breakdown": {
    "wix-premium/messages/file1.properties": 45,
    "wix-premium/messages/file2.properties": 78
  },
  "meta": {
    "projectId": "demo-project-1",
    "locales": ["es-ES", "fr-FR"],
    "filesCount": 2,
    "generatedAt": "2025-01-01T00:00:00Z"
  }
}
```

Env flags:
- `SMARTLING_CONCURRENCY` (default 5)
- `SMARTLING_BATCH_SIZE` (default 300)

### Chat Integration
For internal chat platforms, see:
- **[Internal Platform Client](docs/internal-platform-client.js)** - Node.js backend integration
- **[Streaming Client Example](docs/streaming-client-example.js)** - WebSocket integration
- **[Usage Examples](docs/usage-examples.md)** - Additional integration examples

## 📋 Configuration Example

**Claude Desktop config:**
```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/path/to/smartling-mcp-server/dist/index.js"],
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
# Run basic tests
npm test

# Test MCP protocol
npm run test:mcp
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "0 tools enabled" | Check configuration file paths |
| "Connection timeout" | Verify API credentials and network access |
| "Could not attach to MCP server" | Ensure Node.js 18+ is installed |

## 📚 Documentation

- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Development guide
- **[Usage Examples](docs/usage-examples.md)** - Integration examples
- **[API Documentation](https://developers.smartling.com/)** - Smartling API reference

## 🌟 Key Features

### For Organizations
- **Enterprise Ready**: Production-tested translation workflows
- **Secure**: API credential management
- **Reliable**: Comprehensive error handling
- **Easy Integration**: Works with existing MCP tools

### For Developers
- **Direct API Access**: Full Smartling API integration
- **Chat Integration**: Ready for internal platforms
- **Extensible**: Add more tools easily
- **Well Documented**: Complete guides and examples

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Jacobolevy/smartling-mcp-server/issues)
- **API Documentation**: [Smartling Developers](https://developers.smartling.com/)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.