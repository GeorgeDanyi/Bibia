/**
 * Distance rings configuration and utilities for proximity-based scoring
 * Part C - Distance hooks implementation
 */

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Distance rings configuration in kilometers
 * Each ring represents a maximum distance threshold
 */
export const distanceRingsKm = [0, 10, 25, 50, 150] as const

/**
 * Human-readable labels for each distance ring
 */
export const distanceRingLabels = [
  'same city (0 km)',
  '≤10 km',
  '≤25 km', 
  '≤50 km',
  '>50 km'
] as const

/**
 * User preference for proximity-based matching
 */
export interface UserPreferences {
  preferCloser: boolean // default: true
}

/**
 * Default user preferences
 */
export const defaultUserPreferences: UserPreferences = {
  preferCloser: true
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  
  // Convert degrees to radians
  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180
  const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180
  const deltaLngRad = ((lng2 - lng1) * Math.PI) / 180
  
  // Haversine formula
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Determine which distance ring a given distance falls into
 * @param km Distance in kilometers
 * @param rings Distance ring thresholds (default: distanceRingsKm)
 * @returns Ring index (0-based), where 0 = same city, 1 = ≤10km, etc.
 */
export function ringForDistance(km: number, rings: readonly number[] = distanceRingsKm): number {
  for (let i = 0; i < rings.length; i++) {
    if (km <= rings[i]) {
      return i
    }
  }
  // If distance exceeds all rings, return the last ring index
  return rings.length - 1
}

/**
 * Get the label for a specific ring index
 * @param ringIndex Ring index (0-based)
 * @returns Human-readable label for the ring
 */
export function getRingLabel(ringIndex: number): string {
  if (ringIndex >= 0 && ringIndex < distanceRingLabels.length) {
    return distanceRingLabels[ringIndex]
  }
  return 'unknown distance'
}

/**
 * Future scoring input shape for proximity-based matching
 */
export interface ScoringInput {
  user: {
    city: string
    lat: number
    lng: number
    preferCloser: boolean
    conditions: string[]
    // Additional user properties can be added here
  }
  therapist: {
    city: string
    lat: number
    lng: number
    modalities: string[]
    conditions: string[]
    // Additional therapist properties can be added here
  }
}

/**
 * Proximity boost configuration
 * Higher values indicate better proximity scores
 */
const proximityBoostWeights = [1.0, 0.8, 0.6, 0.4, 0.2] as const

/**
 * Calculate proximity boost score based on distance ring
 * @param ringIndex Ring index (0-based)
 * @returns Numeric weight for proximity scoring
 */
export function proximityBoost(ringIndex: number): number {
  if (ringIndex >= 0 && ringIndex < proximityBoostWeights.length) {
    return proximityBoostWeights[ringIndex]
  }
  return 0.1 // Default low score for unknown distances
}

/**
 * Calculate distance and ring for two points
 * @param user User location
 * @param therapist Therapist location
 * @returns Object with distance in km and ring index
 */
export function calculateDistanceAndRing(user: LatLng, therapist: LatLng): {
  distanceKm: number
  ringIndex: number
  ringLabel: string
} {
  const distanceKm = haversineKm(user.lat, user.lng, therapist.lat, therapist.lng)
  const ringIndex = ringForDistance(distanceKm)
  const ringLabel = getRingLabel(ringIndex)
  
  return {
    distanceKm,
    ringIndex,
    ringLabel
  }
}

/**
 * Type for distance ring configuration
 */
export type DistanceRingConfig = {
  rings: readonly number[]
  labels: readonly string[]
  weights: readonly number[]
}

/**
 * Default distance ring configuration
 */
export const defaultDistanceRingConfig: DistanceRingConfig = {
  rings: distanceRingsKm,
  labels: distanceRingLabels,
  weights: proximityBoostWeights
}
