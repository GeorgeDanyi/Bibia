import { type TherapistNormalized, type MeetingMode, type TherapistGender } from '@/lib/types/therapist'
import { scoreCandidate } from '@/lib/scoring/score'
import { computeEffectiveDistance } from '@/lib/geo/distance'
import { DEFAULT_SHOW, RELAXATION_MIN_RESULTS } from '@/lib/config/search'
import { computeOverlap } from '@/lib/availability/overlap'

export interface ShapeInput {
  user: {
    meeting_modes: MeetingMode[] | ['any']
    city: string
    radiusKm?: number
    therapist_gender_pref?: 'male' | 'female' | 'any'
    selectedSubcategories?: string[]
    days?: string[]
    bands?: string[]
    primaryLanguage?: string
    preferredLanguages?: string[]
    patient_for?: string
    diagnosisRarity?: 'specialized' | 'common' | 'none'
    diagnosisId?: string
  }
  candidates: Array<TherapistNormalized & { hard_filters_passed: true; diagnosis_signal: { signal: string | null; diagnosisId?: string } }>
}

export interface ShapedResult {
  therapist: TherapistNormalized
  mode: MeetingMode
  km: number | null
  score: number
  explanation: {
    distance_km: number | null
    distance_points: number
    diagnosis_signal: string | null
    diagnosis_points: number
    diagnosis_id?: string
    region_points: number
    availability_pairs: { requested: number; matched: number }
    availability_points: number
    language_points: number
    group_points: number
    asap_bonus: number
    hard_filters_passed: string[]
    relaxations_applied: string[]
  }
  tier: 1 | 2 | 3 | 4
  badges?: string[]
  banner?: string
}

function areRelatedRegions(userSubcats: string[], therapistTags: string[]): boolean {
  const map: Record<string,string> = {
    wrist: 'upper_limb', hand: 'upper_limb', fingers: 'upper_limb', elbow: 'upper_limb', shoulder: 'upper_limb',
    ankle: 'lower_limb', foot: 'lower_limb', toes: 'lower_limb', knee: 'lower_limb', hip: 'lower_limb',
    cervical: 'spine', thoracic: 'spine', lumbar: 'spine', sacral: 'spine'
  }
  const tset = new Set(therapistTags)
  for (const sub of userSubcats) {
    const broad = map[sub]
    if (broad && tset.has(broad)) return true
  }
  return false
}

