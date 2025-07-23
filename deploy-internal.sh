#!/bin/bash

echo "🏢 Deployando Smartling HTTP Server INTERNO"
echo "✅ Sin conexiones externas - Sin problemas de proxy"
echo ""

# Variables
IMAGE_NAME="smartling-http-internal"
CONTAINER_NAME="smartling-http-server"
PORT=3000

echo "📦 Construyendo imagen Docker..."
docker build -t $IMAGE_NAME .

echo "🛑 Deteniendo container anterior (si existe)..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "🚀 Iniciando servidor interno..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:$PORT \
  --restart unless-stopped \
  -e SMARTLING_USER_ID="${SMARTLING_USER_ID}" \
  -e SMARTLING_SECRET="${SMARTLING_SECRET}" \
  -e SMARTLING_PROJECT_ID="${SMARTLING_PROJECT_ID}" \
  $IMAGE_NAME

echo ""
echo "✅ Servidor desplegado exitosamente!"
echo ""
echo "📊 URLs disponibles:"
echo "  🏠 Servidor interno: http://localhost:$PORT"
echo "  ❤️  Health check: http://localhost:$PORT/health"
echo "  🛠️  Herramientas: http://localhost:$PORT/tools"
echo ""
echo "🔍 Ver logs:"
echo "  docker logs -f $CONTAINER_NAME"
echo ""
echo "🛑 Detener servidor:"
echo "  docker stop $CONTAINER_NAME"
echo ""
echo "🎯 Para tu chat interno usa: http://TU-SERVIDOR-INTERNO:$PORT" 