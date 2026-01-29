// Enhanced therapist validation service using the strict schema
// This service provides comprehensive validation for Czech therapist data

import { 
  TherapistSchema, 
  validateTherapist, 
  validateTherapistBatch,
  checkDuplicateIds,
  generateValidationReport,
  type Therapist,
  type TherapistValidationResult,
  type BatchValidationResult
} from "@/lib/types/therapist-schema"

// Enhanced validation service with Czech-specific business rules
export class CzechTherapistValidator {
  private static instance: CzechTherapistValidator
  private validationCache = new Map<string, TherapistValidationResult>()
  
  public static getInstance(): CzechTherapistValidator {
    if (!CzechTherapistValidator.instance) {
      CzechTherapistValidator.instance = new CzechTherapistValidator()
    }
    return CzechTherapistValidator.instance
  }
  
  /**
   * Validate a single therapist record with Czech-specific business rules
   */
  public validateTherapistRecord(therapist: any): TherapistValidationResult {
    // Check cache first
    const cacheKey = JSON.stringify(therapist)
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!
    }
    
    // Perform validation
    const result = validateTherapist(therapist)
    
    // Add Czech-specific business rule validations
    if (result.success && result.data) {
      const czechWarnings = this.validateCzechBusinessRules(result.data)
      if (czechWarnings.length > 0) {
        result.warnings = [...(result.warnings || []), ...czechWarnings]
      }
    }
    
    // Cache result
    this.validationCache.set(cacheKey, result)
    
