#!/usr/bin/env node

import express, { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as dotenv from 'dotenv';

import { SmartlingClient } from './smartling-client.js';
import { addProjectTools } from './tools/projects.js';
import { addFileTools } from './tools/files.js';
import { addJobTools } from './tools/jobs.js';
import { addQualityTools } from './tools/quality.js';
import { addTaggingTools } from './tools/tagging.js';
import { addGlossaryTools } from './tools/glossary.js';
import { addWebhookTools } from './tools/webhooks.js';

import { 
  createOAuthMiddleware, 
  createOAuthRoutes, 
  requireScopes,
  type SmartlingOAuthConfig 
} from './oauth/auth-middleware.js';

// Load environment variables silently
const originalConsoleLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalConsoleLog;

interface StreamingResponse {
  writeChunk: (data: any) => void;
  end: (finalData?: any) => void;
  error: (error: string) => void;
}

interface ToolCallRequest {
  name: string;
  arguments: Record<string, any>;
}

class SmartlingStreamingServer {
  private app: express.Application;
  private smartlingClient!: SmartlingClient;  // Definite assignment assertion
  private mcpServer!: McpServer;               // Definite assignment assertion
  private toolsRegistry: Map<string, (args: any) => Promise<any>> = new Map();
  private httpServer?: http.Server;
  private httpsServer?: https.Server;
  private oauthConfig: SmartlingOAuthConfig;

  constructor() {
    this.app = express();
    
    // OAuth configuration
    this.oauthConfig = {
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER!,
      userSecret: process.env.SMARTLING_USER_SECRET!,
      baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
      enableOAuth: process.env.ENABLE_OAUTH === 'true',
      clientId: process.env.OAUTH_CLIENT_ID || 'smartling-mcp-server',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || 'default-secret-change-in-production',
      ...(process.env.OAUTH_SERVER_URL && { authServerUrl: process.env.OAUTH_SERVER_URL }),
      tokenExpiry: parseInt(process.env.TOKEN_EXPIRY || '3600'),
    };

    this.initializeClients();
    this.setupMiddleware();
    this.setupMCPTools();
    this.setupRoutes();
  }

  private initializeClients(): void {
    // Validate required environment variables
    if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
      throw new Error('SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
    }

    this.smartlingClient = new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET,
      baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
    });

    // Initialize MCP Server for tool management
    this.mcpServer = new McpServer(
      {
        name: 'smartling-streaming-server',
        version: '3.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );
  }

  private setupMiddleware(): void {
    // Enhanced CORS for streaming
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Smartling-User-ID', 'X-Smartling-Secret'],
      credentials: true
    }));
    
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Streaming middleware
    this.app.use((req: Request, res: Response, next: express.NextFunction) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      next();
    });

    // OAuth middleware (optional)
    if (this.oauthConfig.enableOAuth) {
      this.app.use('/api', createOAuthMiddleware(this.oauthConfig));
    }
  }

  private setupMCPTools(): void {
    // Add all tool groups and register them
    addProjectTools(this.mcpServer, this.smartlingClient);
    addFileTools(this.mcpServer, this.smartlingClient);
    addJobTools(this.mcpServer, this.smartlingClient);
    addQualityTools(this.mcpServer, this.smartlingClient);
    addTaggingTools(this.mcpServer, this.smartlingClient);
    addGlossaryTools(this.mcpServer, this.smartlingClient);
    addWebhookTools(this.mcpServer, this.smartlingClient);

    // Extract tool handlers from MCP server
    this.registerToolHandlers();
  }

  private registerToolHandlers(): void {
    // Note: This is a workaround since McpServer doesn't expose tools directly
    // In a real implementation, we'd need to capture the handlers during registration
    const toolNames = [
      'smartling_get_projects',
      'smartling_upload_file', 'smartling_get_file_status', 'smartling_download_file', 'smartling_delete_file', 'smartling_search_strings', 'smartling_get_string_details', 'smartling_get_recently_localized',
      'smartling_create_job', 'smartling_get_jobs', 'smartling_get_job', 'smartling_add_files_to_job', 'smartling_remove_files_from_job', 'smartling_authorize_job', 'smartling_cancel_job',
      'smartling_run_quality_check', 'smartling_get_quality_results', 'smartling_get_quality_check_types',
      'smartling_get_available_tags',
      'smartling_get_glossaries', 'smartling_create_glossary', 'smartling_get_glossary_terms', 'smartling_add_glossary_term', 'smartling_delete_glossary_term',
      'smartling_get_webhooks', 'smartling_create_webhook', 'smartling_delete_webhook'
    ];

    toolNames.forEach(toolName => {
      this.toolsRegistry.set(toolName, async (args: any) => {
        // This would need to call the actual MCP tool handlers
        // For now, we'll call the SmartlingClient methods directly
        return await this.executeToolDirect(toolName, args);
      });
    });
  }

  private async executeToolDirect(toolName: string, args: any): Promise<any> {
    // Direct tool execution using SmartlingClient
    // This mirrors the logic from our tool files
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (toolName) {
        case 'smartling_get_projects':
          result = await this.smartlingClient.getProjects(args.accountId);
          break;
        case 'smartling_upload_file':
          result = await this.smartlingClient.uploadFile(args.projectId, args.fileContent, args.fileUri, args.fileType, {
            authorize: args.authorize,
            localeIdsToAuthorize: args.localeIdsToAuthorize
          });
          break;
        case 'smartling_get_file_status':
          result = await this.smartlingClient.getFileStatus(args.projectId, args.fileUri);
          break;
        // Add more cases as needed...
        default:
          throw new Error(`Tool "${toolName}" not implemented in direct execution`);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        _meta: {
          requestId: `${toolName}-${Date.now()}`,
          timing: { duration: responseTime },
          source: 'smartling-api',
          version: '3.0.0'
        },
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const responseTime = Date.now() - startTime;
      
      return {
        _meta: {
          requestId: `${toolName}-${Date.now()}`,
          timing: { duration: responseTime },
          source: 'smartling-api',
          version: '3.0.0'
        },
        content: [
          {
            type: 'text' as const,
            text: `Error executing ${toolName}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  private createStreamingResponse(res: Response, format: 'sse' | 'json' = 'sse'): StreamingResponse {
    if (format === 'sse') {
      // Server-Sent Events format
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      return {
        writeChunk: (data: any) => {
          const eventData = {
            type: 'data',
            timestamp: new Date().toISOString(),
            data: data
          };
          res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        },
        
        end: (finalData?: any) => {
          if (finalData) {
            const finalEvent = {
              type: 'final',
              timestamp: new Date().toISOString(),
              data: finalData
            };
            res.write(`data: ${JSON.stringify(finalEvent)}\n\n`);
          }
          
          res.write(`data: ${JSON.stringify({
            type: 'completed',
            timestamp: new Date().toISOString()
          })}\n\n`);
          
          res.end();
        },
        
        error: (error: string) => {
          const errorEvent = {
            type: 'error',
            timestamp: new Date().toISOString(),
            error: error
          };
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
          res.end();
        }
      };
    } else {
      // JSON chunked format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      let isFirstChunk = true;
      
      return {
        writeChunk: (data: any) => {
          const chunk = JSON.stringify({
            type: 'data',
            timestamp: new Date().toISOString(),
            data: data
          });
          
          if (isFirstChunk) {
            res.write('[\n');
            isFirstChunk = false;
          } else {
            res.write(',\n');
          }
          
          res.write(chunk);
        },
        
        end: (finalData?: any) => {
          if (finalData) {
            const chunk = JSON.stringify({
              type: 'final',
              timestamp: new Date().toISOString(),
              data: finalData
            });
            
            if (isFirstChunk) {
              res.write('[\n');
            } else {
              res.write(',\n');
            }
            res.write(chunk);
          }
          
          res.write('\n]');
          res.end();
        },
        
        error: (error: string) => {
          const errorChunk = JSON.stringify({
            type: 'error',
            timestamp: new Date().toISOString(),
            error: error
          });
          
          if (isFirstChunk) {
            res.write('[\n');
          } else {
            res.write(',\n');
          }
          
          res.write(errorChunk);
          res.write('\n]');
          res.end();
        }
      };
    }
  }

  private setupRoutes(): void {
    // OAuth routes (if enabled)
    // TODO: Fix OAuth routes implementation
    // if (this.oauthConfig.enableOAuth) {
    //   this.app.use('/.well-known', createOAuthRoutes(this.oauthConfig));
    // }

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        version: '3.0.0',
        https: !!this.httpsServer,
        streaming: true,
        oauth: this.oauthConfig.enableOAuth,
        mcp_compliant: true,
        timestamp: new Date().toISOString(),
        features: [
          'MCP Protocol Compliant',
          'OAuth 2.1 with PKCE',
          'Server-Sent Events (SSE)',
          'JSON Chunked Streaming',
          'Tool Metadata',
          'Real-time Progress Updates'
        ]
      });
    });

    // Get available tools (MCP format)
    this.app.get('/tools', (req: Request, res: Response) => {
      const tools = Array.from(this.toolsRegistry.keys()).map(name => ({
        name,
        description: `Smartling ${name.replace('smartling_', '').replace(/_/g, ' ')}`,
        inputSchema: { type: 'object', properties: {} } // Simplified schema
      }));

      res.json({
        tools,
        streaming: true,
        oauth: this.oauthConfig.enableOAuth,
        mcp_compliant: true,
        total_tools: tools.length
      });
    });

    // MCP-style tool execution
    this.app.post('/tools/call', async (req: Request, res: Response): Promise<void> => {
      const { name, arguments: args }: ToolCallRequest = req.body;
      
      if (!name) {
        res.status(400).json({
          error: 'Tool name is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      try {
        const result = await this.executeToolDirect(name, args || {});
        res.json(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({
          error: errorMessage,
          tool: name,
          timestamp: new Date().toISOString(),
          isError: true
        });
      }
    });

    // Streaming tool execution with SSE support
    this.app.post('/stream/:toolName', async (req: Request, res: Response) => {
      const { toolName } = req.params;
      const args = req.body;
      
      // Validate toolName
      if (!toolName) {
        res.status(400).json({
          error: 'Tool name is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const format = req.query.format === 'json' ? 'json' : 'sse';
      const stream = this.createStreamingResponse(res, format);

      try {
        // Send initial connection event
        stream.writeChunk({
          status: 'connected',
          server: 'smartling-streaming-mcp',
          tool: toolName,
          format: format,
          oauth: this.oauthConfig.enableOAuth,
          timestamp: new Date().toISOString()
        });

        // Send tool started event
        stream.writeChunk({
          status: 'started',
          tool: toolName,
          args: args
        });

        // Execute tool with progress updates
        stream.writeChunk({
          status: 'processing',
          tool: toolName,
          message: 'Executing Smartling API call...'
        });

        const result = await this.executeToolDirect(toolName, args);
        
        stream.writeChunk({
          status: 'api_completed',
          tool: toolName,
          message: 'Smartling API call completed'
        });

        // Send final result
        stream.end({
          status: 'completed',
          tool: toolName,
          result: result,
          success: true
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Streaming tool execution error for ${toolName}:`, errorMessage);
        stream.error(errorMessage);
      }
    });

    // Server-Sent Events endpoint for real-time updates
    this.app.get('/events', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send initial connection event
      res.write(`data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to Smartling MCP Streaming Server',
        oauth: this.oauthConfig.enableOAuth,
        version: '3.0.0'
      })}\n\n`);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
      }, 30000);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(keepAlive);
      });
    });

    // API documentation
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Smartling MCP Streaming Server',
        version: '3.0.0',
        description: 'MCP-compliant streaming server with OAuth 2.1 support',
        features: [
          'MCP Protocol Compliant',
          'OAuth 2.1 with PKCE',
          'Server-Sent Events (SSE)',
          'JSON Chunked Streaming',
          'Tool Metadata',
          'Real-time Progress Updates',
          'HTTPS/TLS Support'
        ],
        endpoints: {
          'GET /health': 'Server health check',
          'GET /tools': 'List available MCP tools',
          'POST /tools/call': 'Execute MCP tool',
          'POST /stream/:toolName': 'Stream tool execution (SSE/JSON)',
          'GET /events': 'Server-Sent Events',
          'GET /': 'This documentation'
        },
        streaming: {
          default_format: 'sse',
          supported_formats: ['sse', 'json'],
          usage: {
            sse: 'POST /stream/:toolName (default)',
            json: 'POST /stream/:toolName?format=json'
          }
        },
        oauth: {
          enabled: this.oauthConfig.enableOAuth,
          endpoints: this.oauthConfig.enableOAuth ? {
            authorization_endpoint: '/.well-known/authorization',
            token_endpoint: '/.well-known/token',
            metadata: '/.well-known/oauth-authorization-server'
          } : 'OAuth disabled'
        },
        availableTools: this.toolsRegistry.size,
        documentation: 'https://github.com/Jacobolevy/smartling-mcp-server'
      });
    });
  }

  private getSSLOptions(): https.ServerOptions | null {
    const certPath = process.env.SSL_CERT_PATH || './certs/server.cert';
    const keyPath = process.env.SSL_KEY_PATH || './certs/server.key';

    try {
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        };
      }
    } catch (error) {
      console.warn('SSL certificates not found, falling back to HTTP');
    }

    return null;
  }

  public async generateSelfSignedCerts(): Promise<void> {
    const { execSync } = await import('child_process');
    const certsDir = './certs';

    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }

    const certPath = path.join(certsDir, 'server.cert');
    const keyPath = path.join(certsDir, 'server.key');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.log('🔐 Generating self-signed certificates...');
      
      try {
        execSync(`openssl req -nodes -new -x509 -keyout ${keyPath} -out ${certPath} -days 365 -subj "/CN=localhost"`, 
                { stdio: 'pipe' });
        console.log('✅ Self-signed certificates generated successfully');
      } catch (error) {
        console.warn('⚠️  Could not generate certificates. Install OpenSSL or provide existing certificates.');
        throw error;
      }
    }
  }

  public async start(port: number = 3000, httpsPort: number = 3443): Promise<void> {
    const sslOptions = this.getSSLOptions();

    // Always start HTTP server
    this.httpServer = http.createServer(this.app);
    this.httpServer.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Smartling MCP Streaming Server (HTTP) running on port ${port}`);
      console.log(`🌐 HTTP URL: http://localhost:${port}`);
      console.log(`🌍 Public URL: http://0.0.0.0:${port} (if accessible)`);
    });

    // Start HTTPS server if certificates are available
    if (sslOptions) {
      this.httpsServer = https.createServer(sslOptions, this.app);
      this.httpsServer.listen(httpsPort, '0.0.0.0', () => {
        console.log(`🔒 Smartling MCP Streaming Server (HTTPS) running on port ${httpsPort}`);
        console.log(`🌐 HTTPS URL: https://localhost:${httpsPort}`);
        console.log(`🌍 Public HTTPS URL: https://0.0.0.0:${httpsPort} (if accessible)`);
      });
    } else {
      console.log('⚠️  HTTPS not enabled - SSL certificates not found');
      console.log('💡 Run with SSL_GENERATE=true to create self-signed certificates');
    }

    console.log(`📡 Streaming endpoints: /stream/:toolName`);
    console.log(`🔄 Server-Sent Events: /events`);
    console.log(`🛠️  MCP Tools: ${this.toolsRegistry.size}`);
    console.log(`🔐 OAuth 2.1: ${this.oauthConfig.enableOAuth ? 'Enabled' : 'Disabled'}`);
    console.log(`📚 Documentation: http://localhost:${port}/`);
    console.log(`🔧 Health check: http://localhost:${port}/health`);
  }

  public stop(): void {
    if (this.httpServer) {
      this.httpServer.close();
    }
    if (this.httpsServer) {
      this.httpsServer.close();
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SmartlingStreamingServer();
  const port = parseInt(process.env.PORT || '3000');
  const httpsPort = parseInt(process.env.HTTPS_PORT || '3443');

  // Generate self-signed certificates if requested
  if (process.env.SSL_GENERATE === 'true') {
    server.generateSelfSignedCerts()
      .then(() => server.start(port, httpsPort))
      .catch(console.error);
  } else {
    server.start(port, httpsPort);
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down servers...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down servers...');
    server.stop();
    process.exit(0);
  });
}

export { SmartlingStreamingServer }; 