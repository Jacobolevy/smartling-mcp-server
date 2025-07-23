#!/usr/bin/env node

/**
 * Smartling MCP Server - HTTPS Streaming Client Examples
 * Demonstrates how to use the streaming HTTPS endpoints
 */

const https = require('https');
const EventSource = require('eventsource'); // npm install eventsource

class SmartlingStreamingClient {
  constructor(baseUrl = 'https://localhost:3443', options = {}) {
    this.baseUrl = baseUrl;
    this.agent = new https.Agent({ 
      rejectUnauthorized: options.rejectUnauthorized !== false 
    });
  }

  /**
   * Execute a Smartling tool with real-time streaming progress
   */
  async executeToolStreaming(toolName, args = {}) {
    const url = `${this.baseUrl}/stream/${toolName}`;
    
    console.log(`🚀 Starting streaming execution of ${toolName}...`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args),
        agent: this.agent
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Try to parse complete JSON chunks
        try {
          const parsed = JSON.parse(buffer);
          if (Array.isArray(parsed)) {
            chunks = parsed;
            buffer = '';
          }
        } catch (e) {
          // Not complete JSON yet, continue reading
          continue;
        }
      }

      // Process all chunks
      for (const chunk of chunks) {
        this.handleStreamChunk(chunk);
      }

      console.log('✅ Streaming execution completed\n');
      return chunks;

    } catch (error) {
      console.error('❌ Streaming execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle individual stream chunks
   */
  handleStreamChunk(chunk) {
    switch (chunk.type) {
      case 'started':
        console.log(`📋 Tool: ${chunk.tool}`);
        console.log(`🕒 Started: ${chunk.timestamp}`);
        if (chunk.args && Object.keys(chunk.args).length > 0) {
          console.log(`📝 Args:`, chunk.args);
        }
        break;

      case 'processing':
        console.log(`⚙️  ${chunk.message}`);
        break;

      case 'completed':
        console.log(`✅ Completed: ${chunk.timestamp}`);
        if (chunk.result) {
          console.log('📊 Result:', JSON.stringify(chunk.result, null, 2));
        }
        break;

      case 'error':
        console.error(`❌ Error: ${chunk.error}`);
        break;

      default:
        console.log(`📦 ${chunk.type}:`, chunk);
    }
  }

  /**
   * Connect to Server-Sent Events for real-time updates
   */
  connectToEvents() {
    const eventSource = new EventSource(`${this.baseUrl}/events`, {
      rejectUnauthorized: this.agent.options.rejectUnauthorized
    });

    console.log('🔗 Connecting to server events...');

    eventSource.onopen = () => {
      console.log('✅ Connected to server events');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerEvent(data);
      } catch (e) {
        console.log('📨 Raw event:', event.data);
      }
    };

    eventSource.onerror = (event) => {
      console.error('❌ SSE Error:', event);
    };

    return eventSource;
  }

  /**
   * Handle server-sent events
   */
  handleServerEvent(data) {
    switch (data.type) {
      case 'connected':
        console.log(`🎯 ${data.message}`);
        break;

      case 'heartbeat':
        console.log('💓 Server heartbeat');
        break;

      default:
        console.log('📡 Server event:', data);
    }
  }

  /**
   * Test server health and capabilities
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        agent: this.agent
      });

      const health = await response.json();
      
      console.log('🏥 Server Health Check:');
      console.log(`   Status: ${health.status}`);
      console.log(`   Version: ${health.version}`);
      console.log(`   HTTPS: ${health.https ? '✅' : '❌'}`);
      console.log(`   Streaming: ${health.streaming ? '✅' : '❌'}`);
      console.log(`   Features:`, health.features?.join(', ') || 'None listed');
      
      return health;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      throw error;
    }
  }
}

// Example usage functions
async function basicStreamingExample() {
  console.log('\n=== Basic Streaming Example ===');
  
  const client = new SmartlingStreamingClient('https://localhost:3443', {
    rejectUnauthorized: false // For self-signed certificates
  });

  // Check server health
  await client.checkHealth();

  // Execute a tool with streaming
  await client.executeToolStreaming('smartling_get_projects', {
    limit: 10
  });
}

async function serverEventsExample() {
  console.log('\n=== Server-Sent Events Example ===');
  
  const client = new SmartlingStreamingClient('https://localhost:3443', {
    rejectUnauthorized: false
  });

  // Connect to server events
  const eventSource = client.connectToEvents();

  // Keep listening for 30 seconds
  setTimeout(() => {
    console.log('🔌 Closing event source connection');
    eventSource.close();
  }, 30000);
}

async function batchStreamingExample() {
  console.log('\n=== Batch Streaming Example ===');
  
  const client = new SmartlingStreamingClient('https://localhost:3443', {
    rejectUnauthorized: false
  });

  // Execute multiple tools in sequence with streaming
  const tools = [
    { name: 'smartling_get_account_info', args: {} },
    { name: 'smartling_get_projects', args: { limit: 5 } },
    { name: 'smartling_diagnostic', args: {} }
  ];

  for (const tool of tools) {
    console.log(`\n--- Executing ${tool.name} ---`);
    await client.executeToolStreaming(tool.name, tool.args);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'basic';

  try {
    switch (command) {
      case 'basic':
        await basicStreamingExample();
        break;

      case 'events':
        await serverEventsExample();
        break;

      case 'batch':
        await batchStreamingExample();
        break;

      case 'health':
        const client = new SmartlingStreamingClient('https://localhost:3443', {
          rejectUnauthorized: false
        });
        await client.checkHealth();
        break;

      default:
        console.log('📖 Usage: node streaming-client-example.js [basic|events|batch|health]');
        console.log('');
        console.log('Examples:');
        console.log('  node streaming-client-example.js basic    # Basic streaming example');
        console.log('  node streaming-client-example.js events   # Server-Sent Events example');
        console.log('  node streaming-client-example.js batch    # Batch streaming example');
        console.log('  node streaming-client-example.js health   # Health check only');
        break;
    }
  } catch (error) {
    console.error('\n💥 Example failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { SmartlingStreamingClient };

// Run if called directly
if (require.main === module) {
  main();
} 