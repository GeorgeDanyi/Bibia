// Core matching engine implementing PART C specifications

import { SearchInputs, Therapist, TherapistMatch, MatchingCriteria } from './types'
import { normalizeText } from './normalization'
import { isDebugMode, checkHardFilters, calculateScoreBreakdown, logTherapistDebug } from './debug'

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  point1: { lat: number; lon: number },
  point2: { lat: number; lon: number }
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lon - point1.lon) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * C1) Hard filters - only if true
 */
function applyHardFilters(therapist: Therapist, inputs: SearchInputs): boolean {
  // 1. Meeting type fit: therapist supports chosen mode
  if (!therapist.meetingTypes.includes(inputs.meetingType)) {
    return false
  }
  
  // For "dojíždění", check service radius
  if (inputs.meetingType === 'dojíždění' && inputs.location.coords) {
    const distance = calculateDistance(inputs.location.coords, {
      lat: therapist.latitude,
      lon: therapist.longitude
    })
    const maxRadius = therapist.serviceRadiusKm || 25 // default 25km
    if (distance > maxRadius) {
      return false
    }
  }
  
  // 2. Barrier-free: if user chose "Ano" and meeting is on-site
  if (inputs.barrierFree && (inputs.meetingType === 'ordinace' || inputs.meetingType === 'dojíždění')) {
    if (!therapist.barrier_free) {
      return false
    }
  }
  
  // 3. Age capability: if ageGroup=child or senior, therapist explicitly supports that group
  if (inputs.ageGroup === 'child' || inputs.ageGroup === 'senior') {
    if (!therapist.ageGroups.includes(inputs.ageGroup)) {
      return false
    }
  }
  
  // 4. Gender preference: hard filter when strictGender is true AND genderPreference is not 'any'
  // When strictGender is false or undefined, gender preference is handled in soft scoring only
  if (inputs.strictGender === true && inputs.therapistGenderPref && inputs.therapistGenderPref !== 'any') {
    if (therapist.gender !== inputs.therapistGenderPref) {
      return false
    }
  }
  
  // 5. Therapist status: accepting new clients, active profile
  if (!therapist.acceptingNewClients || !therapist.activeProfile) {
    return false
  }
  
  return true
}

/**
 * C2) Scoring (0–100) — strong vs. soft signals
 */
