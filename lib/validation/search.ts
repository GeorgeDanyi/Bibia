import { z } from "zod"

// Input validation schemas for search API
export const searchTherapistsInputSchema = z.object({
  location: z.union([
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    z.object({
      cityOrZip: z.string().min(1).max(100).trim()
    })
  ]),
  radiusKm: z.number().min(1).max(200).optional(),
  problems: z.array(z.string().min(1).max(50)).optional(),
  diagnosisTags: z.array(z.string().min(1).max(50)).optional(),
  preferences: z.object({
    gender: z.enum(['male', 'female', 'any']).optional(),
    languages: z.array(z.string().min(2).max(10)).optional()
  }).optional(),
  mustHave: z.object({
    diagnosis: z.array(z.string().min(1).max(50)).optional(),
    practiceType: z.array(z.enum(['private', 'clinic', 'hospital', 'home_visits', 'online'])).optional(),
    languages: z.array(z.string().min(2).max(10)).optional()
  }).optional(),
  prefer: z.object({
    distance: z.boolean().optional(),
    price: z.boolean().optional(),
    availability: z.boolean().optional()
  }).optional(),
  page: z.number().min(1).max(100).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  preferExpertEvenIfFarther: z.boolean().optional()
})

export const resultsCriteriaSchema = z.object({
  issue: z.array(z.string().min(1).max(50)).optional(),
  diag: z.array(z.string().min(1).max(50)).optional(),
  time: z.array(z.string().min(1).max(20)).optional(),
  day: z.array(z.string().min(1).max(20)).optional(),
  gender: z.string().min(1).max(20).optional(),
  lang: z.array(z.string().min(2).max(10)).optional(),
  exp: z.array(z.string().min(1).max(50)).optional(),
  place: z.string().min(1).max(50).optional(),
  city: z.string().min(1).max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  maxKm: z.number().min(1).max(200).optional()
})

// Therapist data validation schema
export const therapistDataSchema = z.object({
  id: z.string().min(1).max(100),
  fullName: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  languages: z.array(z.string().min(2).max(10)),
  practiceType: z.enum(['private', 'clinic', 'hospital', 'home_visits', 'online']),
  acceptingNew: z.boolean(),
  yearsExperience: z.number().min(0).max(50),
  pricePerSession: z.number().min(0).max(10000),
  priceRange: z.object({
    minCZK: z.number().min(0).max(10000),
    maxCZK: z.number().min(0).max(10000)
  }).optional(),
  specialties: z.array(z.string().min(1).max(50)),
  diagnosisTags: z.array(z.string().min(1).max(50)),
  tags: z.array(z.string().min(1).max(50)),
  rating: z.object({
    average: z.number().min(0).max(5),
    count: z.number().min(0).max(10000)
  }).optional(),
  availability: z.array(z.any()).optional(),
  nextAvailableDays: z.number().min(0).max(365).nullable().optional(),
  workingHours: z.object({
    morning: z.boolean(),
    midday: z.boolean(),
    evening: z.boolean(),
    weekend: z.boolean()
  }).optional(),
  bio: z.string().max(2000).optional(),
  profileImage: z.string().url().optional(),
  clinicName: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  insuranceAccepted: z.array(z.string().min(1).max(20)).optional(),
  isVerified: z.boolean().optional(),
  lastActive: z.string().datetime().optional()
})

