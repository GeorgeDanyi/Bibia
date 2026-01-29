# Data Hygiene & Logging System

## Overview

This document describes the comprehensive data hygiene and logging system implemented for the Bibia `/results` flow. The system ensures data validity, eliminates chaos, and provides detailed logs for relevance tuning.

## 🎯 Goals Achieved

- ✅ **Eliminate chaos**: Comprehensive input validation and data sanitization
- ✅ **Ensure data validity**: Multi-layer validation with auto-fix capabilities
- ✅ **Prepare logs for tuning**: Structured telemetry with relevance metrics
- ✅ **Tied to canonical /results flow**: All systems integrated into the main results pipeline

## 🏗️ Architecture

### Core Components

1. **Input Validation** (`lib/validation/search.ts`)
   - Zod-based schema validation
   - Type-safe input sanitization
   - Comprehensive error reporting

2. **Data Consistency** (`lib/utils/data-consistency.ts`)
   - Therapist data validation
   - Dataset consistency checking
   - Auto-fix functionality for common issues

3. **Telemetry System** (`lib/utils/telemetry.ts`)
   - Structured event logging
   - Performance metrics tracking
   - User interaction analytics

4. **API Integration** (`app/api/searchTherapists/route.ts`)
   - Request validation and sanitization
   - Response quality metrics
   - Error handling and logging

## 📊 Data Validation

### Search Input Validation

```typescript
// Validates and sanitizes search requests
const validation = validateSearchInput(rawInput)
if (!validation.success) {
  // Log validation errors
  // Return 400 with detailed error messages
}
```

**Validated Fields:**
- Location coordinates (lat/lng bounds)
- Radius (1-200km)
- Arrays (problems, diagnosisTags, languages)
- Enums (gender, practiceType)
- Pagination (page, pageSize)

### Therapist Data Validation

```typescript
// Validates therapist data structure and content
const therapistValidation = validateTherapistData(therapist)
if (!therapistValidation.success) {
  // Log validation errors
  // Apply auto-fix or exclude from results
}
```

**Validated Fields:**
- Required fields (id, name, city, coordinates)
- Data types and ranges
- Czech Republic coordinate bounds
- Language codes and practice types
- Rating and price consistency

## 🧹 Data Sanitization

### Input Sanitization

- **String trimming**: Remove whitespace, limit length
- **Array filtering**: Remove empty/invalid entries
- **Number bounds**: Clamp to valid ranges
- **Type coercion**: Convert strings to appropriate types

### Auto-Fix Functionality

```typescript
// Automatically fixes common data issues
const fixedTherapist = autoFixTherapistData(invalidTherapist)
```

**Auto-Fixes Applied:**
- Empty strings → Default values
- Invalid coordinates → Prague fallback
- Missing arrays → Default arrays
- Invalid enums → Safe defaults
- Out-of-range numbers → Clamped values

## 📈 Telemetry & Logging

### Event Types

1. **Search Events**
   - Input validation results
   - Processing metrics
   - Result quality scores
   - Performance timing

2. **User Interactions**
   - Page views and navigation
   - Filter changes
   - Card views and clicks
   - Booking attempts

3. **Data Hygiene Events**
   - Validation errors
   - Sanitization applied
   - Consistency issues
   - Auto-fixes performed

### Metrics Tracked

- **Result Quality**: Score distribution, top scores, relevance
- **Search Efficiency**: Processing time, filter ratios
- **User Satisfaction**: Engagement metrics, conversion rates
- **Data Health**: Validation success rates, error frequencies

## 🔧 Implementation Details

### API Integration

The search API now includes:

```typescript
// 1. Input validation
const validation = validateSearchInput(rawBody)
if (!validation.success) {
  return NextResponse.json({ error: 'Invalid input', details: validation.errors }, { status: 400 })
}

// 2. Data sanitization
logDataSanitization('search_api', rawBody, validation.sanitized)

// 3. Therapist data validation
const validatedTherapists = allTherapists.map(therapist => {
  const validation = validateTherapistData(therapist)
  return validation.success ? validation.data : autoFixTherapistData(therapist)
})

// 4. Comprehensive telemetry
logSearch({
  input: { /* validated input */ },
  processing: { /* metrics */ },
  results: { /* quality scores */ }
}, queryId)
```

### Frontend Integration

