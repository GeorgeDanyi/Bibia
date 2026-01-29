import { CzechPlace, loadPlaces } from '@/lib/data/cz-places'

export type LatLon = { lat: number; lon: number }

// Haversine distance in km
export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const la1 = a.lat * Math.PI / 180
  const la2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat/2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon/2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
  return Math.round(R * c * 10) / 10
}

// Resolve city name -> coords from local dataset
let placesPromise: Promise<CzechPlace[]> | null = null
export async function resolveCityCoords(city: string): Promise<LatLon | null> {
  if (!placesPromise) placesPromise = loadPlaces()
  const places = await placesPromise
  const hit = places.find(p => p.name.toLowerCase() === city.toLowerCase())
  return hit ? { lat: hit.lat, lon: hit.lon } : null
}

// Compute distance from user to nearest clinic location
export function nearestClinicDistance(user: LatLon, clinics: LatLon[]): number | null {
  if (!user || !clinics || clinics.length === 0) return null
  let min = Infinity
  for (const c of clinics) {
    const d = haversineKm(user, c)
    if (d < min) min = d
  }
  return isFinite(min) ? min : null
}

export function distanceBucket(km: number | null): '<=10' | '10-30' | '30-50' | '>50' {
  if (km === null || km === undefined || isNaN(km)) return '>50'
  if (km <= 10) return '<=10'
  if (km <= 30) return '10-30'
  if (km <= 50) return '30-50'
  return '>50'
}


