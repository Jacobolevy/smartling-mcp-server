# 🚀 CI/CD Implementation Guide - Smartling MCP Server

This document explains the comprehensive CI/CD pipeline implemented for the Smartling MCP Server.

## 🏗️ CI/CD Architecture

### 📋 Overview

Our CI/CD pipeline provides:
- ✅ **Automated Testing** across Node.js 18, 20, 21
- ✅ **Security Scanning** with CodeQL and dependency audits
- ✅ **Docker Image Building** with multi-platform support
- ✅ **Automated Deployment** to Render.com
- ✅ **Performance Monitoring** and health checks
- ✅ **Documentation Updates** and release packaging

## 🔄 Workflow Triggers

### Main CI/CD Workflow (`.github/workflows/ci-cd.yml`)
**Triggers:**
- `push` to `main` or `develop` branches
- `pull_request` to `main` or `develop` branches  
- `release` published

### Security Workflow (`.github/workflows/security.yml`)
**Triggers:**
- `schedule`: Weekly on Monday at 2 AM UTC
- `push` to `main` branch
- `pull_request` to `main` branch

## 🧪 Testing Pipeline

### 1. Multi-Version Testing
```yaml
strategy:
  matrix:
    node-version: [18, 20, 21]
```

### 2. Test Suite (`scripts/test-ci.sh`)
- ✅ Node.js version compatibility
- ✅ Package.json validation
- ✅ Dependencies check
- ✅ Core server files exist
- ✅ MCP protocol compliance
- ✅ Tool count verification (70+ tools)
- ✅ HTTP endpoints test
- ✅ TypeScript compilation
- ✅ JSON format validation
- ✅ Documentation completeness
- ✅ Security checks (no hardcoded secrets)
- ✅ File permissions
- ✅ Docker build test

### 3. npm Scripts for Testing
```bash
npm run test:ci          # Run comprehensive CI test suite
npm run test:security    # Security audit and vulnerability scan
npm run test:performance # Performance testing
npm run lint             # ESLint code quality check
npm run lint:fix         # Auto-fix linting issues
```

## 🔐 Security Pipeline

### 1. Automated Security Scanning
- **npm audit**: Dependency vulnerability scanning
- **CodeQL**: Static code analysis
- **audit-ci**: Advanced vulnerability detection

### 2. Security Configuration (`audit-ci.json`)
```json
{
  "low": true,
  "moderate": true, 
  "high": true,
  "critical": true,
  "report-type": "summary"
}
```

### 3. Security Reports
- Generated as artifacts in GitHub Actions
- Weekly scheduled scans
- Immediate scan on main branch changes

## 🐳 Docker Pipeline

### 1. Multi-Platform Building
- **Platforms**: `linux/amd64`, `linux/arm64`
- **Registry**: GitHub Container Registry (`ghcr.io`)
- **Caching**: GitHub Actions cache for faster builds

### 2. Tagging Strategy
```yaml
tags: |
  type=ref,event=branch
  type=ref,event=pr
  type=semver,pattern={{version}}
  type=raw,value=latest,enable={{is_default_branch}}
```

### 3. Docker Commands
```bash
npm run build:docker    # Build Docker image locally
docker build -t smartling-mcp-server .
```

## 🚀 Deployment Pipeline

### 1. Automatic Deployment to Render
**Conditions:**
- Only on `push` to `main` branch
- After passing tests and build

### 2. Required Secrets
Configure in GitHub repository settings:
```
RENDER_API_KEY         # Render.com API key
RENDER_SERVICE_ID      # Render service ID
```

### 3. Deployment Verification (`scripts/deploy-check.sh`)
- ✅ Base URL accessibility
- ✅ Health endpoint check
- ✅ MCP manifest validation
- ✅ MCP context endpoint
- ✅ SSE endpoint for Wix Chat
- ✅ Tool execution endpoint
- ✅ CORS headers verification
- ✅ Response time monitoring
- ✅ SSL certificate validation

### 4. Deployment Commands
```bash
npm run deploy:check    # Verify deployment status
npm run deploy:verify   # Run deployment verification
```

## 📈 Performance Monitoring

### 1. Automated Performance Tests
```bash
# Response time measurement
curl -w '@scripts/curl-format.txt' \
     -o /dev/null -s \
     https://smartling-mcp.onrender.com/mcp/manifest

# Load testing endpoints
npm run test:performance
```

### 2. Performance Metrics Tracked
- ⏱️ DNS lookup time
- ⏱️ Connection time  
- ⏱️ SSL handshake time
- ⏱️ Transfer time
- ⏱️ Total response time

