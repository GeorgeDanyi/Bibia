/**
 * Ambiguous input handler to prevent "0 results forever"
 * Part C: Guide users to correct ambiguous locations
 */

import { GeocodeResult, GeocodeError } from '@/lib/types/geocoding'
import { geocodingService } from './geocoding'
import { MAJOR_CZECH_CITIES } from '@/lib/types/geocoding'

export interface AmbiguousInputResult {
  isAmbiguous: boolean
  suggestions: string[]
  confidence: number
  originalInput: string
  possibleMatches: Array<{
    city: string
    confidence: number
    coordinates: { lat: number; lng: number }
  }>
}

export interface LocationGuidance {
  type: 'ambiguous' | 'not_found' | 'low_confidence' | 'invalid'
  message: string
  suggestions: string[]
  actions: Array<{
    label: string
    action: 'refine' | 'select' | 'map' | 'retry'
    data?: any
  }>
}

class AmbiguousInputHandler {
  private ambiguousPatterns = [
    // Common ambiguous patterns
    /^(město|city|town)$/i,
    /^(centrum|center|centre)$/i,
    /^(okres|district)$/i,
    /^(kraj|region)$/i,
    /^(čr|czech|republika)$/i,
    /^(praha|prague)$/i, // Can be ambiguous if user wants specific district
    /^(brno)$/i, // Can be ambiguous for specific areas
    /^(ostrava)$/i, // Can be ambiguous for specific areas
  ]

  private commonMisspellings: Record<string, string[]> = {
    'praha': ['Praha', 'Prague'],
    'prague': ['Praha', 'Prague'],
    'brno': ['Brno'],
    'ostrava': ['Ostrava'],
    'plzen': ['Plzeň', 'Pilsen'],
    'plzeň': ['Plzeň', 'Pilsen'],
    'liberec': ['Liberec'],
    'olomouc': ['Olomouc'],
    'ceske': ['České Budějovice', 'Český Krumlov'],
    'hradec': ['Hradec Králové'],
    'usti': ['Ústí nad Labem'],
    'pardubice': ['Pardubice'],
    'zlin': ['Zlín'],
    'karlovy': ['Karlovy Vary']
  }

  /**
   * Check if input is ambiguous and provide guidance
   */
  async handleAmbiguousInput(input: string): Promise<LocationGuidance | null> {
    const trimmedInput = input.trim().toLowerCase()

    // Check for ambiguous patterns
    if (this.isAmbiguousPattern(trimmedInput)) {
      return this.createAmbiguousGuidance(input, 'pattern')
    }

    // Check for very short inputs
    if (trimmedInput.length < 3) {
      return this.createAmbiguousGuidance(input, 'too_short')
    }

    // Check for multiple possible matches
    const possibleMatches = await this.findPossibleMatches(input)
    if (possibleMatches.length > 1) {
      return this.createMultipleMatchesGuidance(input, possibleMatches)
    }

    // Check for low confidence results
    const geocodeResult = await this.checkGeocodingConfidence(input)
    if (geocodeResult && geocodeResult.confidence < 0.6) {
      return this.createLowConfidenceGuidance(input, geocodeResult)
    }

    // Check for not found results
    if (possibleMatches.length === 0) {
      return this.createNotFoundGuidance(input)
    }

    return null // Not ambiguous
  }

