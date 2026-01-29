/**
 * Test fixtures for matching engine tests
 * 
 * Provides a comprehensive dataset of therapists covering:
 * - Both genders (male, female)
 * - Various meeting types (clinic, home_visit, online, combinations)
 * - Barrier-free and non-barrier-free therapists
 * - Different languages
 * - Various locations and service radii
 * - Different specialties and conditions
 */

import type { MatchingTherapist } from '@/lib/matching/types'

// Prague coordinates (50.0755, 14.4378)
const PRAGUE_COORDS = { lat: 50.0755, lon: 14.4378 }
// Brno coordinates (49.1951, 16.6068) - ~200km from Prague
const BRNO_COORDS = { lat: 49.1951, lon: 16.6068 }
// Ostrava coordinates (49.8209, 18.2625) - ~350km from Prague
const OSTRAVA_COORDS = { lat: 49.8209, lon: 18.2625 }
// Plzen coordinates (49.7384, 13.3736) - ~90km from Prague
const PLZEN_COORDS = { lat: 49.7384, lon: 13.3736 }
// Liberec coordinates (50.7663, 15.0543) - ~100km from Prague
const LIBEREC_COORDS = { lat: 50.7663, lon: 15.0543 }
// Olomouc coordinates (49.5938, 17.2509) - ~250km from Prague
const OLOMOUC_COORDS = { lat: 49.5938, lon: 17.2509 }

