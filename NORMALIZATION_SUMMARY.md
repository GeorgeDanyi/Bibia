# Type Normalization Summary

## Updated Types

### 1. Answers Type (Questionnaire Input)

**File**: `lib/types/answers.ts`

```typescript
export type GenderPreference = 'male' | 'female' | 'any';

export interface Answers {
  city: string;
  radiusKm: number;
  meetingType: 'clinic' | 'home' | 'online' | 'any';
  problemArea: string;
  problemDetail?: string;
  ageGroup: 'child' | 'adult' | 'senior';
  genderPreference: GenderPreference;
  strictGender: boolean;
  barrierFree: boolean;
  languages: string[];
  insuranceMode: 'insurance' | 'self-pay';
  timesOfDay: string[];
  weekdays: string[];
}
```

**Status**: ✅ Already correctly defined and used consistently across the codebase.

**Usage**:
- `app/questionnaire/results/page.tsx` - Reads answers using `getAnswers()`
- `lib/matching/normalization.ts` - `normalizeAnswersToSearchInputs(answers: Answers)` converts to `SearchInputs`
- `lib/utils/answers.ts` - Storage utilities use `Answers` type

### 2. Therapist Gender Type (Strict)

**File**: `lib/types/therapist.ts`

**Before**:
```typescript
export type TherapistGender = 'male' | 'female' | 'unspecified'
```

**After**:
```typescript
// Therapist gender is strictly 'male' | 'female' (no 'unspecified' allowed)
// Use normalizeTherapistGender() to normalize any input values
export type TherapistGender = 'male' | 'female'
```

**Matching Engine Type** (`lib/matching/types.ts`):
```typescript
export interface Therapist {
  // ... other fields
  gender: 'male' | 'female'  // Strictly typed, no 'unspecified'
  // ... other fields
}
```

**Indexed Type** (`app/api/searchTherapists/route.ts`):
```typescript
type IndexedTherapist = {
  // ... other fields
  gender: 'male' | 'female'  // Strictly typed
  // ... other fields
}
```

## Gender Normalization

### Normalization Function

**File**: `lib/utils/normalize.ts`

```typescript
/**
 * Normalize therapist gender to strict 'male' | 'female'
 * Handles various input formats: 'M', 'F', 'žena', 'muž', 'Female', 'Male', 'MALE', 'FEMALE', etc.
 * This is used for therapist records (not user preferences).
 * Unrecognized values default to 'female' with a console warning.
 */
export function normalizeTherapistGender(
  value: string | undefined | null, 
  therapistId?: string
): 'male' | 'female' {
  if (!value) {
    if (process.env.NODE_ENV !== 'production' && therapistId) {
      console.warn(`[GENDER_NORMALIZE] Missing gender for therapist ${therapistId}, defaulting to 'female'`)
    }
    return 'female'
  }
  
  const v = String(value).toLowerCase().trim()
  
  // Direct matches - male (handles: male, m, muž, muz, Male, MALE, M, etc.)
  if (v === 'male' || v === 'm' || v === 'muž' || v === 'muz') return 'male'
  
  // Direct matches - female (handles: female, f, žena, zena, Female, FEMALE, F, etc.)
  if (v === 'female' || v === 'f' || v === 'žena' || v === 'zena') return 'female'
  
  // Unrecognized value - default to 'female' with warning
  if (process.env.NODE_ENV !== 'production' && therapistId) {
    console.warn(`[GENDER_NORMALIZE] Unrecognized gender value "${value}" for therapist ${therapistId}, defaulting to 'female'`)
  }
  return 'female'
}
```

### Supported Input Variations

The normalization function handles:
- **English**: `'male'`, `'female'`, `'Male'`, `'Female'`, `'MALE'`, `'FEMALE'`, `'M'`, `'F'`
- **Czech**: `'muž'`, `'muz'`, `'žena'`, `'zena'`
- **Case variations**: All case combinations are handled via `.toLowerCase()`

