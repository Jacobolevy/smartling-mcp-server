# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2024-12-21

### 🎉 Major Release - Complete Smartling API Coverage

This version represents a complete overhaul with **53 total tools**, making it the most comprehensive Smartling MCP server available.

### ✨ Added

#### 🚀 New Tool Categories (23 new tools):
- **Jobs & Workflows (5 tools)**:
  - `smartling_create_job` - Create translation jobs
  - `smartling_list_jobs` - List all jobs in project
  - `smartling_get_job_details` - Get job information
  - `smartling_authorize_job` - Authorize jobs for translation
  - `smartling_close_job` - Close completed jobs

- **File Operations (4 tools)**:
  - `smartling_upload_file` - Upload files for translation
  - `smartling_download_file` - Download translated files
  - `smartling_get_file_status` - Check file translation status
  - `smartling_delete_file` - Remove files from project

- **Quality Assurance (3 tools)**:
  - `smartling_run_quality_check` - Execute QA checks
  - `smartling_get_quality_check_report` - Get QA reports
  - `smartling_list_quality_checks` - List all QA checks

- **Glossary Management (3 tools)**:
  - `smartling_get_glossaries` - List all glossaries
  - `smartling_create_glossary` - Create new glossaries
  - `smartling_create_glossary_term` - Add glossary terms

- **Webhook Management (3 tools)**:
  - `smartling_create_webhook` - Create event webhooks
  - `smartling_list_webhooks` - List project webhooks
  - `smartling_delete_webhook` - Remove webhooks

- **Utilities & Advanced (5 tools)**:
  - `smartling_diagnostic` - Test API connection and auth
  - `smartling_create_project` - Create new projects
  - `smartling_remove_tag_from_string` - Remove string tags
  - `smartling_get_workflow_steps` - Get project workflows
  - `smartling_resolve_locales_last_modified` - Get modification dates

#### 🔧 Project Improvements:
- **Environment Configuration**: Added `.env.example` template
- **Enhanced Git Ignore**: Comprehensive `.gitignore` for Node.js projects
- **Professional Scripts**: 11 new npm scripts for development and testing
- **Documentation**: Added `CONTRIBUTING.md` and `CHANGELOG.md`
- **Better Package Config**: Updated `package.json` with correct entry points

#### 📋 New npm Scripts:
- `npm run test:mcp` - Test MCP protocol compliance
- `npm run test:tools` - Test diagnostic functionality
- `npm run test:connection` - Test Smartling API connection
- `npm run count-tools` - Count available tools
- `npm run list-tools` - List available tools
- `npm run setup` - Quick environment setup

### 🔄 Changed

- **Main Entry Point**: Updated from `src/index.js` to `bin/mcp-simple.js`
- **Tool Count**: Updated description from "27+ tools" to "53+ tools"
- **Binary Commands**: Both `smartling-mcp-server` and `smartling-mcp` now point to the complete server
- **Test Strategy**: Comprehensive testing with multiple test types

### 🐛 Fixed

- **Schema Validation**: All tools now pass MCP client validation
- **Error Handling**: Improved error messages and validation
- **String Search**: Fixed 404 errors with alternative API approach
- **Tool Loading**: Resolved conflicts between different MCP client configurations

### 📈 Performance

- **Batch Operations**: Added `smartling_batch_operations` for efficient bulk actions
- **Direct API Access**: Enhanced source string retrieval methods
- **Optimized Requests**: Better API endpoint usage for common operations

## [2.0.0] - 2024-12-20

### ✨ Added
- **Advanced String Management (15 tools)**:
  - Enhanced search capabilities with regex support
  - Batch tagging and operations
  - Translation statistics and analytics
  - Duplicate string detection
  - Context binding management

### 🔄 Changed
- Migrated from HTTP server to pure MCP JSON-RPC protocol
- Improved error handling and debugging

## [1.0.0] - 2024-12-19

### 🎉 Initial Release

### ✨ Added
- **Core Functionality (7 tools)**:
  - `smartling_get_account_info` - Account information
  - `smartling_list_projects` - Project listing
  - `smartling_get_project_details` - Project details
  - `smartling_list_files` - File management
  - `smartling_search_strings` - String search
  - `smartling_add_tag_to_string` - String tagging
  - `smartling_get_string_tags` - Tag retrieval

- **MCP Compatibility**: Full support for Claude Desktop and Cursor
- **Authentication**: Secure API credential management
- **Documentation**: Comprehensive setup and usage guides

---

## 📊 Version Summary

| Version | Tools | Key Features |
|---------|-------|--------------|
| 3.0.0   | 53    | Complete Smartling API coverage |
| 2.0.0   | 30    | Advanced string management |
| 1.0.0   | 7     | Core MCP functionality |

## 🚀 Upgrade Guide

### From 2.x to 3.0.0

1. **Update package**:
   ```bash
   npm update smartling-mcp-server
   ```

2. **Set up environment**:
   ```bash
   npm run setup
   # Edit .env with your credentials
   ```

3. **Test new tools**:
   ```bash
   npm run test:connection
   npm run count-tools
   ```

4. **Update MCP config** (if needed):
   - Ensure you're pointing to the correct binary
   - Update any hardcoded tool names

### Breaking Changes

- **Entry Point**: Main entry changed from `src/index.js` to `bin/mcp-simple.js`
- **Tool Names**: All tools now follow `smartling_verb_noun` convention
- **Environment**: `.env` file now required for credentials (instead of MCP config embedding)

## 🔮 Future Plans

- **v3.1.0**: TypeScript migration and improved type safety
- **v3.2.0**: Real-time webhook event streaming
- **v3.3.0**: Bulk import/export utilities
- **v4.0.0**: Multi-account support and workspace management 