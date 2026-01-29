# Part A QA Manual Testing Guide

## Overview

This guide provides comprehensive manual testing scenarios to validate the end-to-end flow of Part A implementation deterministically. The goal is to provide deterministic checks to confirm the end-to-end flow truly works.

## 🎯 Part A Goals

- ✅ **Guarantee realistic test hits within 10–30 km of Prague and Ostrava** to validate geo & scoring
- ✅ **Enable fixture mode via ENV** without touching production data
- ✅ **Define strict schema for therapists** and validate incoming data
- ✅ **Seed deterministic fixtures** around Prague, Brno, Ostrava so searches return results

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
chmod +x scripts/qa-part-a-quick-test.sh

# Run quick manual tests
./scripts/qa-part-a-quick-test.sh
```

### 3. Run Comprehensive Tests

```bash
# Run full QA test suite
npm run test:qa-part-a

# Or run directly with ts-node
npx ts-node scripts/qa-part-a-manual-test.ts
```

## 📋 Test Scenarios

### Test 1: Environment Setup and Configuration

**Goal**: Verify fixture mode and test data configuration

**Steps**:
1. Check that fixture mode is enabled
2. Verify test data is loaded and accessible
3. Confirm environment variables are set correctly

**Expected Results**:
- ✅ Fixture mode is properly configured
- ✅ Test data is loaded and accessible
- ✅ At least 15 therapists available for testing

**Manual Commands**:
```bash
# Check fixture mode
curl http://localhost:3000/api/therapists

# Verify data count
curl http://localhost:3000/api/therapists | jq '. | length'
```

### Test 2: API Endpoints Validation

**Goal**: Test all critical API endpoints

**Endpoints to Test**:
- `GET /api/therapists` - Get all therapists
- `POST /api/searchTherapists` - Search therapists
- `GET /api/geocode` - Geocode locations
- `GET /api/searchTherapists/health` - Health check

**Expected Results**:
- ✅ All endpoints return valid responses
- ✅ Therapists have required fields
- ✅ Search returns properly formatted results
- ✅ Geocoding returns valid coordinates

**Manual Commands**:
```bash
# Test therapists endpoint
curl http://localhost:3000/api/therapists

# Test geocoding
curl "http://localhost:3000/api/geocode?q=Praha"

# Test search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Praha"}, "radiusKm": 30}'
```

### Test 3: Search Orchestrator and UI Flow

**Goal**: Test search orchestrator functionality

**Scenarios**:
1. **Basic Search Flow**: Search with location and radius
2. **Filtered Search**: Search with multiple filters
3. **Online Search**: Test online-only search

**Expected Results**:
- ✅ Search completes successfully
- ✅ Results are properly formatted
- ✅ Filters are applied correctly
- ✅ Online search returns online therapists only

**Manual Commands**:
```bash
# Basic search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Praha"}, "radiusKm": 25}'

# Filtered search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Ostrava"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku", "Sportovní zranění"],
    "mustHave": {"practiceType": ["clinic", "private"], "acceptingNew": true}
  }'

# Online search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"onlineOnly": true, "problems": ["Bolesti zad / krku"]}'
```

### Test 4: Geographic Search and Distance Validation

**Goal**: Test geographic coverage and distance calculations

**Cities to Test**:
- **Prague**: Should find therapists within 30km
- **Ostrava**: Should find therapists within 30km  
- **Brno**: Should find therapists within 30km

**Expected Results**:
- ✅ Finds therapists within 30km of each city
- ✅ All results are within specified radius
- ✅ Distance calculations are accurate
- ✅ Minimum 5 therapists per city

**Manual Commands**:
```bash
# Prague coverage
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Praha"}, "radiusKm": 30}' | jq '.results | length'

# Ostrava coverage
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Ostrava"}, "radiusKm": 30}' | jq '.results | length'

# Brno coverage
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Brno"}, "radiusKm": 30}' | jq '.results | length'

# Distance validation
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"lat": 50.0755, "lng": 14.4378}, "radiusKm": 25}' | jq '.results[].distanceKm'
```

### Test 5: Data Quality and Schema Validation

**Goal**: Test therapist data schema compliance

**Validation Points**:
- Required fields present
- No duplicate IDs
- Czech language compliance
- Pricing within Czech market range
- Geographic bounds validation

**Expected Results**:
- ✅ All therapists have required fields
- ✅ No duplicate IDs
- ✅ All therapists speak Czech
- ✅ Pricing is within Czech market range (300-3000 CZK)

**Manual Commands**:
```bash
# Check required fields
curl http://localhost:3000/api/therapists | jq '.[0] | keys'

# Check Czech language compliance
curl http://localhost:3000/api/therapists | jq '.[] | select(.languages | contains(["cs"]) | not)'

# Check pricing range
curl http://localhost:3000/api/therapists | jq '.[] | select(.pricePerSession < 300 or .pricePerSession > 3000)'