function calculateMatchScore(therapist: Therapist, inputs: SearchInputs): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let totalScore = 0
  
  // Diagnosis/Issues match (40 points)
  let diagnosisScore = 0
  if (inputs.diagnosis.canonicalId) {
    // Exact diagnosis id (40)
    if (therapist.diagnoses.canonicalIds.includes(inputs.diagnosis.canonicalId)) {
      diagnosisScore = 40
      reasons.push(`specialista na ${inputs.diagnosis.canonicalId}`)
    }
    // Synonym/canonical (35)
    else if (inputs.diagnosis.synonyms && inputs.diagnosis.synonyms.some(syn => 
      therapist.diagnoses.synonyms.some(tSyn => normalizeText(tSyn) === normalizeText(syn))
    )) {
      diagnosisScore = 35
      reasons.push(`specialista na podobné diagnózy`)
    }
    // Category/body region (25)
    else if (inputs.diagnosis.category && therapist.diagnoses.categories.includes(inputs.diagnosis.category)) {
      diagnosisScore = 25
      reasons.push(`specialista na ${inputs.diagnosis.category}`)
    }
  }
  
  // If no diagnosis, use issues/body region only (up to 30)
  if (diagnosisScore === 0 && inputs.issues.length > 0) {
    const matchingIssues = inputs.issues.filter(issue =>
      therapist.issues.some(tIssue => normalizeText(tIssue) === normalizeText(issue))
    )
    if (matchingIssues.length > 0) {
      diagnosisScore = Math.min(30, matchingIssues.length * 10)
      reasons.push(`specialista na ${matchingIssues[0]}`)
    }
  }
  
  totalScore += diagnosisScore
  
  // Availability fit (15 points)
  let availabilityScore = 0
  if (therapist.nextAvailableSlot) {
    // Base score for having availability
    availabilityScore = 10
    
    // Boost if matches user's time window
    if (inputs.timeFit !== 'ASAP' && therapist.timeWindows.includes(inputs.timeFit)) {
      availabilityScore = 15
      reasons.push(`dostupný ${inputs.timeFit === 'evening' ? 'večer' : inputs.timeFit === 'weekend' ? 'o víkendu' : 'v pracovní dny'}`)
    } else if (inputs.timeFit === 'ASAP') {
      reasons.push('dostupný co nejdříve')
    }
  }
  totalScore += availabilityScore
  
  // Distance (15 points)
  let distanceScore = 0
  if (inputs.location.coords && inputs.meetingType !== 'online') {
    const distance = calculateDistance(inputs.location.coords, {
      lat: therapist.latitude,
      lon: therapist.longitude
    })
    // 15→0 points from 0–25 km linearly
    distanceScore = Math.max(0, 15 - (distance / 25) * 15)
    if (distanceScore > 0) {
      reasons.push(`${distance.toFixed(1)} km od tebe`)
    }
  } else if (inputs.meetingType === 'online') {
    // Online: ignore (15 points granted)
    distanceScore = 15
  }
  totalScore += distanceScore
  
  // Language match (10 points)
  let languageScore = 0
  if (inputs.language) {
    if (therapist.languages.includes(inputs.language)) {
      languageScore = 10
      const langNames: Record<string, string> = {
        'cs': 'česky',
        'en': 'anglicky',
        'de': 'německy',
        'sk': 'slovensky',
        'pl': 'polsky'
      }
      reasons.push(`mluví ${langNames[inputs.language] || inputs.language}`)
    }
  } else {
    // If language empty, neutral (0 points)
    languageScore = 0
  }
  totalScore += languageScore
  
  // Age specialization (5 points)
  let ageScore = 0
  if (therapist.ageGroups.includes(inputs.ageGroup)) {
    ageScore = 5
    const ageNames: Record<string, string> = {
      'child': 'dětský specialista',
      'adult': 'specialista pro dospělé',
      'senior': 'specialista pro seniory'
    }
    reasons.push(ageNames[inputs.ageGroup])
  }
  totalScore += ageScore
  
  // Gender preference (10 points for match, 0 for mismatch)
  let genderScore = 0
  if (inputs.therapistGenderPref !== 'any') {
    if (therapist.gender === inputs.therapistGenderPref) {
      genderScore = 10
      reasons.push(`terapeut ${inputs.therapistGenderPref === 'male' ? 'muž' : 'žena'}`)
    } else {
      genderScore = 0 // Explicit zero for mismatch
    }
  } else {
    genderScore = 5 // Neutral score when no preference
  }
  totalScore += genderScore
  
  // Insurance preference (5 points)
  let insuranceScore = 0
  if (inputs.wantsInsurance && therapist.acceptsInsurance) {
    insuranceScore = 5
    reasons.push('přijímá pojišťovnu')
  }
  totalScore += insuranceScore
  
  // Profile quality (5 points)
  let qualityScore = 0
  if (therapist.isVerified) qualityScore += 2
  if (therapist.reviewCount >= 3) qualityScore += 2
  if (therapist.hasPhotos) qualityScore += 1
  totalScore += qualityScore
  
  return { score: Math.min(100, totalScore), reasons: reasons.slice(0, 3) }
}

/**
 * C3) Tie-breakers (in order)
 */
// Tie-breaker works primarily with legacy Therapist shape; accept any to support mixed sources
function getTieBreakerScore(therapist: any, inputs: SearchInputs): number {
  let tieBreaker = 0
  
  // Higher availability score
  if (therapist.nextAvailableSlot) {
    tieBreaker += 1000
  }
  
  // Closer distance
  if (inputs.location.coords && inputs.meetingType !== 'online') {
    const distance = calculateDistance(inputs.location.coords, {
      lat: therapist.latitude,
      lon: therapist.longitude
    })
    tieBreaker += Math.max(0, 100 - distance) // closer = higher score
  }
  
  // More matching specialties
  const matchingSpecialties = inputs.issues.filter(issue =>
    therapist.issues.some((tIssue: string) => normalizeText(tIssue) === normalizeText(issue))
  ).length
  tieBreaker += matchingSpecialties * 10
  
  // More reviews
  tieBreaker += therapist.reviewCount
  
  return tieBreaker
}

/**
 * Main matching function
 */