export function shapeResults(input: ShapeInput): { results: ShapedResult[]; relaxations_applied: string[] } {
  const { user } = input
  const anyMode = user.meeting_modes[0] === 'any'
  const modes: MeetingMode[] = anyMode ? ['clinic','home_visit','online'] : (user.meeting_modes as MeetingMode[])
  const radiusKm = typeof user.radiusKm === 'number' && user.radiusKm > 0 ? user.radiusKm : 20
  const diagRarity = user.diagnosisRarity || 'none'
  const userDiagnosisId = user.diagnosisId

  const base: Array<{ cand: typeof input.candidates[number]; mode: MeetingMode; km: number | null }> = []
  for (const c of input.candidates) {
    for (const m of modes) {
      const eff = computeEffectiveDistance({ clientCity: user.city, therapist: c, meetingMode: m })
      if (!eff.allowed) continue
      base.push({ cand: c, mode: m, km: eff.km })
    }
  }

  let relaxations: string[] = []
  let working = base.slice()

  const makeScored = (rows: typeof working) => rows.map(row => {
    const s = scoreCandidate({
      mode: row.mode,
      km: row.km,
      therapist: row.cand,
      diagnosis_signal: row.cand.diagnosis_signal,
      user: {
        primaryLanguage: user.primaryLanguage as any,
        preferredLanguages: user.preferredLanguages as any,
        selectedSubcategories: user.selectedSubcategories,
        days: user.days,
        bands: user.bands,
        patient_for: user.patient_for,
      }
    })
    const ov = computeOverlap({ userDays: user.days || [], userBands: user.bands || [], therapistWeekly: row.cand.weekly_availability })
    return {
      therapist: row.cand,
      mode: row.mode,
      km: row.km,
      score: s.total,
      explanation: {
        distance_km: row.km,
        distance_points: s.breakdown.distance,
        diagnosis_signal: row.cand.diagnosis_signal.signal,
        diagnosis_points: s.breakdown.diagnosis,
        diagnosis_id: row.cand.diagnosis_signal.diagnosisId,
        region_points: s.breakdown.region,
        availability_pairs: { requested: ov.requestedPairs, matched: ov.matchedPairs },
        availability_points: s.breakdown.availability,
        language_points: s.breakdown.language,
        group_points: s.breakdown.group,
        asap_bonus: s.breakdown.asap_bonus,
        hard_filters_passed: ['PASS'],
        relaxations_applied: relaxations,
      }
    } as unknown as ShapedResult
  })

  let scored = makeScored(working)

  const countTotal = (arr: ShapedResult[]) => arr.length
  const haveEnough = () => countTotal(scored) >= RELAXATION_MIN_RESULTS

  // Stage 1: widen distance band by +25 km (in-person only) — only if surviving <3
  if (!haveEnough()) {
    relaxations = [...relaxations, 'WIDEN_DISTANCE_25KM']
    // Simple widening: add +25 km for in-person modes, keep online as null
    working = working.map(w => ({
      ...w,
      km: w.mode === 'online' || w.km == null ? w.km : w.km + 25
    }))
    scored = makeScored(working)
  }

  // Stage 2: accept broader Step-2 region relatives
  if (!haveEnough() && (user.selectedSubcategories || []).length) {
    relaxations = [...relaxations, 'ALLOW_REGION_RELATIVES']
    // Boost items that relate broadly (reflected in region points via overlap input); here we only allow more candidates by not filtering
    // No additional filter; scoring already accounts for partial overlap
  }

  // Stage 3: fallback to diagnosis category
  if (!haveEnough()) {
    relaxations = [...relaxations, 'FALLBACK_DIAG_CATEGORY']
    // If previously required exact/semantic, now we allow category/none; here candidates already included
  }

  // Stage 4: suggest online as alternative
  if (!haveEnough() && !modes.includes('online')) {
    relaxations = [...relaxations, 'SUGGEST_ONLINE']
    const extra: typeof working = []
    for (const c of input.candidates) {
      const eff = computeEffectiveDistance({ clientCity: user.city, therapist: c, meetingMode: 'online' })
      extra.push({ cand: c, mode: 'online', km: eff.km })
    }
    working = working.concat(extra)
    scored = makeScored(working)
  }

  // Helper predicates per tier rules
  const isInPerson = (r: ShapedResult) => r.mode === 'clinic' || r.mode === 'home_visit'
  const withinRadius = (r: ShapedResult) => r.km !== null && r.km <= radiusKm
  const matchesGender = (cand: TherapistNormalized) => {
    const pref = (user.therapist_gender_pref || 'any') as 'male'|'female'|'any'
    if (pref === 'any') return true
    return cand.gender === (pref as TherapistGender)
  }
  const languageOverlap = (cand: TherapistNormalized) => {
    const required = user.primaryLanguage && user.primaryLanguage !== 'cs'
    if (!user.primaryLanguage && (!user.preferredLanguages || user.preferredLanguages.length === 0)) return true
    const langs = new Set(cand.languages)
    const requested = [user.primaryLanguage, ...(user.preferredLanguages || [])].filter(Boolean) as string[]
    const overlap = requested.some(l => langs.has(l as any))
    return required ? overlap : true
  }
  const isSpecialist = (cand: TherapistNormalized) => {
    if (diagRarity !== 'specialized') return true
    // Specialist if diagnosisId matches candidate expertise OR related region match
    if (userDiagnosisId && cand.diagnosis_expertise.includes(userDiagnosisId)) return true
    // fallback: use region proximity based on specialties vs selectedSubcategories
    return areRelatedRegions(user.selectedSubcategories || [], cand.specialties as unknown as string[])
  }

  // Tier 1 — Local strict
  const tier1 = scored
    .filter(r => isInPerson(r) && withinRadius(r))
    .filter(r => isSpecialist(r.therapist))
    .filter(r => matchesGender(r.therapist))
    .filter(r => languageOverlap(r.therapist))
    .map(r => ({ ...r, tier: 1 as const }))

  // Tier 2 — Local alternatives (violates gender or language only)
  const tier2 = scored
    .filter(r => isInPerson(r) && withinRadius(r))
    .filter(r => isSpecialist(r.therapist))
    .filter(r => {
      const g = matchesGender(r.therapist)
      const l = languageOverlap(r.therapist)
      return !(g && l) // violates at least one soft pref
    })
    .map(r => {
      const badges: string[] = []
      if (!matchesGender(r.therapist)) badges.push('Alternativa: nesplňuje gender')
      if (!languageOverlap(r.therapist)) badges.push('Alternativa: nesplňuje jazyk')
      return { ...r, tier: 2 as const, badges }
    })

  // Tier 3 — Regional specialists (only for specialized)
  const regionalMaxKm = Math.max(60, Math.min(100, radiusKm * 5))
  const needTier3 = diagRarity === 'specialized' && tier1.length === 0
  const tier3 = needTier3 ? scored
    .filter(r => isInPerson(r) && r.km !== null && r.km > radiusKm && r.km <= regionalMaxKm)
    .filter(r => isSpecialist(r.therapist))
    .map(r => ({ ...r, tier: 3 as const, banner: 'Mimo vámi zadaný okruh, ale specialista na diagnózu' }))
    : []

  // Tier 4 — Online specialists (when 1 and 3 weak)
  const needTier4 = diagRarity === 'specialized' && tier1.length === 0 && tier3.length === 0
  const tier4 = needTier4 ? scored
    .filter(r => r.mode === 'online')
    .filter(r => isSpecialist(r.therapist))
    .map(r => ({ ...r, tier: 4 as const, banner: 'Online alternativa: specialisté dostupní dříve' }))
    : []

  // Sorting per tier: distance ASC → earlier availability → accepting_new → rating → id
  const sortLocal = (a: ShapedResult, b: ShapedResult) => {
    const da = a.km ?? Infinity, db = b.km ?? Infinity
    if (da !== db) return da - db
    const na = a.therapist.next_available_in_days ?? Infinity
    const nb = b.therapist.next_available_in_days ?? Infinity
    if (na !== nb) return na - nb
    const aa = a.therapist.accepting_new ? 0 : 1
    const ab = b.therapist.accepting_new ? 0 : 1
    if (aa !== ab) return aa - ab
    const ra = a.therapist.rating?.average ?? 0
    const rb = b.therapist.rating?.average ?? 0
    if (ra !== rb) return rb - ra
    return a.therapist.id.localeCompare(b.therapist.id)
  }

  tier1.sort(sortLocal)
  tier2.sort(sortLocal)
  tier3.sort(sortLocal)
  tier4.sort(sortLocal)

  // Combine with grouping order
  const grouped = [...tier1, ...tier2, ...tier3, ...tier4]

  const results = grouped.slice(0, DEFAULT_SHOW)
  return { results, relaxations_applied: relaxations.slice(0, 10) }
}


