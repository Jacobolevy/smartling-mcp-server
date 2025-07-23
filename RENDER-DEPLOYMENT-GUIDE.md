# 🎨 Guía de Deployment en Render.com - Smartling MCP Server

**Deploy tu servidor MCP con streaming HTTPS en Render.com** - Gratis, fácil y plug & play!

---

## 💰 **¿Es Render.com Gratuito?**

### ✅ **SÍ - Plan Gratuito Generoso:**
- **750 horas/mes** de servidor web gratis
- **HTTPS automático** con certificados SSL
- **Dominio personalizado**: `tu-app.onrender.com`
- **Auto-deploy** desde GitHub
- **Sin tarjeta de crédito** requerida
- **Monitoreo y logs** incluidos

### 📊 **750 horas/mes = ¿Cuánto tiempo?**
- **31 días × 24 horas = 744 horas**
- **Prácticamente 24/7** todo el mes
- **Perfecto para uso continuo** del MCP server

---

## 🔐 **¿Necesita SSO o Configuración Compleja?**

### ✅ **NO - Es Plug & Play:**
- **Solo cuenta de GitHub** requerida
- **No necesita SSO empresarial**
- **No requiere autenticación compleja**
- **Conectas GitHub en 1 click**
- **Deploy automático** cuando haces push al repo

---

## 🚀 **Método 1: One-Click Deploy (Más Fácil)**

### **Comando automático:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-to-render.sh | bash
```

**Esto prepara todo automáticamente y te da las instrucciones exactas.**

---

## 🛠️ **Método 2: Deployment Manual Paso a Paso**

### **Paso 1: Preparar el Proyecto**
1. **Fork el repositorio**:
   - Ve a: https://github.com/Jacobolevy/smartling-mcp-server
   - Click "Fork" en la esquina superior derecha
   - Ahora tienes tu propia copia

2. **Clonar tu fork** (opcional, para personalizar):
   ```bash
   git clone https://github.com/TU_USUARIO/smartling-mcp-server.git
   cd smartling-mcp-server
   ```

### **Paso 2: Configurar Render.com**
1. **Ve a**: https://render.com
2. **Regístrate/Inicia sesión** con GitHub
3. **Click "New"** → **"Web Service"**
4. **Conecta tu repositorio**:
   - Busca: `smartling-mcp-server`
   - Click "Connect"

### **Paso 3: Configuración del Servicio**
**Render detectará automáticamente** el archivo `render.yaml`, pero verifica:

```yaml
# render.yaml (ya incluido en el proyecto)
services:
  - type: web
    name: smartling-mcp-streaming
    env: node
    plan: free                                    # ← GRATIS
    buildCommand: npm install express cors dotenv eventsource
    startCommand: node scripts/start-https-streaming.js  # ← STREAMING
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000                              # ← Puerto de Render
      - key: SMARTLING_USER_IDENTIFIER
        value: your_user_identifier_here          # ← Cambia por tus credenciales
      - key: SMARTLING_USER_SECRET
        value: your_user_secret_here              # ← Cambia por tus credenciales
      - key: SMARTLING_BASE_URL
        value: https://api.smartling.com
      - key: SSL_GENERATE
        value: false                              # ← Render maneja HTTPS
    healthCheckPath: /health                      # ← Health check automático
```

### **Paso 4: Variables de Entorno**
**En la interfaz de Render**, actualiza las variables:

| Variable | Valor |
|----------|-------|
| `SMARTLING_USER_IDENTIFIER` | Tu user identifier de Smartling |
| `SMARTLING_USER_SECRET` | Tu user secret de Smartling |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SSL_GENERATE` | `false` |

### **Paso 5: Deploy**
1. **Click "Create Web Service"**
2. **Render comenzará** el build automáticamente
3. **Espera 2-5 minutos** para que complete
4. **¡Listo!** Tu URL será: `https://tu-app.onrender.com`

---

## 🌐 **Tu URL Final y Endpoints**

### **URL Principal:**
```
https://smartling-mcp-streaming.onrender.com
```
*(o el nombre que hayas elegido)*

### **Endpoints Disponibles:**
| Endpoint | Propósito |
|----------|-----------|
| `GET /` | Documentación de la API |
| `GET /health` | Health check (¡importante para Render!) |
| `POST /stream/:toolName` | Streaming de herramientas en tiempo real |
| `GET /events` | Server-Sent Events |
| `POST /execute/:toolName` | Ejecución normal (no streaming) |

