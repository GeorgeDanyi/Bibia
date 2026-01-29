# Therapist Data Analysis

## 1. TypeScript Type/Interface for Therapist

### Primary Type: `Therapist` (Main Interface)

**File**: `lib/types/therapist.ts` (lines 23-85)

```typescript
export interface Therapist {
  // Basic info
  id: string; // UUID
  fullName: string;
  city: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  regions: string[]; // e.g., ["Praha", "Středočeský"]
  languages: string[]; // e.g., ["cs", "en", "de"]
  
  // Practice info
  practiceType: 'private' | 'clinic' | 'hospital' | 'home_visits' | 'online';
  acceptingNew: boolean;
  
  // Experience & pricing
  yearsExperience: number;
  pricePerSession: number; // CZK
  priceRange?: { minCZK: number; maxCZK: number };
  
  // Availability - NEW FIELDS
  nextAvailableDays: number | null; // Days until next available slot
  workingHours: {
    morning: boolean;    // 7-11
    midday: boolean;    // 11-15
    evening: boolean;   // 15-19
    weekend: boolean;   // Sat-Sun
  };
  
  // Legacy availability (for backward compatibility)
  availability: TherapistAvailability[];
  
  // Specializations
  specialties: string[]; // General issue tags
  diagnoses: string[]; // Specific diagnosis tags
  tags: string[]; // Additional tags for filtering
  diagnosisTags: string[]; // Specific diagnosis tags for matching
  modalities: string[]; // e.g., ["DNS", "McKenzie", "Visceral"]
  worksWith: string[]; // e.g., ["těhotné", "sportovci", "senioři", "děti"]
  
  // Reviews & rating
  rating: TherapistRating;
  reviewsCount: number;
  
  // Additional info
  bio: string;
  
  // Optional fields
  profileImage?: string;
  clinicName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  insuranceAccepted?: string[]; // Insurance company codes
  isVerified?: boolean;
  lastActive?: string; // ISO date
  clinicLat?: number;
  clinicLon?: number;
  homeVisitRadiusKm?: number;
  experienceTags?: string[];
  isFixture?: boolean;
}
```

**Note**: This interface does NOT include a `gender` field, but gender is present in the actual data and matching logic.

### Normalized Type: `TherapistNormalized`

**File**: `lib/types/therapist.ts` (lines 225-247)

```typescript
export interface TherapistNormalized {
  id: string
  full_name: string
  gender: TherapistGender // Strictly 'male' | 'female' - must be normalized using normalizeTherapistGender()
  accepting_new: boolean

  meeting_modes: MeetingMode[]
  base_city: string
  locations: TherapistLocation[]
  service_radius_km?: number
  service_areas?: string[]

  languages: LanguageCode[]
  insurers: string[]
  specialties: (BodyRegion | BodyRegionTag)[]
  diagnosis_expertise: string[]
  patient_groups: PatientGroup[]

  weekly_availability: WeeklyAvailability
  price_info?: { range_czk?: { min: number; max: number }; fixed_czk?: number; note?: string }
  rating?: TherapistRating
  next_available_in_days?: number | null
}
```

### Indexed Type (Used in Matching Engine)

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

### Matching Engine Type

**File**: `lib/matching/types.ts` (lines 59-104)

```typescript
export interface Therapist {
  id: string
  fullName: string
  city: string
  latitude: number
  longitude: number
  
  // Meeting types supported
  meetingTypes: ('ordinace' | 'dojíždění' | 'online')[]
  serviceRadiusKm?: number // for dojíždění
  
  // Accessibility
  barrier_free: boolean
  
  // Age groups supported
  ageGroups: ('child' | 'adult' | 'senior')[]
  
  // Status
  acceptingNewClients: boolean
  activeProfile: boolean
  
  // Specializations
  diagnoses: {
    canonicalIds: string[]
    synonyms: string[]
    categories: string[]
  }
  issues: string[] // body regions/tags
  
  // Availability
  nextAvailableSlot?: string
  timeWindows: ('weekday' | 'evening' | 'weekend')[]
  
  // Language and insurance
  languages: string[]
  acceptsInsurance: boolean
  
  // Demographics
  gender: 'male' | 'female'
  
  // Profile quality
  isVerified: boolean
  profileCompleteness: number
  reviewCount: number
  hasPhotos: boolean
}
```

