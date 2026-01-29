# Type Layer Refactoring Summary - Step 4

## Overview

This document summarizes the canonical types introduced in Step 4 to stabilize the type layer around questionnaire answers and therapists, without changing matching engine behavior.

## Canonical Types

### 1. Answers (User-Facing)

**Location**: `lib/types/answers.ts`

```typescript
export interface Answers {
  city: string
  radiusKm: number
  meetingType: 'clinic' | 'home' | 'online' | 'any'
  problemArea: string
  problemDetail?: string
  ageGroup: 'child' | 'adult' | 'senior'
  genderPreference: 'male' | 'female' | 'any'
  strictGender: boolean
  barrierFree: boolean
  languages: string[]
  insuranceMode: 'insurance' | 'self-pay'
  timesOfDay: string[]
  weekdays: string[]
}
```

**Purpose**: User-facing questionnaire answers. This is what the UI collects and stores.

### 2. MatchingInputs (Matching Engine Input)

**Location**: `lib/matching/types.ts`

```typescript
export interface MatchingInputs {
  // Location and meeting type
  location: {
    city: string | null
    coords: { lat: number; lon: number } | null
  }
  radiusKm: number | null
  
  // Meeting type: canonical English values used internally by matching engine
  meetingType: 'clinic' | 'home_visit' | 'online' | 'any'
  
  // Issues and diagnosis
  issues: string[] // Normalized body region/tags
  diagnosis: {
    canonicalId?: string
    synonyms?: string[]
    category?: string
  }
  diagnosisRarity?: 'specialized' | 'common' | 'none'
  
  // Time preferences
  timePreference: 'asap' | 'flexible' | 'specific' | 'unknown'
  timeFit?: 'ASAP' | 'weekday' | 'evening' | 'weekend' // Legacy field
  
  // Language and insurance
  languages: string[] // Normalized language codes (e.g., ['cs', 'en'])
  wantsInsurance: boolean
  
  // Demographics and preferences
  ageGroup: 'child' | 'adult' | 'senior'
  genderPreference: 'male' | 'female' | 'any'
  strictGender: boolean
  barrierFree: boolean
  
  // Optional fields
  profileCompleteness?: number
  verification?: boolean
  nextAvailableSlot?: string
  geoDistance?: number
}
```

**Purpose**: Single source of truth for matching engine input. All questionnaire answers and search inputs are normalized into this type.

**Key Features**:
- Uses canonical English values for meeting types ('clinic', 'home_visit', 'online')
- All fields are strongly typed
- Well-documented with JSDoc comments

### 3. MatchingTherapist (Matching Engine Therapist Type)

**Location**: `lib/matching/types.ts`

```typescript
export interface MatchingTherapist {
  id: string
  fullName: string
  city: string
  
  // Coordinates (required for in-person matching)
  coordinates: {
    lat: number
    lon: number
  } | null
  
  // Meeting types: canonical English values
  meeting_types: Array<'clinic' | 'home_visit' | 'online'>
  service_radius_km: number | null
  
  // Accessibility
  barrier_free: boolean
  
  // Age groups supported
  age_groups: Array<'child' | 'adult' | 'senior'>
  
  // Status
  accepting_new: boolean
  active_profile: boolean
  
  // Specializations
  specialties: string[] // Normalized specialty/condition tags
  diagnosis_expertise: string[] // Normalized diagnosis IDs
  
  // Availability
  availability: string[] // ISO date strings
  next_available_slot: string | null
  
  // Language and insurance
  languages: string[] // Normalized language codes
  accepts_insurance: boolean
  
  // Demographics
  gender: 'male' | 'female' // Strictly typed, must be normalized
  
  // Profile quality
  is_verified: boolean
  profile_completeness: number // 0-1 score
  review_count: number
  has_photos: boolean
}
```

**Purpose**: Single source of truth for therapist data used by the matching engine. All therapist data sources (IndexedTherapist, TherapistNormalized, etc.) are normalized into this type.

**Key Features**:
- Uses canonical English values for meeting types
- Gender is strictly 'male' | 'female' (no 'unspecified')
- All fields are normalized and typed
- Coordinates are explicitly nullable

## Data Flow

```
QuestionnaireCanonicalAnswers (legacy)
    ↓ migrateToAnswers()
Answers (user-facing)
    ↓ normalizeAnswersToMatchingInputs()
MatchingInputs (canonical matching input)
    ↓ matching engine uses
MatchingTherapist (canonical therapist type)
```

### Normalization Functions

1. **`migrateToAnswers()`** (`lib/types/answers.ts`)
   - Converts legacy `QuestionnaireCanonicalAnswers` to `Answers`
   - Handles field name mapping and value normalization

2. **`normalizeAnswersToMatchingInputs()`** (`lib/matching/normalization.ts`)
   - Converts `Answers` to `MatchingInputs`
   - Maps meeting types from UI values ('clinic', 'home', 'online') to canonical values ('clinic', 'home_visit', 'online')
   - Normalizes languages, time preferences, etc.

3. **`convertIndexedTherapistToMatchingTherapist()`** (`lib/matching/normalization.ts`)
   - Converts `IndexedTherapist` (from API/database) to `MatchingTherapist`
   - Normalizes meeting types from Czech ('ordinace', 'dojizdeni') to English ('clinic', 'home_visit')
   - Normalizes languages, coordinates, etc.

## Type Consistency

### Meeting Types
- **UI/Answers**: 'clinic' | 'home' | 'online' | 'any'
- **MatchingInputs**: 'clinic' | 'home_visit' | 'online' | 'any'
- **MatchingTherapist**: Array<'clinic' | 'home_visit' | 'online'>
- **IndexedTherapist** (legacy): Array<'ordinace' | 'dojizdeni' | 'online'>

### Gender
- **All types**: 'male' | 'female' | 'any' (for preferences) or 'male' | 'female' (for therapists)
- **Strict typing**: Therapist gender is always 'male' | 'female' (normalized at data load time)

### Languages
- **All types**: string[] of normalized language codes (e.g., ['cs', 'en', 'de'])
- **Normalization**: Czech names ('čeština', 'angličtina') → codes ('cs', 'en')

### Age Groups
- **All types**: 'child' | 'adult' | 'senior'
- **Consistent across all layers**

## Backward Compatibility

- Legacy `SearchInputs` type is kept for backward compatibility
- Legacy `Therapist` type is kept for backward compatibility
- `normalizeAnswersToSearchInputs()` still exists and internally uses `normalizeAnswersToMatchingInputs()`
- All existing code continues to work without changes

## Next Steps

1. Gradually migrate matching engine code to use `MatchingInputs` and `MatchingTherapist` directly
2. Remove legacy types once migration is complete
3. Update matching engine to use canonical types throughout


