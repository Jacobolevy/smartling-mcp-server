# 📡 HTTPS Streaming Guide - Smartling MCP Server

Get **real-time streaming responses** and **HTTPS encryption** for your Smartling MCP Server.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install required packages
npm install express cors dotenv

# Optional: Install development dependencies for TypeScript
npm install --save-dev @types/node @types/express @types/cors typescript
```

### 2. Start HTTPS Streaming Server

#### Option A: Auto-generate Self-signed Certificates
```bash
# Generate certificates and start both HTTP + HTTPS
SSL_GENERATE=true node scripts/start-https-streaming.js
```

#### Option B: HTTP Only (for testing)
```bash
# Start HTTP server only
node scripts/start-https-streaming.js
```

#### Option C: Production with Real Certificates
```bash
# Use your own certificates
SSL_CERT_PATH=/path/to/your.cert SSL_KEY_PATH=/path/to/your.key node scripts/start-https-streaming.js
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
# Smartling Credentials
SMARTLING_USER_IDENTIFIER=your_user_identifier
SMARTLING_USER_SECRET=your_user_secret
SMARTLING_BASE_URL=https://api.smartling.com

# Server Configuration
PORT=3000
HTTPS_PORT=3443

# SSL Configuration
SSL_GENERATE=true
SSL_CERT_PATH=./certs/server.cert
SSL_KEY_PATH=./certs/server.key
```

### Package.json Scripts
Add these to your `package.json`:
```json
{
  "scripts": {
    "start:streaming": "node scripts/start-https-streaming.js",
    "start:https": "SSL_GENERATE=true node scripts/start-https-streaming.js",
    "dev:streaming": "SSL_GENERATE=true nodemon scripts/start-https-streaming.js"
  }
}
```

---

## 📡 Streaming Endpoints

### **POST /stream/:toolName** - Execute Tools with Streaming
Real-time progress updates as tools execute.

**Example:**
```bash
curl -X POST https://localhost:3443/stream/smartling_get_projects \
  -H "Content-Type: application/json" \
  -d '{"projectId": "12345"}' \
  -k
```

**Response Format:**
```json
[
  {
    "type": "started",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "tool": "smartling_get_projects",
    "args": {"projectId": "12345"}
  },
  {
    "type": "processing", 
    "timestamp": "2024-01-01T12:00:01.000Z",
    "tool": "smartling_get_projects",
    "message": "Executing Smartling API call..."
  },
  {
    "type": "completed",
    "timestamp": "2024-01-01T12:00:02.000Z",
    "tool": "smartling_get_projects",
    "result": { "projects": [...] }
  }
]
```

### **GET /events** - Server-Sent Events
Long-lived connection for real-time server updates.

**JavaScript Example:**
```javascript
const eventSource = new EventSource('https://localhost:3443/events');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Server event:', data);
};

eventSource.addEventListener('connected', function(event) {
  console.log('Connected to server');
});
```

### **GET /health** - Health Check with Streaming Status
```bash
curl https://localhost:3443/health -k
```

**Response:**
```json
{
  "status": "healthy",
  "version": "3.0.0-streaming",
  "https": true,
  "streaming": true,
  "features": [
    "HTTPS/TLS encryption",
    "Real-time streaming responses",
    "Server-Sent Events (SSE)",
    "Chunked transfer encoding"
  ]
}
```

---

## 🌐 Production Deployment

### Using Railway with HTTPS
1. **Deploy to Railway** as usual
2. **Add environment variables:**
   ```
   SSL_GENERATE=false  # Railway provides HTTPS
   PORT=3000
   ```
3. **Railway automatically provides HTTPS** at your domain

### Using Fly.io with HTTPS
```toml
# fly.toml
[env]
  SSL_GENERATE = "false"  # Fly.io handles HTTPS

[http_service]
  internal_port = 3000
  force_https = true
```

### Using Docker with HTTPS
```dockerfile
# Dockerfile
FROM node:18-alpine

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000 3443

# Generate certificates on startup
ENV SSL_GENERATE=true
CMD ["node", "scripts/start-https-streaming.js"]
```

### Using nginx as HTTPS Proxy
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your.crt;
    ssl_certificate_key /path/to/your.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Disable buffering for streaming
        proxy_buffering off;
        proxy_cache off;
    }
    
    # Special handling for SSE
    location /events {
        proxy_pass http://localhost:3000/events;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

---

## 🧪 Testing Streaming Functionality

### Test Scripts

#### Test Basic Streaming
```bash
#!/bin/bash
echo "Testing streaming endpoint..."
curl -X POST https://localhost:3443/stream/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  -k
```

#### Test Server-Sent Events
```javascript
// test-sse.js
const EventSource = require('eventsource');

const eventSource = new EventSource('https://localhost:3443/events', {
  rejectUnauthorized: false // For self-signed certs
});

eventSource.onmessage = function(event) {
  console.log('Received:', JSON.parse(event.data));
};

eventSource.onerror = function(event) {
  console.error('SSE Error:', event);
};

console.log('Listening for server-sent events...');
```

#### Load Testing with Multiple Streams
```javascript
// load-test-streaming.js
const https = require('https');

async function testConcurrentStreams(count = 5) {
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(
      fetch(`https://localhost:3443/stream/test_${i}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: i }),
        agent: new https.Agent({ rejectUnauthorized: false })
      })
    );
  }
  
  const results = await Promise.all(promises);
  console.log(`${count} concurrent streams completed`);
}

testConcurrentStreams(10);
```

---

## 🔒 Security Considerations

### Production HTTPS
- **Use real certificates** from Let's Encrypt or your CA
- **Disable self-signed certificates** in production
- **Set proper CORS origins** instead of '*'
- **Use environment variables** for sensitive data

### Headers and Security
```javascript
// Enhanced security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### Authentication
```javascript
// Add API key authentication
app.use('/stream', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});
```

---

## 🎯 MCP Client Configuration

### Configure Cursor for HTTPS Streaming
```json
{
  "mcpServers": {
    "smartling-streaming": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://your-domain.com"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_credentials",
        "SMARTLING_USER_SECRET": "your_secret"
      }
    }
  }
}
```

### Configure Claude Desktop for HTTPS
```json
{
  "mcpServers": {
    "smartling-streaming": {
      "command": "node",
      "args": ["/path/to/mcp-https-client.js"],
      "env": {
        "SMARTLING_API_URL": "https://your-domain.com",
        "SMARTLING_USER_IDENTIFIER": "your_credentials",
        "SMARTLING_USER_SECRET": "your_secret"
      }
    }
  }
}
```

---

## 🚨 Troubleshooting

### Certificate Issues
```bash
# Regenerate self-signed certificates
rm -rf ./certs
SSL_GENERATE=true node scripts/start-https-streaming.js
```

### Connection Issues
```bash
# Test HTTPS connectivity
curl -k https://localhost:3443/health

# Test streaming endpoint
curl -k -X POST https://localhost:3443/stream/test -d '{}'
```

### Port Issues
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :3443

# Use different ports
PORT=4000 HTTPS_PORT=4443 node scripts/start-https-streaming.js
```

---

## 🎉 Benefits of HTTPS Streaming

✅ **Real-time progress** - See tool execution progress live  
✅ **HTTPS encryption** - Secure data transmission  
✅ **Better UX** - No waiting for large operations to complete  
✅ **Production ready** - Scales with proper load balancing  
✅ **Standards compliant** - Uses HTTP/1.1 chunked encoding and SSE  
✅ **Framework agnostic** - Works with any HTTP client  

---

*Your Smartling MCP Server now supports enterprise-grade HTTPS streaming! 🚀* 