### Gender Type Definition

**File**: `lib/types/therapist.ts` (lines 204-206)

```typescript
// Therapist gender is strictly 'male' | 'female' (no 'unspecified' allowed)
// Use normalizeTherapistGender() to normalize any input values
export type TherapistGender = 'male' | 'female'
```

---

## 2. Fields Relevant for Matching

### Hard Filters (Must Pass)

1. **gender** (`'male' | 'female'`)
   - **Location**: `IndexedTherapist.gender`, `TherapistNormalized.gender`, `Therapist.gender`
   - **Usage**: Hard filter when `strictGender === true` AND `genderPreference !== 'any'`
   - **Matching Function**: `matchesGender()` in `lib/utils/therapist-matchers.ts`

2. **meeting_types** / **meetingTypes** / **meeting_modes**
   - **Type**: `Array<'ordinace' | 'dojizdeni' | 'online'>` or `Array<'clinic' | 'home_visit' | 'online'>`
   - **Location**: `IndexedTherapist.meeting_types`, `TherapistNormalized.meeting_modes`, `Therapist.meetingTypes`
   - **Usage**: Hard filter - therapist must support user's selected meeting type
   - **Matching Function**: `matchesMeetingType()` in `lib/utils/therapist-matchers.ts`
   - **Normalization**: `normalizeMeetingModes()` in `app/api/searchTherapists/route.ts`

3. **location / coordinates** (`lat`, `lng`, `latitude`, `longitude`)
   - **Type**: `number` (coordinates within Czech Republic bounds: lat 48.5-51.1, lon 12.0-18.9)
   - **Location**: `IndexedTherapist.lat/lng`, `Therapist.latitude/longitude`, `TherapistLocation.lat/lon`
   - **Usage**: Hard filter for in-person meetings - must be within `radiusKm` or `service_radius_km`
   - **Matching Function**: `isInRadius()` / `isInRadiusSync()` in `lib/utils/therapist-matchers.ts`

4. **age_groups** / **ageGroups** / **patient_groups**
   - **Type**: `Array<'child' | 'adult' | 'senior'>`
   - **Location**: `IndexedTherapist.age_groups`, `TherapistNormalized.patient_groups`, `Therapist.ageGroups`
   - **Usage**: Hard filter for `child` or `senior` (adult is always supported)
   - **Matching Function**: `matchesAgeGroup()` in `lib/utils/therapist-matchers.ts`

5. **barrier_free** / **barrierFree**
   - **Type**: `boolean`
   - **Location**: `IndexedTherapist.metadata.barrier_free`, `Therapist.barrier_free`, `TherapistLocation.barrier_free`
   - **Usage**: Hard filter when user requires barrier-free access for in-person meetings
   - **JSON Format**: `metadata.barrier_free: boolean` in `data/therapists.json`

### Soft Scoring Fields (Influence Ranking)

6. **languages**
   - **Type**: `string[]` (e.g., `["cs", "en", "de"]` or `["cestina", "anglictina"]`)
   - **Location**: `IndexedTherapist.languages`, `TherapistNormalized.languages`, `Therapist.languages`
   - **Usage**: Soft scoring (0-10 points) - bonus if therapist speaks user's preferred language
   - **Normalization**: Language codes normalized to canonical forms (e.g., `"cestina"` → `"cs"`)

7. **accepts_insurance** / **acceptsInsurance** / **insurers**
   - **Type**: `boolean` or `string[]` (insurance company codes)
   - **Location**: `IndexedTherapist.accepts_insurance`, `Therapist.acceptsInsurance`, `TherapistNormalized.insurers`
   - **Usage**: Soft scoring (0-5 points) - bonus if therapist accepts insurance when user wants insurance
   - **JSON Format**: `accepts_insurance: boolean` in `data/therapists.json`

8. **specialties** / **issues** / **diagnosis_expertise**
   - **Type**: `string[]` (body regions, tags, diagnosis IDs)
   - **Location**: `IndexedTherapist.specialties`, `Therapist.issues`, `TherapistNormalized.specialties`
   - **Usage**: Primary matching criteria - highest scoring component (0-40 points)
   - **Examples**: `["shoulder", "knee", "spine_pain", "womens_health", "postpartum", "geriatrics"]`