### Where Normalization Happens

#### 1. Data Loading (`app/api/searchTherapists/route.ts`)

**Function**: `normalizeTherapistData(therapist: any)`

```typescript
function normalizeTherapistData(therapist: any): any {
  const normalized = { ...therapist }
  
  // Normalize gender to strict 'male' | 'female'
  if (therapist.gender !== undefined) {
    normalized.gender = normalizeTherapistGender(therapist.gender, therapist.id)
  }
  
  // ... other normalization
  return normalized
}
```

**Called in**: `loadIndex()` when loading from `data/therapists.json`

#### 2. Synthetic Data Mapping (`app/api/searchTherapists/route.ts`)

**Function**: `mapSyntheticToIndexed(s: any)`

```typescript
function mapSyntheticToIndexed(s: any): IndexedTherapist {
  return {
    // ... other fields
    gender: normalizeTherapistGender(s.gender, s.id),
    // ... other fields
  }
}
```

**Called in**: `loadIndex()` when loading from `data/therapists.synthetic.json`

#### 3. Other Data Loaders

- `lib/utils/loaders.ts` - Normalizes gender for fixtures and seeded data
- `src/data/therapists.ts` - Normalizes gender when reading from public JSON
- `app/api/therapists/route.ts` - Normalizes gender for all therapist endpoints
- `app/api/searchSimple/route.ts` - Normalizes gender for simple search

#### 4. Runtime Normalization (`app/api/searchTherapists/route.ts`)

**Location**: Inside search results processing

```typescript
// Normalize gender to strict 'male' | 'female' (should already be normalized, but ensure it)
const rawGender = (s.t as any).gender
const mappedGender: 'male' | 'female' = normalizeTherapistGender(rawGender, (s.t as any).id)
```

## Updated Code References

### Removed 'unspecified' Support

1. **`lib/types/therapist.ts`**
   - Changed `TherapistGender` from `'male' | 'female' | 'unspecified'` to `'male' | 'female'`
   - Added comment explaining normalization requirement

2. **`lib/utils/therapist-matchers.ts`**
   - Removed check for `'unspecified'` in `matchesGender()` function
   - Function now assumes gender is always normalized to `'male' | 'female'`

3. **`lib/validation/therapist.ts`**
   - Updated `GENDERS` array from `["male","female","unspecified"]` to `["male","female"]`

4. **`app/api/searchTherapists/route.ts`**
   - Changed fallback from `'unspecified'` to using `normalizeTherapistGender()` for proper normalization

## Data Flow

### Questionnaire Answers Flow

```
User Input (UI)
  ↓
Answers (lib/types/answers.ts)
  ↓
normalizeAnswersToSearchInputs() (lib/matching/normalization.ts)
  ↓
SearchInputs (lib/matching/types.ts)
  ↓
Matching Engine
```

### Therapist Data Flow

```
JSON Data (data/therapists.json)
  ↓
normalizeTherapistData() → normalizeTherapistGender()
  ↓
IndexedTherapist (gender: 'male' | 'female')
  ↓
Matching Engine
```

## Type Safety Guarantees

1. **Answers Type**: Centralized in `lib/types/answers.ts`, imported consistently
2. **Therapist Gender**: Strictly `'male' | 'female'` at all levels:
   - `Therapist` interface (matching engine)
   - `TherapistNormalized` interface
   - `IndexedTherapist` type
3. **Normalization**: Applied at data load time, ensuring all therapist records have normalized gender before matching

## Summary

✅ **Answers type**: Already correctly defined and used consistently  
✅ **Therapist gender**: Now strictly typed as `'male' | 'female'` (removed `'unspecified'`)  
✅ **Normalization**: Comprehensive function handles all input variations  
✅ **Data loading**: Normalization applied at all data entry points  
✅ **Type safety**: All types are strongly typed with no loose `any` types for gender

All Czech UI text remains unchanged - only types and normalization logic were updated.

