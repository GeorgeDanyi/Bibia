# Part B QA Test Scenarios

## Overview

This document provides comprehensive QA test scenarios for Part B implementation, covering specific requirements and edge cases that validate the search orchestrator, radius expansion, error handling, and sorting functionality.

## 🎯 Part B Requirements

The following scenarios must be validated to ensure Part B implementation works correctly:

1. **Prague + 30 km + condition=backneck + availability=next7 + practice=any** → expect ≥1 item, distanceKm ≤30
2. **Ostrava + 30 km + rare condition=bechterev** → if 0, "Expand to 50 km" returns ≥1
3. **Brno + practice=online (any radius)** → returns online therapists
4. **Invalid city string** → /results shows actionable error; "Edit questionnaire" works
5. **Sort by Nearest** reorders by distance ascending

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
chmod +x scripts/qa-part-b-quick-test.sh

# Run quick manual tests
./scripts/qa-part-b-quick-test.sh
```

### 3. Run Comprehensive Tests

```bash
# Run full Part B QA test suite
npm run test:qa-part-b

# Or run directly with ts-node
npx ts-node scripts/qa-part-b-scenarios.ts
```

## 📋 Test Scenarios

### Scenario 1: Prague + 30 km + condition=backneck + availability=next7 + practice=any

**Goal**: Validate basic search with specific conditions and availability requirements

**Expected Results**:
- ✅ Returns at least 1 result
- ✅ All results are within 30km radius
- ✅ Results include back/neck specialists
- ✅ Results are accepting new patients
- ✅ Results have next 7 days availability

**Manual Commands**:
```bash
# Test the specific scenario
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true},
    "preferences": {"availability": "next7"}
  }'

# Validate results
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true},
    "preferences": {"availability": "next7"}
  }' | jq '.results | length'

# Check distance validation
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true}
  }' | jq '.results[].distanceKm'
```

**Validation Checklist**:
- [ ] At least 1 result returned
- [ ] All distances ≤ 30km
- [ ] Results include back/neck specialists
- [ ] All results accepting new patients
- [ ] Results have next 7 days availability

### Scenario 2: Ostrava + 30 km + rare condition=bechterev → expand to 50 km

**Goal**: Test radius expansion functionality for rare conditions

**Expected Results**:
- ✅ 30km search may return 0 results (acceptable for rare condition)
- ✅ 50km expansion returns at least 1 result
- ✅ 50km results are within 50km radius
- ✅ Results include Bechterev specialists

**Manual Commands**:
```bash
# Step 1: Test 30km search (may return 0 results)
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Ostrava"},
    "radiusKm": 30,
    "problems": ["Bechtěrevova choroba"],
    "mustHave": {"acceptingNew": true}
  }' | jq '.results | length'

# Step 2: Expand to 50km
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Ostrava"},
    "radiusKm": 50,
    "problems": ["Bechtěrevova choroba"],
    "mustHave": {"acceptingNew": true}
  }' | jq '.results | length'

# Validate Bechterev specialists
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Ostrava"},
    "radiusKm": 50,
    "problems": ["Bechtěrevova choroba"]
  }' | jq '.results[] | select(.specialties[] | contains("Bechtěrev"))'
```

**Validation Checklist**:
- [ ] 30km search handled gracefully (0 results acceptable)
- [ ] 50km expansion returns ≥1 result
- [ ] All 50km results within 50km radius
- [ ] Results include Bechterev specialists
- [ ] Radius expansion logic works correctly

### Scenario 3: Brno + practice=online (any radius)

**Goal**: Test online-only search functionality

**Expected Results**:
- ✅ Returns online therapists
- ✅ All results are online practice type
- ✅ Results have distanceKm = 0 (online)

**Manual Commands**:
```bash
# Test online search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Brno"},
    "onlineOnly": true,
    "problems": ["Bolesti zad / krku"]
  }' | jq '.results | length'

# Validate online practice type
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Brno"},
    "onlineOnly": true,
    "problems": ["Bolesti zad / krku"]
  }' | jq '.results[].practiceType'

# Check distance is 0 for online
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Brno"},
    "onlineOnly": true,
    "problems": ["Bolesti zad / krku"]
  }' | jq '.results[].distanceKm'
```

**Validation Checklist**:
- [ ] Returns online therapists
- [ ] All results have practiceType = "online"
- [ ] All results have distanceKm = 0
- [ ] Online search works with any radius
- [ ] Online therapists are properly identified

### Scenario 4: Invalid city string → actionable error + edit questionnaire

**Goal**: Test error handling for invalid inputs

**Expected Results**:
- ✅ Returns actionable error message
- ✅ Error suggests online mode or edit questionnaire
- ✅ Geocoding fails gracefully
- ✅ UI shows actionable error state

**Manual Commands**:
```bash
# Test invalid city search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "InvalidCityName123"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"]
  }'

# Test invalid city geocoding
curl "http://localhost:3000/api/geocode?q=InvalidCityName123"

# Test error response format
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "InvalidCityName123"},
    "radiusKm": 30
  }' | jq '.error // .shouldSuggestOnlineMode // (.results | length == 0)'
