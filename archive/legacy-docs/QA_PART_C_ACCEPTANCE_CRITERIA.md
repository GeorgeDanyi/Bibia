# Part C QA Acceptance Criteria Testing Guide

## Overview

This document provides comprehensive testing scenarios for Part C acceptance criteria, ensuring that all scenarios pass with fixtures enabled and URL deep-linking works correctly.

## 🎯 Part C Acceptance Criteria

The following acceptance criteria must be validated:

1. **All scenarios pass with fixtures enabled** - All Part A and Part B scenarios work correctly when fixture mode is enabled
2. **URL deep-link to /results with all params renders same state on refresh** - URL parameters are properly parsed and state persists across page refresh

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Enable fixture mode for testing
export FIXTURE_MODE=true
export USE_MOCK_DATA=true
export BIBIA_USE_FIXTURES=true

# Start the development server
npm run dev
```

### 2. Run Quick Tests

```bash
# Make the quick test script executable
chmod +x scripts/qa-part-c-quick-test.sh

# Run quick manual tests
./scripts/qa-part-c-quick-test.sh
```

### 3. Run Comprehensive Tests

```bash
# Run full Part C acceptance criteria test suite
npm run test:qa-part-c

# Or run directly with ts-node
npx ts-node scripts/qa-part-c-acceptance.ts
```

## 📋 Acceptance Criteria Tests

### Acceptance Criteria 1: All Scenarios Pass with Fixtures Enabled

**Goal**: Validate that all Part A and Part B scenarios work correctly when fixture mode is enabled

#### Part A Scenarios with Fixtures

**Test 1.1: Prague Back/Neck Search with Fixtures**
```bash
# Test Prague back/neck search with fixtures
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true}
  }'

# Expected: Returns results with fixtures enabled
```

**Test 1.2: Ostrava Bechterev Search with Fixtures**
```bash
# Test Ostrava Bechterev search with fixtures
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Ostrava"},
    "radiusKm": 30,
    "problems": ["Bechtěrevova choroba"],
    "mustHave": {"acceptingNew": true}
  }'

# Expected: Returns results with fixtures enabled
```

**Test 1.3: Brno Search with Fixtures**
```bash
# Test Brno search with fixtures
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Brno"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true}
  }'

# Expected: Returns results with fixtures enabled
```

#### Part B Scenarios with Fixtures

**Test 1.4: Prague Back/Neck + Next7 with Fixtures**
```bash
# Test Prague back/neck with next 7 days availability
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true},
    "preferences": {"availability": "next7"}
  }'

# Expected: Returns results with fixtures enabled
```

**Test 1.5: Ostrava Bechterev 50km with Fixtures**
```bash
# Test Ostrava Bechterev with 50km radius
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Ostrava"},
    "radiusKm": 50,
    "problems": ["Bechtěrevova choroba"],
    "mustHave": {"acceptingNew": true}
  }'

# Expected: Returns results with fixtures enabled
```

**Test 1.6: Brno Online with Fixtures**
```bash
# Test Brno online search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Brno"},
    "onlineOnly": true,
    "problems": ["Bolesti zad / krku"]
  }'

# Expected: Returns online results with fixtures enabled
```

#### Fixture Mode Validation

**Test 1.7: Verify Fixture Data is Loaded**
```bash
# Check if fixtures are loaded
curl http://localhost:3000/api/therapists | jq '. | length'

# Expected: Returns therapist data (should include fixtures)
```

**Test 1.8: Verify Fixture Mode Configuration**
```bash
# Check environment variables
echo "FIXTURE_MODE: $FIXTURE_MODE"
echo "USE_MOCK_DATA: $USE_MOCK_DATA"
echo "BIBIA_USE_FIXTURES: $BIBIA_USE_FIXTURES"

# Expected: All should be 'true'
```

### Acceptance Criteria 2: URL Deep-Linking Functionality

**Goal**: Validate that URL deep-links to /results with all params render the same state on refresh

#### Basic URL Deep-Linking Tests

**Test 2.1: Basic Prague Search URL**
```bash
# Test basic Prague search URL
curl "http://localhost:3000/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku&acceptingNew=true"

# Expected: Returns HTML page with results
```

**Test 2.2: Ostrava Bechterev Search URL**
```bash
# Test Ostrava Bechterev search URL
curl "http://localhost:3000/results?cityOrZip=Ostrava&radiusKm=50&problems=Bechtěrevova%20choroba&acceptingNew=true"

