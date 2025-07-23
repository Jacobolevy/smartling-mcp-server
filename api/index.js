// ✨ COMPLETE Smartling MCP Server - ALL 27+ TOOLS - Render Compatible ✨
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Helper functions for cross-platform responses (Express + Native HTTP)
const sendJSON = (res, status, data) => {
  if (typeof res.status === 'function') {
    // Express.js style
    res.status(status).json(data);
  } else {
    // Native Node.js HTTP style
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }
};

const sendText = (res, status, text = '') => {
  if (typeof res.status === 'function') {
    // Express.js style
    res.status(status).end(text);
  } else {
    // Native Node.js HTTP style
    res.writeHead(status, { 'Content-Type': 'text/plain' });
    res.end(text);
  }
};

// Simple HTTP client (no external dependencies)
class SimpleHTTPClient {
  async request(options, data = null) {
    return new Promise((resolve, reject) => {
      const module = options.protocol === 'https:' ? https : http;
      
      const req = module.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = {
              status: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null
            };
            resolve(result);
          } catch (error) {
            resolve({ status: res.statusCode, headers: res.headers, data: body });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }
      
      req.end();
    });
  }
}

// Smartling Client
class SmartlingClient {
  constructor(config) {
    this.config = config;
    this.client = new SimpleHTTPClient();
    this.accessToken = null;
    this.tokenExpiry = 0;
    this.accountUid = null;
  }

