interface Coordinates {
  lat: number
  lon: number
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param a First coordinate point
 * @param b Second coordinate point
 * @returns Distance in kilometers
 */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  
  // Convert degrees to radians
  const lat1Rad = (a.lat * Math.PI) / 180
  const lat2Rad = (b.lat * Math.PI) / 180
  const deltaLatRad = ((b.lat - a.lat) * Math.PI) / 180
  const deltaLonRad = ((b.lon - a.lon) * Math.PI) / 180
  
  // Haversine formula
  const a1 = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1))
  
  return R * c
}

/**
 * Calculate the distance between two coordinates and return it rounded to specified decimal places
 * @param a First coordinate point
 * @param b Second coordinate point
 * @param decimals Number of decimal places to round to (default: 2)
 * @returns Distance in kilometers, rounded
 */
export function haversineKmRounded(a: Coordinates, b: Coordinates, decimals: number = 2): number {
  return Math.round(haversineKm(a, b) * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Check if two coordinates are within a specified distance
 * @param a First coordinate point
 * @param b Second coordinate point
 * @param maxDistanceKm Maximum distance in kilometers
 * @returns True if within distance, false otherwise
 */
export function isWithinDistance(a: Coordinates, b: Coordinates, maxDistanceKm: number): boolean {
  return haversineKm(a, b) <= maxDistanceKm
}

