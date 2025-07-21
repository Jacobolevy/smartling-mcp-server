#!/usr/bin/env node

/**
 * 🌟 Smartling MCP Server - JSON-RPC Implementation
 * Proper MCP server for Claude, Cursor & other MCP clients
 */

const readline = require('readline');

// === SMARTLING CLIENT (Embedded) ===
class SmartlingClient {
  constructor({ userIdentifier, userSecret, baseUrl = 'https://api.smartling.com' }) {
    this.userIdentifier = userIdentifier;
    this.userSecret = userSecret;
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const authUrl = `${this.baseUrl}/auth-api/v2/authenticate`;
    const authData = {
      userIdentifier: this.userIdentifier,
      userSecret: this.userSecret
    };

    try {
      const response = await this.makeHttpRequest(authUrl, 'POST', authData);
      this.accessToken = response.response.data.accessToken;
      this.tokenExpiry = new Date(Date.now() + response.response.data.expiresIn * 1000);
      return this.accessToken;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async makeHttpRequest(url, method = 'GET', data = null) {
    const https = require('https');
    const { URL } = require('url');
    
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Smartling-MCP-Server/3.0.0'
      }
    };

    if (this.accessToken) {
      options.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const postData = data ? JSON.stringify(data) : null;
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
            }
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    await this.authenticate();
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.makeHttpRequest(url, method, data);
    return response;
  }

  // === SEARCH METHODS ===
  async searchStrings(projectId, searchText, options = {}) {
    const params = new URLSearchParams();
    params.append('q', searchText);
    if (options.localeId && options.localeId !== null) {
      params.append('localeId', options.localeId);
    }
    if (options.fileUris && options.fileUris !== null && Array.isArray(options.fileUris)) {
      options.fileUris.forEach(uri => params.append('fileUri', uri));
    }
    if (options.limit && options.limit !== null) {
      params.append('limit', options.limit.toString());
    }
    if (options.includeTimestamps === true) {
      params.append('includeTimestamps', 'true');
    }

    const response = await this.makeRequest(`/strings-api/v2/projects/${projectId}/strings/search?${params.toString()}`);
    return response.response.data;
  }

  async getStringDetails(projectId, hashcode, localeId) {
    const response = await this.makeRequest(`/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}`);
    return response.response.data;
  }

  async getRecentlyLocalized(projectId, localeId, options = {}) {
    const params = new URLSearchParams();
    params.append('localeId', localeId);
    params.append('orderBy', 'lastModified');
    params.append('orderDirection', 'desc');
    if (options.limit && options.limit !== null) {
      params.append('limit', options.limit.toString());
    }
    if (options.fileUris && options.fileUris !== null && Array.isArray(options.fileUris)) {
      options.fileUris.forEach(uri => params.append('fileUri', uri));
    }

    const response = await this.makeRequest(`/strings-api/v2/projects/${projectId}/strings?${params.toString()}`);
    return response.response.data;
  }

  // === OTHER METHODS (simplified for MCP) ===
  async getAccountInfo() {
    const response = await this.makeRequest('/accounts-api/v2/accounts');
    return response.response.data;
  }

  async getProjectDetails(projectId) {
    const response = await this.makeRequest(`/projects-api/v2/projects/${projectId}`);
    return response.response.data;
  }

  async listFiles(projectId) {
    const response = await this.makeRequest(`/files-api/v2/projects/${projectId}/files/list`);
    return response.response.data;
  }

  // === TAGGING METHODS ===
  async addTagToString(projectId, hashcode, localeId, tag) {
    const response = await this.makeRequest(
      `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags`,
      'POST',
      { tags: [tag] }
    );
    return response.response.data;
  }

  async getStringTags(projectId, hashcode, localeId) {
    const response = await this.makeRequest(
      `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags`
    );
    return response.response.data;
  }

  async removeTagFromString(projectId, hashcode, localeId, tag) {
    const response = await this.makeRequest(
      `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags`,
      'DELETE',
      { tags: [tag] }
    );
    return response.response.data;
  }
}

// === MCP SERVER IMPLEMENTATION ===
class SmartlingMCPServer {
  constructor() {
    this.client = null;
    this.setupClient();
  }

  setupClient() {
    const userIdentifier = process.env.SMARTLING_USER_IDENTIFIER;
    const userSecret = process.env.SMARTLING_USER_SECRET;
    const baseUrl = process.env.SMARTLING_BASE_URL || 'https://api.smartling.com';

    if (!userIdentifier || !userSecret) {
      this.sendError('Missing required environment variables: SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET');
      return;
    }

    this.client = new SmartlingClient({ userIdentifier, userSecret, baseUrl });
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    console.log(JSON.stringify(response));
  }

