/**
 * Type-safe helper functions for matching therapists
 * These functions are independent and can be used standalone
 */

import { type TherapistGender, type PatientGroup, type MeetingMode } from '@/lib/types/therapist'
import { haversineKm } from './geo'
import { CityService } from '@/lib/services/CityService'

// ============================================================================
// Type Definitions
// ============================================================================

export type GenderPreference = 'male' | 'female' | 'any'

export type AgeGroup = 'child' | 'adult' | 'senior'

export type MeetingTypeInput = 
  | 'clinic' 
  | 'home_visit' 
  | 'online'
  | 'ordinace'        // Czech alias
  | 'dojíždění'       // Czech alias
  | 'dojizdeni'       // Czech alias (no diacritics)

export interface Coordinates {
  lat: number
  lon: number
}

export interface TherapistLocation {
  lat: number | string | null | undefined
  lng: number | string | null | undefined
  city?: string | null
}

export interface RadiusCheckParams {
  userCoords: Coordinates
  therapistLocation: TherapistLocation
  radiusKm: number
  meetingType: MeetingTypeInput
  serviceRadiusKm?: number | null
}

// ============================================================================
// Helper: Normalize Meeting Type
// ============================================================================

/**
 * Normalize meeting type input to canonical form
 */
function normalizeMeetingType(input: MeetingTypeInput): 'clinic' | 'home_visit' | 'online' {
  const normalized = String(input).toLowerCase().trim()
  
  if (normalized === 'ordinace' || normalized === 'clinic') return 'clinic'
  if (normalized === 'dojíždění' || normalized === 'dojizdeni' || normalized === 'home_visit') return 'home_visit'
  if (normalized === 'online') return 'online'
  
  // Default to clinic if unrecognized
  return 'clinic'
}

/**
 * Normalize therapist meeting types to canonical forms
 */
function normalizeTherapistMeetingTypes(
  meetingTypes: string[] | null | undefined
): MeetingMode[] {
  if (!Array.isArray(meetingTypes)) return []
  
  return meetingTypes
    .map(type => {
      const t = String(type).toLowerCase().trim()
      if (t === 'ordinace') return 'clinic'
      if (t === 'dojíždění' || t === 'dojizdeni') return 'home_visit'
      if (t === 'online') return 'online'
      if (t === 'clinic') return 'clinic'
      if (t === 'home_visit') return 'home_visit'
      return null
    })
    .filter((type): type is MeetingMode => type !== null)
}

// ============================================================================
// matchesGender()
// ============================================================================

/**
 * Check if therapist gender matches the user's gender preference
 * 
 * @param therapistGender - Therapist's gender ('male' | 'female')
 * @param userPreference - User's gender preference ('male' | 'female' | 'any')
 * @returns true if therapist matches the preference, false otherwise
 * 
 * @example
 * matchesGender('female', 'female') // true
 * matchesGender('male', 'female')   // false
 * matchesGender('female', 'any')    // true (any matches all)
 */
export function matchesGender(
  therapistGender: TherapistGender,
  userPreference: GenderPreference
): boolean {
  // Therapist gender is strictly 'male' | 'female' (normalized at data load time)
  // If user has no preference, all therapists match
  if (userPreference === 'any') {
    return true
  }
  
  // Exact match required
  return therapistGender === userPreference
}

// ============================================================================
// matchesAgeGroup()
// ============================================================================

/**
 * Check if therapist supports the requested age group
 * 
 * @param therapistAgeGroups - Array of age groups the therapist supports
 * @param requestedAgeGroup - Age group requested by user
 * @returns true if therapist supports the age group, false otherwise
 * 
 * @example
 * matchesAgeGroup(['adult', 'senior'], 'senior')  // true
 * matchesAgeGroup(['adult'], 'child')            // false
 * matchesAgeGroup(['adult', 'senior'], 'adult')  // true (adult is always supported)
 */
export function matchesAgeGroup(
  therapistAgeGroups: PatientGroup[] | null | undefined,
  requestedAgeGroup: AgeGroup
): boolean {
  // Adult is always supported (no explicit check needed)
  if (requestedAgeGroup === 'adult') {
    return true
  }
  
  // For child/senior, explicit support is required
  if (!Array.isArray(therapistAgeGroups) || therapistAgeGroups.length === 0) {
    return false
  }
  
  return therapistAgeGroups.includes(requestedAgeGroup)
}

// ============================================================================
// matchesMeetingType()
// ============================================================================

/**
 * Check if therapist offers the requested meeting type
 * 
 * @param therapistMeetingTypes - Array of meeting types the therapist offers
 * @param requestedMeetingType - Meeting type requested by user
 * @returns true if therapist offers the meeting type, false otherwise
 * 
 * @example
 * matchesMeetingType(['clinic', 'online'], 'clinic')        // true
 * matchesMeetingType(['online'], 'clinic')                  // false
 * matchesMeetingType(['clinic', 'home_visit'], 'ordinace') // true (normalized)
 */
