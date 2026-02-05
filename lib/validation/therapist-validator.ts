import { z } from "zod"
import { Therapist } from "@/lib/types/therapist"

// Enhanced therapist validator with fail-fast logic
export class TherapistDataValidator {
  private static instance: TherapistDataValidator
  private validationCache = new Map<string, boolean>()
  
  // Critical field validation schema - these MUST pass or import fails
  private criticalFieldsSchema = z.object({
    // Geographic coordinates - CRITICAL for location-based search
    latitude: z.number()
      .min(48.5, "CRITICAL: Latitude must be within Czech Republic bounds (min: 48.5)")
      .max(51.1, "CRITICAL: Latitude must be within Czech Republic bounds (max: 51.1)")
      .refine(val => !isNaN(val) && isFinite(val), "CRITICAL: Latitude must be a valid finite number"),
    
    longitude: z.number()
      .min(12.0, "CRITICAL: Longitude must be within Czech Republic bounds (min: 12.0)")
      .max(18.9, "CRITICAL: Longitude must be within Czech Republic bounds (max: 18.9)")
      .refine(val => !isNaN(val) && isFinite(val), "CRITICAL: Longitude must be a valid finite number"),
    
    // Practice type - CRITICAL for filtering
    practiceType: z.enum(['private', 'clinic', 'hospital', 'home_visits', 'online'], {
      required_error: "CRITICAL: Practice type is required",
      invalid_type_error: "CRITICAL: Practice type must be one of: private, clinic, hospital, home_visits, online"
    }),
    
    // Core identification - CRITICAL for uniqueness
    id: z.string()
      .min(1, "CRITICAL: Therapist ID is required")
      .max(100, "CRITICAL: Therapist ID too long")
      .regex(/^[a-zA-Z0-9_-]+$/, "CRITICAL: Therapist ID must contain only alphanumeric characters, hyphens, and underscores"),
    
    fullName: z.string()
      .min(1, "CRITICAL: Full name is required")
      .max(100, "CRITICAL: Full name too long")
      .regex(/^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s.-]+$/, "CRITICAL: Full name contains invalid characters"),
    
    city: z.string()
      .min(1, "CRITICAL: City is required")
      .max(100, "CRITICAL: City name too long")
      .regex(/^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s.-]+$/, "CRITICAL: City name contains invalid characters"),
    
    // Tags and specializations - CRITICAL for matching
    tags: z.array(z.string())
      .min(1, "CRITICAL: At least one tag is required for therapist matching")
      .max(50, "CRITICAL: Cannot have more than 50 tags")
      .refine(tags => tags.every(tag => tag.length >= 2 && tag.length <= 50), 
        "CRITICAL: Each tag must be between 2 and 50 characters"),
    
    specialties: z.array(z.string())
      .min(1, "CRITICAL: At least one specialty is required")
      .max(20, "CRITICAL: Cannot have more than 20 specialties")
      .refine(specs => specs.every(spec => spec.length >= 2 && spec.length <= 50), 
        "CRITICAL: Each specialty must be between 2 and 50 characters"),
    
    // Languages - CRITICAL for accessibility
    languages: z.array(z.string())
      .min(1, "CRITICAL: At least one language is required")
      .max(10, "CRITICAL: Cannot have more than 10 languages")
      .refine(langs => langs.every(lang => 
        ['cs', 'en', 'de', 'ru', 'uk', 'sk', 'fr', 'es', 'it', 'pl'].includes(lang)
      ), "CRITICAL: All languages must be valid language codes"),
    
    // Business logic - CRITICAL for operations
    acceptingNew: z.boolean({
      required_error: "CRITICAL: Accepting new patients status is required"
    }),
    
    yearsExperience: z.number()
      .int("CRITICAL: Years of experience must be an integer")
      .min(0, "CRITICAL: Years of experience cannot be negative")
      .max(50, "CRITICAL: Years of experience cannot exceed 50 years"),
    
