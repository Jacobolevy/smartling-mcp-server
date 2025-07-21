# Test MCP Smartling en Cursor

## 🧪 Cómo probar que MCP está funcionando:

### 1. Abrir Command Palette
- Presiona `Cmd+Shift+P` (macOS)
- Busca "MCP" o "Smartling"

### 2. Probar herramientas básicas
Pregúntale a Cursor AI:

```
"¿Puedes usar smartling_get_projects para obtener mis proyectos de Smartling?"
```

### 3. Verificar herramientas disponibles
Pregunta:

```
"¿Qué herramientas de Smartling tienes disponibles?"
```

### 4. Test de subida de archivo
```
"¿Puedes usar smartling_upload_file para subir un archivo JSON con contenido de prueba?"
```

## 🔧 Si no funciona:

1. Verifica que el servidor MCP esté corriendo:
   ```bash
   cd /Users/jacobol/Desktop/smartling-mcp-server
   npm start
   ```

2. Revisa logs de Cursor:
   - Ve a `View` → `Output`
   - Selecciona "MCP" en el dropdown

3. Verifica la configuración:
   ```bash
   cat ~/Library/Application\ Support/Cursor/User/settings.json
   ```

## ✅ Herramientas disponibles:

- smartling_get_projects
- smartling_upload_file
- smartling_get_file_status
- smartling_download_file
- smartling_create_job
- smartling_add_files_to_job
- smartling_authorize_job
- smartling_run_quality_check
- smartling_create_glossary
- smartling_add_glossary_term
- smartling_add_string_tags
- smartling_create_webhook
- Y muchas más... 