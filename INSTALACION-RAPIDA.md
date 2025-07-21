# ⚡ **Instalación Rápida - Smartling MCP**

## 🚀 **5 Comandos, 2 Minutos**

```bash
# 1. Instalar
npm install -g smartling-mcp-server

# 2. Configurar credenciales (¡IMPORTANTE!)
export SMARTLING_USER_IDENTIFIER="tu_user_identifier"
export SMARTLING_USER_SECRET="tu_user_secret"

# 3. Verificar
smartling-mcp-server --config

# 4. Configurar Claude (macOS)
mkdir -p ~/Library/Application\ Support/Claude
echo '{
  "mcpServers": {
    "smartling": {
      "command": "smartling-mcp-server",
      "args": []
    }
  }
}' > ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 5. ¡Reiniciar Claude/Cursor y usar!
```

## 🔑 **Necesitas:**
- ✅ **Node.js 18+**
- ✅ **Credenciales de Smartling** (User ID + Secret)
- ✅ **Claude Desktop** o **Cursor**

## 🤖 **Probar en Claude/Cursor:**
```
"Lista mis proyectos de Smartling"
"¿Qué herramientas tienes disponibles?"
```

---
**📖 Guía completa:** Ver `GUIA-INSTALACION.md` 