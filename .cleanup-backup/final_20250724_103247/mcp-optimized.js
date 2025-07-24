#!/usr/bin/env node
require('dotenv').config({ quiet: true });

const https = require('https');
const { URL } = require('url');

// Ultra-optimized Smartling MCP Server
class SmartlingClient {
  constructor({ userIdentifier, userSecret, baseUrl = 'https://api.smartling.com' }) {
    this.userIdentifier = userIdentifier;
    this.userSecret = userSecret;
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async auth() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) return this.accessToken;
    
    const res = await this.request('/auth-api/v2/authenticate', 'POST', {
      userIdentifier: this.userIdentifier,
      userSecret: this.userSecret
    });
    
    this.accessToken = res.response.data.accessToken;
    this.tokenExpiry = Date.now() + res.response.data.expiresIn * 1000;
    return this.accessToken;
  }

  async request(endpoint, method = 'GET', data = null) {
    if (!endpoint.startsWith('/auth-api')) await this.auth();
    
    const url = new URL(this.baseUrl + endpoint);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (this.accessToken) options.headers.Authorization = `Bearer ${this.accessToken}`;

    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            res.statusCode < 300 ? resolve(parsed) : reject(new Error(`${res.statusCode}: ${parsed.message}`));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${body}`));
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  // Core API methods (only essentials)
  async getProjects() { return (await this.request('/projects-api/v2/projects')).response.data; }
  async getProject(id) { return (await this.request(`/projects-api/v2/projects/${id}`)).response.data; }
  async getFiles(projectId) { return (await this.request(`/files-api/v2/projects/${projectId}/files/list`)).response.data; }
  async getStrings(projectId, q, limit = 50) {
    const res = await this.request(`/strings-api/v2/projects/${projectId}/strings/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    return res.response.data;
  }
  async addTags(projectId, hashcodes, tags) {
    return this.request(`/tags-api/v2/projects/${projectId}/strings/tags/add`, 'POST', { stringHashcodes: hashcodes, tags });
  }
  async removeTags(projectId, hashcodes, tags) {
    return this.request(`/tags-api/v2/projects/${projectId}/strings/tags/remove`, 'POST', { stringHashcodes: hashcodes, tags });
  }
  async getTags(projectId) { return (await this.request(`/tags-api/v2/projects/${projectId}/tags`)).response.data; }
  async getJobs(projectId) { return (await this.request(`/jobs-api/v3/projects/${projectId}/jobs`)).response.data; }
  async createJob(projectId, name, targetLocales) {
    return this.request(`/jobs-api/v3/projects/${projectId}/jobs`, 'POST', { jobName: name, targetLocaleIds: targetLocales });
  }
}

// MCP Server
class MCPServer {
  constructor() {
    this.client = new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET
    });
  }

  getTools() {
    return [
      { name: 'get_projects', description: 'List all projects', inputSchema: { type: 'object', properties: {}, required: [] } },
      { name: 'get_project', description: 'Get project details', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      { name: 'get_files', description: 'List project files', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      { name: 'search_strings', description: 'Search strings', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, query: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId', 'query'] } },
      { name: 'add_tags', description: 'Add tags to strings', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, hashcodes: { type: 'array' }, tags: { type: 'array' } }, required: ['projectId', 'hashcodes', 'tags'] } },
      { name: 'remove_tags', description: 'Remove tags from strings', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, hashcodes: { type: 'array' }, tags: { type: 'array' } }, required: ['projectId', 'hashcodes', 'tags'] } },
      { name: 'get_tags', description: 'Get all project tags', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      { name: 'get_jobs', description: 'List jobs', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      { name: 'create_job', description: 'Create job', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' }, targetLocales: { type: 'array' } }, required: ['projectId', 'name', 'targetLocales'] } }
    ];
  }

  async handleTool(name, args) {
    switch (name) {
      case 'get_projects': return { projects: await this.client.getProjects() };
      case 'get_project': return { project: await this.client.getProject(args.projectId) };
      case 'get_files': return { files: await this.client.getFiles(args.projectId) };
      case 'search_strings': return { strings: await this.client.getStrings(args.projectId, args.query, args.limit) };
      case 'add_tags': return { success: await this.client.addTags(args.projectId, args.hashcodes, args.tags) };
      case 'remove_tags': return { success: await this.client.removeTags(args.projectId, args.hashcodes, args.tags) };
      case 'get_tags': return { tags: await this.client.getTags(args.projectId) };
      case 'get_jobs': return { jobs: await this.client.getJobs(args.projectId) };
      case 'create_job': return { job: await this.client.createJob(args.projectId, args.name, args.targetLocales) };
      default: throw new Error(`Unknown tool: ${name}`);
    }
  }

  async processMessage(message) {
    const { method, params } = JSON.parse(message);
    
    try {
      let result;
      switch (method) {
        case 'initialize':
          result = { capabilities: { tools: {} } };
          break;
        case 'tools/list':
          result = { tools: this.getTools() };
          break;
        case 'tools/call':
          result = { content: [{ type: 'text', text: JSON.stringify(await this.handleTool(params.name, params.arguments)) }] };
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      return JSON.stringify({ jsonrpc: '2.0', id: params?.id, result });
    } catch (error) {
      return JSON.stringify({ jsonrpc: '2.0', id: params?.id, error: { code: -1, message: error.message } });
    }
  }

  start() {
    process.stdin.on('data', async data => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = await this.processMessage(line);
          process.stdout.write(response + '\n');
        } catch (error) {
          process.stdout.write(JSON.stringify({ jsonrpc: '2.0', error: { code: -1, message: error.message } }) + '\n');
        }
      }
    });
  }
}

// Start server
if (require.main === module) {
  if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
    console.error('Error: SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET required');
    process.exit(1);
  }
  new MCPServer().start();
} 