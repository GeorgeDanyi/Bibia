export type PracticeType = 'office' | 'home' | 'online'

// Therapist data model for Bibia platform

export interface TherapistAvailability {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  slots: string[]; // e.g., ["09:00-12:00", "13:00-17:00"]
}

export interface TherapistRating {
  average: number; // 1-5
  count: number;
}

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
  
  // Booking provider integration
  bookingProvider?: 'none' | 'zaptime' | 'reservanto';
  bookingUrl?: string;
  bookingMode?: 'redirect' | 'iframe';  // default "iframe"
}

// Search and filter interfaces
export interface TherapistSearchFilters {
  city?: string;
  regions?: string[];
  specialties?: string[];
  diagnoses?: string[];
  modalities?: string[];
  worksWith?: string[];
  maxPrice?: number;
  minRating?: number;
  languages?: string[];
  availability?: {
    day?: string;
    timeSlot?: string;
  };
}

export interface TherapistSearchResult {
  therapist: Therapist;
  matchScore: number;
  matchReasons: string[];
  distance?: number; // km from user location
}


// === Canonical enums and normalized Therapist schema (PART A) ===
export type MeetingMode = 'clinic' | 'home_visit' | 'online'

export type BodyRegion =
  | 'upper_limb'
  | 'lower_limb'
  | 'spine'
  | 'head_neck'
  | 'pelvis'
  | 'torso'
  | 'post_surgery'
  | 'postpartum'
  | 'pelvic_floor'
  | 'sports_specific'

export type BodyRegionTag =
  // upper_limb
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'hand'
  | 'fingers'
  | 'thumb'
  // lower_limb
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'foot'
  | 'toes'
  | 'achilles'
  // spine
  | 'cervical'
  | 'thoracic'
  | 'lumbar'
  | 'sacral'
  | 'sciatica'
  // head_neck
  | 'headache'
  | 'tmj'
  | 'dizziness'
  | 'whiplash'
  // pelvis
  | 'si_joint'
  | 'pelvic_instability'
  | 'groin'
  // torso
  | 'ribs'
  | 'diaphragm'
  | 'abdominal_wall'
  // post_surgery
  | 'tka'
  | 'tha'
  | 'acl'
  | 'meniscus'
  | 'rotator_cuff'
  | 'spine_fusion'
  // postpartum
  | 'diastasis'
  | 'c_section_recovery'
  | 'lactation_related'
  | 'return_to_sport_postpartum'
  // pelvic_floor
  | 'incontinence'
  | 'prolapse'
  | 'pain'
  | 'pregnancy'
  | 'postpartum_recovery'
  // sports_specific
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'strength_training'
  | 'team_sports'

export type DiagnosisCategory = 'chronic' | 'injury' | 'neuro' | 'onc_or_rare'

export type TimeBand =
  | 'morning'       // 6–9
  | 'late_morning'  // 9–12
  | 'afternoon'     // 12–16
  | 'evening'       // 16–20
  | 'weekend'
  | 'asap'

export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export type LanguageCode = 'cs' | 'en' | 'de' | 'ru' | 'uk' | 'sk'

export type InsurerPref = 'insurance_claim' | 'self_pay'

export type PatientGroup = 'adult' | 'child' | 'senior'

// Therapist gender is strictly 'male' | 'female' (no 'unspecified' allowed)
// Use normalizeTherapistGender() to normalize any input values
export type TherapistGender = 'male' | 'female'

export interface TherapistLocation {
  city: string
  lat: number
  lon: number
  barrier_free: boolean
}

export interface WeeklyAvailability {
  Mon?: TimeBand[]
  Tue?: TimeBand[]
  Wed?: TimeBand[]
  Thu?: TimeBand[]
  Fri?: TimeBand[]
  Sat?: TimeBand[]
  Sun?: TimeBand[]
}

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
