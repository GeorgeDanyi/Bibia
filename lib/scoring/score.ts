import { computeOverlap, computeAsapBonus } from '@/lib/availability/overlap'
import { type TherapistNormalized, type MeetingMode, type LanguageCode } from '@/lib/types/therapist'

function distancePoints(km: number | null, mode: MeetingMode): number {
  if (mode === 'online' || km === null) return 0
  if (km <= 3) return 34
  if (km <= 10) return 28
  if (km <= 25) return 20
  if (km <= 50) return 10
  if (km <= 100) return 2
  return 0
}

function diagnosisPoints(signal: { signal: string | null }): number {
  switch (signal.signal) {
    case 'diag_exact': return 38
    case 'diag_semantic': return 34
    case 'diag_category': return 28
    default: return 0
  }
}

function regionPoints(userSubcats: string[] | undefined, therapistSpecialties: string[]): number {
  const user = new Set((userSubcats || []).map(s => s.toLowerCase()))
  if (user.size === 0) return 0
  const th = new Set(therapistSpecialties.map(s => s.toLowerCase()))
  let match = 0
  user.forEach(s => { if (th.has(s)) match++ })
  const fraction = match / user.size
  return Math.min(8, Math.round(fraction * 8 * 100) / 100)
}

function availabilityPoints(overlapFraction: number): number {
  return Math.min(15, Math.round(overlapFraction * 15 * 100) / 100)
}

function languagePoints(userPrimary: LanguageCode | undefined, userPreferred: LanguageCode[] | undefined, therapistLangs: LanguageCode[]): number {
  if (userPrimary && therapistLangs.includes(userPrimary)) return 3
  if ((userPreferred || []).some(l => therapistLangs.includes(l))) return 2
  return 0
}

function groupPoints(requested: string | undefined, groups: string[]): number {
  return requested && groups.includes(requested) ? 2 : 0
}

export function scoreCandidate(params: {
  mode: MeetingMode
  km: number | null
  therapist: TherapistNormalized
  diagnosis_signal: { signal: string | null }
  user: {
    primaryLanguage?: LanguageCode
    preferredLanguages?: LanguageCode[]
    selectedSubcategories?: string[]
    days?: string[]
    bands?: string[]
    patient_for?: string
  }
  debug?: boolean
}): { total: number; breakdown: { distance: number; diagnosis: number; region: number; availability: number; language: number; group: number; asap_bonus: number } } {
  const { mode, km, therapist, diagnosis_signal, user } = params
  const distance = distancePoints(km, mode)
  const diagnosis = diagnosisPoints(diagnosis_signal)
  const region = regionPoints(user.selectedSubcategories, therapist.specialties as unknown as string[])
  const overlap = computeOverlap({ userDays: user.days || [], userBands: user.bands || [], therapistWeekly: therapist.weekly_availability })
  const availability = availabilityPoints(overlap.fraction)
  const language = languagePoints(user.primaryLanguage, user.preferredLanguages, therapist.languages as LanguageCode[])
  const group = groupPoints(user.patient_for, therapist.patient_groups as unknown as string[])
  const asap_bonus = computeAsapBonus(therapist.next_available_in_days)

  let total = distance + diagnosis + region + availability + language + group + asap_bonus
  if (total > 100) total = 100

  if (params.debug || process.env.DEBUG_SCORING === '1') {
    // eslint-disable-next-line no-console
    console.log(`[SCORING] id=${therapist.id} mode=${mode} km=${km} -> dist=${distance} diag(${diagnosis_signal.signal})=${diagnosis} region=${region} avail=${availability} lang=${language} grp=${group} asap=${asap_bonus} total=${total}`)
  }

  return { total, breakdown: { distance, diagnosis, region, availability, language, group, asap_bonus } }
}

export function tieBreak(a: {
  therapist: TherapistNormalized
}, b: {
  therapist: TherapistNormalized
}): number {
  // accepting_new (true first)
  if (a.therapist.accepting_new !== b.therapist.accepting_new) return a.therapist.accepting_new ? -1 : 1
  // lower next_available_in_days
  const na = a.therapist.next_available_in_days ?? Infinity
  const nb = b.therapist.next_available_in_days ?? Infinity
  if (na !== nb) return na - nb
  // higher rating.average
  const ra = a.therapist.rating?.average ?? 0
  const rb = b.therapist.rating?.average ?? 0
  if (ra !== rb) return rb - ra
  // lower price (prefer fixed then min of range)
  const pa = a.therapist.price_info?.fixed_czk ?? a.therapist.price_info?.range_czk?.min ?? Infinity
  const pb = b.therapist.price_info?.fixed_czk ?? b.therapist.price_info?.range_czk?.min ?? Infinity
  if (pa !== pb) return pa - pb
  return 0
}

export function scoreLevel(total: number): 'High' | 'Medium' | 'Low' {
  if (total >= 75) return 'High'
  if (total >= 50) return 'Medium'
  return 'Low'
}

export function scoreLevelCz(total: number): 'Vysoká shoda' | 'Dobrá shoda' | 'Možná shoda' {
  const lvl = scoreLevel(total)
  // Map the generic score levels to the three canonical Czech labels used in the UI:
  // - High   → Vysoká shoda
  // - Medium → Dobrá shoda
  // - Low    → Možná shoda
  if (lvl === 'High') return 'Vysoká shoda'
  if (lvl === 'Medium') return 'Dobrá shoda'
  return 'Možná shoda'
}


