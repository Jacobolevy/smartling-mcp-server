/**
 * Example MCP Client for Internal Platforms
 * Shows how to connect to the remote Smartling MCP server
 */

import WebSocket from 'ws';

class SmartlingMCPClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to MCP server: ${this.serverUrl}`);
      
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.on('open', () => {
        console.log('✅ Connected to MCP server');
        this.setupMessageHandler();
        resolve();
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 Disconnected from MCP server');
      });
    });
  }

  setupMessageHandler() {
    this.ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        
        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          this.pendingRequests.delete(response.id);

          if (response.error) {
            reject(new Error(response.error.message || 'MCP Error'));
          } else {
            resolve(response.result);
          }
        }
      } catch (error) {
        console.error('❌ Failed to parse message:', error);
      }
    });
  }

  async sendRequest(method, params = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to MCP server');
    }

    const requestId = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: method,
      params: params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);

      this.ws.send(JSON.stringify(request));
    });
  }

  // MCP Protocol methods
  async listTools() {
    return this.sendRequest('tools/list');
  }

  async callTool(toolName, toolArgs = {}) {
    return this.sendRequest('tools/call', {
      name: toolName,
      arguments: toolArgs
    });
  }

  // Smartling-specific methods
  async getSmartlingProjects(accountId = 'b0f6a896') {
    const result = await this.callTool('smartling_get_projects', { accountId });
    return result;
  }

  async getAccountInfo() {
    const result = await this.callTool('smartling_get_account_info');
    return result;
  }

  async uploadFile(projectId, fileUri, fileType, content) {
    const result = await this.callTool('smartling_upload_file', {
      projectId,
      fileUri,
      fileType,
      content
    });
    return result;
  }

  async getFileStatus(projectId, fileUri) {
    const result = await this.callTool('smartling_get_file_status', {
      projectId,
      fileUri
    });
    return result;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Example usage
async function demonstrateMCPClient() {
  // Replace with your deployed MCP server URL
  const serverUrl = 'wss://smartling-mcp-remote.onrender.com/mcp';
  
  const client = new SmartlingMCPClient(serverUrl);

  try {
    // Connect to the server
    await client.connect();

    // List available tools
    console.log('📋 Listing available tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name));

    // Get account information
    console.log('\n🏢 Getting account information...');
    const accountInfo = await client.getAccountInfo();
    console.log('Account:', JSON.stringify(accountInfo, null, 2));

    // Get Smartling projects (limited to first 10)
    console.log('\n📊 Getting Smartling projects...');
    const projects = await client.getSmartlingProjects();
    console.log(`Total projects: ${projects.totalCount}`);
    console.log('First 3 projects:', projects.items.slice(0, 3).map(p => ({
      id: p.projectId,
      name: p.projectName
    })));

    // Example file upload (commented out to avoid actual upload)
    /*
    console.log('\n📤 Uploading sample file...');
    const uploadResult = await client.uploadFile(
      'your-project-id',
      'sample.json',
      'json',
      '{"hello": "world", "welcome": "to Smartling"}'
    );
    console.log('Upload result:', uploadResult);
    */

    console.log('\n✅ MCP client demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.disconnect();
  }
}

// Integration example for internal platforms
class InternalPlatformIntegration {
  constructor(mcpServerUrl) {
    this.client = new SmartlingMCPClient(mcpServerUrl);
  }

  async initialize() {
    await this.client.connect();
    console.log('🎯 Internal platform connected to Smartling MCP server');
  }

  // Method that your internal platform would call
  async translateContent(content, sourceLanguage = 'en', targetLanguages = ['es', 'fr']) {
    try {
      // Get first available project
      const projects = await this.client.getSmartlingProjects();
      const project = projects.items[0];

      if (!project) {
        throw new Error('No Smartling projects available');
      }

      // Upload content for translation
      const fileUri = `internal-platform-${Date.now()}.json`;
      const uploadResult = await this.client.uploadFile(
        project.projectId,
        fileUri,
        'json',
        JSON.stringify(content)
      );

      return {
        success: true,
        projectId: project.projectId,
        fileUri: fileUri,
        uploadResult: uploadResult,
        message: `Content uploaded to Smartling project: ${project.projectName}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check translation status
  async checkTranslationStatus(projectId, fileUri) {
    try {
      const status = await this.client.getFileStatus(projectId, fileUri);
      return {
        success: true,
        status: status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in internal platforms
export { SmartlingMCPClient, InternalPlatformIntegration };

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateMCPClient().catch(console.error);
} 