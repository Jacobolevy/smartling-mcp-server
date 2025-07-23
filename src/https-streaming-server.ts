#!/usr/bin/env node

import express, { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { SmartlingClient } from './smartling-client.js';
import { projectTools, handleProjectTools } from './tools/projects.js';
import { fileTools, handleFileTools } from './tools/files.js';
import { jobTools, handleJobTools } from './tools/jobs.js';
import { qualityTools, handleQualityTools } from './tools/quality.js';
import { taggingTools, handleTaggingTools } from './tools/tagging.js';
import { glossaryTools, handleGlossaryTools } from './tools/glossary.js';
import { webhookTools, handleWebhookTools } from './tools/webhooks.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface StreamingResponse {
  writeChunk: (data: any) => void;
  end: (finalData?: any) => void;
  error: (error: string) => void;
}

class SmartlingHTTPSStreamingServer {
  private app: express.Application;
  private smartlingClient: SmartlingClient;
  private allTools: any[];
  private httpServer?: http.Server;
  private httpsServer?: https.Server;

  constructor() {
    this.app = express();
    
    // Enhanced middleware for streaming
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
      // Enable streaming for all responses
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      next();
    });

    // Validate required environment variables
    if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
      throw new Error('SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
    }

    this.smartlingClient = new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET,
      baseUrl: process.env.SMARTLING_BASE_URL,
    });

    this.allTools = [
      ...projectTools,
      ...fileTools,
      ...jobTools,
      ...qualityTools,
      ...taggingTools,
      ...glossaryTools,
      ...webhookTools,
    ];

    this.setupRoutes();
  }

  private createStreamingResponse(res: Response): StreamingResponse {
    // Set headers for streaming
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

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        version: '3.0.0',
        https: true,
        streaming: true,
        timestamp: new Date().toISOString()
      });
    });

    // Get available tools
    this.app.get('/tools', (req: Request, res: Response) => {
      res.json({
        tools: this.allTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        })),
        streaming: true,
        https: true
      });
    });

    // Streaming execute tool
    this.app.post('/stream/:toolName', async (req: Request, res: Response) => {
      const { toolName } = req.params;
      const args = req.body;
      const stream = this.createStreamingResponse(res);

      try {
        // Send initial status
        stream.writeChunk({
          status: 'started',
          tool: toolName,
          args: args
        });

        // Execute tool with progress updates
        const result = await this.executeToolWithProgress(toolName, args, stream);
        
        // Send final result
        stream.end({
          status: 'completed',
          tool: toolName,
          result: result
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Streaming tool execution error for ${toolName}:`, errorMessage);
        stream.error(errorMessage);
      }
    });

    // Standard execute tool (non-streaming)
    this.app.post('/execute/:toolName', async (req: Request, res: Response) => {
      const { toolName } = req.params;
      const args = req.body;

      try {
        const result = await this.executeToolInternal(toolName, args);
        
        res.json({ 
          success: true, 
          result,
          tool: toolName,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Tool execution error for ${toolName}:`, errorMessage);
        
        res.status(500).json({
          success: false,
          error: errorMessage,
          tool: toolName,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Streaming batch execute
    this.app.post('/stream-batch', async (req: Request, res: Response) => {
      const { operations } = req.body;
      const stream = this.createStreamingResponse(res);
      
      if (!Array.isArray(operations)) {
        stream.error('operations must be an array');
        return;
      }

      try {
        stream.writeChunk({
          status: 'batch_started',
          total_operations: operations.length
        });

        const results = [];
        
        for (let i = 0; i < operations.length; i++) {
          const operation = operations[i];
          
          try {
            stream.writeChunk({
              status: 'operation_started',
              operation_index: i + 1,
              tool: operation.tool
            });

            const result = await this.executeToolInternal(operation.tool, operation.args);
            
            const operationResult = { 
              tool: operation.tool, 
              success: true, 
              result: result 
            };
            
            results.push(operationResult);
            
            stream.writeChunk({
              status: 'operation_completed',
              operation_index: i + 1,
              result: operationResult
            });
            
          } catch (error) {
            const errorResult = { 
              tool: operation.tool, 
              success: false, 
              error: error instanceof Error ? error.message : String(error)
            };
            
            results.push(errorResult);
            
            stream.writeChunk({
              status: 'operation_failed',
              operation_index: i + 1,
              result: errorResult
            });
          }
        }

        stream.end({
          status: 'batch_completed',
          total_operations: operations.length,
          results: results
        });

      } catch (error) {
        stream.error(error instanceof Error ? error.message : String(error));
      }
    });

    // Batch execute (non-streaming - legacy)
    this.app.post('/batch', async (req: Request, res: Response) => {
      const { operations } = req.body;
      
      if (!Array.isArray(operations)) {
        return res.status(400).json({ 
          error: 'operations must be an array' 
        });
      }

      const results = [];
      
      for (const operation of operations) {
        try {
          const response = await this.executeToolInternal(operation.tool, operation.args);
          results.push({ 
            tool: operation.tool, 
            success: true, 
            result: response 
          });
        } catch (error) {
          results.push({ 
            tool: operation.tool, 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      res.json({ 
        batchResults: results,
        timestamp: new Date().toISOString()
      });
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
        message: 'Connected to Smartling MCP Server events'
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

    // API documentation with streaming info
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Smartling MCP HTTPS Streaming Server',
        version: '3.0.0',
        description: 'HTTPS API with Streaming Support for Smartling Translation Management',
        features: [
          'HTTPS/TLS encryption',
          'Real-time streaming responses',
          'Server-Sent Events (SSE)',
          'Chunked transfer encoding',
          'Progressive tool execution'
        ],
        endpoints: {
          'GET /health': 'Server health check with HTTPS/streaming status',
          'GET /tools': 'List available tools',
          'POST /execute/:toolName': 'Execute a specific tool (standard)',
          'POST /stream/:toolName': 'Execute a specific tool with streaming',
          'POST /batch': 'Execute multiple tools in batch (standard)',
          'POST /stream-batch': 'Execute multiple tools with streaming progress',
          'GET /events': 'Server-Sent Events for real-time updates',
          'GET /': 'This documentation'
        },
        availableTools: this.allTools.length,
        documentation: 'https://github.com/jacobolevy/smartling-mcp-server',
        security: {
          https: true,
          cors: true,
          headers: ['X-Smartling-User-ID', 'X-Smartling-Secret']
        }
      });
    });
  }

  private async executeToolWithProgress(toolName: string, args: any, stream: StreamingResponse): Promise<any> {
    // Add progress tracking to tool execution
    stream.writeChunk({
      status: 'processing',
      tool: toolName,
      message: 'Executing Smartling API call...'
    });

    const result = await this.executeToolInternal(toolName, args);
    
    stream.writeChunk({
      status: 'api_completed',
      tool: toolName,
      message: 'Smartling API call completed'
    });

    return result;
  }

  private async executeToolInternal(toolName: string, args: any): Promise<any> {
    if (projectTools.some(tool => tool.name === toolName)) {
      return await handleProjectTools(toolName, args, this.smartlingClient);
    } else if (fileTools.some(tool => tool.name === toolName)) {
      return await handleFileTools(toolName, args, this.smartlingClient);
    } else if (jobTools.some(tool => tool.name === toolName)) {
      return await handleJobTools(toolName, args, this.smartlingClient);
    } else if (qualityTools.some(tool => tool.name === toolName)) {
      return await handleQualityTools(toolName, args, this.smartlingClient);
    } else if (taggingTools.some(tool => tool.name === toolName)) {
      return await handleTaggingTools(toolName, args, this.smartlingClient);
    } else if (glossaryTools.some(tool => tool.name === toolName)) {
      return await handleGlossaryTools(toolName, args, this.smartlingClient);
    } else if (webhookTools.some(tool => tool.name === toolName)) {
      return await handleWebhookTools(toolName, args, this.smartlingClient);
    } else {
      throw new Error(`Tool "${toolName}" not found`);
    }
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
    this.httpServer.listen(port, () => {
      console.log(`🚀 Smartling HTTP Server running on port ${port}`);
      console.log(`🌐 HTTP URL: http://localhost:${port}`);
    });

    // Start HTTPS server if certificates are available
    if (sslOptions) {
      this.httpsServer = https.createServer(sslOptions, this.app);
      this.httpsServer.listen(httpsPort, () => {
        console.log(`🔒 Smartling HTTPS Server running on port ${httpsPort}`);
        console.log(`🌐 HTTPS URL: https://localhost:${httpsPort}`);
        console.log(`📡 Streaming endpoints available at /stream/:toolName`);
        console.log(`🔄 Server-Sent Events at /events`);
      });
    } else {
      console.log('⚠️  HTTPS not enabled - SSL certificates not found');
      console.log('💡 Run with SSL_GENERATE=true to create self-signed certificates');
    }

    console.log(`📋 Available tools: ${this.allTools.length}`);
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
  const server = new SmartlingHTTPSStreamingServer();
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
}

export { SmartlingHTTPSStreamingServer }; 