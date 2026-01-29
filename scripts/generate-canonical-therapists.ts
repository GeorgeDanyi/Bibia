#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { CANONICAL_LANGUAGES, CANONICAL_AGE_GROUPS, CANONICAL_MEETING_TYPES, CANONICAL_SPECIALTIES } from '@/lib/constants/canonical-taxonomies'

type MeetingType = typeof CANONICAL_MEETING_TYPES[number]
type AgeGroup = typeof CANONICAL_AGE_GROUPS[number]

type CanonicalTherapist = {
  id: string
  name: string
  gender: 'male' | 'female'
  city: string
  lat: number
  lng: number
  meeting_types: MeetingType[]
  service_radius_km: number
  languages: string[]
  specialties: string[]
  age_groups: AgeGroup[]
  accepts_insurance: boolean
  availability: string[]
  profile_score: number
  reviews_count: number
  verified: boolean
  bio: string
  created_at: string
  metadata: { has_photos: boolean; education: string; barrier_free: boolean }
}

// City distribution: Praha 40%, krajská města 40%, ostatní 20%
// We approximate using weights proportional to these targets.
const CITIES: Record<string, { lat: number; lng: number; bucket: 'praha' | 'kraj' | 'ostatni' }> = {
  'Praha': { lat: 50.0755, lng: 14.4378, bucket: 'praha' },
  'Brno': { lat: 49.1951, lng: 16.6068, bucket: 'kraj' },
  'Ostrava': { lat: 49.8209, lng: 18.2625, bucket: 'kraj' },
  'Plzeň': { lat: 49.7384, lng: 13.3736, bucket: 'kraj' },
  'Olomouc': { lat: 49.5938, lng: 17.2509, bucket: 'kraj' },
  'České Budějovice': { lat: 48.9745, lng: 14.4747, bucket: 'kraj' },
  'Hradec Králové': { lat: 50.2104, lng: 15.8252, bucket: 'kraj' },
  'Liberec': { lat: 50.7663, lng: 15.0543, bucket: 'kraj' },
  'Pardubice': { lat: 50.0343, lng: 15.7812, bucket: 'kraj' },
  'Ústí nad Labem': { lat: 50.6611, lng: 14.0531, bucket: 'kraj' },
  'Zlín': { lat: 49.2264, lng: 17.6707, bucket: 'kraj' },
  // Others: representative towns per region
  'Karlovy Vary': { lat: 50.2310, lng: 12.8710, bucket: 'ostatni' },
  'Jihlava': { lat: 49.3960, lng: 15.5912, bucket: 'ostatni' },
  'Mladá Boleslav': { lat: 50.4114, lng: 14.9032, bucket: 'ostatni' },
  'Kladno': { lat: 50.1473, lng: 14.1029, bucket: 'ostatni' },
  'Frýdek-Místek': { lat: 49.6819, lng: 18.3673, bucket: 'ostatni' },
  'Znojmo': { lat: 48.8555, lng: 16.0488, bucket: 'ostatni' },
  'Opava': { lat: 49.9387, lng: 17.9026, bucket: 'ostatni' },
  'Teplice': { lat: 50.6400, lng: 13.8200, bucket: 'ostatni' },
  'Karviná': { lat: 49.8540, lng: 18.5417, bucket: 'ostatni' }
}

const LANGS = CANONICAL_LANGUAGES
const SPECIALTIES = CANONICAL_SPECIALTIES as readonly string[]

// Seedable PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomOf<T>(arr: readonly T[], min: number, max: number, rnd = Math.random): T[] {
  const n = Math.floor(Math.random()*(max-min+1))+min
  const shuffled = [...arr].sort(()=>rnd()-0.5)
  return shuffled.slice(0,n)
}

function jitter(v: number, span: number, rnd = Math.random) { return v + (rnd()-0.5)*span }