export function matchTherapists(therapists: Therapist[], inputs: SearchInputs): TherapistMatch[] {
  const matches: TherapistMatch[] = []
  const debugEnabled = isDebugMode()
  
  // Log search inputs in debug mode
  if (debugEnabled) {
    console.group('🔍 Matching Engine Debug - Search Inputs')
    console.log('Location:', inputs.location)
    console.log('Meeting Type:', inputs.meetingType)
    console.log('Gender Preference:', inputs.therapistGenderPref, inputs.strictGender ? '(STRICT)' : '(soft)')
    console.log('Barrier-Free:', inputs.barrierFree)
    console.log('Age Group:', inputs.ageGroup)
    console.log('Language:', inputs.language)
    console.log('Issues:', inputs.issues)
    console.log('Diagnosis:', inputs.diagnosis)
    console.groupEnd()
    console.log(`\n📊 Processing ${therapists.length} therapists...\n`)
  }
  
  for (const therapist of therapists) {
    // Check hard filters (with detailed results for debugging)
    const hardFilters = debugEnabled ? checkHardFilters(therapist, inputs) : null
    const passedHardFilters = applyHardFilters(therapist, inputs)
    
    if (!passedHardFilters) {
      // Log why therapist was excluded (debug mode only)
      if (debugEnabled && hardFilters) {
        const scoreBreakdown = calculateScoreBreakdown(therapist, inputs)
        logTherapistDebug(therapist, inputs, hardFilters, scoreBreakdown, 0, false)
      }
      continue
    }
    
    // Calculate match score and reasons
    const { score, reasons } = calculateMatchScore(therapist, inputs)
    
    // Calculate distance
    let distanceKm = 0
    if (inputs.location.coords && inputs.meetingType !== 'online') {
      distanceKm = calculateDistance(inputs.location.coords, {
        lat: therapist.latitude,
        lon: therapist.longitude
      })
    }
    
    // Log debug info for included therapists
    if (debugEnabled && hardFilters) {
      const scoreBreakdown = calculateScoreBreakdown(therapist, inputs)
      logTherapistDebug(therapist, inputs, hardFilters, scoreBreakdown, score, true)
    }
    
    // Create match result
    const match: TherapistMatch = {
      therapist,
      match_score: score,
      reasons,
      next_available: therapist.nextAvailableSlot,
      distance_km: distanceKm,
      supports_insurance: therapist.acceptsInsurance,
      meeting_types: therapist.meetingTypes,
      languages: therapist.languages,
      age_supported: therapist.ageGroups
    }
    
    matches.push(match)
  }
  
  // Sort by match score (descending), then by tie-breakers
  matches.sort((a, b) => {
    if (b.match_score !== a.match_score) {
      return b.match_score - a.match_score
    }
    
    // Apply tie-breakers
    const tieBreakerA = getTieBreakerScore(a.therapist, inputs)
    const tieBreakerB = getTieBreakerScore(b.therapist, inputs)
    return tieBreakerB - tieBreakerA
  })
  
  // Log summary in debug mode
  if (debugEnabled) {
    console.log(`\n✅ Matching complete: ${matches.length} therapists included out of ${therapists.length} total\n`)
  }
  
  return matches
}

/**
 * Apply fallback logic for low results
 */
export function applyFallbackLogic(
  therapists: Therapist[], 
  inputs: SearchInputs, 
  minResults: number = 3
): { matches: TherapistMatch[]; fallbackUsed: boolean; fallbackLevel: string } {
  let matches = matchTherapists(therapists, inputs)
  let fallbackUsed = false
  let fallbackLevel = 'strict'
  
  if (matches.length >= minResults) {
    return { matches, fallbackUsed, fallbackLevel }
  }
  
  // Fallback 1: Allow online
  if (inputs.meetingType !== 'online') {
    const onlineInputs = { ...inputs, meetingType: 'online' as const }
    const onlineMatches = matchTherapists(therapists, onlineInputs)
    if (onlineMatches.length >= minResults) {
      return { matches: onlineMatches, fallbackUsed: true, fallbackLevel: 'online_fallback' }
    }
  }
  
  // Fallback 2: Ignore language preference
  if (inputs.language) {
    const noLanguageInputs = { ...inputs, language: undefined }
    const noLanguageMatches = matchTherapists(therapists, noLanguageInputs)
    if (noLanguageMatches.length >= minResults) {
      return { matches: noLanguageMatches, fallbackUsed: true, fallbackLevel: 'no_language' }
    }
  }
  
  // Fallback 3: Ignore insurance preference
  if (inputs.wantsInsurance) {
    const noInsuranceInputs = { ...inputs, wantsInsurance: false }
    const noInsuranceMatches = matchTherapists(therapists, noInsuranceInputs)
    if (noInsuranceMatches.length >= minResults) {
      return { matches: noInsuranceMatches, fallbackUsed: true, fallbackLevel: 'no_insurance' }
    }
  }
  
  // Fallback 4: Ignore barrier-free requirement
  if (inputs.barrierFree) {
    const noBarrierFreeInputs = { ...inputs, barrierFree: false }
    const noBarrierFreeMatches = matchTherapists(therapists, noBarrierFreeInputs)
    if (noBarrierFreeMatches.length >= minResults) {
      return { matches: noBarrierFreeMatches, fallbackUsed: true, fallbackLevel: 'no_barrier_free' }
    }
  }
  
  // Fallback 5: Ignore age group requirement
  if (inputs.ageGroup !== 'adult') {
    const adultInputs = { ...inputs, ageGroup: 'adult' as const }
    const adultMatches = matchTherapists(therapists, adultInputs)
    if (adultMatches.length >= minResults) {
      return { matches: adultMatches, fallbackUsed: true, fallbackLevel: 'adult_only' }
    }
  }
  
  // Return whatever we have
  return { matches, fallbackUsed, fallbackLevel }
}
