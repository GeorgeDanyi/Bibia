/**
 * Clean matching logic with separated hard filters and soft scoring
 * 
 * This module provides a clear separation between:
 * - Hard filters: Must-pass criteria that exclude therapists
 * - Soft scoring: Preference-based scoring that influences ranking
 */

import type { Answers } from '@/lib/types/answers'
import type { Therapist } from './types'
import { matchesGender, matchesAgeGroup, matchesMeetingType, isInRadiusSync } from '@/lib/utils/therapist-matchers'
import { haversineKm } from '@/lib/utils/geo'
import { getCityCoords } from '@/lib/geo/cities'

// ============================================================================
// Type Conversion
// ============================================================================

/**
 * Convert IndexedTherapist (from API) to Therapist (matching engine type)
 * This allows the matching logic to work with different data formats
 */
export function convertToTherapist(indexed: {
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
  age_groups: Array<'child' | 'adult' | 'senior'>
  accepts_insurance: boolean
  metadata?: { barrier_free?: boolean }
}): Therapist {
  // Map meeting types
  const meetingTypes: ('ordinace' | 'dojíždění' | 'online')[] = indexed.meeting_types.map(mt => 
    mt === 'ordinace' ? 'ordinace' :
    mt === 'dojizdeni' ? 'dojíždění' :
    'online'
  )
  
  // Extract diagnoses from specialties (simplified - in production this would be more sophisticated)
  const diagnoses = {
    canonicalIds: indexed.specialties.filter(s => s.includes('_') || s.includes('-')),
    synonyms: indexed.specialties,
    categories: []
  }
  
  return {
    id: indexed.id,
    fullName: indexed.name,
    city: indexed.city,
    latitude: indexed.lat,
    longitude: indexed.lng,
    meetingTypes,
    serviceRadiusKm: indexed.service_radius_km > 0 ? indexed.service_radius_km : undefined,
    barrier_free: indexed.metadata?.barrier_free ?? false,
    ageGroups: indexed.age_groups as ('child' | 'adult' | 'senior')[],
    acceptingNewClients: true, // Assume true if not specified
    activeProfile: true, // Assume true if not specified
    diagnoses,
    issues: indexed.specialties,
    timeWindows: ['weekday'], // Default - would be derived from availability in production
    languages: indexed.languages,
    acceptsInsurance: indexed.accepts_insurance,
    gender: indexed.gender,
    isVerified: false, // Default
    profileCompleteness: 0.5, // Default
    reviewCount: 0, // Default
    hasPhotos: false // Default
  }
}

// ============================================================================
// Types
// ============================================================================

export interface ScoredTherapist {
  therapist: Therapist
  score: number
  breakdown: {
    problemArea: number
    problemDetail: number
    languages: number
    weekdays: number
    timesOfDay: number
    insurance: number
    gender: number
    distance: number
  }
  distanceKm: number | null
}

// ============================================================================
// Hard Filters
// ============================================================================

/**
 * Apply hard filters - therapists that don't pass are completely excluded
 * 
 * Hard filters check:
 * 1. Meeting type support (clinic/home/online)
 * 2. Location/radius (for in-person meetings)
 * 3. Age group support
 * 4. Barrier-free requirement (if needed)
 * 5. Strict gender matching (if strictGender === true)
 */
export function applyHardFilters(
  answers: Answers,
  therapists: Therapist[]
): Therapist[] {
  // Get user coordinates from city if available
  const cityCoords = answers.city ? getCityCoords(answers.city) : null
  const userCoords = cityCoords ? { lat: cityCoords[0], lon: cityCoords[1] } : null
  
  // Normalize meeting type
  const requestedMeetingType = answers.meetingType === 'clinic' ? 'ordinace' :
                               answers.meetingType === 'home' ? 'dojíždění' :
                               answers.meetingType === 'online' ? 'online' :
                               'ordinace' // default to clinic for 'any'
  
  return therapists.filter(therapist => {
    // 1. Meeting type compatibility - MANDATORY
    const therapistMeetingTypes = therapist.meetingTypes.map(mt => 
      mt === 'ordinace' ? 'ordinace' : mt === 'dojíždění' ? 'dojizdeni' : mt
    )
    if (!matchesMeetingType(therapistMeetingTypes, requestedMeetingType)) {
      return false
    }
    
    // Additional check: exclude therapists that ONLY offer online or home_visit when clinic is required
    if (requestedMeetingType === 'ordinace') {
      const normalizedTypes = therapist.meetingTypes.map(mt => 
        mt === 'ordinace' ? 'clinic' : mt === 'dojíždění' ? 'home_visit' : mt
      )
      const hasOnlyOnline = normalizedTypes.length === 1 && normalizedTypes.includes('online')
      const hasOnlyHomeVisit = normalizedTypes.length === 1 && normalizedTypes.includes('home_visit')
      if (hasOnlyOnline || hasOnlyHomeVisit) {
        return false
      }
    }
    
    // 2. Radius/location match - MANDATORY for in-person meetings
    if (requestedMeetingType !== 'online' && userCoords) {
      const radiusCheck = isInRadiusSync({
        userCoords: { lat: userCoords.lat, lon: userCoords.lon },
        therapistLocation: {
          lat: therapist.latitude,
          lng: therapist.longitude,
          city: therapist.city
        },
        radiusKm: answers.radiusKm,
        meetingType: requestedMeetingType,
        serviceRadiusKm: therapist.serviceRadiusKm
      })
      
      if (radiusCheck.distanceKm === null || !radiusCheck.inRadius) {
        return false
      }
    }
    
    // 3. Age group compatibility - MANDATORY
    if (!matchesAgeGroup(therapist.ageGroups, answers.ageGroup)) {
      return false
    }
    
    // 4. Barrier-free requirement - MANDATORY if requested for in-person
    if (answers.barrierFree && requestedMeetingType !== 'online') {
      if (!therapist.barrier_free) {
        return false
      }
    }
    
    // 5. STRICT gender filtering - MANDATORY when strictGender === true AND genderPreference !== 'any'
    if (answers.strictGender === true && answers.genderPreference !== 'any') {
      if (!matchesGender(therapist.gender, answers.genderPreference)) {
        return false
      }
    }
    
    return true
  })
}

