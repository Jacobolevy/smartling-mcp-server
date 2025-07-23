#!/bin/bash

# 🚀 Force Deploy REAL Smartling API Version
# This script forces a deployment of the real API version

echo "🚀 Forcing deployment of REAL Smartling API..."
echo "📡 Target: https://smartling-mcp.onrender.com"

# Make a dummy commit to trigger deployment
echo "# Deploy trigger $(date)" >> .deploy-trigger
git add .deploy-trigger
git commit -m "🔄 Force deploy REAL API version - $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "✅ Force deployment triggered!"
echo "⏳ Wait 2-3 minutes for deployment to complete"
echo ""
echo "🧪 Test when ready:"
echo "curl https://smartling-mcp.onrender.com/health | grep real-api"
echo ""
echo "🎯 Expected version: 3.0.0-real-api"
echo "🔗 Manual Deploy: https://dashboard.render.com" 