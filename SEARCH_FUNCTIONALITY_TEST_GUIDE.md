# Search Functionality Test Guide

## Overview
This document provides a comprehensive guide for testing the search functionality to ensure it returns at least one fake therapist from the dataset when appropriate filters/queries are used.

## Dataset Analysis

### Sample Therapist Entries
Based on the fake dataset (`/data/fake-therapists-complete.json`), here are key sample entries:

#### Therapist 1: Zuzana Beneš (t001)
- **Location**: Praha (50.0685, 14.4777)
- **Specializations**: Bolesti zad / krku
- **Diagnoses**: Osteoporóza, Roztroušená skleróza, Bechtěrev
- **Practice Type**: private
- **Languages**: cs, en, de, uk, ru, sk, pl, fr, es
- **Price Range**: 500-800 CZK
- **Rating**: 4.8/5 (127 reviews)
- **Accepts New**: Yes

#### Therapist 2: MUDr. Petr Svoboda (t002)
- **Location**: Brno (49.1951, 16.6068)
- **Specializations**: Chronické bolesti, Neurologické poruchy, Geriatrie
- **Diagnoses**: MS, Parkinson, Chronické bolesti
- **Practice Type**: clinic
- **Languages**: cs, en
- **Price Range**: 700-1000 CZK
- **Rating**: 4.6/5 (89 reviews)
- **Accepts New**: Yes

#### Therapist 3: Bc. Marie Kratochvílová (t003)
- **Location**: Ostrava (49.8209, 18.2625)
- **Specializations**: Sportovní fyzioterapie, Úrazy, Výkonnostní sport
- **Diagnoses**: Sport injury, Tendinitis, Svalové přetížení
- **Practice Type**: private
- **Languages**: cs, en
- **Price Range**: 900-1300 CZK
- **Rating**: 4.9/5 (156 reviews)
- **Accepts New**: Yes

## Test Cases

### TC1 — City Match
**Objective**: Verify search returns therapists when searching by city from dataset

**Test Data**:
```json
{
  "location": { "cityOrZip": "Praha" },
  "radiusKm": 30,
  "diagnosisTags": [],
  "page": 1,
  "pageSize": 12
}
```

**Expected Results**:
- Status: 200 OK
- At least 1 result returned
- Result contains therapist with city="Praha"
- Therapist data matches dataset (name: "Zuzana Beneš", id: "t001")

**Validation Points**:
- Network request to `/api/searchTherapists` returns 200
- JSON response is valid and contains `results` array
- At least one therapist has `city: "Praha"`
- Therapist profile data matches dataset fields

### TC2 — Specialization Match
**Objective**: Verify search returns therapists when filtering by specialization/conditions

**Test Data**:
```json
{
  "location": { "cityOrZip": "Praha" },
  "radiusKm": 30,
  "diagnosisTags": ["Osteoporóza"],
  "page": 1,
  "pageSize": 12
}
```

**Expected Results**:
- Status: 200 OK
- At least 1 result returned
- Result contains therapist with matching specialization
- Match reasons include "Zkušenost s vaší diagnózou"

**Validation Points**:
- Therapist has `diagnosisTags` containing "Osteoporóza"
- `reasons` array contains relevant match explanation
- Therapist data integrity maintained

### TC3 — City + Specialization + Distance
**Objective**: Verify combined filters work correctly

**Test Data**:
```json
{
  "location": { "cityOrZip": "Praha" },
  "radiusKm": 20,
  "diagnosisTags": ["Roztroušená skleróza"],
  "mustHave": {
    "practiceType": ["private"]
  },
  "page": 1,
  "pageSize": 12
}
```

**Expected Results**:
- Status: 200 OK
- Results filtered by all criteria
- Therapist matches: city="Praha", has diagnosis, practiceType="private"
- Distance within specified radius

**Validation Points**:
- All filter criteria applied correctly
- Results respect distance constraint
- Practice type filter working
- Diagnosis matching functional

### TC4 — Name Lookup
**Objective**: Verify direct name search functionality (if implemented)

**Test Data**:
```json
{
  "location": { "cityOrZip": "Praha" },
  "radiusKm": 30,
  "name": "Zuzana Beneš",
  "page": 1,
  "pageSize": 12
}
```

**Expected Results**:
- Status: 200 OK
- Exact therapist returned first
- Therapist name matches search term exactly

**Validation Points**:
- Name search returns correct therapist
- Exact match prioritized
- Fallback to other criteria if name not found

### TC5 — Negative Test (No Results)
**Objective**: Verify system handles impossible search criteria gracefully

**Test Data**:
```json
{
  "location": { "cityOrZip": "NowhereTown" },
  "radiusKm": 5,
  "diagnosisTags": ["alien-therapy"],
  "page": 1,
  "pageSize": 12
}
```

**Expected Results**:
- Status: 200 OK
- Empty results array
- Pagination shows total: 0
- No console errors

**Validation Points**:
- Empty state handled gracefully
- No JavaScript errors in console
- Proper empty response structure
- UI shows appropriate "no results" message

## Network Request Validation

### Request Format
All requests should be POST to `/api/searchTherapists` with:
```json
{
  "location": { "cityOrZip": "string" } | { "lat": number, "lng": number },
  "radiusKm": number,
  "diagnosisTags": string[],
  "mustHave": {
    "practiceType": string[],
    "languages": string[],
    "diagnosis": string[]
  },
  "prefer": {
    "distance": boolean,
    "price": boolean,
    "availability": boolean
  },
  "page": number,
  "pageSize": number
}
```

