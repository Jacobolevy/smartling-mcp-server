# 🌍 Streaming Deployment Guide

Get your Smartling MCP Server accessible via public HTTP/HTTPS URLs for streaming integration.

## 🚀 Quick Start

### Option 1: One-Command Public Access (Recommended)
```bash
# With ngrok (requires free account)
npm run start:ngrok

# With Cloudflare tunnel (100% free)
npm run start:cloudflare

# With localtunnel (100% free, simple)
npm run start:localtunnel
```

### Option 2: Manual Deployment
```bash
# Build and start locally first
npm run build
npm run start:local

# Then in another terminal, choose your tunnel:
npx ngrok http 3000                    # Ngrok
cloudflared tunnel --url localhost:3000  # Cloudflare
npx localtunnel --port 3000              # Localtunnel
```

## 📊 Tunneling Services Comparison

| Service | Cost | Setup | Reliability | Features |
|---------|------|-------|-------------|----------|
| **Ngrok** | Free tier + Paid | Account required | ⭐⭐⭐⭐⭐ | Custom domains, auth, analytics |
| **Cloudflare** | 100% Free | Binary install | ⭐⭐⭐⭐ | Enterprise grade, fast |
| **Localtunnel** | 100% Free | Zero setup | ⭐⭐⭐ | Simple, quick start |

## 🛠️ Detailed Setup Instructions

### 🟢 Method 1: Ngrok (Recommended for Production)

**Pros:** Most reliable, custom domains, authentication, analytics
**Cons:** Requires account (free tier available)

1. **Install Ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/
   ```

2. **Setup account (one time):**
   ```bash
   ngrok authtoken YOUR_AUTHTOKEN  # Get from ngrok.com/signup
   ```

3. **Deploy:**
   ```bash
   npm run start:ngrok
   ```

4. **Your URLs:**
   ```
   🌍 Public URL: https://abc123.ngrok.io
   📡 Streaming: https://abc123.ngrok.io/stream/:toolName
   🔄 Events: https://abc123.ngrok.io/events
   ```

### 🟦 Method 2: Cloudflare Tunnel (Best Free Option)

**Pros:** 100% free, enterprise-grade, fast
**Cons:** Requires binary installation

1. **Install Cloudflared:**
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Linux
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # Windows: Download from GitHub releases
   ```

2. **Deploy:**
   ```bash
   npm run start:cloudflare
   ```

3. **Your URLs will be shown in terminal:**
   ```
   🌍 Public URL: https://random-words.trycloudflare.com
   📡 Streaming: https://random-words.trycloudflare.com/stream/:toolName
   ```

### 🟡 Method 3: Localtunnel (Quickest Start)

**Pros:** Zero setup, 100% free
**Cons:** Less reliable, random URLs

1. **Deploy (no installation needed):**
   ```bash
   npm run start:localtunnel
   ```

2. **Your URLs:**
   ```
   🌍 Public URL: https://smartling-mcp-youruser.loca.lt
   📡 Streaming: https://smartling-mcp-youruser.loca.lt/stream/:toolName
   ```

   *Note: You may need to click "Continue" on the localtunnel landing page*

## 🔧 Advanced Configuration

### Environment Variables
```bash
# Server configuration
PORT=3000                    # HTTP port
HTTPS_PORT=3443             # HTTPS port (if SSL enabled)
SSL_GENERATE=true           # Auto-generate SSL certificates

# OAuth 2.1 configuration
ENABLE_OAUTH=true           # Enable OAuth 2.1
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-secret

# Smartling credentials
SMARTLING_USER_IDENTIFIER=your-identifier
SMARTLING_USER_SECRET=your-secret
```

### Custom Scripts
```bash
# All available deployment options
npm run deploy:help         # Show all options
npm run start:local         # Local only
npm run start:ssl           # Local with SSL
npm run start:tunnel        # Interactive tunnel selection
npm run start:ngrok         # Force ngrok
npm run start:cloudflare    # Force Cloudflare
npm run start:localtunnel   # Force localtunnel

# Testing
npm run test:streaming      # Test if server is running
curl http://localhost:3000/health  # Health check
```

