/**
 * 🚀 SMARTLING DIRECT FOR YOUR CHAT - NO HTTP SERVER
 * ✅ Completely avoids proxy errors
 */

// For Node.js environments (backend)
const https = require('https');

class SmartlingChatDirect {
  async callSmartling(toolName, args = {}) {
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
          'Content-Length': Buffer.byteLength(postData)
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

  async getProjects() {
    return await this.callSmartling('smartling_get_projects');
  }

  async translateMessage(message, user = 'ChatUser') {
    const fileUri = `chat-${Date.now()}.json`;
    const content = JSON.stringify({ message, user, timestamp: new Date().toISOString() });
    
    return await this.callSmartling('smartling_upload_file', {
      projectId: '77259ac0d',
      fileUri: fileUri,
      fileType: 'json',
      content: content
    });
  }
}

// ✅ TO USE IN YOUR CHAT:
const smartling = new SmartlingChatDirect();

// Usage example:
async function handleChatCommand(message, user) {
  if (message.startsWith('/translate ')) {
    const text = message.replace('/translate ', '');
    try {
      const result = await smartling.translateMessage(text, user);
      console.log(`✅ Sent to Smartling: ${text}`);
      return `✅ Message sent for translation`;
    } catch (error) {
      console.error('❌ Error:', error.message);
      return `❌ Error: ${error.message}`;
    }
  }
}

// Verify connection on initialization
async function initSmartling() {
  try {
    const account = await smartling.getAccountInfo();
    console.log(`✅ Connected to Smartling: ${account.accounts[0].accountName}`);
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

module.exports = { SmartlingChatDirect, handleChatCommand, initSmartling }; 