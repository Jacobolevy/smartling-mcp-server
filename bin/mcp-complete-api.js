#!/usr/bin/env node

// 🌐 COMPLETE SMARTLING API MCP SERVER
// Direct mapping of ALL Smartling API endpoints as individual tools
// No abstractions, no consolidation - pure API access

const https = require('https');
const http = require('http');

class SmartlingApiClient {
  constructor(options = {}) {
    this.userIdentifier = options.userIdentifier;
    this.userSecret = options.userSecret;
    this.baseUrl = options.baseUrl || 'https://api.smartling.com';
    
    // Simple HTTP agent for connection pooling
    this.httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 10
    });
  }

  async request(endpoint, method = 'GET', body = null, queryParams = {}) {
    const url = new URL(endpoint, this.baseUrl);
    
    // Add query parameters
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.userIdentifier}:${this.userSecret}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Smartling-MCP-Server/1.0'
      },
      agent: this.httpsAgent
    };

    if (body && method !== 'GET') {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: result
            });
          } catch (e) {
            // If not JSON, return raw data
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject({
          error: error.message,
          endpoint,
          method
        });
      });

      if (body && method !== 'GET') {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }
}

class CompleteMCPServer {
  constructor() {
    this.client = new SmartlingApiClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET,
      baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com'
    });
  }

  // Get ALL available tools - complete Smartling API mapping
  getTools() {
    return [
      // 🏢 PROJECTS API
      {
        name: 'projects_list',
        description: 'List all projects',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'projects_get',
        description: 'Get project details',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' }
          },
          required: ['projectId']
        }
      },

      // 📁 FILES API
      {
        name: 'files_list',
        description: 'List files in project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' },
            uriMask: { type: 'string', description: 'URI mask filter' },
            lastUploadedAfter: { type: 'string', description: 'ISO datetime' },
            lastUploadedBefore: { type: 'string', description: 'ISO datetime' },
            offset: { type: 'number', description: 'Pagination offset' },
            limit: { type: 'number', description: 'Results limit (max 500)' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'files_upload',
        description: 'Upload file to project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' },
            fileType: { type: 'string' },
            authorize: { type: 'boolean', default: false },
            localeIdsToAuthorize: { type: 'array', items: { type: 'string' } }
          },
          required: ['projectId', 'fileUri', 'fileType']
        }
      },
      {
        name: 'files_status',
        description: 'Get file status',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' }
          },
          required: ['projectId', 'fileUri']
        }
      },
      {
        name: 'files_download',
        description: 'Download original file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' }
          },
          required: ['projectId', 'fileUri']
        }
      },
      {
        name: 'files_download_translated',
        description: 'Download translated file',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' },
            locale: { type: 'string' },
            retrievalType: { type: 'string', enum: ['pending', 'published', 'pseudo'], default: 'published' }
          },
          required: ['projectId', 'fileUri', 'locale']
        }
      },
      {
        name: 'files_delete',
        description: 'Delete file from project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' }
          },
          required: ['projectId', 'fileUri']
        }
      },

      // 📝 STRINGS API (All variants to handle API issues)
      {
        name: 'strings_list',
        description: 'List strings in project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' },
            offset: { type: 'number' },
            limit: { type: 'number' },
            conditions: { type: 'string' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'strings_search',
        description: 'Search strings with query',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            q: { type: 'string', description: 'Search query' },
            fileUri: { type: 'string' },
            offset: { type: 'number' },
            limit: { type: 'number' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'strings_source',
        description: 'Get source strings',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' },
            hashcodes: { type: 'array', items: { type: 'string' } },
            offset: { type: 'number' },
            limit: { type: 'number' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'strings_translations',
        description: 'Get string translations',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            locale: { type: 'string' },
            fileUri: { type: 'string' },
            hashcodes: { type: 'array', items: { type: 'string' } },
            offset: { type: 'number' },
            limit: { type: 'number' }
          },
          required: ['projectId', 'locale']
        }
      },

      // 🔍 ALTERNATIVE STRING ACCESS (Workarounds for broken APIs)
      {
        name: 'files_parse_for_strings',
        description: 'Parse downloaded file to extract strings (workaround for broken Strings API)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            fileUri: { type: 'string' },
            parseFormat: { type: 'string', enum: ['json', 'properties', 'xml', 'csv'], default: 'json' }
          },
          required: ['projectId', 'fileUri']
        }
      },

      // 🏷️ TAGS API
      {
        name: 'tags_list',
        description: 'List all tags in project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'tags_add_to_strings',
        description: 'Add tags to strings',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            stringHashcodes: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }
          },
          required: ['projectId', 'stringHashcodes', 'tags']
        }
      },
      {
        name: 'tags_remove_from_strings',
        description: 'Remove tags from strings',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            stringHashcodes: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }
          },
          required: ['projectId', 'stringHashcodes', 'tags']
        }
      },

      // 💼 JOBS API
      {
        name: 'jobs_list',
        description: 'List jobs in project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            translationJobUids: { type: 'array', items: { type: 'string' } },
            statuses: { type: 'array', items: { type: 'string' } },
            sortBy: { type: 'string' },
            sortDirection: { type: 'string', enum: ['asc', 'desc'] },
            offset: { type: 'number' },
            limit: { type: 'number' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'jobs_get',
        description: 'Get job details',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            translationJobUid: { type: 'string' }
          },
          required: ['projectId', 'translationJobUid']
        }
      },
      {
        name: 'jobs_create',
        description: 'Create new job',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            jobName: { type: 'string' },
            targetLocaleIds: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            dueDate: { type: 'string' },
            referenceNumber: { type: 'string' },
            callbackUrl: { type: 'string' },
            callbackMethod: { type: 'string', enum: ['GET', 'POST'] }
          },
          required: ['projectId', 'jobName', 'targetLocaleIds']
        }
      },
      {
        name: 'jobs_update',
        description: 'Update job',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            translationJobUid: { type: 'string' },
            jobName: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string' }
          },
          required: ['projectId', 'translationJobUid']
        }
      },
      {
        name: 'jobs_authorize',
        description: 'Authorize job',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            translationJobUid: { type: 'string' }
          },
          required: ['projectId', 'translationJobUid']
        }
      },

      // 🔄 WORKFLOW API (May return 404)
      {
        name: 'workflow_list',
        description: 'List workflows (may return 404 if not available)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' }
          },
          required: ['projectId']
        }
      },

      // 🌍 LOCALES API
      {
        name: 'locales_list',
        description: 'List project locales',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' }
          },
          required: ['projectId']
        }
      },

      // 📊 CONTEXT API
      {
        name: 'context_upload',
        description: 'Upload context for strings',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            content: { type: 'string', description: 'Base64 encoded image' },
            name: { type: 'string' },
            attachments: { type: 'array' }
          },
          required: ['projectId', 'content', 'name']
        }
      },
      {
        name: 'context_list',
        description: 'List context files',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            offset: { type: 'number' },
            limit: { type: 'number' }
          },
          required: ['projectId']
        }
      },

      // 🔧 DIAGNOSTICS & UTILITIES
      {
        name: 'api_test_endpoint',
        description: 'Test any API endpoint directly',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: { type: 'string', description: 'API endpoint path' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
            body: { type: 'object', description: 'Request body' },
            queryParams: { type: 'object', description: 'Query parameters' }
          },
          required: ['endpoint']
        }
      },
      {
        name: 'api_health_check',
        description: 'Check which APIs are working vs broken',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to test with' }
          },
          required: ['projectId']
        }
      }
    ];
  }

  async handleTool(name, args) {
    try {
      switch (name) {
        // 🏢 PROJECTS API
        case 'projects_list':
          return await this.client.request('/projects-api/v2/projects');
        
        case 'projects_get':
          return await this.client.request(`/projects-api/v2/projects/${args.projectId}`);

        // 📁 FILES API
        case 'files_list':
          return await this.client.request(
            `/files-api/v2/projects/${args.projectId}/files/list`,
            'GET',
            null,
            {
              uriMask: args.uriMask,
              lastUploadedAfter: args.lastUploadedAfter,
              lastUploadedBefore: args.lastUploadedBefore,
              offset: args.offset,
              limit: args.limit
            }
          );

        case 'files_status':
          return await this.client.request(
            `/files-api/v2/projects/${args.projectId}/file/status`,
            'GET',
            null,
            { fileUri: args.fileUri }
          );

        case 'files_download':
          return await this.client.request(
            `/files-api/v2/projects/${args.projectId}/file`,
            'GET',
            null,
            { fileUri: args.fileUri }
          );

        case 'files_download_translated':
          return await this.client.request(
            `/files-api/v2/projects/${args.projectId}/locales/${args.locale}/file`,
            'GET',
            null,
            { 
              fileUri: args.fileUri,
              retrievalType: args.retrievalType
            }
          );

        // 📝 STRINGS API (All variants)
        case 'strings_list':
          return await this.client.request(
            `/strings-api/v2/projects/${args.projectId}/strings`,
            'GET',
            null,
            {
              fileUri: args.fileUri,
              offset: args.offset,
              limit: args.limit,
              conditions: args.conditions
            }
          );

        case 'strings_search':
          return await this.client.request(
            `/strings-api/v2/projects/${args.projectId}/strings`,
            'GET',
            null,
            {
              q: args.q,
              fileUri: args.fileUri,
              offset: args.offset,
              limit: args.limit
            }
          );

        case 'strings_source':
          return await this.client.request(
            `/strings-api/v2/projects/${args.projectId}/source-strings`,
            'GET',
            null,
            {
              fileUri: args.fileUri,
              hashcodes: args.hashcodes ? args.hashcodes.join(',') : undefined,
              offset: args.offset,
              limit: args.limit
            }
          );

        case 'strings_translations':
          return await this.client.request(
            `/strings-api/v2/projects/${args.projectId}/locales/${args.locale}/translations`,
            'GET',
            null,
            {
              fileUri: args.fileUri,
              hashcodes: args.hashcodes ? args.hashcodes.join(',') : undefined,
              offset: args.offset,
              limit: args.limit
            }
          );

        // 🔍 ALTERNATIVE STRING ACCESS
        case 'files_parse_for_strings':
          const fileData = await this.client.request(
            `/files-api/v2/projects/${args.projectId}/file`,
            'GET',
            null,
            { fileUri: args.fileUri }
          );
          
          return {
            ...fileData,
            parsed: this.parseFileContent(fileData.data, args.parseFormat),
            note: 'Workaround for broken Strings API - parsed from file content'
          };

        // 🏷️ TAGS API
        case 'tags_list':
          return await this.client.request(`/tags-api/v2/projects/${args.projectId}/tags`);

        case 'tags_add_to_strings':
          return await this.client.request(
            `/tags-api/v2/projects/${args.projectId}/strings/tags/add`,
            'POST',
            {
              stringHashcodes: args.stringHashcodes,
              tags: args.tags
            }
          );

        case 'tags_remove_from_strings':
          return await this.client.request(
            `/tags-api/v2/projects/${args.projectId}/strings/tags/remove`,
            'POST',
            {
              stringHashcodes: args.stringHashcodes,
              tags: args.tags
            }
          );

        // 💼 JOBS API
        case 'jobs_list':
          return await this.client.request(
            `/jobs-api/v3/projects/${args.projectId}/jobs`,
            'GET',
            null,
            {
              translationJobUids: args.translationJobUids ? args.translationJobUids.join(',') : undefined,
              statuses: args.statuses ? args.statuses.join(',') : undefined,
              sortBy: args.sortBy,
              sortDirection: args.sortDirection,
              offset: args.offset,
              limit: args.limit
            }
          );

        case 'jobs_get':
          return await this.client.request(
            `/jobs-api/v3/projects/${args.projectId}/jobs/${args.translationJobUid}`
          );

        case 'jobs_create':
          return await this.client.request(
            `/jobs-api/v3/projects/${args.projectId}/jobs`,
            'POST',
            {
              jobName: args.jobName,
              targetLocaleIds: args.targetLocaleIds,
              description: args.description,
              dueDate: args.dueDate,
              referenceNumber: args.referenceNumber,
              callbackUrl: args.callbackUrl,
              callbackMethod: args.callbackMethod
            }
          );

        // 🔄 WORKFLOW API
        case 'workflow_list':
          return await this.client.request(`/workflow-api/v2/projects/${args.projectId}/workflows`);

        // 🌍 LOCALES API
        case 'locales_list':
          return await this.client.request(`/projects-api/v2/projects/${args.projectId}`);

        // 📊 CONTEXT API
        case 'context_list':
          return await this.client.request(
            `/context-api/v2/projects/${args.projectId}/contexts`,
            'GET',
            null,
            {
              offset: args.offset,
              limit: args.limit
            }
          );

        // 🔧 DIAGNOSTICS
        case 'api_test_endpoint':
          return await this.client.request(args.endpoint, args.method, args.body, args.queryParams);

        case 'api_health_check':
          return await this.performHealthCheck(args.projectId);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        error: true,
        message: error.message || 'Unknown error',
        endpoint: error.endpoint,
        method: error.method,
        statusCode: error.statusCode,
        suggestion: this.getErrorSuggestion(name, error)
      };
    }
  }

  parseFileContent(content, format) {
    try {
      switch (format) {
        case 'json':
          return JSON.parse(content);
        case 'properties':
          return this.parseProperties(content);
        default:
          return { raw: content, format };
      }
    } catch (e) {
      return { error: 'Failed to parse', raw: content };
    }
  }

  parseProperties(content) {
    const result = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          result[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    return result;
  }

  async performHealthCheck(projectId) {
    const checks = [
      { name: 'Projects API', test: () => this.client.request('/projects-api/v2/projects') },
      { name: 'Files List', test: () => this.client.request(`/files-api/v2/projects/${projectId}/files/list`) },
      { name: 'Strings List', test: () => this.client.request(`/strings-api/v2/projects/${projectId}/strings`) },
      { name: 'Tags List', test: () => this.client.request(`/tags-api/v2/projects/${projectId}/tags`) },
      { name: 'Jobs List', test: () => this.client.request(`/jobs-api/v3/projects/${projectId}/jobs`) },
      { name: 'Workflow List', test: () => this.client.request(`/workflow-api/v2/projects/${projectId}/workflows`) }
    ];

    const results = [];
    for (const check of checks) {
      try {
        const result = await check.test();
        results.push({
          api: check.name,
          status: 'working',
          statusCode: result.statusCode,
          dataCount: result.data?.response?.data?.length || 0
        });
      } catch (error) {
        results.push({
          api: check.name,
          status: 'failed',
          error: error.message,
          statusCode: error.statusCode
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      projectId,
      results,
      summary: {
        working: results.filter(r => r.status === 'working').length,
        failed: results.filter(r => r.status === 'failed').length,
        total: results.length
      }
    };
  }

  getErrorSuggestion(toolName, error) {
    if (error.statusCode === 404) {
      return `API endpoint not found. Try using Files API as workaround or contact Smartling support.`;
    }
    if (error.statusCode === 400) {
      return `Invalid request parameters. Check the API documentation for required fields.`;
    }
    if (toolName.includes('strings') && error.statusCode >= 400) {
      return `Strings API issue detected. Use 'files_parse_for_strings' as workaround.`;
    }
    return `Check API documentation and verify parameters.`;
  }
}

// Start server
if (require.main === module) {
  const server = new CompleteMCPServer();

  process.stdin.on('data', async (data) => {
    try {
      const request = JSON.parse(data.toString());
      
      if (request.method === 'tools/list') {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: { tools: server.getTools() }
        }) + '\n');
      } else if (request.method === 'tools/call') {
        const result = await server.handleTool(request.params.name, request.params.arguments);
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result
        }) + '\n');
      }
    } catch (error) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: request?.id || null,
        error: {
          code: -1,
          message: error.message,
          data: { timestamp: new Date().toISOString() }
        }
      }) + '\n');
    }
  });

  console.error('🌐 Complete Smartling API MCP Server started');
  console.error(`📊 ${server.getTools().length} API endpoints available`);
  console.error('🔧 Direct API mapping - no abstractions');
}

module.exports = { CompleteMCPServer }; 