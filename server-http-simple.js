#!/usr/bin/env node

/**
 * Smartling HTTP Server - Para Chat Interno
 * Servidor HTTP simple sin dependencias complejas de MCP
 */

import express from 'express';
import cors from 'cors';
import https from 'https';

const SMARTLING_BACKEND = 'https://smartling-mcp.onrender.com';

class SmartlingHTTPServer {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    this.app.use(express.json({ limit: '50mb' }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'smartling-http-server',
        version: '1.0.0',
        description: 'HTTP server for internal chat platforms',
        backend: SMARTLING_BACKEND,
        endpoints: {
          'GET /health': 'Health check',
          'GET /tools': 'List available tools', 
          'POST /call/:toolName': 'Execute a tool',
          'GET /': 'Documentation'
        },
        timestamp: new Date().toISOString()
      });
    });

    // List tools
    this.app.get('/tools', (req, res) => {
      res.json({
        tools: [
          {
            name: 'smartling_get_projects',
            description: 'Get list of Smartling projects (227 projects from Wix)',
            parameters: {
              accountId: 'string (optional, default: b0f6a896)'
            }
          },
          {
            name: 'smartling_get_account_info', 
            description: 'Get Smartling account information',
            parameters: {}
          },
          {
            name: 'smartling_upload_file',
            description: 'Upload file to Smartling for translation',
            parameters: {
              projectId: 'string (required)',
              fileUri: 'string (required)',
              fileType: 'string (required)',
              content: 'string (required)'
            }
          },
          {
            name: 'smartling_get_file_status',
            description: 'Get translation status of a file',
            parameters: {
              projectId: 'string (required)',
              fileUri: 'string (required)'
            }
          }
        ],
        total: 4,
        backend: SMARTLING_BACKEND
      });
    });

    // Execute tool
    this.app.post('/call/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const args = req.body;

      try {
        console.log(`📞 Calling tool: ${toolName}`, args);
        
        const result = await this.callSmartlingBackend(toolName, args);
        
        res.json({
          success: true,
          tool: toolName,
          result: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`❌ Error calling ${toolName}:`, error.message);
        
        res.status(500).json({
          success: false,
          error: error.message,
          tool: toolName,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Documentation
    this.app.get('/', (req, res) => {
      const host = req.get('host');
      res.json({
        name: 'Smartling HTTP Server for Internal Chat',
        version: '1.0.0',
        description: 'Simple HTTP API for internal chat platforms to access Smartling',
        usage: {
          'List tools': `GET http://${host}/tools`,
          'Call tool': `POST http://${host}/call/{toolName}`,
          'Health check': `GET http://${host}/health`
        },
        examples: {
          'Get projects': {
            method: 'POST',
            url: `http://${host}/call/smartling_get_projects`,
            body: { accountId: 'b0f6a896' }
          },
          'Get account info': {
            method: 'POST', 
            url: `http://${host}/call/smartling_get_account_info`,
            body: {}
          },
          'Upload file': {
            method: 'POST',
            url: `http://${host}/call/smartling_upload_file`,
            body: {
              projectId: 'project-id',
              fileUri: 'chat-content.json',
              fileType: 'json',
              content: '{"message": "Hello world"}'
            }
          }
        },
        backend: SMARTLING_BACKEND,
        tools_available: 4
      });
    });
  }

  async callSmartlingBackend(toolName, args) {
    return new Promise((resolve, reject) => {
      // Set default account ID if needed
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
            if (result.success) {
              resolve(result.result);
            } else {
              reject(new Error(result.error || 'Backend API error'));
            }
          } catch (error) {
            reject(new Error(`Failed to parse backend response: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(new Error(`Backend request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  start(port = 3000) {
    const deploymentPort = parseInt(process.env.PORT || port);
    
    this.app.listen(deploymentPort, '0.0.0.0', () => {
      console.log(`🚀 Smartling HTTP Server running on port ${deploymentPort}`);
      console.log(`📡 API Base URL: http://0.0.0.0:${deploymentPort}`);
      console.log(`🔗 Backend: ${SMARTLING_BACKEND}`);
      console.log(`📋 Tools: 4 available`);
      console.log(`🎯 Perfect for internal chat platforms!`);
      console.log(`📚 Documentation: http://0.0.0.0:${deploymentPort}/`);
    });
  }
}

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SmartlingHTTPServer();
  const port = parseInt(process.env.PORT || '3000');
  
  server.start(port);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
  });
}

export { SmartlingHTTPServer }; 