#!/bin/bash

# Smartling MCP Server - Render.com Deployment Script
# Usage: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-to-render.sh | bash

set -e

echo "🎨 Desplegando Smartling MCP Server a Render.com..."
echo "================================================="

# Get Smartling credentials
echo "🔑 Credenciales de Smartling"
echo "📍 Consíguelas en: https://dashboard.smartling.com/settings/api"
echo ""
read -p "📧 SMARTLING_USER_IDENTIFIER: " SMARTLING_USER_ID

while [ -z "$SMARTLING_USER_ID" ]; do
    echo "❌ El User Identifier es obligatorio"
    read -p "📧 SMARTLING_USER_IDENTIFIER: " SMARTLING_USER_ID
done

read -s -p "🔐 SMARTLING_USER_SECRET: " SMARTLING_USER_SECRET
echo ""

while [ -z "$SMARTLING_USER_SECRET" ]; do
    echo "❌ El User Secret es obligatorio"
    read -s -p "🔐 SMARTLING_USER_SECRET: " SMARTLING_USER_SECRET
    echo ""
done

echo ""

# Setup project directory
PROJECT_DIR="$HOME/smartling-mcp-render"
echo "📁 Configurando proyecto en: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "📥 Descargando proyecto..."
    git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$PROJECT_DIR"
else
    echo "🔄 Actualizando proyecto existente..."
    cd "$PROJECT_DIR"
    git pull origin main
fi

cd "$PROJECT_DIR"

# Create render.yaml for automatic deployment
echo "📋 Creando configuración de Render..."
cat > render.yaml << EOF
services:
  - type: web
    name: smartling-mcp-streaming
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node scripts/start-https-streaming.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: SMARTLING_USER_IDENTIFIER
        value: $SMARTLING_USER_ID
      - key: SMARTLING_USER_SECRET
        value: $SMARTLING_USER_SECRET
      - key: SMARTLING_BASE_URL
        value: https://api.smartling.com
      - key: SSL_GENERATE
        value: false
    healthCheckPath: /health
EOF

# Update package.json for Render
echo "📦 Configurando scripts para Render..."
npm pkg set scripts.start="node scripts/start-https-streaming.js"
npm pkg set scripts.build="npm install"

# Create or update .gitignore
echo "📝 Configurando .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.tsbuildinfo
logs
*.log
tmp/
temp/
certs/
.vercel/
EOF

# Commit changes if this is a git repo
if [ -d ".git" ]; then
    echo "📝 Guardando cambios en Git..."
    git add .
    git commit -m "Add Render.com deployment configuration with HTTPS streaming" || echo "No changes to commit"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo "=========================="
echo ""
echo "🌐 PRÓXIMOS PASOS PARA RENDER:"
echo ""
echo "1. 📂 Ve a: https://render.com"
echo "2. 🔐 Conéctate con tu cuenta de GitHub"
echo "3. ➕ Haz click en 'New' → 'Web Service'"
echo "4. 🔗 Conecta este repositorio:"
echo "   - Si ya tienes fork: selecciona tu fork"
echo "   - Si no: fork desde https://github.com/Jacobolevy/smartling-mcp-server"
echo ""
echo "5. ⚙️  Configuración automática (ya está lista):"
echo "   ✅ Build Command: npm install"
echo "   ✅ Start Command: node scripts/start-https-streaming.js"
echo "   ✅ Variables de entorno: Configuradas automáticamente"
echo ""
echo "6. 🚀 Haz click en 'Create Web Service'"
echo ""
echo "🎯 RESULTADO:"
echo "Tu URL será: https://smartling-mcp-streaming.onrender.com"
echo "(o similar, dependiendo del nombre que elijas)"
echo ""
echo "📡 Endpoints disponibles:"
echo "  📋 Documentación: https://tu-app.onrender.com/"
echo "  🔧 Health Check: https://tu-app.onrender.com/health"
echo "  🔀 Streaming: https://tu-app.onrender.com/stream/[tool_name]"
echo "  📊 Server Events: https://tu-app.onrender.com/events"
echo ""
echo "🔧 CONFIGURACIÓN PARA USUARIOS:"
echo "Una vez deployado, comparte esta configuración:"
echo ""
cat << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://tu-app.onrender.com"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "sus_credenciales",
        "SMARTLING_USER_SECRET": "su_secreto"
      }
    }
  }
}
EOF

echo ""
echo "💡 VENTAJAS DE RENDER:"
echo "✅ HTTPS automático con certificados SSL"
echo "✅ Deploy desde GitHub con auto-updates"
echo "✅ 750 horas gratis/mes (suficiente para uso continuo)"
echo "✅ Zero downtime deployments"
echo "✅ Logs y monitoreo incluidos"
echo "✅ No requiere tarjeta de crédito"
echo ""
echo "📚 Documentación del proyecto: $PROJECT_DIR/HTTPS-STREAMING-GUIDE.md"
echo ""
echo "🎯 ¡Tu servidor MCP con streaming HTTPS estará listo en Render.com!" 