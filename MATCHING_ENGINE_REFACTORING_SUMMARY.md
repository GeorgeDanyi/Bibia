# Matching Engine Refactoring Summary - Step 5

## Overview

Refactored the matching engine to use the newly stabilized canonical types (`MatchingInputs` and `MatchingTherapist`) and implemented a clean, reliable, multi-layered matching system with hard filters, soft scoring, fallback layers, and zero-result prevention.

## New Files Created

### `lib/matching/matching-engine.ts`

This is the new core matching engine module that implements:

1. **Hard Filters** (`applyHardFilters()`)
2. **Soft Scoring** (`applySoftScoring()`)
3. **Fallback Layers** (`applyFallbackLayers()`)
4. **Main Matching Function** (`findMatches()`)

## Key Changes

### 1. Hard Filters Implementation

**Location**: `lib/matching/matching-engine.ts` - `applyHardFilters()`

**Requirements Implemented**:

1. **Meeting Type**:
   - If user selects "clinic", allow therapists with: `['clinic']` OR `['clinic','online']`
   - Do NOT reject therapists who offer more modes unless explicitly incompatible
   - Reject therapists that ONLY offer incompatible types (e.g., only 'online' when 'clinic' is requested)

2. **Age Group**:
   - If user selects 'adult', treat it as ALWAYS PASS (no therapist excluded)
   - Only strict filter for 'child' and 'senior'

3. **Barrier-Free**:
   - If `barrierFree === true` → require `therapist.barrier_free === true`
   - Only applies to in-person meetings (not online)

4. **Strict Gender**:
   - If `strictGender === true` AND `genderPreference !== 'any'`, filter so: `therapist.gender === genderPreference`

5. **Location/Radius**:
   - If user city resolves to coordinates, apply radius filter
   - If user city has NO coordinates (null), SKIP distance filter entirely (never reject therapists)

6. **Home Visit Radius**:
   - If user selects `home_visit`, allow therapists where: `distance_to_user <= therapist.service_radius_km`
   - If therapist has no `service_radius_km`, treat as NOT compatible

### 2. Soft Scoring Implementation

**Location**: `lib/matching/matching-engine.ts` - `applySoftScoring()`

**Scoring System** (points-based, does NOT exclude therapists):

1. **Specialties / Conditions Match**: +10 for exact match, +4 for partial match, +1 general physio
2. **Languages**: +3 each language overlapping with user preferences (max 10 points)
3. **Time Preference (ASAP)**: +6 for therapists with any upcoming availability, +0 otherwise
4. **Gender (non-strict)**: +5 if therapist matches preference, +0 otherwise (only when not strict)
5. **Distance**: 0–10 points, closer = more points (10 at 0-5km, 8 at 5-15km, 5 at 15-25km, 2 at 25-50km, 0 beyond)
6. **Profile Score**: +0–5 based on `therapist.profile_completeness`

**Important**: Soft scoring NEVER excludes therapists - all therapists that pass hard filters are scored and returned.

### 3. Fallback Layers Implementation

**Location**: `lib/matching/matching-engine.ts` - `applyFallbackLayers()`

**3-Level Fallback System**:

**LEVEL 1: Language + Conditions Relax**
- Ignore languages if user only selected `['cs']`
- Treat empty conditions as no requirement
- Allow broader specialty matching

**LEVEL 2: Modality Relax**
- If user selected "clinic":
  - Include therapists offering `['clinic','online']`
  - Include online-only therapists (with warning in metadata)

**LEVEL 3: Location Relax**
- Widen search radius progressively (+5km → +10km → +20km → 100km)
- If still zero, remove location requirement entirely
- Last resort: return all active therapists (only status filter)

### 4. Zero-Result Prevention

**Location**: `lib/matching/matching-engine.ts` - `isGenericQuery()`

**Generic Query Detection**:
- `adult` age group
- `clinic` or `any` meeting type
- Languages: `['cs']` only
- No conditions
- No strict gender
- No barrier-free requirement

