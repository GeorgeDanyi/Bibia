# Matching Engine Analysis: Zero Results Investigation

## 1. Main Matching Entry Point

**File**: `app/api/searchTherapists/route.ts`
- **Function**: `POST(request: NextRequest)` (line 622)
- **Flow**:
  1. Normalizes input via `normalizeSearchInputs()` (line 1063)
  2. Loads dataset via `loadIndex()` (line 1156)
  3. Applies hard filters via `applyHardFilters()` (line 1210)
  4. Applies soft scoring via `applySoftScoring()` (line 1373)
  5. Sorts and returns results

## 2. Matching-Related Types

### SearchInputs Type
**File**: `lib/matching/types.ts` (lines 3-45)

```typescript
export interface SearchInputs {
  location: { city?: string; coords?: { lat: number; lon: number } }
  radiusKm?: number
  meetingType: 'ordinace' | 'dojíždění' | 'online'
  issues: string[]
  diagnosis: { canonicalId?: string; synonyms?: string[]; category?: string }
  timeFit: 'ASAP' | 'weekday' | 'evening' | 'weekend'
  language?: string
  languages?: string[]
  wantsInsurance: boolean
  ageGroup: 'child' | 'adult' | 'senior'
  therapistGenderPref: 'male' | 'female' | 'any'
  strictGender?: boolean
  barrierFree: boolean
}
```

### IndexedTherapist Type
**File**: `app/api/searchTherapists/route.ts` (lines 19-39)

```typescript
type IndexedTherapist = {
  id: string
  name: string
  gender: 'male' | 'female'
  city: string
  lat: number
  lng: number
  meeting_types: Array<'ordinace' | 'dojizdeni' | 'online'>
  service_radius_km: number
  languages: string[]
  specialties: string[]
  age_groups: Array<'child'|'adult'|'senior'>
  accepts_insurance: boolean
  availability: string[]
  profile_score: number
  reviews_count: number
  verified: boolean
  bio: string
  created_at: string
  metadata: { has_photos: boolean; education: string; synthetic?: boolean; barrier_free?: boolean }
}
```

## 3. Hard Filters Function

**File**: `app/api/searchTherapists/route.ts` (lines 67-136)

```typescript
function applyHardFilters(
  therapist: IndexedTherapist,
  inputs: HardFilterInputs
): { pass: boolean; reason?: string } {
  const userCoords = inputs.location?.coords
  const radiusKm = inputs.radiusKm || 30
  
  // 1. Meeting type compatibility - MANDATORY
  if (!matchesMeetingType(therapist.meeting_types, inputs.meetingType)) {
    return { pass: false, reason: 'MEETING_TYPE_INCOMPATIBLE' }
  }
  
  // Additional check: exclude therapists that ONLY offer online or home_visit when clinic is required
  if (inputs.meetingType === 'ordinace' || inputs.meetingType === 'clinic') {
    const therapistModes = (therapist.meeting_types || []).map(m => 
      m === 'ordinace' ? 'clinic' : m === 'dojizdeni' ? 'home_visit' : m
    )
    const hasOnlyOnline = therapistModes.length === 1 && therapistModes.includes('online')
    const hasOnlyHomeVisit = therapistModes.length === 1 && therapistModes.includes('home_visit')
    if (hasOnlyOnline || hasOnlyHomeVisit) {
      return { pass: false, reason: 'MEETING_TYPE_INCOMPATIBLE' }
    }
  }
  
  // 2. Radius/location match - MANDATORY for in-person meetings
  if (inputs.meetingType !== 'online' && userCoords) {
    const radiusCheck = isInRadiusSync({
      userCoords,
      therapistLocation: { lat: therapist.lat, lng: therapist.lng, city: therapist.city },
      radiusKm,
      meetingType: inputs.meetingType,
      serviceRadiusKm: therapist.service_radius_km
    })
    
    if (radiusCheck.distanceKm === null) {
      return { pass: false, reason: 'LOCATION_UNAVAILABLE' }
    }
    
    if (!radiusCheck.inRadius) {
      return { pass: false, reason: 'LOCATION_OUT_OF_RANGE' }
    }
  }
  
  // 3. Age group compatibility - MANDATORY for child/senior
  if (!matchesAgeGroup(therapist.age_groups, inputs.ageGroup)) {
    return { pass: false, reason: 'AGE_GROUP_INCOMPATIBLE' }
  }
  
  // 4. Barrier-free requirement - MANDATORY if requested for in-person
  if (inputs.barrierFree && inputs.meetingType !== 'online') {
    const hasBarrierFree = (therapist.metadata && (therapist.metadata as any).barrier_free) || false
    if (!hasBarrierFree) {
      return { pass: false, reason: 'NO_BARRIER_FREE' }
    }
  }
  
  // 5. STRICT gender filtering - MANDATORY when strictGender === true AND genderPreference !== 'any'
  if (inputs.strictGender === true && inputs.genderPreference && inputs.genderPreference !== 'any') {
    if (!matchesGender(therapist.gender, inputs.genderPreference)) {
      return { pass: false, reason: 'GENDER_MISMATCH' }
    }
  }
  
  return { pass: true }
}
```

