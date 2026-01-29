/**
 * Clean, reliable multi-layered matching engine
 * 
 * Uses canonical types (MatchingInputs, MatchingTherapist) for type safety.
 * Implements:
 * - Hard filters (must pass)
 * - Soft scoring (ranking only, never excludes)
 * - Fallback layers (when zero results)
 * - Zero-result prevention
 */

import type { MatchingInputs, MatchingTherapist } from './types'
import { haversineKm } from '@/lib/utils/geo'

// ============================================================================
// Types
// ============================================================================

export type MatchReasonCode =
  | 'MEETING_TYPE_MATCH'
  | 'DISTANCE_CLOSE'
  | 'AGE_GROUP_MATCH'
  | 'BARRIER_FREE_MATCH'
  | 'GENDER_PREFERRED'
  | 'LANGUAGE_MATCH'
  | 'SPECIALTY_MATCH'
  | 'ASAP_AVAILABILITY'
  | 'PROFILE_QUALITY'

export interface MatchReason {
  code: MatchReasonCode
  labelCs: string
  detailCs?: string
  weight?: number
}

export interface ScoreBreakdown {
  specialties: number
  languages: number
  timePreference: number
  gender: number
  distance: number
  profileScore: number
  genderPenalty: number
  totalScore: number
}

export interface ScoredTherapist {
  therapist: MatchingTherapist
  totalScore: number
  breakdown: ScoreBreakdown
  distanceKm: number | null
  matchPercent: number
  reasons: MatchReason[]
  usedFallbackLevel: 0 | 1 | 2 | 3
}

export interface MatchResult {
  matches: ScoredTherapist[]
  fallbackUsed: boolean
  fallbackLevel: string | null
  metadata?: {
    warning?: string
    originalCount?: number
    afterHardFilters?: number
  }
}

// ============================================================================
// Hard Filters (MUST PASS)
// ============================================================================

/**
 * Apply hard filters - therapists MUST pass all of these to be considered.
 * 
 * Hard filters are strict requirements that cannot be relaxed.
 * If a therapist fails any hard filter, they are excluded from results.
 */
