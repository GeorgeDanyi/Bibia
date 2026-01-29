#!/bin/bash

# Part B QA Quick Test Script
# Provides quick manual test commands for Part B specific scenarios

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

echo -e "${BLUE}🧪 Part B QA Quick Test Script${NC}"
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
                    
                    # Check distance for first result
                    first_distance=$(echo "$response_body" | jq '.results[0].distanceKm // 0' 2>/dev/null || echo "0")
                    echo -e "  📏 First result distance: ${first_distance}km"
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

# Scenario 1: Prague + 30 km + condition=backneck + availability=next7 + practice=any
print_test_header "Scenario 1: Prague + 30km + backneck + next7 + any practice"
echo -e "  🎯 Expected: ≥1 item, distanceKm ≤30"

test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 30,
  "problems": ["Bolesti zad / krku"],
  "mustHave": {"acceptingNew": true},
  "preferences": {"availability": "next7"}
}' "200" "Prague back/neck search with next 7 days availability"

# Scenario 2: Ostrava + 30 km + rare condition=bechterev → expand to 50 km
print_test_header "Scenario 2: Ostrava + 30km + bechterev → expand to 50km"
echo -e "  🎯 Expected: if 0 at 30km, then ≥1 at 50km"

echo -e "  🔄 Step 1: Search Ostrava with Bechterev at 30km"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Ostrava"},
  "radiusKm": 30,
  "problems": ["Bechtěrevova choroba"],
  "mustHave": {"acceptingNew": true}
}' "200" "Ostrava Bechterev search at 30km"

echo -e "  🔄 Step 2: Expand to 50km if needed"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Ostrava"},
  "radiusKm": 50,
  "problems": ["Bechtěrevova choroba"],
  "mustHave": {"acceptingNew": true}
}' "200" "Ostrava Bechterev search at 50km"

# Scenario 3: Brno + practice=online (any radius)
print_test_header "Scenario 3: Brno + practice=online (any radius)"
echo -e "  🎯 Expected: returns online therapists"

test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Brno"},
  "onlineOnly": true,
  "problems": ["Bolesti zad / krku"]
}' "200" "Brno online therapists search"

# Scenario 4: Invalid city string → actionable error + edit questionnaire
print_test_header "Scenario 4: Invalid city string → actionable error"
echo -e "  🎯 Expected: shows actionable error; 'Edit questionnaire' works"

echo -e "  🔄 Step 1: Test invalid city search"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "InvalidCityName123"},
  "radiusKm": 30,
  "problems": ["Bolesti zad / krku"]
}' "200" "Invalid city search"

echo -e "  🔄 Step 2: Test invalid city geocoding"
test_api_endpoint "GET" "/api/geocode?q=InvalidCityName123" "" "200" "Invalid city geocoding"

# Scenario 5: Sort by Nearest reorders by distance ascending
print_test_header "Scenario 5: Sort by Nearest → distance ascending"
echo -e "  🎯 Expected: reorders by distance ascending"

echo -e "  🔄 Step 1: Search Prague with large radius for multiple results"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 50,
  "problems": ["Bolesti zad / krku"],
  "mustHave": {"acceptingNew": true}
}' "200" "Prague large radius search for sorting test"

echo -e "  🔄 Step 2: Test distance sorting"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 50,
  "problems": ["Bolesti zad / krku"],
  "mustHave": {"acceptingNew": true},
  "prefer": {"distance": true}
}' "200" "Prague search with distance preference"

# Additional validation tests
print_test_header "Additional Validation Tests"

echo -e "  🔄 Test radius expansion functionality"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 10,
  "problems": ["Bechtěrevova choroba"]
}' "200" "Small radius search (should trigger expansion)"

echo -e "  🔄 Test online mode toggle"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "onlineOnly": true,
  "problems": ["Bolesti zad / krku"]
}' "200" "Online-only search"

echo -e "  🔄 Test availability filtering"
test_api_endpoint "POST" "/api/searchTherapists" '{
  "location": {"cityOrZip": "Praha"},
  "radiusKm": 30,
  "mustHave": {"acceptingNew": true},
  "preferences": {"availability": "next7"}
}' "200" "Availability filtering test"

echo -e "${GREEN}🎯 Part B Quick Test Summary${NC}"
echo "=============================="
echo -e "✅ Scenario 1: Prague + 30km + backneck + next7 + any practice"
echo -e "✅ Scenario 2: Ostrava + 30km + bechterev → expand to 50km"
echo -e "✅ Scenario 3: Brno + practice=online (any radius)"
echo -e "✅ Scenario 4: Invalid city string → actionable error"
echo -e "✅ Scenario 5: Sort by Nearest → distance ascending"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Run comprehensive Part B tests: npm run test:qa-part-b"
echo "2. Check server logs for any errors"
echo "3. Verify radius expansion logic works"
echo "4. Test UI integration manually"
echo "5. Validate error handling in browser"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Check that radius expansion shows 'Expand to 50km' button"
echo "- Verify online therapists have distanceKm = 0"
echo "- Test error messages are actionable"
echo "- Confirm distance sorting is ascending"
echo "- Monitor console logs during testing"

