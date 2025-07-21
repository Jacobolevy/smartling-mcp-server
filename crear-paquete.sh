#!/bin/bash

echo "📦 Creando paquete de distribución para MCP Smartling..."

# Crear directorio temporal para el paquete
PACKAGE_DIR="smartling-mcp-distributable"
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

echo "📁 Copiando archivos esenciales..."

# Copiar archivos del proyecto (sin credenciales ni build)
cp -r src/ $PACKAGE_DIR/
cp package.json $PACKAGE_DIR/
cp tsconfig.json $PACKAGE_DIR/
cp README.md $PACKAGE_DIR/
cp INSTALACION.md $PACKAGE_DIR/
cp setup.sh $PACKAGE_DIR/
cp .env.example $PACKAGE_DIR/

# Copiar archivos de configuración
cp cursor-mcp-config.json $PACKAGE_DIR/
cp cursor-settings-update.json $PACKAGE_DIR/
cp mcp-config-example.json $PACKAGE_DIR/

# Copiar ejemplos
cp -r examples/ $PACKAGE_DIR/

# Crear .gitignore para el paquete
cat > $PACKAGE_DIR/.gitignore << 'EOF'
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
build/

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

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# npm
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# Temporary folders
tmp/
temp/
EOF

# Hacer ejecutable el setup.sh
chmod +x $PACKAGE_DIR/setup.sh

echo "📋 Creando archivo de instrucciones..."

cat > $PACKAGE_DIR/LEEME-PRIMERO.txt << 'EOF'
🚀 MCP SERVER DE SMARTLING - INSTRUCCIONES RÁPIDAS

1. PRERREQUISITOS:
   - Node.js (versión 18+): https://nodejs.org/
   - Cuenta de Smartling con credenciales de API

2. INSTALACIÓN RÁPIDA:
   ./setup.sh

3. CONFIGURAR CREDENCIALES:
   - Editar archivo .env con tus credenciales de Smartling
   - Obtener credenciales en: https://dashboard.smartling.com
     → Account Settings → API → Token Management

4. CONFIGURAR EN CURSOR:
   - Ver INSTALACION.md para instrucciones detalladas
   - O copiar: cursor-mcp-config.json a la configuración de Cursor

5. DOCUMENTACIÓN COMPLETA:
   - INSTALACION.md - Guía paso a paso
   - README.md - Documentación general
   - examples/ - Ejemplos de uso

¡Listo para usar!
EOF

# Crear archivo ZIP
echo "🗜️ Creando archivo ZIP..."
zip -r smartling-mcp-server.zip $PACKAGE_DIR/ -x "*.DS_Store"

echo ""
echo "✅ ¡Paquete creado exitosamente!"
echo ""
echo "📦 Para enviar a otra persona:"
echo "   📁 smartling-mcp-server.zip"
echo ""
echo "📋 El ZIP contiene:"
echo "   - Todo el código fuente"
echo "   - Scripts de instalación"
echo "   - Documentación completa"
echo "   - Ejemplos de uso"
echo "   - Configuraciones para Cursor"
echo ""
echo "⚠️  IMPORTANTE: El archivo .env NO está incluido (por seguridad)"
echo "   La otra persona debe crear sus propias credenciales"
echo ""
echo "📁 También puedes enviar la carpeta: $PACKAGE_DIR/" 