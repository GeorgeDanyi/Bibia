import { shapeResults } from '../lib/results/shape'
import { canonicalizeCity } from '../lib/geo/cityIndex'
import fs from 'fs'

function loadCandidates(): any[] {
  let base: any[] = []
  try { base = JSON.parse(fs.readFileSync(require.resolve('../data/therapists.json'), 'utf-8')) } catch {}
  let synthetic: any[] = []
  try { synthetic = JSON.parse(fs.readFileSync(require.resolve('../data/therapists.synthetic.json'), 'utf-8')) } catch {}
  const mapped = synthetic.map((s: any) => ({
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
  return base.concat(mapped)
}

function run(label: string, opts: { city: string; radiusKm?: number; gender?: 'male'|'female'|'any'; diagnosisRarity?: 'specialized'|'common'|'none'; diagnosisId?: string }) {
  const radiusKm = opts.radiusKm ?? 20
  const city = canonicalizeCity(opts.city)?.city || opts.city
  const candidates = loadCandidates() as any[]
  const { results } = shapeResults({
    user: {
      meeting_modes: ['clinic','home_visit','online'] as any,
      city,
      radiusKm,
      therapist_gender_pref: opts.gender || 'any',
      primaryLanguage: 'cs',
      preferredLanguages: ['cs'],
      diagnosisRarity: opts.diagnosisRarity || 'common',
      diagnosisId: opts.diagnosisId
    },
    candidates: candidates as any
  })
  console.log(`\n=== ${label} ===`)
  if (results.length === 0) { console.log('No results'); process.exitCode = 1; return }
  for (const r of results.slice(0,3)) {
    console.log(`tier=${r.tier} km=${r.km ?? '—'} mode=${r.mode} id=${r.therapist.id} langs=${(r.therapist.languages||[]).join(',')}`)
  }
}

run('Praha, 20km, any', { city: 'Praha' })
run('Brno, 20km, any', { city: 'Brno' })
run('Plzeň, 20km, kotník (common)', { city: 'Plzeň', diagnosisRarity: 'common' })
run('Kladno, 20km, male', { city: 'Kladno', gender: 'male' })
run('Zlín, 20km, Bechtěrev', { city: 'Zlín', diagnosisRarity: 'specialized', diagnosisId: 'ankylosing_spondylitis' })