  async authenticate() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const url = new URL('/auth-api/v2/authenticate', this.config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      protocol: url.protocol,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const authData = {
      userIdentifier: this.config.userIdentifier,
      userSecret: this.config.userSecret
    };

    try {
      const response = await this.client.request(options, authData);
      
      if (response.status === 200 && response.data && response.data.response && response.data.response.data) {
        this.accessToken = response.data.response.data.accessToken;
        this.tokenExpiry = Date.now() + (response.data.response.data.expiresIn * 1000);
        
        // Get account UID after authentication
        await this.getAccountUid();
        
        return this.accessToken;
      } else {
        throw new Error(`Authentication failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  async getAccountUid() {
    if (this.accountUid) return this.accountUid;

    const url = new URL('/accounts-api/v2/accounts', this.config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      protocol: url.protocol,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await this.client.request(options);
      if (response.status === 200 && response.data && response.data.response && response.data.response.data) {
        const accounts = response.data.response.data.accounts;
        if (accounts && accounts.length > 0) {
          this.accountUid = accounts[0].accountUid; // Use first account
          return this.accountUid;
        }
      }
      throw new Error('Could not get account UID');
    } catch (error) {
      throw new Error(`Error getting account UID: ${error.message}`);
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null, params = {}) {
    const token = await this.authenticate();
    
    // Replace {accountUid} in endpoint if present
    let finalEndpoint = endpoint;
    if (endpoint.includes('{accountUid}') && this.accountUid) {
      finalEndpoint = endpoint.replace('{accountUid}', this.accountUid);
    }
    
    const url = new URL(finalEndpoint, this.config.baseUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    // Fix per ChatGPT: Don't include Content-Type for GET requests
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Only add Content-Type for requests with data (POST, PUT, etc.)
    if (data !== null) {
      headers['Content-Type'] = 'application/json';
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      protocol: url.protocol,
      headers: headers
    };

    return await this.client.request(options, data);
  }
}

// ALL 27+ Smartling Tools Implementation
const SmartlingTools = {
  // === DIAGNOSTIC TOOLS ===
  async smartling_diagnostic(args, client) {
    const results = [];
    
    try {
      await client.authenticate();
      results.push('✅ Authentication: SUCCESS');
      results.push(`🏢 Account UID: ${client.accountUid}`);
    } catch (error) {
      results.push(`❌ Authentication: FAILED - ${error.message}`);
    }

    try {
      const accountResponse = await client.makeRequest('/accounts-api/v2/accounts');
      const accounts = accountResponse.data?.response?.data?.accounts || [];
      results.push(`✅ Accounts API: SUCCESS (${accounts.length} accounts)`);
      accounts.forEach(account => {
        results.push(`   • ${account.accountName} (${account.accountUid})`);
      });
    } catch (error) {
      results.push(`❌ Accounts API: FAILED - ${error.message}`);
    }

    return {
      content: [{
        type: "text",
        text: `🔍 **Smartling API Diagnostic:**\n\n${results.join('\n')}`
      }]
    };
  },

  // === ACCOUNT TOOLS ===
  async smartling_get_account_info(args, client) {
    const response = await client.makeRequest('/accounts-api/v2/accounts');
    const accounts = response.data?.response?.data?.accounts || [];
    
    return {
      content: [{
        type: "text",
        text: `🏢 **Account Information:**\n\n` +
              `Total Accounts: ${accounts.length}\n\n` +
              accounts.map(acc => 
                `• **${acc.accountName}** (UID: ${acc.accountUid})`
              ).join('\n') + '\n\n' +
              `Raw Response:\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === PROJECT TOOLS ===
  async smartling_get_project_details(args, client) {
    const { projectId } = args;
    if (!projectId) throw new Error('projectId is required');
    
    const response = await client.makeRequest(`/projects-api/v2/projects/${projectId}`);
    return {
      content: [{
        type: "text", 
        text: `📁 **Project Details:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_create_project(args, client) {
    const { projectName, sourceLocaleId = 'en', targetLocaleIds = [] } = args;
    if (!projectName) throw new Error('projectName is required');

    const projectData = {
      projectName,
      sourceLocaleId,
      targetLocaleIds
    };

    const response = await client.makeRequest('/projects-api/v2/projects', 'POST', projectData);
    return {
      content: [{
        type: "text",
        text: `🆕 **Project Created:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === FILE TOOLS ===
  async smartling_upload_file(args, client) {
    const { projectId, file, fileUri, fileType = 'auto' } = args;
    if (!projectId || !fileUri) throw new Error('projectId and fileUri are required');

    const endpoint = `/files-api/v2/projects/${projectId}/file`;
    const uploadData = {
      fileUri,
      fileType,
      file: file || 'Sample file content'
    };

    const response = await client.makeRequest(endpoint, 'POST', uploadData);
    return {
      content: [{
        type: "text",
        text: `📤 **File Upload Result:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_download_file(args, client) {
    const { projectId, fileUri, localeId } = args;
    if (!projectId || !fileUri || !localeId) throw new Error('projectId, fileUri, and localeId are required');

    const response = await client.makeRequest(`/files-api/v2/projects/${projectId}/locales/${localeId}/file`, 'GET', null, { fileUri });
    return {
      content: [{
        type: "text",
        text: `📥 **Downloaded File:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_get_file_status(args, client) {
    const { projectId, fileUri } = args;
    if (!projectId || !fileUri) throw new Error('projectId and fileUri are required');

    const response = await client.makeRequest(`/files-api/v2/projects/${projectId}/file/status`, 'GET', null, { fileUri });
    return {
      content: [{
        type: "text",
        text: `📋 **File Status:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_list_files(args, client) {
    const { projectId } = args;
    if (!projectId) throw new Error('projectId is required');

    const response = await client.makeRequest(`/files-api/v2/projects/${projectId}/files/list`);
    const files = response.data?.response?.data?.fileList || [];
    
    return {
      content: [{
        type: "text",
        text: `📄 **Project Files (${files.length} files):**\n\n` +
              files.map(file => 
                `• **${file.fileUri}** (${file.fileType}) - ${file.lastUploaded}`
              ).join('\n') + '\n\n' +
              `Raw Response:\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_delete_file(args, client) {
    const { projectId, fileUri } = args;
    if (!projectId || !fileUri) throw new Error('projectId and fileUri are required');

    const response = await client.makeRequest(`/files-api/v2/projects/${projectId}/file/delete`, 'POST', { fileUri });
    return {
      content: [{
        type: "text",
        text: `🗑️ **File Deleted:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === JOB TOOLS ===
  async smartling_create_job(args, client) {
    const { projectId, jobName, description = '', targetLocaleIds = [] } = args;
    if (!projectId || !jobName) throw new Error('projectId and jobName are required');

    const jobData = {
      jobName,
      description,
      targetLocaleIds
    };

    const response = await client.makeRequest(`/jobs-api/v3/projects/${projectId}/jobs`, 'POST', jobData);
    return {
      content: [{
        type: "text",
        text: `⚡ **Job Created:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_get_job_details(args, client) {
    const { projectId, jobId } = args;
    if (!projectId || !jobId) throw new Error('projectId and jobId are required');

    const response = await client.makeRequest(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}`);
    return {
      content: [{
        type: "text",
        text: `📊 **Job Details:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_list_jobs(args, client) {
    const { projectId } = args;
    if (!projectId) throw new Error('projectId is required');

    const response = await client.makeRequest(`/jobs-api/v3/projects/${projectId}/jobs`);
    return {
      content: [{
        type: "text",
        text: `📋 **Project Jobs:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_authorize_job(args, client) {
    const { projectId, jobId } = args;
    if (!projectId || !jobId) throw new Error('projectId and jobId are required');

    const response = await client.makeRequest(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}/authorize`, 'POST');
    return {
      content: [{
        type: "text",
        text: `✅ **Job Authorized:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_close_job(args, client) {
    const { projectId, jobId } = args;
    if (!projectId || !jobId) throw new Error('projectId and jobId are required');

    const response = await client.makeRequest(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}/close`, 'POST');
    return {
      content: [{
        type: "text",
        text: `🔒 **Job Closed:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === TAGGING TOOLS ===
  async smartling_add_tag_to_string(args, client) {
    const { projectId, hashcode, localeId, tag } = args;
    if (!projectId || !hashcode || !localeId || !tag) {
      throw new Error('projectId, hashcode, localeId, and tag are required');
    }

    const response = await client.makeRequest(
      `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags`, 
      'POST', 
      { tags: [tag] }
    );
    return {
      content: [{
        type: "text",
        text: `🏷️ **Tag Added to String:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_get_string_tags(args, client) {
    const { projectId, hashcode, localeId } = args;
    if (!projectId || !hashcode || !localeId) {
      throw new Error('projectId, hashcode, and localeId are required');
    }

    const response = await client.makeRequest(`/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags`);
    return {
      content: [{
        type: "text",
        text: `🏷️ **String Tags:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_remove_tag_from_string(args, client) {
    const { projectId, hashcode, localeId, tag } = args;
    if (!projectId || !hashcode || !localeId || !tag) {
      throw new Error('projectId, hashcode, localeId, and tag are required');
    }

    const response = await client.makeRequest(
      `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}/tags/${tag}`, 
      'DELETE'
    );
    return {
      content: [{
        type: "text",
        text: `🗑️ **Tag Removed from String:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === QUALITY TOOLS ===
  async smartling_run_quality_check(args, client) {
    const { projectId, fileUri, localeId } = args;
    if (!projectId || !fileUri || !localeId) throw new Error('projectId, fileUri, and localeId are required');

    const response = await client.makeRequest(`/quality-checks-api/v3/projects/${projectId}/checks`, 'POST', {
      fileUri,
      localeId
    });
    return {
      content: [{
        type: "text",
        text: `🔍 **Quality Check Started:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_get_quality_check_report(args, client) {
    const { projectId, checkId } = args;
    if (!projectId || !checkId) throw new Error('projectId and checkId are required');

    const response = await client.makeRequest(`/quality-checks-api/v3/projects/${projectId}/checks/${checkId}`);
    return {
      content: [{
        type: "text",
        text: `📊 **Quality Check Report:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_list_quality_checks(args, client) {
    const { projectId } = args;
    if (!projectId) throw new Error('projectId is required');

    const response = await client.makeRequest(`/quality-checks-api/v3/projects/${projectId}/checks`);
    return {
      content: [{
        type: "text",
        text: `📋 **Quality Checks:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === GLOSSARY TOOLS ===
  async smartling_get_glossaries(args, client) {
    const response = await client.makeRequest('/glossary-api/v2/accounts/{accountUid}/glossaries');
    return {
      content: [{
        type: "text",
        text: `📚 **Glossaries:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_create_glossary(args, client) {
    const { name, description = '', localeId } = args;
    if (!name || !localeId) throw new Error('name and localeId are required');

    const glossaryData = {
      name,
      description,
      localeId
    };

    const response = await client.makeRequest('/glossary-api/v2/accounts/{accountUid}/glossaries', 'POST', glossaryData);
    return {
      content: [{
        type: "text",
        text: `📖 **Glossary Created:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_create_glossary_term(args, client) {
    const { glossaryId, term, definition, partOfSpeech = 'noun' } = args;
    if (!glossaryId || !term || !definition) throw new Error('glossaryId, term, and definition are required');

    const termData = {
      term,
      definition,
      partOfSpeech
    };

    const response = await client.makeRequest(`/glossary-api/v2/glossaries/${glossaryId}/terms`, 'POST', termData);
    return {
      content: [{
        type: "text",
        text: `📝 **Glossary Term Created:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === WORKFLOW TOOLS ===
  async smartling_get_workflow_steps(args, client) {
    const { projectId } = args;
    if (!projectId) throw new Error('projectId is required');

    const response = await client.makeRequest(`/workflows-api/v2/projects/${projectId}/workflows`);
    return {
      content: [{
        type: "text",
        text: `⚙️ **Workflow Steps:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_move_strings_to_workflow_step(args, client) {
    const { projectId, workflowStepUid, hashcodes, localeId } = args;
    if (!projectId || !workflowStepUid || !hashcodes || !localeId) {
      throw new Error('projectId, workflowStepUid, hashcodes, and localeId are required');
    }

    const response = await client.makeRequest(
      `/workflows-api/v2/projects/${projectId}/locales/${localeId}/workflow-steps/${workflowStepUid}/strings/move`, 
      'POST', 
      { hashcodes }
    );
    return {
      content: [{
        type: "text",
        text: `🔄 **Strings Moved to Workflow Step:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  // === WEBHOOK TOOLS ===
  async smartling_create_webhook(args, client) {
    const { projectId, url, events = [] } = args;
    if (!projectId || !url) throw new Error('projectId and url are required');

    const webhookData = {
      url,
      events
    };

    const response = await client.makeRequest(`/webhooks-api/v2/projects/${projectId}/webhooks`, 'POST', webhookData);
    return {
      content: [{
        type: "text",
        text: `🔗 **Webhook Created:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_list_webhooks(args, client) {
    const { projectId } = args;
    if (!projectId) throw new Error('projectId is required');

    const response = await client.makeRequest(`/webhooks-api/v2/projects/${projectId}/webhooks`);
    return {
      content: [{
        type: "text",
        text: `🔗 **Project Webhooks:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  },

  async smartling_delete_webhook(args, client) {
    const { projectId, webhookId } = args;
    if (!projectId || !webhookId) throw new Error('projectId and webhookId are required');

    const response = await client.makeRequest(`/webhooks-api/v2/projects/${projectId}/webhooks/${webhookId}`, 'DELETE');
    return {
      content: [{
        type: "text",
        text: `🗑️ **Webhook Deleted:**\n\n${JSON.stringify(response.data, null, 2)}`
      }]
    };
  }
};

// Complete Tool Definitions (27 tools)
const toolDefinitions = [
  // Diagnostic
  {
    name: "smartling_diagnostic",
    description: "Run diagnostic tests on Smartling API connection",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  
  // Account
  {
    name: "smartling_get_account_info",
    description: "Get account information and available accounts",
    inputSchema: { type: "object", properties: {}, required: [] }
  },

  // Projects
  {
    name: "smartling_get_project_details", 
    description: "Get details of a specific project",
    inputSchema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] }
  },
  {
    name: "smartling_create_project",
    description: "Create a new translation project",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectName: { type: "string" }, 
        sourceLocaleId: { type: "string" }, 
        targetLocaleIds: { type: "array", items: { type: "string" } } 
      }, 
      required: ["projectName"] 
    }
  },

  // Files
  {
    name: "smartling_upload_file",
    description: "Upload a file for translation",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        fileUri: { type: "string" }, 
        file: { type: "string" }, 
        fileType: { type: "string" } 
      }, 
      required: ["projectId", "fileUri"] 
    }
  },
  {
    name: "smartling_download_file",
    description: "Download a translated file",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        fileUri: { type: "string" }, 
        localeId: { type: "string" } 
      }, 
      required: ["projectId", "fileUri", "localeId"] 
    }
  },
  {
    name: "smartling_get_file_status",
    description: "Get the status of a file",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        fileUri: { type: "string" } 
      }, 
      required: ["projectId", "fileUri"] 
    }
  },
  {
    name: "smartling_list_files",
    description: "List all files in a project",
    inputSchema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] }
  },
  {
    name: "smartling_delete_file",
    description: "Delete a file from project",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        fileUri: { type: "string" } 
      }, 
      required: ["projectId", "fileUri"] 
    }
  },

  // Jobs
  {
    name: "smartling_create_job",
    description: "Create a translation job",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        jobName: { type: "string" }, 
        description: { type: "string" }, 
        targetLocaleIds: { type: "array", items: { type: "string" } } 
      }, 
      required: ["projectId", "jobName"] 
    }
  },
  {
    name: "smartling_get_job_details",
    description: "Get details of a translation job", 
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        jobId: { type: "string" } 
      }, 
      required: ["projectId", "jobId"] 
    }
  },
  {
    name: "smartling_list_jobs",
    description: "List all jobs in a project",
    inputSchema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] }
  },
  {
    name: "smartling_authorize_job",
    description: "Authorize a translation job",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        jobId: { type: "string" } 
      }, 
      required: ["projectId", "jobId"] 
    }
  },
  {
    name: "smartling_close_job",
    description: "Close a translation job",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        jobId: { type: "string" } 
      }, 
      required: ["projectId", "jobId"] 
    }
  },

  // Tagging
  {
    name: "smartling_add_tag_to_string",
    description: "Add a tag to a translation string",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        hashcode: { type: "string" }, 
        localeId: { type: "string" }, 
        tag: { type: "string" } 
      }, 
      required: ["projectId", "hashcode", "localeId", "tag"] 
    }
  },
  {
    name: "smartling_get_string_tags",
    description: "Get all tags for a translation string",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        hashcode: { type: "string" }, 
        localeId: { type: "string" } 
      }, 
      required: ["projectId", "hashcode", "localeId"] 
    }
  },
  {
    name: "smartling_remove_tag_from_string",
    description: "Remove a tag from a translation string",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        hashcode: { type: "string" }, 
        localeId: { type: "string" }, 
        tag: { type: "string" } 
      }, 
      required: ["projectId", "hashcode", "localeId", "tag"] 
    }
  },

  // Quality
  {
    name: "smartling_run_quality_check",
    description: "Run quality checks on translated content",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        fileUri: { type: "string" }, 
        localeId: { type: "string" } 
      }, 
      required: ["projectId", "fileUri", "localeId"] 
    }
  },
  {
    name: "smartling_get_quality_check_report",
    description: "Get quality check report",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        checkId: { type: "string" } 
      }, 
      required: ["projectId", "checkId"] 
    }
  },
  {
    name: "smartling_list_quality_checks",
    description: "List all quality checks for a project",
    inputSchema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] }
  },

  // Glossary
  {
    name: "smartling_get_glossaries",
    description: "Get all glossaries",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "smartling_create_glossary",
    description: "Create a new glossary",
    inputSchema: { 
      type: "object", 
      properties: { 
        name: { type: "string" }, 
        description: { type: "string" }, 
        localeId: { type: "string" } 
      }, 
      required: ["name", "localeId"] 
    }
  },
  {
    name: "smartling_create_glossary_term",
    description: "Create a new glossary term",
    inputSchema: { 
      type: "object", 
      properties: { 
        glossaryId: { type: "string" }, 
        term: { type: "string" }, 
        definition: { type: "string" }, 
        partOfSpeech: { type: "string" } 
      }, 
      required: ["glossaryId", "term", "definition"] 
    }
  },

  // Workflow
  {
    name: "smartling_get_workflow_steps",
    description: "Get workflow steps for a project",
    inputSchema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] }
  },
  {
    name: "smartling_move_strings_to_workflow_step",
    description: "Move strings to a workflow step",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        workflowStepUid: { type: "string" }, 
        hashcodes: { type: "array", items: { type: "string" } }, 
        localeId: { type: "string" } 
      }, 
      required: ["projectId", "workflowStepUid", "hashcodes", "localeId"] 
    }
  },

  // Webhooks
  {
    name: "smartling_create_webhook",
    description: "Create a webhook for project notifications",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        url: { type: "string" }, 
        events: { type: "array", items: { type: "string" } } 
      }, 
      required: ["projectId", "url"] 
    }
  },
  {
    name: "smartling_list_webhooks",
    description: "List all webhooks for a project",
    inputSchema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] }
  },
  {
    name: "smartling_delete_webhook",
    description: "Delete a webhook",
    inputSchema: { 
      type: "object", 
      properties: { 
        projectId: { type: "string" }, 
        webhookId: { type: "string" } 
      }, 
      required: ["projectId", "webhookId"] 
    }
  }
];

// Main request handler function
const handleRequest = async (req, res) => {
  try {
    console.log(`📨 ${req.method} ${req.url}`);
    
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
      sendText(res, 200);
    return;
  }

    // Parse URL
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    
    console.log(`🔍 Processing path: ${path}`);

    // Initialize Smartling client
    const smartlingConfig = {
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET,
      baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com'
    };

    const client = new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET,
      baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com'
    });

    // Health endpoint
    if (path === '/health' || path === '/') {
      console.log('✅ Health check requested');
      sendJSON(res, 200, {
        status: 'healthy',
        message: '🎉 COMPLETE Smartling MCP Server with ALL 27+ tools!',
        version: '3.0.0-COMPLETE',
        timestamp: new Date().toISOString(),
        toolsCount: toolDefinitions.length,
        environment: {
          hasUserIdentifier: !!process.env.SMARTLING_USER_IDENTIFIER,
          hasUserSecret: !!process.env.SMARTLING_USER_SECRET,
          baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com'
        },
        endpoints: [
          'GET /health - This health check',
          'GET /tools - List all available tools (MCP compatible)',
          'POST /execute/{tool_name} - Execute a specific tool'
        ],
        features: {
          diagnostic: true,
          projects: true,
          files: true,
          jobs: true,
          tagging: true,
          quality: true,
          glossary: true,
          workflow: true,
          webhooks: true,
          authorization: true
        }
      });
      return;
    }

    // MCP compatible tools list endpoint
    if (path === '/tools') {
      sendJSON(res, 200, {
        tools: toolDefinitions,
        totalTools: toolDefinitions.length,
        categories: {
          diagnostic: toolDefinitions.filter(t => t.name.includes('diagnostic')).length,
          account: toolDefinitions.filter(t => t.name.includes('account')).length,
          projects: toolDefinitions.filter(t => t.name.includes('project')).length,
          files: toolDefinitions.filter(t => t.name.includes('file')).length,
          jobs: toolDefinitions.filter(t => t.name.includes('job')).length,
          tagging: toolDefinitions.filter(t => t.name.includes('tag')).length,
          quality: toolDefinitions.filter(t => t.name.includes('quality')).length,
          glossary: toolDefinitions.filter(t => t.name.includes('glossary')).length,
          workflow: toolDefinitions.filter(t => t.name.includes('workflow')).length,
          webhooks: toolDefinitions.filter(t => t.name.includes('webhook')).length
        },
        protocol: "MCP",
        version: "1.0"
      });
      return;
    }

    // Execute tool endpoint
    if (path.startsWith('/execute/') && req.method === 'POST') {
      const toolName = path.replace('/execute/', '');
      const tool = toolDefinitions.find(t => t.name === toolName);
      
      if (!tool) {
        sendJSON(res, 404, { error: `Tool '${toolName}' not found` });
        return;
      }

      // Get request body
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const args = body ? JSON.parse(body) : {};
          
          if (!SmartlingTools[toolName]) {
            sendJSON(res, 500, { error: `Tool implementation not found for '${toolName}'` });
            return;
          }

          const result = await SmartlingTools[toolName](args, client);
          sendJSON(res, 200, result);
        } catch (error) {
          console.error(`Tool execution error for ${toolName}:`, error);
          sendJSON(res, 500, { 
            error: 'Tool execution failed',
            message: error.message,
            tool: toolName
          });
        }
      });
      return;
    }

    // 404 for unknown endpoints
    sendJSON(res, 404, { 
      error: 'Endpoint not found',
      path: path,
      availableEndpoints: ['/health', '/tools', '/execute/{tool_name}']
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    console.error('❌ Stack:', error.stack);
    sendJSON(res, 500, {
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Export for serverless platforms
module.exports = async (req, res) => {
  return await handleRequest(req, res);
};

// For traditional deployment - create HTTP server
if (process.env.NODE_ENV !== 'serverless') {
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(async (req, res) => {
    try {
      await handleRequest(req, res);
    } catch (error) {
      console.error('❌ HTTP Server error:', error);
      console.error('❌ HTTP Stack:', error.stack);
      try {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
        }
      } catch (writeError) {
        console.error('❌ Failed to send error response:', writeError);
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 Smartling MCP Server running on port ${PORT}`);
    console.log(`📋 API endpoint: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment variables: ${!!process.env.SMARTLING_USER_IDENTIFIER ? 'OK' : 'MISSING'}`);
  });
}
