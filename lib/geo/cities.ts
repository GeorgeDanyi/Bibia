import { CZ_CITIES } from '@/data/cz_cities'

export function getCityCoords(city: string): [number, number] | null {
  if (!city) return null
  const needle = city.toLowerCase()
  const hit = CZ_CITIES.find(c => {
    if (!c) return false
    const byName = (c.city || '').toLowerCase() === needle
    const byAlias = Array.isArray(c.aliases) && c.aliases.some(a => String(a || '').toLowerCase() === needle)
    return byName || byAlias
  })
  return hit ? [hit.lat, hit.lon] as [number, number] : null
}


