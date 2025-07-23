#!/bin/bash

# Fix Render Deployment - Smartling MCP Server
# Usage: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/fix-render-deployment.sh | bash

set -e

echo "🔧 Solucionando problema de Render deployment..."
echo "=============================================="

# Get Smartling credentials
echo "🔑 Tus credenciales de Smartling:"
read -p "📧 SMARTLING_USER_IDENTIFIER: " SMARTLING_USER_ID
read -s -p "🔐 SMARTLING_USER_SECRET: " SMARTLING_USER_SECRET
echo ""

# Setup corrected project
PROJECT_DIR="$HOME/smartling-mcp-render-fixed"
if [ -d "$PROJECT_DIR" ]; then
    echo "🔄 Limpiando proyecto anterior..."
    rm -rf "$PROJECT_DIR"
fi

echo "📥 Descargando versión corregida..."
git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Create corrected render.yaml
echo "📋 Creando render.yaml corregido..."
cat > render.yaml << EOF
services:
  - type: web
    name: smartling-mcp-streaming-fixed
    env: node
    plan: free
    buildCommand: "npm install express cors dotenv eventsource"
    startCommand: "node scripts/start-https-streaming.js"
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
    healthCheckPath: "/health"
EOF

# Commit changes
git add render.yaml
git commit -m "Fix render.yaml formatting and add correct credentials"

echo ""
echo "✅ PROYECTO CORREGIDO LISTO"
echo "=========================="
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo ""
echo "1. 🌐 Ve a: https://render.com/dashboard"
echo "2. ❌ ELIMINA el servicio actual que está fallando"
echo "3. ➕ Crea nuevo 'Web Service'"
echo "4. 🔗 Conecta ESTE repositorio corregido: $PROJECT_DIR"
echo "5. 🚀 Render usará automáticamente la configuración corregida"
echo ""
echo "📋 CONFIGURACIÓN AUTOMÁTICA:"
echo "✅ Build Command: npm install express cors dotenv eventsource"
echo "✅ Start Command: node scripts/start-https-streaming.js"
echo "✅ Variables de entorno: Configuradas correctamente"
echo "✅ Health Check: /health"
echo ""
echo "🎉 RESULTADO ESPERADO:"
echo "URL: https://smartling-mcp-streaming-fixed.onrender.com"
echo ""
echo "🔧 Si sigues teniendo problemas:"
echo "Configura manualmente en Render Dashboard:"
echo "- Build Command: npm install express cors dotenv eventsource"
echo "- Start Command: node scripts/start-https-streaming.js"
echo "- Env Variables: Desde la tabla de arriba"
echo ""
echo "📊 Test después del deployment:"
echo "curl https://tu-nueva-url.onrender.com/health" 