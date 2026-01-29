// Debug helper for matching engine - development only
// Logs detailed information about why therapists are included/excluded

import { Therapist, SearchInputs } from './types'

/**
 * Check if debug mode is enabled
 * Debug mode is enabled when:
 * - NODE_ENV is 'development', OR
 * - NEXT_PUBLIC_MATCHING_DEBUG is set to 'true'
 */
export function isDebugMode(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_MATCHING_DEBUG === 'true'
    )
  }
  return false
}

/**
 * Hard filter check results
 */
export interface HardFilterResults {
  passed: boolean
  meetingType: { passed: boolean; reason?: string }
  serviceRadius?: { passed: boolean; reason?: string; distance?: number }
  barrierFree: { passed: boolean; reason?: string }
  ageGroup: { passed: boolean; reason?: string }
  gender: { passed: boolean; reason?: string }
  status: { passed: boolean; reason?: string }
}

/**
 * Soft score breakdown
 */
export interface ScoreBreakdown {
  diagnosis: number
  availability: number
  distance: number
  language: number
  age: number
  gender: number
  insurance: number
  quality: number
  total: number
}

/**
 * Detailed debug information for a therapist
 */
export interface TherapistDebugInfo {
  therapist: {
    id: string
    name: string
    gender: 'male' | 'female'
    city: string
    meetingTypes: string[]
    ageGroups: string[]
    barrierFree: boolean
    languages: string[]
  }
  hardFilters: HardFilterResults
  scoreBreakdown: ScoreBreakdown
  finalScore: number
  included: boolean
}

/**
 * Check hard filters and return detailed results
 */
export function checkHardFilters(
  therapist: Therapist,
  inputs: SearchInputs
): HardFilterResults {
  const results: HardFilterResults = {
    passed: true,
    meetingType: { passed: false },
    barrierFree: { passed: true },
    ageGroup: { passed: true },
    gender: { passed: true },
    status: { passed: false }
  }

  // 1. Meeting type
  if (therapist.meetingTypes.includes(inputs.meetingType)) {
    results.meetingType = { passed: true }
  } else {
    results.meetingType = {
      passed: false,
      reason: `Therapist supports ${therapist.meetingTypes.join(', ')}, but required ${inputs.meetingType}`
    }
    results.passed = false
    return results
  }

  // 2. Service radius (for dojíždění)
  if (inputs.meetingType === 'dojíždění' && inputs.location.coords) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (therapist.latitude - inputs.location.coords.lat) * Math.PI / 180
    const dLon = (therapist.longitude - inputs.location.coords.lon) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(inputs.location.coords.lat * Math.PI / 180) * Math.cos(therapist.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    const maxRadius = therapist.serviceRadiusKm || 25

    if (distance <= maxRadius) {
      results.serviceRadius = { passed: true, distance }
    } else {
      results.serviceRadius = {
        passed: false,
        distance,
        reason: `Distance ${distance.toFixed(1)}km exceeds service radius ${maxRadius}km`
      }
      results.passed = false
      return results
    }
  }

  // 3. Barrier-free
  if (inputs.barrierFree && (inputs.meetingType === 'ordinace' || inputs.meetingType === 'dojíždění')) {
    if (therapist.barrier_free) {
      results.barrierFree = { passed: true }
    } else {
      results.barrierFree = {
        passed: false,
        reason: 'Barrier-free required but therapist does not offer it'
      }
      results.passed = false
      return results
    }
  }

  // 4. Age group
  if (inputs.ageGroup === 'child' || inputs.ageGroup === 'senior') {
    if (therapist.ageGroups.includes(inputs.ageGroup)) {
      results.ageGroup = { passed: true }
    } else {
      results.ageGroup = {
        passed: false,
        reason: `Therapist supports ${therapist.ageGroups.join(', ')}, but required ${inputs.ageGroup}`
      }
      results.passed = false
      return results
    }
  }

  // 5. Gender (strict filter)
  if (inputs.strictGender === true && inputs.therapistGenderPref && inputs.therapistGenderPref !== 'any') {
    if (therapist.gender === inputs.therapistGenderPref) {
      results.gender = { passed: true }
    } else {
      results.gender = {
        passed: false,
        reason: `Therapist is ${therapist.gender}, but required ${inputs.therapistGenderPref} (strict mode)`
      }
      results.passed = false
      return results
    }
  } else {
    results.gender = { passed: true, reason: 'Not a hard filter (strictGender=false or preference=any)' }
  }

  // 6. Status
  if (therapist.acceptingNewClients && therapist.activeProfile) {
    results.status = { passed: true }
  } else {
    results.status = {
      passed: false,
      reason: `Not accepting new clients: ${!therapist.acceptingNewClients}, or inactive profile: ${!therapist.activeProfile}`
    }
    results.passed = false
    return results
  }

  return results
}

/**
 * Calculate score breakdown (extracted from calculateMatchScore logic)
 * This is a simplified version that returns the breakdown
 */
