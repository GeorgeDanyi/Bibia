/*
  Validation script: ensure dataset yields enough nearby in-person therapists.
  Usage:
    pnpm tsx scripts/validate-therapists.ts Praha
    pnpm tsx scripts/validate-therapists.ts Praha Brno Plzeň

  Behavior:
  - Loads base dataset and merges synthetic if available
  - Resolves city to coordinates via CityService
  - Considers only in-person therapists (clinic/home_visit)
  - Calculates Haversine distance and prints buckets (<=5, <=15, <=30, <=50 km)
  - Prints top skills counts
  - Exits with code 1 if fewer than 9 in-person candidates within 50 km for any requested city
*/

import { CityService } from '@/lib/services/CityService'
import { haversineKm } from '@/lib/utils/geo'

type IndexedTherapist = {
  id: string
  name?: string
  city?: string
  lat?: number
  lng?: number
  meeting_types?: string[]
  locations?: Array<{ lat?: number|string; lon?: number|string; lng?: number|string; city?: string }>
  specialties?: string[]
  service_radius_km?: number
}

function toNumber(value: any): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.')
    const num = parseFloat(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}

function isInPerson(meetingTypes: any[]): boolean {
  const mt = Array.isArray(meetingTypes) ? meetingTypes.map(String) : []
  return mt.includes('ordinace') || mt.includes('dojizdeni') || mt.includes('dojíždění') || mt.includes('clinic') || mt.includes('home_visit')
}

function pickTherapistCoords(t: IndexedTherapist): { lat: number; lon: number } | null {
  // Prefer explicit lat/lng if valid
  const latNum = toNumber((t as any).lat)
  const lngNum = toNumber((t as any).lng)
  if (latNum !== null && lngNum !== null) return { lat: latNum, lon: lngNum }
  // Fallback to first valid location
  const loc = Array.isArray(t.locations) ? t.locations.find(l => toNumber((l as any).lat) !== null && (toNumber((l as any).lon) !== null || toNumber((l as any).lng) !== null)) : null
  if (loc) {
    const la = toNumber((loc as any).lat)!
    const lo = toNumber((loc as any).lon) ?? toNumber((loc as any).lng)!
    if (la !== null && lo !== null) return { lat: la, lon: lo }
  }
  // City centroid as last resort
  if (t.city) {
    try {
      const resolved = CityService.resolve(t.city)
      if (resolved) return { lat: resolved.lat, lon: resolved.lng }
    } catch {}
  }
  return null
}

function loadDataset(): IndexedTherapist[] {
  let base: IndexedTherapist[] = []
  try {
    // eslint-disable-next-line
    const data = require('../data/therapists.json') as any[]
    base = Array.isArray(data) ? data as IndexedTherapist[] : []
  } catch {
    base = []
  }
  let merged = base
  try {
    // eslint-disable-next-line
    const synthetic = require('../data/therapists.synthetic.json') as any[]
    if (Array.isArray(synthetic) && synthetic.length > 0) {
      const map = new Map<string, IndexedTherapist>()
      for (const t of base) map.set(String(t.id), t as IndexedTherapist)
      for (const s of synthetic) {
        const id = String((s as any).id)
        if (!map.has(id)) map.set(id, s as IndexedTherapist)
      }
      merged = Array.from(map.values())
    }
  } catch {}
  return merged
}

function bucketize(distances: number[]): { '<=5': number; '<=15': number; '<=30': number; '<=50': number } {
  const buckets = { '<=5': 0, '<=15': 0, '<=30': 0, '<=50': 0 }
  for (const d of distances) {
    if (!Number.isFinite(d)) continue
    if (d <= 5) buckets['<=5']++
    if (d <= 15) buckets['<=15']++
    if (d <= 30) buckets['<=30']++
    if (d <= 50) buckets['<=50']++
  }
  return buckets
}

