/**
 * Coordinate guarantee service
 * Part C: Ensure valid Prague/Ostrava inputs always carry coordinates in API calls
 */

import { GeocodeResult } from '@/lib/types/geocoding'
import { geocodingService } from './geocoding'
import { validateCoordinates } from '@/lib/validation/location'

export interface CoordinateGuaranteeResult {
  hasCoordinates: boolean
  coordinates?: { lat: number; lng: number }
  source: 'provided' | 'geocoded' | 'fallback' | 'failed'
  confidence: number
  normalizedLabel: string
  error?: string
}

export interface CityCoordinates {
  name: string
  lat: number
  lng: number
  confidence: number
}

class CoordinateGuaranteeService {
  // Pre-defined coordinates for major Czech cities
  private majorCityCoordinates: Record<string, CityCoordinates> = {
    'praha': { name: 'Praha', lat: 50.0755, lng: 14.4378, confidence: 1.0 },
    'prague': { name: 'Praha', lat: 50.0755, lng: 14.4378, confidence: 1.0 },
    'brno': { name: 'Brno', lat: 49.1951, lng: 16.6068, confidence: 1.0 },
    'ostrava': { name: 'Ostrava', lat: 49.8209, lng: 18.2625, confidence: 1.0 },
    'plzeň': { name: 'Plzeň', lat: 49.7437, lng: 13.3775, confidence: 1.0 },
    'plzen': { name: 'Plzeň', lat: 49.7437, lng: 13.3775, confidence: 1.0 },
    'pilsen': { name: 'Plzeň', lat: 49.7437, lng: 13.3775, confidence: 1.0 },
    'liberec': { name: 'Liberec', lat: 50.7663, lng: 15.0543, confidence: 1.0 },
    'olomouc': { name: 'Olomouc', lat: 49.5938, lng: 17.2509, confidence: 1.0 },
    'české budějovice': { name: 'České Budějovice', lat: 48.9745, lng: 14.4747, confidence: 1.0 },
    'hradec králové': { name: 'Hradec Králové', lat: 50.2104, lng: 15.8252, confidence: 1.0 },
    'ústí nad labem': { name: 'Ústí nad Labem', lat: 50.6602, lng: 14.0416, confidence: 1.0 },
    'pardubice': { name: 'Pardubice', lat: 50.0343, lng: 15.7812, confidence: 1.0 },
    'zlín': { name: 'Zlín', lat: 49.2264, lng: 17.6707, confidence: 1.0 },
    'karlovy vary': { name: 'Karlovy Vary', lat: 50.2305, lng: 12.8712, confidence: 1.0 }
  }

  /**
   * Guarantee coordinates for any valid input
   */
  async guaranteeCoordinates(input: string | { lat: number; lng: number }): Promise<CoordinateGuaranteeResult> {
    // If input is already coordinates, validate and return
    if (typeof input === 'object' && 'lat' in input && 'lng' in input) {
      const validation = validateCoordinates(input.lat, input.lng)
      if (validation.isValid) {
        return {
          hasCoordinates: true,
          coordinates: { lat: input.lat, lng: input.lng },
          source: 'provided',
          confidence: 1.0,
          normalizedLabel: `GPS Location (${input.lat.toFixed(4)}, ${input.lng.toFixed(4)})`
        }
      } else {
        return {
          hasCoordinates: false,
          source: 'failed',
          confidence: 0,
          normalizedLabel: 'Invalid coordinates',
          error: `Invalid coordinates: ${validation.errors.join(', ')}`
        }
      }
    }

    const inputString = input.toLowerCase().trim()

    // Check pre-defined major cities first
    const predefinedCity = this.majorCityCoordinates[inputString]
    if (predefinedCity) {
      return {
        hasCoordinates: true,
        coordinates: { lat: predefinedCity.lat, lng: predefinedCity.lng },
        source: 'fallback',
        confidence: predefinedCity.confidence,
        normalizedLabel: predefinedCity.name
      }
    }

    // Check for partial matches with major cities
    const partialMatch = this.findPartialMatch(inputString)
    if (partialMatch) {
      return {
        hasCoordinates: true,
        coordinates: { lat: partialMatch.lat, lng: partialMatch.lng },
        source: 'fallback',
        confidence: 0.9, // High confidence for partial matches
        normalizedLabel: partialMatch.name
      }
    }

    // Try geocoding service
    try {
      const geocodeResponse = await geocodingService.resolveUserLocation(input)
      
      if (geocodeResponse.success && geocodeResponse.result) {
        const result = geocodeResponse.result
        
        // Validate coordinates
        const coordValidation = validateCoordinates(result.lat, result.lng)
        if (coordValidation.isValid) {
          return {
            hasCoordinates: true,
            coordinates: { lat: result.lat, lng: result.lng },
            source: 'geocoded',
            confidence: result.confidence,
            normalizedLabel: result.normalizedLabel
          }
        } else {
          // Geocoding returned invalid coordinates, use fallback
          return this.getFallbackCoordinates(input)
        }
      } else {
        // Geocoding failed, use fallback
        return this.getFallbackCoordinates(input)
      }
    } catch (error) {
      // Geocoding service error, use fallback
      return this.getFallbackCoordinates(input)
    }
  }

  /**
   * Find partial match in major cities
   */
  private findPartialMatch(input: string): CityCoordinates | null {
    for (const [key, city] of Object.entries(this.majorCityCoordinates)) {
      if (key.includes(input) || input.includes(key)) {
        return city
      }
    }
    return null
  }

  /**
   * Get fallback coordinates (default to Prague)
   */
  private getFallbackCoordinates(input: string): CoordinateGuaranteeResult {
    const prague = this.majorCityCoordinates['praha']
    
    return {
      hasCoordinates: true,
      coordinates: { lat: prague.lat, lng: prague.lng },
      source: 'fallback',
      confidence: 0.3, // Low confidence for fallback
      normalizedLabel: `Praha (fallback pro "${input}")`,
      error: `Nepodařilo se najít souřadnice pro "${input}", použita Praha jako fallback`
    }
  }

  /**
   * Check if input is a major Czech city
   */
  isMajorCity(input: string): boolean {
    const normalizedInput = input.toLowerCase().trim()
    return normalizedInput in this.majorCityCoordinates
  }

  /**
   * Get coordinates for major city
   */
  getMajorCityCoordinates(input: string): CityCoordinates | null {
    const normalizedInput = input.toLowerCase().trim()
    return this.majorCityCoordinates[normalizedInput] || null
  }

  /**
   * Get all major city names
   */
  getMajorCityNames(): string[] {
    return Object.values(this.majorCityCoordinates).map(city => city.name)
  }

  /**
   * Validate that coordinates are guaranteed for search
   */
  async validateSearchInput(input: string | { lat: number; lng: number }): Promise<{
    isValid: boolean
    coordinates?: { lat: number; lng: number }
    error?: string
    warning?: string
  }> {
    const result = await this.guaranteeCoordinates(input)
    
    if (!result.hasCoordinates) {
      return {
        isValid: false,
        error: result.error || 'Nepodařilo se získat souřadnice pro vyhledávání'
      }
    }

    if (result.source === 'fallback' && result.confidence < 0.5) {
      return {
        isValid: true,
        coordinates: result.coordinates,
        warning: `Použity fallback souřadnice (${result.normalizedLabel}) s nízkou přesností`
      }
    }

    return {
      isValid: true,
      coordinates: result.coordinates
    }
  }
}

// Export singleton instance
export const coordinateGuaranteeService = new CoordinateGuaranteeService()