export function applyHardFilters(
  inputs: MatchingInputs,
  therapists: MatchingTherapist[]
): MatchingTherapist[] {
  return therapists.filter(therapist => {
    // 1. Meeting type compatibility
    // If user selects "clinic", allow therapists with: ['clinic'] OR ['clinic','online']
    // Do NOT reject therapists who offer more modes unless explicitly incompatible.
    if (inputs.meetingType !== 'any') {
      const hasRequestedType = therapist.meeting_types.includes(inputs.meetingType)
      
      if (!hasRequestedType) {
        // Special case: if user wants 'clinic', also allow therapists with ['clinic', 'online']
        if (inputs.meetingType === 'clinic') {
          const hasClinic = therapist.meeting_types.includes('clinic')
          if (!hasClinic) {
            return false // Reject if no clinic support at all
          }
        } else {
          return false // For other types, exact match required
        }
      }
      
      // Reject therapists that ONLY offer incompatible types
      // e.g., if user wants 'clinic', reject therapists with ONLY 'online' or ONLY 'home_visit'
      if (inputs.meetingType === 'clinic') {
        const onlyOnline = therapist.meeting_types.length === 1 && 
                          therapist.meeting_types.includes('online')
        const onlyHomeVisit = therapist.meeting_types.length === 1 && 
                             therapist.meeting_types.includes('home_visit')
        if (onlyOnline || onlyHomeVisit) {
          return false
        }
      }
    }
    
    // 2. Age group compatibility
    // If user selects 'adult', treat it as ALWAYS PASS (no therapist should be excluded).
    // Only strict filter for 'child' and 'senior'.
    if (inputs.ageGroup !== 'adult') {
      if (!therapist.age_groups.includes(inputs.ageGroup)) {
        return false
      }
    }
    // Note: 'adult' always passes - no check needed
    
    // 3. Barrier-free requirement
    // If user requests barrierFree = true → require therapist.barrier_free === true
    // Only applies to in-person meetings (not online)
    if (inputs.barrierFree && inputs.meetingType !== 'online' && inputs.meetingType !== 'any') {
      if (!therapist.barrier_free) {
        return false
      }
    }
    
    // 4. Strict gender filtering
    // If strictGender === true AND genderPreference !== 'any', filter so:
    //   therapist.gender === genderPreference
    if (inputs.strictGender && inputs.genderPreference !== 'any') {
      if (therapist.gender !== inputs.genderPreference) {
        return false
      }
    }
    
    // 5. Location/radius filtering
    // If user city resolves to coordinates, apply a radius filter.
    // If user city has NO coordinates (null), SKIP the distance filter entirely (never reject therapists).
    if (inputs.location.coords && inputs.meetingType !== 'online' && inputs.meetingType !== 'any') {
      const therapistCoords = therapist.coordinates
      
      if (!therapistCoords) {
        // If therapist has no coordinates, we can't calculate distance
        // For clinic/home_visit, we need coordinates, so reject
        // Exception: if user also has no coordinates, we can't filter by distance
        return false
      }
      
      // Calculate distance
      const distanceKm = haversineKm(
        { lat: inputs.location.coords.lat, lon: inputs.location.coords.lon },
        { lat: therapistCoords.lat, lon: therapistCoords.lon }
      )
      
      // 6. Home visit radius check
      // If user selects home_visit, allow therapists where:
      //   distance_to_user <= therapist.service_radius_km
      // If therapist has no service_radius_km, treat as NOT compatible.
      if (inputs.meetingType === 'home_visit') {
        if (therapist.service_radius_km === null) {
          return false // No service radius = not compatible for home visits
        }
        if (distanceKm > therapist.service_radius_km) {
          return false // Outside service radius
        }
      } else if (inputs.meetingType === 'clinic') {
        // For clinic, use user's requested radius
        const radiusKm = inputs.radiusKm || 30 // Default 30km if not specified
        if (distanceKm > radiusKm) {
          return false // Outside requested radius
        }
      }
    }
    // Note: If no coordinates available, we skip distance filtering (never reject)
    
    // 7. Therapist status
    // Only include therapists who are accepting new clients and have active profiles
    if (!therapist.accepting_new || !therapist.active_profile) {
      return false
    }
    
    return true // Passed all hard filters
  })
}

// ============================================================================
// Soft Scoring (DO NOT EXCLUDE)
// ============================================================================

/**
 * Apply soft scoring - influences ranking but NEVER excludes therapists.
 * 
 * All therapists that pass hard filters are scored and returned.
 * Scoring uses a weighted point system.
 */
