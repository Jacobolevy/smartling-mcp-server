/**
 * Smartling Chat Direct - NO HTTP, NO PROXY ISSUES
 * Direct integration for internal chat without HTTP server
 */

import https from 'https';

class SmartlingChatDirect {
  constructor(options = {}) {
    this.backendUrl = options.backendUrl || 'smartling-mcp.onrender.com';
    this.userAgent = options.userAgent || 'SmartlingChatDirect/1.0';
    this.timeout = options.timeout || 30000;
  }

  /**
   * Make direct call to Smartling without local HTTP server
   */
  async callSmartling(toolName, args = {}) {
    return new Promise((resolve, reject) => {
      // Set default account ID if needed
      if (toolName === 'smartling_get_projects' && !args.accountId) {
        args.accountId = 'b0f6a896';
      }

      const postData = JSON.stringify(args);
      
      const options = {
        hostname: this.backendUrl,
        port: 443,
        path: `/execute/${toolName}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': this.userAgent
        },
        timeout: this.timeout
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              resolve({
                success: true,
                data: result.result,
                tool: toolName,
                timestamp: new Date().toISOString()
              });
            } else {
              reject(new Error(result.error || 'Unknown Smartling API error'));
            }
          } catch (error) {
            reject(new Error(`Failed to parse Smartling response: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(new Error(`Smartling request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Smartling request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Get Wix account information
   */
  async getAccountInfo() {
    try {
      const result = await this.callSmartling('smartling_get_account_info');
      return result.data;
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  /**
   * Get project list (227 available)
   */
  async getProjects(accountId = 'b0f6a896') {
    try {
      const result = await this.callSmartling('smartling_get_projects', { accountId });
      return result.data;
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  /**
   * Upload file for translation
   */
  async uploadFile(projectId, fileUri, fileType, content) {
    try {
      const result = await this.callSmartling('smartling_upload_file', {
        projectId,
        fileUri,
        fileType,
        content
      });
      return result.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Get translation status
   */
  async getFileStatus(projectId, fileUri) {
    try {
      const result = await this.callSmartling('smartling_get_file_status', {
        projectId,
        fileUri
      });
      return result.data;
    } catch (error) {
      console.error('Error getting file status:', error);
      throw error;
    }
  }

  /**
   * Translate chat message (convenience function)
   */
  async translateChatMessage(message, options = {}) {
    const {
      projectId = '77259ac0d', // Default project
      language = 'es',
      user = 'ChatUser'
    } = options;

    const fileUri = `chat-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
    const content = JSON.stringify({
      message: message,
      user: user,
      timestamp: new Date().toISOString(),
      language_target: language
    });

    try {
      const uploadResult = await this.uploadFile(projectId, fileUri, 'json', content);
      
      // Wait a moment and check status
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResult = await this.getFileStatus(projectId, fileUri);
      
      return {
        upload: uploadResult,
        status: statusResult,
        fileUri: fileUri,
        originalMessage: message
      };
    } catch (error) {
      console.error('Error translating chat message:', error);
      throw error;
    }
  }
}

// ✅ CONVENIENCE FUNCTIONS FOR YOUR CHAT
export class SmartlingChat {
  constructor() {
    this.client = new SmartlingChatDirect();
  }

  /**
   * Initialize and verify connection
   */
  async initialize() {
    try {
      const accountInfo = await this.client.getAccountInfo();
      console.log(`✅ Smartling connected: ${accountInfo.accounts[0].accountName}`);
      return true;
    } catch (error) {
      console.error('❌ Error connecting to Smartling:', error.message);
      return false;
    }
  }

  /**
   * Get available projects
   */
  async getAvailableProjects() {
    const projects = await this.client.getProjects();
    return {
      total: projects.totalCount,
      projects: projects.data || []
    };
  }

  /**
   * Translate text from your chat
   */
  async translate(message, targetLanguage = 'es', user = 'ChatUser') {
    return await this.client.translateChatMessage(message, {
      language: targetLanguage,
      user: user
    });
  }

  /**
   * Get status of all pending translations
   */
  async getPendingTranslations() {
    // This function would need to be implemented based on your specific needs
    console.log('📋 Checking pending translations...');
    return [];
  }
}

// Export for direct use
export { SmartlingChatDirect };

// For CommonJS usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SmartlingChat, SmartlingChatDirect };
} 