export function calculateScoreBreakdown(
  therapist: Therapist,
  inputs: SearchInputs
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    diagnosis: 0,
    availability: 0,
    distance: 0,
    language: 0,
    age: 0,
    gender: 0,
    insurance: 0,
    quality: 0,
    total: 0
  }

  // Diagnosis/Issues (40 points max)
  if (inputs.diagnosis.canonicalId) {
    if (therapist.diagnoses.canonicalIds.includes(inputs.diagnosis.canonicalId)) {
      breakdown.diagnosis = 40
    } else if (inputs.diagnosis.synonyms && inputs.diagnosis.synonyms.some(syn =>
      therapist.diagnoses.synonyms.some(tSyn => 
        tSyn.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 
        syn.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      )
    )) {
      breakdown.diagnosis = 35
    } else if (inputs.diagnosis.category && therapist.diagnoses.categories.includes(inputs.diagnosis.category)) {
      breakdown.diagnosis = 25
    }
  }
  if (breakdown.diagnosis === 0 && inputs.issues.length > 0) {
    const matchingIssues = inputs.issues.filter(issue =>
      therapist.issues.some(tIssue =>
        tIssue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
        issue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      )
    )
    if (matchingIssues.length > 0) {
      breakdown.diagnosis = Math.min(30, matchingIssues.length * 10)
    }
  }

  // Availability (15 points max)
  if (therapist.nextAvailableSlot) {
    breakdown.availability = 10
    if (inputs.timeFit !== 'ASAP' && therapist.timeWindows.includes(inputs.timeFit)) {
      breakdown.availability = 15
    }
  }

  // Distance (15 points max)
  if (inputs.location.coords && inputs.meetingType !== 'online') {
    const R = 6371
    const dLat = (therapist.latitude - inputs.location.coords.lat) * Math.PI / 180
    const dLon = (therapist.longitude - inputs.location.coords.lon) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(inputs.location.coords.lat * Math.PI / 180) * Math.cos(therapist.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    breakdown.distance = Math.max(0, 15 - (distance / 25) * 15)
  } else if (inputs.meetingType === 'online') {
    breakdown.distance = 15
  }

  // Language (10 points max)
  if (inputs.language && therapist.languages.includes(inputs.language)) {
    breakdown.language = 10
  }

  // Age (5 points max)
  if (therapist.ageGroups.includes(inputs.ageGroup)) {
    breakdown.age = 5
  }

  // Gender (10 points max)
  if (inputs.therapistGenderPref !== 'any') {
    if (therapist.gender === inputs.therapistGenderPref) {
      breakdown.gender = 10
    } else {
      breakdown.gender = 0
    }
  } else {
    breakdown.gender = 5
  }

  // Insurance (5 points max)
  if (inputs.wantsInsurance && therapist.acceptsInsurance) {
    breakdown.insurance = 5
  }

  // Quality (5 points max)
  if (therapist.isVerified) breakdown.quality += 2
  if (therapist.reviewCount >= 3) breakdown.quality += 2
  if (therapist.hasPhotos) breakdown.quality += 1

  breakdown.total = Math.min(100,
    breakdown.diagnosis +
    breakdown.availability +
    breakdown.distance +
    breakdown.language +
    breakdown.age +
    breakdown.gender +
    breakdown.insurance +
    breakdown.quality
  )

  return breakdown
}

/**
 * Log debug information for a therapist
 */
export function logTherapistDebug(
  therapist: Therapist,
  inputs: SearchInputs,
  hardFilters: HardFilterResults,
  scoreBreakdown: ScoreBreakdown,
  finalScore: number,
  included: boolean
): void {
  if (!isDebugMode()) return

  const debugInfo: TherapistDebugInfo = {
    therapist: {
      id: therapist.id,
      name: therapist.fullName,
      gender: therapist.gender,
      city: therapist.city,
      meetingTypes: therapist.meetingTypes,
      ageGroups: therapist.ageGroups,
      barrierFree: therapist.barrier_free,
      languages: therapist.languages
    },
    hardFilters,
    scoreBreakdown,
    finalScore,
    included
  }

  // Log to console with clear formatting
  console.group(`🔍 Therapist: ${therapist.fullName} (${therapist.id})`)
  console.log('📋 Attributes:', debugInfo.therapist)
  
  if (included) {
    console.log('✅ INCLUDED')
  } else {
    console.log('❌ EXCLUDED')
  }

  console.log('🚫 Hard Filters:')
  console.log(`  Meeting Type: ${hardFilters.meetingType.passed ? '✅' : '❌'} ${hardFilters.meetingType.reason || ''}`)
  if (hardFilters.serviceRadius) {
    console.log(`  Service Radius: ${hardFilters.serviceRadius.passed ? '✅' : '❌'} ${hardFilters.serviceRadius.reason || ''}`)
  }
  console.log(`  Barrier-Free: ${hardFilters.barrierFree.passed ? '✅' : '❌'} ${hardFilters.barrierFree.reason || ''}`)
  console.log(`  Age Group: ${hardFilters.ageGroup.passed ? '✅' : '❌'} ${hardFilters.ageGroup.reason || ''}`)
  console.log(`  Gender: ${hardFilters.gender.passed ? '✅' : '❌'} ${hardFilters.gender.reason || ''}`)
  console.log(`  Status: ${hardFilters.status.passed ? '✅' : '❌'} ${hardFilters.status.reason || ''}`)

  if (included) {
    console.log('📊 Score Breakdown:')
    console.log(`  Diagnosis: ${scoreBreakdown.diagnosis} pts`)
    console.log(`  Availability: ${scoreBreakdown.availability} pts`)
    console.log(`  Distance: ${scoreBreakdown.distance} pts`)
    console.log(`  Language: ${scoreBreakdown.language} pts`)
    console.log(`  Age: ${scoreBreakdown.age} pts`)
    console.log(`  Gender: ${scoreBreakdown.gender} pts`)
    console.log(`  Insurance: ${scoreBreakdown.insurance} pts`)
    console.log(`  Quality: ${scoreBreakdown.quality} pts`)
    console.log(`  TOTAL: ${finalScore} pts`)
  }

  console.groupEnd()
}