export const TEST_THERAPISTS: MatchingTherapist[] = [
  // 1. Female therapist, clinic + online, barrier-free, Prague, Czech only
  {
    id: 'therapist-1-female-clinic-barrier-free',
    fullName: 'MUDr. Jana Nováková',
    city: 'Praha',
    coordinates: PRAGUE_COORDS,
    meeting_types: ['clinic', 'online'],
    service_radius_km: null,
    barrier_free: true,
    age_groups: ['adult', 'senior'],
    accepting_new: true,
    active_profile: true,
    specialties: ['spine_pain', 'back_pain'],
    diagnosis_expertise: ['back_pain'],
    availability: ['2024-01-15T14:00:00Z'],
    next_available_slot: '2024-01-15T14:00:00Z',
    languages: ['cs'],
    accepts_insurance: true,
    gender: 'female',
    is_verified: true,
    profile_completeness: 0.95,
    review_count: 12,
    has_photos: true
  },

  // 2. Male therapist, clinic only, NOT barrier-free, Prague, Czech + English
  {
    id: 'therapist-2-male-clinic-only',
    fullName: 'Bc. Petr Svoboda',
    city: 'Praha',
    coordinates: PRAGUE_COORDS,
    meeting_types: ['clinic'],
    service_radius_km: null,
    barrier_free: false,
    age_groups: ['child', 'adult'],
    accepting_new: true,
    active_profile: true,
    specialties: ['sports_injury', 'rehabilitation'],
    diagnosis_expertise: ['sports_injury'],
    availability: ['2024-01-16T09:00:00Z'],
    next_available_slot: '2024-01-16T09:00:00Z',
    languages: ['cs', 'en'],
    accepts_insurance: true,
    gender: 'male',
    is_verified: false,
    profile_completeness: 0.70,
    review_count: 5,
    has_photos: false
  },

  // 3. Female therapist, online only, barrier-free, Brno, Czech + German
  {
    id: 'therapist-3-female-online-only',
    fullName: 'Mgr. Anna Kratochvílová',
    city: 'Brno',
    coordinates: BRNO_COORDS,
    meeting_types: ['online'],
    service_radius_km: null,
    barrier_free: true,
    age_groups: ['adult'],
    accepting_new: true,
    active_profile: true,
    specialties: ['neurological_rehab'],
    diagnosis_expertise: ['neurological_rehab'],
    availability: [],
    next_available_slot: null,
    languages: ['cs', 'de'],
    accepts_insurance: false,
    gender: 'female',
    is_verified: true,
    profile_completeness: 0.90,
    review_count: 15,
    has_photos: true
  },

  // 4. Male therapist, home_visit + clinic, NOT barrier-free, Plzen, Czech only, with service radius
  {
    id: 'therapist-4-male-home-visit',
    fullName: 'MUDr. Tomáš Dvořák',
    city: 'Plzeň',
    coordinates: PLZEN_COORDS,
    meeting_types: ['home_visit', 'clinic'],
    service_radius_km: 25,
    barrier_free: false,
    age_groups: ['adult'],
    accepting_new: true,
    active_profile: true,
    specialties: ['back_pain', 'joint_pain'],
    diagnosis_expertise: ['back_pain'],
    availability: ['2024-01-17T16:00:00Z'],
    next_available_slot: '2024-01-17T16:00:00Z',
    languages: ['cs'],
    accepts_insurance: true,
    gender: 'male',
    is_verified: true,
    profile_completeness: 0.85,
    review_count: 8,
    has_photos: true
  },

  // 5. Female therapist, clinic + online, barrier-free, Liberec, Czech + English + Slovak
  {
    id: 'therapist-5-female-multi-lang',
    fullName: 'MUDr. Marie Procházková',
    city: 'Liberec',
    coordinates: LIBEREC_COORDS,
    meeting_types: ['clinic', 'online'],
    service_radius_km: null,
    barrier_free: true,
    age_groups: ['adult', 'senior'],
    accepting_new: true,
    active_profile: true,
    specialties: ['spine_pain', 'pelvic_floor'],
    diagnosis_expertise: ['pelvic_floor'],
    availability: ['2024-01-18T10:00:00Z'],
    next_available_slot: '2024-01-18T10:00:00Z',
    languages: ['cs', 'en', 'sk'],
    accepts_insurance: true,
    gender: 'female',
    is_verified: true,
    profile_completeness: 0.88,
    review_count: 20,
    has_photos: true
  },

  // 6. Male therapist, clinic only, barrier-free, Olomouc, Czech only
  {
    id: 'therapist-6-male-barrier-free',
    fullName: 'Bc. Jan Novotný',
    city: 'Olomouc',
    coordinates: OLOMOUC_COORDS,
    meeting_types: ['clinic'],
    service_radius_km: null,
    barrier_free: true,
    age_groups: ['child', 'adult'],
    accepting_new: true,
    active_profile: true,
    specialties: ['sports_injury', 'rehabilitation'],
    diagnosis_expertise: [],
    availability: [],
    next_available_slot: null,
    languages: ['cs'],
    accepts_insurance: true,
    gender: 'male',
    is_verified: false,
    profile_completeness: 0.75,
    review_count: 3,
    has_photos: false
  },

  // 7. Female therapist, home_visit only, NOT barrier-free, Prague, Czech only, with service radius
  {
    id: 'therapist-7-female-home-visit-only',
    fullName: 'Mgr. Eva Svobodová',
    city: 'Praha',
    coordinates: PRAGUE_COORDS,
    meeting_types: ['home_visit'],
    service_radius_km: 30,
    barrier_free: false,
    age_groups: ['adult'],
    accepting_new: true,
    active_profile: true,
    specialties: ['back_pain'],
    diagnosis_expertise: [],
    availability: ['2024-01-19T14:00:00Z'],
    next_available_slot: '2024-01-19T14:00:00Z',
    languages: ['cs'],
    accepts_insurance: false,
    gender: 'female',
    is_verified: false,
    profile_completeness: 0.65,
    review_count: 2,
    has_photos: false
  },

  // 8. Male therapist, NOT accepting new clients (should be filtered out)
  {
    id: 'therapist-8-male-not-accepting',
    fullName: 'MUDr. Pavel Horák',
    city: 'Praha',
    coordinates: PRAGUE_COORDS,
    meeting_types: ['clinic'],
    service_radius_km: null,
    barrier_free: true,
    age_groups: ['adult'],
    accepting_new: false, // NOT accepting new clients
    active_profile: true,
    specialties: ['back_pain'],
    diagnosis_expertise: [],
    availability: [],
    next_available_slot: null,
    languages: ['cs'],
    accepts_insurance: true,
    gender: 'male',
    is_verified: true,
    profile_completeness: 0.80,
    review_count: 10,
    has_photos: true
  }
]


