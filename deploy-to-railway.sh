#!/bin/bash

# Smartling MCP Server - Railway Deployment Script
# Usage: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-to-railway.sh | bash

set -e

echo "🚄 Desplegando Smartling MCP Server a Railway..."
echo "==============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📥 Instalando Railway CLI..."
    
    # Detect OS and install Railway CLI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install railway
        else
            echo "❌ Homebrew no encontrado. Instala Railway CLI manualmente:"
            echo "   curl -fsSL https://railway.app/install.sh | sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://railway.app/install.sh | sh
        export PATH="$HOME/.railway/bin:$PATH"
    else
        echo "❌ OS no soportado para instalación automática de Railway CLI"
        echo "📥 Instala Railway CLI manualmente desde: https://docs.railway.app/develop/cli"
        exit 1
    fi
fi

echo "✅ Railway CLI disponible"

# Login to Railway (if not already logged in)
if ! railway whoami &> /dev/null; then
    echo "🔐 Iniciando sesión en Railway..."
    echo "🌐 Se abrirá tu navegador para autenticación..."
    railway login
fi

RAILWAY_USER=$(railway whoami)
echo "✅ Conectado a Railway como: $RAILWAY_USER"

# Get or download the project
PROJECT_DIR="$HOME/smartling-mcp-railway"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📥 Descargando proyecto..."
    git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$PROJECT_DIR"
else
    echo "📁 Usando proyecto existente en: $PROJECT_DIR"
    cd "$PROJECT_DIR"
    git pull origin main
fi

cd "$PROJECT_DIR"

# Create Railway project
echo "🚄 Creando proyecto en Railway..."
railway init --name "smartling-mcp-streaming"

# Set up environment variables
echo "⚙️  Configurando variables de entorno..."

echo "🔑 Configura tus credenciales de Smartling:"
read -p "📧 SMARTLING_USER_IDENTIFIER: " SMARTLING_USER_ID
read -s -p "🔐 SMARTLING_USER_SECRET: " SMARTLING_USER_SECRET
echo ""

# Set environment variables in Railway
railway variables set SMARTLING_USER_IDENTIFIER="$SMARTLING_USER_ID"
railway variables set SMARTLING_USER_SECRET="$SMARTLING_USER_SECRET"
railway variables set SMARTLING_BASE_URL="https://api.smartling.com"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set SSL_GENERATE="false"  # Railway provides HTTPS

# Update package.json to use streaming server for Railway
echo "📦 Configurando scripts para Railway..."
npm pkg set scripts.start="node scripts/start-https-streaming.js"
npm pkg set scripts.deploy="node scripts/start-https-streaming.js"

# Create Procfile for Railway (optional, but good practice)
echo "web: node scripts/start-https-streaming.js" > Procfile

# Deploy to Railway
echo "🚀 Desplegando a Railway..."
railway up --detach

# Wait for deployment
echo "⏳ Esperando que el deployment complete..."
sleep 30

# Get the URL
echo "🌐 Obteniendo URL del proyecto..."
RAILWAY_URL=$(railway domain)

if [ -z "$RAILWAY_URL" ]; then
    echo "🔧 Generando dominio público..."
    railway domain generate
    sleep 10
    RAILWAY_URL=$(railway domain)
fi

echo ""
echo "🎉 ¡Deployment completado!"
echo "========================="
echo ""
echo "🌐 URL de tu servidor streaming: https://$RAILWAY_URL"
echo ""
echo "📡 Endpoints disponibles:"
echo "   📋 Documentación: https://$RAILWAY_URL/"
echo "   🔧 Health Check: https://$RAILWAY_URL/health"
echo "   🔀 Streaming: https://$RAILWAY_URL/stream/[tool_name]"
echo "   📊 Server Events: https://$RAILWAY_URL/events"
echo ""
echo "🔧 Configuración para MCP Clients:"
echo ""
echo "Para Cursor (~/.cursor/mcp.json):"
cat << EOF
{
  "mcpServers": {
    "smartling-streaming": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://$RAILWAY_URL"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_ID",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET"
      }
    }
  }
}
EOF

echo ""
echo "Para Claude Desktop:"
CLAUDE_CONFIG_EXAMPLE=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_EXAMPLE="~/Library/Application Support/Claude/claude_desktop_config.json"
else
    CLAUDE_CONFIG_EXAMPLE="~/.config/Claude/claude_desktop_config.json"
fi

echo "Archivo: $CLAUDE_CONFIG_EXAMPLE"
cat << EOF
{
  "mcpServers": {
    "smartling-streaming": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://$RAILWAY_URL"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_ID",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET"
      }
    }
  }
}
EOF

echo ""
echo "💡 Comandos útiles de Railway:"
echo "   railway logs    # Ver logs del servidor"
echo "   railway open    # Abrir en navegador"
echo "   railway status  # Estado del deployment"
echo ""
echo "🎯 ¡Tu servidor MCP está ahora disponible 24/7 con HTTPS streaming!"
echo "📤 Comparte esta URL con otros: https://$RAILWAY_URL"
echo ""
echo "🔄 Para actualizar el servidor en el futuro:"
echo "   cd $PROJECT_DIR && git pull && railway up" 