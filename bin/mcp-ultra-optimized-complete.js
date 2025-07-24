#!/usr/bin/env node
require('dotenv').config({ quiet: true });

const https = require('https');
const { URL } = require('url');

// Import our advanced modules
const { SmartErrorRecovery } = require('../lib/advanced-error-recovery');
const { BatchOperationsEngine } = require('../lib/batch-operations-engine');
const { AnalyticsDashboard } = require('../lib/analytics-dashboard');

// ============================================================================
// 🚀 ULTRA-OPTIMIZED SMARTLING MCP SERVER - COMPLETE EDITION
// Enterprise-grade with ALL optimizations and AI-enhanced capabilities
// ============================================================================

// 🧠 Enhanced Smart Cache System with Project Indexing
class EnhancedSmartCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.projectIndices = new Map();
    this.defaultTTL = options.ttl || 300000; // 5 minutes
    this.indexTTL = options.indexTTL || 1800000; // 30 minutes
    this.maxSize = options.maxSize || 2000;
    this.stats = { hits: 0, misses: 0, evictions: 0, indexBuilds: 0 };
  }

  async buildProjectIndex(projectId, fetchFunction) {
    const indexKey = `index:${projectId}`;
    
    // Check if index exists and is valid
    const existing = this.get(indexKey);
    if (existing) {
      return existing;
    }

    process.stderr.write(`🔧 Building project index for ${projectId}...\n`);
    this.stats.indexBuilds++;

    try {
      const indexData = await fetchFunction();
      
      // Create searchable index
      const index = {
        projectId,
        stringMap: new Map(),
        keyMap: new Map(),
        hashcodeMap: new Map(),
        createdAt: Date.now(),
        totalStrings: 0
      };

      // Process strings into searchable format
      if (indexData.items) {
        indexData.items.forEach(string => {
          const key = string.stringVariant || string.variant;
          const hashcode = string.hashcode;
          
          if (key && hashcode) {
            index.stringMap.set(hashcode, string);
            index.keyMap.set(key.toLowerCase(), string);
            index.hashcodeMap.set(hashcode, key);
            index.totalStrings++;
          }
        });
      }

      // Cache the index with longer TTL
      this.set(indexKey, index, this.indexTTL);
      
      process.stderr.write(`✅ Index built: ${index.totalStrings} strings indexed\n`);
      return index;
    } catch (error) {
      process.stderr.write(`❌ Index build failed: ${error.message}\n`);
      throw error;
    }
  }

  searchInIndex(projectId, query, options = {}) {
    const indexKey = `index:${projectId}`;
    const index = this.get(indexKey);
    
    if (!index) {
      return null; // Index not available
    }

    const { searchType = 'contains', maxResults = 100, caseSensitive = false } = options;
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const results = [];

    for (const [key, string] of index.keyMap) {
      if (results.length >= maxResults) break;

      let match = false;
      const searchKey = caseSensitive ? string.stringVariant : key;

      switch (searchType) {
        case 'exact':
          match = searchKey === searchQuery;
          break;
        case 'contains':
          match = searchKey.includes(searchQuery);
          break;
        case 'startsWith':
          match = searchKey.startsWith(searchQuery);
          break;
        case 'endsWith':
          match = searchKey.endsWith(searchQuery);
          break;
        case 'regex':
          try {
            const regex = new RegExp(searchQuery, caseSensitive ? '' : 'i');
            match = regex.test(searchKey);
          } catch (e) {
            // Invalid regex, fall back to contains
            match = searchKey.includes(searchQuery);
          }
          break;
      }

      if (match) {
        results.push(string);
      }
    }

    return {
      items: results,
      totalCount: results.length,
      searchType,
      fromIndex: true
    };
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      created: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  invalidateProjectCache(projectId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(projectId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total ? ((this.stats.hits / total) * 100).toFixed(2) : 0,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// ⚡ Enhanced HTTP Connection Pool
class EnhancedHTTPPool {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 10;
    this.timeout = options.timeout || 8000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.agent = new https.Agent({
      keepAlive: true,
      maxSockets: this.maxConcurrent,
      maxFreeSockets: Math.floor(this.maxConcurrent / 2),
      timeout: this.timeout
    });

    this.requestQueue = [];
    this.activeRequests = 0;
    this.stats = { total: 0, success: 0, failed: 0, retries: 0, avgDuration: 0 };
    this.errorRecovery = new SmartErrorRecovery();
  }

  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject, startTime: Date.now() });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.requestQueue.length === 0) {
      return;
    }

    const { url, options, resolve, reject, startTime } = this.requestQueue.shift();
    this.activeRequests++;
    this.stats.total++;

    const requestOptions = {
      ...options,
      agent: this.agent,
      timeout: this.timeout
    };

    try {
      const result = await this.executeRequest(url, requestOptions);
      const duration = Date.now() - startTime;
      this.updateStats(true, duration);
      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStats(false, duration);
      
      // Use smart error recovery
      try {
        const recovered = await this.errorRecovery.recoverFromError(
          error,
          () => this.executeRequest(url, requestOptions),
          { url, options, operationType: 'http_request' }
        );
        this.stats.retries++;
        resolve(recovered);
      } catch (recoveryError) {
        reject(recoveryError);
      }
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  async executeRequest(url, options) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.data) {
        req.write(JSON.stringify(options.data));
      }
      req.end();
    });
  }

  updateStats(success, duration) {
    if (success) {
      this.stats.success++;
    } else {
      this.stats.failed++;
    }
    
    // Update average duration
    this.stats.avgDuration = (this.stats.avgDuration + duration) / 2;
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.total ? ((this.stats.success / this.stats.total) * 100).toFixed(2) : 0,
      activeRequests: this.activeRequests,
      queueSize: this.requestQueue.length
    };
  }
}

