# 🏢 Smartling HTTP Server - Internal Deployment

**Solution to avoid corporate proxy errors**

## ❌ Problem this solves:
- `Connection Error: Failed to connect via proxy`
- Corporate firewalls that block external connections
- Proxy policies that prevent access to Render.com

## ✅ Solution:
Deploy the Smartling HTTP server **within your corporate infrastructure**

---

## 🚀 Quick Deployment

### Prerequisites:
- Docker installed
- Smartling credentials
- Access to internal company server

### Step 1: Configure credentials
```bash
# Configure environment variables
export SMARTLING_USER_ID="your-user-id"
export SMARTLING_SECRET="your-secret"
export SMARTLING_PROJECT_ID="your-project-id"
```

### Step 2: Automatic deployment
```bash
# Execute deployment script
./deploy-internal.sh
```

### Step 3: Verify functionality
```bash
# Health check
curl http://localhost:3000/health

# View available tools
curl http://localhost:3000/tools
```

---

## 🎯 Use in your Internal Chat

### Internal URL:
```
http://YOUR-INTERNAL-SERVER:3000
```

### Usage examples:

#### JavaScript:
```javascript
// Change external URL to internal
const SMARTLING_URL = 'http://internal-server:3000';

async function callSmartling(toolName, args = {}) {
  const response = await fetch(`${SMARTLING_URL}/call/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  return await response.json();
}

// No proxy issues ✅
const projects = await callSmartling('smartling_get_projects');
```

#### Python:
```python
# No proxy configuration needed
SMARTLING_URL = 'http://internal-server:3000'

def call_smartling(tool_name, args={}):
    response = requests.post(
        f"{SMARTLING_URL}/call/{tool_name}",
        json=args
    )
    return response.json()

# Works without proxy ✅
projects = call_smartling('smartling_get_projects')
```

---

## 🐳 Advanced Deployment

### Docker Compose:
```yaml
version: '3.8'
services:
  smartling-http:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SMARTLING_USER_ID=${SMARTLING_USER_ID}
      - SMARTLING_SECRET=${SMARTLING_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smartling-http-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: smartling-http
  template:
    metadata:
      labels:
        app: smartling-http
    spec:
      containers:
      - name: smartling-http
        image: smartling-http-internal
        ports:
        - containerPort: 3000
        env:
        - name: SMARTLING_USER_ID
          valueFrom:
            secretKeyRef:
              name: smartling-secret
              key: user-id
        - name: SMARTLING_SECRET
          valueFrom:
            secretKeyRef:
              name: smartling-secret
              key: secret
```

---

## 🔧 Advanced Configuration

### Environment variables:
```bash
SMARTLING_USER_ID=your-user-id          # Required
SMARTLING_SECRET=your-secret            # Required  
SMARTLING_PROJECT_ID=your-project-id    # Optional
PORT=3000                               # Server port
NODE_ENV=production                     # Environment
```

### Internal network:
```bash
# For access from other internal servers
docker run -d \
  --name smartling-http \
  --network=company-network \
  -p 3000:3000 \
  smartling-http-internal
```

---

## 📊 Monitoring

### Real-time logs:
```bash
docker logs -f smartling-http-server
```

### Metrics:
```bash
# Automatic health check
curl http://localhost:3000/health

# Tool status
curl http://localhost:3000/tools | jq '.total_tools'
```

---

## 🆘 Support

### Common issues:

#### 1. Container doesn't start:
```bash
# Check logs
docker logs smartling-http-server

# Check environment variables
docker exec smartling-http-server env | grep SMARTLING
```

#### 2. Doesn't respond on port:
```bash
# Check port
docker port smartling-http-server

# Check process
docker exec smartling-http-server ps aux
```

#### 3. Smartling connection errors:
```bash
# Check credentials
curl -X POST http://localhost:3000/call/smartling_get_account_info \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## ✅ Advantages of Internal Deployment:

- 🚫 **No proxy errors**
- 🔒 **Data within corporate network**
- ⚡ **Minimal latency**
- 🛡️ **Total security control**
- 📈 **Internal scalability**

---

## 📞 Contact:

**For technical support:**
- Check container logs
- Review network configuration
- Validate Smartling credentials 