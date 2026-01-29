/*
 Reproducible auditor: parse /results URL → normalize → run funnel and print audit
 Usage: ts-node scripts/repro-from-url.ts "http://localhost:3035/results?..."
*/

import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import { normalizeSearchInputs } from '@/lib/matching/normalization'
import { analyzeZeroResults } from '@/lib/debug/zeroResults'
import { computeEffectiveDistance } from '@/lib/geo/distance'
import { type TherapistNormalized, type MeetingMode } from '@/lib/types/therapist'

function readJson<T = any>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T } catch { return null }
}

function loadTherapists(): TherapistNormalized[] {
  const root = path.resolve(__dirname, '..')
  const normPath = path.resolve(root, '../data/therapists.normalized.json')
  const basePath = path.resolve(root, '../data/therapists.json')
  const syntheticPath = path.resolve(root, '../data/therapists.synthetic.json')
  let base: TherapistNormalized[] = []
  const norm = readJson<TherapistNormalized[]>(normPath)
  if (Array.isArray(norm) && norm.length > 0) base = norm
  else {
    const raw = readJson<any[]>(basePath) || []
    base = Array.isArray(raw) ? (raw as any) : []
  }
  const syn = readJson<any[]>(syntheticPath)
  if (Array.isArray(syn) && syn.length > 0) {
    const merged = new Map<string, TherapistNormalized>()
    for (const t of base as any[]) merged.set((t as any).id, t as any)
    for (const s of syn as any[]) if (!merged.has((s as any).id)) merged.set((s as any).id, s as any)
    return Array.from(merged.values()) as TherapistNormalized[]
  }
  return base
}

function parseResultsUrl(u: string): Record<string, string> {
  const curr = new URL(u)
  const sp = curr.searchParams
  const obj: Record<string, string> = {}
  for (const key of sp.keys()) {
    const v = sp.get(key)
    if (v !== null) obj[key] = v
  }
  return obj
}

function buildRawInputsFromQuery(q: Record<string,string>) {
  return {
    city: q.city,
    practice: q.practice,
    meetingType: q.practice,
    conditions: q.conditions,
    hasDiagnosis: q.hasDiagnosis === 'true' || q.hasDiagnosis === '1',
    time: q.time,
    day: q.day,
    languages: q.languages,
    insurance: q.insurance,
    ageGroup: q.ageGroups,
    therapistGender: q.therapistGender,
    radiusKm: q.radiusKm ? Number(q.radiusKm) : undefined
  }
}

function toUserForZero(inputs: any): {
  meeting_modes: MeetingMode[] | ['any']
  therapist_gender_pref?: 'male'|'female'|'any'
  languages?: any[]
  patient_for?: any
  insurerPref?: 'insurance_claim'|'self_pay'
  city?: string
  radiusKm?: number
  meetingMode?: MeetingMode
  diagnosis?: { canonicalId?: string; synonyms?: string[]; category?: string } | null
} {
  return {
    meeting_modes: (inputs.meetingModes && inputs.meetingModes.length>0) ? inputs.meetingModes : (inputs.meetingType ? [inputs.meetingType] : ['any']) as any,
    therapist_gender_pref: inputs.therapistGenderPref,
    languages: (inputs.languages && inputs.languages.length>0) ? inputs.languages : (inputs.language ? [inputs.language] : undefined),
    patient_for: inputs.ageGroup,
    insurerPref: inputs.wantsInsurance ? 'insurance_claim' : 'self_pay',
    city: inputs.location?.city,
    radiusKm: inputs.radiusKm,
    meetingMode: (inputs.meetingType as MeetingMode) || 'clinic',
    diagnosis: inputs.diagnosis || null
  }
}

function pickCandidates(therapists: TherapistNormalized[], inputs: any): Array<{ id: string; distanceKm: number | null }> {
  const city = inputs.location?.city || ''
  const meetingMode: MeetingMode = (inputs.meetingType as MeetingMode) || 'clinic'
  const radiusKm = inputs.radiusKm || 25
  const out: Array<{ id: string; distanceKm: number | null }> = []
  for (const t of therapists) {
    // Meeting mode
    if (!t.meeting_modes.includes(meetingMode)) continue
    // Geo
    if (meetingMode !== 'online') {
      if (!city) continue
      const eff = computeEffectiveDistance({ clientCity: city, therapist: t, meetingMode })
      if (!eff.allowed || !Number.isFinite(eff.km as any) || (typeof eff.km === 'number' && eff.km > radiusKm)) continue
      out.push({ id: t.id, distanceKm: typeof eff.km === 'number' ? eff.km : null })
    } else {
      out.push({ id: t.id, distanceKm: null })
    }
  }
  // Sort by distance when available
  out.sort((a,b) => {
    const da = a.distanceKm ?? Infinity
    const db = b.distanceKm ?? Infinity
    return da - db
  })
  return out
}

async function main() {
  const url = process.argv[2]
  if (!url) {
    console.error('Usage: ts-node scripts/repro-from-url.ts "http://localhost:3035/results?..."')
    process.exit(2)
  }

  const therapists = loadTherapists()
  if (!Array.isArray(therapists) || therapists.length === 0) {
    console.error('No therapists dataset found (expected data/therapists.normalized.json or data/therapists.json).')
    process.exit(2)
  }

  const query = parseResultsUrl(url)
  const rawInputs = buildRawInputsFromQuery(query)
  const normalized = normalizeSearchInputs(rawInputs)
  const user = toUserForZero(normalized)

  const report = analyzeZeroResults({ therapists, user })
  const candidates = pickCandidates(therapists, normalized).slice(0, 5)

  // Print audit
  console.log('=== Zero-Results Audit ===')
  console.log('Query:', JSON.stringify(rawInputs))
  console.log('Counts by stage:', report.countsByStage)
  console.log('Top fail reasons:', report.topFailReasons)
  console.log('Candidates (first 5):', candidates)
  console.log('Rejected (first 10):', report.rejected.slice(0,10))

  // Exit code logic
  const { afterDiagnosis, afterGeo } = report.countsByStage
  if ((afterDiagnosis === 0 && afterGeo > 0) || afterGeo === 0) {
    process.exit(1)
  }
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(2) })


