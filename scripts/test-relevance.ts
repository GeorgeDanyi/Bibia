#!/usr/bin/env tsx

import assert from 'node:assert'

type Q = {
  name: string
  body: any
  expectations: (resp: any) => void
}

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

const queries: Q[] = [
  {
    name: 'Praha + womens_health + female preferred',
    body: { city: 'Praha', meetingType: 'ordinace', diagnosis: { canonicalId: 'womens_health' }, therapistGenderPref: 'female', wantsInsurance: true, timeFit: 'weekday' },
    expectations: (resp) => {
      assert(resp.results.length >= 6)
      const top3 = resp.results.slice(0,3)
      assert(top3.some((r:any)=> r.reasons.some((s:string)=> s.includes('specialista na womens_health')) || r.score_breakdown.diagnosis >= 35))
    }
  },
  {
    name: 'Child + barrier-free',
    body: { city: 'Brno', meetingType: 'ordinace', ageGroup: 'child', barrierFree: true },
    expectations: (resp) => {
      assert(resp.results.length >= 3)
    }
  },
  {
    name: 'Online only ignores distance',
    body: { city: 'Ostrava', meetingType: 'online', diagnosis: { canonicalId: 'spine_pain' } },
    expectations: (resp) => {
      assert(resp.results.every((r:any)=> r.distance_km === 0))
    }
  },
  {
    name: 'Weekend evenings',
    body: { city: 'Praha', meetingType: 'ordinace', timeFit: 'weekend' },
    expectations: (resp) => {
      assert(resp.results.length >= 6)
    }
  }
]

async function postSearch(body: any) {
  const res = await fetch(`${BASE}/api/searchTherapists`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert(res.ok, `API status ${res.status}`)
  return res.json()
}

async function main() {
  let passed = 0
  for (const q of queries) {
    const t0 = Date.now()
    const resp = await postSearch(q.body)
    const t1 = Date.now() - t0
    assert(t1 < 200, `API too slow: ${t1}ms`)
    q.expectations(resp)
    passed++
    console.log(`✅ ${q.name} (${t1}ms)`) 
  }
  console.log(`All tests passed: ${passed}/${queries.length}`)
}

main().catch((e)=>{ console.error('❌ Relevance tests failed', e); process.exit(1) })