export function applySoftScoring(
  inputs: MatchingInputs,
  therapists: MatchingTherapist[]
): ScoredTherapist[] {
  return therapists.map(therapist => {
    let totalScore = 0
    const breakdown: ScoreBreakdown = {
      specialties: 0,
      languages: 0,
      timePreference: 0,
      gender: 0,
      distance: 0,
      profileScore: 0,
      genderPenalty: 0,
      totalScore: 0
    }
    
    // 1. Specialties / conditions match
    // +10 for exact match, +4 for partial match, +1 general physio
    if (inputs.issues.length > 0 || inputs.diagnosis.canonicalId) {
      // Check for exact diagnosis match
      if (inputs.diagnosis.canonicalId) {
        if (therapist.diagnosis_expertise.includes(inputs.diagnosis.canonicalId)) {
          breakdown.specialties = 10
        } else if (inputs.diagnosis.synonyms && inputs.diagnosis.synonyms.some(syn => 
          therapist.diagnosis_expertise.includes(syn) || therapist.specialties.includes(syn)
        )) {
          breakdown.specialties = 8 // Synonym match
        } else if (inputs.diagnosis.category && therapist.specialties.includes(inputs.diagnosis.category)) {
          breakdown.specialties = 6 // Category match
        } else {
          breakdown.specialties = 1 // General physio (no match but still a therapist)
        }
      } else if (inputs.issues.length > 0) {
        // Check for issue/specialty matches
        const matchingIssues = inputs.issues.filter(issue => 
          therapist.specialties.includes(issue) || therapist.diagnosis_expertise.includes(issue)
        )
        if (matchingIssues.length === inputs.issues.length) {
          breakdown.specialties = 10 // All issues match
        } else if (matchingIssues.length > 0) {
          breakdown.specialties = 4 + (matchingIssues.length / inputs.issues.length) * 4 // Partial match
        } else {
          breakdown.specialties = 1 // General physio
        }
      }
    } else {
      // No conditions specified - neutral score
      breakdown.specialties = 5
    }
    totalScore += breakdown.specialties
    
    // 2. Languages
    // +3 each language overlapping with user preferences
    if (inputs.languages.length > 0) {
      const matchingLanguages = inputs.languages.filter(lang => 
        therapist.languages.includes(lang)
      )
      breakdown.languages = Math.min(10, matchingLanguages.length * 3) // Max 10 points
    } else {
      // No language preference - neutral score
      breakdown.languages = 5
    }
    totalScore += breakdown.languages
    
    // 3. Time preference (asap)
    // +6 for therapists with any upcoming availability, +0 otherwise
    if (inputs.timePreference === 'asap') {
      if (therapist.availability.length > 0 || therapist.next_available_slot) {
        breakdown.timePreference = 6
      } else {
        breakdown.timePreference = 0
      }
    } else {
      // For flexible/specific/unknown, neutral score
      breakdown.timePreference = 3
    }
    totalScore += breakdown.timePreference
    
    // 4. Gender (non-strict preference)
    // If strictGender === false:
    //   +20 if therapist.gender === genderPreference
    //   +0 otherwise
    // This strong bonus ensures preferred gender therapists rank clearly above non-preferred gender
    if (!inputs.strictGender && inputs.genderPreference !== 'any') {
      if (therapist.gender === inputs.genderPreference) {
        breakdown.gender = 20
      } else {
        breakdown.gender = 0
      }
    } else {
      // Strict gender already handled in hard filters, or no preference
      breakdown.gender = 2.5 // Neutral score
    }
    totalScore += breakdown.gender
    
    // 5. Distance (if available)
    // 0–10 points, closer = more points
    let distanceKm: number | null = null
    if (inputs.location.coords && therapist.coordinates && 
        inputs.meetingType !== 'online' && inputs.meetingType !== 'any') {
      distanceKm = haversineKm(
        { lat: inputs.location.coords.lat, lon: inputs.location.coords.lon },
        { lat: therapist.coordinates.lat, lon: therapist.coordinates.lon }
      )
      
      // Score: 10 points at 0km, decreasing linearly to 0 points at 50km
      if (distanceKm <= 5) {
        breakdown.distance = 10
      } else if (distanceKm <= 15) {
        breakdown.distance = 8
      } else if (distanceKm <= 25) {
        breakdown.distance = 5
      } else if (distanceKm <= 50) {
        breakdown.distance = 2
      } else {
        breakdown.distance = 0
      }
    } else {
      // Online or no coordinates - neutral score
      breakdown.distance = 5
    }
    totalScore += breakdown.distance
    
    // 6. Profile score
    // +0–5 based on therapist.profile_score (profile_completeness)
    breakdown.profileScore = Math.min(5, therapist.profile_completeness * 5)
    totalScore += breakdown.profileScore

    breakdown.totalScore = totalScore
    
    return {
      therapist,
      totalScore,
      breakdown,
      distanceKm,
      // Explainability fields are populated later in findMatches()
      matchPercent: 0,
      reasons: [],
      usedFallbackLevel: 0
    }
  })
}

// ============================================================================
// Fallback Layers (ZERO-RESULT PREVENTION)
// ============================================================================

/**
 * Apply fallback layers when hard filters produce zero results.
 * 
 * Implements a 3-level fallback system:
 * - LEVEL 1: Language + conditions relax
 * - LEVEL 2: Modality relax
 * - LEVEL 3: Location relax
 */
