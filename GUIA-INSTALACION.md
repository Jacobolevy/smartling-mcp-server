# 🚀 **Guía de Instalación: Smartling MCP Server**
## Complete tu configuración en 5 minutos

---

## 📋 **REQUISITOS PREVIOS**

### ✅ **Lo que NECESITAS tener:**
1. **Node.js v18+** instalado
2. **Credenciales de Smartling** (User Identifier + User Secret)
3. **Claude Desktop** o **Cursor** instalado

### 🔑 **¿Cómo obtener credenciales de Smartling?**
1. Accede a tu cuenta de **Smartling**
2. Ve a **Account Settings** → **API** → **Token Management**
3. Crea un nuevo **User Token**
4. Guarda el **User Identifier** y **User Secret**

---

## 📦 **PASO 1: INSTALACIÓN**

### **Instalar globalmente desde npm:**
```bash
npm install -g smartling-mcp-server
```

### **Verificar instalación:**
```bash
smartling-mcp-server --version
# Debería mostrar: Smartling MCP Server v3.0.0
```

---

## 🔑 **PASO 2: CONFIGURAR CREDENCIALES**

### **Opción A: Variables de Entorno Permanentes (Recomendado)**

**En macOS/Linux:**
```bash
# Editar archivo de configuración del shell
nano ~/.zshrc
# o para bash: nano ~/.bashrc

# Agregar al final del archivo:
export SMARTLING_USER_IDENTIFIER="tu_user_identifier_aqui"
export SMARTLING_USER_SECRET="tu_user_secret_aqui"

# Recargar configuración
source ~/.zshrc
```

**En Windows:**
```cmd
# PowerShell
$env:SMARTLING_USER_IDENTIFIER="tu_user_identifier_aqui"
$env:SMARTLING_USER_SECRET="tu_user_secret_aqui"

# Para hacerlo permanente, agrega las variables en Sistema → Variables de Entorno
```

### **Verificar configuración:**
```bash
smartling-mcp-server --config
# Debería mostrar: ✅ Configuration looks good!
```

---

## 🤖 **PASO 3A: CONFIGURAR CLAUDE DESKTOP**

### **Crear archivo de configuración MCP:**

**Ubicación del archivo:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### **Crear el archivo con este contenido:**
```json
{
  "mcpServers": {
    "smartling": {
      "command": "smartling-mcp-server",
      "args": []
    }
  }
}
```

### **En macOS - Comando directo:**
```bash
mkdir -p ~/Library/Application\ Support/Claude
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "smartling": {
      "command": "smartling-mcp-server",
      "args": []
    }
  }
}
EOF
```

---

## 💻 **PASO 3B: CONFIGURAR CURSOR**

### **Abrir configuración MCP en Cursor:**
1. Abre **Cursor**
2. Ve a **Settings** (`Cmd/Ctrl + ,`)
3. Busca **"MCP"** o **"Model Context Protocol"**
4. Click en **"Edit MCP Settings"**

### **Agregar configuración Smartling:**
```json
{
  "mcpServers": {
    "smartling": {
      "command": "smartling-mcp-server",
      "args": []
    }
  }
}
```

### **Alternativa - Archivo manual:**
**Ubicación:** `~/.cursor/mcp_config.json`

```bash
mkdir -p ~/.cursor
cat > ~/.cursor/mcp_config.json << 'EOF'
{
  "mcpServers": {
    "smartling": {
      "command": "smartling-mcp-server",
      "args": []
    }
  }
}
EOF
```

---

## 🧪 **PASO 4: VERIFICACIÓN**

### **Reiniciar aplicaciones:**
1. **Cierra completamente** Claude Desktop/Cursor
2. **Vuelve a abrir** la aplicación
3. Debería detectar automáticamente el servidor MCP

### **Probar funcionalidad:**

**Comandos de prueba en Claude/Cursor:**
```
"Lista todos mis proyectos de Smartling"

"¿Qué herramientas de Smartling tienes disponibles?"

"Muéstrame el estado de mis archivos de traducción"

"Ayúdame a gestionar mis traducciones de Smartling"
```

### **Verificar logs (si hay problemas):**
```bash
# Ejecutar servidor manualmente para ver logs
smartling-mcp-server --port 3000

# En otra terminal, probar conexión
curl http://localhost:3000/health
```

---

## 🛠 **HERRAMIENTAS DISPONIBLES**

Una vez configurado, tendrás acceso a **27+ herramientas** de Smartling:

### **📁 Gestión de Proyectos:**
- Listar proyectos
- Obtener detalles de proyectos
- Gestionar configuraciones

### **📄 Gestión de Archivos:**
- Subir archivos para traducir
- Descargar traducciones
- Verificar estado de traducción
- Listar archivos del proyecto

### **👷 Gestión de Trabajos:**
- Crear trabajos de traducción
- Monitorear progreso
- Gestionar asignaciones

### **🔍 Control de Calidad:**
- Ejecutar verificaciones de calidad
- Obtener reportes de QA
- Revisar issues de traducción

### **📚 Gestión de Glosarios:**
- Listar glosarios
- Crear términos
- Sincronizar terminología

---

## ❌ **SOLUCIÓN DE PROBLEMAS**

### **Error: "Command not found"**
```bash
# Reinstalar globalmente
npm uninstall -g smartling-mcp-server
npm install -g smartling-mcp-server
```

### **Error: "Permission denied"**
```bash
# En macOS/Linux, usar sudo
sudo npm install -g smartling-mcp-server
```

### **Error: "Configuration missing"**
```bash
# Verificar variables de entorno
echo $SMARTLING_USER_IDENTIFIER
echo $SMARTLING_USER_SECRET

# Si están vacías, reconfigurar según Paso 2
```

### **Error: "MCP Server not detected"**
1. Verificar que el archivo de configuración existe
2. Verificar sintaxis JSON (usar JSONLint.com)
3. Reiniciar completamente la aplicación
4. Verificar que el comando funciona en terminal

### **Error: "API Authentication failed"**
1. Verificar credenciales en Smartling
2. Regenerar User Token en Smartling
3. Actualizar variables de entorno

---

## 🎯 **RESUMEN RÁPIDO**

```bash
# 1. Instalar
npm install -g smartling-mcp-server

# 2. Configurar credenciales
export SMARTLING_USER_IDENTIFIER="tu_identifier"
export SMARTLING_USER_SECRET="tu_secret"

# 3. Verificar
smartling-mcp-server --config

# 4. Configurar Claude/Cursor (ver secciones específicas)

# 5. ¡Reiniciar y usar!
```

---

## 📞 **SOPORTE**

- **GitHub:** https://github.com/Jacobolevy/smartling-mcp-server
- **Issues:** https://github.com/Jacobolevy/smartling-mcp-server/issues
- **Documentación:** README.md en el repositorio

---

## 🚀 **¡LISTO!**

Ahora tienes **acceso completo** a las herramientas de **Smartling** directamente desde **Claude** o **Cursor**. 

**¡Disfruta de tu flujo de trabajo de traducción súper cargado! 🌍✨** 