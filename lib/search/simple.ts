import { normalizeAscii } from '@/lib/data/cz-gazetteer'
import synRaw from '@/data/synonyms.conditions.json'

export type SimpleQuery = {
  city: string
  radiusKm?: number
  gender?: 'male' | 'female' | 'any'
  conditionText: string
}

export type NormalizedCondition = {
  tags: string[]
  diagCategory?: 'injury'
}

export function toFilterFromSteps(answers: any): SimpleQuery {
  const city: string = answers?.city || answers?.location?.city || ''
  const radiusKm: number | undefined = typeof answers?.radiusKm === 'number' ? answers.radiusKm : undefined
  const gender: 'male' | 'female' | 'any' = (answers?.gender === 'male' || answers?.gender === 'female') ? answers.gender : 'any'
  const conditionText: string = answers?.condition || answers?.diagnosisText || answers?.issue || ''
  return { city, radiusKm, gender, conditionText }
}

type SynonymsMap = Record<string, string[] | 'injury'>
const SYNONYMS = synRaw as unknown as SynonymsMap

export function normalizeCondition(input: string): NormalizedCondition {
  const text = normalizeAscii(input || '')
  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean)

  const tags = new Set<string>()
  let diagCategory: 'injury' | undefined

  // 1) Exact key match (phrase-level)
  if (text in SYNONYMS) {
    const v = SYNONYMS[text]
    if (v === 'injury') diagCategory = 'injury'
    else v.forEach(t => tags.add(t))
  } else {
    // 2) Token-level intersection
    for (const tok of tokens) {
      const v = SYNONYMS[tok]
      if (!v) continue
      if (v === 'injury') diagCategory = 'injury'
      else v.forEach(t => tags.add(t))
    }
  }

  if (tags.size === 0 && !diagCategory) {
    throw new Error("Upřesněte problém (např. 'kotník').")
  }

  return { tags: Array.from(tags), diagCategory }
}