export function applyFallbackLayers(
  inputs: MatchingInputs,
  therapists: MatchingTherapist[]
): { therapists: MatchingTherapist[]; fallbackLevel: string } {
  let currentInputs = { ...inputs }
  let currentTherapists = therapists
  let fallbackLevel = 'none'
  
  // LEVEL 1: Language + conditions relax
  // - ignore languages if user only selected ['cs']
  // - treat empty conditions as no requirement
  // - allow broader specialty matching
  const level1Inputs = { ...currentInputs }
  
  // Relax language if only Czech selected
  if (level1Inputs.languages.length === 1 && level1Inputs.languages[0] === 'cs') {
    level1Inputs.languages = [] // Remove language requirement
    fallbackLevel = 'language_relax'
  }
  
  // Relax conditions if empty
  if (level1Inputs.issues.length === 0 && !level1Inputs.diagnosis.canonicalId) {
    // Already relaxed - no conditions to match
  }
  
  let level1Results = applyHardFilters(level1Inputs, currentTherapists)
  if (level1Results.length > 0) {
    return { therapists: level1Results, fallbackLevel }
  }
  
  // LEVEL 2: Modality relax
  // - if user selected "clinic":
  //     include therapists offering ['clinic','online']
  //     include online-only therapists (with a warning returned in metadata)
  if (currentInputs.meetingType === 'clinic') {
    const level2Inputs = { ...currentInputs, meetingType: 'any' as const }
    let level2Results = applyHardFilters(level2Inputs, currentTherapists)
    
    // Filter to only include therapists with clinic or online
    level2Results = level2Results.filter(t => 
      t.meeting_types.includes('clinic') || t.meeting_types.includes('online')
    )
    
    if (level2Results.length > 0) {
      fallbackLevel = 'modality_relax'
      return { therapists: level2Results, fallbackLevel }
    }
  }
  
  // LEVEL 3: Location relax
  // - widen search radius progressively (e.g., +5 km → +10 km)
  // - if still zero, show all therapists in the same region
  if (currentInputs.location.coords && currentInputs.radiusKm !== null) {
    const originalRadius = currentInputs.radiusKm || 30
    const expandedRadii = [originalRadius + 5, originalRadius + 10, originalRadius + 20, 100]
    
    for (const expandedRadius of expandedRadii) {
      const level3Inputs = { ...currentInputs, radiusKm: expandedRadius }
      const level3Results = applyHardFilters(level3Inputs, currentTherapists)
      
      if (level3Results.length > 0) {
        fallbackLevel = 'location_relax'
        return { therapists: level3Results, fallbackLevel }
      }
    }
  }
  
  // Final fallback: remove location requirement entirely
  const finalInputs = { ...currentInputs, location: { city: null, coords: null }, radiusKm: null }
  const finalResults = applyHardFilters(finalInputs, currentTherapists)
  
  if (finalResults.length > 0) {
    fallbackLevel = 'location_removed'
    return { therapists: finalResults, fallbackLevel }
  }
  
  // Last resort: return all active therapists (only status filter)
  const lastResort = currentTherapists.filter(t => t.accepting_new && t.active_profile)
  fallbackLevel = 'last_resort'
  return { therapists: lastResort, fallbackLevel }
}

// ============================================================================
// Zero-Result Prevention
// ============================================================================

/**
 * Check if query is highly generic and should always return results.
 * 
 * Generic query criteria:
 * - adult
 * - practice: clinic
 * - languages: ['cs']
 * - no conditions
 * - no strict gender
 */
function isGenericQuery(inputs: MatchingInputs): boolean {
  return (
    inputs.ageGroup === 'adult' &&
    (inputs.meetingType === 'clinic' || inputs.meetingType === 'any') &&
    inputs.languages.length === 1 && inputs.languages[0] === 'cs' &&
    inputs.issues.length === 0 &&
    !inputs.diagnosis.canonicalId &&
    !inputs.strictGender &&
    !inputs.barrierFree
  )
}

// ============================================================================
// Explainability helpers
// ============================================================================

const MAX_SCORE_FOR_PERCENT = 60

export function normalizeMatchPercent(score: number): number {
  const clampedScore = Math.max(0, score)
  const ratio = clampedScore / MAX_SCORE_FOR_PERCENT
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
  return Math.max(0, Math.min(100, pct))
}

