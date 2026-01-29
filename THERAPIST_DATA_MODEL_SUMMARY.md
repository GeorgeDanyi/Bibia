# Therapist Data Model Summary

## Files Defining Therapist Types

### 1. **Primary Matching Type** (Used by Matching Engine)
**File**: `lib/matching/types.ts`

This is the **main type used by the matching engine** for scoring and filtering therapists.

### 2. **Normalized Type** (Canonical Schema)
**File**: `lib/types/therapist.ts`

Contains `TherapistNormalized` interface - the canonical normalized format.

### 3. **Validation Schema** (Zod Schema)
**File**: `lib/types/therapist-schema.ts`

Zod schema for validation with strict typing.

### 4. **Extended Type** (Legacy/Extended Fields)
**File**: `lib/types/therapist-extended.ts`

Extended interface with additional fields for backward compatibility.

### 5. **Data Files** (JSON Records)
- `data/therapists.json` - Main therapist dataset
- `data/therapists.normalized.json` - Normalized version
- `data/therapists.synthetic.json` - Synthetic data
- `data/therapists-fixtures.json` - Test fixtures
- `public/data/therapists.json` - Public dataset

## Main Therapist Type (Matching Engine)

**File**: `lib/matching/types.ts`

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

## Normalized Therapist Type

**File**: `lib/types/therapist.ts`

```typescript
export interface TherapistNormalized {
  id: string
  full_name: string
  gender: TherapistGender  // 'male' | 'female' | 'unspecified'
  accepting_new: boolean

  meeting_modes: MeetingMode[]  // 'clinic' | 'home_visit' | 'online'
  base_city: string
  locations: TherapistLocation[]  // Array with city, lat, lon, barrier_free
  service_radius_km?: number
  service_areas?: string[]

  languages: LanguageCode[]  // 'cs' | 'en' | 'de' | 'ru' | 'uk' | 'sk'
  insurers: string[]
  specialties: (BodyRegion | BodyRegionTag)[]
  diagnosis_expertise: string[]
  patient_groups: PatientGroup[]  // 'adult' | 'child' | 'senior'

  weekly_availability: WeeklyAvailability
  price_info?: { range_czk?: { min: number; max: number }; fixed_czk?: number; note?: string }
  rating?: TherapistRating
  next_available_in_days?: number | null
}

export interface TherapistLocation {
  city: string
  lat: number
  lon: number
  barrier_free: boolean
}
```

## JSON Data Structure (Actual Data Format)

**File**: `data/therapists.json`

Based on actual records, the JSON structure is:

```json
{
  "id": "therapist_0001",
  "name": "MUDr. Jana 1",
  "gender": "female",  // or "male"
  "city": "Praha",
  "lat": 50.05047905394062,
  "lng": 14.397387243148126,
  "meeting_types": ["ordinace", "dojizdeni"],  // or ["online"]
  "service_radius_km": 15,
  "languages": ["cestina", "anglictina"],
  "specialties": [
    "general_physiotherapy",
    "shoulder",
    "knee",
    "spine_pain",
    "womens_health"
  ],
  "age_groups": ["child", "adult", "senior"],
  "accepts_insurance": true,
  "availability": ["2025-10-18T09:14:00.000Z", ...],
  "profile_score": 0.65,
  "reviews_count": 291,
  "verified": true,
  "bio": "Zkušený fyzioterapeut...",
  "created_at": "2025-10-01T08:48:26.551Z",
  "metadata": {
    "has_photos": true,
    "education": "PhD",
    "barrier_free": false
  },
  "next_available": "2025-10-18T09:14:00.000Z"
}
```

## Field-by-Field Analysis

### Gender
- **Type**: `'male' | 'female'` (in matching types)
- **Type (Normalized)**: `'male' | 'female' | 'unspecified'`
- **JSON Format**: `"male"` or `"female"` (string)
- **Location in JSON**: Top-level `gender` field
- **Critical for Matching**: ✅ **YES** - Used in hard filters when `strictGender === true`

### Location / City / Coordinates
- **Fields**:
  - `city: string` - City name (e.g., "Praha")
  - `latitude: number` - Geographic latitude
  - `longitude: number` - Geographic longitude
- **JSON Format**: `city`, `lat`, `lng` (top-level)
- **Critical for Matching**: ✅ **YES** - Required for distance calculation and radius filtering

