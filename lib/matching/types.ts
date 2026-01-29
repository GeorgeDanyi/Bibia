// Types for the new matching system per PART C specifications

/**
 * Canonical type for matching engine input
 * 
 * This is the single source of truth for what the matching engine receives.
 * All questionnaire answers and search inputs are normalized into this type.
 * 
 * Data flow:
 * QuestionnaireCanonicalAnswers → Answers → MatchingInputs → MatchingTherapist
 */
export interface MatchingInputs {
  // Location and meeting type
  location: {
    city: string | null
    coords: { lat: number; lon: number } | null
  }
  radiusKm: number | null // Search radius in kilometers (null means no radius limit)
  
  // Meeting type: canonical English values used internally by matching engine
  // 'any' means user accepts any meeting type
  meetingType: 'clinic' | 'home_visit' | 'online' | 'any'
  
  // Issues and diagnosis
  issues: string[] // Normalized body region/tags (e.g., 'spine_pain', 'back_pain')
  diagnosis: {
    canonicalId?: string // Canonical diagnosis ID (e.g., 'ankylosing_spondylitis')
    synonyms?: string[] // Alternative terms for the diagnosis
    category?: string // Diagnosis category (e.g., 'spine_pain')
  }
  diagnosisRarity?: 'specialized' | 'common' | 'none' // Rarity classification for matching priority
  
  // Time preferences
  timePreference: 'asap' | 'flexible' | 'specific' | 'unknown'
  timeFit?: 'ASAP' | 'weekday' | 'evening' | 'weekend' // Legacy field, kept for backward compatibility
  
  // Language and insurance
  languages: string[] // Normalized language codes (e.g., ['cs', 'en'])
  wantsInsurance: boolean // true if user wants insurance coverage
  
  // Demographics and preferences
  ageGroup: 'child' | 'adult' | 'senior'
  genderPreference: 'male' | 'female' | 'any'
  strictGender: boolean // When true, strictly filter by genderPreference (exclude non-matching genders)
  barrierFree: boolean // true if user requires barrier-free access
  
  // Optional fields for advanced matching
  profileCompleteness?: number // 0-1 score for profile completeness
  verification?: boolean // Whether to prefer verified therapists
  nextAvailableSlot?: string // ISO date string for preferred next available slot
  geoDistance?: number // Pre-calculated distance (km)
  
  // Legacy fields (kept for backward compatibility)
  language?: string // Single language preference (deprecated, use languages[])
  meetingModes?: Array<'clinic' | 'home_visit' | 'online'> // Plural meeting modes (deprecated)
  therapistGenderPref?: 'male' | 'female' | 'any' // Legacy field (use genderPreference)
}

/**
 * Legacy SearchInputs type (deprecated - use MatchingInputs instead)
 * Kept for backward compatibility during migration
 */
export interface SearchInputs {
  // Location and meeting type
  location: {
    city?: string
    coords?: { lat: number; lon: number }
  }
  // Default 20 if not provided
  radiusKm?: number
  meetingType: 'ordinace' | 'dojíždění' | 'online'
  // Optional plural visit modes for advanced matching; if provided, overrides meetingType in filters
  meetingModes?: Array<'clinic' | 'home_visit' | 'online'>
  
  // Issues and diagnosis
  issues: string[] // body region/tags
  diagnosis: {
    canonicalId?: string
    synonyms?: string[]
    category?: string
  }
  // Tiny rarity classifier for diagnosis
  diagnosisRarity?: 'specialized' | 'common' | 'none'
  
  // Time preferences
  timeFit: 'ASAP' | 'weekday' | 'evening' | 'weekend'
  
  // Language and insurance
  language?: string // single language, may be null
  // Preferred languages ordered by priority (cs first if present)
  languages?: string[]
  wantsInsurance: boolean
  
  // Demographics and preferences
  ageGroup: 'child' | 'adult' | 'senior'
  therapistGenderPref: 'male' | 'female' | 'any'
  strictGender?: boolean // When true, strictly filter by genderPreference (exclude non-matching genders)
  barrierFree: boolean
  
  // Optional fields
  profileCompleteness?: number
  verification?: boolean
  nextAvailableSlot?: string
  geoDistance?: number
}

export interface TherapistMatch {
  therapist: MatchingTherapist | Therapist // Supports both canonical and legacy types
  match_score: number // 0-100, primary UI score (aligned with matchPercent)
  /**
   * Human-readable Czech reasons explaining the match.
   *
   * - For cards, we typically show the first 2–3 as a compact line.
   * - For detail pages, we may show more expanded variants derived from rawReasons.
   */
  reasons: string[]
  /**
   * Optional canonical explainability payload from the matching engine.
   * Kept so that detail views can render richer text without re-calling the API.
   *
   * This mirrors MatchResult.reasons[] shape loosely:
   * { code, labelCs, detailCs, label, weight, ... } or simple strings for legacy data.
   */
  rawReasons?: any[]
  /**
   * Canonical calibrated percentage from the engine (0–100).
   * Used for badges; kept separate from match_score only for debugging/clarity.
   */
  matchPercent?: number
  next_available?: string // date/time
  distance_km: number
  supports_insurance: boolean
  meeting_types: string[]
  languages: string[]
  age_supported: string[]
}

/**
 * Canonical therapist type for matching engine
 * 
 * This is the single source of truth for therapist data used by the matching engine.
 * All therapist data sources (IndexedTherapist, TherapistNormalized, etc.) are normalized into this type.
 * 
 * All fields are normalized to canonical English values:
 * - meeting_types: 'clinic' | 'home_visit' | 'online' (not 'ordinace', 'dojíždění')
 * - gender: 'male' | 'female' (strictly typed, no 'unspecified')
 * - languages: normalized language codes (e.g., 'cs', 'en', 'de')
 * - age_groups: 'child' | 'adult' | 'senior'
 */
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
  service_radius_km: number | null // Service radius for home visits (km)
  
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
  availability: string[] // ISO date strings for available slots
  next_available_slot: string | null // ISO date string for next available slot
  
  // Language and insurance
  languages: string[] // Normalized language codes (e.g., ['cs', 'en'])
  accepts_insurance: boolean
  
  // Demographics
  gender: 'male' | 'female' // Strictly typed, must be normalized
  
  // Profile quality
  is_verified: boolean
  profile_completeness: number // 0-1 score
  review_count: number
  has_photos: boolean
}

/**
 * Legacy Therapist type (deprecated - use MatchingTherapist instead)
 * Kept for backward compatibility during migration
 */
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

export interface MatchingCriteria {
  // Hard filters (must pass)
  meetingTypeMatch: boolean
  barrierFreeMatch: boolean
  ageCapabilityMatch: boolean
  therapistStatusMatch: boolean
  
  // Scoring components
  diagnosisMatch: number // 0-40
  availabilityFit: number // 0-15
  distance: number // 0-15
  languageMatch: number // 0-10
  ageSpecialization: number // 0-5
  genderPreference: number // 0-5
  insurancePreference: number // 0-5
  profileQuality: number // 0-5
}

export interface SearchResult {
  matches: TherapistMatch[]
  totalCount: number
  fallbackUsed: boolean
  fallbackLevel?: string
  searchMetadata: {
    searchTime: number
    filtersApplied: string[]
    sortMethod: string
  }
}
