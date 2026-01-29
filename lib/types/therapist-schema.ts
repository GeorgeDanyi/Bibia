// Strict TypeScript schema for Czech therapist data
// This schema defines the complete structure for therapist records in the Bibia platform

import { z } from "zod"
import { 
  CITIES, 
  REGIONS, 
  MODALITIES, 
  WORKS_WITH, 
  LANGUAGES, 
  DIAGNOSES,
  ISSUES,
  type CityType,
  type RegionType,
  type ModalityType,
  type WorksWithType,
  type LanguageType,
  type DiagnosisType,
  type IssueType
} from "@/lib/constants/taxonomy"

// Czech insurance companies
export const INSURANCE_COMPANIES = [
  "VZP",      // Všeobecná zdravotní pojišťovna
  "ZPMV",     // Zdravotní pojišťovna ministerstva vnitra
  "OZP",      // Oborová zdravotní pojišťovna
  "RBP",      // Revírní bratrská pokladna
  "VOZP",     // Vojenská zdravotní pojišťovna
  "CPZP",     // Česká průmyslová zdravotní pojišťovna
  "ZPŠ",      // Zdravotní pojišťovna Škoda
  "ZP MV ČR", // Zdravotní pojišťovna ministerstva vnitra ČR
] as const

export type InsuranceCompanyType = typeof INSURANCE_COMPANIES[number]

// Practice types with Czech context
export const PRACTICE_TYPES = [
  "private",     // Soukromá praxe
  "clinic",      // Klinika/ambulance
  "hospital",    // Nemocnice
  "home_visits", // Domácí návštěvy
  "online"       // Online terapie
] as const

export type PracticeType = typeof PRACTICE_TYPES[number]

// Working hours schema
export const WorkingHoursSchema = z.object({
  morning: z.boolean().describe("Works 7:00-11:00"),
  midday: z.boolean().describe("Works 11:00-15:00"), 
  evening: z.boolean().describe("Works 15:00-19:00"),
  weekend: z.boolean().describe("Works weekends")
})

// Rating schema
export const RatingSchema = z.object({
  average: z.number()
    .min(0, "Rating cannot be negative")
    .max(5, "Rating cannot exceed 5.0")
    .refine(val => Number(val.toFixed(1)) === val, "Rating must have max 1 decimal place"),
  count: z.number()
    .int("Rating count must be an integer")
    .min(0, "Rating count cannot be negative")
    .max(10000, "Rating count cannot exceed 10,000")
})

// Price range schema
export const PriceRangeSchema = z.object({
  minCZK: z.number()
    .int("Price must be an integer")
    .min(0, "Price cannot be negative")
    .max(10000, "Price cannot exceed 10,000 CZK"),
  maxCZK: z.number()
    .int("Price must be an integer")
    .min(0, "Price cannot be negative")
    .max(10000, "Price cannot exceed 10,000 CZK")
}).refine(data => data.minCZK <= data.maxCZK, {
  message: "Minimum price must be less than or equal to maximum price",
  path: ["maxCZK"]
})

// Geographic coordinates with Czech Republic bounds
export const CoordinatesSchema = z.object({
  latitude: z.number()
    .min(48.5, "Latitude must be within Czech Republic bounds (min: 48.5)")
    .max(51.1, "Latitude must be within Czech Republic bounds (max: 51.1)")
    .refine(val => !isNaN(val) && isFinite(val), "Latitude must be a valid finite number"),
  longitude: z.number()
    .min(12.0, "Longitude must be within Czech Republic bounds (min: 12.0)")
    .max(18.9, "Longitude must be within Czech Republic bounds (max: 18.9)")
    .refine(val => !isNaN(val) && isFinite(val), "Longitude must be a valid finite number")
})

// Czech phone number validation
export const CzechPhoneSchema = z.string()
  .regex(/^(\+420\s?)?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}$/, "Invalid Czech phone number format")
  .optional()

// Czech email validation
export const CzechEmailSchema = z.string()
  .email("Invalid email format")
  .refine(email => email.endsWith('.cz') || email.includes('@'), "Email should be Czech domain")
  .optional()

