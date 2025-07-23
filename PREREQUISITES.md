# 🔧 Prerequisites - Setup Guide for Non-Technical Users

**Before installing the Smartling MCP Server, you need these essential tools installed. Follow the steps for your operating system.**

---

## 📱 Step 1: Install Claude Desktop (Required)

Claude Desktop is where you'll use the Smartling translation tools.

### 🍎 macOS:
1. **Go to**: https://claude.ai/download
2. **Click**: "Download for Mac" 
3. **Open** the downloaded `.dmg` file
4. **Drag** Claude to your Applications folder
5. **Launch** Claude from Applications

### 🪟 Windows:
1. **Go to**: https://claude.ai/download
2. **Click**: "Download for Windows"
3. **Run** the downloaded `.exe` installer
4. **Follow** the installation wizard
5. **Launch** Claude from Start menu

### ✅ Verify Claude Desktop:
- **Open Claude Desktop**
- **Sign in** with your Anthropic account
- **Test**: Ask "Hello, can you help me?"

---

## 💻 Step 2: Install Cursor (AI Code Editor - Recommended)

Cursor is an AI-powered code editor that also works with Smartling tools.

### 🍎 macOS:
1. **Go to**: https://cursor.sh
2. **Click**: "Download for Mac"
3. **Open** the downloaded `.dmg` file  
4. **Drag** Cursor to Applications folder
5. **Launch** Cursor from Applications

### 🪟 Windows:
1. **Go to**: https://cursor.sh
2. **Click**: "Download for Windows"
3. **Run** the downloaded installer
4. **Follow** the setup wizard
5. **Launch** Cursor from Start menu

### ✅ Verify Cursor:
- **Open Cursor**
- **Sign in** when prompted
- **Create** a new file to test

---

## ⚙️ Step 3: Install Node.js (Required for MCP Server)

Node.js is needed to run the Smartling MCP Server.

### 🍎 macOS:

#### Option A: Direct Download (Easiest)
1. **Go to**: https://nodejs.org
2. **Click**: "Download Node.js (LTS)" - the green button
3. **Open** the downloaded `.pkg` file
4. **Follow** the installer (click Continue/Install)
5. **Enter** your Mac password when prompted

#### Option B: Terminal Installation (Advanced)
**Open Terminal** (Applications → Utilities → Terminal):
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc

# Install latest Node.js
nvm install node
nvm use node
```

### 🪟 Windows:

#### Option A: Direct Download (Easiest)
1. **Go to**: https://nodejs.org
2. **Click**: "Download Node.js (LTS)" - the green button
3. **Run** the downloaded `.msi` installer
4. **Follow** the setup wizard (accept defaults)
5. **Restart** your computer after installation

#### Option B: Package Manager (Advanced)
**Open PowerShell as Administrator**:
```powershell
# Install Chocolatey package manager first
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs
```

### ✅ Verify Node.js Installation:

#### 🍎 macOS - Open Terminal:
```bash
node --version
npm --version
```

#### 🪟 Windows - Open Command Prompt:
```cmd
node --version
npm --version
```

**You should see version numbers** (like `v20.x.x` and `10.x.x`). If you get "command not found", restart your computer and try again.

---

## 📝 Step 4: Install Visual Studio Code (Optional but Recommended)

VS Code is useful for editing configuration files and viewing code.

### 🍎 macOS:
1. **Go to**: https://code.visualstudio.com
2. **Click**: "Download for Mac"
3. **Open** the downloaded `.zip` file
4. **Move** VS Code to Applications folder
5. **Launch** from Applications

### 🪟 Windows:
1. **Go to**: https://code.visualstudio.com  
2. **Click**: "Download for Windows"
3. **Run** the downloaded installer
4. **Follow** the setup wizard
5. **Launch** VS Code from Start menu

### ✅ Verify VS Code:
- **Open VS Code**
- **Create** a new file (File → New File)
- **Test** typing some text

---

## 🔧 Step 5: Install Git (Required for Downloading Code)

Git helps download and manage the Smartling MCP Server code.

### 🍎 macOS:

#### Option A: Direct Download
1. **Go to**: https://git-scm.com/download/mac
2. **Download** the installer
3. **Run** the `.pkg` file
4. **Follow** the installation wizard

#### Option B: Using Terminal (if you have Homebrew)
```bash
# Install Git via Homebrew
brew install git
```

#### Option C: Using Xcode Command Line Tools
```bash
# This installs Git automatically
xcode-select --install
```

### 🪟 Windows:

#### Option A: Direct Download  
1. **Go to**: https://git-scm.com/download/windows
2. **Download** Git for Windows
3. **Run** the installer
4. **Use recommended settings** (just click Next)
5. **Important**: Choose "Git from the command line and also from 3rd-party software"

#### Option B: Package Manager
**Open PowerShell as Administrator**:
```powershell
# Install Git via Chocolatey
choco install git
```

### ✅ Verify Git Installation:

#### 🍎 macOS - Open Terminal:
```bash
git --version
```

#### 🪟 Windows - Open Command Prompt:
```cmd
git --version
```

**You should see a version number** like `git version 2.x.x`.

---

## 📂 Step 6: Learn Basic Terminal/Command Line

You'll need to use the terminal for installation. Here's a quick guide:

### 🍎 macOS - Opening Terminal:
1. **Press**: `Cmd + Space` (opens Spotlight)
2. **Type**: "Terminal"
3. **Press**: Enter

**Basic commands:**
```bash
# See current folder
pwd