# Expected: Returns HTML page with results
```

**Test 2.3: Brno Online Search URL**
```bash
# Test Brno online search URL
curl "http://localhost:3000/results?cityOrZip=Brno&onlineOnly=true&problems=Bolesti%20zad%20/%20krku"

# Expected: Returns HTML page with online results
```

#### Complex URL Deep-Linking Tests

**Test 2.4: Complex Search with Coordinates and Filters**
```bash
# Test complex search with coordinates and filters
curl "http://localhost:3000/results?lat=50.0755&lng=14.4378&radiusKm=25&problems=Bolesti%20zad%20/%20krku&gender=female&lang=cs,en"

# Expected: Returns HTML page with results
```

**Test 2.5: Complex Search with Multiple Filters**
```bash
# Test complex search with multiple filters
curl "http://localhost:3000/results?cityOrZip=Praha&radiusKm=40&problems=Bolesti%20zad%20/%20krku,Sportovní%20zranění&gender=female&lang=cs,en&acceptingNew=true&preferExpertEvenIfFarther=true"

# Expected: Returns HTML page with results
```

**Test 2.6: URL with Multiple Parameter Types**
```bash
# Test URL with multiple parameter types
curl "http://localhost:3000/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku&gender=male&lang=cs&exp=5-10&time=morning,afternoon&day=weekdays"

# Expected: Returns HTML page with results
```

**Test 2.7: URL with Coordinates and Preferences**
```bash
# Test URL with coordinates and preferences
curl "http://localhost:3000/results?lat=49.1951&lng=16.6068&radiusKm=35&problems=Bolesti%20zad%20/%20krku&gender=female&lang=cs,en&exp=10+&time=evening&day=weekends"

# Expected: Returns HTML page with results
```

#### URL Parameter Parsing Tests

**Test 2.8: Array Parameter Parsing**
```bash
# Test array parameter parsing
curl "http://localhost:3000/results?problems=Bolesti%20zad%20/%20krku,Sportovní%20zranění&lang=cs,en&time=morning,afternoon"

# Expected: Parameters are parsed as arrays
```

**Test 2.9: Boolean Parameter Parsing**
```bash
# Test boolean parameter parsing
curl "http://localhost:3000/results?cityOrZip=Praha&acceptingNew=true&preferExpertEvenIfFarther=true&onlineOnly=false"

# Expected: Boolean parameters are parsed correctly
```

**Test 2.10: Numeric Parameter Parsing**
```bash
# Test numeric parameter parsing
curl "http://localhost:3000/results?lat=50.0755&lng=14.4378&radiusKm=30&exp=5-10"

# Expected: Numeric parameters are parsed correctly
```

#### State Persistence Tests

**Test 2.11: State Persistence Across Page Refresh**
```bash
# Test state persistence (requires manual browser testing)
# 1. Open URL in browser
# 2. Verify results are displayed
# 3. Refresh the page
# 4. Verify same results are displayed

# Example URL to test:
# http://localhost:3000/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku
```

**Test 2.12: URL State Consistency**
```bash
# Test that URL state is consistent
# 1. Perform search via API
# 2. Build URL with same parameters
# 3. Compare results

# API search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"]
  }' > api_results.json

# URL search
curl "http://localhost:3000/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku" > url_results.html

# Expected: Results should be consistent
```

## 🔍 Manual Testing Procedures

### Browser Testing for URL Deep-Linking

1. **Open URLs in Browser**
   ```bash
   # Test these URLs in your browser:
   http://localhost:3000/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku
   http://localhost:3000/results?cityOrZip=Ostrava&radiusKm=50&problems=Bechtěrevova%20choroba
   http://localhost:3000/results?cityOrZip=Brno&onlineOnly=true&problems=Bolesti%20zad%20/%20krku
   ```

2. **Verify Page Renders Correctly**
   - Check that the results page loads
   - Verify that search results are displayed
   - Confirm that URL parameters are reflected in the UI

3. **Test Page Refresh**
   - Refresh the page (F5 or Ctrl+R)
   - Verify that the same results are displayed
   - Check that the URL parameters are preserved

4. **Test Browser Navigation**
   - Use browser back/forward buttons
   - Verify that state is preserved
   - Check that URL changes are reflected in the UI

### Fixture Mode Validation

1. **Check Fixture Data Availability**
   ```bash
   # Verify fixtures are loaded
   curl http://localhost:3000/api/therapists | jq '. | length'
   
   # Should return a number > 0
   ```

2. **Verify Fixture Mode is Enabled**
   ```bash
   # Check environment variables
   echo $FIXTURE_MODE
   echo $USE_MOCK_DATA
   echo $BIBIA_USE_FIXTURES
   
   # All should be 'true'
   ```

3. **Test Fixture-Specific Scenarios**
   - Run all Part A and Part B scenarios
   - Verify that results are returned
   - Check that fixture data is being used

## 🚨 Troubleshooting

### Common Issues

**1. Fixtures not loading**
```bash
# Check if fixture files exist
ls -la data/fixtures.json
ls -la data/cz-therapist-fixtures.json

