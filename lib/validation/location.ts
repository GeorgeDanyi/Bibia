import { z } from "zod"
import { CZECH_BOUNDS, MAJOR_CZECH_CITIES, LocationValidationResult } from '@/lib/types/geocoding'

/**
 * Location validation schemas and utilities
 * Part A: Comprehensive location sanity checks
 */

// Input validation for location strings
export const locationInputSchema = z.object({
  input: z.string()
    .min(1, "Location input is required")
    .max(200, "Location input too long")
    .transform(val => val.trim())
    .refine(val => val.length > 0, "Location input cannot be empty")
})

// Coordinate validation with Czech Republic bounds
export const coordinateSchema = z.object({
  lat: z.number()
    .min(CZECH_BOUNDS.minLat, `Latitude must be within Czech Republic bounds (min: ${CZECH_BOUNDS.minLat})`)
    .max(CZECH_BOUNDS.maxLat, `Latitude must be within Czech Republic bounds (max: ${CZECH_BOUNDS.maxLat})`)
    .refine(val => !isNaN(val), "Latitude must be a valid number"),
  lng: z.number()
    .min(CZECH_BOUNDS.minLng, `Longitude must be within Czech Republic bounds (min: ${CZECH_BOUNDS.minLng})`)
    .max(CZECH_BOUNDS.maxLng, `Longitude must be within Czech Republic bounds (max: ${CZECH_BOUNDS.maxLng})`)
    .refine(val => !isNaN(val), "Longitude must be a valid number")
})

// Geocode result validation
export const geocodeResultSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  source: z.enum(['gps', 'geocode', 'fallback']),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  originalInput: z.string().optional()
})

// Location input validation with comprehensive checks
export function validateLocationInput(input: string): LocationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let sanitizedInput = input.trim()

  // Basic validation
  if (!sanitizedInput) {
    errors.push("Location input is required")
    return { isValid: false, errors, warnings }
  }

  if (sanitizedInput.length > 200) {
    errors.push("Location input is too long (max 200 characters)")
    return { isValid: false, errors, warnings }
  }

  // Check for suspicious patterns
  if (sanitizedInput.length < 2) {
    errors.push("Location input is too short")
    return { isValid: false, errors, warnings }
  }

  // Check for non-alphanumeric characters (allow Czech diacritics and common punctuation)
  const validPattern = /^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9\s.,-]+$/
  if (!validPattern.test(sanitizedInput)) {
    errors.push("Location input contains invalid characters")
    return { isValid: false, errors, warnings }
  }

  // Check for common typos or suspicious inputs
  const suspiciousPatterns = [
    /^[0-9]+$/, // Only numbers
    /^[a-zA-Z]{1,2}$/, // Very short alphabetic
    /test|example|sample|dummy/i, // Test data
    /^[^a-zA-Z]*$/, // No letters at all
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitizedInput)) {
      errors.push("Location input appears to be invalid or test data")
      return { isValid: false, errors, warnings }
    }
  }

  // Check for coordinates in string format
  const coordinatePattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/
  if (coordinatePattern.test(sanitizedInput)) {
    warnings.push("Input appears to be coordinates. Please enter a city name instead.")
  }

  // Check if input looks like a postal code
  const postalCodePattern = /^\d{3}\s?\d{2}$/
  if (postalCodePattern.test(sanitizedInput)) {
    warnings.push("Input appears to be a postal code. City name is preferred for better results.")
  }

  // Check for very generic terms
  const genericTerms = ['město', 'city', 'town', 'village', 'obec', 'místo']
  if (genericTerms.some(term => sanitizedInput.toLowerCase().includes(term))) {
    warnings.push("Please be more specific with your location (e.g., 'Praha' instead of 'město')")
  }

  return {
    isValid: true,
    errors,
    warnings,
    sanitizedInput
  }
}

// Validate coordinates against Czech Republic bounds
export function validateCoordinates(lat: number, lng: number): LocationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (isNaN(lat) || isNaN(lng)) {
    errors.push("Coordinates must be valid numbers")
    return { isValid: false, errors, warnings }
  }

  if (lat < CZECH_BOUNDS.minLat || lat > CZECH_BOUNDS.maxLat) {
    errors.push(`Latitude ${lat} is outside Czech Republic bounds (${CZECH_BOUNDS.minLat} - ${CZECH_BOUNDS.maxLat})`)
  }

  if (lng < CZECH_BOUNDS.minLng || lng > CZECH_BOUNDS.maxLng) {
    errors.push(`Longitude ${lng} is outside Czech Republic bounds (${CZECH_BOUNDS.minLng} - ${CZECH_BOUNDS.maxLng})`)
  }

  // Check if coordinates are too close to borders (potential edge cases)
  const borderThreshold = 0.1
  if (lat < CZECH_BOUNDS.minLat + borderThreshold || lat > CZECH_BOUNDS.maxLat - borderThreshold) {
    warnings.push("Location is near the Czech Republic border")
  }

  if (lng < CZECH_BOUNDS.minLng + borderThreshold || lng > CZECH_BOUNDS.maxLng - borderThreshold) {
    warnings.push("Location is near the Czech Republic border")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Generate suggestions for invalid location inputs
export function generateLocationSuggestions(invalidInput: string): string[] {
  const suggestions: string[] = []
  const input = invalidInput.toLowerCase().trim()

  // Check for partial matches with major cities
  for (const city of MAJOR_CZECH_CITIES) {
    if (city.toLowerCase().includes(input) || input.includes(city.toLowerCase())) {
      suggestions.push(city)
    }
  }

  // Check for common misspellings
  const commonMisspellings: Record<string, string[]> = {
    'praha': ['Praha', 'Prague'],
    'brno': ['Brno'],
    'ostrava': ['Ostrava'],
    'plzen': ['Plzeň', 'Pilsen'],
    'liberec': ['Liberec'],
    'olomouc': ['Olomouc'],
    'ceske': ['České Budějovice', 'Český Krumlov'],
    'hradec': ['Hradec Králové'],
    'usti': ['Ústí nad Labem'],
    'pardubice': ['Pardubice'],
    'zlin': ['Zlín'],
    'karlovy': ['Karlovy Vary']
  }

  for (const [key, values] of Object.entries(commonMisspellings)) {
    if (input.includes(key)) {
      suggestions.push(...values)
    }
  }

  // Remove duplicates and limit to 5 suggestions
  return [...new Set(suggestions)].slice(0, 5)
}

// Sanitize location input
export function sanitizeLocationInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\sáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ.,-]/g, '') // Remove invalid characters
    .substring(0, 200) // Limit length
}