9. **availability** / **timeWindows** / **weekly_availability**
   - **Type**: `string[]` (ISO timestamps) or `WeeklyAvailability` object
   - **Location**: `IndexedTherapist.availability`, `Therapist.timeWindows`, `TherapistNormalized.weekly_availability`
   - **Usage**: Soft scoring (0-15 points) - bonus if therapist has availability matching user's time preferences
   - **JSON Format**: `availability: string[]` with ISO timestamps in `data/therapists.json`

10. **service_radius_km** / **serviceRadiusKm**
    - **Type**: `number`
    - **Location**: `IndexedTherapist.service_radius_km`, `Therapist.serviceRadiusKm`, `TherapistNormalized.service_radius_km`
    - **Usage**: Used for home visit radius calculation (hard filter for distance)

11. **distance** (calculated)
    - **Type**: `number` (kilometers)
    - **Usage**: Soft scoring (0-15 points) - closer therapists score higher
    - **Calculation**: Haversine formula via `haversineKm()` in `lib/utils/geo.ts`

12. **profile_score** / **profileCompleteness**
    - **Type**: `number` (0-1 or percentage)
    - **Location**: `IndexedTherapist.profile_score`, `Therapist.profileCompleteness`
    - **Usage**: Soft scoring (0-5 points) - higher quality profiles score better

13. **rating** / **reviews_count**
    - **Type**: `TherapistRating` (average, count) or `number`
    - **Location**: `IndexedTherapist.reviews_count`, `Therapist.rating`, `TherapistNormalized.rating`
    - **Usage**: Soft scoring - verified therapists with good ratings score higher

---

## 3. All Possible Gender Values in Data

### Current Values in JSON Data Files

**Analysis of `data/therapists.json`:**
- **`"female"`**: 800 occurrences
- **`"male"`**: 700 occurrences

**Analysis of `data/therapists.synthetic.json`:**
- **`"female"`**: 6 occurrences
- **`"male"`**: 5 occurrences

### Supported Input Values (Before Normalization)

The normalization function `normalizeTherapistGender()` in `lib/utils/normalize.ts` handles the following input formats:

**Male values:**
- `"male"` (English)
- `"Male"` (capitalized)
- `"MALE"` (uppercase)
- `"m"` (single letter)
- `"M"` (single letter uppercase)
- `"muž"` (Czech with diacritics)
- `"muz"` (Czech without diacritics)

**Female values:**
- `"female"` (English)
- `"Female"` (capitalized)
- `"FEMALE"` (uppercase)
- `"f"` (single letter)
- `"F"` (single letter uppercase)
- `"žena"` (Czech with diacritics)
- `"zena"` (Czech without diacritics)

**Normalization Output:**
- All inputs are normalized to: `'male' | 'female'`
- Unrecognized values default to `'female'` with a console warning
- Missing/null/undefined values default to `'female'` with a console warning

### Actual Data Format

In the JSON files, gender is stored as:
```json
{
  "gender": "female",
  // or
  "gender": "male"
}
```

**No other values observed** in the actual data files. All gender values are already in the normalized English format (`"male"` or `"female"`).

---

## 4. Data Sources

### Static JSON Files

1. **`data/therapists.json`**
   - Primary therapist dataset (1500+ records)
   - Format: Array of `IndexedTherapist`-like objects
   - Contains: `gender`, `meeting_types`, `languages`, `specialties`, `age_groups`, `accepts_insurance`, `metadata.barrier_free`

2. **`data/therapists.synthetic.json`**
   - Synthetic/generated therapist data (11 records)
   - Format: Similar to `therapists.json`
   - Used for testing and development

3. **`data/therapists.normalized.json`**
   - Normalized therapist data (if exists)

4. **`data/therapists-fixtures.json`**
   - Fixture/test data

5. **`data/cz-therapist-fixtures.json`**
   - Czech-specific fixture data

6. **`data/fake-therapists-*.json`**
   - Multiple fake/test datasets:
     - `fake-therapists-complete.json`
     - `fake-therapists-fixed.json`
     - `fake-therapists-v1.json`
     - `therapists-fake-v1.json`

7. **`data/seeds/therapists_*.json`**
   - Seed data files:
     - `therapists_min_guardrails.json`
     - `therapists_minimal.json`

