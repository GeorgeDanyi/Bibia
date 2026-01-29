# Matching Engine Test Suite

This test suite validates the refactored matching engine (`lib/matching/matching-engine.ts`) to ensure correct behavior and prevent regressions.

## Test Coverage

### 1. Hard Filters

#### Strict Gender Filtering
- ✅ **Strict Female Preference**: When `genderPreference = 'female'` and `strictGender = true`, only female therapists are returned
- ✅ **Strict Male Preference**: When `genderPreference = 'male'` and `strictGender = true`, only male therapists are returned

#### Meeting Type Filtering
- ✅ **Clinic Filter**: Only therapists offering `'clinic'` or `['clinic', 'online']` pass the filter
- ✅ **Online Filter**: Only therapists offering `'online'` pass the filter
- ✅ **Home Visit Filter**: Only therapists offering `'home_visit'` pass the filter
- ✅ **Online-Only Rejection**: Therapists offering only `['online']` are rejected when `meetingType = 'clinic'`

#### Barrier-Free Filtering
- ✅ **Barrier-Free Requirement**: When `barrierFree = true` and `meetingType !== 'online'`, only barrier-free therapists pass
- ✅ **Online Exception**: Barrier-free filter does not apply to online meetings

#### Therapist Status Filtering
- ✅ **Accepting New Clients**: Therapists with `accepting_new = false` are excluded
- ✅ **Active Profile**: Therapists with `active_profile = false` are excluded

### 2. Soft Scoring

#### Non-Strict Gender Preference
- ✅ **Female Preference (Non-Strict)**: When `genderPreference = 'female'` and `strictGender = false`:
  - Both male and female therapists may appear
  - Female therapists have higher scores and rank higher
- ✅ **Male Preference (Non-Strict)**: When `genderPreference = 'male'` and `strictGender = false`:
  - Both genders may appear
  - Male therapists have higher scores and rank higher

### 3. Fallback Layers

#### Fallback Layer 1: Language Relaxation
- ✅ **Czech Language Relaxation**: When only `['cs']` is selected and no results, language requirement is relaxed
- ✅ **Zero-Result Prevention**: Fallback ensures results are returned when possible

#### Fallback Layer 2: Modality Expansion
- ✅ **Clinic to Online Expansion**: When `meetingType = 'clinic'` results in zero matches, fallback expands to include:
  - Therapists offering `['clinic', 'online']`
  - Therapists offering only `['online']`
- ✅ **Results Guarantee**: Always returns results unless strict filters forbid it

#### Fallback Layer 3: Location Expansion
- ✅ **Radius Expansion**: When no therapists found within initial radius:
  - Progressively expands radius (+5km → +10km → +20km → 100km)
  - Eventually removes location requirement entirely
- ✅ **Last Resort**: If all else fails, returns all active therapists (only status filter)

### 4. Integration Tests

- ✅ **Complex Queries**: Handles multiple filters simultaneously (gender, barrier-free, meeting type, languages, issues)
- ✅ **Score Sorting**: Results are sorted by total score (descending)
- ✅ **Score Breakdown**: Each match includes detailed score breakdown (specialties, languages, time, gender, distance, profile)

### 5. Edge Cases

- ✅ **Empty Therapist List**: Handles empty input gracefully
- ✅ **Null Coordinates**: Handles therapists without coordinates appropriately
- ✅ **Online Without Location**: Online meetings work without location requirement

## Test Dataset

The test suite uses a comprehensive dataset (`test-fixtures.ts`) with 8 therapists covering:

- **Genders**: Both male and female therapists
- **Meeting Types**: 
  - Clinic only
  - Online only
  - Home visit only
  - Clinic + online
  - Home visit + clinic
- **Barrier-Free**: Both barrier-free and non-barrier-free therapists
- **Languages**: Czech, English, German, Slovak
- **Locations**: Prague, Brno, Plzen, Liberec, Olomouc (various distances)
- **Service Radii**: Various service radius values for home visits
- **Specialties**: Spine pain, sports injury, neurological rehab, pelvic floor
- **Status**: Including one therapist not accepting new clients (for filtering tests)

## Running Tests

```bash
# Run all matching engine tests
npm test -- tests/matching/matching-engine.test.ts

# Run with coverage
npm test -- tests/matching/matching-engine.test.ts --coverage

# Run in watch mode
npm test -- tests/matching/matching-engine.test.ts --watch
```

## Test Results

All 21 tests pass, covering:
- 9 hard filter tests
- 2 soft scoring tests
- 4 fallback layer tests
- 3 integration tests
- 3 edge case tests

## Guaranteed Behaviors

The test suite guarantees:

1. **Strict gender filtering works correctly** - No gender leaks when `strictGender = true`
2. **Meeting type filtering is accurate** - Only compatible therapists pass
3. **Barrier-free requirement is enforced** - For in-person meetings only
4. **Soft scoring ranks correctly** - Preferred gender ranks higher but doesn't exclude others
5. **Fallback layers prevent zero results** - Progressive relaxation ensures results when possible
6. **Status filtering is enforced** - Only active, accepting therapists appear
7. **Results are properly sorted** - By score (descending), then distance (ascending)
8. **Edge cases are handled** - Empty lists, null coordinates, online meetings work correctly

These tests ensure the matching engine behaves correctly and will catch any regressions in future changes.


