# 🚀 Deployment Guide - Smartling MCP Server

Esta guía te explica cómo hacer que tu servidor MCP de Smartling esté disponible via URL HTTP, sin necesidad de mantener carpetas locales.

## 🌐 **Opción 1: Vercel (Recomendado - Gratis)**

### Pasos para deployment en Vercel:

1. **Subir a GitHub** (ver sección GitHub más abajo)

2. **Conectar con Vercel:**
   - Ve a https://vercel.com
   - Conecta tu cuenta de GitHub
   - Importa el repositorio `smartling-mcp-server`

3. **Configurar variables de entorno:**
   ```bash
   SMARTLING_USER_IDENTIFIER=tu_user_identifier
   SMARTLING_USER_SECRET=tu_user_secret
   ```

4. **Deploy automático:** ¡Listo! Tu URL será algo como:
   ```
   https://smartling-mcp-server.vercel.app
   ```

### Uso en Cursor con URL Vercel:
```json
{
  "mcp.servers": {
    "smartling": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://tu-app.vercel.app/execute/{tool}",
        "-H", "Content-Type: application/json",
        "-d", "{args}"
      ]
    }
  }
}
```

## 🚂 **Opción 2: Railway**

1. **Fork el repo en GitHub**
2. **Conectar con Railway:**
   - Ve a https://railway.app
   - Conecta GitHub
   - Deploy from repo
3. **Configurar variables:**
   ```bash
   SMARTLING_USER_IDENTIFIER=tu_id
   SMARTLING_USER_SECRET=tu_secret
   PORT=3000
   ```

## 🐳 **Opción 3: Docker (Cualquier hosting)**

```bash
# Build imagen
docker build -t smartling-mcp-server .

# Run contenedor
docker run -p 3000:3000 \
  -e SMARTLING_USER_IDENTIFIER=tu_id \
  -e SMARTLING_USER_SECRET=tu_secret \
  smartling-mcp-server
```

### Deploy a Docker registries:
- **Google Cloud Run**
- **AWS ECS**
- **Azure Container Instances**
- **DigitalOcean Apps**

## 🏠 **Opción 4: Hosting Tradicional**

Para cualquier VPS/hosting con Node.js:

```bash
# En tu servidor
git clone https://github.com/tu-usuario/smartling-mcp-server.git
cd smartling-mcp-server
npm install
npm run build

# Configurar .env
echo "SMARTLING_USER_IDENTIFIER=tu_id" > .env
echo "SMARTLING_USER_SECRET=tu_secret" >> .env

# Usar PM2 para mantenimiento
npm install -g pm2
pm2 start dist/http-server.js --name smartling-mcp
pm2 startup
pm2 save
```

## 📋 **URLs y Endpoints Disponibles**

Una vez deployado, tu API tendrá estos endpoints:

```bash
# Documentación
GET https://tu-url.com/

# Health check
GET https://tu-url.com/health

# Lista de herramientas
GET https://tu-url.com/tools

# Ejecutar herramientas
POST https://tu-url.com/execute/smartling_get_projects
POST https://tu-url.com/execute/smartling_upload_file
# ... todas las demás herramientas

# Ejecución en lote
POST https://tu-url.com/batch
```

## 🔧 **Configurar Cursor con API HTTP**

### Opción A: Via HTTP Client Custom
```json
{
  "mcp.servers": {
    "smartling-http": {
      "command": "node",
      "args": ["/path/to/http-client.js"],
      "env": {
        "SMARTLING_API_URL": "https://tu-app.vercel.app"
      }
    }
  }
}
```

### Opción B: Wrapper Script
Crear un script que haga llamadas HTTP:

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

## 🔄 **Ventajas del Deployment HTTP**

### ✅ **Para ti:**
- ❌ **No necesitas mantener la carpeta local**
- ❌ **No necesitas que tu ordenador esté encendido**
- ✅ **Disponible 24/7 desde cualquier lugar**
- ✅ **Actualizaciones automáticas via GitHub**
- ✅ **Backups automáticos en la nube**

### ✅ **Para otros usuarios:**
- ❌ **No necesitan instalar nada local**
- ❌ **No necesitan Node.js**
- ❌ **No necesitan compilar código**
- ✅ **Solo configurar la URL en Cursor**
- ✅ **Siempre la última versión**

## 🔐 **Seguridad**

### Variables de entorno seguras:
- ✅ Credenciales nunca en el código
- ✅ Variables cifradas en plataformas de hosting
- ✅ HTTPS automático
- ✅ CORS configurado correctamente

### Para uso compartido:
```bash
# Cada usuario puede usar SUS credenciales via headers
POST https://tu-app.com/execute/tool
Headers:
  X-Smartling-User-ID: su_user_id
  X-Smartling-Secret: su_secret
```

## 📊 **Costos**

- **Vercel:** Gratis hasta 100GB bandwidth/mes
- **Railway:** Gratis $5/mes de crédito
- **Docker hosting:** Desde $5-10/mes
- **VPS básico:** Desde $3-5/mes

## 🎯 **Recomendación Final**

**Para uso personal:** Vercel (gratis, fácil)
**Para equipos:** Railway o Docker en VPS
**Para empresas:** Docker en infraestructura propia

¡Con cualquiera de estas opciones, nunca más necesitarás mantener archivos locales! 🌟 