// Sanitization functions
export function sanitizeSearchInput(input: any): any {
  if (typeof input !== 'object' || input === null) {
    return {}
  }

  const sanitized = { ...input }

  // Sanitize strings
  if (sanitized.cityOrZip && typeof sanitized.cityOrZip === 'string') {
    sanitized.cityOrZip = sanitized.cityOrZip.trim().slice(0, 100)
  }

  if (sanitized.problems && Array.isArray(sanitized.problems)) {
    sanitized.problems = sanitized.problems
      .filter((p: unknown): p is string => typeof p === 'string')
      .map((p: string) => p.trim().slice(0, 50))
      .filter((p: string) => p.length > 0)
  }

  if (sanitized.diagnosisTags && Array.isArray(sanitized.diagnosisTags)) {
    sanitized.diagnosisTags = sanitized.diagnosisTags
      .filter((t: unknown): t is string => typeof t === 'string')
      .map((t: string) => t.trim().slice(0, 50))
      .filter((t: string) => t.length > 0)
  }

  // Sanitize numbers
  if (typeof sanitized.radiusKm === 'number') {
    sanitized.radiusKm = Math.max(1, Math.min(200, Math.round(sanitized.radiusKm)))
  }

  if (typeof sanitized.page === 'number') {
    sanitized.page = Math.max(1, Math.min(100, Math.round(sanitized.page)))
  }

  if (typeof sanitized.pageSize === 'number') {
    sanitized.pageSize = Math.max(1, Math.min(100, Math.round(sanitized.pageSize)))
  }

  return sanitized
}

export function sanitizeTherapistData(therapist: any): any {
  if (typeof therapist !== 'object' || therapist === null) {
    return null
  }

  const sanitized = { ...therapist }

  // Sanitize strings
  if (typeof sanitized.fullName === 'string') {
    sanitized.fullName = sanitized.fullName.trim().slice(0, 100)
  }

  if (typeof sanitized.city === 'string') {
    sanitized.city = sanitized.city.trim().slice(0, 100)
  }

  if (typeof sanitized.bio === 'string') {
    sanitized.bio = sanitized.bio.trim().slice(0, 2000)
  }

  // Sanitize arrays
  if (Array.isArray(sanitized.languages)) {
    sanitized.languages = sanitized.languages
      .filter((l: unknown): l is string => typeof l === 'string')
      .map((l: string) => l.trim().slice(0, 10))
      .filter((l: string) => l.length >= 2)
  }

  if (Array.isArray(sanitized.specialties)) {
    sanitized.specialties = sanitized.specialties
      .filter(s => typeof s === 'string')
      .map(s => s.trim().slice(0, 50))
      .filter(s => s.length > 0)
  }

  // Sanitize coordinates
  if (typeof sanitized.latitude === 'number') {
    sanitized.latitude = Math.max(-90, Math.min(90, sanitized.latitude))
  }

  if (typeof sanitized.longitude === 'number') {
    sanitized.longitude = Math.max(-180, Math.min(180, sanitized.longitude))
  }

  // Sanitize rating
  if (sanitized.rating && typeof sanitized.rating === 'object') {
    if (typeof sanitized.rating.average === 'number') {
      sanitized.rating.average = Math.max(0, Math.min(5, sanitized.rating.average))
    }
    if (typeof sanitized.rating.count === 'number') {
      sanitized.rating.count = Math.max(0, Math.min(10000, Math.round(sanitized.rating.count)))
    }
  }

  return sanitized
}

// Validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
  sanitized?: any
}

// Validate and sanitize search input
export function validateSearchInput(input: any): ValidationResult<z.infer<typeof searchTherapistsInputSchema>> {
  try {
    const sanitized = sanitizeSearchInput(input)
    const validated = searchTherapistsInputSchema.parse(sanitized)
    
    return {
      success: true,
      data: validated,
      sanitized
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        sanitized: sanitizeSearchInput(input)
      }
    }
    
    return {
      success: false,
      errors: ['Invalid input format'],
      sanitized: sanitizeSearchInput(input)
    }
  }
}

// Validate therapist data
export function validateTherapistData(therapist: any): ValidationResult<z.infer<typeof therapistDataSchema>> {
  try {
    const sanitized = sanitizeTherapistData(therapist)
    const validated = therapistDataSchema.parse(sanitized)
    
    return {
      success: true,
      data: validated,
      sanitized
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        sanitized: sanitizeTherapistData(therapist)
      }
    }
    
    return {
      success: false,
      errors: ['Invalid therapist data format'],
      sanitized: sanitizeTherapistData(therapist)
    }
  }
}

