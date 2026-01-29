import { CZ_CITIES, type CzCity } from '@/data/cz_cities'

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
}

function norm(value: string): string {
  return stripDiacritics(value.trim().toLowerCase()).replace(/[\s\-]+/g, '').replace(/_/g,'')
}

// Build index for canonicalization
const NAME_TO_CITY = new Map<string, CzCity>()
for (const c of CZ_CITIES) {
  NAME_TO_CITY.set(norm(c.city), c)
  for (const a of c.aliases) NAME_TO_CITY.set(norm(a), c)
}

export function canonicalizeCity(input: string | undefined | null): { city: string } | null {
  if (!input || typeof input !== 'string') return null
  const key = norm(input)
  const hit = NAME_TO_CITY.get(key)
  if (hit) return { city: hit.city }
  return null
}

// Haversine for nearest city fallback
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function nearestCity(lat: number, lon: number): { city: string; km: number } {
  let best: { city: string; km: number } | null = null
  for (const c of CZ_CITIES) {
    const km = haversineKm(lat, lon, c.lat, c.lon)
    if (!best || km < best.km) best = { city: c.city, km }
  }
  return best || { city: CZ_CITIES[0].city, km: Infinity }
}


