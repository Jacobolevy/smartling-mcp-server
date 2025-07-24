# 🚀 Deployment Guide - Smartling MCP Server

This guide explains how to make your Smartling MCP server available via HTTP URL, without needing to maintain local folders.

## 🚂 **Option 1: Railway**

1. **Fork the repo on GitHub**
2. **Connect with Railway:**
   - Go to https://railway.app
   - Connect GitHub
   - Deploy from repo
3. **Configure variables:**
   ```bash
   SMARTLING_USER_IDENTIFIER=your_id
   SMARTLING_USER_SECRET=your_secret
   PORT=3000
   ```

## 🐳 **Option 2: Docker (Any hosting)**

```bash
# Build image
docker build -t smartling-mcp-server .

# Run container
docker run -p 3000:3000 \
  -e SMARTLING_USER_IDENTIFIER=your_id \
  -e SMARTLING_USER_SECRET=your_secret \
  smartling-mcp-server
```

### Deploy to Docker registries:
- **Google Cloud Run**
- **AWS ECS**
- **Azure Container Instances**
- **DigitalOcean Apps**

## 🏠 **Option 3: Traditional Hosting**

For any VPS/hosting with Node.js:

```bash
# On your server
git clone https://github.com/your-user/smartling-mcp-server.git
cd smartling-mcp-server
npm install
npm run build

# Configure .env
echo "SMARTLING_USER_IDENTIFIER=your_id" > .env
echo "SMARTLING_USER_SECRET=your_secret" >> .env

# Use PM2 for maintenance
npm install -g pm2
pm2 start dist/http-server.js --name smartling-mcp
pm2 startup
pm2 save
```

## 📋 **Available URLs and Endpoints**

Once deployed, your API will have these endpoints:

```bash
# Documentation
GET https://your-url.com/

# Health check
GET https://your-url.com/health

# List tools
GET https://your-url.com/tools

# Execute tools
POST https://your-url.com/execute/smartling_get_projects
POST https://your-url.com/execute/smartling_upload_file
# ... all other tools

# Batch execution
POST https://your-url.com/batch
```

## 🔧 **Configure Cursor with HTTP API**

### Option A: Via Custom HTTP Client
```json
{
  "mcp.servers": {
    "smartling-http": {
      "command": "node",
      "args": ["/path/to/http-client.js"],
      "env": {
        "SMARTLING_API_URL": "https://your-app.railway.app"
      }
    }
  }
}
```

### Option B: Wrapper Script
Create a script that makes HTTP calls:

```javascript
// http-wrapper.js
const API_URL = process.env.SMARTLING_API_URL;

async function callTool(toolName, args) {
  const response = await fetch(`${API_URL}/execute/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  return response.json();
}
```

## 🔄 **Advantages of HTTP Deployment**

### ✅ **For you:**
- ❌ **No need to maintain local folder**
- ❌ **No need to keep your computer on**
- ✅ **Available 24/7 from anywhere**
- ✅ **Automatic updates via GitHub**
- ✅ **Automatic cloud backups**

### ✅ **For other users:**
- ❌ **No need to install anything locally**
- ❌ **No need for Node.js**
- ❌ **No need to compile code**
- ✅ **Just configure the URL in Cursor**
- ✅ **Always the latest version**

## 🔐 **Security**

### Secure environment variables:
- ✅ Credentials never in code
- ✅ Encrypted variables on hosting platforms
- ✅ Automatic HTTPS
- ✅ CORS properly configured

### For shared usage:
```bash
# Each user can use THEIR credentials via headers
POST https://your-app.com/execute/tool
Headers:
  X-Smartling-User-ID: their_user_id
  X-Smartling-Secret: their_secret
```

## 📊 **Costs**

- **Railway:** Free $5/month credit
- **Docker hosting:** From $5-10/month
- **Basic VPS:** From $3-5/month

## 🎯 **Final Recommendation**

**For personal use:** Railway (easy, free tier)
**For teams:** Docker on VPS
**For enterprises:** Docker on own infrastructure

With any of these options, you'll never need to maintain local files again! 🌟 