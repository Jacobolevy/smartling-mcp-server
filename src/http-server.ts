#!/usr/bin/env node

import express, { Request, Response } from 'express';
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

class SmartlingHTTPServer {
  private app: express.Application;
  private smartlingClient: SmartlingClient;
  private allTools: any[];

  constructor() {
    this.app = express();
    
    // Middleware
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        version: '2.0.0',
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
        }))
      });
    });

    // Execute tool
    this.app.post('/execute/:toolName', async (req: Request, res: Response) => {
      const { toolName } = req.params;
      const args = req.body;

      try {
        let result;

        if (projectTools.some(tool => tool.name === toolName)) {
          result = await handleProjectTools(toolName, args, this.smartlingClient);
        } else if (fileTools.some(tool => tool.name === toolName)) {
          result = await handleFileTools(toolName, args, this.smartlingClient);
        } else if (jobTools.some(tool => tool.name === toolName)) {
          result = await handleJobTools(toolName, args, this.smartlingClient);
        } else if (qualityTools.some(tool => tool.name === toolName)) {
          result = await handleQualityTools(toolName, args, this.smartlingClient);
        } else if (taggingTools.some(tool => tool.name === toolName)) {
          result = await handleTaggingTools(toolName, args, this.smartlingClient);
        } else if (glossaryTools.some(tool => tool.name === toolName)) {
          result = await handleGlossaryTools(toolName, args, this.smartlingClient);
        } else if (webhookTools.some(tool => tool.name === toolName)) {
          result = await handleWebhookTools(toolName, args, this.smartlingClient);
        } else {
          return res.status(404).json({ 
            error: `Tool "${toolName}" not found`,
            availableTools: this.allTools.map(t => t.name)
          });
        }

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

    // Batch execute multiple tools
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
          const { tool, args } = operation;
          // Reuse the single tool execution logic
          const response = await this.executeToolInternal(tool, args);
          results.push({ 
            tool, 
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

    // API documentation
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Smartling MCP HTTP Server',
        version: '2.0.0',
        description: 'HTTP API for Smartling Translation Management',
        endpoints: {
          'GET /health': 'Server health check',
          'GET /tools': 'List available tools',
          'POST /execute/:toolName': 'Execute a specific tool',
          'POST /batch': 'Execute multiple tools in batch',
          'GET /': 'This documentation'
        },
        availableTools: this.allTools.length,
        documentation: 'https://github.com/your-repo/smartling-mcp-server'
      });
    });
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

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`🚀 Smartling HTTP Server running on port ${port}`);
      console.log(`📋 Available tools: ${this.allTools.length}`);
      console.log(`🌐 API URL: http://localhost:${port}`);
      console.log(`📚 Documentation: http://localhost:${port}/`);
      console.log(`🔧 Health check: http://localhost:${port}/health`);
    });
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SmartlingHTTPServer();
  const port = parseInt(process.env.PORT || '3000');
  server.start(port);
}

export { SmartlingHTTPServer }; 