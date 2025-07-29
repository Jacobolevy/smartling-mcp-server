# Use official Node.js runtime as base image
FROM node:18-alpine

# Install curl for health check
RUN apk --no-cache add curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build the project
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use the correct npm script for streaming server
CMD ["npm", "run", "start:streaming"] 