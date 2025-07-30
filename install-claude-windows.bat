@echo off
setlocal enabledelayedexpansion

echo 🚀 Smartling MCP Installer for Claude Desktop (Windows)
echo ================================================

:: Check for required tools
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install from: https://nodejs.org/
    pause
    exit /b 1
)

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Git not found, using alternative download method...
    set USE_GIT=0
) else (
    set USE_GIT=1
)

:: Create temp directory
set "TEMP_DIR=%TEMP%\smartling-mcp-install"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"
cd /d "%TEMP_DIR%"

:: Download repository
echo 📥 Downloading smartling-mcp-server...
if !USE_GIT! equ 1 (
    git clone https://github.com/Jacobolevy/smartling-mcp-server.git
    if %errorlevel% neq 0 (
        echo ❌ Git clone failed, trying alternative method...
        set USE_GIT=0
    )
)

if !USE_GIT! equ 0 (
    echo 📦 Downloading zip archive...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/Jacobolevy/smartling-mcp-server/archive/main.zip' -OutFile 'main.zip'"
    if %errorlevel% neq 0 (
        echo ❌ Download failed! Check your internet connection.
        pause
        exit /b 1
    )
    
    powershell -Command "Expand-Archive -Path 'main.zip' -DestinationPath '.'"
    ren smartling-mcp-server-main smartling-mcp-server
)

cd smartling-mcp-server

:: Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed!
    pause
    exit /b 1
)

:: Build project
echo 🔨 Building project...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

:: Get Node.js path
for /f "delims=" %%i in ('where node') do set "NODE_PATH=%%i"
set "PROJECT_DIR=%CD%"

:: Create Claude config directory
set "CLAUDE_DIR=%APPDATA%\Claude"
if not exist "%CLAUDE_DIR%" mkdir "%CLAUDE_DIR%"
set "CLAUDE_CONFIG=%CLAUDE_DIR%\claude_desktop_config.json"

:: Prompt for credentials
echo.
echo 🔑 Smartling API Credentials Setup
echo ================================
set /p USER_ID="Enter your Smartling User Identifier: "
set /p USER_SECRET="Enter your Smartling User Secret: "
set /p ACCOUNT_UID="Enter your Smartling Account UID (optional): "

:: Check if config file exists
if exist "%CLAUDE_CONFIG%" (
    echo ⚠️  Existing Claude config found. Creating backup...
    copy "%CLAUDE_CONFIG%" "%CLAUDE_CONFIG%.backup.%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
    
    :: Use PowerShell to merge JSON (safer than manual editing)
    powershell -Command "$config = Get-Content '%CLAUDE_CONFIG%' | ConvertFrom-Json; if (-not $config.mcpServers) { $config | Add-Member -Type NoteProperty -Name mcpServers -Value @{} }; $smartlingConfig = @{ command = '%NODE_PATH%'; args = @('%PROJECT_DIR%\bin.js'); env = @{ SMARTLING_USER_IDENTIFIER = '%USER_ID%'; SMARTLING_USER_SECRET = '%USER_SECRET%'; SMARTLING_BASE_URL = 'https://api.smartling.com' } }; if ('%ACCOUNT_UID%' -ne '') { $smartlingConfig.env.SMARTLING_ACCOUNT_UID = '%ACCOUNT_UID%' }; $config.mcpServers.smartling = $smartlingConfig; $config | ConvertTo-Json -Depth 10 | Set-Content '%CLAUDE_CONFIG%'"
) else (
    :: Create new config
    (
    echo {
    echo   "mcpServers": {
    echo     "smartling": {
    echo       "command": "%NODE_PATH:\=\\%",
    echo       "args": ["%PROJECT_DIR:\=\\%\\bin.js"],
    echo       "env": {
    echo         "SMARTLING_USER_IDENTIFIER": "%USER_ID%",
    echo         "SMARTLING_USER_SECRET": "%USER_SECRET%",
    echo         "SMARTLING_BASE_URL": "https://api.smartling.com"
    if not "%ACCOUNT_UID%"=="" echo         ,"SMARTLING_ACCOUNT_UID": "%ACCOUNT_UID%"
    echo       }
    echo     }
    echo   }
    echo }
    ) > "%CLAUDE_CONFIG%"
)

:: Clean up temp directory
cd /d "%USERPROFILE%"
rmdir /s /q "%TEMP_DIR%"

echo.
echo ✅ Installation Complete!
echo ========================
echo.
echo 🔧 Configuration Details:
echo • Claude Config: %CLAUDE_CONFIG%
echo • Node.js Path: %NODE_PATH%
echo • Project Directory: %PROJECT_DIR%
echo.
echo 🔑 Smartling API Credentials:
echo Get your credentials at: https://dashboard.smartling.com/settings/api
echo • User Identifier: Your Smartling API user ID
echo • User Secret: Your Smartling API secret key  
echo • Account UID: Optional, for multi-account access
echo.
echo 🚀 Next Steps:
echo 1. Restart Claude Desktop completely
echo 2. Test with: "Show me my Smartling projects"
echo 3. You should see 35+ Smartling tools available!
echo.
echo 💡 Troubleshooting:
echo • Verify credentials at: https://dashboard.smartling.com/settings/api
echo • Check Claude Developer Console for connection status
echo • Ensure you have access to the projects you want to manage
echo.
pause 