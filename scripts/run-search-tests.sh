#!/bin/bash

# Search Functionality Test Runner Script
# This script provides an easy way to run the search functionality tests

set -e

echo "🔍 Search Functionality Test Suite"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if development server is running
echo "🔧 Checking development server..."
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  Development server not running on localhost:3000"
    echo "   Please start it with: npm run dev"
    echo ""
    echo "   Or set TEST_BASE_URL environment variable:"
    echo "   export TEST_BASE_URL=http://your-server-url"
    echo ""
fi

# Check if dataset exists
echo "📊 Checking dataset..."
if [ -f "data/fake-therapists-complete.json" ]; then
    DATASET_SIZE=$(jq length data/fake-therapists-complete.json 2>/dev/null || echo "unknown")
    echo "✅ Dataset found: data/fake-therapists-complete.json ($DATASET_SIZE entries)"
elif [ -f "data/therapists.json" ]; then
    DATASET_SIZE=$(jq length data/therapists.json 2>/dev/null || echo "unknown")
    echo "✅ Dataset found: data/therapists.json ($DATASET_SIZE entries)"
else
    echo "⚠️  No dataset file found in data/ directory"
fi

echo ""

# Run the test suite
echo "🧪 Running search functionality tests..."
echo ""

# Check if tsx is available
if command -v tsx > /dev/null 2>&1; then
    echo "Using tsx to run TypeScript tests..."
    tsx scripts/test-search-functionality.ts
elif command -v npx > /dev/null 2>&1; then
    echo "Using npx tsx to run TypeScript tests..."
    npx tsx scripts/test-search-functionality.ts
else
    echo "❌ Error: tsx not found. Please install it:"
    echo "   npm install -g tsx"
    echo "   or"
    echo "   npm install --save-dev tsx"
    exit 1
fi

echo ""
echo "✅ Test execution completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review the test results above"
echo "2. Check the detailed report in test-reports/ directory"
echo "3. If tests failed, check the suggestions for fixes"
echo "4. Re-run tests after making fixes"
echo ""
echo "🔧 Manual testing:"
echo "1. Open http://localhost:3000/questionnaire-v1"
echo "2. Complete the questionnaire with test data"
echo "3. Verify search results match expectations"
echo "4. Check browser dev tools for network requests and console errors"
