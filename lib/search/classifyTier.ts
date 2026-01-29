import { type MeetingMode, type TherapistNormalized } from '@/lib/types/therapist'
import { computeEffectiveDistance } from '@/lib/geo/distance'

export interface TierQuery {
  meetingType: MeetingMode
  radiusKm: number
  therapistGenderPref?: 'male'|'female'|'any'
  language?: string // canonical like 'cestina' or code 'cs'
  languageSelected?: boolean
  diagnosis?: { canonicalId?: string }
  diagnosisRarity?: 'specialized'|'common'|'none'
  // Extended controls
  requireInPerson?: boolean
  allowedModes?: MeetingMode[]
}

export interface TierCandidate {
  therapist: Pick<TherapistNormalized, 'meeting_modes'|'gender'|'languages'>
  km: number | null
  allowed: boolean // geo allowed from computeEffectiveDistance
}

function languageMatches(candidateLangs: string[], desired?: string): boolean {
  if (!desired) return true
  // Accept both canonical ids and short codes
  const desiredCodeMap: Record<string,string> = { cestina: 'cs', anglictina: 'en', nemcina: 'de', ukrajinstina: 'uk', rus: 'ru', slovencina: 'sk' }
  const desiredCode = desiredCodeMap[desired] || desired
  return candidateLangs.includes(desired) || candidateLangs.includes(desiredCode)
}

export function classifyTier(cand: TierCandidate, query: TierQuery): 1|2|3|4 {
  const inPersonRequested = query.requireInPerson ?? (query.meetingType !== 'online')
  const withinRadius = inPersonRequested ? (cand.km !== null && cand.allowed && cand.km <= query.radiusKm) : true
  const hasInPerson = cand.therapist.meeting_modes.includes('clinic') || cand.therapist.meeting_modes.includes('home_visit')

  // Must-haves: meeting mode and gender
  const allowed: MeetingMode[] =
    Array.isArray(query.allowedModes) && query.allowedModes.length > 0
      ? query.allowedModes
      : (inPersonRequested
          ? (query.meetingType === 'clinic' ? ['clinic'] : ['home_visit'])
          : ['online'])
  const meetingOk = inPersonRequested ? allowed.some(m => cand.therapist.meeting_modes.includes(m)) : true
  const genderOk = !query.therapistGenderPref || query.therapistGenderPref === 'any' || cand.therapist.gender === query.therapistGenderPref
  const considerLanguage = Boolean(query.languageSelected) && !!query.language && !(query.language === 'cestina' || query.language === 'cs')
  const languageOk = considerLanguage ? languageMatches(cand.therapist.languages as any, query.language) : true

  // Tier 1: in-person, within radius, meeting ok, gender ok, optional language ok
  if (inPersonRequested && hasInPerson && withinRadius && meetingOk && genderOk && languageOk) return 1

  // Tier 2: in-person within radius, fails exactly one soft pref (language)
  if (inPersonRequested && hasInPerson && withinRadius && meetingOk && genderOk) {
    const softFails = [languageOk ? 0 : 1].reduce((a,b)=>a+b,0)
    if (softFails === 1) return 2
  }

  // Tier 3: regional specialist (outside radius) only when specialized diagnosis
  const isSpecialized = query.diagnosisRarity === 'specialized' || Boolean(query.diagnosis?.canonicalId)
  if (inPersonRequested && hasInPerson && !withinRadius && isSpecialized) return 3

  // Tier 4: online specialist (suppression handled by caller when Tier 1 exists)
  return 4
}

export interface ExplainTier1Query extends TierQuery {
  clientCity: string
  languagesList?: string[]
}

export type Tier1FailCode = 'MODE'|'GEO'|'RADIUS'|'GENDER'|'LANG'|'DX'

export function explainTier1(therapist: TherapistNormalized, query: ExplainTier1Query): { ok: boolean; failCode?: Tier1FailCode; failDetail?: string } {
  const inPersonRequested = query.meetingType !== 'online'
  if (!inPersonRequested) return { ok: false, failCode: 'MODE', failDetail: 'online-requested' }

  const hasClinic = therapist.meeting_modes.includes('clinic')
  const hasHome = therapist.meeting_modes.includes('home_visit')
  if (!(hasClinic || hasHome)) {
    return { ok: false, failCode: 'MODE', failDetail: 'no in-person' }
  }

  // GEO + RADIUS via computeEffectiveDistance for requested mode
  const eff = computeEffectiveDistance({ clientCity: query.clientCity, therapist, meetingMode: query.meetingType })
  if (!(Number.isFinite(eff.km as any))) {
    return { ok: false, failCode: 'GEO', failDetail: 'missing/invalid coords' }
  }
  const km = eff.km as number
  if (!(eff.allowed && km <= query.radiusKm)) {
    return { ok: false, failCode: 'RADIUS', failDetail: `km=${typeof km==='number'?km.toFixed(1):'—'} > radius=${query.radiusKm}` }
  }

  // GENDER
  const gp = query.therapistGenderPref
  if (gp && gp !== 'any' && therapist.gender !== gp) {
    return { ok: false, failCode: 'GENDER', failDetail: `wanted=${gp}, has=${therapist.gender}` }
  }

  // LANG (default cs if language specified as list empty)
  const desired = query.language || (Array.isArray(query.languagesList) && query.languagesList[0]) || undefined
  if (desired) {
    const langOk = languageMatches(therapist.languages as any, desired)
    if (!langOk) return { ok: false, failCode: 'LANG', failDetail: `wanted=${desired}` }
  }

  // DX: if specialized, require expertise overlap
  const isSpecialized = query.diagnosisRarity === 'specialized' || Boolean(query.diagnosis?.canonicalId)
  if (isSpecialized) {
    const diagId = query.diagnosis?.canonicalId
    const hasExact = diagId ? therapist.diagnosis_expertise.includes(diagId) : false
    const hasCategory = false // category mapping optional; left as false unless taxonomy provided
    if (!(hasExact || hasCategory)) {
      return { ok: false, failCode: 'DX', failDetail: 'no specialized expertise' }
    }
  }

  return { ok: true }
}