# Check environment variables
echo $FIXTURE_MODE
echo $USE_MOCK_DATA
echo $BIBIA_USE_FIXTURES

# Restart server with correct environment
FIXTURE_MODE=true USE_MOCK_DATA=true BIBIA_USE_FIXTURES=true npm run dev
```

**2. URL deep-linking not working**
```bash
# Check if server is running
curl http://localhost:3000/api/therapists

# Check URL parameter parsing
curl "http://localhost:3000/results?cityOrZip=Praha&radiusKm=30"

# Check browser console for errors
```

**3. State not persisting across refresh**
```bash
# Check if URL parameters are being parsed correctly
curl "http://localhost:3000/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku"

# Verify that the search orchestrator is working
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"]
  }'
```

**4. Results not consistent between API and URL**
```bash
# Compare API results with URL results
# API search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"]
  }' | jq '.results | length'

# URL search (check HTML for results)
curl "http://localhost:3000/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku"
```

## 📊 Success Criteria

### Acceptance Criteria 1: All Scenarios Pass with Fixtures Enabled
- ✅ All Part A scenarios return results with fixtures enabled
- ✅ All Part B scenarios return results with fixtures enabled
- ✅ Fixture mode is properly configured and working
- ✅ Fixture data is loaded and accessible
- ✅ All search scenarios work with fixture data

### Acceptance Criteria 2: URL Deep-Linking Functionality
- ✅ Basic URL deep-links render correctly
- ✅ Complex URL deep-links render correctly
- ✅ URL parameters are parsed correctly
- ✅ State persists across page refresh
- ✅ Browser navigation works correctly
- ✅ URL state is consistent with API results

### Overall Acceptance Criteria
- ✅ All scenarios pass with fixtures enabled
- ✅ URL deep-link to /results with all params renders same state on refresh
- ✅ No critical failures in test suite
- ✅ Performance is acceptable
- ✅ Error handling works correctly

## 🔄 Continuous Testing

### Daily Checks
```bash
# Quick Part C acceptance criteria test
./scripts/qa-part-c-quick-test.sh

# Check fixture mode
npm run validate:part-a
```

### Before Deployment
```bash
# Full Part C acceptance criteria test suite
npm run test:qa-part-c

# Test all parts together
npm run test:qa-part-a
npm run test:qa-part-b
npm run test:qa-part-c
```

### After Deployment
```bash
# Production acceptance criteria validation
curl -X POST https://your-domain.com/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"]
  }'

# Test production URL deep-linking
curl "https://your-domain.com/results?cityOrZip=Praha&radiusKm=30&problems=Bolesti%20zad%20/%20krku"
```

## 📝 Test Results Template

```
Part C Acceptance Criteria Test Results
======================================

Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]
Fixture Mode: [ENABLED/DISABLED]

Acceptance Criteria 1: All Scenarios Pass with Fixtures Enabled
- Part A scenarios with fixtures: [PASS/FAIL]
- Part B scenarios with fixtures: [PASS/FAIL]
- Fixture mode validation: [PASS/FAIL]
- Fixture data availability: [PASS/FAIL]

Acceptance Criteria 2: URL Deep-Linking Functionality
- Basic URL deep-linking: [PASS/FAIL]
- Complex URL deep-linking: [PASS/FAIL]
- URL parameter parsing: [PASS/FAIL]
- State persistence: [PASS/FAIL]
- Browser navigation: [PASS/FAIL]

Issues Found:
1. [ISSUE 1]
2. [ISSUE 2]

Overall Status: [PASS/FAIL]
Acceptance Criteria Met: [YES/NO]
Ready for Production: [YES/NO]
```

This comprehensive testing guide ensures that Part C acceptance criteria are thoroughly validated and the system is ready for production deployment.