## 📡 API Endpoints

Once deployed, your public server provides these endpoints:

### Core Endpoints
- `GET /` - API documentation
- `GET /health` - Health check with full status
- `GET /tools` - List all available MCP tools

### MCP Integration
- `POST /tools/call` - Execute MCP tools (standard format)
- `POST /stream/:toolName` - Execute with streaming (SSE or JSON)
- `GET /events` - Server-Sent Events for real-time updates

### OAuth 2.1 (if enabled)
- `/.well-known/oauth-authorization-server` - OAuth metadata
- `/.well-known/authorization` - Authorization endpoint
- `/.well-known/token` - Token endpoint

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-public-url.com/health
```

### 2. List Tools
```bash
curl https://your-public-url.com/tools
```

### 3. Execute a Tool
```bash
curl -X POST https://your-public-url.com/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "smartling_get_projects", "arguments": {"accountId": "your-account"}}'
```

### 4. Test Streaming
```bash
curl https://your-public-url.com/stream/smartling_get_projects \
  -H "Content-Type: application/json" \
  -d '{"accountId": "your-account"}'
```

### 5. Test Server-Sent Events
```bash
curl -N https://your-public-url.com/events
```

## 🌐 Integration Examples

### JavaScript/TypeScript
```javascript
// Standard API call
const response = await fetch('https://your-url.com/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'smartling_get_projects',
    arguments: { accountId: 'your-account' }
  })
});

// Server-Sent Events
const eventSource = new EventSource('https://your-url.com/events');
eventSource.onmessage = event => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Python
```python
import requests
import sseclient

# Standard API call
response = requests.post('https://your-url.com/tools/call', json={
    'name': 'smartling_get_projects',
    'arguments': {'accountId': 'your-account'}
})

# Server-Sent Events
response = requests.get('https://your-url.com/events', stream=True)
client = sseclient.SSEClient(response)
for event in client.events():
    print(f"Received: {event.data}")
```

### cURL Streaming
```bash
# JSON chunked streaming
curl -X POST https://your-url.com/stream/smartling_get_projects?format=json \
  -H "Content-Type: application/json" \
  -d '{"accountId": "your-account"}'

# Server-Sent Events (default)
curl -X POST https://your-url.com/stream/smartling_get_projects \
  -H "Content-Type: application/json" \
  -d '{"accountId": "your-account"}'
```

## 🔒 Security Considerations

### HTTPS
- All tunnel services provide HTTPS automatically
- For local development, use `npm run start:ssl` to generate certificates

### Authentication
- OAuth 2.1 is available (set `ENABLE_OAUTH=true`)
- Smartling credentials are passed via environment variables
- Never commit credentials to version control

### Rate Limiting
- Consider implementing rate limiting for public deployments
- Monitor usage through tunnel service dashboards

## 🚧 Cloud Deployment (Advanced)

For production workloads, consider these cloud platforms:

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway deploy
```

### Heroku
```bash
# Install Heroku CLI
# Create app
heroku create smartling-mcp-server

# Set environment variables
heroku config:set SMARTLING_USER_IDENTIFIER=your-id
heroku config:set SMARTLING_USER_SECRET=your-secret

# Deploy
git push heroku main
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --env SMARTLING_USER_IDENTIFIER=your-id --env SMARTLING_USER_SECRET=your-secret
```

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Jacobolevy/smartling-mcp-server/issues)
- **Documentation:** [README.md](./README.md)
- **OAuth Guide:** [OAUTH_MIGRATION_GUIDE.md](./OAUTH_MIGRATION_GUIDE.md)

## 🎉 Success!

Your Smartling MCP Server is now publicly accessible via HTTP/HTTPS with streaming capabilities!

**Remember to:**
- ✅ Test all endpoints after deployment
- ✅ Monitor your tunnel service usage
- ✅ Keep your Smartling credentials secure
- ✅ Consider OAuth 2.1 for production use 