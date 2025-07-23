/**
 * 🌐 SMARTLING FOR WEB CHAT - NO PROXY ISSUES
 * ✅ For browsers / web chat frontend
 */

// Browser version (doesn't need Node.js)
class SmartlingWebChat {
  constructor() {
    this.baseUrl = 'https://smartling-mcp.onrender.com';
    
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
              description: 'Unique file URI identifier (e.g., webchat-message-123.json)'
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
      description: 'Direct Smartling integration tools for web chat platforms',
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

    if (toolName === 'smartling_get_projects' && !args.accountId) {
      args.accountId = 'b0f6a896';
    }

    try {
      const response = await fetch(`${this.baseUrl}/execute/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SmartlingWebChat/1.0'
        },
        body: JSON.stringify(args)
      });

      const result = await response.json();
      return result.success ? result.result : result;
    } catch (error) {
      throw new Error(`Smartling API error: ${error.message}`);
    }
  }

  // ✅ FUNCTIONS FOR YOUR WEB CHAT:

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

    const fileUri = `webchat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileType}`;
    const content = JSON.stringify({ 
      message, 
      user, 
      timestamp: new Date().toISOString(),
      source: 'web-chat'
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

// ✅ DIRECT INTEGRATION IN YOUR WEB CHAT:

// Global instance
const smartlingChat = new SmartlingWebChat();

// Function to handle chat commands with enhanced features
async function handleWebChatCommand(message, user) {
  if (message.startsWith('/translate ')) {
    const text = message.replace('/translate ', '');
    
    try {
      showChatMessage('🔄 Sending to Smartling...', 'system');
      
      const result = await smartlingChat.translateMessage(text, user);
      
      showChatMessage(`✅ Sent for translation: "${text}"`, 'system');
      showChatMessage(`📄 File URI: ${result.overWritten ? 'Updated' : 'Created'}`, 'system');
      showChatMessage(`📊 Strings: ${result.stringCount}`, 'system');
      return true;
    } catch (error) {
      showChatMessage(`❌ Error: ${error.message}`, 'system');
      return false;
    }
  }
  
  if (message === '/smartling status') {
    try {
      const account = await smartlingChat.getAccountInfo();
      const projects = await smartlingChat.getProjects('b0f6a896', 5);
      
      showChatMessage(`✅ Connected to: ${account.accounts[0].accountName}`, 'system');
      showChatMessage(`📊 Available projects: ${projects.totalCount}`, 'system');
      showChatMessage(`🔧 Recent projects: ${projects.data.slice(0, 3).map(p => p.projectName).join(', ')}`, 'system');
      return true;
    } catch (error) {
      showChatMessage(`❌ Error checking status: ${error.message}`, 'system');
      return false;
    }
  }

  if (message === '/smartling tools') {
    const tools = smartlingChat.getAvailableTools();
    showChatMessage(`🛠️ Available tools: ${tools.total}`, 'system');
    tools.tools.forEach(tool => {
      showChatMessage(`  • ${tool.name}: ${tool.description}`, 'system');
    });
    return true;
  }

  if (message === '/smartling help') {
    showChatMessage('💡 Available Smartling commands:', 'system');
    showChatMessage('  /translate [message] - Send message for translation', 'system');
    showChatMessage('  /smartling status - View connection status', 'system');
    showChatMessage('  /smartling tools - List available tools', 'system');
    showChatMessage('  /smartling help - Show this help', 'system');
    return true;
  }
}

// Helper function to show messages in chat
function showChatMessage(message, type = 'user') {
  // 🎯 REPLACE THIS FUNCTION WITH YOUR CHAT SYSTEM
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Example of how it might look in your chat:
  /*
  const chatContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;
  messageDiv.textContent = message;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  */
}

// ✅ AUTOMATIC INITIALIZATION
async function initWebSmartling() {
  try {
    showChatMessage('🚀 Initializing Smartling...', 'system');
    
    const account = await smartlingChat.getAccountInfo();
    showChatMessage(`✅ Connected to Smartling: ${account.accounts[0].accountName}`, 'system');
    
    const projects = await smartlingChat.getProjects('b0f6a896', 5);
    showChatMessage(`📊 Access to ${projects.totalCount} projects`, 'system');
    
    const tools = smartlingChat.getAvailableTools();
    showChatMessage(`🛠️ Available tools: ${tools.total}`, 'system');
    
    showChatMessage('💡 Available commands:', 'system');
    showChatMessage('  /translate [message] - Send for translation', 'system');
    showChatMessage('  /smartling status - View status', 'system');
    showChatMessage('  /smartling help - Show all commands', 'system');
    
    return true;
  } catch (error) {
    showChatMessage(`❌ Error connecting to Smartling: ${error.message}`, 'system');
    return false;
  }
}

// ✅ COMPLETE INTEGRATION EXAMPLE
function integrateSmartlingToYourWebChat() {
  // 1. Intercept message sending
  const originalSendMessage = window.sendChatMessage || function() {};
  
  window.sendChatMessage = async function(message, user) {
    // Check if it's a Smartling command
    if (message.startsWith('/')) {
      const handled = await handleWebChatCommand(message, user);
      if (handled) return; // Don't send command as normal message
    }
    
    // Send normal message
    originalSendMessage(message, user);
  };

  // 2. Initialize Smartling
  initWebSmartling();
  
  // 3. Add to global object for direct access
  window.smartlingChat = smartlingChat;
  window.translateMessage = (msg, user) => smartlingChat.translateMessage(msg, user);
  
  // 4. Add debug methods
  window.smartlingDebug = {
    getTools: () => smartlingChat.getAvailableTools(),
    testConnection: () => initWebSmartling(),
    validateArgs: (tool, args) => smartlingChat.validateToolArgs(tool, args)
  };
}

// 🚀 AUTO-EXECUTE IF WE'RE IN BROWSER
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrateSmartlingToYourWebChat);
  } else {
    integrateSmartlingToYourWebChat();
  }
}

// Export for modular use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SmartlingWebChat, handleWebChatCommand, initWebSmartling, integrateSmartlingToYourWebChat };
} 