# List files in folder  
ls

# Change to a folder
cd folder-name

# Go back one folder
cd ..

# Go to home folder
cd ~
```

### 🪟 Windows - Opening Command Prompt:
1. **Press**: `Windows key + R`
2. **Type**: "cmd"
3. **Press**: Enter

**Basic commands:**
```cmd
# See current folder
cd

# List files in folder
dir

# Change to a folder  
cd folder-name

# Go back one folder
cd ..

# Go to your user folder
cd %USERPROFILE%
```

---

## ✅ Final Verification

Before proceeding to install the Smartling MCP Server, verify you have everything:

### Test Checklist:

#### 🍎 macOS:
**Open Terminal and run:**
```bash
# Check all installations
echo "=== Checking Prerequisites ==="
echo "1. Node.js version:"
node --version
echo "2. NPM version:"  
npm --version
echo "3. Git version:"
git --version
echo "4. Current directory:"
pwd
echo "=== All systems ready! ==="
```

#### 🪟 Windows:
**Open Command Prompt and run:**
```cmd
echo === Checking Prerequisites ===
echo 1. Node.js version:
node --version
echo 2. NPM version:
npm --version  
echo 3. Git version:
git --version
echo 4. Current directory:
cd
echo === All systems ready! ===
```

### Expected Output:
```
=== Checking Prerequisites ===
1. Node.js version:
v20.x.x
2. NPM version:
10.x.x
3. Git version:
git version 2.x.x
4. Current directory:
/Users/yourname (Mac) or C:\Users\yourname (Windows)
=== All systems ready! ===
```

### ✅ You should also have:
- [ ] **Claude Desktop** - opened and signed in
- [ ] **Cursor** - opened and working
- [ ] **VS Code** - opened and working (optional)
- [ ] **Terminal/Command Prompt** - can run basic commands

---

## 🚨 Troubleshooting Common Issues

### "Command not found" errors:
**Problem**: Commands like `node`, `npm`, or `git` not recognized
**Solution**: 
1. **Restart your computer** completely
2. **Reopen terminal/command prompt**
3. **Try the commands again**
4. If still not working, **reinstall** the problematic software

### Node.js installation issues:
**Problem**: npm install fails or Node.js won't work
**Solution**:
1. **Completely uninstall** Node.js
2. **Restart computer**
3. **Download fresh installer** from nodejs.org
4. **Run as administrator** (Windows) or **with sudo** (Mac if needed)

### Mac: "Developer cannot be verified" errors:
**Solution**:
1. **Right-click** the app instead of double-clicking
2. **Select** "Open"
3. **Click** "Open" when prompted
4. **Or go to**: System Preferences → Security & Privacy → Allow anyway

### Windows: "Windows protected your PC" errors:
**Solution**:
1. **Click** "More info"
2. **Click** "Run anyway"
3. **Or temporarily disable** antivirus during installation

---

## ➡️ Next Step

**Once all prerequisites are installed and verified**, you can proceed to:

🎯 **Install the Smartling MCP Server** following the main installation guide

**Estimated total setup time**: 15-30 minutes for first-time users

---

*This prerequisites guide ensures a smooth installation experience for the Smartling MCP Server. Keep this document open while installing for quick reference.* 