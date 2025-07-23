#!/bin/bash

# Smartling MCP Server - One-Click Install & Deploy
# Usage: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/one-click-install.sh | bash

set -e

echo "⚡ Smartling MCP Server - Instalación One-Click"
echo "=============================================="
echo "🚀 Streaming HTTPS + Deployment automático"
echo ""

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "🖥️  Sistema operativo: $OS"
echo ""

# Check prerequisites
echo "🔍 Verificando prerequisitos..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado"
    echo ""
    echo "📥 Instala Node.js primero:"
    if [[ "$OS" == "mac" ]]; then
        echo "   • Homebrew: brew install node"
        echo "   • Directo: https://nodejs.org (descarga el .pkg)"
    elif [[ "$OS" == "linux" ]]; then
        echo "   • Ubuntu/Debian: sudo apt install nodejs npm"
        echo "   • CentOS/RHEL: sudo yum install nodejs npm"
    fi
    echo "   • Directo: https://nodejs.org"
    echo ""
    echo "🔄 Ejecuta este script de nuevo después de instalar Node.js"
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# Check Git
if ! command -v git &> /dev/null; then
    echo "❌ Git no encontrado"
    echo "📥 Instala Git desde: https://git-scm.com"
    exit 1
fi

echo "✅ Git: $(git --version | head -1)"
echo ""

# Ask for installation type
echo "📋 ¿Qué tipo de instalación prefieres?"
echo ""
echo "1) 🚄 Deployment en Railway - URL compartible 24/7"
echo "2) 🎨 Deployment en Render.com - Gratis, fácil, plug & play"
echo "3) 💻 Instalación local - Solo en tu ordenador"  
echo "4) 🚀 Local + Cloud deployment"
echo ""
read -p "Elige una opción (1/2/3/4): " INSTALL_TYPE

case $INSTALL_TYPE in
    1)
        echo "🚄 Configurando deployment en Railway..."
        DEPLOY_CLOUD="railway"
        INSTALL_LOCAL=false
        ;;
    2)
        echo "🎨 Configurando deployment en Render.com..."
        DEPLOY_CLOUD="render"
        INSTALL_LOCAL=false
        ;;
    3)
        echo "💻 Configurando instalación local..."
        DEPLOY_CLOUD=false
        INSTALL_LOCAL=true
        ;;
    4)
        echo "🚀 Configurando instalación completa..."
        echo "📋 ¿Qué plataforma para cloud? (1) Railway (2) Render.com"
        read -p "Elige (1/2): " CLOUD_PLATFORM
        if [[ "$CLOUD_PLATFORM" == "2" ]]; then
            DEPLOY_CLOUD="render"
        else
            DEPLOY_CLOUD="railway"
        fi
        INSTALL_LOCAL=true
        ;;
    *)
        echo "❌ Opción inválida. Usando instalación local por defecto."
        DEPLOY_CLOUD=false
        INSTALL_LOCAL=true
        ;;
esac

echo ""

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

# Local installation
if [ "$INSTALL_LOCAL" = true ]; then
    echo "💻 === INSTALACIÓN LOCAL ==="
    
    INSTALL_DIR="$HOME/smartling-mcp-streaming"
    echo "📁 Directorio: $INSTALL_DIR"
    
    if [ -d "$INSTALL_DIR" ]; then
        echo "🔄 Actualizando instalación existente..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        echo "📥 Descargando Smartling MCP Server..."
        git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    echo "📦 Instalando dependencias..."
    npm install express cors dotenv eventsource --silent
    npm install --save-dev @types/node @types/express @types/cors typescript --silent
    
    # Create .env file
    echo "📝 Configurando variables de entorno..."
    cat > .env << EOF
# Smartling Credentials
SMARTLING_USER_IDENTIFIER=$SMARTLING_USER_ID
SMARTLING_USER_SECRET=$SMARTLING_USER_SECRET
SMARTLING_BASE_URL=https://api.smartling.com

# Server Configuration  
PORT=3000
HTTPS_PORT=3443

