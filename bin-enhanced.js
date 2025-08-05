#!/usr/bin/env node

/**
 * Enhanced Smartling MCP Server v4.0 - Binary Entry Point
 * 
 * This binary automatically chooses between enhanced and legacy mode
 * based on available features and configuration.
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if enhanced build exists
const enhancedPath = join(__dirname, 'dist', 'enhanced', 'enhanced-index.js');
const legacyPath = join(__dirname, 'dist', 'index.js');

// Determine which version to run
let serverPath;
let serverVersion;

if (existsSync(enhancedPath)) {
  // Enhanced version available
  serverPath = enhancedPath;
  serverVersion = 'Enhanced v4.0';
  
  // Check if AI features should be enabled
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  
  if (!hasOpenAI) {
    console.error('🤖 Note: OpenAI API key not found. AI features will be limited.');
    console.error('   Add OPENAI_API_KEY to enable @translate, @insights, @debug, and other AI shortcuts.');
    console.error('');
  }
  
} else if (existsSync(legacyPath)) {
  // Fall back to legacy version
  serverPath = legacyPath;
  serverVersion = 'Legacy v3.3';
  console.error('⚠️  Running legacy version. Run "npm run build:enhanced" for v4.0 features.');
  console.error('');
  
} else {
  console.error('❌ No server build found. Please run "npm run build" or "npm run build:enhanced"');
  process.exit(1);
}

// Environment validation
if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
  console.error('❌ Missing required Smartling credentials:');
  console.error('   SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET must be set');
  console.error('');
  console.error('💡 Setup help:');
  console.error('   1. Copy .env file: cp config-example.env .env');
  console.error('   2. Edit .env with your credentials');
  console.error('   3. Get credentials: https://dashboard.smartling.com/settings/api');
  console.error('');
  process.exit(1);
}

// Launch message
console.error(`🚀 Starting Smartling MCP Server (${serverVersion})...`);

if (serverVersion.includes('Enhanced')) {
  const hasAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  console.error(`✨ Features: 68+ tools, AI shortcuts ${hasAI ? 'enabled' : 'disabled'}`);
} else {
  console.error('📦 Features: 52 tools (upgrade to Enhanced for AI features)');
}

console.error('');

// Dynamic import and run
try {
  await import(serverPath);
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('');
  console.error('🔧 Troubleshooting:');
  console.error('   • Verify Node.js version (18+ required)');
  console.error('   • Check build status: npm run build:enhanced');
  console.error('   • Test credentials: npm run test:connection');
  console.error('   • Get help: https://github.com/Jacobolevy/smartling-mcp-server/issues');
  process.exit(1);
}