#!/bin/bash

echo "🚀 Configurando repositorio GitHub para Smartling MCP Server..."

# Verificar si Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Por favor instala Git primero."
    exit 1
fi

# Verificar si GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI no detectado. Usaremos configuración manual."
    MANUAL_SETUP=true
else
    MANUAL_SETUP=false
fi

# Inicializar repositorio Git si no existe
if [ ! -d ".git" ]; then
    echo "📁 Inicializando repositorio Git..."
    git init
    git branch -M main
else
    echo "✅ Repositorio Git ya existe"
fi

# Crear .gitignore si no existe
if [ ! -f ".gitignore" ]; then
    echo "📝 Creando .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/

# TypeScript
*.tsbuildinfo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs
*.log

# Distribution packages
smartling-mcp-distributable/
smartling-mcp-server.zip

# Temporary files
tmp/
temp/
EOF
fi

# Agregar archivos al repositorio
echo "📋 Agregando archivos al repositorio..."
git add .
git add .env.example
git add .github/workflows/deploy.yml

# Verificar si hay cambios para commit
if git diff --staged --quiet; then
    echo "ℹ️  No hay cambios nuevos para commit"
else
    echo "💾 Creando commit inicial..."
    git commit -m "feat: Add Smartling MCP Server with HTTP API support

Features:
- Complete MCP server for Smartling API
- 27+ tools for translation management
- HTTP server for cloud deployment
- Support for Vercel, Railway, Docker
- Comprehensive documentation
- Automated deployment workflows"
fi

# Configuración de repositorio remoto
echo ""
echo "🔗 Configuración de repositorio remoto:"
echo ""

if [ "$MANUAL_SETUP" = true ]; then
    echo "📋 CONFIGURACIÓN MANUAL DE GITHUB:"
    echo ""
    echo "1. Ve a https://github.com/new"
    echo "2. Nombre del repositorio: smartling-mcp-server"
    echo "3. Descripción: Complete MCP Server for Smartling Translation Management API"
    echo "4. Público o Privado (tu elección)"
    echo "5. NO inicialices con README, .gitignore o licencia"
    echo ""
    echo "6. Después de crear el repo, ejecuta:"
    echo "   git remote add origin https://github.com/TU_USUARIO/smartling-mcp-server.git"
    echo "   git push -u origin main"
    echo ""
else
    echo "🤖 ¿Quieres crear el repositorio automáticamente con GitHub CLI? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🚀 Creando repositorio en GitHub..."
        gh repo create smartling-mcp-server \
            --description "Complete MCP Server for Smartling Translation Management API" \
            --public \
            --source=. \
            --remote=origin \
            --push
        
        echo "✅ ¡Repositorio creado y código subido!"
    else
        echo "📋 Para crear manualmente, sigue las instrucciones arriba."
    fi
fi

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo ""
echo "1. 📁 Repositorio GitHub: Listo"
echo "2. 🌐 Deploy a Vercel:"
echo "   - Ve a https://vercel.com"
echo "   - Conecta GitHub"
echo "   - Importa tu repositorio"
echo "   - Configura variables de entorno"
echo ""
echo "3. 🔧 Variables de entorno en Vercel:"
echo "   SMARTLING_USER_IDENTIFIER=tu_user_identifier"
echo "   SMARTLING_USER_SECRET=tu_user_secret"
echo ""
echo "4. 🚀 URL final: https://smartling-mcp-server.vercel.app"
echo ""
echo "📚 Ver DEPLOYMENT.md para opciones avanzadas"
echo ""
echo "✅ ¡Tu MCP Server estará disponible 24/7 sin mantener archivos locales!" 