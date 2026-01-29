#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'

type T = {
  id: string
  name: string
  gender?: 'female'|'male'
  city: string
  lat: number
  lng: number
  meeting_types: string[]
  service_radius_km: number
  languages: string[]
  specialties: string[]
  age_groups: string[]
  accepts_insurance: boolean
  availability: string[]
  profile_score: number
  reviews_count: number
  verified: boolean
  bio: string
  created_at: string
  metadata?: any
}

const TARGET_TOTAL = 30
const TARGET_MIN_EACH = 8
const GROUPS = ['womens_health', 'pelvic_floor', 'postpartum'] as const
const CITIES: Array<{ city: 'Praha'|'Brno'; center: { lat: number; lng: number } }> = [
  { city: 'Praha', center: { lat: 50.0755, lng: 14.4378 } },
  { city: 'Brno', center: { lat: 49.1951, lng: 16.6068 } }
]

function jitter(val: number, maxDelta: number) {
  return val + (Math.random() * 2 - 1) * maxDelta
}

function morningSlots(): string[] {
  const now = new Date()
  const slots: string[] = []
  for (let i=2;i<=14;i+=2) {
    const d = new Date(now.getTime() + i*24*3600*1000)
    d.setHours(8 + (i%3), 30, 0, 0)
    slots.push(d.toISOString())
  }
  return slots
}

function countByCityAndGroup(therapists: T[]) {
  const counts: Record<string, { total: number; womens_health: number; pelvic_floor: number; postpartum: number }> = {}
  for (const t of therapists) {
    if (t.gender !== 'female') continue
    if (!counts[t.city]) counts[t.city] = { total: 0, womens_health: 0, pelvic_floor: 0, postpartum: 0 }
    counts[t.city].total++
    for (const g of GROUPS) {
      if (t.specialties.includes(g)) counts[t.city][g]++
    }
  }
  return counts
}

function synthesize(cityLabel: 'Praha'|'Brno', center: { lat: number; lng: number }, neededTotals: { total: number; womens_health: number; pelvic_floor: number; postpartum: number }, startIndex: number): T[] {
  const created: T[] = []
  // Build a queue of specialties to satisfy minimums first
  let specOrder: string[] = []
  for (const g of GROUPS) {
    for (let i=0; i<neededTotals[g as keyof typeof neededTotals]; i++) specOrder.push(g)
  }
  // Fill remaining to hit total with any of the groups
  const remain = Math.max(0, neededTotals.total - specOrder.length)
  for (let i=0; i<remain; i++) specOrder.push(GROUPS[i % GROUPS.length])

  specOrder.forEach((spec, idx) => {
    const idNum = startIndex + idx + 1
    const lat = jitter(center.lat, 0.08)
    const lng = jitter(center.lng, 0.12)
    const t: T = {
      id: `therapist_w_${cityLabel.toLowerCase()}_${idNum}`,
      name: `Bc. Žena ${cityLabel} ${idNum}`,
      gender: 'female',
      city: cityLabel,
      lat, lng,
      meeting_types: ['ordinace'],
      service_radius_km: 0,
      languages: ['cestina', 'anglictina'],
      specialties: ['spine_pain', spec],
      age_groups: ['adult'],
      accepts_insurance: true,
      availability: morningSlots(),
      profile_score: 0.6 + Math.random()*0.25,
      reviews_count: Math.floor(30 + Math.random()*200),
      verified: Math.random() < 0.6,
      bio: 'Specializace na ženské zdraví a pánevní dno. Individuální přístup.',
      created_at: new Date().toISOString(),
      metadata: { has_photos: Math.random()<0.7, education: 'Mgr.', barrier_free: false }
    }
    created.push(t)
  })
  return created
}

async function main() {
  const dataPath = path.join(process.cwd(), 'data', 'therapists.json')
  const backupPath = path.join(process.cwd(), 'backups', `therapists_${Date.now()}.json`)
  const raw = fs.readFileSync(dataPath, 'utf8')
  const therapists: T[] = JSON.parse(raw)

  const counts = countByCityAndGroup(therapists)
  console.log('Current female coverage:', counts)

  let nextIndex = therapists.length
  const additions: T[] = []

  for (const { city, center } of CITIES) {
    const c = counts[city] || { total: 0, womens_health: 0, pelvic_floor: 0, postpartum: 0 }
    const needTotal = Math.max(0, TARGET_TOTAL - c.total)
    const needW = Math.max(0, TARGET_MIN_EACH - c.womens_health)
    const needP = Math.max(0, TARGET_MIN_EACH - c.pelvic_floor)
    const needPP = Math.max(0, TARGET_MIN_EACH - c.postpartum)
    if (needTotal === 0 && needW === 0 && needP === 0 && needPP === 0) continue

    const neededByGroup = { total: needTotal, womens_health: needW, pelvic_floor: needP, postpartum: needPP }
    const created = synthesize(city, center, neededByGroup, nextIndex)
    nextIndex += created.length
    additions.push(...created)
  }

  if (additions.length === 0) {
    console.log('No additions needed. Targets already met.')
    return
  }

  // Backup and write
  fs.mkdirSync(path.dirname(backupPath), { recursive: true })
  fs.writeFileSync(backupPath, JSON.stringify(therapists, null, 2))
  const updated = [...therapists, ...additions]
  fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2))

  console.log(`Added ${additions.length} profiles. Backup saved at ${backupPath}`)
}

main().catch(err => { console.error(err); process.exit(1) })