```

**Validation Checklist**:
- [ ] Invalid city search returns error or empty results
- [ ] Error message is actionable
- [ ] Error suggests online mode or edit questionnaire
- [ ] Geocoding fails gracefully for invalid cities
- [ ] UI shows appropriate error state
- [ ] "Edit questionnaire" button works

### Scenario 5: Sort by Nearest reorders by distance ascending

**Goal**: Test distance-based sorting functionality

**Expected Results**:
- ✅ Returns multiple results for sorting test
- ✅ Results are sorted by distance ascending
- ✅ First result has shortest distance

**Manual Commands**:
```bash
# Step 1: Get multiple results for sorting test
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 50,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true}
  }' | jq '.results | length'

# Step 2: Test distance sorting
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 50,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true},
    "prefer": {"distance": true}
  }' | jq '.results[].distanceKm'

# Validate ascending order
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 50,
    "problems": ["Bolesti zad / krku"],
    "prefer": {"distance": true}
  }' | jq '[.results[].distanceKm] | sort == [.results[].distanceKm]'
```

**Validation Checklist**:
- [ ] Returns multiple results (≥3 for sorting test)
- [ ] Results are sorted by distance ascending
- [ ] First result has shortest distance
- [ ] Distance sorting preference works
- [ ] Sort order is consistent

## 🔍 Additional Validation Tests

### Radius Expansion Testing

```bash
# Test small radius that should trigger expansion
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 10,
    "problems": ["Bechtěrevova choroba"]
  }'

# Test expansion to 50km
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 50,
    "problems": ["Bechtěrevova choroba"]
  }'
```

### Online Mode Testing

```bash
# Test online-only search
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "onlineOnly": true,
    "problems": ["Bolesti zad / krku"]
  }'

# Test online toggle functionality
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "onlineOnly": true,
    "problems": ["Bolesti zad / krku"]
  }'
```

### Availability Filtering

```bash
# Test next 7 days availability
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "mustHave": {"acceptingNew": true},
    "preferences": {"availability": "next7"}
  }'

# Test immediate availability
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "mustHave": {"acceptingNew": true},
    "preferences": {"availability": "immediate"}
  }'
```

## 🚨 Troubleshooting

### Common Issues

**1. No results for rare conditions**
```bash
# Check if Bechterev specialists exist in fixtures
curl http://localhost:3000/api/therapists | jq '.[] | select(.specialties[] | contains("Bechtěrev"))'

# Test with larger radius
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Ostrava"},
    "radiusKm": 100,
    "problems": ["Bechtěrevova choroba"]
  }'
```

**2. Online search returns no results**
```bash
# Check if online therapists exist
curl http://localhost:3000/api/therapists | jq '.[] | select(.practiceType == "online")'

# Test online fallback
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "onlineOnly": true,
    "problems": ["Bolesti zad / krku"]
  }'
```

**3. Distance sorting not working**
```bash
# Check if results have distanceKm field
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 50,
    "problems": ["Bolesti zad / krku"]
  }' | jq '.results[0] | keys'

# Test without distance preference
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 50,
    "problems": ["Bolesti zad / krku"]
  }' | jq '.results[].distanceKm'
```

**4. Error handling not working**
```bash
# Test with completely invalid input
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": ""},
    "radiusKm": 30
  }'

# Test with malformed JSON
curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{"invalid": json}'
```

## 📊 Success Criteria

### Part B Implementation is Complete When:
- ✅ All 5 scenarios pass (100% success rate)
- ✅ Radius expansion works correctly
- ✅ Online search returns online therapists
- ✅ Error handling is actionable
- ✅ Distance sorting is ascending
- ✅ All edge cases are handled gracefully

### Ready for Production When:
- ✅ All critical scenarios pass
- ✅ Error messages are user-friendly
- ✅ Performance is acceptable (<2s response time)
- ✅ UI integration works correctly
- ✅ No critical failures in test suite

## 🔄 Continuous Testing

### Daily Checks
```bash
# Quick Part B smoke test
./scripts/qa-part-b-quick-test.sh

# Check specific scenarios
npm run test:qa-part-b-quick
```

### Before Deployment
```bash
# Full Part B test suite
npm run test:qa-part-b

# Performance test
time curl -X POST http://localhost:3000/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"]
  }'
```

### After Deployment
```bash
# Production Part B validation
curl -X POST https://your-domain.com/api/searchTherapists \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"cityOrZip": "Praha"},
    "radiusKm": 30,
    "problems": ["Bolesti zad / krku"],
    "mustHave": {"acceptingNew": true}
  }'
```

## 📝 Test Results Template

```
Part B QA Test Results
=====================

Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]
Fixture Mode: [ENABLED/DISABLED]

Scenario Results:
1. Prague + 30km + backneck + next7 + any practice: [PASS/FAIL]
2. Ostrava + 30km + bechterev → expand to 50km: [PASS/FAIL]
3. Brno + practice=online (any radius): [PASS/FAIL]
4. Invalid city string → actionable error: [PASS/FAIL]
5. Sort by Nearest → distance ascending: [PASS/FAIL]

Issues Found:
1. [ISSUE 1]
2. [ISSUE 2]

Overall Status: [PASS/FAIL]
Ready for Production: [YES/NO]
```

This comprehensive testing guide ensures that Part B implementation is thoroughly validated and meets all specific requirements for search functionality, radius expansion, error handling, and sorting.

