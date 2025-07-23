/**
 * 🚀 SMARTLING DIRECT FOR YOUR CHAT - NO HTTP SERVER
 * ✅ Completely avoids proxy errors
 */

// For Node.js environments (backend)
const https = require('https');

class SmartlingChatDirect {
  constructor() {
    // Tool definitions with proper metadata
    this.toolDefinitions = [
      {
        name: 'smartling_get_account_info',
        description: 'Get Smartling account information and available accounts',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'smartling_get_projects',
        description: 'Get list of Smartling projects (227 projects from Wix account)',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: {
              type: 'string',
              description: 'Account ID (optional, uses default b0f6a896)'
            },
            limit: {
              type: 'number',
              description: 'Number of projects to return (default: 50)',
              default: 50
            }
          },
          required: []
        }
      },
      {
        name: 'smartling_upload_file',
        description: 'Upload file to Smartling for translation',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID from Smartling (e.g., 77259ac0d for Wix project)'
            },
            fileUri: {
              type: 'string',
              description: 'Unique file URI identifier (e.g., chat-message-123.json)'
            },
            fileType: {
              type: 'string',
              description: 'File type format',
              enum: ['json', 'xml', 'properties', 'csv', 'txt', 'html'],
              default: 'json'
            },
            content: {
              type: 'string',
              description: 'File content to translate (JSON string for chat messages)'
            },
            authorize: {
              type: 'boolean',
              description: 'Whether to authorize content for translation immediately',
              default: true
            }
          },
          required: ['projectId', 'fileUri', 'fileType', 'content']
        }
      },
      {
        name: 'smartling_get_file_status',
        description: 'Get translation status and progress of a file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID from Smartling'
            },
            fileUri: {
              type: 'string',
              description: 'File URI identifier to check status'
            }
          },
          required: ['projectId', 'fileUri']
        }
      }
    ];
  }

  /**
   * Get available tools with metadata
   */
  getAvailableTools() {
    return {
      tools: this.toolDefinitions,
      total: this.toolDefinitions.length,
      description: 'Direct Smartling integration tools for chat platforms',
      capabilities: [
        'Account information retrieval',
        'Project listing (227 Wix projects available)',
        'File upload for translation',
        'Translation status checking'
      ]
    };
  }

  /**
   * Validate tool arguments against schema
   */
  validateToolArgs(toolName, args) {
    const tool = this.toolDefinitions.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const schema = tool.inputSchema;
    const errors = [];

    // Check required fields
    for (const required of schema.required || []) {
      if (!(required in args)) {
        errors.push(`Missing required field: ${required}`);
      }
    }

    // Validate types
    for (const [key, value] of Object.entries(args)) {
      const prop = schema.properties[key];
      if (prop) {
        if (prop.type === 'string' && typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        }
        if (prop.type === 'number' && typeof value !== 'number') {
          errors.push(`${key} must be a number`);
        }
        if (prop.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        }
        if (prop.enum && !prop.enum.includes(value)) {
          errors.push(`${key} must be one of: ${prop.enum.join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  async callSmartling(toolName, args = {}) {
    // Validate arguments
    this.validateToolArgs(toolName, args);

    return new Promise((resolve, reject) => {
      if (toolName === 'smartling_get_projects' && !args.accountId) {
        args.accountId = 'b0f6a896';
      }

      const postData = JSON.stringify(args);
      
      const options = {
        hostname: 'smartling-mcp.onrender.com',
        port: 443,
        path: `/execute/${toolName}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'SmartlingChatDirect/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.success ? result.result : result);
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', error => reject(error));
      req.write(postData);
      req.end();
    });
  }

  // ✅ MAIN FUNCTIONS FOR YOUR CHAT:

  async getAccountInfo() {
    return await this.callSmartling('smartling_get_account_info');
  }

  async getProjects(accountId = 'b0f6a896', limit = 50) {
    return await this.callSmartling('smartling_get_projects', { accountId, limit });
  }

  async translateMessage(message, user = 'ChatUser', options = {}) {
    const {
      projectId = '77259ac0d', // Default Wix project
      fileType = 'json',
      authorize = true
    } = options;

    const fileUri = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileType}`;
    const content = JSON.stringify({ 
      message, 
      user, 
      timestamp: new Date().toISOString(),
      source: 'internal-chat'
    });
    
    return await this.callSmartling('smartling_upload_file', {
      projectId,
      fileUri,
      fileType,
      content,
      authorize
    });
  }

  async getFileStatus(projectId, fileUri) {
    return await this.callSmartling('smartling_get_file_status', { projectId, fileUri });
  }
}

// ✅ TO USE IN YOUR CHAT:
const smartling = new SmartlingChatDirect();

// Enhanced usage example with proper error handling:
async function handleChatCommand(message, user) {
  if (message.startsWith('/translate ')) {
    const text = message.replace('/translate ', '');
    try {
      const result = await smartling.translateMessage(text, user);
      console.log(`✅ Sent to Smartling: ${text}`);
      console.log(`📄 File URI: ${result.overWritten ? 'Updated' : 'Created'}`);
      return `✅ Message sent for translation (File: ${result.stringCount} strings)`;
    } catch (error) {
      console.error('❌ Error:', error.message);
      return `❌ Error: ${error.message}`;
    }
  }

  if (message === '/smartling tools') {
    const tools = smartling.getAvailableTools();
    return `🛠️ Available tools: ${tools.tools.map(t => t.name).join(', ')}`;
  }

  if (message === '/smartling projects') {
    try {
      const projects = await smartling.getProjects();
      return `📊 Found ${projects.totalCount} projects. Recent: ${projects.data.slice(0, 3).map(p => p.projectName).join(', ')}`;
    } catch (error) {
      return `❌ Error getting projects: ${error.message}`;
    }
  }
}

// Verify connection on initialization with detailed logging
async function initSmartling() {
  try {
    console.log('🔍 Initializing Smartling connection...');
    
    const account = await smartling.getAccountInfo();
    console.log(`✅ Connected to Smartling: ${account.accounts[0].accountName}`);
    
    const projects = await smartling.getProjects('b0f6a896', 5);
    console.log(`📊 Access to ${projects.totalCount} projects`);
    
    const tools = smartling.getAvailableTools();
    console.log(`🛠️ Available tools: ${tools.total}`);
    
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

module.exports = { 
  SmartlingChatDirect, 
  handleChatCommand, 
  initSmartling 
}; 