# Check unique IDs
curl http://localhost:3000/api/therapists | jq '[.[].id] | group_by(.) | map(select(length > 1))'
```

### Test 6: End-to-End User Flows

**Goal**: Test complete user search journey

**Scenarios**:
1. **Complete Search Journey**: Geocode → Search → Results
2. **No Results Handling**: Search with restrictive criteria
3. **Error Handling**: Invalid inputs and edge cases

**Expected Results**:
- ✅ Complete flow works end-to-end
- ✅ No results handled gracefully
- ✅ Error handling works properly

**Manual Commands**:
```bash
# Complete flow test
GEOCODE_RESPONSE=$(curl -s "http://localhost:3000/api/geocode?q=Praha")
LAT=$(echo $GEOCODE_RESPONSE | jq -r '.lat')
LNG=$(echo $GEOCODE_RESPONSE | jq -r '.lng')

curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d "{\"location\": {\"lat\": $LAT, \"lng\": $LNG}, \"radiusKm\": 25, \"problems\": [\"Bolesti zad / krku\"]}"

# No results test
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 5,
    "mustHave": {"practiceType": ["online"], "acceptingNew": true},
    "problems": ["Very rare condition"]
  }'
```

## 🔍 Validation Checklist

### Critical Tests (Must Pass)
- [ ] Fixture mode is enabled and working
- [ ] At least 15 therapists loaded
- [ ] Prague search returns ≥5 results within 30km
- [ ] Ostrava search returns ≥5 results within 30km
- [ ] Brno search returns ≥5 results within 30km
- [ ] All therapists have required fields
- [ ] No duplicate therapist IDs
- [ ] All therapists speak Czech
- [ ] Geocoding works for major cities
- [ ] Search API returns valid JSON

### Important Tests (Should Pass)
- [ ] Distance calculations are accurate
- [ ] Filters work correctly
- [ ] Online search returns online therapists
- [ ] Pricing is within Czech market range
- [ ] Error handling works for invalid inputs
- [ ] No results handled gracefully

### Nice-to-Have Tests (Optional)
- [ ] Performance is acceptable (<2s response time)
- [ ] Search results are properly sorted
- [ ] All specializations are covered
- [ ] Insurance validation works
- [ ] Phone number format validation

## 🚨 Troubleshooting

### Common Issues

**1. No therapists found**
```bash
# Check if fixture mode is enabled
echo $FIXTURE_MODE
echo $USE_MOCK_DATA

# Check if fixtures are loaded
curl http://localhost:3000/api/therapists | jq '. | length'
```

**2. Geocoding fails**
```bash
# Test geocoding directly
curl "http://localhost:3000/api/geocode?q=Praha"

# Check if geocoding service is available
curl "http://localhost:3000/api/geocode?q=TestCity"
```

**3. Search returns no results**
```bash
# Check with larger radius
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Praha"}, "radiusKm": 50}'

# Check without filters
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Praha"}, "radiusKm": 30}'
```

**4. Invalid JSON responses**
```bash
# Check server logs
npm run dev

# Test with verbose curl
curl -v http://localhost:3000/api/therapists
```

## 📊 Success Criteria

### Part A Implementation is Complete When:
- ✅ All critical tests pass
- ✅ Geographic coverage meets requirements (≥5 therapists per city within 30km)
- ✅ Fixture mode works without touching production data
- ✅ Data schema validation passes
- ✅ End-to-end search flow works
- ✅ Error handling is robust

### Ready for Production When:
- ✅ All critical and important tests pass
- ✅ Performance is acceptable
- ✅ Error handling is comprehensive
- ✅ Data quality is high
- ✅ No critical failures in test suite

## 🔄 Continuous Testing

### Daily Checks
```bash
# Quick smoke test
./scripts/qa-part-a-quick-test.sh

# Check fixture data
curl http://localhost:3000/api/therapists | jq '. | length'
```

### Before Deployment
```bash
# Full test suite
npm run test:qa-part-a

# Performance test
time curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Praha"}, "radiusKm": 30}'
```

### After Deployment
```bash
# Production health check
curl https://your-domain.com/api/searchTherapists/health

# Production search test
curl -X POST https://your-domain.com/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"location": {"cityOrZip": "Praha"}, "radiusKm": 30}'
```

## 📝 Test Results Template

```
Part A QA Test Results
=====================

Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]
Fixture Mode: [ENABLED/DISABLED]

Critical Tests:
- [ ] Environment Setup
- [ ] API Endpoints
- [ ] Geographic Coverage (Prague)
- [ ] Geographic Coverage (Ostrava)
- [ ] Geographic Coverage (Brno)
- [ ] Data Schema Validation
- [ ] End-to-End Flow

Important Tests:
- [ ] Search Filters
- [ ] Online Search
- [ ] Error Handling
- [ ] Data Quality

Issues Found:
1. [ISSUE 1]
2. [ISSUE 2]

Overall Status: [PASS/FAIL]
Ready for Production: [YES/NO]
```

This comprehensive testing guide ensures that Part A implementation is thoroughly validated and ready for production deployment.