For generic queries, the matching engine immediately uses fallback layers to ensure results are always returned.

### 5. Main Matching Function

**Location**: `lib/matching/matching-engine.ts` - `findMatches()`

**Flow**:
1. Apply hard filters
2. If zero results, apply fallback layers
3. Apply soft scoring to remaining therapists
4. Sort by score (descending), then distance (ascending), then name (alphabetical)

**Returns**: `MatchResult` with:
- `matches`: Array of scored therapists
- `fallbackUsed`: Boolean indicating if fallback was used
- `fallbackLevel`: String indicating which fallback level was used
- `metadata`: Additional information about the matching process

## Updated Files

### `app/api/searchTherapists/route.ts`

**Changes**:
- Replaced old hard filter and soft scoring logic with new matching engine
- Added conversion from `SearchInputs` to `MatchingInputs`
- Added conversion from `IndexedTherapist[]` to `MatchingTherapist[]`
- Updated response format to use new scoring breakdown

**Key Section** (lines ~1183-1420):
```typescript
// NEW MATCHING ENGINE: Use canonical types and multi-layered matching
const matchingInputs = convertSearchInputsToMatchingInputs({...})
const matchingTherapists = dataset.map(t => convertIndexedTherapistToMatchingTherapist({...}))
const matchResult = findMatches(matchingInputs, matchingTherapists)
```

### `lib/matching/normalization.ts`

**New Functions**:
- `convertSearchInputsToMatchingInputs()`: Converts legacy SearchInputs to canonical MatchingInputs
- `convertIndexedTherapistToMatchingTherapist()`: Already existed, now used by route

## Type Safety

All matching logic now uses canonical types:
- **Input**: `MatchingInputs` (canonical English values)
- **Therapist**: `MatchingTherapist` (canonical English values)
- **Output**: `ScoredTherapist[]` with type-safe breakdown

## Behavior Changes

### Improvements

1. **Zero-Result Prevention**: Generic queries (adult, clinic, Czech only) always return results
2. **Smarter Meeting Type Filtering**: Allows therapists with `['clinic','online']` when user wants clinic
3. **Adult Age Group**: Always passes hard filters (no exclusion)
4. **Location Handling**: If coordinates unavailable, distance filter is skipped (never rejects)
5. **Progressive Fallback**: 3-level fallback system ensures results are found
6. **Type Safety**: All matching uses canonical types with English values

### Preserved Behavior

1. **Strict Gender Filtering**: Still works when `strictGender === true`
2. **Barrier-Free Requirement**: Still enforced for in-person meetings
3. **Home Visit Radius**: Still checked against `service_radius_km`
4. **Scoring Weights**: Similar to previous system, but more explicit
5. **Response Format**: Compatible with existing UI

## Testing Recommendations

1. **Generic Query Test**: Adult, clinic, Czech only → should always return results
2. **Strict Gender Test**: `strictGender: true, genderPreference: 'female'` → should only return female therapists
3. **Barrier-Free Test**: `barrierFree: true, meetingType: 'clinic'` → should only return barrier-free therapists
4. **Home Visit Test**: `meetingType: 'home_visit'` → should check `service_radius_km`
5. **Fallback Test**: Query with very strict filters → should use fallback and still return results
6. **No Coordinates Test**: City without coordinates → should skip distance filter

## Next Steps

1. Monitor matching results in production
2. Adjust scoring weights if needed
3. Fine-tune fallback levels based on user feedback
4. Consider adding more sophisticated specialty matching
5. Add telemetry to track fallback usage

## Summary

The matching engine is now:
- ✅ Type-safe (uses canonical types)
- ✅ Reliable (zero-result prevention)
- ✅ Predictable (clear hard filters and soft scoring)
- ✅ Maintainable (clean separation of concerns)
- ✅ Backward compatible (response format unchanged)

No UI changes were made - all Czech labels remain untouched.


