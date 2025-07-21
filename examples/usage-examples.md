# Ejemplos de Uso - Smartling MCP Server

Este documento proporciona ejemplos prácticos de cómo utilizar las herramientas del servidor MCP de Smartling.

## 🚀 Configuración Inicial

### 1. Obtener lista de proyectos

```json
{
  "tool": "smartling_get_projects",
  "arguments": {
    "accountId": "tu_account_id"
  }
}
```

## 📁 Gestión de Archivos

### 2. Subir archivo para traducción

```json
{
  "tool": "smartling_upload_file",
  "arguments": {
    "projectId": "abc123def",
    "fileContent": "eyJoZWxsbyI6ICJIZWxsbyBXb3JsZCJ9",
    "fileUri": "/i18n/messages.json",
    "fileType": "json",
    "authorize": true,
    "localeIdsToAuthorize": ["es-ES", "fr-FR", "de-DE"]
  }
}
```

### 3. Verificar estado de traducción

```json
{
  "tool": "smartling_get_file_status",
  "arguments": {
    "projectId": "abc123def",
    "fileUri": "/i18n/messages.json"
  }
}
```

### 4. Descargar archivo traducido

```json
{
  "tool": "smartling_download_file",
  "arguments": {
    "projectId": "abc123def",
    "fileUri": "/i18n/messages.json",
    "locale": "es-ES",
    "retrievalType": "published"
  }
}
```

## 👷 Gestión de Jobs

### 5. Crear trabajo de traducción

```json
{
  "tool": "smartling_create_job",
  "arguments": {
    "projectId": "abc123def",
    "jobName": "Website Q1 2024 Updates",
    "targetLocaleIds": ["es-ES", "fr-FR", "de-DE"],
    "description": "Traducción de actualizaciones del sitio web para Q1 2024",
    "dueDate": "2024-03-31T23:59:59Z",
    "callbackUrl": "https://mi-app.com/webhook/smartling",
    "callbackMethod": "POST"
  }
}
```

### 6. Agregar archivos a un trabajo

```json
{
  "tool": "smartling_add_files_to_job",
  "arguments": {
    "projectId": "abc123def",
    "jobId": "job_12345",
    "fileUris": [
      "/i18n/messages.json",
      "/i18n/navbar.json",
      "/i18n/footer.json"
    ]
  }
}
```

### 7. Autorizar trabajo

```json
{
  "tool": "smartling_authorize_job",
  "arguments": {
    "projectId": "abc123def",
    "jobId": "job_12345"
  }
}
```

## 🔍 Control de Calidad

### 8. Ejecutar verificaciones de calidad

```json
{
  "tool": "smartling_run_quality_check",
  "arguments": {
    "projectId": "abc123def",
    "fileUris": ["/i18n/messages.json"],
    "localeIds": ["es-ES", "fr-FR"],
    "checkTypes": ["tag_consistency", "glossary_check", "spelling"]
  }
}
```

### 9. Obtener resultados de calidad

```json
{
  "tool": "smartling_get_quality_results",
  "arguments": {
    "projectId": "abc123def",
    "fileUri": "/i18n/messages.json",
    "localeId": "es-ES"
  }
}
```

## 🏷️ Sistema de Etiquetado

### 10. Agregar etiquetas a strings

```json
{
  "tool": "smartling_add_string_tags",
  "arguments": {
    "projectId": "abc123def",
    "fileUri": "/i18n/messages.json",
    "stringUids": ["string_123", "string_456"],
    "tags": ["urgent", "homepage", "marketing"]
  }
}
```

### 11. Buscar strings por etiqueta

```json
{
  "tool": "smartling_get_strings_by_tag",
  "arguments": {
    "projectId": "abc123def",
    "tags": ["urgent", "homepage"],
    "fileUri": "/i18n/messages.json"
  }
}
```

## 📚 Gestión de Glosarios

### 12. Crear glosario

```json
{
  "tool": "smartling_create_glossary",
  "arguments": {
    "accountId": "account_123",
    "name": "Glosario de Marketing",
    "description": "Términos específicos para contenido de marketing",
    "sourceLocaleId": "en-US",
    "targetLocaleIds": ["es-ES", "fr-FR", "de-DE"]
  }
}
```

### 13. Agregar término al glosario

```json
{
  "tool": "smartling_add_glossary_term",
  "arguments": {
    "glossaryId": "glossary_123",
    "sourceText": "Brand",
    "targetText": "Marca",
    "localeId": "es-ES",
    "definition": "Nombre comercial de la empresa",
    "partOfSpeech": "noun",
    "caseSensitive": true,
    "exactMatch": true
  }
}
```

## 🔔 Webhooks

### 14. Configurar webhook

```json
{
  "tool": "smartling_create_webhook",
  "arguments": {
    "projectId": "abc123def",
    "url": "https://mi-app.com/webhook/smartling",
    "events": [
      "job.completed",
      "translation.completed",
      "quality.check.completed"
    ],
    "secretKey": "mi_clave_secreta_webhook",
    "enabled": true
  }
}
```

## 🔄 Flujo de Trabajo Completo

### Ejemplo: Subir archivo, crear job y verificar calidad

```bash
# 1. Subir archivo
smartling_upload_file
{
  "projectId": "abc123def",
  "fileContent": "base64_encoded_content",
  "fileUri": "/i18n/new-feature.json",
  "fileType": "json",
  "authorize": true,
  "localeIdsToAuthorize": ["es-ES", "fr-FR"]
}

# 2. Crear trabajo de traducción
smartling_create_job
{
  "projectId": "abc123def",
  "jobName": "New Feature Translation",
  "targetLocaleIds": ["es-ES", "fr-FR"],
  "dueDate": "2024-02-15T23:59:59Z"
}

# 3. Agregar archivo al trabajo
smartling_add_files_to_job
{
  "projectId": "abc123def",
  "jobId": "returned_job_id",
  "fileUris": ["/i18n/new-feature.json"]
}

# 4. Autorizar trabajo
smartling_authorize_job
{
  "projectId": "abc123def",
  "jobId": "returned_job_id"
}

# 5. Verificar calidad cuando esté listo
smartling_run_quality_check
{
  "projectId": "abc123def",
  "fileUris": ["/i18n/new-feature.json"],
  "localeIds": ["es-ES", "fr-FR"],
  "checkTypes": ["tag_consistency", "glossary_check"]
}
```

## 💡 Consejos y Mejores Prácticas

### Codificación de archivos
- Los archivos deben estar codificados en base64 antes de subirlos
- Ejemplo en JavaScript: `Buffer.from(fileContent).toString('base64')`

### Gestión de trabajos
- Siempre autoriza los trabajos después de agregar todos los archivos
- Usa fechas de vencimiento realistas
- Incluye descripciones detalladas para los traductores

### Control de calidad
- Ejecuta verificaciones después de cada actualización importante
- Prioriza corregir problemas críticos antes de publicar
- Usa glosarios para mantener consistencia terminológica

### Etiquetado
- Usa etiquetas consistentes como "urgent", "marketing", "ui"
- Las etiquetas facilitan la organización y búsqueda de contenido
- Considera usar prefijos por categoría: "ui_button", "error_message"

### Webhooks
- Configura webhooks para automatizar flujos de trabajo
- Usa claves secretas para verificar la autenticidad
- Maneja los eventos de forma asíncrona en tu aplicación 