// ============================================================================
// Soft Scoring
// ============================================================================

/**
 * Calculate distance in km between user and therapist
 */
function calculateDistanceKm(
  answers: Answers,
  therapist: Therapist
): number | null {
  const cityCoords = answers.city ? getCityCoords(answers.city) : null
  if (!cityCoords) return null
  const userCoords = { lat: cityCoords[0], lon: cityCoords[1] }
  
  if (answers.meetingType === 'online') {
    return null // Distance irrelevant for online
  }
  
  return haversineKm(
    { lat: userCoords.lat, lon: userCoords.lon },
    { lat: therapist.latitude, lon: therapist.longitude }
  )
}

/**
 * Score problem area match (0-1)
 */
function scoreProblemArea(answers: Answers, therapist: Therapist): number {
  if (!answers.problemArea) return 0.5 // Neutral if no problem area specified
  
  // Check if therapist's issues include the problem area
  const normalizedProblemArea = answers.problemArea.toLowerCase().trim()
  const matches = therapist.issues.some(issue => 
    issue.toLowerCase().trim() === normalizedProblemArea
  )
  
  return matches ? 1.0 : 0.3
}

/**
 * Score problem detail/diagnosis match (0-1)
 */
function scoreProblemDetail(answers: Answers, therapist: Therapist): number {
  if (!answers.problemDetail) return 0.5 // Neutral if no detail specified
  
  const normalizedDetail = answers.problemDetail.toLowerCase().trim()
  
  // Check canonical IDs
  if (therapist.diagnoses.canonicalIds.some(id => 
    id.toLowerCase().trim() === normalizedDetail
  )) {
    return 1.0
  }
  
  // Check synonyms
  if (therapist.diagnoses.synonyms.some(syn => 
    syn.toLowerCase().trim() === normalizedDetail
  )) {
    return 0.9
  }
  
  // Check categories
  if (therapist.diagnoses.categories.some(cat => 
    cat.toLowerCase().trim() === normalizedDetail
  )) {
    return 0.7
  }
  
  return 0.2
}

/**
 * Score language overlap (0-1)
 */
function scoreLanguages(answers: Answers, therapist: Therapist): number {
  if (answers.languages.length === 0) return 0.5 // Neutral if no languages specified
  
  const userLangs = new Set(answers.languages.map(l => l.toLowerCase().trim()))
  const therapistLangs = new Set(therapist.languages.map(l => l.toLowerCase().trim()))
  
  // Count overlapping languages
  let overlap = 0
  for (const lang of userLangs) {
    if (therapistLangs.has(lang)) {
      overlap++
    }
  }
  
  // Return proportion of user languages that match
  return overlap / answers.languages.length
}

/**
 * Score weekday overlap (0-1)
 */
function scoreWeekdays(answers: Answers, therapist: Therapist): number {
  if (answers.weekdays.length === 0) return 0.5 // Neutral if no weekdays specified
  
  // Map Czech weekday abbreviations to therapist time windows
  const weekdayMap: Record<string, string> = {
    'po': 'weekday',
    'ut': 'weekday',
    'st': 'weekday',
    'ct': 'weekday',
    'pa': 'weekday',
    'so': 'weekend',
    'ne': 'weekend'
  }
  
  const userTimeWindows = new Set(
    answers.weekdays.map(wd => weekdayMap[wd.toLowerCase().trim()] || 'weekday')
  )
  const therapistTimeWindows = new Set(therapist.timeWindows as ('weekday' | 'evening' | 'weekend')[])
  
  // Check if any user weekday matches therapist availability
  for (const window of userTimeWindows) {
    if (therapistTimeWindows.has(window as 'weekday' | 'evening' | 'weekend')) {
      return 1.0
    }
  }
  
  return 0.3
}

/**
 * Score time of day overlap (0-1)
 */