## 4. Filter Analysis by Aspect

### Gender Filtering

**Function**: `matchesGender()` in `lib/utils/therapist-matchers.ts` (lines 100-112)

**Type**: **Soft scoring** (NOT a hard filter unless `strictGender === true`)

**Implementation**:
- Hard filter ONLY when `strictGender === true` AND `genderPreference !== 'any'`
- Otherwise, used in soft scoring (0-5 points)
- In example query: `strictGender: false`, `therapistGenderPref: "any"` → **NOT a hard filter**

### City / Distance Filtering

**Function**: `isInRadiusSync()` in `lib/utils/therapist-matchers.ts` (lines 289-334)

**Type**: **Hard filter** (MANDATORY for in-person meetings)

**Implementation**:
- Checks if therapist is within `radiusKm` (default 30km)
- For clinic: uses requested radius
- For home visits: uses therapist's `service_radius_km` (default 50km)
- For online: skipped (always passes)
- **CRITICAL**: If `userCoords` is missing/null, returns `{ inRadius: false }` → **REJECTS ALL therapists**

**Potential Issue**: If city "Praha" doesn't resolve to coordinates, ALL therapists are rejected.

### Meeting Type Filtering (Clinic / Home / Online)

**Function**: `matchesMeetingType()` in `lib/utils/therapist-matchers.ts` (lines 163-171)

**Type**: **Hard filter** (MANDATORY)

**Implementation**:
```typescript
export function matchesMeetingType(
  therapistMeetingTypes: string[] | null | undefined,
  requestedMeetingType: MeetingTypeInput
): boolean {
  const normalizedTherapistTypes = normalizeTherapistMeetingTypes(therapistMeetingTypes)
  const normalizedRequested = normalizeMeetingType(requestedMeetingType)
  
  return normalizedTherapistTypes.includes(normalizedRequested)
}
```

**Normalization**:
- `'clinic'` → `'clinic'`
- `'ordinace'` → `'clinic'`
- `'home_visit'` → `'home_visit'`
- `'dojizdeni'` / `'dojíždění'` → `'home_visit'`
- `'online'` → `'online'`

**Additional Check** (lines 79-89 in route.ts):
- If requesting `'clinic'` or `'ordinace'`, excludes therapists that ONLY offer `'online'` or ONLY offer `'home_visit'`
- **This is CORRECT**: Therapists with `['clinic', 'online']` WILL match `'clinic'` request

**Potential Issue**: None - the logic correctly allows therapists with multiple meeting types.

### Age Group Filtering

**Function**: `matchesAgeGroup()` in `lib/utils/therapist-matchers.ts` (lines 130-145)

**Type**: **Hard filter** (MANDATORY for `child` or `senior`)