// Main therapist schema
export const TherapistSchema = z.object({
  // Core identification - REQUIRED
  id: z.string()
    .min(1, "Therapist ID is required")
    .max(100, "Therapist ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Therapist ID must contain only alphanumeric characters, hyphens, and underscores"),
  
  fullName: z.string()
    .min(1, "Full name is required")
    .max(100, "Full name too long")
    .regex(/^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s.-]+$/, "Full name contains invalid characters"),
  
  // Location - REQUIRED
  city: z.enum(CITIES.map(c => c.city) as [CityType, ...CityType[]], {
    errorMap: () => ({ message: "City must be a valid Czech city" })
  }),
  
  regions: z.array(z.enum(REGIONS as unknown as [RegionType, ...RegionType[]]))
    .min(1, "At least one region is required")
    .max(5, "Cannot be in more than 5 regions"),
  
  // Geographic coordinates - REQUIRED
  latitude: z.number()
    .min(48.5, "Latitude must be within Czech Republic bounds (min: 48.5)")
    .max(51.1, "Latitude must be within Czech Republic bounds (max: 51.1)")
    .refine(val => !isNaN(val) && isFinite(val), "Latitude must be a valid finite number"),
  
  longitude: z.number()
    .min(12.0, "Longitude must be within Czech Republic bounds (min: 12.0)")
    .max(18.9, "Longitude must be within Czech Republic bounds (max: 18.9)")
    .refine(val => !isNaN(val) && isFinite(val), "Longitude must be a valid finite number"),
  
  // Practice information - REQUIRED
  practiceType: z.enum(PRACTICE_TYPES as unknown as [PracticeType, ...PracticeType[]], {
    errorMap: () => ({ message: "Practice type must be one of: private, clinic, hospital, home_visits, online" })
  }),
  
  acceptingNew: z.boolean({
    required_error: "Accepting new patients status is required"
  }),
  
  // Experience and pricing - REQUIRED
  yearsExperience: z.number()
    .int("Years of experience must be an integer")
    .min(0, "Years of experience cannot be negative")
    .max(50, "Years of experience cannot exceed 50 years"),
  
  pricePerSession: z.number()
    .int("Price per session must be an integer")
    .min(0, "Price per session cannot be negative")
    .max(10000, "Price per session cannot exceed 10,000 CZK"),
  
  priceRange: PriceRangeSchema.optional(),
  
  // Languages - REQUIRED
  languages: z.array(z.enum(LANGUAGES as unknown as [LanguageType, ...LanguageType[]]))
    .min(1, "At least one language is required")
    .max(10, "Cannot have more than 10 languages")
    .refine(langs => langs.includes('cs'), "Must speak Czech (cs)"),
  
  // Specializations - REQUIRED
  specialties: z.array(z.enum(ISSUES as unknown as [IssueType, ...IssueType[]]))
    .min(1, "At least one specialty is required")
    .max(20, "Cannot have more than 20 specialties"),
  
  diagnoses: z.array(z.enum(DIAGNOSES as unknown as [DiagnosisType, ...DiagnosisType[]]))
    .max(30, "Cannot have more than 30 diagnoses"),
  
  modalities: z.array(z.enum(MODALITIES as unknown as [ModalityType, ...ModalityType[]]))
    .max(20, "Cannot have more than 20 modalities"),
  
  worksWith: z.array(z.enum(WORKS_WITH as unknown as [WorksWithType, ...WorksWithType[]]))
    .max(10, "Cannot work with more than 10 population groups"),
  
  // Tags for search and filtering - REQUIRED
  tags: z.array(z.string())
    .min(1, "At least one tag is required for therapist matching")
    .max(50, "Cannot have more than 50 tags")
    .refine(tags => tags.every(tag => tag.length >= 2 && tag.length <= 50), 
      "Each tag must be between 2 and 50 characters"),
  
  diagnosisTags: z.array(z.string())
    .max(30, "Cannot have more than 30 diagnosis tags")
    .refine(tags => tags.every(tag => tag.length >= 2 && tag.length <= 50), 
      "Each diagnosis tag must be between 2 and 50 characters"),
  
  // Rating and reviews - OPTIONAL
  rating: RatingSchema.optional(),
  reviewsCount: z.number()
    .int("Reviews count must be an integer")
    .min(0, "Reviews count cannot be negative")
    .max(10000, "Reviews count cannot exceed 10,000")
    .optional(),
  
  // Availability - OPTIONAL
  nextAvailableDays: z.number()
    .int("Next available days must be an integer")
    .min(0, "Next available days cannot be negative")
    .max(365, "Next available days cannot exceed 365")
    .nullable()
    .optional(),
  
  workingHours: WorkingHoursSchema.optional(),
  
  // Contact information - OPTIONAL
  bio: z.string()
    .max(2000, "Bio cannot exceed 2000 characters")
    .optional(),
  
  profileImage: z.string()
    .url("Profile image must be a valid URL")
    .optional(),
  
  clinicName: z.string()
    .max(100, "Clinic name too long")
    .optional(),
  
  address: z.string()
    .max(200, "Address too long")
    .optional(),
  
  phone: CzechPhoneSchema,
  email: CzechEmailSchema,
  
  website: z.string()
    .url("Website must be a valid URL")
    .optional(),
  
  insuranceAccepted: z.array(z.enum(INSURANCE_COMPANIES as unknown as [InsuranceCompanyType, ...InsuranceCompanyType[]]))
    .max(10, "Cannot accept more than 10 insurance companies")
    .optional(),
  
  isVerified: z.boolean().optional(),
  
  lastActive: z.string()
    .datetime("Last active must be a valid ISO datetime")
    .optional(),
  
  // Additional metadata
  postalCode: z.string()
    .regex(/^\d{3}\s?\d{2}$/, "Invalid Czech postal code format")
    .optional(),
  
  homeVisitRadiusKm: z.number()
    .int("Home visit radius must be an integer")
    .min(0, "Home visit radius cannot be negative")
    .max(100, "Home visit radius cannot exceed 100 km")
    .optional(),
  
  // Legacy fields for backward compatibility
  availability: z.array(z.object({
    day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    slots: z.array(z.string())
  })).optional(),
  
  // Fixture marker
  isFixture: z.boolean().optional()
})

