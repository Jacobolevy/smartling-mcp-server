# 🚀 Direct Smartling Integration for Your Internal Chat

**✅ SOLVES:** `Connection Error: Failed to connect via proxy`

**⚡ NO HTTP server - NO proxy errors**

---

## 🎯 What problem does this solve?

Your internal chat is behind a corporate proxy that blocks:
- ❌ Connections to `smartling-mcp.onrender.com`
- ❌ Connections to `localhost:3000`
- ❌ Any HTTP server

**SOLUTION:** Direct integration in your chat code

---

## 📋 2 Options based on your chat type:

### 🔧 **Option 1: Backend Chat (Node.js/Server)**
**Use:** `chat-integration.js`

### 🌐 **Option 2: Frontend Chat (Web/Browser)**
**Use:** `browser-integration.js`

---

## 🚀 **OPTION 1: Backend Chat (Node.js)**

### Step 1: Copy file
```bash
# Copy to your chat project
cp chat-integration.js /your/chat/project/
```

### Step 2: Integrate in your chat
```javascript
// In your main chat file
const { SmartlingChatDirect, handleChatCommand, initSmartling } = require('./chat-integration');

// Initialize when starting the chat
async function startChat() {
  const connected = await initSmartling();
  if (connected) {
    console.log('✅ Smartling ready in chat');
  }
}

// Intercept user messages
async function onUserMessage(message, user) {
  // Check Smartling commands
  const response = await handleChatCommand(message, user);
  if (response) {
    sendMessageToChat(response, 'system');
    return; // Command processed
  }
  
  // Process normal message
  processNormalMessage(message, user);
}
```

### Step 3: Available commands
```
/translate Hello world    → Sends "Hello world" to Smartling
```

---

## 🌐 **OPTION 2: Web Chat (Frontend)**

### Step 1: Add script
```html
<!-- In your chat HTML -->
<script src="browser-integration.js"></script>
```

### Step 2: Auto-integration
When the page loads:
- ✅ Connects to Smartling automatically
- ✅ Intercepts `/translate` commands
- ✅ Shows status in console

### Step 3: Customize for your chat
```javascript
// Replace the showChatMessage() function in browser-integration.js
function showChatMessage(message, type = 'user') {
  // Put your message display function here
  const chatDiv = document.getElementById('your-chat-container');
  const msgDiv = document.createElement('div');
  msgDiv.textContent = message;
  msgDiv.className = type;
  chatDiv.appendChild(msgDiv);
}
```

---

## 🧪 **Test that it works:**

### Test from console:
```javascript
// In browser console or Node.js:

// Verify connection
await smartlingChat.getAccountInfo();
// → { accounts: [{ accountName: "Wix" }] }

// Send message for translation  
await smartlingChat.translateMessage("Hello world", "TestUser");
// → { uploadResults: {...}, fileUri: "chat-123.json" }

// View available projects
await smartlingChat.getProjects();
// → { totalCount: 227, data: [...] }
```

---

## 🔧 **Advanced customization:**

### Change target project:
```javascript
// In chat-integration.js or browser-integration.js, line ~55:
projectId: '77259ac0d', // ← Change to your project

// To see all available projects:
const projects = await smartling.getProjects();
console.log(projects.data.map(p => ({ id: p.projectId, name: p.projectName })));
```

### Add more commands:
```javascript
// In the handleChatCommand function, add:
if (message === '/smartling projects') {
  const projects = await smartling.getProjects();
  return `📊 Projects: ${projects.totalCount} available`;
}

if (message.startsWith('/translate-to-es ')) {
  const text = message.replace('/translate-to-es ', '');
  // Spanish-specific logic
}
```

---

## 📊 **Monitoring and logs:**

### See what's happening:
```javascript
// Add logs in functions:
async function translateMessage(message, user) {
  console.log(`🔄 Translating: "${message}" by ${user}`);
  
  try {
    const result = await this.callSmartling('smartling_upload_file', {...});
    console.log(`✅ Sent to Smartling:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Translation error:`, error);
    throw error;
  }
}
```

---

## 🆘 **Troubleshooting:**

### Error: "Module not found"
```bash
# Check you have Node.js
node --version

# If web chat, use browser-integration.js
# If server chat, use chat-integration.js
```

### Error: "Cannot find module 'https'"
```javascript
// You're using the wrong version
// ✅ Backend: chat-integration.js (uses require)
// ✅ Frontend: browser-integration.js (uses fetch)
```

### Error: "fetch is not defined"
```javascript
// You're using browser-integration.js in Node.js
// ✅ Use chat-integration.js for backend
```

### Proxy still blocking:
```javascript
// If even this fails, you need:
// 1. Ask IT for whitelist: smartling-mcp.onrender.com
// 2. Or use corporate VPN
// 3. Or configure proxy bypass in code
```

---

## ✅ **Advantages of this solution:**

- 🚫 **No HTTP server** - No port issues
- 🔒 **Direct integration** - Part of your chat
- ⚡ **No latency** - Direct calls to Smartling
- 🛠️ **Customizable** - Adapt to your specific chat
- 📊 **227 projects** available from Wix
- 🌍 **Real API** connected to Smartling

---

## 🎯 **Summary:**

1. **📥 Copy** the corresponding file to your project
2. **🔧 Integrate** in your chat code  
3. **🧪 Test** with `/translate message`
4. **✅ Works** without proxy issues

**Need specific help with your chat type? Just ask! 🚀** 