# Usage Examples - Smartling MCP Server

This document provides practical examples of how to use the Smartling MCP server tools.

## 🚀 Initial Setup

### 1. Get list of projects

```json
{
  "tool": "smartling_get_projects",
  "arguments": {
    "accountId": "your_account_id"
  }
}
```

## 📁 File Management

### 2. Upload file for translation

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

### 3. Check translation status

```json
{
  "tool": "smartling_get_file_status",
  "arguments": {
    "projectId": "abc123def",
    "fileUri": "/i18n/messages.json"
  }
}
```

### 4. Download translated file

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

## 👷 Job Management

### 5. Create translation job

```json
{
  "tool": "smartling_create_job",
  "arguments": {
    "projectId": "abc123def",
    "jobName": "Website Q1 2024 Updates",
    "targetLocaleIds": ["es-ES", "fr-FR", "de-DE"],
    "description": "Translation of website updates for Q1 2024",
    "dueDate": "2024-03-31T23:59:59Z",
    "callbackUrl": "https://my-app.com/webhook/smartling",
    "callbackMethod": "POST"
  }
}
```

### 6. Add files to a job

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

### 7. Authorize job

```json
{
  "tool": "smartling_authorize_job",
  "arguments": {
    "projectId": "abc123def",
    "jobId": "job_12345"
  }
}
```

## 🔍 Quality Control

### 8. Run quality checks

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

### 9. Get quality results

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

## 🏷️ Tagging System

### 10. Add tags to strings

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

### 11. Search strings by tag

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

## 📚 Glossary Management

### 12. Create glossary

```json
{
  "tool": "smartling_create_glossary",
  "arguments": {
    "accountId": "account_123",
    "name": "Marketing Glossary",
    "description": "Specific terms for marketing content",
    "sourceLocaleId": "en-US",
    "targetLocaleIds": ["es-ES", "fr-FR", "de-DE"]
  }
}
```

### 13. Add term to glossary

```json
{
  "tool": "smartling_add_glossary_term",
  "arguments": {
    "glossaryId": "glossary_123",
    "sourceText": "Brand",
    "targetText": "Marca",
    "localeId": "es-ES",
    "definition": "Commercial name of the company",
    "partOfSpeech": "noun",
    "caseSensitive": true,
    "exactMatch": true
  }
}
```

## 🔔 Webhooks

### 14. Configure webhook

```json
{
  "tool": "smartling_create_webhook",
  "arguments": {
    "projectId": "abc123def",
    "url": "https://my-app.com/webhook/smartling",
    "events": [
      "job.completed",
      "translation.completed",
      "quality.check.completed"
    ],
    "secretKey": "my_webhook_secret_key",
    "enabled": true
  }
}
```

## 🔄 Complete Workflow

### Example: Upload file, create job and verify quality

```bash
# 1. Upload file
smartling_upload_file
{
  "projectId": "abc123def",
  "fileContent": "base64_encoded_content",
  "fileUri": "/i18n/new-feature.json",
  "fileType": "json",
  "authorize": true,
  "localeIdsToAuthorize": ["es-ES", "fr-FR"]
}

# 2. Create translation job
smartling_create_job
{
  "projectId": "abc123def",
  "jobName": "New Feature Translation",
  "targetLocaleIds": ["es-ES", "fr-FR"],
  "dueDate": "2024-02-15T23:59:59Z"
}

# 3. Add file to job
smartling_add_files_to_job
{
  "projectId": "abc123def",
  "jobId": "returned_job_id",
  "fileUris": ["/i18n/new-feature.json"]
}

# 4. Authorize job
smartling_authorize_job
{
  "projectId": "abc123def",
  "jobId": "returned_job_id"
}

# 5. Check quality when ready
smartling_run_quality_check
{
  "projectId": "abc123def",
  "fileUris": ["/i18n/new-feature.json"],
  "localeIds": ["es-ES", "fr-FR"],
  "checkTypes": ["tag_consistency", "glossary_check"]
}
```

## 💡 Tips and Best Practices

### File encoding
- Files must be base64 encoded before uploading
- JavaScript example: `Buffer.from(fileContent).toString('base64')`

### Job management
- Always authorize jobs after adding all files
- Use realistic due dates
- Include detailed descriptions for translators

### Quality control
- Run checks after each major update
- Prioritize fixing critical issues before publishing
- Use glossaries to maintain terminology consistency

### Tagging
- Use consistent tags like "urgent", "marketing", "ui"
- Tags facilitate content organization and search
- Consider using category prefixes: "ui_button", "error_message"

### Webhooks
- Configure webhooks to automate workflows
- Use secret keys to verify authenticity
- Handle events asynchronously in your application 