async function main() {
  const args = process.argv.slice(2)
  const targetCities = args.length > 0 ? args : ['Praha', 'Brno', 'Plzeň']
  const dataset = loadDataset()
  if (dataset.length === 0) {
    console.error('Dataset empty: data/therapists.json not found or empty')
    process.exit(1)
  }

  let overallOk = true

  for (const city of targetCities) {
    const resolved = CityService.resolve(city)
    if (!resolved) {
      console.error(`City not found: ${city}`)
      overallOk = false
      continue
    }
    const user = { lat: resolved.lat, lon: resolved.lng }

    // Consider in-person only
    const inPerson = dataset.filter(t => isInPerson(t.meeting_types || []))

    const distances: number[] = []
    const within50: IndexedTherapist[] = []
    const skillCounts = new Map<string, number>()

    for (const t of inPerson) {
      const coords = pickTherapistCoords(t)
      if (!coords) continue
      const d = Math.max(0, haversineKm(user, coords))
      if (Number.isFinite(d)) {
        distances.push(d)
        if (d <= 50) {
          within50.push(t)
          for (const s of (t.specialties || [])) {
            const key = String(s)
            skillCounts.set(key, (skillCounts.get(key) || 0) + 1)
          }
        }
      }
    }

    const buckets = bucketize(distances)
    const topSkills = Array.from(skillCounts.entries()).sort((a,b)=> b[1]-a[1]).slice(0, 10)

    // Output
    console.log(`\nCity: ${city}`)
    console.log(`Total in-person therapists: ${inPerson.length}`)
    console.log(`Candidates within 50 km: ${within50.length}`)
    console.log(`Buckets:`)
    console.log(`  <= 5 km : ${buckets['<=5']}`)
    console.log(`  <= 15 km: ${buckets['<=15']}`)
    console.log(`  <= 30 km: ${buckets['<=30']}`)
    console.log(`  <= 50 km: ${buckets['<=50']}`)
    if (topSkills.length > 0) {
      console.log('Top skills within 50 km:')
      for (const [skill, count] of topSkills) {
        console.log(`  ${skill}: ${count}`)
      }
    }

    if (within50.length < 9) {
      console.error(`\n❌ Not enough candidates within 50 km for ${city}: ${within50.length} (<9)`) 
      overallOk = false
    } else {
      console.log(`\n✅ ${city}: OK (>=9 within 50 km)`) 
    }
  }

  process.exit(overallOk ? 0 : 1)
}

// eslint-disable-next-line no-console
main().catch((err) => { console.error(err); process.exit(1) })

#!/usr/bin/env ts-node
import fs from 'node:fs'
import path from 'node:path'
import { normalizeTherapist } from '../lib/validation/therapist'

function readJson(filePath: string): any {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  const raw = fs.readFileSync(abs, 'utf8')
  return JSON.parse(raw)
}

function printResult(idx: number, id: string | undefined, ok: boolean, errors?: any[], warnings?: string[]) {
  const label = id ? `${idx} (${id})` : `${idx}`
  if (ok) {
    const warn = warnings && warnings.length ? ` ⚠️ warnings: ${warnings.length}` : ''
    console.log(`✅ ${label}${warn}`)
    if (warnings && warnings.length) warnings.forEach(w => console.log(`   · ${w}`))
  } else {
    console.log(`❌ ${label}`)
    if (errors) {
      errors.forEach((e, i) => {
        const sugg = e.suggestion ? ` Suggestion: '${e.suggestion}'.` : ''
        console.log(`   ${i + 1}. ${e.path}: expected ${e.expected}; received ${e.received}.${sugg}`)
      })
    }
  }
}

function main() {
  const inputPath = process.argv[2] || 'data/therapists.json'
  const outputPath = process.argv[3] // optional normalized output file
  let data: any
  try {
    data = readJson(inputPath)
  } catch (e) {
    console.error(`Failed to read JSON from ${inputPath}:`, e)
    process.exit(2)
  }

  const arr: any[] = Array.isArray(data) ? data : [data]
  const normalized: any[] = []
  const invalid: { id?: string; idx: number; errors: any[] }[] = []
  let okCount = 0
  let failCount = 0

  arr.forEach((rec, idx) => {
    const res = normalizeTherapist(rec)
    if (res.ok) {
      okCount++
      normalized.push(res.value)
    } else {
      failCount++
      invalid.push({ id: rec?.id, idx, errors: res.errors || [] })
    }
  })

  // Output concise remediation report
  console.log(`Totals: ${arr.length} records, ✅ ${okCount} valid, ❌ ${failCount} invalid`)
  if (invalid.length) {
    console.log('\nFirst 10 invalid:')
    invalid.slice(0, 10).forEach((inv) => {
      const first3 = inv.errors.slice(0, 3).map((e, i) => {
        const sugg = e.suggestion ? `; suggestion: ${e.suggestion}` : ''
        return `    ${i + 1}. ${e.path} → expected ${e.expected}; received ${e.received}${sugg}`
      })
      console.log(`- id=${inv.id ?? '(no id)'} at index ${inv.idx}: ${inv.errors.length} errors`) 
      first3.forEach(l => console.log(l))
    })
  }

  if (outputPath) {
    try {
      const absOut = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath)
      fs.writeFileSync(absOut, JSON.stringify(normalized, null, 2) + '\n', 'utf8')
      console.log(`\nWrote normalized records: ${absOut}`)
    } catch (e) {
      console.error('Failed to write normalized output:', e)
    }
  }

  process.exit(failCount > 0 ? 1 : 0)
}

main()


