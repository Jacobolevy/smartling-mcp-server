#!/bin/bash

# 🧪 Comprehensive Test Suite for CI/CD
# Tests all MCP server functionality in automated environments

set -e  # Exit on any error

echo "🧪 Starting Smartling MCP Server Test Suite..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_status "Running: $test_name"
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if eval "$test_command"; then
        print_success "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Node.js version check
run_test "Node.js version compatibility" "node --version && node -e 'console.log(\"Node.js is working\")'"

# Test 2: Package.json validation
run_test "Package.json validation" "node -e 'JSON.parse(require(\"fs\").readFileSync(\"package.json\", \"utf8\"))'"

# Test 3: Dependencies installation check
run_test "Dependencies check" "npm list --depth=0"

# Test 4: Main server files exist
run_test "Core server files exist" "test -f bin/mcp-simple.js && test -f bin/mcp-ultra-basic.js"

# Test 5: Server startup test (ultra-basic)
run_test "Ultra-basic server startup" "timeout 5s node bin/mcp-ultra-basic.js <<< '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}' | grep -q tools"

# Test 6: MCP protocol compliance
run_test "MCP protocol compliance" "echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}' | timeout 10s node bin/mcp-simple.js | jq -e '.result.tools[] | select(.name | startswith(\"smartling_\"))'"

# Test 7: Tool count verification
run_test "Tool count verification" "[ \$(grep -c \"name: 'smartling_\" bin/mcp-simple.js) -ge 70 ]"

# Test 8: HTTP server test (if available)
if command -v curl &> /dev/null; then
    run_test "HTTP endpoints test" "node bin/mcp-simple.js & SERVER_PID=\$!; sleep 3; curl -s http://localhost:3000/mcp/manifest | grep -q smartling; kill \$SERVER_PID"
else
    print_warning "Skipping HTTP test - curl not available"
fi

# Test 9: TypeScript compilation (if available)
if [ -f "tsconfig.json" ] && command -v tsc &> /dev/null; then
    run_test "TypeScript compilation" "npx tsc --noEmit"
else
    print_warning "Skipping TypeScript test - not available"
fi

# Test 10: JSON format validation
run_test "JSON files validation" "find . -name '*.json' -not -path './node_modules/*' -exec node -e 'JSON.parse(require(\"fs\").readFileSync(process.argv[1]))' {} \\;"

# Test 11: Documentation files exist
run_test "Documentation files exist" "test -f README.md && test -f INSTALLATION.md"

# Test 12: License file exists
run_test "License file exists" "test -f LICENSE"

# Test 13: Docker build test (if Dockerfile exists)
if [ -f "Dockerfile" ] && command -v docker &> /dev/null; then
    run_test "Docker build test" "docker build -t smartling-mcp-test . && docker rmi smartling-mcp-test"
else
    print_warning "Skipping Docker test - not available"
fi

# Test 14: Security check for hardcoded credentials
run_test "Security check - no hardcoded secrets" "! grep -r -i \"password\\|secret\\|key\" --include=\"*.js\" --include=\"*.ts\" bin/ src/ | grep -v \"SMARTLING_USER_SECRET\" | grep -v \"process.env\" | grep -v \"your_secret_here\""

# Test 15: File permissions check
run_test "Executable permissions check" "test -x bin/mcp-simple.js && test -x bin/mcp-ultra-basic.js"

echo ""
echo "🏁 Test Suite Complete!"
echo "======================="
echo "📊 Tests run: $TESTS_RUN"
echo "✅ Tests passed: $TESTS_PASSED"
echo "❌ Tests failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! 🎉"
    echo ""
    echo "🚀 Ready for deployment!"
    exit 0
else
    print_error "$TESTS_FAILED test(s) failed"
    echo ""
    echo "🔧 Please fix failing tests before deployment"
    exit 1
fi 