# Contributing to Smartling MCP Server

Thank you for your interest in contributing to the Smartling MCP Server! This project provides comprehensive Smartling API integration for Claude Desktop, Cursor, and other MCP clients.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Smartling account with API credentials
- Basic knowledge of JavaScript and JSON-RPC

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jacobolevy/smartling-mcp-server.git
   cd smartling-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run setup
   # Edit .env with your Smartling credentials
   ```

4. **Test the setup**
   ```bash
   npm test
   npm run test:connection
   ```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run test` - Run all tests
- `npm run test:mcp` - Test MCP protocol
- `npm run test:tools` - Test diagnostic tool
- `npm run test:connection` - Test Smartling connection
- `npm run count-tools` - Count available tools
- `npm run list-tools` - List first 20 tools

### Project Structure

```
smartling-mcp-server/
├── bin/
│   └── mcp-simple.js      # Main MCP server (53 tools)
├── src/
│   ├── index.js           # HTTP server (legacy)
│   └── smartling-client.ts # TypeScript client
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
└── package.json          # Project configuration
```

### Adding New Tools

1. **Add method to SmartlingClient class** in `bin/mcp-simple.js`:
   ```javascript
   async newToolMethod(projectId, params) {
     const response = await this.makeRequest(
       `/api-endpoint/${projectId}/resource`,
       'POST',
       params
     );
     return response.response.data;
   }
   ```

2. **Add tool definition** in `handleListTools()`:
   ```javascript
   {
     name: 'smartling_new_tool',
     description: 'Description of what the tool does',
     inputSchema: {
       type: 'object',
       properties: {
         projectId: {
           type: 'string',
           description: 'The project ID'
         }
       },
       required: ['projectId']
     }
   }
   ```

3. **Add handler** in `handleCallTool()`:
   ```javascript
   case 'smartling_new_tool':
     if (!args.projectId) {
       throw new Error('projectId is required');
     }
     result = await this.client.newToolMethod(args.projectId, args);
     break;
   ```

### Testing

Always test new tools:

```bash
# Test tool listing
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node bin/mcp-simple.js

# Test specific tool
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "your_tool", "arguments": {"projectId": "test"}}}' | node bin/mcp-simple.js
```

## 📋 Pull Request Guidelines

### Before Submitting

1. **Test thoroughly**
   ```bash
   npm test
   npm run test:connection
   ```

2. **Update documentation**
   - Update README.md if adding new features
   - Add examples to usage documentation
   - Update tool count in package.json description

3. **Follow naming conventions**
   - Tools: `smartling_verb_noun` (e.g., `smartling_create_job`)
   - Methods: `camelCase` (e.g., `createJob`)
   - Variables: `camelCase`

### PR Template

```markdown
## Changes Made
- [ ] Added new tool: `tool_name`
- [ ] Fixed bug in: `component`
- [ ] Updated documentation
- [ ] Added tests

## Testing
- [ ] All existing tests pass
- [ ] New functionality tested
- [ ] MCP protocol compliance verified

## Tool Count
- Previous: X tools
- New: Y tools
```

## 🐛 Bug Reports

When reporting bugs, include:

1. **Environment**
   - Node.js version
   - Operating system
   - MCP client (Claude/Cursor)

2. **Steps to reproduce**
   - Exact commands used
   - Expected vs actual behavior
   - Error messages

3. **Logs**
   - MCP server debug output
   - Client error messages

## 💡 Feature Requests

When requesting features:

1. **Use case** - Why is this needed?
2. **API endpoint** - Which Smartling API should be used?
3. **Expected behavior** - How should it work?
4. **Priority** - How important is this feature?

## 📚 Resources

- [Smartling API Documentation](https://developers.smartling.com/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://claude.ai/docs/mcp)

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub releases
- Package.json contributors field

Thank you for helping make this the most complete Smartling MCP server available! 🎉 
