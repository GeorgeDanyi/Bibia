/*
 Batch reporter: runs multiple city queries and prints top 3 with km and tier.
 Usage:
   npx ts-node scripts/reporter-batch.ts
   npx ts-node scripts/reporter-batch.ts --file scenarios.txt

 File format (one per line):
   City | radiusKm | gender | languagesCsv | diagnosisText | practice
 Example:
   Praha | 15 | male | cs,en | koleno po úrazu | clinic
*/

import fs from 'fs'
import path from 'path'
import { normalizeSearchInputs } from '@/lib/matching/normalization'
import { canonicalizeCity } from '@/lib/geo/cityIndex'
import { computeEffectiveDistance } from '@/lib/geo/distance'
import { classifyTier } from '@/lib/search/classifyTier'
import { explainTier1 } from '@/lib/search/classifyTier'
import { type TherapistNormalized, type MeetingMode } from '@/lib/types/therapist'

function readJson<T = any>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T } catch { return null }
}

function loadTherapists(): TherapistNormalized[] {
  const root = path.resolve(__dirname, '..')
  const normPath = path.resolve(root, 'data/therapists.normalized.json')
  const basePath = path.resolve(root, 'data/therapists.json')
  const synPath = path.resolve(root, 'data/therapists.synthetic.json')
  let list: TherapistNormalized[] = []
  const norm = readJson<TherapistNormalized[]>(normPath)
  if (Array.isArray(norm) && norm.length > 0) list = norm
  else {
    const base = readJson<any[]>(basePath) || []
    list = Array.isArray(base) ? (base as any) : []
  }
  const syn = readJson<any[]>(synPath)
  if (Array.isArray(syn) && syn.length > 0) {
    const merged = new Map<string, TherapistNormalized>()
    for (const t of list as any[]) merged.set((t as any).id, t as any)
    for (const s of syn as any[]) if (!merged.has((s as any).id)) merged.set((s as any).id, s as any)
    return Array.from(merged.values()) as TherapistNormalized[]
  }
  return list
}

type Scenario = { city: string; radiusKm: number; gender: 'male'|'female'|'any'; languages: string[]; diagnosis: string; practice: 'clinic'|'home_visit'|'any'|'online' }

const DEFAULTS: Scenario[] = [
  { city: 'Praha', radiusKm: 15, gender: 'male', languages: ['cs','en'], diagnosis: 'koleno po úrazu', practice: 'clinic' },
  { city: 'Brno', radiusKm: 20, gender: 'any', languages: ['cs'], diagnosis: 'rameno', practice: 'any' },
  { city: 'Plzeň', radiusKm: 25, gender: 'female', languages: ['cs'], diagnosis: 'vyhřezlá ploténka', practice: 'any' },
  { city: 'Kladno', radiusKm: 20, gender: 'male', languages: ['cs'], diagnosis: 'po úrazu kotník', practice: 'clinic' },
  { city: 'Ostrava', radiusKm: 20, gender: 'any', languages: ['en'], diagnosis: 'neuro', practice: 'any' },
  { city: 'Liberec', radiusKm: 20, gender: 'any', languages: ['cs'], diagnosis: 'kotník', practice: 'clinic' },
  { city: 'Olomouc', radiusKm: 20, gender: 'any', languages: ['cs'], diagnosis: 'post-surgery', practice: 'any' },
  { city: 'Karlovy Vary', radiusKm: 30, gender: 'male', languages: ['cs'], diagnosis: 'ztuhlost krku', practice: 'clinic' },
]

