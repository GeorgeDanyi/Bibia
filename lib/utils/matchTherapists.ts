import { haversineKm } from './haversine'

interface Coordinates {
  lat: number
  lon: number
}

interface Therapist {
  id: string
  fullName: string
  city: string
  specialties: string[]
  insurance: string[]
  yearsExperience: number
  pricePerSession: number
  clinicLat: number
  clinicLon: number
  homeVisitRadiusKm?: number
  [key: string]: any
}

interface QuestionnaireAnswers {
  issueTags?: string[]
  diagnosisTags?: string[]
  timePrefs?: string[]
  weekdays?: string[]
  locationPreference?: string
  locationCoords?: Coordinates
  locationData?: {
    lat: number
    lon: number
  }
  [key: string]: any
}

interface TherapistMatch {
  therapist: Therapist
  matchScore: number // 0-100 based on issues/diagnoses/preferences
  distanceKm: number
  compositeScore: number // 0-1, higher is better
  matchReasons: string[]
}

// Normalize a value to 0-1 range (assuming input is 0-100)
function normalize(score: number): number {
  return Math.max(0, Math.min(1, score / 100))
}

// Normalize distance inversely (closer = higher score)
function normalizeInverse(distanceKm: number): number {
  return Math.max(0, Math.min(1, 1 - distanceKm / 50))
}

// Calculate match score based on issues, diagnoses, and preferences
function calculateMatchScore(therapist: Therapist, answers: QuestionnaireAnswers): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Base score for experience
  const experienceScore = Math.min(therapist.yearsExperience * 2, 20) // Max 20 points
  score += experienceScore
  if (experienceScore > 0) {
    reasons.push(`${therapist.yearsExperience} let zkušeností`)
  }

  // Specialization matching (40 points max)
  if (answers.issueTags && answers.issueTags.length > 0) {
    const matchingSpecs = therapist.specialties.filter(spec => 
      answers.issueTags!.some(tag => 
        spec.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(spec.toLowerCase())
      )
    )
    
    if (matchingSpecs.length > 0) {
      const specScore = Math.min(matchingSpecs.length * 15, 40)
      score += specScore
      reasons.push(`Specializace: ${matchingSpecs.join(', ')}`)
    }
  }

  // Diagnosis matching (20 points max)
  if (answers.diagnosisTags && answers.diagnosisTags.length > 0) {
    const matchingDiagnoses = therapist.specialties.filter(spec => 
      answers.diagnosisTags!.some(tag => 
        spec.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(spec.toLowerCase())
      )
    )
    
    if (matchingDiagnoses.length > 0) {
      const diagScore = Math.min(matchingDiagnoses.length * 10, 20)
      score += diagScore
      reasons.push(`Zkušenost s diagnózou: ${matchingDiagnoses.join(', ')}`)
    }
  }

  // Insurance matching (10 points)
  if (answers.insurancePreference && answers.insurancePreference !== 'private') {
    if (therapist.insurance.length > 0) {
      score += 10
      reasons.push('Přijímá pojišťovnu')
    }
  } else if (answers.insurancePreference === 'private') {
    score += 5 // Private therapists get some points
    reasons.push('Soukromá péče')
  }

  // Time preference matching (10 points)
  if (answers.timePrefs && answers.timePrefs.length > 0) {
    // This would need more detailed matching with therapist availability
    // For now, give points if therapist has availability
    score += 10
    reasons.push('Dostupný termín')
  }

  return { score: Math.min(score, 100), reasons } // Cap at 100
}

// Calculate distance from user to therapist
function calculateDistance(userCoords: Coordinates, therapist: Therapist): number {
  return haversineKm(userCoords, {
    lat: therapist.clinicLat,
    lon: therapist.clinicLon
  })
}

// Main matching function with composite scoring
export function findMatchingTherapists(
  therapists: Therapist[], 
  answers: QuestionnaireAnswers
): TherapistMatch[] {
  const matches: TherapistMatch[] = []

  for (const therapist of therapists) {
    // Calculate match score
    const { score: matchScore, reasons } = calculateMatchScore(therapist, answers)
    
    // Calculate distance
    let distanceKm = 0
    if (answers.locationCoords) {
      distanceKm = calculateDistance(answers.locationCoords, therapist)
    } else if (answers.locationData) {
      distanceKm = calculateDistance(answers.locationData, therapist)
    }

    // Calculate composite score
    const normalizedMatchScore = normalize(matchScore)
    const normalizedDistance = normalizeInverse(distanceKm)
    const compositeScore = 0.7 * normalizedMatchScore + 0.3 * normalizedDistance

    matches.push({
      therapist,
      matchScore,
      distanceKm,
      compositeScore,
      matchReasons: reasons
    })
  }

  // Sort by composite score (highest first)
  matches.sort((a, b) => b.compositeScore - a.compositeScore)

  return matches
}

// Get top matches
export function getTopMatches(
  therapists: Therapist[], 
  answers: QuestionnaireAnswers, 
  limit: number = 10
): TherapistMatch[] {
  const allMatches = findMatchingTherapists(therapists, answers)
  return allMatches.slice(0, limit)
}

// Filter therapists by location preference
export function filterByLocationPreference(
  therapists: Therapist[], 
  answers: QuestionnaireAnswers
): Therapist[] {
  if (!answers.locationPreference) {
    return therapists
  }

  return therapists.filter(therapist => {
    switch (answers.locationPreference) {
      case 'clinic':
        return true // All therapists can do clinic visits
      case 'home':
        return therapist.homeVisitRadiusKm && therapist.homeVisitRadiusKm > 0
      case 'online':
        return true // Assume all can do online
      case 'any':
        return true
      default:
        return true
    }
  })
}