### Response Format
Expected response structure:
```json
{
  "results": [
    {
      "id": "string",
      "name": "string",
      "city": "string",
      "distanceKm": number,
      "tags": string[],
      "diagnosisTags": string[],
      "priceRange": { "minCZK": number, "maxCZK": number },
      "acceptingNew": boolean,
      "practiceType": "string",
      "languages": string[],
      "rating": { "average": number, "count": number },
      "score": number,
      "reasons": string[]
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "pageSize": number,
    "totalPages": number
  },
  "searchInfo": {
    "queryId": "string",
    "radiusKmUsed": number,
    "resultsCount": number
  }
}
```

## Error Scenarios

### Geocoding Failure
**Test**: Invalid city name
```json
{
  "location": { "cityOrZip": "InvalidCity123" },
  "radiusKm": 30
}
```

**Expected**: 400 Bad Request with error message about location resolution

### Invalid Request Body
**Test**: Missing required fields
```json
{
  "radiusKm": 30
  // Missing location
}
```

**Expected**: 400 Bad Request with validation error details

### Server Error
**Test**: Simulate server failure
**Expected**: 500 Internal Server Error with error message

## Manual Testing Steps

### 1. Environment Setup
1. Start development server: `npm run dev`
2. Open browser dev tools (Network + Console tabs)
3. Disable caching in dev tools
4. Navigate to questionnaire page

### 2. Basic City Search
1. Enter "Praha" in city field
2. Complete minimal questionnaire (select any condition)
3. Submit search
4. Verify network request to `/api/searchTherapists`
5. Check response status (200) and JSON structure
6. Confirm at least one result with city="Praha"

### 3. Specialization Search
1. Enter "Praha" in city field
2. Select "Bolesti zad / krku" condition
3. Submit search
4. Verify results contain therapists with matching specializations
5. Check match reasons are displayed

### 4. Combined Filters
1. Enter "Praha" in city field
2. Select specific condition (e.g., "Osteoporóza")
3. Set visit mode to "clinic"
4. Submit search
5. Verify all filters applied correctly
6. Check results match all criteria

### 5. Negative Testing
1. Enter "NowhereTown" in city field
2. Select impossible condition combination
3. Submit search
4. Verify empty results handled gracefully
5. Check no console errors

### 6. Profile Interaction
1. From search results, click on therapist card
2. Verify profile opens (modal or new page)
3. Check profile data matches dataset entry
4. Verify all fields populated correctly

## Automated Test Execution

### Run Test Suite
```bash
# Run all search functionality tests
npm test __tests__/search-functionality.test.ts

# Run specific test case
npm test -- --grep "TC1 — City Match"

# Run with coverage
npm test -- --coverage __tests__/search-functionality.test.ts
```

### Test Environment Variables
Ensure these are set for testing:
```bash
NODE_ENV=test
DATABASE_URL=file://./data/fake-therapists-complete.json
```

## Acceptance Criteria

### PASS Criteria
The test PASSES if ALL of the following are true:

1. **Network Request Success**
   - API returns 200 status code
   - Valid JSON response received
   - Response structure matches expected format

2. **Results Returned**
   - At least one query returns therapist from dataset
   - Therapist data matches dataset fields exactly
   - Match reasons provided and relevant

3. **Data Integrity**
   - Profile data matches dataset entry
   - No data corruption or missing fields
   - All required fields present

4. **Error Handling**
   - No uncaught JavaScript errors
   - Graceful handling of edge cases
   - Appropriate error messages for failures

### FAIL Criteria
The test FAILS if ANY of the following occur:

1. **Network Issues**
   - 404 or non-200 status codes
   - Invalid or empty JSON response
   - Network timeout or connection errors

2. **No Results**
   - Queries that should match return zero results
   - Only unrelated results returned
   - Results don't match search criteria

3. **Data Mismatch**
   - Profile data differs from dataset
   - Missing or incorrect field mappings
   - Data corruption or truncation

4. **System Errors**
   - Uncaught JavaScript exceptions
   - Console errors during search flow
   - UI crashes or freezes

## Debugging Tips

### Common Issues and Solutions

1. **404 on `/api/searchTherapists`**
   - Check API route file exists
   - Verify Next.js API routes configuration
   - Ensure development server is running

2. **Empty Results for Valid Queries**
   - Check dataset file path and accessibility
   - Verify data transformation logic
   - Check filter logic for field name mismatches

3. **Wrong City Results**
   - Verify city normalization logic
   - Check for diacritics handling
   - Ensure coordinate resolution working

4. **Profile Data Mismatch**
   - Check field mapping in API response
   - Verify dataset structure matches expected format
   - Check for data transformation errors

### Logging and Monitoring

Enable debug logging by setting:
```bash
DEBUG=search:*
NODE_ENV=development
```

Check console for:
- API request/response logs
- Data loading messages
- Filter application logs
- Error details and stack traces

## Reporting Template

### Test Report Format
```
Environment: [dev/prod] - [localhost:3000]
Dataset: /data/fake-therapists-complete.json (size: N entries)
Tested therapist(s): 
- t001: Zuzana Beneš, Praha, Osteoporóza
- t002: MUDr. Petr Svoboda, Brno, MS
- t003: Bc. Marie Kratochvílová, Ostrava, Sport injury

Steps executed:
1. ✅ Basic city search (Praha)
2. ✅ Specialization search (Osteoporóza)
3. ✅ Combined filters (city + spec + distance)
4. ✅ Name lookup (Zuzana Beneš)
5. ✅ Negative test (NowhereTown)

Network evidence: [Attach HAR file or screenshots]
Console logs: [Paste any errors]

Result: PASS / FAIL
Reason: [Brief explanation]

Suggested next step: [If FAIL, provide specific fix recommendation]
```

This comprehensive test guide ensures thorough validation of the search functionality and provides clear criteria for pass/fail determination.
