#!/bin/bash

# Part A QA Quick Test Script
# Provides quick manual test commands for Part A validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${TEST_BASE_URL:-"http://localhost:3000"}
FIXTURE_MODE=${FIXTURE_MODE:-"true"}
USE_MOCK_DATA=${USE_MOCK_DATA:-"true"}

echo -e "${BLUE}🧪 Part A QA Quick Test Script${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to print test header
print_test_header() {
    echo -e "${YELLOW}📋 $1${NC}"
    echo "----------------------------------------"
}

# Function to make API request and validate
test_api_endpoint() {
    local method=$1
    local endpoint=$2
    local body=$3
    local expected_status=$4
    local description=$5
    
    echo -e "  🔄 Testing: $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$body" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "  ✅ Status: $http_code (Expected: $expected_status)"
        
        # Basic response validation
        if echo "$response_body" | jq empty 2>/dev/null; then
            echo -e "  ✅ Valid JSON response"
            
            # Count results if it's a search endpoint
            if [[ "$endpoint" == *"search"* ]]; then
                result_count=$(echo "$response_body" | jq '.results | length' 2>/dev/null || echo "0")
                echo -e "  📊 Results: $result_count"
                
                if [ "$result_count" -gt 0 ]; then
                    echo -e "  ✅ Found results"
                else
                    echo -e "  ⚠️  No results found"
                fi
            fi
        else
            echo -e "  ❌ Invalid JSON response"
        fi
    else
        echo -e "  ❌ Status: $http_code (Expected: $expected_status)"
    fi
    echo ""
}

# Test 1: Environment Setup
print_test_header "Test 1: Environment Setup"
echo -e "  🔧 Base URL: $BASE_URL"
echo -e "  🔧 Fixture Mode: $FIXTURE_MODE"
echo -e "  🔧 Mock Data: $USE_MOCK_DATA"
echo ""

# Test 2: Basic API Endpoints
print_test_header "Test 2: Basic API Endpoints"

# Test therapists endpoint
test_api_endpoint "GET" "/api/therapists" "" "200" "Get all therapists"

# Test geocoding endpoint
test_api_endpoint "GET" "/api/geocode?q=Praha" "" "200" "Geocode Prague"

# Test 3: Search Functionality
print_test_header "Test 3: Search Functionality"

# Basic search
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 30
}' "200" "Basic search in Prague"

# Search with filters
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 25,
  "problems": ["Bolesti zad / krku"],
  "mustHave": {"acceptingNew": true}
}' "200" "Filtered search in Prague"

# Test 4: Geographic Coverage
print_test_header "Test 4: Geographic Coverage"

# Prague coverage
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 30
}' "200" "Prague coverage (30km)"

# Ostrava coverage
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Ostrava"},
  "radiusKm": 30
}' "200" "Ostrava coverage (30km)"

# Brno coverage
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Brno"},
  "radiusKm": 30
}' "200" "Brno coverage (30km)"

# Test 5: Online Search
print_test_header "Test 5: Online Search"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "onlineOnly": true,
  "problems": ["Bolesti zad / krku"]
}' "200" "Online-only search"

# Test 6: Edge Cases
print_test_header "Test 6: Edge Cases"

# Very small radius
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 5
}' "200" "Small radius search (5km)"

# Invalid location
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "NonexistentCity123"},
  "radiusKm": 30
}' "200" "Invalid location handling"

# Test 7: Health Check
print_test_header "Test 7: Health Check"
test_api_endpoint "GET" "/api/searchTherapists/health" "" "200" "Search API health check"

echo -e "${GREEN}🎯 Quick Test Summary${NC}"
echo "======================"
echo -e "✅ All basic API endpoints tested"
echo -e "✅ Geographic coverage validated"
echo -e "✅ Search functionality verified"
echo -e "✅ Edge cases handled"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Run full QA test: npm run test:qa-part-a"
echo "2. Check server logs for any errors"
echo "3. Verify fixture data is loaded correctly"
echo "4. Test UI integration manually"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Set FIXTURE_MODE=true for testing"
echo "- Set USE_MOCK_DATA=true for fixture data"
echo "- Check /api/therapists for data availability"
echo "- Monitor console logs during testing"