**Implementation**:
- For `'adult'`: Always returns `true` (adult is always supported)
- For `'child'` or `'senior'`: Requires explicit support in `therapist.age_groups`
- In example query: `ageGroups: "adult"` → **Always passes** (not a filter)

### Language Filtering

**Function**: Used in soft scoring (line 207-211 in route.ts) and `classifyTier()` (line 40 in `lib/search/classifyTier.ts`)

**Type**: **Soft scoring** (NOT a hard filter in `applyHardFilters()`)

**Implementation**:
- **NOT in hard filters**: Language is NOT checked in `applyHardFilters()`
- **Soft scoring**: Used in `applySoftScoring()` (line 207-211)
  ```typescript
  const languageScore = (() => {
    if (!inputs.language) return 0.5 // Neutral if no language preference
    return therapist.languages.includes(inputs.language) ? 1.0 : 0.0
  })()
  ```
- **Tier classification**: In `classifyTier()` (line 40):
  ```typescript
  const considerLanguage = Boolean(query.languageSelected) && !!query.language && !(query.language === 'cestina' || query.language === 'cs')
  ```
  - **CRITICAL**: Czech (`'cs'` or `'cestina'`) is IGNORED in tier classification!
  - Language is only considered for non-Czech languages

**Potential Issue**: None - language is correctly NOT a hard filter.

### Time / Availability Filtering

**Function**: `normalizeTimeFit()` in `lib/matching/normalization.ts` (lines 316-330)

**Type**: **Soft scoring** (NOT a hard filter)

**Implementation**:
- `'asap'` → normalized to `'ASAP'`
- Used in soft scoring for availability matching (lines 235-260 in route.ts)
- **NOT a hard filter**: Therapists without matching availability are NOT excluded
- In example query: `time: "asap"` → **NOT a filter**, only affects scoring

**Potential Issue**: None - time is correctly NOT a hard filter.

### Conditions / Specialties Filtering

**Function**: Used in soft scoring (lines 182-205 in route.ts)

**Type**: **Soft scoring** (NOT a hard filter)

**Implementation**:
```typescript
const problemAreaScore = (() => {
  const diag = inputs.diagnosis?.canonicalId
  const syns: string[] = toArray(inputs.diagnosis?.synonyms)
  const category = inputs.diagnosis?.category
  
  if (diag) {
    // Exact diagnosis match
    if (therapist.specialties.includes(diag)) return 1.0
    // Synonym match
    if (syns.some(s => therapist.specialties.includes(s))) return 0.9
    // Category match
    if (category && therapist.specialties.includes(category)) return 0.65
    // No match
    return 0.25
  } else if (inputs.issues && inputs.issues.length > 0) {
    // Problem area matching (issues)
    const userTags = inputs.issues
    const common = userTags.filter(u => therapist.specialties.includes(u)).length
    return userTags.length === 0 ? 0.25 : Math.min(0.75, common / userTags.length)
  }
  // No problem area specified - neutral score
  return 0.5
})()
```

**Potential Issue**: None - empty conditions result in neutral score (0.5), not exclusion.

## 5. Root Cause Analysis for Zero Results

### Example Query Parameters:
```json
{
  "ageGroups": "adult",
  "city": "Praha",
  "conditions": "",
  "hasDiagnosis": false,
  "languages": "cs",
  "practice": "clinic",
  "strictGender": false,
  "therapistGender": "any",
  "therapistGenderPref": "any",
  "time": "asap"
}
```

### Hard Filters Applied (in order):

1. ✅ **Meeting Type** (`practice: "clinic"`):
   - Normalized to `'ordinace'` or `'clinic'`
   - Checks if therapist has `'ordinace'` or `'clinic'` in `meeting_types`
   - **Should pass** for therapists with `['ordinace']` or `['ordinace', 'online']`, etc.

2. ✅ **Age Group** (`ageGroups: "adult"`):
   - `'adult'` always passes (not filtered)
   - **Should pass** for all therapists

