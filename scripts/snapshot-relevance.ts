#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

type Q = { city: string; meetingType: 'ordinace'|'dojíždění'|'online'; label: string }

const CANONICAL: Q[] = [
  { city: 'Praha', meetingType: 'ordinace', label: 'prague-office' },
  { city: 'Praha', meetingType: 'dojíždění', label: 'prague-home' },
  { city: 'Praha', meetingType: 'online', label: 'prague-online' },
  { city: 'Brno', meetingType: 'ordinace', label: 'brno-office' },
  { city: 'Brno', meetingType: 'dojíždění', label: 'brno-home' },
  { city: 'Brno', meetingType: 'online', label: 'brno-online' },
  { city: 'Ostrava', meetingType: 'ordinace', label: 'ostrava-office' },
  { city: 'Ostrava', meetingType: 'dojíždění', label: 'ostrava-home' },
  { city: 'Ostrava', meetingType: 'online', label: 'ostrava-online' },
  { city: 'Praha', meetingType: 'ordinace', label: 'prague-office-evening' },
]

async function callSearch(q: Q) {
  const body: any = { query: { location: { city: q.city }, meetingType: q.meetingType }, limit: 12 }
  const res = await fetch('http://localhost:3000/api/searchTherapists', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.results.map((r: any, i: number) => ({ pos: i+1, id: r.id, score: r.match_score, km: r.distance_km }))
}

function diffArrays(before: any[], after: any[]) {
  const max = Math.max(before.length, after.length)
  const diffs: string[] = []
  for (let i=0; i<max; i++) {
    const a = before[i]
    const b = after[i]
    if (!a || !b) continue
    if (a.id !== b.id) {
      diffs.push(`#${i+1}: ${a.id} → ${b.id}`)
    }
  }
  return diffs
}

async function run() {
  const outDir = path.join(process.cwd(), 'test-reports', 'ab-snapshots')
  fs.mkdirSync(outDir, { recursive: true })

  const timestamp = Date.now()
  const before: Record<string, any[]> = {}
  const after: Record<string, any[]> = {}

  // Take BEFORE snapshot
  for (const q of CANONICAL) {
    before[q.label] = await callSearch(q)
  }
  fs.writeFileSync(path.join(outDir, `before-${timestamp}.json`), JSON.stringify(before, null, 2))

  console.log('== BEFORE captured. Now adjust geo constants (via admin panel or API) and run again to capture AFTER ==')

  // Optionally pause or re-run logic could be added; for now, require running script twice or manual step
  // Simulate AFTER same as BEFORE if env var SNAPSHOT_AFTER=1
  if (process.env.SNAPSHOT_AFTER === '1') {
    for (const q of CANONICAL) {
      after[q.label] = await callSearch(q)
    }
    fs.writeFileSync(path.join(outDir, `after-${timestamp}.json`), JSON.stringify(after, null, 2))

    // Create diffs
    const diffs: Record<string, string[]> = {}
    for (const q of CANONICAL) {
      diffs[q.label] = diffArrays(before[q.label] || [], after[q.label] || [])
    }
    fs.writeFileSync(path.join(outDir, `diff-${timestamp}.json`), JSON.stringify(diffs, null, 2))
    console.log('A/B diffs saved:', path.join(outDir, `diff-${timestamp}.json`))
  }
}

run().catch(e => { console.error(e); process.exit(1) })


