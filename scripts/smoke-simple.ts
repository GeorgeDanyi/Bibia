import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { searchSimple } from '@/lib/search/booleanGeo'
import { type TherapistNormalized } from '@/lib/types/therapist'

async function loadTherapists(): Promise<TherapistNormalized[]> {
  const p = path.join(process.cwd(), 'data', 'therapists.normalized.json')
  const raw = await readFile(p, 'utf8')
  const json = JSON.parse(raw)
  return Array.isArray(json) ? json : []
}

async function run() {
  const therapists = await loadTherapists()

  const queries = [
    { city: 'Kladno', radiusKm: 20, gender: 'male' as const, conditionText: 'po úrazu kotníku' },
    { city: 'Brno', radiusKm: 15, gender: 'any' as const, conditionText: 'koleno' },
    { city: 'Ostrava', radiusKm: 25, gender: 'female' as const, conditionText: 'rameno' },
  ]

  for (const q of queries) {
    const res = searchSimple({ query: q, therapists })
    const first3 = res.slice(0,3).map(r => `${r.therapist.id}:${r.distanceKm === null ? 'null' : r.distanceKm.toFixed(1)}km`)
    console.log(`[${q.city}, ${q.radiusKm}km, ${q.gender}, ${q.conditionText}] -> count=${res.length} first3=${first3.join(', ')}`)
  }
}

run().catch(err => {
  console.error('Smoke failed:', err)
  process.exit(1)
})


