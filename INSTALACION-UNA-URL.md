# 🌐 Una Sola URL para Compartir - Smartling MCP Server

**¿Quieres compartir el servidor MCP de Smartling con otras personas usando una sola URL?** Aquí tienes las opciones:

---

## 🚀 **Opción 1: Instalación One-Click (Recomendada)**

### **URL para compartir:**
```
https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/one-click-install.sh
```

### **Comando para ejecutar:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/one-click-install.sh | bash
```

### **¿Qué hace?**
✅ **Detecta el sistema operativo** automáticamente  
✅ **Verifica prerequisitos** (Node.js, Git)  
✅ **Instala localmente** en su ordenador  
✅ **Despliega en la nube** (Railway) - opcional  
✅ **Configura automáticamente** Cursor y Claude Desktop  
✅ **Genera certificados HTTPS** automáticamente  

---

## 🌐 **Opción 2: Servidor Deployado (URL Directa)**

### **URL para usar directamente:**
```
https://smartling-mcp-server.railway.app
```
*Reemplaza con tu URL de deployment*

### **Configuración para usuarios:**
Los usuarios solo agregan esto a Cursor/Claude:

```json
{
  "mcpServers": {
    "smartling": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://tu-url.railway.app"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "sus_credenciales",
        "SMARTLING_USER_SECRET": "su_secreto"
      }
    }
  }
}
```

### **Ventajas:**
✅ **Sin instalación local** - funciona directamente  
✅ **Disponible 24/7** - siempre online  
✅ **HTTPS automático** - seguro por defecto  
✅ **Escalable** - maneja múltiples usuarios  

---

## 📋 **Comparación de Opciones**

| Aspecto | One-Click Install | Servidor Deployado |
|---------|-------------------|-------------------|
| **Facilidad** | Muy fácil | Extremadamente fácil |
| **Tiempo setup** | 5-10 minutos | Inmediato |
| **Disponibilidad** | Cuando esté encendido | 24/7 |
| **Costo** | Gratis | Gratis (Railway tier) |
| **Control** | Total | Compartido |
| **HTTPS Streaming** | ✅ Sí | ✅ Sí |

---

## 🎯 **Instrucciones para Compartir**

### **Para One-Click Installation:**
Envía a tus usuarios:

```
🚀 Instala el servidor MCP de Smartling con una sola línea:

curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/one-click-install.sh | bash

✅ Se instala automáticamente con HTTPS streaming
🔧 Se configura solo en Cursor y Claude Desktop  
📋 Incluye 74+ herramientas de Smartling
```

### **Para Servidor Deployado:**
Envía a tus usuarios:

```
🌐 Usa el servidor MCP de Smartling directamente:

URL: https://tu-url.railway.app

Agrega esta configuración a tu Cursor/Claude:
[JSON configuration block]

✅ Sin instalación necesaria
📡 HTTPS streaming disponible
🔧 Funciona inmediatamente
```

---

## 🔧 **URLs de Deployment Automático**

### **Railway:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-to-railway.sh | bash
```

### **Solo instalación local:**
```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-streaming.sh | bash
```

---

## 📚 **Documentación Completa**

- **GitHub**: https://github.com/Jacobolevy/smartling-mcp-server
- **Guía HTTPS**: `HTTPS-STREAMING-GUIDE.md`
- **Prerequisitos**: `PREREQUISITES.md`
- **Ejemplos**: `examples/streaming-client-example.js`

---

## 🎉 **Resultado Final**

Después de usar cualquiera de estas opciones, los usuarios tendrán:

✅ **74+ herramientas de Smartling** disponibles  
✅ **HTTPS streaming** con progreso en tiempo real  
✅ **Server-Sent Events** para monitoreo  
✅ **Configuración automática** de MCP clients  
✅ **Certificados SSL** automáticos  

---

**🚀 ¡Elige la opción que mejor se adapte a tus necesidades y comparte con una sola URL!** 