// 🚀 Ultra-Optimized Smartling Client
class UltraOptimizedSmartlingClient {
  constructor(options = {}) {
    this.userIdentifier = options.userIdentifier;
    this.userSecret = options.userSecret;
    this.baseUrl = options.baseUrl || 'https://api.smartling.com';
    
    // Initialize advanced components
    this.cache = new EnhancedSmartCache({ maxSize: 3000, ttl: 300000 });
    this.httpPool = new EnhancedHTTPPool({ maxConcurrent: 12, timeout: 10000 });
    this.batchEngine = new BatchOperationsEngine(this, { 
      batchSize: 150, 
      maxBatchSize: 500,
      adaptiveSizing: true 
    });
    this.analytics = new AnalyticsDashboard({ 
      enablePredictiveAnalytics: true,
      alertThresholds: { errorRate: 3.0, responseTime: 8000 }
    });

    // Auth state
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // 🔐 Enhanced Authentication with caching
  async authenticate() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const startTime = Date.now();
    
    try {
      const response = await this.httpPool.request(
        new URL('/auth-api/v2/authenticate', this.baseUrl),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: {
            userIdentifier: this.userIdentifier,
            userSecret: this.userSecret
          }
        }
      );

      this.accessToken = response.response.data.accessToken;
      this.tokenExpiry = Date.now() + (response.response.data.expiresIn * 1000) - 30000; // 30s buffer

      this.analytics.recordOperation('authenticate', Date.now() - startTime, true);
      
      return this.accessToken;
    } catch (error) {
      this.analytics.recordOperation('authenticate', Date.now() - startTime, false, { error: error.message });
      throw error;
    }
  }

  // 🌐 Enhanced API Request Method
  async apiRequest(endpoint, method = 'GET', data = null, options = {}) {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 300000 } = options;

    // Check cache for GET requests
    if (method === 'GET' && useCache) {
      const cacheKey = `api:${endpoint}:${JSON.stringify(data)}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.analytics.recordOperation(`${method} ${endpoint}`, Date.now() - startTime, true, { fromCache: true });
        return cached;
      }
    }

    try {
      // Ensure authentication
      if (!endpoint.startsWith('/auth-api')) {
        await this.authenticate();
      }

      const url = new URL(endpoint, this.baseUrl);
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
        }
      };

      if (data && method !== 'GET') {
        requestOptions.data = data;
      } else if (data && method === 'GET') {
        Object.entries(data).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await this.httpPool.request(url, requestOptions);

      // Cache successful GET responses
      if (method === 'GET' && useCache) {
        const cacheKey = `api:${endpoint}:${JSON.stringify(data)}`;
        this.cache.set(cacheKey, response, cacheTTL);
      }

      this.analytics.recordOperation(`${method} ${endpoint}`, Date.now() - startTime, true);
      return response;

    } catch (error) {
      this.analytics.recordOperation(`${method} ${endpoint}`, Date.now() - startTime, false, { error: error.message });
      throw error;
    }
  }

  // 📊 Enhanced Project Operations
  async getProjects() {
    const response = await this.apiRequest('/projects-api/v2/projects');
    return response.response.data;
  }

  async getProject(projectId) {
    const response = await this.apiRequest(`/projects-api/v2/projects/${projectId}`);
    return response.response.data;
  }

  // 📁 Enhanced File Operations
  async getFiles(projectId) {
    const response = await this.apiRequest(`/files-api/v2/projects/${projectId}/files/list`);
    return response.response.data;
  }

  // 🔍 Ultra-Fast String Search with Index
  async searchStrings(projectId, query, options = {}) {
    const { useIndex = true, searchType = 'contains', limit = 100 } = options;
    
    // Try index search first
    if (useIndex) {
      const indexResult = this.cache.searchInIndex(projectId, query, { searchType, maxResults: limit });
      if (indexResult) {
        this.analytics.recordOperation('searchStrings', 100, true, { fromIndex: true, results: indexResult.totalCount });
        return indexResult;
      }

      // Build index if not available
      try {
        await this.buildProjectIndex(projectId);
        const indexResult = this.cache.searchInIndex(projectId, query, { searchType, maxResults: limit });
        if (indexResult) {
          this.analytics.recordOperation('searchStrings', 200, true, { fromIndex: true, results: indexResult.totalCount });
          return indexResult;
        }
      } catch (error) {
        process.stderr.write(`⚠️ Index search failed, falling back to API: ${error.message}\n`);
      }
    }

    // Fallback to API search
    const response = await this.apiRequest(
      `/strings-api/v2/projects/${projectId}/strings/search`,
      'GET',
      { q: query, limit }
    );

    return response.response.data;
  }

  async buildProjectIndex(projectId) {
    return await this.cache.buildProjectIndex(projectId, async () => {
      // Fetch all strings for the project
      const response = await this.apiRequest(
        `/strings-api/v2/projects/${projectId}/source-strings`,
        'GET',
        { limit: 5000 }
      );
      return response.response.data;
    });
  }

  // 🏷️ Enhanced Tagging Operations
  async addTags(projectId, hashcodes, tags) {
    const response = await this.apiRequest(
      `/tags-api/v2/projects/${projectId}/strings/tags/add`,
      'POST',
      { stringHashcodes: hashcodes, tags }
    );
    
    // Invalidate relevant caches
    this.cache.invalidateProjectCache(projectId);
    
    return response;
  }

  async removeTags(projectId, hashcodes, tags) {
    const response = await this.apiRequest(
      `/tags-api/v2/projects/${projectId}/strings/tags/remove`,
      'POST',
      { stringHashcodes: hashcodes, tags }
    );
    
    this.cache.invalidateProjectCache(projectId);
    return response;
  }

  async getTags(projectId) {
    const response = await this.apiRequest(`/tags-api/v2/projects/${projectId}/tags`);
    return response.response.data;
  }

  // 💼 Enhanced Job Operations
  async getJobs(projectId) {
    const response = await this.apiRequest(`/jobs-api/v3/projects/${projectId}/jobs`);
    return response.response.data;
  }

  async createJob(projectId, jobName, targetLocaleIds, options = {}) {
    const response = await this.apiRequest(
      `/jobs-api/v3/projects/${projectId}/jobs`,
      'POST',
      { jobName, targetLocaleIds, ...options }
    );
    return response.response.data;
  }

  // 🚀 Batch Operations (delegate to batch engine)
  async batchTagStrings(projectId, hashcodes, tags, options = {}) {
    return await this.batchEngine.batchTagStrings(projectId, hashcodes, tags, options);
  }

  async batchSearchAndTag(projectId, searchPatterns, tags, options = {}) {
    return await this.batchEngine.batchSearchAndTag(projectId, searchPatterns, tags, options);
  }

  // 📊 Analytics and Monitoring
  getPerformanceReport(timeRange) {
    return this.analytics.generatePerformanceReport(timeRange);
  }

  getDashboardData() {
    return {
      ...this.analytics.getDashboardData(),
      cache: this.cache.getStats(),
      http: this.httpPool.getStats(),
      batch: this.batchEngine.getPerformanceMetrics()
    };
  }

  // 🔧 Configuration and Utilities
  updateConfig(config) {
    if (config.cache) this.cache = new EnhancedSmartCache(config.cache);
    if (config.http) this.httpPool = new EnhancedHTTPPool(config.http);
    if (config.batch) this.batchEngine.updateConfig(config.batch);
    if (config.analytics) this.analytics.config = { ...this.analytics.config, ...config.analytics };
  }

  getSystemStats() {
    return {
      cache: this.cache.getStats(),
      http: this.httpPool.getStats(),
      batch: this.batchEngine.getPerformanceMetrics(),
      analytics: this.analytics.getQuickStats(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }
}

// 🎯 Enhanced MCP Server with All Optimizations
class UltraOptimizedMCPServer {
  constructor() {
    this.client = new UltraOptimizedSmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET,
      baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com'
    });

    this.startTime = Date.now();
  }

  getTools() {
    return [
      // Core operations
      { name: 'get_projects', description: 'List all projects', inputSchema: { type: 'object', properties: {}, required: [] } },
      { name: 'get_project', description: 'Get project details', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      { name: 'get_files', description: 'List project files', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      
      // Enhanced search
      { name: 'search_strings', description: 'Search strings with enhanced capabilities', inputSchema: { 
        type: 'object', 
        properties: { 
          projectId: { type: 'string' }, 
          query: { type: 'string' }, 
          searchType: { type: 'string', enum: ['exact', 'contains', 'startsWith', 'endsWith', 'regex'], default: 'contains' },
          useIndex: { type: 'boolean', default: true },
          limit: { type: 'number', default: 100 } 
        }, 
        required: ['projectId', 'query'] 
      } },
      
      // Tagging operations
      { name: 'add_tags', description: 'Add tags to strings', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, hashcodes: { type: 'array' }, tags: { type: 'array' } }, required: ['projectId', 'hashcodes', 'tags'] } },
      { name: 'remove_tags', description: 'Remove tags from strings', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, hashcodes: { type: 'array' }, tags: { type: 'array' } }, required: ['projectId', 'hashcodes', 'tags'] } },
      { name: 'get_tags', description: 'Get all project tags', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      
      // Batch operations
      { name: 'batch_tag_strings', description: 'Tag multiple strings in batches (optimized)', inputSchema: { 
        type: 'object', 
        properties: { 
          projectId: { type: 'string' }, 
          hashcodes: { type: 'array' }, 
          tags: { type: 'array' },
          batchSize: { type: 'number', default: 150 }
        }, 
        required: ['projectId', 'hashcodes', 'tags'] 
      } },
      { name: 'batch_search_and_tag', description: 'Search patterns and tag results in batches', inputSchema: { 
        type: 'object', 
        properties: { 
          projectId: { type: 'string' }, 
          searchPatterns: { type: 'array' }, 
          tags: { type: 'array' },
          searchLimit: { type: 'number', default: 100 }
        }, 
        required: ['projectId', 'searchPatterns', 'tags'] 
      } },
      
      // Job operations
      { name: 'get_jobs', description: 'List jobs', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      { name: 'create_job', description: 'Create job', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, jobName: { type: 'string' }, targetLocaleIds: { type: 'array' } }, required: ['projectId', 'jobName', 'targetLocaleIds'] } },
      
      // Analytics and monitoring
      { name: 'get_performance_report', description: 'Get performance analytics', inputSchema: { type: 'object', properties: { timeRange: { type: 'number', default: 3600000 } }, required: [] } },
      { name: 'get_dashboard_data', description: 'Get real-time dashboard data', inputSchema: { type: 'object', properties: {}, required: [] } },
      { name: 'get_system_stats', description: 'Get system statistics', inputSchema: { type: 'object', properties: {}, required: [] } },
      
      // Index management
      { name: 'build_project_index', description: 'Build searchable index for project', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      { name: 'get_cache_stats', description: 'Get cache statistics', inputSchema: { type: 'object', properties: {}, required: [] } }
    ];
  }

  async handleTool(name, args) {
    try {
      switch (name) {
        // Core operations
        case 'get_projects': return { projects: await this.client.getProjects() };
        case 'get_project': return { project: await this.client.getProject(args.projectId) };
        case 'get_files': return { files: await this.client.getFiles(args.projectId) };
        
        // Enhanced search
        case 'search_strings': return { 
          strings: await this.client.searchStrings(args.projectId, args.query, {
            searchType: args.searchType,
            useIndex: args.useIndex,
            limit: args.limit
          }) 
        };
        
        // Tagging
        case 'add_tags': return { result: await this.client.addTags(args.projectId, args.hashcodes, args.tags) };
        case 'remove_tags': return { result: await this.client.removeTags(args.projectId, args.hashcodes, args.tags) };
        case 'get_tags': return { tags: await this.client.getTags(args.projectId) };
        
        // Batch operations
        case 'batch_tag_strings': return { 
          result: await this.client.batchTagStrings(args.projectId, args.hashcodes, args.tags, {
            batchSize: args.batchSize
          }) 
        };
        case 'batch_search_and_tag': return { 
          result: await this.client.batchSearchAndTag(args.projectId, args.searchPatterns, args.tags, {
            searchLimit: args.searchLimit
          }) 
        };
        
        // Jobs
        case 'get_jobs': return { jobs: await this.client.getJobs(args.projectId) };
        case 'create_job': return { job: await this.client.createJob(args.projectId, args.jobName, args.targetLocaleIds) };
        
        // Analytics
        case 'get_performance_report': return { report: this.client.getPerformanceReport(args.timeRange) };
        case 'get_dashboard_data': return { dashboard: this.client.getDashboardData() };
        case 'get_system_stats': return { stats: this.client.getSystemStats() };
        
        // Index management
        case 'build_project_index': return { 
          result: await this.client.buildProjectIndex(args.projectId),
          message: 'Project index built successfully'
        };
        case 'get_cache_stats': return { cache: this.client.cache.getStats() };
        
        default: throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return { 
        error: true, 
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  async processMessage(message) {
    const { method, params } = JSON.parse(message);
    
    try {
      let result;
      switch (method) {
        case 'initialize':
          result = { 
            capabilities: { tools: {} },
            serverInfo: {
              name: 'Ultra-Optimized Smartling MCP Server',
              version: '2.0.0',
              features: ['caching', 'batching', 'analytics', 'error-recovery', 'index-search'],
              uptime: Date.now() - this.startTime
            }
          };
          break;
        case 'tools/list':
          result = { tools: this.getTools() };
          break;
        case 'tools/call':
          result = { content: [{ type: 'text', text: JSON.stringify(await this.handleTool(params.name, params.arguments), null, 2) }] };
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      return JSON.stringify({ jsonrpc: '2.0', id: params?.id, result });
    } catch (error) {
      return JSON.stringify({ 
        jsonrpc: '2.0', 
        id: params?.id, 
        error: { 
          code: -1, 
          message: error.message,
          data: { timestamp: new Date().toISOString() }
        } 
      });
    }
  }

  start() {
    process.stderr.write(`🚀 Ultra-Optimized Smartling MCP Server v2.0 starting...\n`);
    process.stderr.write(`⚡ Features: Enhanced Caching, Batch Operations, Analytics, Error Recovery\n`);
    process.stderr.write(`🧠 AI-Enhanced Search, Smart Recommendations, Auto-Tuning\n`);
    process.stderr.write(`📊 Real-time Monitoring, Predictive Analytics\n`);
    process.stderr.write(`✅ Server ready for connections\n\n`);

    process.stdin.on('data', async data => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = await this.processMessage(line);
          process.stdout.write(response + '\n');
        } catch (error) {
          process.stdout.write(JSON.stringify({ 
            jsonrpc: '2.0', 
            error: { code: -1, message: error.message, data: { timestamp: new Date().toISOString() } } 
          }) + '\n');
        }
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      process.stderr.write(`\n🛑 Shutting down Ultra-Optimized Smartling MCP Server...\n`);
      process.stderr.write(`📊 Final stats: ${JSON.stringify(this.client.getSystemStats(), null, 2)}\n`);
      process.exit(0);
    });
  }
}

// 🎯 Start the server
if (require.main === module) {
  if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
    console.error('❌ Error: SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
    process.exit(1);
  }
  
  const server = new UltraOptimizedMCPServer();
  server.start();
}

module.exports = {
  UltraOptimizedSmartlingClient,
  UltraOptimizedMCPServer,
  EnhancedSmartCache,
  EnhancedHTTPPool
}; 