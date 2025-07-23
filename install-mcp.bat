@echo off
setlocal enabledelayedexpansion

echo 🚀 Smartling MCP Server Local Installer (Windows)
echo ================================================

:: Get the current directory
set "SCRIPT_DIR=%~dp0"
set "MCP_SERVER_PATH=%SCRIPT_DIR%bin\mcp-robust.js"

echo 📁 Installation directory: %SCRIPT_DIR%
echo 🔧 Using robust server: %MCP_SERVER_PATH%

:: Check if the MCP server file exists
if not exist "%MCP_SERVER_PATH%" (
    echo ❌ Error: Robust MCP server not found at %MCP_SERVER_PATH%
    echo    Make sure you're in the smartling-mcp-server directory
    echo    If missing, download from: https://github.com/Jacobolevy/smartling-mcp-server
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
echo         "SMARTLING_USER_IDENTIFIER": "your_user_id_here",
echo         "SMARTLING_USER_SECRET": "your_user_secret_here",
echo         "SMARTLING_BASE_URL": "https://api.smartling.com"
echo       }
echo     }
echo   }
echo }
) > "%CURSOR_DIR%\mcp.json"
echo ✅ Cursor: %CURSOR_DIR%\mcp.json

:: Create Claude Desktop configuration
echo 🤖 Configuring Claude Desktop...
(
echo {
echo   "mcpServers": {
echo     "smartling": {
echo       "command": "node",
echo       "args": ["%MCP_SERVER_PATH:\=\\%"],
echo       "env": {
echo         "SMARTLING_USER_IDENTIFIER": "your_user_id_here",
echo         "SMARTLING_USER_SECRET": "your_user_secret_here",
echo         "SMARTLING_BASE_URL": "https://api.smartling.com"
echo       }
echo     }
echo   }
echo }
) > "%CLAUDE_DIR%\claude_desktop_config.json"
echo ✅ Claude Desktop: %CLAUDE_DIR%\claude_desktop_config.json

:: Install npm dependencies
echo 📦 Installing dependencies...
npm install

:: Test installation
echo 🧪 Testing installation...
echo {"jsonrpc": "2.0", "id": 1, "method": "tools/list"} | node "%MCP_SERVER_PATH%" 2>nul | findstr "tools" >nul
if %errorlevel% equ 0 (
    echo ✅ Server test passed
) else (
    echo ⚠️  Server test failed (normal without credentials)
)

echo.
echo 🎉 Local Installation Complete!
echo ===============================
echo.
echo ⚠️  NEXT: Add your Smartling credentials
echo.
echo 📝 Edit these files and replace placeholders:
echo    • Cursor: %CURSOR_DIR%\mcp.json
echo    • Claude Desktop: %CLAUDE_DIR%\claude_desktop_config.json
echo.
echo 🔑 Replace with your actual credentials:
echo    • your_user_id_here → Your Smartling User Identifier
echo    • your_user_secret_here → Your Smartling User Secret
echo.
echo 🔗 Get credentials at: https://dashboard.smartling.com/settings/api
echo.
echo 🚀 After adding credentials:
echo    1. Restart Claude Desktop/Cursor completely
echo    2. Ask: 'How many Smartling tools do you have?'
echo    3. Should see: 3 tools (account_info, projects, diagnostic)
echo.
echo 🛠️ Features:
echo    • Timeout protection (8 seconds max)
echo    • Access to 227 Wix projects
echo    • Robust error handling
echo.
echo 💡 For one-line install on macOS/Linux, use:
echo    curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-fixed.sh ^| bash
echo.
pause 