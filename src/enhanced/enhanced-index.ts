import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SmartlingClient } from '../smartling-client.js';
import { createEnhancedSmartlingMCP } from './ai-shortcuts.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Enhanced Smartling MCP Server v4.0
 * 
 * New Features:
 * ✅ AI-Powered Shortcuts (@translate, @progress, @costs, @quality, @debug, @insights)
 * ✅ Advanced AI Integration (GPT-4o, o1-preview for complex analysis)
 * ✅ Async Operations with Progress Tracking
 * ✅ Intelligent Cost Analysis & Optimization
 * ✅ Auto-debugging & Health Monitoring
 * ✅ Context-aware AI Insights
 * ✅ Predictive Analytics
 * ✅ Workflow Optimization
 * 
 * Inspired by: Octocode MCP, o3-search MCP, and Claude Code patterns
 */

async function main() {
  // Validate required environment variables
  if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
    throw new Error('SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET environment variables are required');
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not found. AI-powered features will be limited.');
  }

  // Create enhanced MCP server
  const server = new McpServer(
    {
      name: 'smartling-mcp-server-enhanced',
      version: '4.0.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  // Initialize Smartling client
  const smartlingClient = new SmartlingClient({
    userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
    userSecret: process.env.SMARTLING_USER_SECRET,
    baseUrl: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
  });

  // Initialize enhanced MCP with all advanced features
  const enhancedMCP = createEnhancedSmartlingMCP(server, smartlingClient);

  // Add legacy tools for backward compatibility
  await addLegacyTools(server, smartlingClient);

  // Setup graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔄 Graceful shutdown initiated...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 Graceful shutdown initiated...');
    await server.close();
    process.exit(0);
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log('🚀 Enhanced Smartling MCP Server v4.0 started!');
  console.log('✨ New AI-powered shortcuts available:');
  console.log('   @translate - Quick translation with AI enhancement');
  console.log('   @progress - Real-time progress with predictions');
  console.log('   @costs - Intelligent cost analysis & optimization');
  console.log('   @quality - AI quality dashboard & insights');
  console.log('   @debug - Auto-debugging & troubleshooting');
  console.log('   @insights - Advanced AI analysis for complex problems');
  console.log('');
  console.log('🔧 Advanced features:');
  console.log('   • Async bulk operations with progress tracking');
  console.log('   • AI-powered cost optimization suggestions');
  console.log('   • Predictive analytics for project completion');
  console.log('   • Auto-debugging with intelligent issue resolution');
  console.log('   • Context-aware AI insights using GPT-4o/o1-preview');
  console.log('   • Workflow optimization recommendations');
  console.log('');
  console.log('📖 Backward compatible with all existing tools');
}

/**
 * Add legacy tools for backward compatibility
 */
async function addLegacyTools(server: McpServer, smartlingClient: SmartlingClient) {
  // Import and add existing tool groups
  const { addProjectTools } = await import('../tools/projects.js');
  const { addFileTools } = await import('../tools/files.js');
  const { addJobTools } = await import('../tools/jobs.js');
  const { addQualityTools } = await import('../tools/quality.js');
  const { addStringTools } = await import('../tools/strings.js');
  const { addTaggingTools } = await import('../tools/tagging.js');
  const { addGlossaryTools } = await import('../tools/glossary.js');
  const { addWebhookTools } = await import('../tools/webhooks.js');
  const { addLocaleTools } = await import('../tools/locales.js');
  const { addContextTools } = await import('../tools/context.js');
  const { addReportTools } = await import('../tools/reports.js');

  // Add all existing tools
  addProjectTools(server, smartlingClient);
  addFileTools(server, smartlingClient);
  addJobTools(server, smartlingClient);
  addQualityTools(server, smartlingClient);
  addStringTools(server, smartlingClient);
  addTaggingTools(server, smartlingClient);
  addGlossaryTools(server, smartlingClient);
  addWebhookTools(server, smartlingClient);
  addLocaleTools(server, smartlingClient);
  addContextTools(server, smartlingClient);
  addReportTools(server, smartlingClient);

  console.log('✅ Legacy tools loaded (52 tools for backward compatibility)');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start enhanced MCP server:', error);
  process.exit(1);
});