import { type TherapistNormalized, type MeetingMode, type LanguageCode, type PatientGroup, type TherapistLocation } from '@/lib/types/therapist'

export type HardGateReason =
  | 'MODE_INCOMPATIBLE'
  | 'INSURANCE_UNSUPPORTED'
  | 'NO_BARRIER_FREE'
  | 'GENDER_PREF_MISMATCH'
  | 'LANGUAGE_NO_OVERLAP'
  | 'PATIENT_GROUP_UNSUPPORTED'

export interface HardGateInputUser {
  meeting_modes: MeetingMode[] | ['any']
  insurerPref?: 'insurance_claim' | 'self_pay'
  barrier_free_required?: boolean
  therapist_gender_pref?: 'male' | 'female' | 'any'
  languages?: LanguageCode[]
  patient_for?: PatientGroup
}

export function applyHardGates(params: { user: HardGateInputUser; therapist: TherapistNormalized }): { pass: boolean; reasons: HardGateReason[] } {
  const { user, therapist } = params
  const reasons: HardGateReason[] = []

  // a) Meeting mode compatibility (respect “any” = union)
  const userModes = (user.meeting_modes && user.meeting_modes[0] === 'any') ? therapist.meeting_modes : (user.meeting_modes as MeetingMode[] | undefined) || []
  const modeOverlap = userModes.length === 0 || userModes.some(m => therapist.meeting_modes.includes(m))
  if (!modeOverlap) return { pass: false, reasons: ['MODE_INCOMPATIBLE'] }

  // b) Insurance
  if (user.insurerPref === 'insurance_claim') {
    if (!therapist.insurers || therapist.insurers.length === 0) return { pass: false, reasons: ['INSURANCE_UNSUPPORTED'] }
  }

  // c) Barrier-free for in-person
  if (user.barrier_free_required) {
    const inPersonRequested = userModes.some(m => m === 'clinic' || m === 'home_visit')
    if (inPersonRequested) {
      const anyBarrierFree = (therapist.locations || []).some((l: TherapistLocation) => l.barrier_free)
      if (!anyBarrierFree) return { pass: false, reasons: ['NO_BARRIER_FREE'] }
    }
  }

  // d) Therapist gender preference
  if (user.therapist_gender_pref && user.therapist_gender_pref !== 'any') {
    if (therapist.gender !== user.therapist_gender_pref) return { pass: false, reasons: ['GENDER_PREF_MISMATCH'] }
  }

  // e) Language overlap
  if (user.languages && user.languages.length > 0) {
    const overlap = user.languages.some(l => therapist.languages.includes(l))
    if (!overlap) return { pass: false, reasons: ['LANGUAGE_NO_OVERLAP'] }
  }

  // f) Patient group supported
  if (user.patient_for) {
    if (!therapist.patient_groups.includes(user.patient_for)) return { pass: false, reasons: ['PATIENT_GROUP_UNSUPPORTED'] }
  }

  return { pass: true, reasons }
}

export function humanizeHardGateReason(reason: HardGateReason): string {
  switch (reason) {
    case 'MODE_INCOMPATIBLE': return 'Režim schůzky není kompatibilní'
    case 'INSURANCE_UNSUPPORTED': return 'Nepodporuje úhradu z pojišťovny'
    case 'NO_BARRIER_FREE': return 'Chybí bezbariérový přístup'
    case 'GENDER_PREF_MISMATCH': return 'Nesplňuje preferované pohlaví terapeuta'
    case 'LANGUAGE_NO_OVERLAP': return 'Nedomluvíte se společným jazykem'
    case 'PATIENT_GROUP_UNSUPPORTED': return 'Nepodporuje danou věkovou skupinu'
    default: return reason
  }
}