## 📦 Release Pipeline

### 1. Automated Package Creation
**Trigger:** When a GitHub release is published

### 2. Release Assets
- Automatically creates `smartling-mcp-server-{version}.zip`
- Includes all necessary files for distribution
- Uses `create-package.sh` script

### 3. Release Commands
```bash
npm run prerelease      # Run tests and security checks
npm version patch       # Bump version
git push --tags         # Trigger release pipeline
```

## 📚 Documentation Pipeline

### 1. Automatic Updates
- Tool count updates in README.md
- Changelog updates with deployment info
- Commits changes back to repository

### 2. Documentation Commands
```bash
npm run count-tools     # Count available Smartling tools
npm run list-tools      # List first 20 tools
```

## 🛠️ Local Development with CI/CD

### 1. Run Tests Locally
```bash
# Full CI test suite
npm run test:ci

# Individual test components
npm run test            # Standard MCP tests
npm run test:security   # Security audit
npm run lint           # Code quality check
```

### 2. Simulate CI Environment
```bash
# Install dependencies exactly like CI
npm ci

# Run tests with same Node.js version
nvm use 18
npm run test:ci
```

### 3. Test Docker Build
```bash
# Build and test Docker image
npm run build:docker
docker run -p 3000:3000 smartling-mcp-server
```

## 🔧 Configuration Management

### 1. Environment Variables (`.env.example`)
```bash
SMARTLING_USER_IDENTIFIER=your_user_identifier_here
SMARTLING_USER_SECRET=your_user_secret_here
SMARTLING_BASE_URL=https://api.smartling.com
PORT=3000
NODE_ENV=production
RENDER_EXTERNAL_URL=https://smartling-mcp.onrender.com
```

### 2. ESLint Configuration (`.eslintrc.json`)
- Node.js environment
- ES2022 support
- Recommended rules
- Custom warnings and errors

## 📊 Pipeline Status and Monitoring

### 1. GitHub Actions Dashboard
- View all workflow runs
- Download artifacts (security reports)
- Monitor deployment status

### 2. Render.com Dashboard
- Monitor live deployment
- View logs and metrics
- Environment variable management

### 3. Health Check URLs
```
Production:     https://smartling-mcp.onrender.com
MCP Manifest:   https://smartling-mcp.onrender.com/mcp/manifest
MCP Context:    https://smartling-mcp.onrender.com/mcp/context
SSE (Wix Chat): https://smartling-mcp.onrender.com/sse
```

## 🚨 Troubleshooting CI/CD

### 1. Common Issues

**Tests Failing:**
```bash
# Run locally to debug
npm run test:ci
./scripts/test-ci.sh
```

**Security Scan Failures:**
```bash
# Check vulnerabilities
npm audit
npm run test:security
```

**Docker Build Issues:**
```bash
# Test Docker build locally
docker build -t test-build .
```

**Deployment Failures:**
```bash
# Verify deployment
npm run deploy:check
./scripts/deploy-check.sh
```

### 2. Debugging Steps

1. **Check GitHub Actions logs**
2. **Run tests locally**
3. **Verify environment variables**
4. **Check Render.com logs**
5. **Validate configuration files**

## 🎯 Best Practices

### 1. Development Workflow
1. Create feature branch
2. Run `npm run test:ci` locally
3. Create pull request
4. CI runs automatically
5. Review and merge
6. Automatic deployment to production

### 2. Security Practices
- Never commit secrets to repository
- Use environment variables
- Regular security scans
- Update dependencies regularly

### 3. Performance Optimization
- Monitor response times
- Use Docker layer caching
- Optimize CI pipeline steps
- Use parallel job execution

## 📈 Metrics and KPIs

### 1. CI/CD Metrics
- ✅ Build success rate: Target 95%+
- ⏱️ Build time: Target < 5 minutes
- 🔄 Deployment frequency: Multiple per day
- 📊 Test coverage: Monitor tool coverage

### 2. Production Metrics
- 🌐 Uptime: Target 99.9%
- ⚡ Response time: Target < 2 seconds
- 🔒 Security incidents: Target 0
- 📈 Tool availability: 74+ tools

---

## 🎉 Summary

This CI/CD implementation provides:
- **Reliability**: Comprehensive testing across multiple Node.js versions
- **Security**: Automated vulnerability scanning and code analysis  
- **Performance**: Monitoring and optimization
- **Automation**: Zero-touch deployment pipeline
- **Quality**: Code linting and formatting
- **Documentation**: Automatic updates and release notes

The pipeline ensures that every change to the Smartling MCP Server is thoroughly tested, secure, and deployed reliably to production. 