# SSL Configuration
SSL_GENERATE=true
SSL_CERT_PATH=./certs/server.cert
SSL_KEY_PATH=./certs/server.key
EOF

    # Configure MCP clients
    echo "🔧 Configurando clientes MCP..."
    
    # Claude Desktop config
    CLAUDE_CONFIG=""
    if [[ "$OS" == "mac" ]]; then
        CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    elif [[ "$OS" == "linux" ]]; then
        CLAUDE_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
    fi
    
    if [[ "$CLAUDE_CONFIG" != "" ]]; then
        mkdir -p "$(dirname "$CLAUDE_CONFIG")"
        cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "smartling-streaming": {
      "command": "node",
      "args": ["$INSTALL_DIR/scripts/start-https-streaming.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_ID",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
        echo "✅ Claude Desktop configurado"
    fi
    
    # Cursor config
    CURSOR_CONFIG="$HOME/.cursor/mcp.json"
    mkdir -p "$(dirname "$CURSOR_CONFIG")"
    cat > "$CURSOR_CONFIG" << EOF
{
  "mcpServers": {
    "smartling-streaming": {
      "command": "node",
      "args": ["$INSTALL_DIR/scripts/start-https-streaming.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "$SMARTLING_USER_ID",
        "SMARTLING_USER_SECRET": "$SMARTLING_USER_SECRET",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
    echo "✅ Cursor configurado"
    
    # Test installation
    echo "🧪 Probando instalación local..."
    if timeout 5s node scripts/start-https-streaming.js > /dev/null 2>&1; then
        echo "✅ Servidor local funciona correctamente"
    else
        echo "⚠️  Servidor necesita configuración adicional"
    fi
    
    echo ""
    echo "💻 INSTALACIÓN LOCAL COMPLETADA"
    echo "Comandos para usar:"
    echo "  cd $INSTALL_DIR && npm run start:https"
    echo "  URLs locales:"
    echo "    📡 HTTPS: https://localhost:3443"
    echo "    🌐 HTTP: http://localhost:3000"
    echo ""
fi

# Cloud deployment
if [ "$DEPLOY_CLOUD" != false ]; then
    echo "🌐 === DEPLOYMENT EN LA NUBE ==="
    
    if [ "$DEPLOY_CLOUD" = "railway" ]; then
        echo "🚄 Configurando Railway..."
        
        # Check/install Railway CLI
        if ! command -v railway &> /dev/null; then
            echo "📥 Instalando Railway CLI..."
            if [[ "$OS" == "mac" ]] && command -v brew &> /dev/null; then
                brew install railway
            else
                curl -fsSL https://railway.app/install.sh | sh
                export PATH="$HOME/.railway/bin:$PATH"
            fi
        fi
        
        echo "✅ Railway CLI disponible"
        
        # Login to Railway
        if ! railway whoami &> /dev/null; then
            echo "🔐 Iniciando sesión en Railway..."
            echo "🌐 Se abrirá tu navegador..."
            railway login
        fi
        
        RAILWAY_USER=$(railway whoami)
        echo "✅ Conectado como: $RAILWAY_USER"
        
        # Setup project for deployment
        PROJECT_DIR="$HOME/smartling-mcp-railway"
        if [ ! -d "$PROJECT_DIR" ]; then
            git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$PROJECT_DIR"
        else
            cd "$PROJECT_DIR"
            git pull origin main
        fi
        
        cd "$PROJECT_DIR"
        
        # Create Railway project
        echo "🚄 Creando proyecto en Railway..."
        railway init --name "smartling-mcp-streaming-$(date +%s)"
        
        # Set environment variables
        echo "⚙️  Configurando variables de entorno..."
        railway variables set SMARTLING_USER_IDENTIFIER="$SMARTLING_USER_ID"
        railway variables set SMARTLING_USER_SECRET="$SMARTLING_USER_SECRET"
        railway variables set SMARTLING_BASE_URL="https://api.smartling.com"
        railway variables set NODE_ENV="production"
        railway variables set PORT="3000"
        railway variables set SSL_GENERATE="false"
        
        # Install dependencies for deployment
        npm install express cors dotenv eventsource --silent
        
        # Deploy
        echo "🚀 Desplegando a Railway..."
        railway up --detach
        
        # Wait and get URL
        echo "⏳ Esperando deployment..."
        sleep 45
        
        CLOUD_URL=$(railway domain 2>/dev/null || echo "")
        
        if [ -z "$CLOUD_URL" ]; then
            echo "🔧 Generando dominio..."
            railway domain generate
            sleep 10
            CLOUD_URL=$(railway domain 2>/dev/null || echo "")
        fi
        
        PLATFORM_NAME="Railway"
        
    elif [ "$DEPLOY_CLOUD" = "render" ]; then
        echo "🎨 Configurando Render.com..."
        
        # Setup project for Render
        PROJECT_DIR="$HOME/smartling-mcp-render"
        if [ ! -d "$PROJECT_DIR" ]; then
            git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$PROJECT_DIR"
        else
            cd "$PROJECT_DIR"
            git pull origin main
        fi
        
        cd "$PROJECT_DIR"
        
        # Update render.yaml with user credentials
        echo "📋 Configurando render.yaml..."
        sed -i.bak "s/your_user_identifier_here/$SMARTLING_USER_ID/g" render.yaml
        sed -i.bak "s/your_user_secret_here/$SMARTLING_USER_SECRET/g" render.yaml
        
        # Commit changes if git repo
        if [ -d ".git" ]; then
            git add render.yaml
            git commit -m "Update Render config with user credentials" || echo "No changes to commit"
        fi
        
        echo ""
        echo "🎨 RENDER.COM - CONFIGURACIÓN COMPLETADA"
        echo "======================================="
        echo ""
        echo "🌐 PRÓXIMOS PASOS:"
        echo "1. Ve a: https://render.com"
        echo "2. Conéctate con GitHub"
        echo "3. Click 'New' → 'Web Service'"
        echo "4. Conecta este repositorio"
        echo "5. Render detectará automáticamente la configuración"
        echo "6. Click 'Create Web Service'"
        echo ""
        echo "✅ Tu URL será: https://smartling-mcp-streaming.onrender.com"
        echo ""
        
        CLOUD_URL="tu-app.onrender.com"
        PLATFORM_NAME="Render.com"
    fi
    
    if [ -n "$CLOUD_URL" ] && [ "$DEPLOY_CLOUD" = "railway" ]; then
        echo ""
        echo "🌐 DEPLOYMENT COMPLETADO EN $PLATFORM_NAME"
        echo "========================"
        echo ""
        echo "🎉 URL PARA COMPARTIR: https://$CLOUD_URL"
        echo ""
        echo "📡 Endpoints disponibles:"
        echo "  📋 Docs: https://$CLOUD_URL/"
        echo "  🔧 Health: https://$CLOUD_URL/health"  
        echo "  🔀 Streaming: https://$CLOUD_URL/stream/[tool]"
        echo ""
    elif [ "$DEPLOY_CLOUD" = "render" ]; then
        echo "📚 Documentación completa: $PROJECT_DIR/RENDER-DEPLOYMENT-GUIDE.md"
        echo ""
    fi
fi

echo ""
echo "🎉 ¡INSTALACIÓN COMPLETADA!"
echo "=========================="
echo ""

if [ "$INSTALL_LOCAL" = true ]; then
    echo "💻 SERVIDOR LOCAL:"
    echo "  📂 Ubicación: $INSTALL_DIR"
    echo "  🚀 Iniciar: cd $INSTALL_DIR && npm run start:https"
    echo "  🌐 URL: https://localhost:3443"
    echo ""
fi

if [ "$DEPLOY_CLOUD" != false ]; then
    echo "🌐 SERVIDOR EN LA NUBE ($PLATFORM_NAME):"
    if [ "$DEPLOY_CLOUD" = "railway" ] && [ -n "$CLOUD_URL" ]; then
        echo "  📤 URL para compartir: https://$CLOUD_URL"
        echo "  🔧 Gestionar: railway open"
    elif [ "$DEPLOY_CLOUD" = "render" ]; then
        echo "  📤 URL será: https://smartling-mcp-streaming.onrender.com"
        echo "  🔧 Gestionar: https://render.com"
    fi
    echo ""
    
    echo "🔧 CONFIGURACIÓN PARA OTROS USUARIOS:"
    echo "Los usuarios solo necesitan agregar esto a su Cursor/Claude:"
    echo ""
    if [ "$DEPLOY_CLOUD" = "railway" ] && [ -n "$CLOUD_URL" ]; then
        cat << EOF
{
  "mcpServers": {
    "smartling": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-http", "https://$CLOUD_URL"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "sus_credenciales",
        "SMARTLING_USER_SECRET": "su_secreto"
      }
    }
  }
}
EOF
    elif [ "$DEPLOY_CLOUD" = "render" ]; then
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
    fi
    echo ""
fi

echo "📚 Documentación completa:"
if [ "$INSTALL_LOCAL" = true ]; then
    echo "  📖 Local: $INSTALL_DIR/HTTPS-STREAMING-GUIDE.md"
fi
echo "  🌐 Online: https://github.com/Jacobolevy/smartling-mcp-server"
echo ""
echo "🔑 Obtener credenciales: https://dashboard.smartling.com/settings/api"
echo ""
echo "🎯 ¡Disfruta de tu servidor MCP con 74+ herramientas de Smartling!" 