  /**
   * Check if input matches ambiguous patterns
   */
  private isAmbiguousPattern(input: string): boolean {
    return this.ambiguousPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Find possible matches for input
   */
  private async findPossibleMatches(input: string): Promise<Array<{ city: string; confidence: number; coordinates: { lat: number; lng: number } }>> {
    const matches: Array<{ city: string; confidence: number; coordinates: { lat: number; lng: number } }> = []

    // Check major cities for partial matches
    for (const city of MAJOR_CZECH_CITIES) {
      const similarity = this.calculateSimilarity(input.toLowerCase(), city.toLowerCase())
      if (similarity > 0.6) {
        try {
          const response = await geocodingService.resolveUserLocation(city)
          if (response.success && response.result) {
            matches.push({
              city,
              confidence: similarity,
              coordinates: {
                lat: response.result.lat,
                lng: response.result.lng
              }
            })
          }
        } catch (error) {
          // Skip this city if geocoding fails
        }
      }
    }

    // Check for misspellings
    for (const [misspelling, corrections] of Object.entries(this.commonMisspellings)) {
      if (input.toLowerCase().includes(misspelling)) {
        for (const correction of corrections) {
          try {
            const response = await geocodingService.resolveUserLocation(correction)
            if (response.success && response.result) {
              matches.push({
                city: correction,
                confidence: 0.8, // High confidence for known misspellings
                coordinates: {
                  lat: response.result.lat,
                  lng: response.result.lng
                }
              })
            }
          } catch (error) {
            // Skip this correction if geocoding fails
          }
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Check geocoding confidence for input
   */
  private async checkGeocodingConfidence(input: string): Promise<GeocodeResult | null> {
    try {
      const response = await geocodingService.resolveUserLocation(input)
      if (response.success && response.result) {
        return response.result
      }
    } catch (error) {
      // Geocoding failed
    }
    return null
  }

  /**
   * Create guidance for ambiguous patterns
   */
  private createAmbiguousGuidance(input: string, reason: string): LocationGuidance {
    const suggestions = this.getSuggestionsForReason(reason)
    
    return {
      type: 'ambiguous',
      message: this.getAmbiguousMessage(reason),
      suggestions,
      actions: [
        {
          label: 'Vybrat z navrhovaných měst',
          action: 'select',
          data: { suggestions }
        },
        {
          label: 'Vybrat na mapě',
          action: 'map'
        },
        {
          label: 'Zkusit jiný název',
          action: 'refine'
        }
      ]
    }
  }

  /**
   * Create guidance for multiple possible matches
   */
  private createMultipleMatchesGuidance(input: string, matches: Array<{ city: string; confidence: number; coordinates: { lat: number; lng: number } }>): LocationGuidance {
    const suggestions = matches.slice(0, 5).map(match => match.city)
    
    return {
      type: 'ambiguous',
      message: `Nalezeno více možných měst pro "${input}". Vyberte prosím konkrétní město:`,
      suggestions,
      actions: [
        {
          label: 'Vybrat z navrhovaných měst',
          action: 'select',
          data: { suggestions, matches }
        },
        {
          label: 'Vybrat na mapě',
          action: 'map'
        },
        {
          label: 'Upřesnit název',
          action: 'refine'
        }
      ]
    }
  }

  /**
   * Create guidance for low confidence results
   */
  private createLowConfidenceGuidance(input: string, result: GeocodeResult): LocationGuidance {
    const suggestions = this.generateSuggestions(input)
    
    return {
      type: 'low_confidence',
      message: `Nalezená poloha "${result.normalizedLabel}" má nízkou přesnost (${Math.round(result.confidence * 100)}%). Doporučujeme upřesnit polohu.`,
      suggestions,
      actions: [
        {
          label: 'Použít nalezenou polohu',
          action: 'select',
          data: { result }
        },
        {
          label: 'Vybrat na mapě',
          action: 'map'
        },
        {
          label: 'Upřesnit název',
          action: 'refine'
        }
      ]
    }
  }

  /**
   * Create guidance for not found results
   */
  private createNotFoundGuidance(input: string): LocationGuidance {
    const suggestions = this.generateSuggestions(input)
    
    return {
      type: 'not_found',
      message: `Město "${input}" nebylo nalezeno. Zkuste zadat jiný název nebo vyberte z navrhovaných měst.`,
      suggestions,
      actions: [
        {
          label: 'Vybrat z navrhovaných měst',
          action: 'select',
          data: { suggestions }
        },
        {
          label: 'Vybrat na mapě',
          action: 'map'
        },
        {
          label: 'Zkusit jiný název',
          action: 'refine'
        }
      ]
    }
  }

  /**
   * Get suggestions based on reason
   */
  private getSuggestionsForReason(reason: string): string[] {
    switch (reason) {
      case 'pattern':
        return MAJOR_CZECH_CITIES.slice(0, 8)
      case 'too_short':
        return MAJOR_CZECH_CITIES.slice(0, 5)
      default:
        return MAJOR_CZECH_CITIES.slice(0, 5)
    }
  }

  /**
   * Get ambiguous message based on reason
   */
  private getAmbiguousMessage(reason: string): string {
    switch (reason) {
      case 'pattern':
        return 'Zadaný výraz je příliš obecný. Zkuste zadat konkrétní název města.'
      case 'too_short':
        return 'Zadaný název je příliš krátký. Zkuste zadat úplný název města.'
      default:
        return 'Zadaný výraz není jednoznačný. Zkuste zadat konkrétní název města.'
    }
  }

  /**
   * Generate suggestions for input
   */
  private generateSuggestions(input: string): string[] {
    const suggestions: string[] = []
    const inputLower = input.toLowerCase()

    // Check for partial matches with major cities
    for (const city of MAJOR_CZECH_CITIES) {
      if (city.toLowerCase().includes(inputLower) || inputLower.includes(city.toLowerCase())) {
        suggestions.push(city)
      }
    }

    // Check for misspellings
    for (const [misspelling, corrections] of Object.entries(this.commonMisspellings)) {
      if (inputLower.includes(misspelling)) {
        suggestions.push(...corrections)
      }
    }

    // Add some major cities if no matches found
    if (suggestions.length === 0) {
      suggestions.push(...MAJOR_CZECH_CITIES.slice(0, 5))
    }

    return [...new Set(suggestions)].slice(0, 8)
  }

  /**
   * Calculate string similarity
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance
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
}

// Export singleton instance
export const ambiguousInputHandler = new AmbiguousInputHandler()