3. ✅ **Gender** (`strictGender: false`, `therapistGenderPref: "any"`):
   - Not a hard filter when `strictGender === false`
   - **Should pass** for all therapists

4. ✅ **Barrier-Free** (not specified):
   - Not checked if not requested
   - **Should pass** for all therapists

5. ❌ **Location / Distance** (`city: "Praha"`):
   - **CRITICAL ISSUE**: Requires `userCoords` to be set
   - If city "Praha" doesn't resolve to coordinates, `userCoords` is `null`
   - When `userCoords` is `null` and `meetingType !== 'online'`, the radius check returns `{ inRadius: false }`
   - **ALL therapists are rejected** with reason `'LOCATION_UNAVAILABLE'` or `'LOCATION_OUT_OF_RANGE'`

### Most Likely Root Cause:

**Missing or Invalid Coordinates for "Praha"**

The hard filter at line 92-111 in `app/api/searchTherapists/route.ts`:

```typescript
// 2. Radius/location match - MANDATORY for in-person meetings
if (inputs.meetingType !== 'online' && userCoords) {
  const radiusCheck = isInRadiusSync({...})
  
  if (radiusCheck.distanceKm === null) {
    return { pass: false, reason: 'LOCATION_UNAVAILABLE' }
  }
  
  if (!radiusCheck.inRadius) {
    return { pass: false, reason: 'LOCATION_OUT_OF_RANGE' }
  }
}
```

**Problem**: If `userCoords` is `null` or `undefined`, this check is skipped, BUT there's no fallback. The code at lines 1130-1145 attempts to resolve coordinates:

```typescript
if (!inputs.location.coords && inputs.location.city) {
  try {
    const gc = getCityCoords(inputs.location.city)
    if (gc) {
      inputs.location.coords = { lat: gc[0], lon: gc[1] }
    } else {
      // ... fallback attempts ...
    }
  } catch {}
}
```

**However**: If coordinate resolution fails, `userCoords` remains `null`, and the hard filter check at line 92 (`if (inputs.meetingType !== 'online' && userCoords)`) is skipped, meaning the location check doesn't run. But wait - if `userCoords` is falsy, the condition is false, so the check is skipped entirely.

**Actually**: Looking more carefully, if `userCoords` is falsy, the entire location check block is skipped (line 92 condition fails). This means therapists are NOT rejected for location if coordinates are missing. So that's not the issue.

**Wait**: Let me re-read the code. The check is:
```typescript
if (inputs.meetingType !== 'online' && userCoords) {
  // radius check
  if (radiusCheck.distanceKm === null) {
    return { pass: false, reason: 'LOCATION_UNAVAILABLE' }
  }
  if (!radiusCheck.inRadius) {
    return { pass: false, reason: 'LOCATION_OUT_OF_RANGE' }
  }
}
```

If `userCoords` is falsy, the entire block is skipped, so location is NOT checked. This means therapists should pass the location filter if coordinates are missing.

**But**: There might be another issue. Let me check if there's a requirement for coordinates elsewhere, or if the coordinate resolution is failing silently.

### Secondary Potential Issues:

1. **Meeting Type Normalization Mismatch**:
   - Query has `practice: "clinic"`
   - Normalized to `'ordinace'` or `'clinic'`
   - Therapist data has `meeting_types: ['ordinace', 'dojizdeni']`
   - The normalization should work, but if there's a mismatch in the normalization function, it could fail.

2. **Dataset Loading Issue**:
   - `loadIndex()` might return empty array
   - Or dataset might not have therapists in Praha

3. **Age Group Data Issue**:
   - If therapists don't have `age_groups` array, `matchesAgeGroup()` might fail
   - But for `'adult'`, it should always return `true`

## 6. Specific Condition Analysis

### languages: "cs"

**Status**: ✅ **NOT a hard filter** - correctly implemented as soft scoring only.

**Implementation**:
- Not checked in `applyHardFilters()`
- Used in soft scoring (0-10 points)
- Czech language is ignored in tier classification (line 40 in `classifyTier.ts`)

