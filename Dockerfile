# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package-simple.json package.json
COPY server-http-simple.js .

# Install dependencies
RUN npm install express cors

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start HTTP server
CMD ["node", "server-http-simple.js"] 