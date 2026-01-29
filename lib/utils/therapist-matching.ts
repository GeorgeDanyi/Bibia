/**
 * Therapist Matching Logic for Four Visit Modes
 * Implements filtering, scoring, and ranking for clinic, home_visit, online, any
 */

import { TherapistExtended, UserAnswers, RankedTherapist, CityCoordinates } from '@/lib/types/therapist-extended'
import { CityService } from '@/lib/services/CityService'

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1: CityCoordinates, coord2: CityCoordinates): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Normalize city name to coordinates
 */
function normalizeCity(cityName: string): CityCoordinates | null {
  try {
    const resolution = CityService.resolve(cityName)
    if (resolution) {
      return { lat: resolution.lat, lng: resolution.lng }
    }
    return null
  } catch (error) {
    console.error('City normalization failed:', error)
    return null
  }
}

/**
 * Convert legacy therapist data to extended format
 */
function convertToExtendedTherapist(legacyTherapist: any): TherapistExtended {
  // Map legacy practiceType to new visit mode fields
  const practiceType = legacyTherapist.practiceType || 'private'
  
  let offersClinic = false
  let offersHomeVisit = { enabled: false, radiusKm: 0 }
  let offersOnline = false
  
  switch (practiceType) {
    case 'clinic':
    case 'hospital':
      offersClinic = true
      break
    case 'home_visits':
      offersHomeVisit = {
        enabled: true,
        radiusKm: legacyTherapist.homeVisitRadiusKm || 25
      }
      break
    case 'online':
      offersOnline = true
      break
    case 'private':
      // Private practices typically offer clinic visits
      offersClinic = true
      // Some may also offer home visits
      if (legacyTherapist.homeVisitRadiusKm) {
        offersHomeVisit = {
          enabled: true,
          radiusKm: legacyTherapist.homeVisitRadiusKm
        }
      }
      break
  }
  
  return {
    ...legacyTherapist,
    lat: legacyTherapist.latitude,
    lng: legacyTherapist.longitude,
    offersClinic,
    offersHomeVisit,
    offersOnline
  }
}

/**
 * Filter therapists by visit mode
 */
function filterByVisitMode(therapists: TherapistExtended[], visitMode: string): TherapistExtended[] {
  switch (visitMode) {
    case 'clinic':
      return therapists.filter(t => t.offersClinic)
    
    case 'home_visit':
      return therapists.filter(t => t.offersHomeVisit.enabled)
    
    case 'online':
      return therapists.filter(t => t.offersOnline)
    
    case 'any':
      return therapists // No filtering for 'any'
    
    default:
      return therapists
  }
}

/**
 * Filter therapists by distance for home visits
 */
function filterByDistance(
  therapists: TherapistExtended[], 
  userCoords: CityCoordinates, 
  visitMode: string
): TherapistExtended[] {
  if (visitMode !== 'home_visit') {
    return therapists
  }
  
  return therapists.filter(therapist => {
    const distance = calculateDistance(userCoords, { lat: therapist.lat, lng: therapist.lng })
    return distance <= therapist.offersHomeVisit.radiusKm
  })
}

/**
 * Calculate visit mode match score
 */
function getVisitModeScore(therapist: TherapistExtended, visitMode: string): number {
  switch (visitMode) {
    case 'clinic':
      return therapist.offersClinic ? 3 : 0
    
    case 'home_visit':
      return therapist.offersHomeVisit.enabled ? 4 : 0
    
    case 'online':
      return therapist.offersOnline ? 3 : 0
    
    case 'any':
      // For 'any', give points based on what they offer
      let score = 0
      if (therapist.offersClinic) score += 1
      if (therapist.offersHomeVisit.enabled) score += 1
      if (therapist.offersOnline) score += 1
      return Math.min(score, 2) // Cap at 2 for 'any' mode
    
    default:
      return 0
  }
}

/**
 * Calculate proximity score based on distance
 */
function getProximityScore(distanceKm: number): number {
  if (distanceKm <= 10) return 3
  if (distanceKm <= 25) return 2
  if (distanceKm <= 50) return 1
  return 0
}

/**
 * Calculate total score for a therapist
 */
function calculateScore(
  therapist: TherapistExtended, 
  userCoords: CityCoordinates, 
  visitMode: string
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  
  // Visit mode match score
  const visitModeScore = getVisitModeScore(therapist, visitMode)
  score += visitModeScore
  
  if (visitModeScore > 0) {
    switch (visitMode) {
      case 'clinic':
        reasons.push('Ordinace')
        break
      case 'home_visit':
        reasons.push('Domácí návštěvy')
        break
      case 'online':
        reasons.push('Online konzultace')
        break
      case 'any':
        reasons.push('Dostupná péče')
        break
    }
  }
  
  // Proximity score (only for clinic and home_visit modes)
  if (visitMode === 'clinic' || visitMode === 'home_visit') {
    const distance = calculateDistance(userCoords, { lat: therapist.lat, lng: therapist.lng })
    const proximityScore = getProximityScore(distance)
    score += proximityScore
    
    if (proximityScore > 0) {
      reasons.push(`${distance.toFixed(1)} km`)
    }
  }
  
  // Additional scoring factors
  if (therapist.acceptingNew) {
    score += 1
    reasons.push('Přijímá nové klienty')
  }
  
  if (therapist.isVerified) {
    score += 1
    reasons.push('Ověřený terapeut')
  }
  
  return { score, reasons }
}

/**
 * Main ranking function
 */
export function rankTherapists(
  userAnswers: UserAnswers, 
  therapists: any[]
): RankedTherapist[] {
  // Normalize user city to coordinates
  const userCoords = normalizeCity(userAnswers.city)
  if (!userCoords) {
    console.error('Failed to normalize user city:', userAnswers.city)
    return []
  }
  
  // Convert legacy therapists to extended format
  const extendedTherapists = therapists.map(convertToExtendedTherapist)
  
  // Filter by visit mode
  let filteredTherapists = filterByVisitMode(extendedTherapists, userAnswers.visitMode)
  
  // Filter by distance for home visits
  filteredTherapists = filterByDistance(filteredTherapists, userCoords, userAnswers.visitMode)
  
  // Calculate scores and create ranked results
  const rankedResults: RankedTherapist[] = filteredTherapists.map(therapist => {
    const distance = calculateDistance(userCoords, { lat: therapist.lat, lng: therapist.lng })
    const { score, reasons } = calculateScore(therapist, userCoords, userAnswers.visitMode)
    
    return {
      therapist,
      score,
      distanceKm: distance,
      matchReasons: reasons
    }
  })
  
  // Sort by score (descending), then by distance (ascending) for stable sorting
  rankedResults.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.distanceKm - b.distanceKm
  })
  
  return rankedResults
}

/**
 * Load and rank therapists from test dataset
 */
export async function loadAndRankTherapists(userAnswers: UserAnswers): Promise<RankedTherapist[]> {
  try {
    // Load the test dataset
    const fs = await import('fs')
    const path = await import('path')
    
    const dataPath = path.join(process.cwd(), 'data', 'fake-therapists-complete.json')
    const data = fs.readFileSync(dataPath, 'utf8')
    const therapists = JSON.parse(data)
    
    return rankTherapists(userAnswers, therapists)
  } catch (error) {
    console.error('Failed to load therapists:', error)
    return []
  }
}
