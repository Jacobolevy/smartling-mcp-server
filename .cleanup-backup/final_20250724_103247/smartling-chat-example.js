/**
 * USAGE EXAMPLE: Smartling in your Internal Chat
 * ✅ NO HTTP SERVER - NO PROXY ISSUES
 */

// ============================================
// OPTION 1: For Node.js / Backend
// ============================================

import { SmartlingChat } from './smartling-chat-direct.js';

async function initializeSmartlingInChat() {
  console.log('🚀 Initializing Smartling in your chat...');
  
  const smartling = new SmartlingChat();
  
  // Verify connection
  const connected = await smartling.initialize();
  if (!connected) {
    console.error('❌ Could not connect to Smartling');
    return null;
  }

  // View available projects
  const projects = await smartling.getAvailableProjects();
  console.log(`📊 Available projects: ${projects.total}`);

  return smartling;
}

// Function to translate chat messages
async function translateChatMessage(smartling, message, user = 'ChatUser') {
  try {
    console.log(`💬 Translating message from ${user}: "${message}"`);
    
    const result = await smartling.translate(message, 'es', user);
    
    console.log('✅ Message sent to Smartling for translation');
    console.log(`📄 File: ${result.fileUri}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error translating message:', error.message);
    return null;
  }
}

// ============================================
// USAGE EXAMPLE IN YOUR CHAT
// ============================================

async function main() {
  // Initialize Smartling
  const smartling = await initializeSmartlingInChat();
  if (!smartling) return;

  // Simulate chat messages that need translation
  const chatMessages = [
    { user: 'Jacob', message: 'Hello team, how are you today?' },
    { user: 'Maria', message: 'Can we schedule a meeting for tomorrow?' },
    { user: 'John', message: 'The project is almost ready for launch' }
  ];

  // Translate each message
  for (const { user, message } of chatMessages) {
    await translateChatMessage(smartling, message, user);
    
    // Wait a bit between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ All messages sent to Smartling');
}

// ============================================
// OPTION 2: For browser/frontend (without import)
// ============================================

// Browser version (copy into your web chat)
const SmartlingChatBrowser = {
  async callSmartling(toolName, args = {}) {
    if (toolName === 'smartling_get_projects' && !args.accountId) {
      args.accountId = 'b0f6a896';
    }

    const response = await fetch(`https://smartling-mcp.onrender.com/execute/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartlingChatDirect/1.0'
      },
      body: JSON.stringify(args)
    });

    const result = await response.json();
    if (result.success) {
      return result.result;
    } else {
      throw new Error(result.error || 'Unknown Smartling API error');
    }
  },

  async translate(message, user = 'ChatUser') {
    const fileUri = `chat-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
    const content = JSON.stringify({
      message: message,
      user: user,
      timestamp: new Date().toISOString()
    });

    const result = await this.callSmartling('smartling_upload_file', {
      projectId: '77259ac0d',
      fileUri: fileUri,
      fileType: 'json',
      content: content
    });

    return { result, fileUri, originalMessage: message };
  },

  async getProjects() {
    return await this.callSmartling('smartling_get_projects');
  }
};

// ============================================
// OPTION 3: Direct integration in your chat
// ============================================

// Function you can copy directly into your chat
async function addSmartlingToYourChat() {
  // Detect if user wants to translate a message
  function onChatMessage(message, user) {
    // If message contains "/translate"
    if (message.startsWith('/translate ')) {
      const textToTranslate = message.replace('/translate ', '');
      translateMessageInChat(textToTranslate, user);
    }
  }

  async function translateMessageInChat(text, user) {
    try {
      console.log(`🔄 Translating: "${text}"`);
      
      // Direct call to Smartling
      const result = await SmartlingChatBrowser.translate(text, user);
      
      // Show in chat that it's being translated
      showChatNotification(`✅ Message sent to Smartling for translation`);
      showChatNotification(`📄 ID: ${result.fileUri}`);
      
    } catch (error) {
      showChatNotification(`❌ Error: ${error.message}`);
    }
  }

  function showChatNotification(message) {
    // Replace with your notification display function
    console.log(`[Chat] ${message}`);
  }

  return { onChatMessage, translateMessageInChat };
}

// ============================================
// RUN EXAMPLE
// ============================================

// For Node.js:
if (typeof window === 'undefined') {
  main().catch(console.error);
}

// For browser:
if (typeof window !== 'undefined') {
  window.SmartlingChatBrowser = SmartlingChatBrowser;
  window.addSmartlingToYourChat = addSmartlingToYourChat;
  
  console.log('✅ Smartling Chat available globally');
  console.log('💡 Use: SmartlingChatBrowser.translate("message", "user")');
} 