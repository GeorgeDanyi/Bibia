export type GazetteerPlace = {
  id: string
  name_cz: string
  name_ascii: string
  aliases: string[]
  psc: string[]
  kraj: string
  okres: string
  lat: number
  lng: number
  bbox?: [number, number, number, number]
  population?: number
  geohash?: string
}

let cache: GazetteerPlace[] | null = null

export async function loadGazetteer(): Promise<GazetteerPlace[]> {
  if (cache) return cache
  try {
    // eslint-disable-next-line
    const data = require('../../data/cz_gazetteer.json') as GazetteerPlace[]
    cache = Array.isArray(data) ? data : []
  } catch {
    cache = []
  }
  return cache
}

export function normalizeAscii(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function findByNameOrAlias(term: string): Promise<GazetteerPlace | null> {
  const places = await loadGazetteer()
  const q = normalizeAscii(term)
  // Exact ascii match
  let best = places.find(p => p.name_ascii === q) || null
  if (best) return best
  // Alias exact
  best = places.find(p => (p.aliases || []).some(a => normalizeAscii(a) === q)) || null
  if (best) return best
  // Prefix
  best = places.find(p => p.name_ascii.startsWith(q) || (p.aliases || []).some(a => normalizeAscii(a).startsWith(q))) || null
  if (best) return best
  // Includes
  best = places.find(p => p.name_ascii.includes(q) || (p.aliases || []).some(a => normalizeAscii(a).includes(q))) || null
  return best
}

export async function findByPSC(psc: string): Promise<GazetteerPlace | null> {
  const norm = (psc || '').replace(/\s+/g, '')
  const places = await loadGazetteer()
  return places.find(p => (p.psc || []).some(code => code.replace(/\s+/g, '') === norm)) || null
}
