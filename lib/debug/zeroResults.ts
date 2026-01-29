import { type TherapistNormalized, type MeetingMode, type LanguageCode, type PatientGroup } from '@/lib/types/therapist'
import { applyHardGates, type HardGateReason } from '@/lib/filters/hardGates'
import { computeEffectiveDistance } from '@/lib/geo/distance'

export type ZeroFailCode =
  | 'MODE_INCOMPATIBLE'
  | 'DISTANCE_OUT_OF_RADIUS'
  | 'GENDER_PREF_MISMATCH'
  | 'LANGUAGE_NO_OVERLAP'
  | 'PATIENT_GROUP_UNSUPPORTED'
  | 'INSURANCE_UNSUPPORTED'
  | 'DIAGNOSIS_NO_MATCH'
  | 'MISSING_COORDS'

export interface ZeroResultsInput {
  therapists: TherapistNormalized[]
  user: {
    meeting_modes: MeetingMode[] | ['any']
    therapist_gender_pref?: 'male'|'female'|'any'
    languages?: LanguageCode[]
    patient_for?: PatientGroup
    insurerPref?: 'insurance_claim' | 'self_pay'
    city?: string
    radiusKm?: number
    meetingMode?: MeetingMode
    diagnosis?: { canonicalId?: string; synonyms?: string[]; category?: string } | null
  }
}

export interface ZeroResultsReport {
  countsByStage: {
    allTherapists: number
    afterMeetingMode: number
    afterGeo: number
    afterGender: number
    afterLanguage: number
    afterPatientGroup: number
    afterInsurance: number
    afterDiagnosis: number
  }
  topFailReasons: Array<{ code: ZeroFailCode; count: number }>
  rejected: Array<{ id: string; reason: ZeroFailCode }>
}

/**
 * Compute funnel counts and the first-fail reason for each rejected candidate.
 * Stages follow TASKS spec: meeting mode → geo → gender → language → patient group → insurance → diagnosis
 */
export function analyzeZeroResults(params: ZeroResultsInput): ZeroResultsReport {
  const { therapists, user } = params
  const city = user.city || ''
  const meetingMode: MeetingMode = (user.meetingMode || (Array.isArray(user.meeting_modes) && user.meeting_modes[0] !== 'any' ? user.meeting_modes[0] as MeetingMode : 'clinic'))
  const radiusKm = typeof user.radiusKm === 'number' ? user.radiusKm : 25

  const counts = {
    allTherapists: therapists.length,
    afterMeetingMode: 0,
    afterGeo: 0,
    afterGender: 0,
    afterLanguage: 0,
    afterPatientGroup: 0,
    afterInsurance: 0,
    afterDiagnosis: 0,
  }

  const rejected: Array<{ id: string; reason: ZeroFailCode }> = []

  // Stage 1: meeting mode using existing hard gates (with 'any' semantics)
  const modePass: TherapistNormalized[] = []
  for (const t of therapists) {
    const modeOverlap = (Array.isArray(user.meeting_modes) && user.meeting_modes[0] === 'any')
      ? t.meeting_modes.length > 0
      : (Array.isArray(user.meeting_modes) ? user.meeting_modes.some(m => t.meeting_modes.includes(m as MeetingMode)) : true)
    if (!modeOverlap) {
      rejected.push({ id: t.id, reason: 'MODE_INCOMPATIBLE' })
      continue
    }
    modePass.push(t)
  }
  counts.afterMeetingMode = modePass.length

  // Stage 2: geo (city/radius/home_visit coverage). Use computeEffectiveDistance for clinic/home_visit.
  const geoPass: TherapistNormalized[] = []
  for (const t of modePass) {
    if (meetingMode === 'online') { geoPass.push(t); continue }
    // If we lack city, we cannot compute distance → treat as missing coords
    if (!city) { rejected.push({ id: t.id, reason: 'MISSING_COORDS' }); continue }
    const eff = computeEffectiveDistance({ clientCity: city, therapist: t, meetingMode })
    if (!eff.allowed || !Number.isFinite(eff.km as any) || (typeof eff.km === 'number' && eff.km > radiusKm)) {
      rejected.push({ id: t.id, reason: (!eff.allowed || !Number.isFinite(eff.km as any)) ? 'MISSING_COORDS' : 'DISTANCE_OUT_OF_RADIUS' })
      continue
    }
    geoPass.push(t)
  }
  counts.afterGeo = geoPass.length

  // Stage 3: gender preference
  const genderPass: TherapistNormalized[] = []
  for (const t of geoPass) {
    if (user.therapist_gender_pref && user.therapist_gender_pref !== 'any' && t.gender !== user.therapist_gender_pref) {
      rejected.push({ id: t.id, reason: 'GENDER_PREF_MISMATCH' })
      continue
    }
    genderPass.push(t)
  }
  counts.afterGender = genderPass.length

  // Stage 4: language overlap
  const langPass: TherapistNormalized[] = []
  for (const t of genderPass) {
    if (Array.isArray(user.languages) && user.languages.length > 0) {
      const overlap = user.languages.some(l => t.languages.includes(l))
      if (!overlap) { rejected.push({ id: t.id, reason: 'LANGUAGE_NO_OVERLAP' }); continue }
    }
    langPass.push(t)
  }
  counts.afterLanguage = langPass.length

  // Stage 5: patient group
  const pgPass: TherapistNormalized[] = []
  for (const t of langPass) {
    if (user.patient_for && !t.patient_groups.includes(user.patient_for)) { rejected.push({ id: t.id, reason: 'PATIENT_GROUP_UNSUPPORTED' }); continue }
    pgPass.push(t)
  }
  counts.afterPatientGroup = pgPass.length

  // Stage 6: insurance preference
  const insPass: TherapistNormalized[] = []
  for (const t of pgPass) {
    if (user.insurerPref === 'insurance_claim') {
      if (!Array.isArray(t.insurers) || t.insurers.length === 0) { rejected.push({ id: t.id, reason: 'INSURANCE_UNSUPPORTED' }); continue }
    }
    insPass.push(t)
  }
  counts.afterInsurance = insPass.length

  // Stage 7: diagnosis
  const diagPass: TherapistNormalized[] = []
  for (const t of insPass) {
    const diag = user.diagnosis?.canonicalId
    const syns = Array.isArray(user.diagnosis?.synonyms) ? user.diagnosis!.synonyms! : []
    const category = user.diagnosis?.category
    if (diag || syns.length > 0 || category) {
      const hasExact = diag ? t.diagnosis_expertise.includes(diag) : false
      const hasSyn = syns.some(s => t.diagnosis_expertise.includes(s))
      const hasCat = category ? (t.specialties as string[]).includes(category) : false
      if (!(hasExact || hasSyn || hasCat)) { rejected.push({ id: t.id, reason: 'DIAGNOSIS_NO_MATCH' }); continue }
    }
    diagPass.push(t)
  }
  counts.afterDiagnosis = diagPass.length

  // Aggregate top fail reasons based on first recorded reason per therapist (we pushed in order of stages)
  const freq = new Map<ZeroFailCode, number>()
  for (const r of rejected) {
    freq.set(r.reason, (freq.get(r.reason) || 0) + 1)
  }
  const topFailReasons = Array.from(freq.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)

  return {
    countsByStage: counts,
    topFailReasons,
    rejected: rejected.slice(0, 1000),
  }
}

export type { TherapistNormalized } from '@/lib/types/therapist'


