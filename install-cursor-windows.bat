@echo off
setlocal enabledelayedexpansion

echo 🚀 Smartling MCP Installer for Cursor IDE (Windows)
echo ===============================================

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

:: Create Cursor config directory
set "CURSOR_DIR=%USERPROFILE%\.cursor"
if not exist "%CURSOR_DIR%" mkdir "%CURSOR_DIR%"
set "CURSOR_CONFIG=%CURSOR_DIR%\mcp.json"

:: Check for existing credentials
set "EXISTING_USER_ID="
set "EXISTING_USER_SECRET="
set "EXISTING_ACCOUNT_UID="
set "USE_EXISTING=N"

if exist "%CURSOR_CONFIG%" (
    echo 🔍 Checking for existing Smartling credentials...
    for /f "tokens=*" %%i in ('powershell -Command "try { $config = Get-Content '%CURSOR_CONFIG%' | ConvertFrom-Json; $config.mcpServers.smartling.env.SMARTLING_USER_IDENTIFIER } catch { '' }"') do set "EXISTING_USER_ID=%%i"
    for /f "tokens=*" %%i in ('powershell -Command "try { $config = Get-Content '%CURSOR_CONFIG%' | ConvertFrom-Json; $config.mcpServers.smartling.env.SMARTLING_USER_SECRET } catch { '' }"') do set "EXISTING_USER_SECRET=%%i"
    for /f "tokens=*" %%i in ('powershell -Command "try { $config = Get-Content '%CURSOR_CONFIG%' | ConvertFrom-Json; $config.mcpServers.smartling.env.SMARTLING_ACCOUNT_UID } catch { '' }"') do set "EXISTING_ACCOUNT_UID=%%i"
)

:: Prompt for credentials
echo.
echo 🔑 Smartling API Credentials Setup
echo ================================

if not "%EXISTING_USER_ID%"=="" if not "%EXISTING_USER_SECRET%"=="" (
    echo ✅ Found existing credentials!
    echo    User ID: %EXISTING_USER_ID:~0,8%***
    if not "%EXISTING_ACCOUNT_UID%"=="" (
        echo    Account UID: %EXISTING_ACCOUNT_UID%
    ) else (
        echo    Account UID: ^(not set^)
    )
    echo.
    set /p USE_EXISTING="Keep existing credentials? (Y/n): "
    
    if /i "%USE_EXISTING%"=="n" (
        echo 📝 Enter new credentials:
        set /p USER_ID="Enter your Smartling User Identifier: "
        set /p USER_SECRET="Enter your Smartling User Secret: "
        set /p ACCOUNT_UID="Enter your Smartling Account UID (optional): "
    ) else (
        echo 🔄 Using existing credentials...
        set "USER_ID=%EXISTING_USER_ID%"
        set "USER_SECRET=%EXISTING_USER_SECRET%"
        set "ACCOUNT_UID=%EXISTING_ACCOUNT_UID%"
    )
) else (
    echo 📝 No existing credentials found. Please enter your Smartling credentials:
    set /p USER_ID="Enter your Smartling User Identifier: "
    set /p USER_SECRET="Enter your Smartling User Secret: "
    set /p ACCOUNT_UID="Enter your Smartling Account UID (optional): "
)

:: Check if config file exists
if exist "%CURSOR_CONFIG%" (
    echo ⚠️  Existing Cursor config found. Creating backup...
    copy "%CURSOR_CONFIG%" "%CURSOR_CONFIG%.backup.%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
    
    :: Use PowerShell to merge JSON (safer than manual editing)
    powershell -Command "$config = Get-Content '%CURSOR_CONFIG%' | ConvertFrom-Json; if (-not $config.mcpServers) { $config | Add-Member -Type NoteProperty -Name mcpServers -Value @{} }; $smartlingConfig = @{ command = '%NODE_PATH%'; args = @('%PROJECT_DIR%\bin.js'); env = @{ SMARTLING_USER_IDENTIFIER = '%USER_ID%'; SMARTLING_USER_SECRET = '%USER_SECRET%'; SMARTLING_BASE_URL = 'https://api.smartling.com' } }; if ('%ACCOUNT_UID%' -ne '') { $smartlingConfig.env.SMARTLING_ACCOUNT_UID = '%ACCOUNT_UID%' }; $config.mcpServers.smartling = $smartlingConfig; $config | ConvertTo-Json -Depth 10 | Set-Content '%CURSOR_CONFIG%'"
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
    ) > "%CURSOR_CONFIG%"
)

:: Clean up temp directory
cd /d "%USERPROFILE%"
rmdir /s /q "%TEMP_DIR%"

echo.
echo ✅ Installation Complete!
echo ========================
echo.
echo 🔧 Configuration Details:
echo • Cursor Config: %CURSOR_CONFIG%
echo • Node.js Path: %NODE_PATH%
echo • Project Directory: %PROJECT_DIR%
echo.
echo 🔑 Smartling API Credentials:
echo Get your credentials at: https://dashboard.smartling.com/settings/api
echo • User Identifier: Your Smartling API user ID
echo • User Secret: Your Smartling API secret key  
echo • Account UID: Optional, for multi-account access
echo.
echo ⚠️  Windows Limitation Notice:
echo Cursor on Windows may open additional PowerShell windows when MCP servers start.
echo This is a known limitation of Cursor on Windows and is not related to this installer.
echo.
echo 🚀 Next Steps:
echo 1. Restart Cursor IDE completely
echo 2. Test with: "Show me my Smartling projects"
echo 3. You should see 35+ Smartling tools available!
echo.
echo 💡 Troubleshooting:
echo • Verify credentials at: https://dashboard.smartling.com/settings/api
echo • Check Cursor MCP configuration in settings
echo • If you see empty PowerShell windows, this is normal on Windows
echo.
pause 