/**
 * 🌐 SMARTLING FOR WEB CHAT - NO PROXY ISSUES
 * ✅ For browsers / web chat frontend
 */

// Browser version (doesn't need Node.js)
class SmartlingWebChat {
  constructor() {
    this.baseUrl = 'https://smartling-mcp.onrender.com';
  }

  async callSmartling(toolName, args = {}) {
    if (toolName === 'smartling_get_projects' && !args.accountId) {
      args.accountId = 'b0f6a896';
    }

    try {
      const response = await fetch(`${this.baseUrl}/execute/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  async getProjects() {
    return await this.callSmartling('smartling_get_projects');
  }

  async translateMessage(message, user = 'ChatUser') {
    const fileUri = `webchat-${Date.now()}.json`;
    const content = JSON.stringify({ 
      message, 
      user, 
      timestamp: new Date().toISOString(),
      source: 'web-chat'
    });
    
    return await this.callSmartling('smartling_upload_file', {
      projectId: '77259ac0d',
      fileUri: fileUri,
      fileType: 'json',
      content: content
    });
  }
}

// ✅ DIRECT INTEGRATION IN YOUR WEB CHAT:

// Global instance
const smartlingChat = new SmartlingWebChat();

// Function to handle chat commands
async function handleWebChatCommand(message, user) {
  if (message.startsWith('/translate ')) {
    const text = message.replace('/translate ', '');
    
    try {
      showChatMessage('🔄 Sending to Smartling...', 'system');
      
      const result = await smartlingChat.translateMessage(text, user);
      
      showChatMessage(`✅ Sent for translation: "${text}"`, 'system');
      return true;
    } catch (error) {
      showChatMessage(`❌ Error: ${error.message}`, 'system');
      return false;
    }
  }
  
  if (message === '/smartling status') {
    try {
      const account = await smartlingChat.getAccountInfo();
      const projects = await smartlingChat.getProjects();
      
      showChatMessage(`✅ Connected to: ${account.accounts[0].accountName}`, 'system');
      showChatMessage(`📊 Available projects: ${projects.totalCount}`, 'system');
      return true;
    } catch (error) {
      showChatMessage(`❌ Error checking status: ${error.message}`, 'system');
      return false;
    }
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
    
    showChatMessage('💡 Available commands:', 'system');
    showChatMessage('  /translate [message] - Send for translation', 'system');
    showChatMessage('  /smartling status - View status', 'system');
    
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