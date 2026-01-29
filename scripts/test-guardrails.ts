import { shapeResults } from '../lib/results/shape.ts'
import { canonicalizeCity } from '../lib/geo/cityIndex.ts'
import fs from 'fs'

function loadCandidates(): any[] {
  let base: any[] = []
  try {
    base = JSON.parse(fs.readFileSync(require.resolve('../data/therapists.json'), 'utf-8'))
  } catch {}
  let seeds: any[] = []
  try {
    seeds = JSON.parse(fs.readFileSync(require.resolve('../data/seeds/therapists_min_guardrails.json'), 'utf-8'))
  } catch {}
  // Map seeds to TherapistNormalized-lite to pass shapeResults
  const mappedSeeds = seeds.map((s: any) => ({
    id: s.id,
    full_name: s.full_name,
    gender: s.gender,
    accepting_new: s.accepting_new,
    meeting_modes: s.meeting_modes,
    base_city: s.base_city,
    locations: s.locations,
    service_radius_km: s.service_radius_km,
    languages: s.languages,
    insurers: s.insurers || [],
    specialties: s.specialties || [],
    diagnosis_expertise: s.diagnosis_expertise || [],
    patient_groups: s.patient_groups || ['adult'],
    weekly_availability: s.weekly_availability || {},
    rating: s.rating || { average: 4.0, count: 1 },
    next_available_in_days: s.next_available_in_days ?? 14,
    hard_filters_passed: true,
    diagnosis_signal: { signal: null as any }
  }))
  return base.concat(mappedSeeds)
}

function runCase(label: string, city: string, radiusKm: number, gender: 'male'|'female'|'any', diagRarity: 'specialized'|'common'|'none', diagnosisId?: string) {
  const c = canonicalizeCity(city)?.city || city
  const candidates = loadCandidates() as any[]
  const { results } = shapeResults({
    user: {
      meeting_modes: ['clinic','home_visit','online'] as any,
      city: c,
      radiusKm,
      therapist_gender_pref: gender,
      primaryLanguage: 'cs',
      preferredLanguages: ['cs'],
      diagnosisRarity: diagRarity,
      diagnosisId
    },
    candidates: candidates as any
  })
  const topTier = results[0]?.tier
  const ok = results.length > 0 && (topTier === 1 || topTier === 3 || topTier === 4)
  console.log(`${label}: ${ok ? 'OK' : 'FAIL'} (topTier=${topTier}, count=${results.length})`)
  if (!ok) process.exitCode = 1
}

// Control queries
runCase('Kladno kotník muž', 'Kladno', 20, 'male', 'common')
runCase('Plzeň vyhřezlá ploténka žena', 'Plzeň', 20, 'female', 'common')
runCase('Zlín Bechtěrev any', 'Zlín', 20, 'any', 'specialized', 'ankylosing_spondylitis')
