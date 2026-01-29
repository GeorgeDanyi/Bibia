#!/usr/bin/env ts-node

import assert from 'assert'
import fetch from 'node-fetch'

type MeetingType = 'ordinace'|'online'|'dojíždění'

type Query = {
  city: string
  meetingType: MeetingType
  gender: 'female'|'any'
  timeOfDay: 'morning'|'evening'
}

type ApiResult = {
  id: string
  distance_km?: number
  distance_estimated?: boolean
  meeting_types: string[]
  match_score: number
  next_available?: string|null
  geo_debug?: { distanceScore?: number }
}

const CITIES = ['Praha', 'Brno', 'Ostrava'] as const
const MEETING: MeetingType[] = ['ordinace', 'online', 'dojíždění']
const GENDERS: Array<Query['gender']> = ['female', 'any']
const TIMES: Array<Query['timeOfDay']> = ['morning', 'evening']

function buildQueries(): Query[] {
  const queries: Query[] = []
  for (const city of CITIES) {
    for (const meetingType of MEETING) {
      for (const gender of GENDERS) {
        for (const timeOfDay of TIMES) {
          queries.push({ city, meetingType, gender, timeOfDay })
        }
      }
    }
  }
  return queries
}

async function callSearch(q: Query, limit = 12, radiusKm = 30) {
  // Map inputs to API body per `app/api/searchTherapists/route.ts` normalization
  const therapistGenderPref = q.gender
  const timeBuckets = q.timeOfDay === 'morning' ? ['morning', 'late_morning'] : ['evening']

  const body: any = {
    query: {
      location: { city: q.city },
      meetingType: q.meetingType,
      therapistGenderPref,
      // Provide soft preferences for availability buckets
      timeBuckets
    },
    limit,
    radiusKm
  }
  const res = await fetch('http://localhost:3000/api/searchTherapists', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ results: ApiResult[], total: number }>
}

function diffLine(label: string, expected: unknown, got: unknown) {
  return `${label}\n  expected: ${JSON.stringify(expected)}\n  got:      ${JSON.stringify(got)}`
}

function assertAtLeastSix(results: ApiResult[], ctx: string) {
  assert(results.length >= 6, diffLine(`${ctx}: at least 6 results`, '>= 6', results.length))
}

function isNonZeroKm(km: unknown): boolean {
  return typeof km === 'number' && isFinite(km) && km >= 0.5
}

function assertInPersonDistanceRules(results: ApiResult[], ctx: string) {
  const withKm = results.filter(r => typeof r.distance_km === 'number')
  assert(withKm.every(r => isNonZeroKm(r.distance_km)), diffLine(`${ctx}: non-zero distances`, 'all >= 0.5 km', withKm.map(r => r.distance_km)))

  // Check that nearer tends to outrank farther among nearby neighbors
  const window = Math.min(8, withKm.length)
  const top = withKm.slice(0, window)
  for (let i = 1; i < top.length; i++) {
    const prev = top[i-1]
    const cur = top[i]
    // Allow ties when other signals dominate, but flag clear inversions (>1.5 km farther outranking)
    if (typeof prev.distance_km === 'number' && typeof cur.distance_km === 'number') {
      const delta = cur.distance_km - prev.distance_km
      if (delta < -1.5) {
        throw new Error(diffLine(`${ctx}: distance ordering`, 'non-decreasing km in top results (±1.5km tolerance)', top.map(r => r.distance_km)))
      }
    }
  }
}

function assertOnlineDistanceHidden(results: ApiResult[], ctx: string) {
  const hasKm = results.some(r => typeof r.distance_km === 'number')
  assert(!hasKm, diffLine(`${ctx}: online distance hidden`, 'all undefined', results.map(r => r.distance_km)))
  // Optional: check neutral distanceScore in geo_debug when present
  const scores = results.map(r => r.geo_debug?.distanceScore).filter((x): x is number => typeof x === 'number')
  if (scores.length > 0) {
    const within = scores.every(s => s >= 0.95 && s <= 1.05) // ~neutral (API sets online to score=1)
    assert(within, diffLine(`${ctx}: online distanceScore neutral`, '≈1.0', scores))
  }
}

function assertDojizdeniWithinRadius(results: ApiResult[], radiusKm: number, ctx: string) {
  const kms = results.map(r => r.distance_km).filter((x): x is number => typeof x === 'number')
  assert(kms.every(km => km <= radiusKm + 1e-6), diffLine(`${ctx}: within service radius`, `<= ${radiusKm}`, kms))
}

function assertTieBreak(results: ApiResult[], ctx: string) {
  // Spot check: if two consecutive items have similar scores, nearer should not be much farther
  for (let i = 1; i < Math.min(results.length, 8); i++) {
    const a = results[i-1]
    const b = results[i]
    const scoreClose = Math.abs(a.match_score - b.match_score) <= 5
    if (scoreClose && typeof a.distance_km === 'number' && typeof b.distance_km === 'number') {
      // If b is >2km closer than a, flag ordering
      if (a.distance_km - b.distance_km > 2.0) {
        throw new Error(diffLine(`${ctx}: tie-break by distance`, 'closer should outrank when scores tie', results.slice(0, 8).map(r => ({ id: r.id, score: r.match_score, km: r.distance_km }))))
      }
    }
  }
}

async function run() {
  const queries = buildQueries()
  const failures: string[] = []

  for (const q of queries) {
    const ctx = `[${q.city} | ${q.meetingType} | ${q.gender} | ${q.timeOfDay}]`
    try {
      const radiusKm = q.meetingType === 'dojíždění' ? 30 : 30
      const { results } = await callSearch(q, 12, radiusKm)

      assertAtLeastSix(results, ctx)

      if (q.meetingType === 'online') {
        assertOnlineDistanceHidden(results, ctx)
      } else {
        assertInPersonDistanceRules(results, ctx)
        assertTieBreak(results, ctx)
        if (q.meetingType === 'dojíždění') {
          assertDojizdeniWithinRadius(results, radiusKm, ctx)
        }
      }
    } catch (e: any) {
      failures.push(`${ctx}\n${e?.message || String(e)}`)
    }
  }

  if (failures.length > 0) {
    console.error('\nDistance QA Matrix – Failures:\n' + failures.map((f, i) => `\n${i+1}) ${f}`).join('\n'))
    process.exit(1)
  } else {
    console.log('✅ Distance QA Matrix passed for all scenarios')
  }
}

run().catch(err => { console.error(err); process.exit(1) })


