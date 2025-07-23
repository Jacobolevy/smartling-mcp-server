# 🌐 Soluciones de Servidor MCP para Plataformas Internas

**Para tu plataforma interna tienes 3 opciones de servidor:**

---

## 🚀 **Opción 1: Servidor MCP Remoto (RECOMENDADA)**

### **✅ Para plataformas internas que necesitan un servidor deployado**

**Deploy en una línea:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-mcp-remote.sh | bash
```

### **¿Qué obtienes?**
- **Servidor MCP real** deployado con protocolo WebSocket
- **Sin errores de OAuth** - protocolo MCP nativo
- **URL WebSocket:** `wss://tu-servidor.com/mcp`
- **Conecta** a tu plataforma interna via WebSocket
- **Acceso a 227 proyectos** reales de Wix en Smartling

### **Ejemplo de conexión desde tu plataforma:**
```javascript
import { SmartlingMCPClient } from './internal-platform-client.js';

const client = new SmartlingMCPClient('wss://tu-servidor.com/mcp');
await client.connect();

// Usar herramientas de Smartling
const projects = await client.getSmartlingProjects();
const accountInfo = await client.getAccountInfo();
```

### **Deployment:**
1. **Ejecuta el script** de deployment
2. **Deploya en Render/Railway/Heroku**
3. **Tu plataforma se conecta** via WebSocket
4. **Protocolo:** MCP over WebSocket (JSON-RPC 2.0)

---

## ⚡ **Opción 2: API HTTP Directo (MÁS SIMPLE)**

### **✅ Para integraciones HTTP simples**

**URL base:** `https://smartling-mcp.onrender.com`

### **Endpoints disponibles:**
```bash
# Health check
GET https://smartling-mcp.onrender.com/health

# Ejecutar herramientas
POST https://smartling-mcp.onrender.com/execute/smartling_get_projects
Content-Type: application/json
{"accountId": "b0f6a896"}

# Streaming
POST https://smartling-mcp.onrender.com/stream/smartling_get_projects
```

### **Ejemplo de uso:**
```javascript
async function callSmartling(tool, args = {}) {
  const response = await fetch(
    `https://smartling-mcp.onrender.com/execute/${tool}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  return await response.json();
}

// Usar
const projects = await callSmartling('smartling_get_projects');
const accountInfo = await callSmartling('smartling_get_account_info');
```

### **Ventajas:**
- **Ya deployado** y funcionando
- **No requiere deployment** adicional
- **Acceso inmediato** a API real
- **Integración simple** con fetch/curl

---

## 🔧 **Opción 3: Cliente MCP Local (PARA CURSOR)**

### **✅ Para usuarios de Cursor que quieren MCP local**

**Instalación:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-mcp-wrapper.sh | bash
```

### **¿Para qué sirve?**
- **Solo para Cursor** desktop
- **Instalación local** en el ordenador del usuario
- **Protocolo MCP** via stdio
- **Se conecta** al servidor HTTP remoto

---

## 📊 **Comparación de Opciones**

| Opción | Deploy | Protocolo | Para | Conexión |
|--------|--------|-----------|------|----------|
| **MCP Remoto** | Script + Render | WebSocket MCP | Plataformas internas | `wss://server.com/mcp` |
| **HTTP Directo** | Ya deployado | HTTP REST | Integraciones simples | `https://smartling-mcp.onrender.com` |
| **Cliente Local** | Local install | stdio MCP | Solo Cursor | Local wrapper |

---

## 🎯 **¿Cuál elegir para tu plataforma interna?**

### **👑 Si tu plataforma puede conectar via WebSocket:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-mcp-remote.sh | bash
```
**→ Opción 1: Servidor MCP Remoto**

### **🚀 Si prefieres integración HTTP simple:**
**→ Opción 2: Usar directamente `https://smartling-mcp.onrender.com`**

---

## 🔌 **URLs de Deployment:**

### **Servidor MCP Remoto:**
```
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-mcp-remote.sh | bash
```

### **Cliente de ejemplo:**
```
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/examples/internal-platform-client.js
```

### **Servidor HTTP directo:**
```
https://smartling-mcp.onrender.com
```

---

## 🛠️ **Herramientas disponibles en todas las opciones:**

1. **`smartling_get_projects`** - 227 proyectos reales de Wix
2. **`smartling_get_account_info`** - Información de cuenta
3. **`smartling_upload_file`** - Subir archivos para traducir
4. **`smartling_get_file_status`** - Estado de traducciones

---

## ✅ **¡Elige la opción que mejor se adapte a tu plataforma interna!**

**🌐 Para WebSocket MCP:** Deploy remoto  
**⚡ Para HTTP simple:** Usar URL directa  
**🔧 Para Cursor:** Instalar wrapper local 