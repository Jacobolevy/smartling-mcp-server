# 🚦 Prerequisites: Smartling MCP Server – Quick Setup (Non-Technical)

## 📋 Before You Begin
Make sure you have these **3 essentials** ready. Simple setup for any user.

---

## 🟣 1. Install Claude Desktop (Required)
**Purpose:** The main app where you'll use Smartling translation tools.

### macOS:
1. Go to: https://claude.ai/download
2. Click **"Download for Mac"**
3. Open the downloaded `.dmg` file
4. Drag Claude to Applications folder
5. Launch Claude from Applications

### Windows:
1. Go to: https://claude.ai/download
2. Click **"Download for Windows"**
3. Run the downloaded `.exe` installer
4. Follow the installation wizard
5. Launch Claude from Start menu

### ✅ Verify Claude Desktop:
- Open Claude and sign in with your account
- Test by asking: *"Hello, can you help me?"*
- You should get a response

---

## 🟢 2. Install Cursor (Recommended)
**Purpose:** AI-powered code editor that works great with Smartling tools.

### Both macOS & Windows:
1. Visit: https://cursor.sh
2. Download for your operating system
3. Install and open the application
4. Sign in with your account

### ✅ Verify Cursor:
- Open the app successfully
- Create a test file to confirm it works

---

## 🟡 3. Install Node.js (Required)
**Purpose:** Node.js powers the MCP server that connects Claude to Smartling.

### macOS (Easy Way):
1. Go to: https://nodejs.org
2. Download **Node.js LTS** (the green button)
3. Open the `.pkg` file and follow installer
4. Restart Terminal after installation

### Windows (Easy Way):
1. Go to: https://nodejs.org
2. Download **Node.js LTS** and run the `.msi` installer
3. Restart your computer when finished

### ✅ Verify Node.js:
Open **Terminal** (Mac) or **Command Prompt** (Windows) and run:
```bash
node --version
```
You should see a version number like `v20.x.x` or similar.

---

## 🖥️ 4. Basic Command Line (Quick Learn)

### macOS:
- Press `Cmd + Space` → type **"Terminal"** → Hit Enter

### Windows:
- Press `Windows + R` → Type **"cmd"** → Hit Enter

### Useful Commands:
```bash
node --version    # Check if Node.js is installed
pwd              # Show current directory (Mac)
cd               # Show current directory (Windows)
```

---

## ✅ Final Setup Checklist

Open your **Terminal** (Mac) or **Command Prompt** (Windows) and verify:

```bash
node --version
```

**If you see a version number and no errors, you're ready! 🎉**

---

## 🆘 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **"Command not found"** | Restart computer, then try again |
| **Download errors** | Run installers as administrator |
| **Mac "App can't be opened"** | Right-click → Open → Allow in Security & Privacy |
| **Node.js not found** | Restart Terminal/CMD after Node.js installation |

---

## 🎯 Next Step

✅ **When everything above is verified**, you're ready for the **one-line installer**!

Use this command to install Smartling MCP Server with your credentials:

```bash
curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-with-params.sh | bash -s "YOUR_USER_ID" "YOUR_SECRET"
```

**That's it!** The installer handles everything else automatically.

---

## 📊 What You Get

After installation, you'll have:
- 🚀 **Batch-optimized MCP server** (no crashes on large projects)
- ⏱️ **Smart timeouts** (30s for single ops, 5min for batch ops)
- 🔧 **Auto-configured** Claude Desktop and Cursor
- 📋 **74+ Smartling tools** ready to use
- 🌍 **Access to 227+ translation projects**

**Ready to manage translations like a pro!** 🎯 