  sendError(message, id = null) {
    const error = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -1,
        message
      }
    };
    console.log(JSON.stringify(error));
  }

  async handleInitialize(id, params) {
    this.sendResponse(id, {
      protocolVersion: '2025-06-18',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'smartling-mcp-server',
        version: '3.0.0'
      }
    });
  }

  async handleListTools(id) {
    const tools = [
      {
        name: 'smartling_search_strings',
        description: 'Search for strings by content across files and get metadata including timestamps',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { 
              type: 'string', 
              description: 'The project ID' 
            },
            searchText: { 
              type: 'string', 
              description: 'Text to search for in strings' 
            },
            localeId: { 
              type: 'string', 
              description: 'Optional: specific locale to search in' 
            },
            fileUris: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Optional: limit search to specific files' 
            },
            includeTimestamps: { 
              type: 'boolean', 
              description: 'Include creation/modification timestamps' 
            },
            limit: { 
              type: 'number', 
              description: 'Maximum number of results' 
            }
          },
          required: ['projectId', 'searchText']
        }
      },
      {
        name: 'smartling_get_string_details',
        description: 'Get detailed information about a specific string including timestamps and translation history',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { 
              type: 'string', 
              description: 'The project ID' 
            },
            hashcode: { 
              type: 'string', 
              description: 'The string hashcode identifier' 
            },
            localeId: { 
              type: 'string', 
              description: 'The locale ID' 
            }
          },
          required: ['projectId', 'hashcode', 'localeId']
        }
      },
      {
        name: 'smartling_get_recently_localized',
        description: 'Get recently localized strings sorted by modification date',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { 
              type: 'string', 
              description: 'The project ID' 
            },
            localeId: { 
              type: 'string', 
              description: 'The locale ID' 
            },
            limit: { 
              type: 'number', 
              description: 'Number of recent results to return' 
            },
            fileUris: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Optional: limit to specific files' 
            }
          },
          required: ['projectId', 'localeId']
        }
      },
      {
        name: 'smartling_get_account_info',
        description: 'Get account information and available accounts',
        inputSchema: { 
          type: 'object', 
          properties: {},
          required: [] 
        }
      },
      {
        name: 'smartling_get_project_details',
        description: 'Get details of a specific project',
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
      },
      {
        name: 'smartling_list_files',
        description: 'List all files in a project',
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
      },
      {
        name: 'smartling_add_tag_to_string',
        description: 'Add a tag to a translation string',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { 
              type: 'string', 
              description: 'The project ID' 
            },
            hashcode: { 
              type: 'string', 
              description: 'The string hashcode identifier' 
            },
            localeId: { 
              type: 'string', 
              description: 'The locale ID' 
            },
            tag: { 
              type: 'string', 
              description: 'The tag to add' 
            }
          },
          required: ['projectId', 'hashcode', 'localeId', 'tag']
        }
      },
      {
        name: 'smartling_get_string_tags',
        description: 'Get all tags for a translation string',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { 
              type: 'string', 
              description: 'The project ID' 
            },
            hashcode: { 
              type: 'string', 
              description: 'The string hashcode identifier' 
            },
            localeId: { 
              type: 'string', 
              description: 'The locale ID' 
            }
          },
          required: ['projectId', 'hashcode', 'localeId']
        }
      },
      {
        name: 'smartling_remove_tag_from_string',
        description: 'Remove a tag from a translation string',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { 
              type: 'string', 
              description: 'The project ID' 
            },
            hashcode: { 
              type: 'string', 
              description: 'The string hashcode identifier' 
            },
            localeId: { 
              type: 'string', 
              description: 'The locale ID' 
            },
            tag: { 
              type: 'string', 
              description: 'The tag to remove' 
            }
          },
          required: ['projectId', 'hashcode', 'localeId', 'tag']
        }
      }
    ];

    this.sendResponse(id, { tools });
  }

  async handleCallTool(id, params) {
    const { name, arguments: args } = params;

    if (!this.client) {
      this.sendError('Smartling client not configured. Check environment variables.', id);
      return;
    }

    try {
      let result;
      
      switch (name) {
        case 'smartling_search_strings':
          result = await this.client.searchStrings(
            args.projectId,
            args.searchText,
            {
              localeId: args.localeId || null,
              fileUris: args.fileUris || null,
              includeTimestamps: args.includeTimestamps !== undefined ? args.includeTimestamps : true,
              limit: args.limit || 50
            }
          );
          break;

        case 'smartling_get_string_details':
          result = await this.client.getStringDetails(
            args.projectId,
            args.hashcode,
            args.localeId
          );
          break;

        case 'smartling_get_recently_localized':
          result = await this.client.getRecentlyLocalized(
            args.projectId,
            args.localeId,
            {
              limit: args.limit || 20,
              fileUris: args.fileUris || null
            }
          );
          break;

        case 'smartling_get_account_info':
          result = await this.client.getAccountInfo();
          break;

        case 'smartling_get_project_details':
          result = await this.client.getProjectDetails(args.projectId);
          break;

        case 'smartling_list_files':
          result = await this.client.listFiles(args.projectId);
          break;

        case 'smartling_add_tag_to_string':
          result = await this.client.addTagToString(
            args.projectId,
            args.hashcode,
            args.localeId,
            args.tag
          );
          break;

        case 'smartling_get_string_tags':
          result = await this.client.getStringTags(
            args.projectId,
            args.hashcode,
            args.localeId
          );
          break;

        case 'smartling_remove_tag_from_string':
          result = await this.client.removeTagFromString(
            args.projectId,
            args.hashcode,
            args.localeId,
            args.tag
          );
          break;

        default:
          this.sendError(`Unknown tool: ${name}`, id);
          return;
      }

      this.sendResponse(id, {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      });

    } catch (error) {
      this.sendError(`Tool execution failed: ${error.message}`, id);
    }
  }

  async handleMessage(message) {
    try {
      const { jsonrpc, id, method, params } = JSON.parse(message);

      if (jsonrpc !== '2.0') {
        this.sendError('Invalid JSON-RPC version', id);
        return;
      }

      switch (method) {
        case 'initialize':
          await this.handleInitialize(id, params);
          break;
        case 'tools/list':
          await this.handleListTools(id);
          break;
        case 'tools/call':
          await this.handleCallTool(id, params);
          break;
        default:
          this.sendError(`Unknown method: ${method}`, id);
      }
    } catch (error) {
      this.sendError(`Invalid JSON-RPC message: ${error.message}`);
    }
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        this.handleMessage(line.trim());
      }
    });

    // Don't output anything to stdout except JSON-RPC responses
    process.stderr.write('Smartling MCP Server started\n');
  }
}

// Start the server
const server = new SmartlingMCPServer();
server.start(); 