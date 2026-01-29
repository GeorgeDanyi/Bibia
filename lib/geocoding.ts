/**
 * Legacy geocoding interface - now uses enhanced service
 * Part A: Maintain backward compatibility while using new error handling
 */

import { geocodingService } from '@/lib/services/geocoding'
import { validateCoordinates } from '@/lib/validation/location'

export interface UserLocation {
  lat: number
  lng: number
  source: 'gps' | 'geocode' | 'fallback'
  city?: string
  postalCode?: string
  confidence: number // 0-1 confidence score
  normalizedLabel: string // Standardized location label
}

/**
 * Legacy function for backward compatibility
 * Now uses enhanced geocoding service with proper error handling
 */
export async function resolveUserLocation(input: string | { lat: number; lng: number }): Promise<UserLocation> {
  // If input is coordinates, validate them first
  if (typeof input === 'object' && 'lat' in input && 'lng' in input) {
    const validation = validateCoordinates(input.lat, input.lng)
    if (!validation.isValid) {
      throw new Error(`Invalid coordinates: ${validation.errors.join(', ')}`)
    }
    
    return {
      lat: input.lat,
      lng: input.lng,
      source: 'gps',
      confidence: 1.0, // GPS coordinates are always high confidence
      normalizedLabel: `GPS Location (${input.lat.toFixed(4)}, ${input.lng.toFixed(4)})`
    }
  }

  // Use enhanced geocoding service
  const response = await geocodingService.resolveUserLocation(input)
  
  if (!response.success || !response.result) {
    // For backward compatibility, throw an error instead of returning fallback
    const errorMessage = response.error?.userMessage || 'Geocoding failed'
    throw new Error(errorMessage)
  }
  
  // Convert to legacy format
  const result: UserLocation = {
    lat: response.result.lat,
    lng: response.result.lng,
    source: response.result.source,
    city: response.result.city,
    postalCode: response.result.postalCode,
    confidence: response.result.confidence,
    normalizedLabel: response.result.normalizedLabel
  }
  
  return result
}

/**
 * Enhanced version that returns detailed response
 */
export async function resolveUserLocationWithDetails(input: string | { lat: number; lng: number }) {
  return await geocodingService.resolveUserLocation(input)
}

// Clear cache (useful for testing)
export function clearGeocodeCache(): void {
  geocodingService.clearCache()
}

// Get cache size (useful for monitoring)
export function getGeocodeCacheSize(): number {
  return geocodingService.getCacheStats().size
}

// Get cache statistics
export function getGeocodeCacheStats() {
  return geocodingService.getCacheStats()
}