function parseFile(p: string): Scenario[] {
  const raw = fs.readFileSync(p, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const out: Scenario[] = []
  for (const line of raw) {
    const parts = line.split('|').map(s => s.trim())
    if (parts.length < 6) continue
    const [city, r, gender, langs, diag, practice] = parts
    out.push({
      city,
      radiusKm: Number(r),
      gender: (gender as any) || 'any',
      languages: langs.split(',').map(s => s.trim()).filter(Boolean),
      diagnosis: diag,
      practice: (practice as any),
    })
  }
  return out
}

function buildInputs(s: Scenario) {
  const raw = {
    city: s.city,
    radiusKm: s.radiusKm,
    therapistGender: s.gender,
    languages: s.languages.join(','),
    diagnosis: s.diagnosis,
    practice: s.practice === 'any' ? undefined : (s.practice === 'home_visit' ? 'dojíždění' : s.practice),
    meetingType: s.practice === 'any' ? undefined : (s.practice === 'home_visit' ? 'dojíždění' : s.practice),
    hasDiagnosis: Boolean(s.diagnosis && s.diagnosis.length > 0),
  }
  return normalizeSearchInputs(raw)
}

function mapCanonicalLangToCode(lang?: string): string | undefined {
  if (!lang) return undefined
  const m: Record<string,string> = { cestina: 'cs', anglictina: 'en', nemcina: 'de', ukrajinstina: 'uk', rus: 'ru', slovencina: 'sk' }
  return m[lang] || lang
}

// Single source of truth via classifyTier

function runScenario(s: Scenario, therapists: TherapistNormalized[]) {
  const inputs = buildInputs(s)
  const can = canonicalizeCity(inputs.location?.city || s.city)
  const city = can?.city || s.city
  const meeting: MeetingMode = (inputs.meetingType as MeetingMode) || 'clinic'
  const radiusKm: number = inputs.radiusKm || s.radiusKm || 20

  function preflightHints(t: any): string[] {
    const hints: string[] = []
    const modes: string[] = Array.isArray(t.meeting_modes) ? t.meeting_modes : []
    const hasClinic = modes.includes('clinic')
    const hasHome = modes.includes('home_visit')
    const hasHomeCoverage = hasHome && (Number.isFinite(t.service_radius_km) && t.service_radius_km > 0 || Array.isArray(t.service_areas) && t.service_areas.length > 0)
    if (!(hasClinic || hasHomeCoverage)) hints.push('FIX meeting_modes: add clinic or valid home_visit radius/areas')

    const locs: any[] = Array.isArray(t.locations) ? t.locations : []
    const locInCity = locs.find(l => (l?.city || '').toLowerCase().includes(city.toLowerCase())) || locs[0]
    const lat = Number(locInCity?.lat)
    const lon = Number(locInCity?.lon)
    if (!(Number.isFinite(lat) && Number.isFinite(lon) && lat >= 48.5 && lat <= 51.1 && lon >= 12.0 && lon <= 18.9)) {
      hints.push('FIX locations: provide CZ lat/lon (48.5–51.1, 12.0–18.9)')
    }

    const langs: string[] = Array.isArray(t.languages) ? t.languages : []
    if (!(langs.includes('cs') || langs.includes('cestina'))) hints.push('FIX languages: include cs')

    const gender = String(t.gender || '').toLowerCase()
    if (!(gender === 'male' || gender === 'female' || gender === 'unspecified')) hints.push('FIX gender: use male|female|unspecified (not raw muz/zena)')

    if (String(t.id) === 'physio-kladno-1') {
      const hasKladno = locs.some(l => typeof l?.city === 'string' && l.city.toLowerCase().includes('kladno'))
      if (!hasKladno) hints.push('FIX locations: add city=Kladno for physio-kladno-1')
    }

    return hints
  }

  // Filter candidates by meeting mode + geo
  const cands: Array<{ id: string; km: number | null; tier: 1|2|3|4; reason?: string }> = []
  for (const tRaw of therapists) {
    const t = tRaw as any as TherapistNormalized
    // meeting mode allowance
    const modes: string[] = Array.isArray((t as any).meeting_modes) ? (t as any).meeting_modes : []
    if (meeting !== 'online' && !(modes.includes('clinic') || modes.includes('home_visit'))) continue
    if (meeting === 'clinic' && !modes.includes('clinic')) continue
    if (meeting === 'home_visit' && !modes.includes('home_visit')) continue
    // geo
    const eff = computeEffectiveDistance({ clientCity: city, therapist: t, meetingMode: meeting })
    const km = typeof eff.km === 'number' && Number.isFinite(eff.km) ? eff.km : null
    const within = meeting === 'online' ? true : (km !== null && km <= radiusKm && eff.allowed)
    const requireInPerson = meeting !== 'online' ? true : (Array.isArray(inputs.meetingModes) ? inputs.meetingModes.includes('clinic' as any) || inputs.meetingModes.includes('home_visit' as any) : false)
    const allowedModes = meeting === 'online' ? (requireInPerson ? ['clinic','home_visit'] as any : ['online'] as any) : (meeting === 'clinic' ? ['clinic'] as any : ['home_visit'] as any)
    const tier = classifyTier({ therapist: { meeting_modes: modes as any, gender: (t as any).gender, languages: (t as any).languages } as any, km, allowed: (meeting==='online')?true:(within) }, { meetingType: meeting, radiusKm, therapistGenderPref: inputs.therapistGenderPref as any, language: inputs.language, languageSelected: Boolean(s.languages && s.languages.length > 0), diagnosis: { canonicalId: inputs.diagnosis?.canonicalId }, diagnosisRarity: (inputs as any).diagnosisRarity, requireInPerson, allowedModes })
    const exp = explainTier1(t as any, { meetingType: meeting, radiusKm, therapistGenderPref: inputs.therapistGenderPref as any, language: inputs.language, diagnosis: { canonicalId: inputs.diagnosis?.canonicalId }, diagnosisRarity: (inputs as any).diagnosisRarity, clientCity: city })
    const reason = exp.ok ? undefined : `${exp.failCode}${exp.failDetail ? ` (${exp.failDetail})` : ''}`
    cands.push({ id: t.id, km, tier, reason })

    // Preflight hints for records in target city (or first location when matching city exists)
    const locs: any[] = Array.isArray((t as any).locations) ? (t as any).locations : []
    const inTarget = locs.some(l => typeof l?.city === 'string' && l.city.toLowerCase().includes(city.toLowerCase()))
    if (inTarget) {
      const hints = preflightHints(t)
      for (const h of hints) {
        console.log(`  ! ${t.id} ${h}`)
      }
    }
  }

  cands.sort((a,b) => (a.tier - b.tier) || ((a.km ?? 1e9) - (b.km ?? 1e9)))
  const tier1Exists = cands.some(c => c.tier === 1)
  const filtered = tier1Exists ? cands.filter(c => c.tier !== 4) : cands
  return { inputs, results: filtered.slice(0, 3), meeting }
}

function main() {
  const args = process.argv.slice(2)
  const fileIdx = args.indexOf('--file')
  const file = fileIdx >= 0 ? args[fileIdx + 1] : undefined
  const scenarios = file ? parseFile(file) : DEFAULTS
  const therapists = loadTherapists()
  if (!Array.isArray(therapists) || therapists.length === 0) {
    console.error('No therapists dataset found.')
    process.exit(2)
  }
  for (const s of scenarios) {
    const { results, meeting } = runScenario(s, therapists)
    console.log(`${s.city} · ${s.radiusKm}km · ${s.gender} · ${s.languages.join('+')} · "${s.diagnosis}" · ${s.practice}`)
    if (results.length === 0) {
      console.log('  (no results)')
    } else {
      for (const r of results) {
        const km = r.km === null ? '—' : `${r.km.toFixed(1)} km`
        const why = (r as any).reason ? ` reason=${(r as any).reason}` : ''
        console.log(`  - ${r.id}\t${km}\ttier ${r.tier}${why}`)
        // Acceptance line for quick scan
        const modes = (therapists.find(tt => (tt as any).id === r.id) as any)?.meeting_modes || []
        const isInPersonAllowed = (meeting!=='online') && (modes.includes('clinic') || modes.includes('home_visit'))
        const tierPath = (r as any).reason ? `FAIL @${(r as any).reason.split(' ')[0]}` : 'PASS'
        console.log(`    Tier 1 path: ${tierPath}  (allowedModes=${(meeting==='online'?'online':(meeting==='clinic'?'clinic':'home_visit'))} candidate.meeting_modes=${JSON.stringify(modes)} isInPersonAllowed=${isInPersonAllowed})`)
      }
    }
  }
}

main()


