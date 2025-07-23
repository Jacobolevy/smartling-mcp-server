# 🔧 Configuración Directa para Cursor - Smartling HTTP Server

**Problema:** Cursor intenta OAuth con nuestro servidor HTTP REST  
**Solución:** Usar el servidor directamente como HTTP endpoint

---

## 🎯 **Configuración Correcta para Cursor:**

### **NO uses "MCP Server" - Usa integración HTTP directa:**

1. **Ve a:** Cursor Settings → Integrations → HTTP APIs
2. **O usa extensiones** que permitan llamadas HTTP custom

---

## 🌐 **Método 1: Usar como HTTP API Tool**

**Crear un script wrapper:**

```javascript
// smartling-wrapper.js
const https = require('https');

const SERVER_URL = 'https://smartling-mcp.onrender.com';

class SmartlingClient {
  async callTool(toolName, args = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(args);
      
      const options = {
        hostname: 'smartling-mcp.onrender.com',
        port: 443,
        path: `/execute/${toolName}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  // Métodos específicos
  async getProjects() {
    return this.callTool('smartling_get_projects', { accountId: 'b0f6a896' });
  }

  async getAccountInfo() {
    return this.callTool('smartling_get_account_info');
  }

  async uploadFile(projectId, fileUri, fileType, content) {
    return this.callTool('smartling_upload_file', {
      projectId, fileUri, fileType, content
    });
  }
}

// Uso:
const smartling = new SmartlingClient();

// Ejemplo de uso
smartling.getProjects().then(result => {
  console.log('Proyectos:', result.result.totalCount);
  console.log('Primeros 3:', result.result.items.slice(0, 3));
});
```

---

## 🔄 **Método 2: Usar como REST API directamente**

**En tu código de Cursor/IDE:**

```javascript
// Función helper para llamar a Smartling
async function callSmartling(tool, args = {}) {
  const response = await fetch('https://smartling-mcp.onrender.com/execute/' + tool, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  
  return await response.json();
}

// Ejemplos de uso:
const projects = await callSmartling('smartling_get_projects', { accountId: 'b0f6a896' });
const accountInfo = await callSmartling('smartling_get_account_info');
```

---

## 🌟 **Método 3: Extensión de Cursor personalizada**

**Si tu plataforma interna soporta extensiones:**

```json
{
  "name": "Smartling Integration",
  "version": "1.0.0",
  "description": "Smartling Translation Management",
  "main": "smartling-extension.js",
  "contributes": {
    "commands": [
      {
        "command": "smartling.getProjects",
        "title": "Get Smartling Projects"
      },
      {
        "command": "smartling.uploadFile", 
        "title": "Upload File to Smartling"
      }
    ]
  }
}
```

---

## 📡 **Testing Directo:**

**Verifica que funciona con curl:**

```bash
# Test básico
curl -X POST https://smartling-mcp.onrender.com/execute/smartling_get_account_info \
  -H "Content-Type: application/json" \
  -d '{}'

# Test proyectos
curl -X POST https://smartling-mcp.onrender.com/execute/smartling_get_projects \
  -H "Content-Type: application/json" \
  -d '{"accountId":"b0f6a896"}'
```

---

## 🎯 **Resumen:**

**❌ NO funciona:** Como "MCP Server" en Cursor (OAuth error)  
**✅ SÍ funciona:** Como HTTP REST API directo  
**✅ SÍ funciona:** Con wrapper JavaScript  
**✅ SÍ funciona:** Con extensiones personalizadas  

**URL base:** `https://smartling-mcp.onrender.com`  
**Endpoints:** `/execute/{tool_name}` y `/stream/{tool_name}` 