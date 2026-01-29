/**
 * Comprehensive geocoding types and error handling
 * Part A: Eliminate silent failures and provide actionable feedback
 */

export interface GeocodeResult {
  lat: number
  lng: number
  source: 'gps' | 'geocode' | 'fallback'
  city?: string
  postalCode?: string
  confidence: number // 0-1 confidence score
  normalizedLabel: string // Standardized location label
  originalInput?: string
}

export interface GeocodeError {
  type: 'validation' | 'network' | 'service' | 'not_found' | 'ambiguous' | 'bounds'
  message: string
  userMessage: string
  actionable: boolean
  suggestions?: string[]
  originalInput?: string
}

export interface GeocodeResponse {
  success: boolean
  result?: GeocodeResult
  error?: GeocodeError
  warnings?: string[]
}

export interface LocationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedInput?: string
}

export interface CzechBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

// Czech Republic geographic bounds
export const CZECH_BOUNDS: CzechBounds = {
  minLat: 48.5,
  maxLat: 51.1,
  minLng: 12.0,
  maxLng: 18.9
}

// Common Czech cities for fallback suggestions
export const MAJOR_CZECH_CITIES = [
  'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice',
  'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín', 'Havířov', 'Kladno',
  'Most', 'Opava', 'Frýdek-Místek', 'Jihlava', 'Teplice', 'Děčín', 'Karlovy Vary'
]

export interface GeocodeServiceConfig {
  enableMapbox: boolean
  enableLocalFallback: boolean
  enableBoundsValidation: boolean
  maxRetries: number
  timeoutMs: number
  confidenceThreshold: number // 0-1 threshold for blocking search
  enableLogging: boolean
}

export const DEFAULT_GEOCODE_CONFIG: GeocodeServiceConfig = {
  enableMapbox: true,
  enableLocalFallback: true,
  enableBoundsValidation: true,
  maxRetries: 2,
  timeoutMs: 10000,
  confidenceThreshold: 0.6, // Block search if confidence < 0.6
  enableLogging: true
}

// Logging interface for low-confidence locations
export interface LowConfidenceLog {
  timestamp: number
  input: string
  result: GeocodeResult
  confidence: number
  source: string
  userAgent?: string
  sessionId?: string
}
