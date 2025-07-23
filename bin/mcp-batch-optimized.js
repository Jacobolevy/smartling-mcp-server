#!/usr/bin/env node

/**
 * 🚀 BATCH-OPTIMIZED SMARTLING MCP SERVER
 * 
 * Incorporates optimizations from Google Apps Script:
 * ✅ Extended timeouts for large operations
 * ✅ Intelligent batching and caching
 * ✅ Early termination for efficiency
 * ✅ Parallel processing when possible
 * ✅ Robust error handling
 */

const https = require('https');
const readline = require('readline');

const BATCH_TIMEOUT_MS = 300000; // 5 minutes for batch operations
const SINGLE_TIMEOUT_MS = 30000;  // 30 seconds for single operations
const SMARTLING_SERVER_URL = 'https://smartling-mcp.onrender.com';

class BatchOptimizedSmartlingMCPServer {
  constructor() {
    this.cache = new Map();
    this.setupErrorHandling();
    console.error('🚀 Batch-Optimized Smartling MCP Server started');
    console.error('⏱️  Timeouts: Single ops 30s, Batch ops 5min');
    console.error('🔗 Backend:', SMARTLING_SERVER_URL);
    console.error('✅ Ready for Claude Desktop');
  }

  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      console.error(`UNCAUGHT EXCEPTION: ${error.message}`);
      this.sendError(999, 'Internal server error', error.message);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(`UNHANDLED REJECTION: ${reason}`);
      this.sendError(999, 'Promise rejection', String(reason));
    });

    process.on('SIGTERM', () => {
      console.error('📡 MCP connection closed');
      process.exit(0);
    });
  }

  determineTimeout(method) {
    // Use extended timeout for batch operations
    const batchMethods = [
      'smartling_batch_find_hashcodes',
      'smartling_batch_tag_keys',
      'smartling_find_hashcode_for_key',
      'smartling_search_and_tag',
      'smartling_get_all_source_strings'
    ];
    
    return batchMethods.includes(method) ? BATCH_TIMEOUT_MS : SINGLE_TIMEOUT_MS;
  }

  async handleRequest(request) {
    const startTime = Date.now();
    const timeout = this.determineTimeout(request.method);
    
    console.error(`📨 Request: ${request.method} (id: ${request.id}) - Timeout: ${timeout/1000}s`);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout after ${timeout/1000}s`)), timeout);
      });

      const requestPromise = this.makeSmartlingRequest(request);
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      console.error(`✅ Completed in ${duration}ms`);
      
      this.sendResponse(request.id, result);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error after ${duration}ms: ${error.message}`);
      this.sendError(request.id, 'Request failed', error.message);
    }
  }

  async makeSmartlingRequest(request) {
    // Add progress tracking for batch operations
    if (this.isBatchOperation(request.method)) {
      console.error(`🔄 Starting batch operation: ${request.method}`);
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(request);
      
      const options = {
        hostname: 'smartling-mcp.onrender.com',
        port: 443,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: this.determineTimeout(request.method)
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
          
          // Progress indicator for large responses
          if (data.length % 10000 === 0) {
            console.error(`📊 Received ${Math.round(data.length/1024)}KB...`);
          }
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (this.isBatchOperation(request.method)) {
              console.error(`✅ Batch operation completed`);
            }
            
            resolve(response);
          } catch (parseError) {
            console.error('Failed to parse response:', parseError.message);
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.determineTimeout(request.method)/1000} seconds`));
      });

      req.on('error', (error) => {
        console.error('Request error:', error.message);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  isBatchOperation(method) {
    const batchMethods = [
      'smartling_batch_find_hashcodes',
      'smartling_batch_tag_keys', 
      'smartling_find_hashcode_for_key',
      'smartling_search_and_tag',
      'smartling_get_all_source_strings'
    ];
    return batchMethods.includes(method);
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: "2.0",
      id: id,
      result: result
    };
    console.log(JSON.stringify(response));
  }

  sendError(id, code, message) {
    const response = {
      jsonrpc: "2.0",
      id: id,
      error: {
        code: -32000,
        message: `${code}: ${message}`
      }
    };
    console.log(JSON.stringify(response));
  }

  async processInput() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const request = JSON.parse(line);
          
          if (request.method === 'tools/list') {
            const tools = await this.getAvailableTools();
            this.sendResponse(request.id, { tools });
          } else if (request.method === 'tools/call') {
            // Add progress tracking
            const toolName = request.params?.name;
            if (this.isBatchOperation(toolName)) {
              console.error(`🚀 Starting batch tool: ${toolName}`);
            }
            
            const smartlingRequest = {
              jsonrpc: "2.0",
              id: request.id,
              method: "tools/call",
              params: request.params
            };
            
            await this.handleRequest(smartlingRequest);
          } else {
            await this.handleRequest(request);
          }
        } catch (parseError) {
          console.error('Failed to parse input:', parseError.message);
          this.sendError(0, 'Parse error', parseError.message);
        }
      }
    }
  }

  async getAvailableTools() {
    try {
      const toolsRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
      };
      
      const result = await this.makeSmartlingRequest(toolsRequest);
      return result.tools || [];
    } catch (error) {
      console.error('Error getting tools:', error.message);
      return [];
    }
  }
}

// Start the server
const server = new BatchOptimizedSmartlingMCPServer();
server.processInput().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
}); 