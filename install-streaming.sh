#!/bin/bash

# Smartling MCP Server - One-Line Streaming HTTPS Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/install-streaming.sh | bash

set -e

echo "🚀 Instalando Smartling MCP Server con HTTPS Streaming..."
echo "=================================================="

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "🖥️  SO detectado: $OS"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "📥 Instala Node.js desde: https://nodejs.org"
    echo "   O ejecuta: brew install node (macOS) | apt install nodejs npm (Ubuntu)"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado"
    echo "📥 Instala Git desde: https://git-scm.com"
    exit 1
fi

echo "✅ Git encontrado: $(git --version | head -1)"

# Download the MCP server
INSTALL_DIR="$HOME/smartling-mcp-streaming"
echo "📁 Directorio de instalación: $INSTALL_DIR"

if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Actualizando instalación existente..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "📥 Descargando Smartling MCP Server..."
    git clone https://github.com/Jacobolevy/smartling-mcp-server.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
echo "📦 Instalando dependencias..."
npm install express cors dotenv eventsource

# Install development dependencies
echo "🛠️  Instalando dependencias de desarrollo..."
npm install --save-dev @types/node @types/express @types/cors typescript

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo de configuración..."
    cat > .env << 'EOF'
# Smartling Credentials - REPLACE WITH YOUR VALUES
SMARTLING_USER_IDENTIFIER=your_user_identifier_here
SMARTLING_USER_SECRET=your_user_secret_here
SMARTLING_BASE_URL=https://api.smartling.com

# Server Configuration
PORT=3000
HTTPS_PORT=3443

# SSL Configuration (auto-generate for development)
SSL_GENERATE=true
SSL_CERT_PATH=./certs/server.cert
SSL_KEY_PATH=./certs/server.key
EOF
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de Smartling"
fi

# Set up configurations for MCP clients
echo "🔧 Configurando clientes MCP..."

# Configure Claude Desktop
CLAUDE_CONFIG=""
if [[ "$OS" == "mac" ]]; then
    CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OS" == "linux" ]]; then
    CLAUDE_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
elif [[ "$OS" == "windows" ]]; then
    CLAUDE_CONFIG="$APPDATA/Claude/claude_desktop_config.json"
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
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier_here",
        "SMARTLING_USER_SECRET": "your_user_secret_here",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
    echo "✅ Claude Desktop configurado: $CLAUDE_CONFIG"
fi

# Configure Cursor
CURSOR_CONFIG="$HOME/.cursor/mcp.json"
mkdir -p "$(dirname "$CURSOR_CONFIG")"
cat > "$CURSOR_CONFIG" << EOF
{
  "mcpServers": {
    "smartling-streaming": {
      "command": "node",
      "args": ["$INSTALL_DIR/scripts/start-https-streaming.js"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_user_identifier_here",
        "SMARTLING_USER_SECRET": "your_user_secret_here",
        "SMARTLING_BASE_URL": "https://api.smartling.com"
      }
    }
  }
}
EOF
echo "✅ Cursor configurado: $CURSOR_CONFIG"

# Test the installation
echo "🧪 Probando la instalación..."
echo "📊 Verificando que el servidor inicie correctamente..."

# Test basic functionality
cd "$INSTALL_DIR"
timeout 10s node scripts/start-https-streaming.js > /dev/null 2>&1 && echo "✅ Servidor streaming funciona correctamente" || echo "⚠️  El servidor puede necesitar configuración adicional"

echo ""
echo "🎉 ¡Instalación completada!"
echo "======================="
echo ""
echo "📍 MCP Server instalado en: $INSTALL_DIR"
echo ""
echo "🔧 Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales de Smartling:"
echo "   nano $INSTALL_DIR/.env"
echo ""
echo "2. Inicia el servidor streaming HTTPS:"
echo "   cd $INSTALL_DIR && npm run start:https"
echo ""
echo "3. O usa el servidor desplegado en la nube:"
echo "   curl -fsSL https://raw.githubusercontent.com/Jacobolevy/smartling-mcp-server/main/deploy-to-railway.sh | bash"
echo ""
echo "4. URLs disponibles después de iniciar:"
echo "   📡 HTTPS Streaming: https://localhost:3443"
echo "   🌐 HTTP: http://localhost:3000"
echo "   📋 Documentación: https://localhost:3443/"
echo "   🔧 Health Check: https://localhost:3443/health"
echo ""
echo "5. Reinicia Claude Desktop y Cursor para usar las 74 herramientas de Smartling"
echo ""
echo "📚 Documentación completa: $INSTALL_DIR/HTTPS-STREAMING-GUIDE.md"
echo "🔑 Obtén credenciales en: https://dashboard.smartling.com/settings/api"
echo ""
echo "🎯 ¡Tu servidor MCP con HTTPS streaming está listo!" 