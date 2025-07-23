# 🌐 Instalar MCP Smartling - URL Directa

## 🚀 **Instalación Instantánea**

**URL del servidor:** `https://smartling-mcp.onrender.com`

---

## 📋 **Para Cursor (Más Popular)**

1. **Abre Cursor**
2. **Ve a:** Settings → Extensions → MCP
3. **Agrega esta configuración:**

```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["-e", "
        const http = require('http');
        const https = require('https');
        const express = require('express');
        
        const client = process.argv[2] === 'https:' ? https : http;
        const baseUrl = 'https://smartling-mcp.onrender.com';
        
        // MCP client that forwards to HTTP API
        const mcp = {
          async call(method, params) {
            return new Promise((resolve, reject) => {
              const postData = JSON.stringify(params || {});
              const req = client.request(baseUrl + '/stream/' + method, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(postData)
                }
              }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
              });
              req.on('error', reject);
              req.write(postData);
              req.end();
            });
          }
        };
        
        console.log('MCP Client connected to:', baseUrl);
      ", "https://smartling-mcp.onrender.com"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "demo_user",
        "SMARTLING_USER_SECRET": "demo_secret"
      }
    }
  }
}
```

---

## 🔧 **Para Claude Desktop**

1. **Abre:** `~/.claude/claude_desktop_config.json`
2. **Agrega:**

```json
{
  "mcpServers": {
    "smartling": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://smartling-mcp.onrender.com/stream/smartling_get_projects",
        "-H", "Content-Type: application/json",
        "-d", "{}"
      ]
    }
  }
}
```

---

## 🧪 **Testing Rápido**

**Verifica que funciona:**
```bash
curl https://smartling-mcp.onrender.com/health
```

**Deberías ver:**
```json
{
  "status": "healthy",
  "version": "3.0.0-streaming", 
  "streaming": true,
  "features": ["Real-time streaming responses", ...]
}
```

---

## ✅ **¡Listo!**

**Ahora tienes acceso a:**
- 📋 **74 herramientas de Smartling**
- 📡 **Streaming en tiempo real**  
- 🔄 **Server-Sent Events**
- ⚡ **Respuestas chunked**

**URL para compartir:** `https://smartling-mcp.onrender.com` 