#!/bin/bash

echo "🏢 Deploying INTERNAL Smartling HTTP Server"
echo "✅ No external connections - No proxy issues"
echo ""

# Variables
IMAGE_NAME="smartling-http-internal"
CONTAINER_NAME="smartling-http-server"
PORT=3000

echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME .

echo "🛑 Stopping previous container (if exists)..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "🚀 Starting internal server..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:$PORT \
  --restart unless-stopped \
  -e SMARTLING_USER_ID="${SMARTLING_USER_ID}" \
  -e SMARTLING_SECRET="${SMARTLING_SECRET}" \
  -e SMARTLING_PROJECT_ID="${SMARTLING_PROJECT_ID}" \
  $IMAGE_NAME

echo ""
echo "✅ Server deployed successfully!"
echo ""
echo "📊 Available URLs:"
echo "  🏠 Internal server: http://localhost:$PORT"
echo "  ❤️  Health check: http://localhost:$PORT/health"
echo "  🛠️  Tools: http://localhost:$PORT/tools"
echo ""
echo "🔍 View logs:"
echo "  docker logs -f $CONTAINER_NAME"
echo ""
echo "🛑 Stop server:"
echo "  docker stop $CONTAINER_NAME"
echo ""
echo "🎯 For your internal chat use: http://YOUR-INTERNAL-SERVER:$PORT" 