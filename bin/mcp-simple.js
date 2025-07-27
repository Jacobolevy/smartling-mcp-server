#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Main entry point for Smartling MCP Server
  console.error('🚀 Starting Smartling MCP Server...');

  // Change to the project directory to ensure proper module loading
  const projectDir = path.join(__dirname, '..');
  process.chdir(projectDir);

  // Load environment variables from .env file FIRST
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    console.error('✅ Environment variables loaded');
  } catch (e) {
    // dotenv not available, continue with existing environment
    console.error('⚠️  dotenv not available, using system environment:', e.message);
  }

  // Check environment variables AFTER loading dotenv
  if (!process.env.SMARTLING_USER_IDENTIFIER || !process.env.SMARTLING_USER_SECRET) {
    console.error('❌ Missing required environment variables:');
    console.error('   SMARTLING_USER_IDENTIFIER and SMARTLING_USER_SECRET must be set');
    console.error('');
    console.error('💡 Create a .env file with:');
    console.error('   SMARTLING_USER_IDENTIFIER=your_user_id');
    console.error('   SMARTLING_USER_SECRET=your_secret');
    process.exit(1);
  }

  try {
    // Try to register ts-node for TypeScript support with ESM support
    const tsNode = await import('ts-node');
    tsNode.register({
      esm: true,
      experimentalSpecifierResolution: 'node'
    });
    console.error('✅ TypeScript support loaded');
  } catch (error) {
    // Fallback to compiling TypeScript
    console.error('⚠️  ts-node setup failed, compiling TypeScript...');
    
    const { execSync } = await import('child_process');
    try {
      execSync('npx tsc', { stdio: 'inherit' });
      console.error('✅ TypeScript compiled successfully');
    } catch (compileError) {
      console.error('❌ TypeScript compilation failed');
      process.exit(1);
    }
  }

  async function startServer() {
    try {
      // Try to load the compiled JavaScript file first
      let serverPath;
      
      const fs = await import('fs');
      if (fs.existsSync(path.join(__dirname, '..', 'dist', 'index.js'))) {
        serverPath = path.join(__dirname, '..', 'dist', 'index.js');
        console.error(`📂 Loading compiled server from: ${serverPath}`);
      } else {
        serverPath = path.join(__dirname, '..', 'src', 'index.ts');
        console.error(`📂 Loading TypeScript server from: ${serverPath}`);
      }
      
      // Import and start the server
      await import(serverPath);
      console.error('✅ Smartling MCP Server loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      console.error('');
      console.error('🔧 Troubleshooting:');
      console.error('1. Run: npm install');
      console.error('2. Ensure ts-node is installed: npm install -g ts-node');
      console.error('3. Or compile TypeScript: npx tsc');
      console.error('4. Check your credentials');
      console.error('');
      console.error('Full error:', error.stack);
      process.exit(1);
    }
  }

  // Start the server (ts-node is already registered above)
  await startServer();
}

// Execute main function
main().catch(error => {
  console.error('❌ Failed to start Smartling MCP Server:', error);
  process.exit(1);
}); 