The results page now tracks:

```typescript
// User interactions
logUserInteraction('page_view', { criteria: Object.keys(criteria).length })
logUserInteraction('filter_changed', { criteria: debouncedCriteria })
logUserInteraction('booking_attempt', { therapistId, score, distance })

// Card views
logUserInteraction('cards_viewed', { ids: currentIds, page, viewport })
```

## 🎛️ Debug Dashboard

### Telemetry Dashboard

Access via debug mode (`?debug=1`) in results page:

- **Real-time metrics**: Session events, hygiene issues
- **Quality scores**: Result quality, search efficiency
- **Data export**: Download telemetry data for analysis
- **Health status**: Validation and sanitization status

### Console Logging

Structured console output:

```
[2025-09-26T16:31:39.063Z] [SEARCH] search_executed: {
  sessionId: "session_1758904299059_abc123",
  queryId: "search_1758904299059_def456",
  data: { /* search metrics */ }
}

[2025-09-26T16:31:39.064Z] [HYGIENE] data_validation_error: {
  severity: "high",
  source: "search_api",
  details: { /* error details */ }
}
```

## 🧪 Testing

### Test Script

Run the comprehensive test suite:

```bash
npx tsx scripts/test-data-hygiene.ts
```

**Test Coverage:**
- ✅ Input validation (valid/invalid cases)
- ✅ Data sanitization
- ✅ Consistency checking
- ✅ Auto-fix functionality
- ✅ Telemetry logging
- ✅ Export functionality

### Test Results

```
📋 Summary:
   • Input validation: ✅ Working
   • Data sanitization: ✅ Working
   • Consistency checking: ✅ Working
   • Auto-fix functionality: ✅ Working
   • Telemetry logging: ✅ Working
   • Error handling: ✅ Working

🎯 The data hygiene system is ready for production!
```

## 📊 Monitoring & Alerts

### Critical Issues

The system automatically alerts on:
- Missing therapist IDs (critical)
- Invalid coordinates (high)
- Data type mismatches (medium)
- Outdated data (medium)

### Performance Monitoring

Track:
- Search response times
- Validation success rates
- Data quality scores
- User engagement metrics

## 🚀 Production Readiness

### Features Implemented

1. **Input Validation**: Comprehensive schema validation with detailed error reporting
2. **Data Sanitization**: Automatic cleaning of user input and therapist data
3. **Consistency Checking**: Multi-level validation of data integrity
4. **Auto-Fix**: Automatic correction of common data issues
5. **Telemetry**: Structured logging for relevance tuning
6. **Error Handling**: Graceful degradation with detailed error messages
7. **Debug Tools**: Real-time dashboard for monitoring and analysis

### Benefits

- **Data Quality**: Ensures all data meets quality standards
- **User Experience**: Prevents errors and provides consistent results
- **Debugging**: Comprehensive logging for issue identification
- **Performance**: Optimized processing with quality metrics
- **Maintenance**: Auto-fix reduces manual data cleanup
- **Analytics**: Rich telemetry for relevance tuning

## 🔮 Future Enhancements

### Potential Improvements

1. **Machine Learning**: Use telemetry data to improve matching algorithms
2. **Real-time Monitoring**: Dashboard for production monitoring
3. **Automated Alerts**: Integration with monitoring systems
4. **Data Quality Scoring**: Continuous assessment of data health
5. **A/B Testing**: Framework for testing relevance improvements

### Integration Points

- **Analytics Services**: Export to external analytics platforms
- **Monitoring Systems**: Integration with APM tools
- **Alerting**: Real-time notifications for critical issues
- **Data Warehousing**: Long-term storage for analysis

---

## 📝 Summary

The data hygiene and logging system successfully eliminates chaos, ensures data validity, and provides comprehensive logs for relevance tuning. All components are integrated into the canonical `/results` flow and are production-ready.

**Key Achievements:**
- 🎯 **Chaos Eliminated**: Comprehensive validation and sanitization
- 🎯 **Data Validity Ensured**: Multi-layer validation with auto-fix
- 🎯 **Logs Prepared**: Structured telemetry for relevance tuning
- 🎯 **Canonical Integration**: Fully integrated into `/results` flow

The system is now ready for production deployment and will provide the foundation for continuous improvement of the therapist matching and recommendation system.

