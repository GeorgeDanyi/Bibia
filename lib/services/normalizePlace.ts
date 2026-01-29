import { findByPSC, GazetteerPlace, loadGazetteer, normalizeAscii } from '@/lib/data/cz-gazetteer'
import { getGeoCache, setGeoCache } from '@/lib/services/geoCache'

export type NormalizeInput = string | { city?: string; psc?: string; okres?: string; kraj?: string }

export type MatchResult = {
  lat: number
  lng: number
  source: 'gazetteer' | 'saas' | 'fallback'
  confidence: number
  estimated: boolean
  place?: GazetteerPlace
}

function extractPSC(input: string): string | null {
  const m = (input || '').match(/\b\d{3}\s?\d{2}\b/)
  return m ? m[0] : null
}

function preferByRegion(candidates: GazetteerPlace[], okres?: string, kraj?: string): GazetteerPlace | null {
  if (!candidates.length) return null
  if (okres) {
    const hit = candidates.find(c => normalizeAscii(c.okres) === normalizeAscii(okres))
    if (hit) return hit
  }
  if (kraj) {
    const hit = candidates.find(c => normalizeAscii(c.kraj) === normalizeAscii(kraj))
    if (hit) return hit
  }
  // Fall back to highest population
  let best = candidates[0]
  for (const c of candidates) {
    if ((c.population || 0) > (best.population || 0)) best = c
  }
  return best
}

async function saasGeocode(_q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `/api/geocode?q=${encodeURIComponent(_q)}&country=cz`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const data = await res.json()
    const item = Array.isArray(data?.results) ? data.results[0] : null
    if (item && typeof item.lat === 'number' && typeof item.lon === 'number') {
      return { lat: item.lat, lng: item.lon }
    }
  } catch {}
  return null
}

export async function normalizePlace(input: NormalizeInput): Promise<MatchResult> {
  const gazetteer = await loadGazetteer()
  if (!input) return { lat: 49.8175, lng: 15.4730, source: 'fallback', confidence: 0, estimated: true }

  const city = typeof input === 'string' ? input : (input.city || '')
  const okres = typeof input === 'string' ? undefined : input.okres
  const kraj = typeof input === 'string' ? undefined : input.kraj
  const psc = typeof input === 'string' ? extractPSC(input) : (input.psc || null)

  const qAscii = normalizeAscii(city)

  const cacheKey = JSON.stringify({ city: qAscii, psc: psc || null, okres: okres || null, kraj: kraj || null })
  const cached = getGeoCache(cacheKey)
  if (cached) return { lat: cached.lat, lng: cached.lng, source: cached.source, confidence: cached.confidence ?? 0.9, estimated: cached.source !== 'saas' }

  // PSC direct
  if (psc) {
    const byPsc = await findByPSC(psc)
    if (byPsc) {
      setGeoCache(cacheKey, { lat: byPsc.lat, lng: byPsc.lng, source: 'gazetteer', confidence: 0.98 })
      return { lat: byPsc.lat, lng: byPsc.lng, source: 'gazetteer', confidence: 0.98, estimated: true, place: byPsc }
    }
  }

  // Name/Alias fuzzy
  const candidates: GazetteerPlace[] = []
  const exact = gazetteer.find(p => p.name_ascii === qAscii)
  if (exact) candidates.push(exact)
  for (const p of gazetteer) {
    if (p.name_ascii.startsWith(qAscii) || p.name_ascii.includes(qAscii)) candidates.push(p)
    else if ((p.aliases || []).some(a => normalizeAscii(a).startsWith(qAscii) || normalizeAscii(a).includes(qAscii))) candidates.push(p)
  }
  const unique = Array.from(new Map(candidates.map(p => [p.id, p])).values())
  if (unique.length) {
    const best = preferByRegion(unique, okres, kraj)!
    const conf = best.name_ascii === qAscii ? 0.99 : (best.name_ascii.startsWith(qAscii) ? 0.94 : 0.88)
    if (conf >= 0.86) {
      setGeoCache(cacheKey, { lat: best.lat, lng: best.lng, source: 'gazetteer', confidence: conf })
      return { lat: best.lat, lng: best.lng, source: 'gazetteer', confidence: conf, estimated: true, place: best }
    }
  }

  // SaaS fallback
  if (qAscii.length >= 2) {
    const saas = await saasGeocode(city)
    if (saas) {
      setGeoCache(cacheKey, { lat: saas.lat, lng: saas.lng, source: 'saas', confidence: 0.9 })
      return { lat: saas.lat, lng: saas.lng, source: 'saas', confidence: 0.9, estimated: false }
    }
  }

  // Regional fallback
  const fallback = preferByRegion(gazetteer, okres, kraj)
  if (fallback) {
    setGeoCache(cacheKey, { lat: fallback.lat, lng: fallback.lng, source: 'fallback', confidence: 0.6 })
    return { lat: fallback.lat, lng: fallback.lng, source: 'fallback', confidence: 0.6, estimated: true, place: fallback }
  }

  // CZ centroid fallback
  setGeoCache(cacheKey, { lat: 49.8175, lng: 15.4730, source: 'fallback', confidence: 0.5 })
  return { lat: 49.8175, lng: 15.4730, source: 'fallback', confidence: 0.5, estimated: true }
}