    return result
  }
  
  /**
   * Validate multiple therapist records with fail-fast option
   */
  public validateTherapistRecords(
    therapists: any[], 
    options: ValidationOptions = {}
  ): BatchValidationResult {
    const { failFast = false, maxErrors = 50 } = options
    
    const result: BatchValidationResult = {
      valid: [],
      invalid: [],
      warnings: [],
      summary: {
        total: therapists.length,
        valid: 0,
        invalid: 0,
        warnings: 0
      }
    }
    
    for (let i = 0; i < therapists.length; i++) {
      const therapist = therapists[i]
      const validation = this.validateTherapistRecord(therapist)
      
      if (validation.success && validation.data) {
        result.valid.push(validation.data)
        result.summary.valid++
        
        if (validation.warnings && validation.warnings.length > 0) {
          result.warnings.push({
            therapist: validation.data,
            warnings: validation.warnings
          })
          result.summary.warnings += validation.warnings.length
        }
      } else {
        result.invalid.push({
          therapist,
          errors: validation.errors || ['Unknown validation error']
        })
        result.summary.invalid++
        
        // Fail fast if enabled and we've hit the error limit
        if (failFast && result.summary.invalid >= maxErrors) {
          result.summary.total = i + 1 // Update total to reflect processed records
          break
        }
      }
    }
    
    return result
  }
  
  /**
   * Validate Czech-specific business rules
   */
  private validateCzechBusinessRules(therapist: Therapist): string[] {
    const warnings: string[] = []
    
    // Check for realistic pricing in Czech market
    if (therapist.pricePerSession < 300) {
      warnings.push("Price seems unusually low for Czech market - verify accuracy")
    }
    
    if (therapist.pricePerSession > 3000) {
      warnings.push("Price seems unusually high for Czech market - verify accuracy")
    }
    
    // Check for realistic experience vs pricing correlation
    if (therapist.yearsExperience < 2 && therapist.pricePerSession > 1000) {
      warnings.push("High price for low experience - verify pricing accuracy")
    }
    
    // Check for Czech language requirement
    if (!therapist.languages.includes('cs')) {
      warnings.push("Therapist doesn't speak Czech - may limit accessibility")
    }
    
    // Check for realistic availability
    if (therapist.nextAvailableDays && therapist.nextAvailableDays > 60) {
      warnings.push("Very long wait time - verify availability data")
    }
    
    // Check for online practice consistency
    if (therapist.practiceType === 'online' && therapist.city !== 'online') {
      warnings.push("Online practice should have city set to 'online'")
    }
    
    // Check for home visit radius consistency
    if (therapist.practiceType === 'home_visits' && (!therapist.homeVisitRadiusKm || therapist.homeVisitRadiusKm === 0)) {
      warnings.push("Home visit practice should specify visit radius")
    }
    
    // Check for insurance acceptance
    if (!therapist.insuranceAccepted || therapist.insuranceAccepted.length === 0) {
      warnings.push("No insurance companies specified - may limit accessibility")
    }
    
    // Check for contact information
    if (!therapist.email && !therapist.phone) {
      warnings.push("No contact information provided")
    }
    
    // Check for bio quality
    if (!therapist.bio || therapist.bio.trim().length < 20) {
      warnings.push("Bio is missing or too short - consider adding description")
    }
    
    // Check for rating consistency
    if (therapist.rating && therapist.rating.count > 0) {
      if (therapist.rating.average < 2.0) {
        warnings.push("Very low rating with reviews - verify data accuracy")
      }
      if (therapist.rating.count !== therapist.reviewsCount) {
        warnings.push("Rating count and reviews count mismatch")
      }
    }
    
    return warnings
  }
  
  /**
   * Validate geographic consistency
   */
  public validateGeographicConsistency(therapist: Therapist): string[] {
    const warnings: string[] = []
    
    // Check if coordinates are within the specified city bounds
    const cityBounds = this.getCityBounds(therapist.city)
    if (cityBounds) {
      if (therapist.latitude < cityBounds.minLat || therapist.latitude > cityBounds.maxLat) {
        warnings.push(`Latitude ${therapist.latitude} is outside typical bounds for ${therapist.city}`)
      }
      if (therapist.longitude < cityBounds.minLon || therapist.longitude > cityBounds.maxLon) {
        warnings.push(`Longitude ${therapist.longitude} is outside typical bounds for ${therapist.city}`)
      }
    }
    
    // Check if regions match city
    const expectedRegion = this.getExpectedRegion(therapist.city)
    if (expectedRegion && !therapist.regions.includes(expectedRegion)) {
      warnings.push(`City ${therapist.city} should be in region ${expectedRegion}`)
    }
    
    return warnings
  }
  
  /**
   * Get city bounds for validation
   */
  private getCityBounds(city: string): { minLat: number; maxLat: number; minLon: number; maxLon: number } | null {
    const bounds: Record<string, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
      'Praha': { minLat: 49.9, maxLat: 50.2, minLon: 14.2, maxLon: 14.7 },
      'Brno': { minLat: 49.1, maxLat: 49.3, minLon: 16.4, maxLon: 16.8 },
      'Ostrava': { minLat: 49.7, maxLat: 49.9, minLon: 18.1, maxLon: 18.4 },
      'Plzeň': { minLat: 49.7, maxLat: 49.8, minLon: 13.3, maxLon: 13.4 },
      'Liberec': { minLat: 50.7, maxLat: 50.8, minLon: 15.0, maxLon: 15.1 },
      'Olomouc': { minLat: 49.5, maxLat: 49.6, minLon: 17.2, maxLon: 17.3 },
      'České Budějovice': { minLat: 48.9, maxLat: 49.0, minLon: 14.4, maxLon: 14.5 },
      'Hradec Králové': { minLat: 50.2, maxLat: 50.3, minLon: 15.8, maxLon: 15.9 },
      'Pardubice': { minLat: 50.0, maxLat: 50.1, minLon: 15.7, maxLon: 15.8 },
      'Ústí nad Labem': { minLat: 50.6, maxLat: 50.7, minLon: 14.0, maxLon: 14.1 },
      'Zlín': { minLat: 49.2, maxLat: 49.3, minLon: 17.6, maxLon: 17.7 },
      'Jihlava': { minLat: 49.4, maxLat: 49.5, minLon: 15.5, maxLon: 15.6 },
      'Karlovy Vary': { minLat: 50.2, maxLat: 50.3, minLon: 12.8, maxLon: 12.9 },
      'Kladno': { minLat: 50.1, maxLat: 50.2, minLon: 14.1, maxLon: 14.2 },
      'Most': { minLat: 50.5, maxLat: 50.6, minLon: 13.6, maxLon: 13.7 },
      'Opava': { minLat: 49.9, maxLat: 50.0, minLon: 17.9, maxLon: 18.0 },
      'Frýdek-Místek': { minLat: 49.6, maxLat: 49.7, minLon: 18.3, maxLon: 18.4 },
      'Karviná': { minLat: 49.8, maxLat: 49.9, minLon: 18.5, maxLon: 18.6 },
      'Teplice': { minLat: 50.6, maxLat: 50.7, minLon: 13.8, maxLon: 13.9 },
      'Děčín': { minLat: 50.7, maxLat: 50.8, minLon: 14.2, maxLon: 14.3 },
      'Jablonec nad Nisou': { minLat: 50.7, maxLat: 50.8, minLon: 15.1, maxLon: 15.2 },
      'Mladá Boleslav': { minLat: 50.4, maxLat: 50.5, minLon: 14.9, maxLon: 15.0 },
      'Prostějov': { minLat: 49.4, maxLat: 49.5, minLon: 17.1, maxLon: 17.2 },
      'Přerov': { minLat: 49.4, maxLat: 49.5, minLon: 17.4, maxLon: 17.5 },
      'Česká Lípa': { minLat: 50.6, maxLat: 50.7, minLon: 14.5, maxLon: 14.6 },
      'Třebíč': { minLat: 49.2, maxLat: 49.3, minLon: 15.8, maxLon: 15.9 },
      'Třinec': { minLat: 49.6, maxLat: 49.7, minLon: 18.6, maxLon: 18.7 },
      'Kolín': { minLat: 50.0, maxLat: 50.1, minLon: 15.2, maxLon: 15.3 },
      'Tábor': { minLat: 49.4, maxLat: 49.5, minLon: 14.6, maxLon: 14.7 },
      'Znojmo': { minLat: 48.8, maxLat: 48.9, minLon: 16.0, maxLon: 16.1 },
      'Příbram': { minLat: 49.6, maxLat: 49.7, minLon: 14.0, maxLon: 14.1 }
    }
    
    return bounds[city] || null
  }
  
  /**
   * Get expected region for a city
   */
  private getExpectedRegion(city: string): string | null {
    const cityRegionMap: Record<string, string> = {
      'Praha': 'Praha',
      'Brno': 'Jihomoravský',
      'Ostrava': 'Moravskoslezský',
      'Plzeň': 'Plzeňský',
      'Liberec': 'Liberecký',
      'Olomouc': 'Olomoucký',
      'České Budějovice': 'Jihočeský',
      'Hradec Králové': 'Královéhradecký',
      'Pardubice': 'Pardubický',
      'Ústí nad Labem': 'Ústecký',
      'Zlín': 'Zlínský',
      'Jihlava': 'Vysočina',
      'Karlovy Vary': 'Karlovarský',
      'Kladno': 'Středočeský',
      'Most': 'Ústecký',
      'Opava': 'Moravskoslezský',
      'Frýdek-Místek': 'Moravskoslezský',
      'Karviná': 'Moravskoslezský',
      'Teplice': 'Ústecký',
      'Děčín': 'Ústecký',
      'Jablonec nad Nisou': 'Liberecký',
      'Mladá Boleslav': 'Středočeský',
      'Prostějov': 'Olomoucký',
      'Přerov': 'Olomoucký',
      'Česká Lípa': 'Liberecký',
      'Třebíč': 'Vysočina',
      'Třinec': 'Moravskoslezský',
      'Kolín': 'Středočeský',
      'Tábor': 'Jihočeský',
      'Znojmo': 'Jihomoravský',
      'Příbram': 'Středočeský'
    }
    
    return cityRegionMap[city] || null
  }
  
  /**
   * Check for duplicate IDs
   */
  public checkDuplicateIds(therapists: Therapist[]): {
    duplicates: string[]
    unique: Therapist[]
  } {
    return checkDuplicateIds(therapists)
  }
  
  /**
   * Generate comprehensive validation report
   */
  public generateValidationReport(therapists: any[]): {
    total: number
    valid: number
    invalid: number
    warnings: number
    duplicates: number
    summary: {
      criticalIssues: string[]
      warnings: string[]
      recommendations: string[]
    }
  } {
    return generateValidationReport(therapists)
  }
  
  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.validationCache.clear()
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.validationCache.size,
      hitRate: 0 // Would need to track hits/misses for accurate hit rate
    }
  }
}

// Type definitions
export interface ValidationOptions {
  failFast?: boolean
  maxErrors?: number
}

// Export singleton instance
export const czechTherapistValidator = CzechTherapistValidator.getInstance()

// Export types
export type { Therapist, TherapistValidationResult, BatchValidationResult }