function scoreTimesOfDay(answers: Answers, therapist: Therapist): number {
  if (answers.timesOfDay.length === 0) return 0.5 // Neutral if no times specified
  
  // Map user time preferences to therapist time windows
  const timeMap: Record<string, string> = {
    'morning': 'weekday',
    'late_morning': 'weekday',
    'afternoon': 'weekday',
    'evening': 'evening',
    'weekend': 'weekend'
  }
  
  const userTimeWindows = new Set(
    answers.timesOfDay.map(time => timeMap[time.toLowerCase().trim()] || 'weekday')
  )
  const therapistTimeWindows = new Set(therapist.timeWindows as ('weekday' | 'evening' | 'weekend')[])
  
  // Check if any user time matches therapist availability
  for (const window of userTimeWindows) {
    if (therapistTimeWindows.has(window as 'weekday' | 'evening' | 'weekend')) {
      return 1.0
    }
  }
  
  return 0.3
}

/**
 * Score insurance compatibility (0-1)
 */
function scoreInsurance(answers: Answers, therapist: Therapist): number {
  if (answers.insuranceMode === 'insurance') {
    return therapist.acceptsInsurance ? 1.0 : 0.2
  } else {
    // Self-pay: neutral score (both insurance and self-pay are acceptable)
    return 0.5
  }
}

/**
 * Score gender preference (0-1) - only when NOT strictGender
 */
function scoreGender(answers: Answers, therapist: Therapist): number {
  // If strictGender is true, this is handled by hard filters, so neutral score
  if (answers.strictGender) {
    return 0.5
  }
  
  // If no preference, neutral score
  if (answers.genderPreference === 'any') {
    return 0.5
  }
  
  // Bonus if gender matches preference
  return therapist.gender === answers.genderPreference ? 1.0 : 0.3
}

/**
 * Score distance (0-1) - closer is better
 */
function scoreDistance(distanceKm: number | null): number {
  if (distanceKm === null) return 0.5 // Neutral if distance unknown
  
  // Score decreases with distance
  // 0-5km: 1.0, 5-10km: 0.8, 10-20km: 0.6, 20-30km: 0.4, 30+km: 0.2
  if (distanceKm <= 5) return 1.0
  if (distanceKm <= 10) return 0.8
  if (distanceKm <= 20) return 0.6
  if (distanceKm <= 30) return 0.4
  return 0.2
}

/**
 * Apply soft scoring - all therapists that passed hard filters are scored
 * Scoring influences ranking but does NOT exclude therapists
 */
export function applySoftScoring(
  answers: Answers,
  therapists: Therapist[]
): ScoredTherapist[] {
  return therapists.map(therapist => {
    const distanceKm = calculateDistanceKm(answers, therapist)
    
    const breakdown = {
      problemArea: scoreProblemArea(answers, therapist),
      problemDetail: scoreProblemDetail(answers, therapist),
      languages: scoreLanguages(answers, therapist),
      weekdays: scoreWeekdays(answers, therapist),
      timesOfDay: scoreTimesOfDay(answers, therapist),
      insurance: scoreInsurance(answers, therapist),
      gender: scoreGender(answers, therapist),
      distance: scoreDistance(distanceKm)
    }
    
    // Weighted total score (0-100)
    // Problem area/detail: 40%, Languages: 15%, Time/day: 15%, Insurance: 10%, Gender: 10%, Distance: 10%
    const totalScore = 
      (breakdown.problemArea * 0.2 + breakdown.problemDetail * 0.2) * 40 +
      breakdown.languages * 15 +
      (breakdown.weekdays * 0.5 + breakdown.timesOfDay * 0.5) * 15 +
      breakdown.insurance * 10 +
      breakdown.gender * 10 +
      breakdown.distance * 10
    
    return {
      therapist,
      score: Math.round(totalScore),
      breakdown,
      distanceKm
    }
  })
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Sort therapists by score (highest first), with tie-breaking by distance
 */
export function sortByScore(scored: ScoredTherapist[]): ScoredTherapist[] {
  return [...scored].sort((a, b) => {
    // Primary: score (higher is better)
    if (b.score !== a.score) {
      return b.score - a.score
    }
    
    // Tie-breaker: distance (closer is better)
    const distA = a.distanceKm ?? Infinity
    const distB = b.distanceKm ?? Infinity
    return distA - distB
  })
}

// ============================================================================
// Main Matching Function
// ============================================================================

/**
 * Find matching therapists with clear separation of hard filters and soft scoring
 * 
 * @param answers - User's questionnaire answers
 * @param therapists - Array of all available therapists
 * @returns Sorted array of scored therapists (only those that passed hard filters)
 */
export function findMatches(
  answers: Answers,
  therapists: Therapist[]
): ScoredTherapist[] {
  // Step 1: Apply hard filters (exclude non-matching therapists)
  const filtered = applyHardFilters(answers, therapists)
  
  // Step 2: Apply soft scoring (score remaining therapists)
  const scored = applySoftScoring(answers, filtered)
  
  // Step 3: Sort by score
  return sortByScore(scored)
}