// Type inference from schema
export type Therapist = z.infer<typeof TherapistSchema>
export type WorkingHours = z.infer<typeof WorkingHoursSchema>
export type Rating = z.infer<typeof RatingSchema>
export type PriceRange = z.infer<typeof PriceRangeSchema>
export type Coordinates = z.infer<typeof CoordinatesSchema>

// Validation result types
export interface TherapistValidationResult {
  success: boolean
  data?: Therapist
  errors?: string[]
  warnings?: string[]
}

// Batch validation result
export interface BatchValidationResult {
  valid: Therapist[]
  invalid: { therapist: any; errors: string[] }[]
  warnings: { therapist: Therapist; warnings: string[] }[]
  summary: {
    total: number
    valid: number
    invalid: number
    warnings: number
  }
}

// Validation functions
export function validateTherapist(therapist: any): TherapistValidationResult {
  try {
    const validated = TherapistSchema.parse(therapist)
    
    // Additional business logic validations
    const warnings: string[] = []
    
    // Check for suspicious data patterns
    if (validated.yearsExperience > 40 && validated.pricePerSession < 500) {
      warnings.push("Low price for high experience - verify data accuracy")
    }
    
    if (validated.rating && validated.rating.count > 0 && validated.rating.average < 2.0) {
      warnings.push("Very low rating with reviews - verify data accuracy")
    }
    
    if (validated.languages.length === 1 && !validated.languages.includes('cs')) {
      warnings.push("Therapist doesn't speak Czech - verify market relevance")
    }
    
    if (validated.nextAvailableDays && validated.nextAvailableDays > 90) {
      warnings.push("Very long wait time - verify availability data")
    }
    
    // Check for data consistency
    if (validated.practiceType === 'online' && validated.city !== 'online') {
      warnings.push("Online practice should have city set to 'online'")
    }
    
    return {
      success: true,
      data: validated,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    
    return {
      success: false,
      errors: ['Invalid therapist data format']
    }
  }
}

export function validateTherapistBatch(therapists: any[]): BatchValidationResult {
  const valid: Therapist[] = []
  const invalid: { therapist: any; errors: string[] }[] = []
  const warnings: { therapist: Therapist; warnings: string[] }[] = []
  
  for (const therapist of therapists) {
    const result = validateTherapist(therapist)
    
    if (result.success && result.data) {
      valid.push(result.data)
      
      if (result.warnings && result.warnings.length > 0) {
        warnings.push({
          therapist: result.data,
          warnings: result.warnings
        })
      }
    } else {
      invalid.push({
        therapist,
        errors: result.errors || ['Unknown validation error']
      })
    }
  }
  
  return {
    valid,
    invalid,
    warnings,
    summary: {
      total: therapists.length,
      valid: valid.length,
      invalid: invalid.length,
      warnings: warnings.length
    }
  }
}

// Check for duplicate IDs
export function checkDuplicateIds(therapists: Therapist[]): {
  duplicates: string[]
  unique: Therapist[]
} {
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

// Generate validation report
export function generateValidationReport(therapists: any[]): {
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
  const validation = validateTherapistBatch(therapists)
  const duplicateCheck = checkDuplicateIds(validation.valid)
  
  const criticalIssues: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Analyze critical issues
  if (validation.invalid.length > 0) {
    criticalIssues.push(`${validation.invalid.length} therapist records failed validation`)
  }
  
  if (duplicateCheck.duplicates.length > 0) {
    criticalIssues.push(`${duplicateCheck.duplicates.length} duplicate therapist IDs found`)
  }
  
  // Analyze warnings
  if (validation.warnings.length > 0) {
    warnings.push(`${validation.warnings.length} therapist records have warnings`)
  }
  
  // Generate recommendations
  if (validation.invalid.length > validation.valid.length * 0.1) {
    recommendations.push("High validation failure rate - review data quality processes")
  }
  
  if (validation.warnings.length > validation.valid.length * 0.2) {
    recommendations.push("Many warnings detected - consider data quality improvements")
  }
  
  if (duplicateCheck.duplicates.length > 0) {
    recommendations.push("Implement duplicate detection in data ingestion pipeline")
  }
  
  return {
    total: therapists.length,
    valid: validation.valid.length,
    invalid: validation.invalid.length,
    warnings: validation.warnings.length,
    duplicates: duplicateCheck.duplicates.length,
    summary: {
      criticalIssues,
      warnings,
      recommendations
    }
  }
}
