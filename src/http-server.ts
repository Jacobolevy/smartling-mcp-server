#!/usr/bin/env node

import express from 'express';
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
import { computeAwaitingAuthorization } from './services/awaitingAuthorization.js';

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

// Validate required environment variables
if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
  throw new Error('SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
}

const PORT = process.env.PORT || 3000;
const ENABLE_OAUTH = process.env.ENABLE_OAUTH === 'true';

// OAuth configuration
const oauthConfig: SmartlingOAuthConfig = {
  userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
  userSecret: process.env.SMARTLING_USER_SECRET,
  baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
  enableOAuth: ENABLE_OAUTH,
  clientId: process.env.OAUTH_CLIENT_ID || 'smartling-mcp-server',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || 'default-secret-change-in-production',
  ...(process.env.OAUTH_SERVER_URL && { authServerUrl: process.env.OAUTH_SERVER_URL }),
  tokenExpiry: parseInt(process.env.TOKEN_EXPIRY || '3600'),
};

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply OAuth middleware
app.use(createOAuthMiddleware(oauthConfig));

// Add OAuth routes
const oauthRoutes = createOAuthRoutes(oauthConfig);
Object.entries(oauthRoutes).forEach(([path, handler]) => {
  if (path === '/oauth/token') {
    app.post(path, handler);
  } else if (path === '/oauth/register') {
    app.post(path, handler);
  } else {
    app.get(path, handler);
  }
});

// Create MCP server and tools registry
const mcpServer = new McpServer(
  {
    name: 'smartling-mcp-server',
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Tools registry for HTTP access
interface ToolInfo {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any, extra: any) => Promise<any>;
}

const toolsRegistry = new Map<string, ToolInfo>();

// Helper function to register tools in both MCP server and HTTP registry
function registerTool(name: string, description: string, schema: any, handler: any) {
  mcpServer.tool(name, description, schema, handler);
  toolsRegistry.set(name, { name, description, inputSchema: schema, handler });
}

const smartlingClient = new SmartlingClient({
  userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
  userSecret: process.env.SMARTLING_USER_SECRET,
  baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
});

// Add all tool groups (we'll need to modify the add*Tools functions to use registerTool)
// For now, we'll use the existing approach and handle tools access differently
addProjectTools(mcpServer, smartlingClient);
addFileTools(mcpServer, smartlingClient);
addJobTools(mcpServer, smartlingClient);
addQualityTools(mcpServer, smartlingClient);
addTaggingTools(mcpServer, smartlingClient);
addGlossaryTools(mcpServer, smartlingClient);
addWebhookTools(mcpServer, smartlingClient);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '3.0.0',
    oauth_enabled: ENABLE_OAUTH,
    timestamp: new Date().toISOString()
  });
});

// Awaiting Authorization endpoint
app.get('/projects/:projectId/awaiting-authorization', requireScopes('smartling:read'), async (req, res) => {
  const projectId = req.params.projectId;
  const localesParam = (req.query.locales as string | undefined) || '';
  const filesParam = (req.query.files as string | undefined) || '';
  const targetLocales = localesParam ? localesParam.split(',').map(s => s.trim()).filter(Boolean) : undefined;
  const fileUris = filesParam ? filesParam.split(',').map(s => s.trim()).filter(Boolean) : undefined;

  try {
    const result = await computeAwaitingAuthorization(smartlingClient, projectId, targetLocales, fileUris);
    res.json({
      totalAwaiting: result.totalAwaiting,
      breakdown: result.breakdown,
      meta: {
        ...result.meta,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json({
      error: error?.message || 'Failed to compute awaiting authorization'
    });
  }
});

// MCP endpoints with scope validation
app.post('/mcp/tools/list', requireScopes('smartling:read'), async (req, res) => {
  try {
    // For now, return a hardcoded list since we can't access private MCP server tools
    // In a production implementation, we'd modify the tool registration to maintain a registry
    const tools = [
      { name: 'smartling_get_projects', description: 'Get all projects for a Smartling account' },
      { name: 'smartling_upload_file', description: 'Upload a file to Smartling for translation' },
      { name: 'smartling_get_file_status', description: 'Get the translation status of a file' },
      // Add more tools as needed
    ];
    
    res.json({
      jsonrpc: '2.0',
      id: req.body.id || 1,
      result: { tools }
    });
  } catch (error) {
    console.error('Tools list error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || 1,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    });
  }
});

app.post('/mcp/tools/call', requireScopes('smartling:read', 'smartling:write'), async (req, res): Promise<void> => {
  try {
    const { name, arguments: args } = req.body.params || {};
    
    if (!name) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: req.body.id || 1,
        error: {
          code: -32602,
          message: 'Invalid params: tool name is required'
        }
      });
      return;
    }
    
    // For now, return a placeholder response
    // In a production implementation, we'd execute the actual tool
    res.json({
      jsonrpc: '2.0',
      id: req.body.id || 1,
      result: {
        content: [{
          type: 'text',
          text: `Tool ${name} called with args: ${JSON.stringify(args)}`
        }]
      }
    });
  } catch (error) {
    console.error('Tool call error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || 1,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    });
  }
});

// Protected resource metadata (RFC 9727)
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: `http://localhost:${PORT}`,
    authorization_servers: [
      oauthConfig.authServerUrl || `http://localhost:${PORT}`
    ],
    scopes_supported: [
      'smartling:read',
      'smartling:write',
      'smartling:admin',
      'smartling:files:read',
      'smartling:files:write',
      'smartling:projects:read',
      'smartling:jobs:read',
      'smartling:jobs:write'
    ],
    bearer_methods_supported: ['header'],
    resource_documentation: 'https://github.com/Jacobolevy/smartling-mcp-server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smartling MCP Server listening on port ${PORT}`);
  console.log(`📚 OAuth enabled: ${ENABLE_OAUTH}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 OAuth metadata: http://localhost:${PORT}/.well-known/oauth-authorization-server`);
  console.log(`🛡️  Resource metadata: http://localhost:${PORT}/.well-known/oauth-protected-resource`);
});

export default app; 