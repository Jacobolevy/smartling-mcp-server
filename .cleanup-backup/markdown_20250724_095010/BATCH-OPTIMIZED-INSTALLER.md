# 🚀 Instalador Batch-Optimized de Smartling MCP

## ⚡ **La Versión Superior** 

Este instalador usa **`mcp-batch-optimized.js`** en lugar del `smartling-mcp.js` estándar.

### 🏋️ **Ventajas del Batch-Optimized:**

| **Característica** | **Batch-Optimized** | **Estándar** |
|---|---|---|
| **Timeouts** | 30s/5min | 10s/30s |
| **Operaciones en lote** | ✅ Optimizado | ⚠️ Básico |
| **Proyectos grandes** | ✅ 300+ archivos | ⚠️ Puede fallar |
| **Rendimiento** | 🚀 Superior | 📈 Estándar |
| **Memoria** | 💪 Optimizada | 🔧 Básica |

### 🎯 **Perfecto para:**
- ✅ Proyectos con 300+ archivos (como el tuyo)
- ✅ Operaciones de tagging masivo
- ✅ Búsquedas en proyectos grandes
- ✅ Batch operations
- ✅ Trabajo con múltiples archivos

## 🚀 **Instalación Rápida**

### Con credenciales:
```bash
cd ~/Downloads/smartling-mcp-server-main && ./install-batch-optimized.sh "vjwwgsqgeogfkqtmntznqhqxaslfwx" "s16jebo9eafog6ugv1me6paojuIL^38pkd2kv1ltr8e9pa5vj9on825"
```

### Modo interactivo:
```bash
cd ~/Downloads/smartling-mcp-server-main && ./install-batch-optimized.sh
```

## 🔧 **Lo que hace el instalador:**

1. ✅ **Preserva tus MCPs existentes** (no sobrescribe nada)
2. ✅ **Instala `mcp-batch-optimized.js`** en lugar del estándar
3. ✅ **Configura Claude Desktop automáticamente**
4. ✅ **Configura Cursor automáticamente**
5. ✅ **Crea backups con timestamp**
6. ✅ **Valida la instalación**

## 📁 **Archivos instalados:**

```
~/smartling-mcp-server/
└── bin/
    └── mcp-batch-optimized.js  ← La versión superior
```

## ⚙️ **Configuración resultante:**

### Claude Desktop:
```json
{
  "mcpServers": {
    "smartling": {
      "command": "node",
      "args": ["/Users/jacobol/smartling-mcp-server/bin/mcp-batch-optimized.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "tu_user_id",
        "SMARTLING_USER_SECRET": "tu_secret",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

### Cursor:
```json
{
  "mcp.servers": {
    "smartling": {
      "command": "node",
      "args": ["/Users/jacobol/smartling-mcp-server/bin/mcp-batch-optimized.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "tu_user_id",
        "SMARTLING_USER_SECRET": "tu_secret", 
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
```

## 🎯 **Comparación con otros instaladores:**

| **Instalador** | **Archivo usado** | **Rendimiento** | **Recomendado para** |
|---|---|---|---|
| `install-batch-optimized.sh` | `mcp-batch-optimized.js` | 🚀 **Superior** | **Proyectos grandes** |
| `install-robust-smartling.sh` | `smartling-mcp.js` | 📈 Estándar | Proyectos pequeños |
| `install-fixed.sh` | `mcp-server.js` | 🔧 Básico | Testing |

## 🚀 **Después de la instalación:**

1. **Reinicia Claude Desktop** (Cmd+Q y vuelve a abrir)
2. **Reinicia Cursor**
3. **Verifica** que aparezca "Smartling" en las herramientas
4. **Disfruta** de 74+ herramientas optimizadas

## 💡 **Tips:**

- ✅ **Backup automático**: El instalador crea backups con timestamp
- ✅ **Seguro**: Preserva tus configuraciones existentes
- ✅ **Actualizable**: Puedes ejecutarlo múltiples veces
- ✅ **Compatible**: Funciona con tu configuración actual

## 🔧 **Troubleshooting:**

### Si algo sale mal:
1. Los backups están en:
   - `~/Library/Application Support/Claude/claude_desktop_config.json.backup.TIMESTAMP`
   - `~/Library/Application Support/Cursor/User/settings.json.backup.TIMESTAMP`

2. Restaurar manualmente:
```bash
# Claude
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup.* ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Cursor  
cp ~/Library/Application\ Support/Cursor/User/settings.json.backup.* ~/Library/Application\ Support/Cursor/User/settings.json
```

## 🎉 **¡Listo!**

Ahora tienes la versión **más potente** del Smartling MCP Server, perfecta para tu proyecto con 392 archivos. 

¡La diferencia en rendimiento será notable! 🚀 