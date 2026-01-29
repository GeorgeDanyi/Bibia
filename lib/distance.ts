export interface LatLng {
  lat: number
  lng: number
}

/**
 * Calculate distance between two points using Haversine formula
 * @param a First point
 * @param b Second point
 * @returns Distance in kilometers
 */
export function kmDistance(a: LatLng, b: LatLng): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180

  const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
  
  return Math.round(R * c * 10) / 10 // Round to 1 decimal place
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters for PostGIS compatibility
 * @param a First point
 * @param b Second point
 * @returns Distance in meters
 */
export function meterDistance(a: LatLng, b: LatLng): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180

  const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
  
  return Math.round(R * c) // Round to nearest meter
}

/**
 * Check if a point is within a bounding box (for pre-filtering before distance calculation)
 * @param point Point to check
 * @param center Center of the bounding box
 * @param radiusKm Radius in kilometers
 * @returns True if point is within bounding box
 */
export function isWithinBoundingBox(point: LatLng, center: LatLng, radiusKm: number): boolean {
  // Approximate degrees per km (rough estimate)
  const latDegreesPerKm = 1 / 111.32
  const lngDegreesPerKm = 1 / (111.32 * Math.cos(center.lat * Math.PI / 180))
  
  const latDiff = Math.abs(point.lat - center.lat)
  const lngDiff = Math.abs(point.lng - center.lng)
  
  return latDiff <= (radiusKm * latDegreesPerKm) && lngDiff <= (radiusKm * lngDegreesPerKm)
}

/**
 * PostGIS-style distance calculation (if using PostGIS database)
 * This would be used in SQL queries like: ST_DWithin(therapist_location, user_location, radius_in_meters)
 * @param a First point
 * @param b Second point
 * @returns Distance in meters (PostGIS standard)
 */
export function postgisDistance(a: LatLng, b: LatLng): number {
  return meterDistance(a, b) // Use meter-based calculation for PostGIS compatibility
}

/**
 * Check if distance is within radius using PostGIS-style comparison
 * @param a First point
 * @param b Second point
 * @param radiusMeters Radius in meters
 * @returns True if within radius
 */
export function isWithinRadius(a: LatLng, b: LatLng, radiusMeters: number): boolean {
  return postgisDistance(a, b) <= radiusMeters
}

/**
 * Get bounding box coordinates for a center point and radius
 * Useful for database queries to pre-filter results
 * @param center Center point
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(center: LatLng, radiusKm: number): {
  north: number
  south: number
  east: number
  west: number
} {
  const latDegreesPerKm = 1 / 111.32
  const lngDegreesPerKm = 1 / (111.32 * Math.cos(center.lat * Math.PI / 180))
  
  return {
    north: center.lat + (radiusKm * latDegreesPerKm),
    south: center.lat - (radiusKm * latDegreesPerKm),
    east: center.lng + (radiusKm * lngDegreesPerKm),
    west: center.lng - (radiusKm * lngDegreesPerKm)
  }
}