export function matchesMeetingType(
  therapistMeetingTypes: string[] | null | undefined,
  requestedMeetingType: MeetingTypeInput
): boolean {
  const normalizedTherapistTypes = normalizeTherapistMeetingTypes(therapistMeetingTypes)
  const normalizedRequested = normalizeMeetingType(requestedMeetingType)
  
  return normalizedTherapistTypes.includes(normalizedRequested)
}

// ============================================================================
// isInRadius()
// ============================================================================

/**
 * Convert coordinate value to number, handling strings and null/undefined
 */
function toCoordinate(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.')
    const num = parseFloat(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns null if coordinates cannot be determined
 */
async function calculateDistance(
  userCoords: Coordinates,
  therapistLocation: TherapistLocation
): Promise<number | null> {
  const lat = toCoordinate(therapistLocation.lat)
  const lng = toCoordinate(therapistLocation.lng)
  
  // Use direct coordinates if available
  if (lat !== null && lng !== null) {
    return haversineKm(
      { lat: userCoords.lat, lon: userCoords.lon },
      { lat, lon: lng }
    )
  }
  
  // Fallback to city resolution if coordinates are missing
  if (therapistLocation.city) {
    try {
      const resolved = CityService.resolve(therapistLocation.city)
      if (resolved && Number.isFinite(resolved.lat) && Number.isFinite(resolved.lng)) {
        return haversineKm(
          { lat: userCoords.lat, lon: userCoords.lon },
          { lat: resolved.lat, lon: resolved.lng }
        )
      }
    } catch {
      // City resolution failed
    }
  }
  
  return null
}

/**
 * Check if therapist is within the requested radius
 * 
 * @param params - Parameters for radius check
 * @returns Object with `inRadius` boolean and `distanceKm` (null if cannot be calculated)
 * 
 * @example
 * const result = await isInRadius({
 *   userCoords: { lat: 50.0755, lon: 14.4378 },
 *   therapistLocation: { lat: 50.0800, lon: 14.4400, city: 'Praha' },
 *   radiusKm: 10,
 *   meetingType: 'clinic'
 * })
 * // { inRadius: true, distanceKm: 0.5 }
 */
export async function isInRadius(
  params: RadiusCheckParams
): Promise<{ inRadius: boolean; distanceKm: number | null }> {
  const {
    userCoords,
    therapistLocation,
    radiusKm,
    meetingType,
    serviceRadiusKm
  } = params
  
  // Online meetings don't require radius check
  const normalizedType = normalizeMeetingType(meetingType)
  if (normalizedType === 'online') {
    return { inRadius: true, distanceKm: null }
  }
  
  // Calculate distance
  const distanceKm = await calculateDistance(userCoords, therapistLocation)
  
  // If distance cannot be calculated, cannot determine if in radius
  if (distanceKm === null) {
    return { inRadius: false, distanceKm: null }
  }
  
  // For home visits, use service radius if provided
  if (normalizedType === 'home_visit' && serviceRadiusKm !== null && serviceRadiusKm !== undefined) {
    const effectiveRadius = typeof serviceRadiusKm === 'number' ? serviceRadiusKm : 50 // default 50km
    return {
      inRadius: distanceKm <= effectiveRadius,
      distanceKm
    }
  }
  
  // For clinic, use requested radius
  return {
    inRadius: distanceKm <= radiusKm,
    distanceKm
  }
}

/**
 * Synchronous version of isInRadius (uses direct coordinates only, no city resolution)
 * Use this when you're certain coordinates are available
 */
export function isInRadiusSync(
  params: RadiusCheckParams
): { inRadius: boolean; distanceKm: number | null } {
  const {
    userCoords,
    therapistLocation,
    radiusKm,
    meetingType,
    serviceRadiusKm
  } = params
  
  // Online meetings don't require radius check
  const normalizedType = normalizeMeetingType(meetingType)
  if (normalizedType === 'online') {
    return { inRadius: true, distanceKm: null }
  }
  
  const lat = toCoordinate(therapistLocation.lat)
  const lng = toCoordinate(therapistLocation.lng)
  
  // If coordinates are not available, cannot determine
  if (lat === null || lng === null) {
    return { inRadius: false, distanceKm: null }
  }
  
  // Calculate distance
  const distanceKm = haversineKm(
    { lat: userCoords.lat, lon: userCoords.lon },
    { lat, lon: lng }
  )
  
  // For home visits, use service radius if provided
  if (normalizedType === 'home_visit' && serviceRadiusKm !== null && serviceRadiusKm !== undefined) {
    const effectiveRadius = typeof serviceRadiusKm === 'number' ? serviceRadiusKm : 50 // default 50km
    return {
      inRadius: distanceKm <= effectiveRadius,
      distanceKm
    }
  }
  
  // For clinic, use requested radius
  return {
    inRadius: distanceKm <= radiusKm,
    distanceKm
  }
}

