import { MatchResult } from './match'

export interface SplitResults {
  bestNearby: MatchResult[]
  closestAlt: MatchResult[]
}

export function splitResults(
  results: MatchResult[],
  coords: { lat: number, lon: number } | null,
  maxDistanceKm: number
): SplitResults {
  if (!coords) {
    // If no coordinates, return all results as bestNearby, no alternatives
    return {
      bestNearby: results.slice(0, 10),
      closestAlt: []
    }
  }

  // A) bestNearby = results.filter(distanceKm<=maxDistanceKm).slice(0,10)
  const bestNearby = results
    .filter(result => result.distanceKm <= maxDistanceKm)
    .slice(0, 10)

  // B) closestAlt = results sorted by distanceKm asc, filtered not in bestNearby, slice(0,6)
  const bestNearbyIds = new Set(bestNearby.map(r => r.therapist.id))
  
  const closestAlt = results
    .filter(result => !bestNearbyIds.has(result.therapist.id))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 6)

  return {
    bestNearby,
    closestAlt
  }
}
