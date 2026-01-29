/*
 Geolocation audit: validate city canonicalization and therapist coordinates
 Usage: npx ts-node scripts/geo-audit.ts "Karlovy Vary"
*/

import fs from 'fs'
import path from 'path'
import { canonicalizeCity } from '@/lib/geo/cityIndex'
import { CZ_CITIES } from '@/data/cz_cities'
import { computeEffectiveDistance } from '@/lib/geo/distance'
import { type TherapistNormalized, type MeetingMode } from '@/lib/types/therapist'

function readJson<T = any>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T } catch { return null }
}

function loadTherapists(): TherapistNormalized[] {
  const root = path.resolve(__dirname, '..')
  const normPath = path.resolve(root, '../data/therapists.normalized.json')
  const basePath = path.resolve(root, '../data/therapists.json')
  const synPath = path.resolve(root, '../data/therapists.synthetic.json')
  let list: TherapistNormalized[] = []
  const norm = readJson<TherapistNormalized[]>(normPath)
  if (Array.isArray(norm) && norm.length > 0) list = norm
  else {
    const base = readJson<any[]>(basePath) || []
    list = Array.isArray(base) ? (base as any) : []
  }
  const syn = readJson<any[]>(synPath)
  if (Array.isArray(syn) && syn.length > 0) {
    const merged = new Map<string, TherapistNormalized>()
    for (const t of list as any[]) merged.set((t as any).id, t as any)
    for (const s of syn as any[]) if (!merged.has((s as any).id)) merged.set((s as any).id, s as any)
    return Array.from(merged.values()) as TherapistNormalized[]
  }
  return list
}

function getCityCoords(cityInput: string): { city: string; lat: number; lon: number } | null {
  const can = canonicalizeCity(cityInput)
  if (!can) return null
  const rec = CZ_CITIES.find(c => c.city === can.city)
  if (!rec) return null
  return { city: rec.city, lat: rec.lat, lon: rec.lon }
}

function hasInPerson(t: TherapistNormalized): boolean {
  return t.meeting_modes.includes('clinic') || t.meeting_modes.includes('home_visit')
}

function coordsMissingOrInvalid(t: TherapistNormalized): boolean {
  if (!t.locations || t.locations.length === 0) return true
  for (const l of t.locations) {
    if (!Number.isFinite(l.lat) || !Number.isFinite(l.lon)) return true
  }
  return false
}

function coordsOutOfBounds(t: TherapistNormalized): boolean {
  if (!t.locations || t.locations.length === 0) return false
  for (const l of t.locations) {
    if (l.lat < 48.5 || l.lat > 51.1 || l.lon < 12.0 || l.lon > 18.9) return true
  }
  return false
}

function effectiveKmForInPerson(t: TherapistNormalized, clientCity: string): { km: number | null; allowed: boolean } {
  const modes: MeetingMode[] = ['clinic','home_visit']
  let bestKm: number | null = null
  let anyAllowed = false
  for (const m of modes) {
    if (!t.meeting_modes.includes(m)) continue
    const eff = computeEffectiveDistance({ clientCity, therapist: t, meetingMode: m })
    if (eff.allowed) {
      anyAllowed = true
      if (typeof eff.km === 'number' && Number.isFinite(eff.km)) {
        bestKm = bestKm === null ? eff.km : Math.min(bestKm, eff.km)
      }
    }
  }
  return { km: bestKm, allowed: anyAllowed }
}

function main() {
  const cityArg = process.argv.slice(2).join(' ').trim()
  if (!cityArg) {
    console.error('Usage: npx ts-node scripts/geo-audit.ts "Karlovy Vary"')
    process.exit(2)
  }

  const city = getCityCoords(cityArg)
  if (!city) {
    console.error(`City not recognized: ${cityArg}`)
    process.exit(2)
  }

  const therapists = loadTherapists()
  if (!Array.isArray(therapists) || therapists.length === 0) {
    console.error('No therapists dataset found (expected data/therapists.normalized.json or data/therapists.json).')
    process.exit(2)
  }

  const nearest: Array<{ id: string; city: string; km: number }> = []
  let missingCoords = 0
  let outOfBounds = 0

  for (const t of therapists) {
    if (!hasInPerson(t)) continue
    if (coordsMissingOrInvalid(t)) { missingCoords++; continue }
    if (coordsOutOfBounds(t)) { outOfBounds++ }
    const eff = effectiveKmForInPerson(t, city.city)
    if (eff.allowed && typeof eff.km === 'number' && Number.isFinite(eff.km)) {
      nearest.push({ id: t.id, city: t.base_city, km: eff.km })
    }
  }

  nearest.sort((a,b) => a.km - b.km)
  const top10 = nearest.slice(0, 10)

  console.log(`City: ${city.city} (${city.lat.toFixed(4)}, ${city.lon.toFixed(4)})`)
  console.log('Top 10 nearest in-person therapists:')
  for (const n of top10) {
    console.log(`- ${n.id}	${n.city}	${n.km.toFixed(1)} km`)
  }
  console.log(`MISSING_COORDS: ${missingCoords}`)
  console.log(`OUT_OF_BOUNDS: ${outOfBounds}`)
}

main()