function mapFallbackLevelToTier(
  level: string | null,
  fallbackUsed: boolean
): 0 | 1 | 2 | 3 {
  if (!fallbackUsed || !level || level === 'none') return 0
  if (level === 'language_relax') return 1
  if (level === 'modality_relax') return 2
  // location_relax, location_removed, last_resort and others are treated as deepest fallback
  return 3
}

function buildMatchReasons(
  inputs: MatchingInputs,
  scored: { therapist: MatchingTherapist; breakdown: ScoreBreakdown; distanceKm: number | null }
): MatchReason[] {
  const { therapist, breakdown, distanceKm } = scored
  const reasons: MatchReason[] = []

  // Meeting type
  if (inputs.meetingType !== 'any' && therapist.meeting_types.includes(inputs.meetingType)) {
    reasons.push({
      code: 'MEETING_TYPE_MATCH',
      labelCs: 'Odpovídá preferovanému typu setkání',
      weight: 5
    })
  }

  // Specialty / problem match
  if (breakdown.specialties > 0) {
    reasons.push({
      code: 'SPECIALTY_MATCH',
      labelCs: 'Zaměřuje se na vaše potíže',
      weight: breakdown.specialties
    })
  }

  // Distance
  if (
    distanceKm !== null &&
    inputs.meetingType !== 'online' &&
    inputs.meetingType !== 'any'
  ) {
    const kmRounded = Math.max(0.5, Number(distanceKm.toFixed(1)))
    reasons.push({
      code: 'DISTANCE_CLOSE',
      labelCs: 'Blízko vás',
      detailCs: `${kmRounded.toString().replace('.', ',')} km od vás`,
      weight: breakdown.distance
    })
  }

  // ASAP availability
  if (inputs.timePreference === 'asap') {
    if (therapist.availability.length > 0 || therapist.next_available_slot) {
      reasons.push({
        code: 'ASAP_AVAILABILITY',
        labelCs: 'Má brzké volné termíny',
        weight: breakdown.timePreference
      })
    }
  }

  // Gender preference (non-strict)
  if (!inputs.strictGender && inputs.genderPreference !== 'any') {
    if (therapist.gender === inputs.genderPreference) {
      reasons.push({
        code: 'GENDER_PREFERRED',
        labelCs: 'Odpovídá vaší preferenci pohlaví',
        weight: breakdown.gender
      })
    }
  }

  // Language match
  if (inputs.languages.length > 0) {
    const matchingLanguages = inputs.languages.filter(lang =>
      therapist.languages.includes(lang)
    )
    if (matchingLanguages.length > 0) {
      reasons.push({
        code: 'LANGUAGE_MATCH',
        labelCs: 'Domluvíte se společným jazykem',
        weight: breakdown.languages
      })
    }
  }

  // Barrier-free
  if (inputs.barrierFree && inputs.meetingType !== 'online') {
    if (therapist.barrier_free) {
      reasons.push({
        code: 'BARRIER_FREE_MATCH',
        labelCs: 'Bezbariérový přístup',
        weight: 4
      })
    }
  }

  // Age group
  if (inputs.ageGroup !== 'adult') {
    if (therapist.age_groups.includes(inputs.ageGroup)) {
      reasons.push({
        code: 'AGE_GROUP_MATCH',
        labelCs: 'Pracuje s vaší věkovou skupinou',
        weight: 3
      })
    }
  }

  // Profile quality
  if (breakdown.profileScore >= 4) {
    reasons.push({
      code: 'PROFILE_QUALITY',
      labelCs: 'Kvalitně vyplněný profil terapeuta',
      weight: breakdown.profileScore
    })
  }

  // Sort by weight desc and limit to 4–6 most important reasons
  const sorted = reasons
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))

  return sorted.slice(0, 6)
}

// ============================================================================
// Main Matching Function
// ============================================================================

/**
 * Find matching therapists using the multi-layered matching system.
 * 
 * Flow:
 * 1. Apply hard filters
 * 2. If zero results, apply fallback layers
 * 3. Apply soft scoring to remaining therapists
 * 4. Sort by score
 * 
 * @param inputs - Canonical matching inputs
 * @param therapists - Array of all available therapists (canonical format)
 * @returns Match result with scored therapists
 */