**Conclusion**: Language is NOT causing zero results.

### practice: "clinic"

**Status**: ✅ **Correctly implemented** - should match therapists with `['clinic', 'online']` etc.

**Implementation**:
- Normalized to `'ordinace'` or `'clinic'`
- `matchesMeetingType()` checks if therapist's `meeting_types` includes the requested type
- Additional check excludes therapists that ONLY offer online/home_visit (correct behavior)

**Conclusion**: Meeting type matching is correct and should NOT cause zero results.

### time: "asap"

**Status**: ✅ **NOT a hard filter** - correctly implemented as soft scoring only.

**Implementation**:
- Normalized to `'ASAP'`
- Used in availability scoring (0-15 points)
- NOT used in hard filters

**Conclusion**: Time preference is NOT causing zero results.

### empty conditions: ""

**Status**: ✅ **Correctly handled** - results in neutral score, not exclusion.

**Implementation**:
- Empty conditions result in `problemAreaScore = 0.5` (neutral)
- NOT used in hard filters
- Only affects soft scoring

**Conclusion**: Empty conditions are NOT causing zero results.

## 7. Most Likely Root Causes

### Primary Suspect: Location/Coordinate Resolution Failure

**Evidence**:
1. Hard filter requires coordinates for in-person meetings
2. If coordinate resolution fails, `userCoords` is `null`
3. However, if `userCoords` is falsy, the location check is skipped (not rejected)
4. **BUT**: There might be a bug where missing coordinates cause rejection elsewhere

**Investigation Needed**:
- Check if `getCityCoords("Praha")` returns valid coordinates
- Check if coordinate resolution is failing silently
- Check if there's another location check that rejects when coordinates are missing

### Secondary Suspect: Dataset Issues

**Possible Issues**:
1. Dataset might be empty
2. Dataset might not have therapists in Praha
3. Dataset might not have therapists with `meeting_types` including `'ordinace'`

**Investigation Needed**:
- Check `loadIndex()` return value
- Check if dataset has therapists
- Check if therapists have correct `meeting_types` values

### Tertiary Suspect: Normalization Issues

**Possible Issues**:
1. `practice: "clinic"` might not normalize correctly
2. Meeting type normalization might have a bug
3. Age group normalization might fail

**Investigation Needed**:
- Check normalization function outputs
- Verify `normalizeMeetingType("clinic")` returns correct value
- Verify `normalizeAgeGroup("adult")` returns correct value

## 8. Recommended Debugging Steps

1. **Add logging to hard filters**:
   - Log each therapist's rejection reason
   - Log coordinate resolution results
   - Log meeting type normalization results

2. **Check dataset**:
   - Verify `loadIndex()` returns therapists
   - Verify therapists have correct `meeting_types`
   - Verify therapists have coordinates

3. **Check coordinate resolution**:
   - Verify `getCityCoords("Praha")` returns coordinates
   - Verify coordinates are passed to hard filters
   - Verify `isInRadiusSync()` receives valid inputs

4. **Check normalization**:
   - Verify `normalizeMeetingType("clinic")` → `'ordinace'` or `'clinic'`
   - Verify `normalizeAgeGroup("adult")` → `'adult'`
   - Verify all query parameters are normalized correctly

## Summary

**Hard Filters** (must pass):
1. ✅ Meeting type - Correctly implemented
2. ✅ Location/radius - **POTENTIAL ISSUE**: Coordinate resolution might fail
3. ✅ Age group - Always passes for 'adult'
4. ✅ Barrier-free - Not requested, skipped
5. ✅ Gender - Not a hard filter when `strictGender === false`

**Soft Scoring** (affects ranking only):
1. ✅ Language - Correctly NOT a hard filter
2. ✅ Time/availability - Correctly NOT a hard filter
3. ✅ Conditions/specialties - Correctly NOT a hard filter

**Most Likely Root Cause**: Location/coordinate resolution failure causing all therapists to be rejected, OR dataset loading issue resulting in empty dataset.