8. **`data/samples/therapist-*.json`**
   - Sample/example data:
     - `therapist-invalid.json`
     - `therapist-valid.json`

9. **`core/data/fixtures/therapists.json`**
   - Core fixture data

10. **`public/data/therapists.json`**
    - Public-facing therapist data

### TypeScript/JavaScript Data Files

11. **`src/data/therapists.ts`**
    - TypeScript module with therapist data/loader

12. **`lib/data/therapists.ts`**
    - Therapist data loader/utilities

13. **`lib/data/fixture-therapists.ts`**
    - Fixture therapist data

14. **`lib/data/fake-therapists.ts`**
    - Fake therapist data generator

15. **`lib/data/sample-therapists.ts`**
    - Sample therapist data

### API Routes

16. **`app/api/searchTherapists/route.ts`**
    - Main search API endpoint
    - Loads data from `data/therapists.json` and `data/therapists.synthetic.json`
    - Applies normalization via `normalizeTherapistData()`

17. **`app/api/therapists/route.ts`**
    - Therapist CRUD API endpoint

### Database/Seeds

18. **`lib/database/therapist-queries.ts`**
    - Database query functions (if database is used)

19. **`scripts/seed-therapists.ts`** (in archive)
    - Legacy seed script

---

## 5. Transformation/Normalization Functions

### Gender Normalization

**File**: `lib/utils/normalize.ts` (lines 52-73)

```typescript
export function normalizeTherapistGender(
  value: string | undefined | null, 
  therapistId?: string
): 'male' | 'female'
```

**Called in:**
- `app/api/searchTherapists/route.ts` - `normalizeTherapistData()` (line 432)
- `app/api/searchTherapists/route.ts` - `mapSyntheticToIndexed()` (line 147)
- `lib/utils/loaders.ts` - When loading fixtures/seeded data
- `src/data/therapists.ts` - When reading from public JSON
- `app/api/therapists/route.ts` - For all therapist endpoints

### Meeting Type Normalization

**File**: `app/api/searchTherapists/route.ts`

```typescript
function normalizeMeetingModes(modes: string[]): Array<'ordinace' | 'dojizdeni' | 'online'>
```

**Maps:**
- `'clinic'` → `'ordinace'`
- `'home_visit'` → `'dojizdeni'`
- `'online'` → `'online'`

### Location Normalization

**File**: `app/api/searchTherapists/route.ts` - `normalizeTherapistData()` (lines 441-494)

- Validates coordinates are within Czech Republic bounds
- Falls back to city centroid if coordinates missing
- Creates `locations` array with `barrier_free` flag

### Language Normalization

**File**: `app/api/searchTherapists/route.ts` - `mapLanguageCanonical()` (line 607)

Maps Czech language names to codes:
- `"cestina"` → `"cs"`
- `"anglictina"` → `"en"`
- `"nemcina"` → `"de"`
- etc.

### Complete Data Normalization

**File**: `app/api/searchTherapists/route.ts` - `normalizeTherapistData()` (lines 427-494)

Performs:
1. Gender normalization
2. Meeting type normalization
3. Location/coordinate validation and normalization
4. Creates normalized `IndexedTherapist` structure

---

## Summary

### Key Findings

1. **Gender Values**: Only `"male"` and `"female"` exist in actual data (normalized English format)
2. **Gender Type**: Strictly `'male' | 'female'` (no `'unspecified'` or other values)
3. **Normalization**: All gender inputs are normalized via `normalizeTherapistGender()` before matching
4. **Matching Fields**: 13 fields used for matching (5 hard filters, 8 soft scoring)
5. **Data Sources**: 19+ files containing therapist data (JSON, TS, API routes)
6. **Transformation**: Multiple normalization functions ensure consistent data format before matching

### Critical Matching Fields

**Hard Filters:**
- `gender` (when `strictGender === true`)
- `meeting_types`
- `location/coordinates` + `radiusKm`
- `age_groups` (for child/senior)
- `barrier_free` (when required)

**Soft Scoring:**
- `specialties/issues` (0-40 points - highest weight)
- `availability` (0-15 points)
- `distance` (0-15 points)
- `languages` (0-10 points)
- `age_groups` (0-5 points)
- `gender` (0-5 points - bonus if matches preference)
- `insurance` (0-5 points)
- `profile_score` (0-5 points)

