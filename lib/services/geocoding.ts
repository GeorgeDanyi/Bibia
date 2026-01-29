/**
 * Enhanced geocoding service with comprehensive error handling
 * Part A: Eliminate silent failures and provide actionable feedback
 */

import { 
  GeocodeResult, 
  GeocodeError, 
  GeocodeResponse, 
  GeocodeServiceConfig, 
  DEFAULT_GEOCODE_CONFIG,
  CZECH_BOUNDS,
  MAJOR_CZECH_CITIES
} from '@/lib/types/geocoding'
import { 
  validateLocationInput, 
  validateCoordinates, 
  generateLocationSuggestions,
  sanitizeLocationInput 
} from '@/lib/validation/location'
import { loadPlaces, searchPlaces } from '@/lib/data/cz-places'
import { geocodingLogger } from './geocoding-logger'

// Cache for geocoding results with metadata
interface CachedResult {
  result: GeocodeResult
  timestamp: number
  confidence: 'high' | 'medium' | 'low'
}

const geocodeCache = new Map<string, CachedResult>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export class GeocodingService {
  private config: GeocodeServiceConfig

  constructor(config: Partial<GeocodeServiceConfig> = {}) {
    this.config = { ...DEFAULT_GEOCODE_CONFIG, ...config }
  }

  /**
   * Resolve user location with comprehensive error handling
   */
  async resolveUserLocation(
    input: string | { lat: number; lng: number }
  ): Promise<GeocodeResponse> {
    try {
      // Handle coordinate input
      if (typeof input === 'object' && 'lat' in input && 'lng' in input) {
        return this.handleCoordinateInput(input.lat, input.lng)
      }

      // Handle string input
      return this.handleStringInput(input)
    } catch (error) {
      console.error('Geocoding service error:', error)
      return this.createErrorResponse('service', 'Internal geocoding service error', error)
    }
  }

  /**
   * Handle coordinate input with validation
   */
  private handleCoordinateInput(lat: number, lng: number): GeocodeResponse {
    const validation = validateCoordinates(lat, lng)
    
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          type: 'bounds',
          message: `Invalid coordinates: ${validation.errors.join(', ')}`,
          userMessage: 'Zadané souřadnice jsou mimo Českou republiku. Zkuste zadat název města.',
          actionable: true,
          suggestions: MAJOR_CZECH_CITIES.slice(0, 5)
        }
      }
    }

    const result: GeocodeResult = {
      lat,
      lng,
      source: 'gps',
      confidence: 1.0, // GPS coordinates are always high confidence
      normalizedLabel: `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    }

    return {
      success: true,
      result,
      warnings: validation.warnings
    }
  }

  /**
   * Handle string input with validation and geocoding
   */
  private async handleStringInput(input: string): Promise<GeocodeResponse> {
    // Validate input
    const validation = validateLocationInput(input)
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: `Invalid input: ${validation.errors.join(', ')}`,
          userMessage: 'Neplatný vstup. Zkuste zadat název města v České republice.',
          actionable: true,
          suggestions: generateLocationSuggestions(input),
          originalInput: input
        }
      }
    }

    const sanitizedInput = validation.sanitizedInput!
    
    // Check cache first
    const cacheKey = sanitizedInput.toLowerCase()
    const cached = this.getCachedResult(cacheKey)
    if (cached) {
      return {
        success: true,
        result: cached,
        warnings: validation.warnings
      }
    }

    // Try geocoding with fallback strategy
    const response = await this.performGeocoding(sanitizedInput)
    
    if (response.success && response.result) {
      // Cache successful result with discrete confidence bucket
      const c = response.result.confidence
      const confidenceBucket: 'high' | 'medium' | 'low' =
        c >= 0.8 ? 'high' : c >= 0.5 ? 'medium' : 'low'
      this.cacheResult(cacheKey, response.result, confidenceBucket)
    }

    return {
      ...response,
      warnings: [...(response.warnings || []), ...validation.warnings]
    }
  }

  /**
   * Perform geocoding with fallback strategy
   */
  private async performGeocoding(input: string): Promise<GeocodeResponse> {
    // Try external service first (if enabled)
    if (this.config.enableMapbox) {
      const mapboxResult = await this.tryMapboxGeocoding(input)
      if (mapboxResult.success) {
        return mapboxResult
      }
    }

    // Try local fallback (if enabled)
    if (this.config.enableLocalFallback) {
      const localResult = await this.tryLocalGeocoding(input)
      if (localResult.success) {
        return localResult
      }
    }

    // No results found
    return {
      success: false,
      error: {
        type: 'not_found',
        message: `No location found for: ${input}`,
        userMessage: `Nepodařilo se najít město "${input}". Zkuste zadat jiné město nebo použijte mapu.`,
        actionable: true,
        suggestions: generateLocationSuggestions(input),
        originalInput: input
      }
    }
  }

  /**
   * Try Mapbox geocoding service
   */
  private async tryMapboxGeocoding(input: string): Promise<GeocodeResponse> {
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(input)}`, {
        signal: AbortSignal.timeout(this.config.timeoutMs)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const results = await response.json()
      
      if (!results || results.length === 0) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'No results from Mapbox service',
            userMessage: 'Mapbox služba nenašla žádné výsledky.',
            actionable: true,
            originalInput: input
          }
        }
      }

      const result = results[0]
      const confidence = this.determineConfidence(result, input)
      const normalizedLabel = this.createNormalizedLabel(result)
      
      const geocodeResult: GeocodeResult = {
        lat: result.lat,
        lng: result.lon,
        source: 'geocode',
        city: result.city,
        postalCode: result.postalCode,
        confidence,
        normalizedLabel,
        originalInput: input
      }

      // Log low confidence results
      if (this.config.enableLogging && confidence < this.config.confidenceThreshold) {
        geocodingLogger.logLowConfidence(input, geocodeResult, confidence, 'mapbox')
      }

      // Validate coordinates if bounds checking is enabled
      if (this.config.enableBoundsValidation) {
        const coordValidation = validateCoordinates(geocodeResult.lat, geocodeResult.lng)
        if (!coordValidation.isValid) {
          return {
            success: false,
            error: {
              type: 'bounds',
              message: `Coordinates outside Czech Republic: ${coordValidation.errors.join(', ')}`,
              userMessage: 'Nalezené souřadnice jsou mimo Českou republiku.',
              actionable: true,
              suggestions: MAJOR_CZECH_CITIES.slice(0, 5),
              originalInput: input
            }
          }
        }
      }

      return {
        success: true,
        result: geocodeResult
      }

    } catch (error) {
      console.warn('Mapbox geocoding failed:', error)
      return {
        success: false,
        error: {
          type: 'service',
          message: `Mapbox service error: ${error}`,
          userMessage: 'Externí geocoding služba není dostupná. Zkouším lokální data.',
          actionable: false,
          originalInput: input
        }
      }
    }
  }

  /**
   * Try local Czech places geocoding
   */
  private async tryLocalGeocoding(input: string): Promise<GeocodeResponse> {
    try {
      const places = await loadPlaces()
      const matches = searchPlaces(input, places)
      
      if (!matches || matches.length === 0) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'No matches in local Czech places data',
            userMessage: 'Město nebylo nalezeno v lokálních datech.',
            actionable: true,
            suggestions: generateLocationSuggestions(input),
            originalInput: input
          }
        }
      }

      const place = matches[0]
      const confidence = this.determineLocalConfidence(place, input)
      const normalizedLabel = this.createNormalizedLabel(place)
      
      const result: GeocodeResult = {
        lat: place.lat,
        lng: place.lon,
        source: 'geocode',
        city: place.name,
        postalCode: place.zip,
        confidence,
        normalizedLabel,
        originalInput: input
      }

      // Log low confidence results
      if (this.config.enableLogging && confidence < this.config.confidenceThreshold) {
        geocodingLogger.logLowConfidence(input, result, confidence, 'local')
      }

      return {
        success: true,
        result
      }

    } catch (error) {
      console.error('Local geocoding failed:', error)
      return {
        success: false,
        error: {
          type: 'service',
          message: `Local geocoding error: ${error}`,
          userMessage: 'Lokální geocoding služba selhala.',
          actionable: false,
          originalInput: input
        }
      }
    }
  }

  /**
   * Determine confidence score for Mapbox results (0-1)
   */
  private determineConfidence(result: any, input: string): number {
    const inputLower = input.toLowerCase().trim()
    const cityLower = (result.city || '').toLowerCase().trim()
    const labelLower = (result.label || '').toLowerCase().trim()
    
    // Exact match with city name
    if (cityLower === inputLower) {
      return 0.95
    }
    
    // Exact match with full label
    if (labelLower === inputLower) {
      return 0.90
    }
    
    // City name contains input
    if (cityLower.includes(inputLower)) {
      return 0.80
    }
    
    // Input contains city name
    if (inputLower.includes(cityLower)) {
      return 0.75
    }
    
    // Label contains input
    if (labelLower.includes(inputLower)) {
      return 0.70
    }
    
    // Input contains label
    if (inputLower.includes(labelLower)) {
      return 0.65
    }
    
    // Partial match (fuzzy)
    const similarity = this.calculateSimilarity(inputLower, cityLower)
    if (similarity > 0.8) {
      return 0.60
    }
    
    if (similarity > 0.6) {
      return 0.45
    }
    
    // Very low confidence
    return 0.30
  }

  /**
   * Determine confidence score for local results (0-1)
   */
  private determineLocalConfidence(place: any, input: string): number {
    const inputLower = input.toLowerCase().trim()
    const nameLower = place.name.toLowerCase().trim()
    
    // Exact match
    if (nameLower === inputLower) {
      return 0.90
    }
    
    // Name contains input
    if (nameLower.includes(inputLower)) {
      return 0.80
    }
    
    // Input contains name
    if (inputLower.includes(nameLower)) {
      return 0.75
    }
    
    // Partial match (fuzzy)
    const similarity = this.calculateSimilarity(inputLower, nameLower)
    if (similarity > 0.8) {
      return 0.60
    }
    
    if (similarity > 0.6) {
      return 0.45
    }
    
    // Very low confidence
    return 0.30
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Create normalized label for geocoding result
   */
  private createNormalizedLabel(result: any): string {
    // For Mapbox results
    if (result.label) {
      return result.label
    }
    
    // For local results
    if (result.name) {
      const parts = [result.name]
      if (result.zip) {
        parts.push(result.zip)
      }
      parts.push('Czech Republic')
      return parts.join(', ')
    }
    
    // Fallback
    return 'Unknown Location'
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    type: GeocodeError['type'], 
    message: string, 
    error?: any
  ): GeocodeResponse {
    return {
      success: false,
      error: {
        type,
        message,
        userMessage: this.getUserFriendlyMessage(type),
        actionable: type !== 'service',
        originalInput: error?.originalInput
      }
    }
  }

  /**
   * Get user-friendly error messages
   */
  private getUserFriendlyMessage(type: GeocodeError['type']): string {
    const messages = {
      validation: 'Neplatný vstup. Zkuste zadat název města.',
      network: 'Problém s připojením. Zkuste to znovu.',
      service: 'Služba není dostupná. Zkuste to později.',
      not_found: 'Město nebylo nalezeno. Zkuste jiný název.',
      ambiguous: 'Nalezeno více měst. Buďte prosím konkrétnější.',
      bounds: 'Místo je mimo Českou republiku.'
    }
    
    return messages[type] || 'Nastala neočekávaná chyba.'
  }

  /**
   * Cache management
   */
  private getCachedResult(key: string): GeocodeResult | null {
    const cached = geocodeCache.get(key)
    if (!cached) return null
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      geocodeCache.delete(key)
      return null
    }
    
    return cached.result
  }

  private cacheResult(key: string, result: GeocodeResult, confidence: 'high' | 'medium' | 'low'): void {
    geocodeCache.set(key, {
      result,
      timestamp: Date.now(),
      confidence
    })
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    geocodeCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number; confidence: string }> } {
    const now = Date.now()
    const entries = Array.from(geocodeCache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
      confidence: value.confidence
    }))
    
    return {
      size: geocodeCache.size,
      entries
    }
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()

// Export legacy function for backward compatibility
export async function resolveUserLocation(input: string | { lat: number; lng: number }): Promise<GeocodeResult> {
  const response = await geocodingService.resolveUserLocation(input)
  
  if (!response.success || !response.result) {
    // For backward compatibility, throw an error instead of returning fallback
    throw new Error(response.error?.userMessage || 'Geocoding failed')
  }
  
  return response.result
}