### **Ejemplo de uso:**
```bash
# Health check
curl https://tu-app.onrender.com/health

# Streaming de una herramienta
curl -X POST https://tu-app.onrender.com/stream/smartling_get_projects \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

---

## 🔧 **Configuración para Usuarios Finales**

### **Para Cursor (`~/.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "smartling": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://tu-app.onrender.com"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "sus_credenciales",
        "SMARTLING_USER_SECRET": "su_secreto"
      }
    }
  }
}
```

### **Para Claude Desktop:**
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "smartling": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://tu-app.onrender.com"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "sus_credenciales",
        "SMARTLING_USER_SECRET": "su_secreto"
      }
    }
  }
}
```

---

## 🎯 **Ventajas de Render vs Otras Plataformas**

| Feature | Render | Railway | Fly.io | Heroku |
|---------|--------|---------|--------|--------|
| **Plan Gratuito** | ✅ 750h/mes | ✅ $5 crédito | ✅ 3 apps | ❌ Descontinuado |
| **HTTPS Automático** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **GitHub Integration** | ✅ Excelente | ✅ Buena | ✅ Buena | ✅ Buena |
| **Sin Tarjeta** | ✅ Sí | ❌ Requiere | ✅ Sí | ❌ Requiere |
| **Auto-deploy** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **Health Checks** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |

---

## 🔧 **Features Específicos para MCP Streaming**

### ✅ **HTTPS Streaming Automático:**
- **Certificados SSL** renovados automáticamente
- **WebSocket support** para Server-Sent Events
- **Chunked transfer encoding** para streaming
- **Keep-alive connections** optimizadas

### ✅ **Monitoreo y Logs:**
- **Health check** automático en `/health`
- **Logs en tiempo real** en el dashboard
- **Métricas de rendimiento** incluidas
- **Alertas automáticas** si el servidor falla

### ✅ **Auto-scaling:**
- **Zero downtime deployments**
- **Automatic restarts** si hay crashes
- **Load balancing** incluido en plan pagado

---

## 🚨 **Troubleshooting Común**

### **Problema: Build fails**
**Solución:**
```bash
# Asegúrate de que package.json tenga las dependencias
npm install express cors dotenv eventsource
```

### **Problema: Health check fails**
**Verificar:** El endpoint `/health` debe responder correctamente:
```bash
curl https://tu-app.onrender.com/health
```

### **Problema: Variables de entorno**
**En Render Dashboard**:
1. Ve a tu servicio
2. Click "Environment"
3. Verifica que todas las variables estén configuradas

### **Problema: Streaming no funciona**
**Verificar**: Que el `startCommand` use el script correcto:
```yaml
startCommand: node scripts/start-https-streaming.js
```

---

## 🔄 **Auto-Updates desde GitHub**

### **Cada vez que hagas `git push`:**
1. **Render detecta** el cambio automáticamente
2. **Rebuilds** el servicio
3. **Redeploys** con zero downtime
4. **Tu URL se mantiene** igual

### **Para actualizar manualmente:**
```bash
# En tu repo local
git pull origin main
git push origin main
# Render redeploys automáticamente
```

---

## 📊 **Costos y Límites**

### **Plan Gratuito:**
- ✅ **750 horas/mes** de compute
- ✅ **100GB** bandwidth
- ✅ **Unlimited** deploys
- ✅ **SSL certificates** incluidos
- ✅ **Custom domains** (tu-app.onrender.com)

### **Si necesitas más:**
- **Starter Plan**: $7/mes por servicio
- **750 horas** → **Unlimited**
- **Priority support**

---

## 🎉 **Resumen: ¿Por qué Render para MCP Streaming?**

### ✅ **Pros:**
- **100% gratuito** para uso normal
- **Plug & play** - sin configuración compleja
- **HTTPS automático** con streaming support
- **GitHub integration** perfecta
- **Sin tarjeta de crédito** requerida
- **Health checks** y monitoreo incluidos

### ⚠️ **Contras:**
- **Cold starts** después de 15 min inactividad (plan gratuito)
- **Menos regiones** que AWS/GCP
- **750 horas/mes** límite (pero suficiente para 24/7)

---

## 🚀 **URL Final para Compartir:**

```bash
# Script automático de deployment
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-to-render.sh | bash
```

**Resultado:** URL pública `https://tu-app.onrender.com` con 74+ herramientas de Smartling, streaming HTTPS, y disponibilidad 24/7.

**🎯 ¡Render.com es perfecto para tu servidor MCP: gratis, fácil, y completamente plug & play!** 