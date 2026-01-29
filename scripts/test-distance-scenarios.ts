#!/usr/bin/env ts-node

import assert from 'assert'
import fetch from 'node-fetch'

async function callSearch(body: any) {
  const res = await fetch('http://localhost:3000/api/searchTherapists', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function run() {
  const prg = await callSearch({ query: { location: { city: 'Praha' }, meetingType: 'ordinace' }, limit: 8, radiusKm: 30 })
  const top3 = prg.results.slice(0,3).map((r: any) => r.distance_km).filter((x: any) => typeof x === 'number')
  assert(top3.every((km: number) => km >= 0.5), 'No 0.0 km in top-3')

  const brnoInPerson = await callSearch({ query: { location: { city: 'Brno' }, meetingType: 'ordinace' }, limit: 8, radiusKm: 30 })
  const brnoOnline = await callSearch({ query: { location: { city: 'Brno' }, meetingType: 'online' }, limit: 8 })
  assert(brnoInPerson.results.some((r: any) => typeof r.distance_km === 'number'))
  assert(brnoOnline.results.every((r: any) => r.distance_km === undefined))

  const doj = await callSearch({ query: { location: { city: 'Praha' }, meetingType: 'dojíždění' }, limit: 8, radiusKm: 15 })
  const allKm = doj.results.map((r: any) => r.distance_km).filter((x: any) => typeof x === 'number')
  assert(allKm.every((km: number) => km <= 15 + 1e-6), 'No item beyond 15 km')

  const labels = ['Ceske Budejovice', 'České Budějovice', 'ČB', '37001']
  const coords: Array<{ lat:number; lon:number }> = []
  for (const label of labels) {
    const res = await callSearch({ query: { location: { city: label }, meetingType: 'ordinace' }, limit: 1 })
    const dbg = res.results[0]?.geo_debug?.user
    if (dbg) coords.push(dbg)
  }
  if (coords.length >= 2) {
    const base = coords[0]
    assert(coords.every(c => Math.abs(c.lat - base.lat) < 0.02 && Math.abs((c as any).lon - (base as any).lon) < 0.02), 'Ambiguous inputs resolve consistently')
  }

  const est = prg.results.find((r: any) => r.distance_estimated)
  if (est) assert(est.distance_estimated === true)

  console.log('QA distance scenarios: OK')
}

run().catch(e => { console.error(e); process.exit(1) })
