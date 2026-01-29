import DIAGNOSES from '@/data/diagnoses.json'
import { normalizeText } from './normalize'
import { type BodyRegion, type BodyRegionTag } from '@/lib/types/therapist'

type Signal = 'diag_exact' | 'diag_semantic' | 'diag_category' | 'region_match' | null

export function matchDiagnosis(params: {
  userCategories?: Array<'chronic'|'injury'|'neuro'|'onc_or_rare'>
  userDiagnosisTexts?: string[]
  userBodyRegions?: Array<BodyRegion | BodyRegionTag>
  userDiagnosisIds?: string[]
}): { signal: Signal; diagnosisId?: string; strength: 1.0 | 0.9 | 0.75 | 0.6 | 0 } {
  const { userCategories = [], userDiagnosisTexts = [], userBodyRegions = [], userDiagnosisIds = [] } = params

  // Build indices
  const byId = new Map<string, any>()
  const normalizedToId = new Map<string, string>()
  for (const d of DIAGNOSES as any[]) {
    byId.set(d.id, d)
    normalizedToId.set(normalizeText(d.canonical_cs), d.id)
    for (const s of d.synonyms || []) normalizedToId.set(normalizeText(String(s)), d.id)
  }

  // 1) Exact id
  for (const id of userDiagnosisIds) {
    if (byId.has(id)) return { signal: 'diag_exact', diagnosisId: id, strength: 1.0 }
  }

  // 2) Semantic text match
  for (const t of userDiagnosisTexts) {
    const key = normalizeText(t)
    const id = normalizedToId.get(key)
    if (id) return { signal: 'diag_semantic', diagnosisId: id, strength: 0.9 }
  }

  // 3) Category only
  if (userCategories.length > 0) {
    return { signal: 'diag_category', strength: 0.75 }
  }

  // 4) Region-only signal
  if (userBodyRegions.length > 0) {
    return { signal: 'region_match', strength: 0.6 }
  }

  return { signal: null, strength: 0 }
}