    pricePerSession: z.number()
      .int("CRITICAL: Price per session must be an integer")
      .min(0, "CRITICAL: Price per session cannot be negative")
      .max(10000, "CRITICAL: Price per session cannot exceed 10,000 CZK")
  })
  
  // Warning field validation schema - these generate warnings but don't block import
  private warningFieldsSchema = z.object({
    bio: z.string()
      .max(2000, "WARNING: Bio cannot exceed 2000 characters")
      .optional(),
    
    profileImage: z.string()
      .url("WARNING: Profile image must be a valid URL")
      .optional(),
    
    email: z.string()
      .email("WARNING: Email format is invalid")
      .optional(),
    
    phone: z.string()
      .regex(/^[\+]?[0-9\s\-\(\)]{9,20}$/, "WARNING: Phone number format is invalid")
      .optional(),
    
    website: z.string()
      .url("WARNING: Website must be a valid URL")
      .optional(),
    
    rating: z.object({
      average: z.number()
        .min(0, "WARNING: Rating average cannot be negative")
        .max(5, "WARNING: Rating average cannot exceed 5.0")
        .refine(val => !isNaN(val), "WARNING: Rating average must be a valid number"),
      count: z.number()
        .int("WARNING: Rating count must be an integer")
        .min(0, "WARNING: Rating count cannot be negative")
        .max(10000, "WARNING: Rating count cannot exceed 10,000")
    }).optional(),
    
    nextAvailableDays: z.number()
      .int("WARNING: Next available days must be an integer")
      .min(0, "WARNING: Next available days cannot be negative")
      .max(365, "WARNING: Next available days cannot exceed 365")
      .nullable()
      .optional()
  })
  
  public static getInstance(): TherapistDataValidator {
    if (!TherapistDataValidator.instance) {
      TherapistDataValidator.instance = new TherapistDataValidator()
    }
    return TherapistDataValidator.instance
  }
  
  /**
   * Validate a single therapist record with fail-fast logic
   * Returns validation result with critical errors that block import
   */
  public validateTherapistRecord(therapist: any): TherapistValidationResult {
    const result: TherapistValidationResult = {
      success: false,
      criticalErrors: [],
      warnings: [],
      data: null
    }
    
    try {
      // Step 1: Validate critical fields first (fail-fast)
      const criticalValidation = this.criticalFieldsSchema.safeParse(therapist)
      
      if (!criticalValidation.success) {
        result.criticalErrors = criticalValidation.error.errors.map(e => 
          `${e.path.join('.')}: ${e.message}`
        )
        return result
      }
      
      // Step 2: Validate warning fields (non-blocking)
      const warningValidation = this.warningFieldsSchema.safeParse(therapist)
      
      if (!warningValidation.success) {
        result.warnings = warningValidation.error.errors.map(e => 
          `${e.path.join('.')}: ${e.message}`
        )
      }
      
      // Step 3: Additional business logic validations
      const businessWarnings = this.validateBusinessLogic(criticalValidation.data)
      result.warnings.push(...businessWarnings)
      
      // Step 4: Check for data quality issues
      const qualityWarnings = this.validateDataQuality(criticalValidation.data)
      result.warnings.push(...qualityWarnings)
      
      result.success = true
      result.data = criticalValidation.data as Therapist
      
      return result
      
    } catch (error) {
      result.criticalErrors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }
  
  /**
   * Validate multiple therapist records with fail-fast logic
   * Stops processing on first critical error
   */
  public validateTherapistRecords(therapists: any[], options: ValidationOptions = {}): BatchValidationResult {
    const result: BatchValidationResult = {
      success: false,
      validRecords: [],
      invalidRecords: [],
      warnings: [],
      summary: {
        total: therapists.length,
        valid: 0,
        invalid: 0,
        warnings: 0,
        criticalErrors: 0
      }
    }
    
    const { failFast = true, maxErrors = 10 } = options
    
    for (let i = 0; i < therapists.length; i++) {
      const therapist = therapists[i]
      const validation = this.validateTherapistRecord(therapist)
      
      if (validation.success) {
        result.validRecords.push({
          index: i,
          data: validation.data!,
          warnings: validation.warnings
        })
        result.summary.valid++
        result.summary.warnings += validation.warnings.length
      } else {
        result.invalidRecords.push({
          index: i,
          data: therapist,
          criticalErrors: validation.criticalErrors,
          warnings: validation.warnings
        })
        result.summary.invalid++
        result.summary.criticalErrors += validation.criticalErrors.length
        result.summary.warnings += validation.warnings.length
        
        // Fail fast if enabled and we've hit the error limit
        if (failFast && result.summary.criticalErrors >= maxErrors) {
          result.summary.total = i + 1 // Update total to reflect processed records
          break
        }
      }
    }
    
    result.success = result.summary.criticalErrors === 0
    return result
  }
  
  /**
   * Check for duplicate IDs in therapist records
   */
  public checkDuplicateIds(therapists: Therapist[]): DuplicateCheckResult {
    const seen = new Set<string>()
    const duplicates: string[] = []
    const unique: Therapist[] = []
    
    for (const therapist of therapists) {
      if (seen.has(therapist.id)) {
        duplicates.push(therapist.id)
      } else {
        seen.add(therapist.id)
        unique.push(therapist)
      }
    }
    
    return { duplicates, unique }
  }
  
  /**
   * Validate business logic rules
   */
  private validateBusinessLogic(therapist: any): string[] {
    const warnings: string[] = []
    
    // Check for suspicious data patterns
    if (therapist.yearsExperience > 40 && therapist.pricePerSession < 500) {
      warnings.push("WARNING: Low price for high experience - verify data accuracy")
    }
    
    if (therapist.rating && therapist.rating.count > 0 && therapist.rating.average < 2.0) {
      warnings.push("WARNING: Very low rating with reviews - verify data accuracy")
    }
    
    if (therapist.languages.length === 1 && !therapist.languages.includes('cs')) {
      warnings.push("WARNING: Therapist doesn't speak Czech - verify market relevance")
    }
    
    if (therapist.nextAvailableDays && therapist.nextAvailableDays > 90) {
      warnings.push("WARNING: Very long wait time - verify availability data")
    }
    
    // Check for unrealistic pricing
    if (therapist.pricePerSession > 5000) {
      warnings.push("WARNING: Very high price per session - verify pricing accuracy")
    }
    
    return warnings
  }
  
  /**
   * Validate data quality
   */
  private validateDataQuality(therapist: any): string[] {
    const warnings: string[] = []
    
    // Check for missing optional but important fields
    if (!therapist.bio || therapist.bio.trim().length < 10) {
      warnings.push("WARNING: Bio is missing or too short - consider adding description")
    }
    
    if (!therapist.email && !therapist.phone) {
      warnings.push("WARNING: No contact information provided")
    }
    
    if (!therapist.rating || therapist.rating.count === 0) {
      warnings.push("WARNING: No rating information available")
    }
    
    // Check for data consistency
    if (therapist.practiceType === 'online' && therapist.city !== 'online') {
      warnings.push("WARNING: Online practice should have city set to 'online'")
    }
    
    return warnings
  }
  
  /**
   * Generate comprehensive validation report
   */
  public generateValidationReport(therapists: any[]): ValidationReport {
    const validation = this.validateTherapistRecords(therapists, { failFast: false })
    const duplicateCheck = this.checkDuplicateIds(validation.validRecords.map(r => r.data))
    
    const criticalIssues: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    
    // Analyze critical issues
    if (validation.summary.criticalErrors > 0) {
      criticalIssues.push(`${validation.summary.criticalErrors} therapist records have critical validation errors`)
    }
    
    if (duplicateCheck.duplicates.length > 0) {
      criticalIssues.push(`${duplicateCheck.duplicates.length} duplicate therapist IDs found`)
    }
    
    // Analyze warnings
    if (validation.summary.warnings > 0) {
      warnings.push(`${validation.summary.warnings} warnings detected across all records`)
    }
    
    // Generate recommendations
    if (validation.summary.criticalErrors > validation.summary.valid * 0.1) {
      recommendations.push("High validation failure rate - review data quality processes")
    }
    
    if (validation.summary.warnings > validation.summary.valid * 0.2) {
      recommendations.push("Many warnings detected - consider data quality improvements")
    }
    
    if (duplicateCheck.duplicates.length > 0) {
      recommendations.push("Implement duplicate detection in data ingestion pipeline")
    }
    
    return {
      total: therapists.length,
      valid: validation.summary.valid,
      invalid: validation.summary.invalid,
      warningsCount: validation.summary.warnings,
      duplicates: duplicateCheck.duplicates.length,
      criticalIssues,
      warnings,
      recommendations,
      success: validation.success && duplicateCheck.duplicates.length === 0
    }
  }
}

// Type definitions
export interface TherapistValidationResult {
  success: boolean
  criticalErrors: string[]
  warnings: string[]
  data: Therapist | null
}

export interface BatchValidationResult {
  success: boolean
  validRecords: {
    index: number
    data: Therapist
    warnings: string[]
  }[]
  invalidRecords: {
    index: number
    data: any
    criticalErrors: string[]
    warnings: string[]
  }[]
  warnings: string[]
  summary: {
    total: number
    valid: number
    invalid: number
    warnings: number
    criticalErrors: number
  }
}

export interface ValidationOptions {
  failFast?: boolean
  maxErrors?: number
}

export interface DuplicateCheckResult {
  duplicates: string[]
  unique: Therapist[]
}

export interface ValidationReport {
  total: number
  valid: number
  invalid: number
  warningsCount: number
  duplicates: number
  criticalIssues: string[]
  warnings: string[]
  recommendations: string[]
  success: boolean
}

// Export singleton instance
export const therapistValidator = TherapistDataValidator.getInstance()
