@echo off
setlocal enabledelayedexpansion

echo 🚀 Smartling MCP Server Auto-Installer (Windows)
echo ======================================

:: Get the current directory
set "SCRIPT_DIR=%~dp0"
set "MCP_SERVER_PATH=%SCRIPT_DIR%bin\mcp-simple.js"

echo 📁 Detected installation directory: %SCRIPT_DIR%
echo 🔧 MCP Server path: %MCP_SERVER_PATH%

:: Check if the MCP server file exists
if not exist "%MCP_SERVER_PATH%" (
    echo ❌ Error: MCP server file not found at %MCP_SERVER_PATH%
    echo    Please run this script from the smartling-mcp-server directory
    pause
    exit /b 1
)

:: Create Cursor config directory
set "CURSOR_DIR=%USERPROFILE%\.cursor"
if not exist "%CURSOR_DIR%" mkdir "%CURSOR_DIR%"

:: Create Claude config directory (Windows path)
set "CLAUDE_DIR=%APPDATA%\Claude"
if not exist "%CLAUDE_DIR%" mkdir "%CLAUDE_DIR%"

:: Create Cursor configuration
echo 🎯 Configuring Cursor...
(
echo {
echo   "mcpServers": {
echo     "smartling": {
echo       "command": "node",
echo       "args": ["%MCP_SERVER_PATH:\=\\%"],
echo       "env": {
echo         "SMARTLING_USER_IDENTIFIER": "YOUR_USER_IDENTIFIER_HERE",
echo         "SMARTLING_USER_SECRET": "YOUR_USER_SECRET_HERE",
echo         "SMARTLING_BASE_URL": "https://api.smartling.com"
echo       }
echo     }
echo   }
echo }
) > "%CURSOR_DIR%\mcp.json"
echo ✅ Cursor configuration created at: %CURSOR_DIR%\mcp.json

:: Create Claude Desktop configuration
echo 🤖 Configuring Claude Desktop...
(
echo {
echo   "mcpServers": {
echo     "smartling": {
echo       "command": "node",
echo       "args": ["%MCP_SERVER_PATH:\=\\%"],
echo       "env": {
echo         "SMARTLING_USER_IDENTIFIER": "YOUR_USER_IDENTIFIER_HERE",
echo         "SMARTLING_USER_SECRET": "YOUR_USER_SECRET_HERE",
echo         "SMARTLING_BASE_URL": "https://api.smartling.com"
echo       }
echo     }
echo   }
echo }
) > "%CLAUDE_DIR%\claude_desktop_config.json"
echo ✅ Claude Desktop configuration created at: %CLAUDE_DIR%\claude_desktop_config.json

:: Install npm dependencies
echo 📦 Installing dependencies...
npm install

echo.
echo 🎉 Installation Complete!
echo ======================================
echo.
echo ⚠️  IMPORTANT: You need to add your Smartling credentials!
echo.
echo 📝 Edit these files and replace the placeholder values:
echo    • Cursor: %CURSOR_DIR%\mcp.json
echo    • Claude: %CLAUDE_DIR%\claude_desktop_config.json
echo.
echo 🔑 Replace these values:
echo    • YOUR_USER_IDENTIFIER_HERE → Your Smartling User Identifier
echo    • YOUR_USER_SECRET_HERE → Your Smartling User Secret
echo.
echo 🚀 After adding credentials:
echo    1. Restart Cursor/Claude Desktop
echo    2. You should see 74 Smartling tools available!
echo.
echo 📋 Need help finding your credentials?
echo    Visit: https://dashboard.smartling.com/settings/api
echo.
pause 