### Meeting Type (Practice Type)
- **Type (Matching)**: `('ordinace' | 'dojíždění' | 'online')[]`
- **Type (Normalized)**: `MeetingMode[]` where `MeetingMode = 'clinic' | 'home_visit' | 'online'`
- **JSON Format**: `meeting_types: string[]` with values `"ordinace"`, `"dojizdeni"`, or `"online"`
- **Additional Field**: `service_radius_km: number` (for home visits)
- **Critical for Matching**: ✅ **YES** - Hard filter (must match user's selected meeting type)

### Age Groups
- **Type**: `('child' | 'adult' | 'senior')[]`
- **JSON Format**: `age_groups: string[]` with values `"child"`, `"adult"`, `"senior"`
- **Critical for Matching**: ✅ **YES** - Hard filter (must support requested age group)

### Barrier-Free (Accessibility)
- **Type (Matching)**: `barrier_free: boolean`
- **Type (Normalized)**: `barrier_free: boolean` in `TherapistLocation`
- **JSON Format**: `metadata.barrier_free: boolean`
- **Critical for Matching**: ✅ **YES** - Hard filter when user requires barrier-free access

### Languages
- **Type (Matching)**: `languages: string[]`
- **Type (Normalized)**: `LanguageCode[]` where `LanguageCode = 'cs' | 'en' | 'de' | 'ru' | 'uk' | 'sk'`
- **JSON Format**: `languages: string[]` with values like `"cestina"`, `"anglictina"`, `"nemcina"`
- **Critical for Matching**: ⚠️ **SOFT** - Used in scoring, not hard filtering

### Insurance
- **Type (Matching)**: `acceptsInsurance: boolean`
- **Type (Normalized)**: `insurers: string[]` (array of insurance company codes)
- **JSON Format**: `accepts_insurance: boolean`
- **Additional (Schema)**: `insuranceAccepted?: string[]` (array of insurance company codes like "VZP", "OZP")
- **Critical for Matching**: ⚠️ **SOFT** - Used in scoring, not hard filtering

### Specializations / Body Regions
- **Fields**:
  - `issues: string[]` - Body region tags (e.g., "shoulder", "knee", "spine_pain")
  - `diagnoses: { canonicalIds: string[], synonyms: string[], categories: string[] }` - Diagnosis expertise
  - `specialties: string[]` - General specialty tags
- **JSON Format**: 
  - `specialties: string[]` - Array of specialty strings
  - Examples: `"shoulder"`, `"knee"`, `"spine_pain"`, `"womens_health"`, `"postpartum"`, `"geriatrics"`
- **Body Region Types** (from `lib/types/therapist.ts`):
  - `BodyRegion`: `'upper_limb' | 'lower_limb' | 'spine' | 'head_neck' | 'pelvis' | 'torso' | 'post_surgery' | 'postpartum' | 'pelvic_floor' | 'sports_specific'`
  - `BodyRegionTag`: Detailed tags like `'shoulder'`, `'elbow'`, `'knee'`, `'cervical'`, `'lumbar'`, etc.
- **Critical for Matching**: ✅ **YES** - Primary matching criteria (diagnosis matching is highest scoring component: 0-40 points)

## Critical Fields for Matching

### Hard Filters (Must Pass)
1. **Meeting Type** - Therapist must support user's selected meeting type
2. **Location/Radius** - For in-person meetings, must be within radius (or have service radius for home visits)
3. **Age Group** - Must support requested age group (child/adult/senior)
4. **Barrier-Free** - If required, must have `barrier_free: true`
5. **Gender** - If `strictGender === true` and `genderPreference !== 'any'`, must match exactly

### Soft Scoring (Influences Ranking)
1. **Diagnosis Match** (0-40 points) - Highest weight
2. **Availability Fit** (0-15 points)
3. **Distance** (0-15 points)
4. **Language Match** (0-10 points)
5. **Age Specialization** (0-5 points)
6. **Gender Preference** (0-5 points) - Bonus if matches preference
7. **Insurance Preference** (0-5 points)
8. **Profile Quality** (0-5 points)

## Gender Values in Data

### Current Values
- **`"male"`** - Male therapist
- **`"female"`** - Female therapist

### Type Definitions
- **Matching Engine** (`lib/matching/types.ts`): `gender: 'male' | 'female'` (strict binary)
- **Normalized Type** (`lib/types/therapist.ts`): `TherapistGender = 'male' | 'female' | 'unspecified'` (allows unspecified)
- **JSON Data**: Only `"male"` or `"female"` observed in actual data

### Usage in Matching
- When `strictGender === true` AND `genderPreference !== 'any'`: **Hard filter** - therapist gender must match exactly
- When `strictGender === false` OR `genderPreference === 'any'`: **Soft scoring** - gender match adds 0-5 points to score

## Key Files Reference

| File | Purpose | Type/Interface |
|------|---------|----------------|
| `lib/matching/types.ts` | **Primary matching type** | `Therapist` (used by matching engine) |
| `lib/types/therapist.ts` | Normalized canonical type | `TherapistNormalized` |
| `lib/types/therapist-schema.ts` | Zod validation schema | `Therapist` (inferred from schema) |
| `lib/types/therapist-extended.ts` | Extended/legacy fields | `TherapistExtended` |
| `data/therapists.json` | Actual therapist records | JSON format (see structure above) |
| `app/api/searchTherapists/route.ts` | API endpoint using types | `IndexedTherapist` (internal index format) |

## Summary

The **primary therapist type used by the matching engine** is defined in `lib/matching/types.ts`. The actual JSON data in `data/therapists.json` uses a slightly different structure but gets normalized to this format during processing.

**Gender** is currently a strict binary (`'male' | 'female'`) in the matching engine, though the normalized type allows `'unspecified'`. All observed data contains only `"male"` or `"female"` values.

**Critical matching fields** include: meeting type, location/radius, age groups, barrier-free (when required), and gender (when strict filtering is enabled). Specializations (diagnoses/issues) are the highest-weighted scoring component.

