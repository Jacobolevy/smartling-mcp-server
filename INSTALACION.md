# 🚀 Instalación del MCP Server de Smartling

Esta guía te ayudará a configurar el servidor MCP de Smartling en tu ordenador para usar con Cursor, Claude Desktop u otras aplicaciones compatibles con MCP.

## 📋 Prerrequisitos

- **Node.js** (versión 18 o superior) - [Descargar aquí](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **Cuenta de Smartling** con credenciales de API

## 📦 Instalación Rápida

### 1. Descargar y extraer el proyecto
```bash
# Si tienes el archivo ZIP
unzip smartling-mcp-server.zip
cd smartling-mcp-server

# O si tienes acceso al repositorio Git
git clone <URL_DEL_REPOSITORIO>
cd smartling-mcp-server
```

### 2. Ejecutar instalación automática
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configurar credenciales de Smartling
```bash
# Editar el archivo .env con tus credenciales
nano .env
```

Reemplaza los valores en `.env`:
```bash
SMARTLING_USER_IDENTIFIER=tu_user_identifier_real
SMARTLING_USER_SECRET=tu_user_secret_real
```

## 🔑 Obtener Credenciales de Smartling

1. **Inicia sesión** en https://dashboard.smartling.com
2. **Ve a**: Account Settings (icono de engranaje)
3. **Navega a**: API → Token Management  
4. **Crea un nuevo token** o usa uno existente
5. **Copia**:
   - User Identifier
   - User Secret

## 🛠️ Instalación Manual (si setup.sh no funciona)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Compilar TypeScript
```bash
npm run build
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Probar el servidor
```bash
npm start
```

Deberías ver:
```
Smartling MCP Server v2.0 running on stdio
Available tools: Projects, Files, Jobs, Quality Checks, Tagging, Glossaries, Webhooks
```

## 🎯 Configurar en Cursor

### Opción 1: Automática
```bash
# Copiar configuración preparada
cp cursor-mcp-config.json ~/Library/Application\ Support/Cursor/User/mcp/servers.json
```

### Opción 2: Manual
1. **Abre Cursor**
2. **Ve a**: Cursor → Preferences → Settings
3. **Busca**: "settings.json" y haz clic en "Edit in settings.json"
4. **Agrega** la configuración MCP:

```json
{
    "mcp.servers": {
        "smartling": {
            "command": "node",
            "args": ["/ruta/completa/a/smartling-mcp-server-main/bin/mcp-simple.js"],
            "env": {
                "SMARTLING_USER_IDENTIFIER": "tu_user_identifier",
                "SMARTLING_USER_SECRET": "tu_user_secret"
            }
        }
    }
}
```

**⚠️ IMPORTANTE**: Reemplaza `/ruta/completa/a/smartling-mcp-server-main/` con la ruta real donde descargaste el proyecto.

## 🧪 Verificar Instalación

### 1. Reinicia Cursor completamente

### 2. Pregunta al AI de Cursor:
```
"¿Qué herramientas de Smartling tienes disponibles?"
```

### 3. Prueba básica:
```
"Usa smartling_get_projects para obtener mis proyectos"
```

## 🛠️ Herramientas Disponibles

Una vez configurado, tendrás acceso a 27+ herramientas:

- **📋 Proyectos**: Gestión de proyectos
- **📁 Archivos**: Subir, descargar, gestionar archivos
- **👷 Jobs**: Crear y gestionar trabajos de traducción
- **🔍 Calidad**: Verificaciones de calidad automáticas
- **🏷️ Etiquetas**: Sistema de etiquetado de strings
- **📚 Glosarios**: Gestión de terminología
- **🔔 Webhooks**: Configurar notificaciones

## 🐛 Solución de Problemas

### Error: "Command not found: node"
```bash
# Instalar Node.js desde https://nodejs.org/
# O usar un gestor de versiones como nvm
```

### Error: "Authentication failed"
```bash
# Verificar credenciales en .env
cat .env
# Asegurarse de que las credenciales sean correctas
```

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### MCP no aparece en Cursor
```bash
# Verificar ruta en la configuración
pwd  # Obtener ruta actual
# Actualizar la ruta en settings.json de Cursor
```

## 📞 Soporte

- **Documentación**: Ver `README.md` y `examples/usage-examples.md`
- **Ejemplos**: Carpeta `examples/` contiene casos de uso
- **Configuración**: Ver archivos `*.json` para diferentes configuraciones

## 🔒 Seguridad

- ✅ Nunca compartas tu archivo `.env`
- ✅ Las credenciales se manejan de forma segura
- ✅ Todas las comunicaciones usan HTTPS
- ✅ Los tokens se renuevan automáticamente 