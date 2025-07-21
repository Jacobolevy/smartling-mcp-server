# 🚀 Smartling MCP Server Installation

This guide will help you set up the Smartling MCP server on your computer for use with Cursor, Claude Desktop, or other MCP-compatible applications.

## 📋 Prerequisites

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (included with Node.js)
- **Smartling account** with API credentials

## 📦 Quick Installation

### 1. Download and extract the project
```bash
# If you have the ZIP file
unzip smartling-mcp-server.zip
cd smartling-mcp-server

# Or if you have access to the Git repository
git clone https://github.com/Jacobolevy/smartling-mcp-server.git
cd smartling-mcp-server
```

### 2. Run automatic installation
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configure Smartling credentials

The installer will create a `.env` file. Edit it with your Smartling credentials:

```bash
# Edit the .env file
nano .env

# Add your credentials:
SMARTLING_USER_IDENTIFIER=your_user_identifier_here
SMARTLING_USER_SECRET=your_user_secret_here
SMARTLING_BASE_URL=https://api.smartling.com
```

## 🔑 Getting Smartling Credentials

1. **Log in to Smartling Dashboard**
   - Go to: https://dashboard.smartling.com
   - Sign in with your account

2. **Navigate to API Settings**
   - Click on your profile (top right)
   - Select **"Account Settings"**
   - Go to **"API"** tab

3. **Get Your Credentials**
   - **User Identifier**: Copy this value
   - **User Secret**: Copy this value (keep it secure!)

## 🎯 Configuration for Different Clients

### For Claude Desktop

1. **Open Claude Desktop configuration file**:
   ```bash
   # macOS
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   %APPDATA%\Claude\claude_desktop_config.json
   
   # Linux
   ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add MCP server configuration**:
   ```json
   {
     "mcpServers": {
       "smartling": {
         "command": "node",
         "args": ["/full/path/to/smartling-mcp-server-main/bin/mcp-simple.js"],
         "env": {
           "SMARTLING_USER_IDENTIFIER": "your_user_identifier_here",
           "SMARTLING_USER_SECRET": "your_user_secret_here",
           "SMARTLING_BASE_URL": "https://api.smartling.com"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### For Cursor

1. **Open Cursor MCP configuration**:
   ```bash
   # macOS
   open ~/.cursor/mcp.json
   
   # Windows
   %USERPROFILE%\.cursor\mcp.json
   
   # Linux
   ~/.cursor/mcp.json
   ```

2. **Add MCP server configuration**:
   ```json
   {
     "mcpServers": {
       "Smartling": {
         "command": "node",
         "args": ["/full/path/to/smartling-mcp-server-main/bin/mcp-simple.js"],
         "env": {
           "SMARTLING_USER_IDENTIFIER": "your_user_identifier_here",
           "SMARTLING_USER_SECRET": "your_user_secret_here",
           "SMARTLING_BASE_URL": "https://api.smartling.com"
         }
       }
     }
   }
   ```

3. **Restart Cursor**

## ✅ Testing the Installation

1. **Test MCP server directly**:
   ```bash
   cd smartling-mcp-server
   npm test
   ```

2. **Test API connection**:
   ```bash
   npm run test:connection
   ```

3. **Count available tools**:
   ```bash
   npm run count-tools
   # Should show: 74
   ```

## 🛠️ Available Tools (74 total)

The server provides complete Smartling API coverage with these tool categories:

- **📊 Core (5 tools)**: Account info, projects, files, locales
- **🔍 String Management (26 tools)**: Search, tags, analysis, context
- **💼 Jobs & Workflows (8 tools)**: Create, manage, authorize jobs
- **📁 File Operations (6 tools)**: Upload, download, delete, status
- **✅ Quality Assurance (4 tools)**: Run QA checks, get reports
- **📚 Glossary (4 tools)**: Manage glossaries and terms
- **🔔 Webhooks (3 tools)**: Create, list, delete webhooks
- **📊 Reports & Analytics (5 tools)**: Generate reports, estimates
- **👥 People & Vendors (6 tools)**: Manage users and vendors
- **🔧 Advanced Operations (4 tools)**: Batch operations, diagnostics

## 🐛 Troubleshooting

### Problem: "Command not found"
**Solution**: Make sure Node.js is installed and in your PATH
```bash
node --version
npm --version
```

### Problem: "Permission denied"
**Solution**: Make the script executable
```bash
chmod +x setup.sh
chmod +x bin/mcp-simple.js
```

### Problem: "Authentication failed"
**Solution**: Check your Smartling credentials
1. Verify User Identifier and User Secret are correct
2. Make sure there are no extra spaces in the .env file
3. Test with the diagnostic tool:
   ```bash
   npm run test:connection
   ```

### Problem: "Tools not loading in Claude/Cursor"
**Solution**: Check configuration paths
1. Ensure the path to `bin/mcp-simple.js` is absolute
2. Restart the client application
3. Check for conflicting MCP configurations

### Problem: "Port 3000 already in use"
**Solution**: The MCP server doesn't need a port for Claude/Cursor
- MCP uses stdin/stdout communication
- Only HTTP server mode needs a port (not recommended for MCP)

## 📚 Next Steps

1. **Read the documentation**: Check out `CONTRIBUTING.md` for development guide
2. **Explore examples**: Look in the `examples/` folder for usage examples
3. **Join the community**: Report issues on GitHub
4. **Stay updated**: Watch the repository for new features

## 🔒 Security Notes

- **Never commit your `.env` file** to version control
- **Keep your API secrets secure** and don't share them
- **Use environment variables** in production environments
- **Regularly rotate your API credentials** for better security

## 📞 Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/Jacobolevy/smartling-mcp-server/issues)
- **Documentation**: Check `README.md` and `CONTRIBUTING.md`
- **Examples**: Look at `examples/usage-examples.md` 