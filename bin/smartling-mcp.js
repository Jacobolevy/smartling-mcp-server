#!/usr/bin/env node

/**
 * 🌟 Smartling MCP Server CLI
 * Complete Smartling translation server for Claude, Cursor & MCP clients
 * 
 * Usage:
 *   smartling-mcp-server [options]
 *   smartling-mcp [options]
 * 
 * Environment Variables:
 *   SMARTLING_USER_IDENTIFIER - Your Smartling User Identifier
 *   SMARTLING_USER_SECRET     - Your Smartling User Secret  
 *   SMARTLING_BASE_URL        - Smartling API base URL (default: https://api.smartling.com)
 */

const path = require('path');
const fs = require('fs');

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🌟 Smartling MCP Server v3.0.0

DESCRIPTION:
  Complete Smartling translation server with 27+ tools for Claude, Cursor, and other MCP clients.

USAGE:
  smartling-mcp-server [options]

OPTIONS:
  --help, -h     Show this help message
  --version, -v  Show version information
  --config       Show configuration status
  --port PORT    Set custom port (default: 3000)

ENVIRONMENT VARIABLES:
  SMARTLING_USER_IDENTIFIER  Your Smartling User Identifier (required)
  SMARTLING_USER_SECRET      Your Smartling User Secret (required)
  SMARTLING_BASE_URL         Smartling API base URL (default: https://api.smartling.com)

EXAMPLES:
  # Start the server
  smartling-mcp-server

  # Start on custom port
  smartling-mcp-server --port 8080

  # Check configuration
  smartling-mcp-server --config

SETUP:
  1. Get your Smartling credentials from https://dashboard.smartling.com
  2. Set environment variables:
     export SMARTLING_USER_IDENTIFIER="your_user_id"
     export SMARTLING_USER_SECRET="your_secret"
  3. Start the server: smartling-mcp-server

MORE INFO:
  GitHub: https://github.com/Jacobolevy/smartling-mcp-server
  Issues: https://github.com/Jacobolevy/smartling-mcp-server/issues
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const packageJson = require('../package.json');
  console.log(`Smartling MCP Server v${packageJson.version}`);
  process.exit(0);
}

if (args.includes('--config')) {
  console.log('\n🔍 Configuration Status:');
  console.log(`   SMARTLING_USER_IDENTIFIER: ${process.env.SMARTLING_USER_IDENTIFIER ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   SMARTLING_USER_SECRET: ${process.env.SMARTLING_USER_SECRET ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   SMARTLING_BASE_URL: ${process.env.SMARTLING_BASE_URL || 'https://api.smartling.com (default)'}`);
  
  if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
    console.log('\n❌ Missing required environment variables!');
    console.log('\n📋 To configure:');
    console.log('   export SMARTLING_USER_IDENTIFIER="your_user_id"');
    console.log('   export SMARTLING_USER_SECRET="your_secret"');
    process.exit(1);
  }
  
  console.log('\n✅ Configuration looks good!');
  process.exit(0);
}

// Check for custom port
let port = 3000;
const portIndex = args.indexOf('--port');
if (portIndex !== -1 && args[portIndex + 1]) {
  port = parseInt(args[portIndex + 1]) || 3000;
}

// Set the port in environment
process.env.PORT = port;

// Start the main server
console.log('🚀 Starting Smartling MCP Server...');
console.log(`📋 Port: ${port}`);
console.log(`🔗 GitHub: https://github.com/Jacobolevy/smartling-mcp-server`);

try {
  require('../src/index.js');
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.log('\n💡 Try running: smartling-mcp-server --config');
  process.exit(1);
} 