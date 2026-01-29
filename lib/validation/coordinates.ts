/**
 * Hard coordinate validation for Czech Republic bounds
 * Implements strict validation for in-person therapist profiles
 */

// Czech Republic geographic bounds
export const CZ = { 
  minLat: 48.5, 
  maxLat: 51.1, 
  minLon: 12.0, 
  maxLon: 18.9 
} as const

/**
 * Convert various input types to valid numbers
 */
export const toNum = (x: any): number | null => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  if (typeof x === 'string') {
    const n = parseFloat(x.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Validate coordinates against Czech Republic bounds
 * Returns normalized coordinates if valid, null if invalid
 */
export function validCoord(lat?: any, lon?: any): { lat: number; lon: number } | null {
  const la = toNum(lat)
  const lo = toNum(lon)
  
  return (
    la !== null && lo !== null &&
    la >= CZ.minLat && la <= CZ.maxLat &&
    lo >= CZ.minLon && lo <= CZ.maxLon
  ) ? { lat: la, lon: lo } : null
}

/**
 * Normalize and validate an array of locations
 * Filters out invalid coordinates and normalizes valid ones
 */
export function normalizeLocations(locations?: any[]): Array<{ lat: number; lon: number; [key: string]: any }> {
  const out: Array<{ lat: number; lon: number; [key: string]: any }> = []
  
  for (const l of locations ?? []) {
    const ok = validCoord(l.lat, l.lon)
    if (ok) {
      out.push({ ...l, ...ok })
    }
  }
  
  return out
}

/**
 * Hard validation for in-person profiles
 * Throws error if in-person profile lacks valid coordinates
 */
export function validateInPersonCoordinates(
  meetingTypes: string[] | undefined,
  locations: any[] | undefined,
  therapistId?: string
): void {
  // Check if this is an in-person profile
  const isInPerson = meetingTypes?.some(type => 
    ['ordinace', 'clinic', 'dojizdeni', 'home_visit', 'home-visit'].includes(type.toLowerCase())
  ) ?? false

  if (!isInPerson) {
    return // Online-only profiles don't need location validation
  }

  // For in-person profiles, require at least one valid location
  const validLocations = normalizeLocations(locations)
  
  if (validLocations.length === 0) {
    const idStr = therapistId ? ` (ID: ${therapistId})` : ''
    throw new Error(
      `HARD_VALIDATION_ERROR: In-person therapist profile${idStr} must have at least one valid location within Czech Republic bounds. ` +
      `Expected coordinates: lat ${CZ.minLat}-${CZ.maxLat}, lon ${CZ.minLon}-${CZ.maxLon}. ` +
      `Received locations: ${JSON.stringify(locations ?? [])}`
    )
  }
}

/**
 * Validate single coordinate pair with detailed error message
 */
export function validateCoordinatePair(
  lat: any, 
  lon: any, 
  context?: string
): { lat: number; lon: number } {
  const result = validCoord(lat, lon)
  
  if (result === null) {
    const ctx = context ? ` (${context})` : ''
    throw new Error(
      `INVALID_COORDINATES${ctx}: Coordinates must be within Czech Republic bounds. ` +
      `Expected: lat ${CZ.minLat}-${CZ.maxLat}, lon ${CZ.minLon}-${CZ.maxLon}. ` +
      `Received: lat=${lat}, lon=${lon}`
    )
  }
  
  return result
}

/**
 * Batch validate multiple therapist records with hard coordinate validation
 */
export function validateTherapistCoordinates(
  therapists: Array<{
    id?: string
    meeting_types?: string[]
    locations?: any[]
    lat?: any
    lng?: any
    [key: string]: any
  }>
): {
  valid: typeof therapists
  invalid: Array<{ therapist: any; error: string }>
} {
  const valid: typeof therapists = []
  const invalid: Array<{ therapist: any; error: string }> = []

  for (const therapist of therapists) {
    try {
      // Check if this is an in-person profile
      const isInPerson = therapist.meeting_types?.some(type => 
        ['ordinace', 'clinic', 'dojizdeni', 'home_visit', 'home-visit'].includes(type.toLowerCase())
      ) ?? false

      if (isInPerson) {
        // For in-person profiles, validate coordinates
        if (therapist.locations && therapist.locations.length > 0) {
          // Validate locations array
          const validLocations = normalizeLocations(therapist.locations)
          if (validLocations.length === 0) {
            throw new Error('No valid locations found in locations array')
          }
        } else if (therapist.lat !== undefined || therapist.lng !== undefined) {
          // Validate single lat/lng pair
          validateCoordinatePair(therapist.lat, therapist.lng, `therapist ${therapist.id}`)
        } else {
          throw new Error('In-person profile must have either locations array or lat/lng coordinates')
        }
      }

      valid.push(therapist)
    } catch (error) {
      invalid.push({
        therapist,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return { valid, invalid }
}
