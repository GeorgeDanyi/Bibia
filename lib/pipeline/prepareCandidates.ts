import { applyHardGates } from '@/lib/filters/hardGates'
import { matchDiagnosis } from '@/lib/diagnosis/match'
import { type TherapistNormalized } from '@/lib/types/therapist'
import { DETERMINISTIC } from '@/lib/config/search'

export interface PrepareCandidatesInput {
  user: any
  therapists: TherapistNormalized[]
}

export function prepareCandidates({ user, therapists }: PrepareCandidatesInput): {
  candidates: Array<TherapistNormalized & { hard_filters_passed: true; diagnosis_signal: ReturnType<typeof matchDiagnosis> }>
  rejected: Array<{ id: string; reason: string }>
} {
  const rejected: Array<{ id: string; reason: string }> = []
  const candidates: Array<TherapistNormalized & { hard_filters_passed: true; diagnosis_signal: ReturnType<typeof matchDiagnosis> }> = []

  // Compute once per user
  const diagnosis_signal = matchDiagnosis({
    userCategories: user?.diagnosis_categories,
    userDiagnosisTexts: user?.diagnosis_texts,
    userBodyRegions: user?.body_regions,
    userDiagnosisIds: user?.diagnosis_ids,
  })

  const source = DETERMINISTIC ? [...therapists].sort((a,b) => a.id.localeCompare(b.id)) : therapists
  for (const t of source) {
    const gate = applyHardGates({ user, therapist: t })
    if (!gate.pass) {
      rejected.push({ id: t.id, reason: gate.reasons[0] })
      continue
    }
    candidates.push({ ...t, hard_filters_passed: true as const, diagnosis_signal })
  }

  return { candidates, rejected }
}