function generate(total = 1500, seed?: number): CanonicalTherapist[] {
  const rnd = seed !== undefined ? mulberry32(seed) : Math.random
  // enforce each specialty appears >=30 times
  const minPerSpecialty = 30
  const results: CanonicalTherapist[] = []
  const cityEntries = Object.entries(CITIES)
  const prahaEntries = cityEntries.filter(([,m])=>m.bucket==='praha')
  const krajEntries = cityEntries.filter(([,m])=>m.bucket==='kraj')
  const ostatniEntries = cityEntries.filter(([,m])=>m.bucket==='ostatni')

  function pickFrom(list: typeof cityEntries): [string,{lat:number;lng:number}] {
    const [city, meta] = list[Math.floor(rnd()*list.length)]
    return [city, { lat: meta.lat, lng: meta.lng }]
  }

  // pre-seed specialties
  let idCounter = 1
  for (const spec of SPECIALTIES) {
    for (let i=0;i<minPerSpecialty;i++) {
      const bucketPick = i % 10 < 4 ? prahaEntries : (i % 10 < 8 ? krajEntries : ostatniEntries)
      const [city, base] = pickFrom(bucketPick)
      const isFemale = rnd()<0.55
      const meeting: MeetingType[] = rnd()<0.25 ? ['online'] : (rnd()<0.5 ? ['ordinace','online'] : ['ordinace','dojizdeni'])
      const serviceRadius = meeting.includes('dojizdeni') ? Math.floor(rnd()*31)+10 : 0
      const langs = Array.from(new Set(['cestina', ...randomOf(LANGS.slice(1), 0, 3, rnd)]))
      const ages: AgeGroup[] = Array.from(new Set(randomOf(['child','adult','senior'] as AgeGroup[], 1, 3, rnd)))
      const availability: string[] = randomOf([...Array(20)].map((_,k)=> {
        const d = new Date(Date.now()+ (k+1)*24*3600*1000 + Math.floor(rnd()*8)*3600*1000)
        return d.toISOString().replace('Z','+01:00')
      }), 6, 12, rnd)
      const profile = Math.round((0.6 + rnd()*0.4)*100)/100 // 0.6..1.0
      const reviews = Math.floor(rnd()*300)
      const specsSeed = Array.from(new Set([spec, ...randomOf(SPECIALTIES.filter(s=>s!==spec), 3, 7, rnd)]))
      const t: CanonicalTherapist = {
        id: `therapist_${idCounter.toString().padStart(4,'0')}`,
        name: isFemale ? `MUDr. Jana ${idCounter}` : `Bc. Petr ${idCounter}`,
        gender: isFemale ? 'female' : 'male',
        city,
        lat: jitter(base.lat, 0.12, rnd),
        lng: jitter(base.lng, 0.18, rnd),
        meeting_types: meeting,
        service_radius_km: serviceRadius,
        languages: langs,
        specialties: specsSeed,
        age_groups: ages,
        accepts_insurance: rnd()<0.75,
        availability,
        profile_score: profile,
        reviews_count: reviews,
        verified: rnd()<0.85,
        bio: 'Zkušený fyzioterapeut se zaměřením na individuální péči.',
        created_at: new Date().toISOString(),
        metadata: { has_photos: rnd()<0.8, education: rnd()<0.5 ? 'Mgr.' : 'PhD', barrier_free: rnd()<0.4 }
      }
      results.push(t)
      idCounter++
    }
  }

  // Track counts to enforce Praha 40%, kraj 40%, ostatní 20%
  function cityBucketOf(city: string) { return CITIES[city].bucket }
  const targetPraha = Math.round(total * 0.40)
  const targetKraj = Math.round(total * 0.40)
  const targetOstatni = total - targetPraha - targetKraj

  const counts = { praha: results.filter(r=>cityBucketOf(r.city)==='praha').length, kraj: results.filter(r=>cityBucketOf(r.city)==='kraj').length, ostatni: results.filter(r=>cityBucketOf(r.city)==='ostatni').length }

  while (results.length < total) {
    const needed = counts.praha < targetPraha ? prahaEntries : (counts.kraj < targetKraj ? krajEntries : ostatniEntries)
    const [city, base] = pickFrom(needed)
    counts[cityBucketOf(city)]++ as any
    const isFemale = rnd()<0.55
    const meeting: MeetingType[] = rnd()<0.25 ? ['online'] : (rnd()<0.5 ? ['ordinace','online'] : ['ordinace','dojizdeni'])
    const serviceRadius = meeting.includes('dojizdeni') ? Math.floor(rnd()*31)+10 : 0
    const langs = Array.from(new Set(['cestina', ...randomOf(LANGS.slice(1), 0, 3, rnd)]))
    const ages: AgeGroup[] = Array.from(new Set(randomOf(['child','adult','senior'] as AgeGroup[], 1, 3, rnd)))
    const availability: string[] = randomOf([...Array(20)].map((_,k)=> {
      const d = new Date(Date.now()+ (k+1)*24*3600*1000 + Math.floor(rnd()*8)*3600*1000)
      return d.toISOString().replace('Z','+01:00')
    }), 6, 12, rnd)
    const specs = randomOf(SPECIALTIES, 4, 8, rnd)
    const profile = Math.round((0.6 + rnd()*0.4)*100)/100
    const reviews = Math.floor(rnd()*300)
    const t: CanonicalTherapist = {
      id: `therapist_${idCounter.toString().padStart(4,'0')}`,
      name: isFemale ? `Mgr. Anna ${idCounter}` : `MUDr. Tomáš ${idCounter}`,
      gender: isFemale ? 'female' : 'male',
      city,
      lat: jitter(base.lat, 0.12, rnd),
      lng: jitter(base.lng, 0.18, rnd),
      meeting_types: meeting,
      service_radius_km: serviceRadius,
      languages: langs,
      specialties: specs,
      age_groups: ages,
      accepts_insurance: rnd()<0.75,
      availability,
      profile_score: profile,
      reviews_count: reviews,
      verified: rnd()<0.85,
      bio: 'Specializace na pohybový aparát a rehabilitaci po úrazech.',
      created_at: new Date().toISOString(),
      metadata: { has_photos: rnd()<0.8, education: rnd()<0.5 ? 'Mgr.' : 'Bc.', barrier_free: rnd()<0.4 }
    }
    results.push(t)
    idCounter++
  }

  return results
}

function main() {
  const count = Number(process.env.T_COUNT || '1500')
  const seedEnv = process.env.SEED
  const seed = seedEnv ? Number(seedEnv) : undefined
  const data = generate(count, seed)
  const out = path.join(process.cwd(), 'data', 'therapists.json')
  fs.writeFileSync(out, JSON.stringify(data, null, 2))
  console.log(`Generated ${data.length} canonical therapists → ${out}`)
}

main()


