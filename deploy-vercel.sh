#!/bin/bash

echo "🚀 Deploying Smartling MCP Server to Vercel..."

# Check if project needs to be built
if [ ! -d "dist" ]; then
    echo "📦 Building project..."
    npm run build
fi

echo "🌐 Deploying to Vercel..."

# Deploy to Vercel with environment variables
npx vercel --prod \
  --env SMARTLING_USER_IDENTIFIER=vjwwgsqgeogfkqtmntznqhqxaslfwx \
  --env SMARTLING_USER_SECRET=s16jebo9eafog6ugv1me6paojuIL^38pkd2kv1ltr8e9pa5vj9on825 \
  --env SMARTLING_BASE_URL=https://api.smartling.com \
  --yes

echo "✅ Deployment completed!"
echo ""
echo "🔗 Your MCP server should be available at the URL shown above"
echo "📋 To share with others, just provide them the Vercel URL" 