export function findMatches(
  inputs: MatchingInputs,
  therapists: MatchingTherapist[]
): MatchResult {
  const originalCount = therapists.length
  
  // Step 1: Apply hard filters
  let filtered = applyHardFilters(inputs, therapists)
  const afterHardFilters = filtered.length
  
  // Step 2: If zero results, apply fallback layers
  let fallbackUsed = false
  let fallbackLevel: string | null = null
  
  if (filtered.length === 0) {
    // Gender preference fallback protection:
    // If user has a gender preference (non-strict), check if there are enough
    // preferred gender therapists. If >= 3 exist, only run fallback on that subset.
    let therapistsForFallback = therapists
    if (!inputs.strictGender && inputs.genderPreference !== 'any') {
      // Count preferred gender therapists in the original pool
      const preferredGenderTherapists = therapists.filter(
        t => t.gender === inputs.genderPreference
      )
      
      // If we have enough preferred gender therapists, only use them for fallback
      // This prevents diluting results with non-preferred gender when not necessary
      if (preferredGenderTherapists.length >= 3) {
        therapistsForFallback = preferredGenderTherapists
      }
      // If < 3, use all therapists (fallback can include non-preferred gender)
    }
    
    // Check if this is a generic query that should always return results
    if (isGenericQuery(inputs)) {
      // For generic queries, use last resort fallback immediately
      const fallback = applyFallbackLayers(inputs, therapistsForFallback)
      filtered = fallback.therapists
      fallbackUsed = true
      fallbackLevel = fallback.fallbackLevel
    } else {
      // Apply progressive fallback
      const fallback = applyFallbackLayers(inputs, therapistsForFallback)
      filtered = fallback.therapists
      fallbackUsed = true
      fallbackLevel = fallback.fallbackLevel
    }
  }
  
  // Step 3: Apply soft scoring
  let scored = applySoftScoring(inputs, filtered)
  
  // Step 3.5: Apply additional penalty for non-preferred gender (when non-strict)
  // This ensures non-preferred gender therapists appear lower in rankings
  if (!inputs.strictGender && inputs.genderPreference !== 'any') {
    scored = scored.map(match => {
      if (match.therapist.gender !== inputs.genderPreference) {
        // Apply small penalty to further suppress non-preferred gender
        const penalty = 5
        match.totalScore -= penalty
        match.breakdown.gender = Math.max(0, match.breakdown.gender - penalty)
        match.breakdown.genderPenalty = penalty
        match.breakdown.totalScore = match.totalScore
      }
      return match
    })
  }
  
  // Step 4: Sort by score (descending), then by distance (ascending)
  const sorted = scored.sort((a, b) => {
    // Primary: total score DESC
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore
    }
    
    // Secondary: distance ASC (if available)
    const aKm = a.distanceKm ?? Number.POSITIVE_INFINITY
    const bKm = b.distanceKm ?? Number.POSITIVE_INFINITY
    if (aKm !== bKm) {
      return aKm - bKm
    }
    
    // Tertiary: name ASC (alphabetical for deterministic sorting)
    return a.therapist.fullName.localeCompare(b.therapist.fullName)
  })

  const usedFallbackLevelTier = mapFallbackLevelToTier(fallbackLevel, fallbackUsed)

  const withExplainability: ScoredTherapist[] = sorted.map(match => {
    const breakdown: ScoreBreakdown = {
      ...match.breakdown,
      genderPenalty: match.breakdown.genderPenalty || 0,
      totalScore: match.totalScore
    }

    const matchPercent = normalizeMatchPercent(match.totalScore)
    const reasons = buildMatchReasons(inputs, {
      therapist: match.therapist,
      breakdown,
      distanceKm: match.distanceKm
    })

    return {
      therapist: match.therapist,
      totalScore: match.totalScore,
      breakdown,
      distanceKm: match.distanceKm,
      matchPercent,
      reasons,
      usedFallbackLevel: usedFallbackLevelTier
    }
  })
  
  return {
    matches: withExplainability,
    fallbackUsed,
    fallbackLevel,
    metadata: {
      originalCount,
      afterHardFilters
    }
  }
}

