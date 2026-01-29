import { DIAGNOSIS_TO_SKILLS } from '@/lib/constants/diagnosis-to-skills'
import type { Therapist } from '@/lib/types/therapist'

export type Step1Input = {
  city?: string
  practiceType?: 'office' | 'home' | 'online' | null
}

export type Step2Input = {
  categories: string[]
  refinements: Record<string, string[]>
}

export type Step3Input = {
  hasDiagnosis: boolean
  diagnosis: string[]
  customDiagnosis?: string
  priority: 'diagnosis' | 'none'
}

export type MatchScoreBreakdown = {
  skillsPoints: number
  step2Points: number
  filterPoints: number
  total: number
  matchedSkills: string[]
}

export function scoreTherapist(
  t: Therapist,
  step1: Step1Input,
  step2: Step2Input,
  step3: Step3Input
): MatchScoreBreakdown {
  // 1) Diagnosis skills (top priority)
  const selectedDiag = step3.diagnosis || []
  const diagSkills = new Set<string>()
  for (const d of selectedDiag) {
    const mapped = (DIAGNOSIS_TO_SKILLS as Record<string, string[]>)[d] || []
    for (const s of mapped) diagSkills.add(s)
  }
  const therapistSkills: string[] =
    (t as any).skills ||
    (t as any).experienceTags ||
    (t as any).diagnosisTags ||
    (t as any).tags ||
    []

  const overlapSkills = therapistSkills.filter((s: string) => diagSkills.has(s))
  const skillsPoints = overlapSkills.length * 5

  // 2) Step 2 optional overlap (+2 per)
  const step2Set = new Set<string>([
    ...(step2.categories || []),
    ...Object.values(step2.refinements || {}).flat()
  ])
  const step2Overlap = therapistSkills.filter((s: string) => step2Set.has(s))
  const step2Points = step2Overlap.length * 2

  // 3) Step 1 filters
  let filterPoints = 0
  if (step1.city && t.city && step1.city.toLowerCase() === t.city.toLowerCase()) {
    filterPoints += 2
  }
  if (step1.practiceType && t.practiceType.includes(step1.practiceType)) {
    filterPoints += 1
  }

  const total = skillsPoints + step2Points + filterPoints

  return {
    skillsPoints,
    step2Points,
    filterPoints,
    total,
    matchedSkills: Array.from(new Set([...overlapSkills, ...step2Overlap]))
  }
}

export function sortDeterministic(
  items: Array<{ therapist: Therapist; score: MatchScoreBreakdown }>,
  seed?: string
) {
  // Score desc; tie-breaker: seeded alphabetical by name
  const seeded = (seed || '').toLowerCase()
  return items.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total
    // stable by name with seed influence (prepend seed char code sum)
    const nameA = (a.therapist as any).fullName || (a.therapist as any).name || ''
    const nameB = (b.therapist as any).fullName || (b.therapist as any).name || ''
    const sa = String(nameA).toLowerCase()
    const sb = String(nameB).toLowerCase()
    if (sa === sb) return 0
    const bias = seeded.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 2 === 0 ? 1 : -1
    return sa < sb ? -1 * bias : 1 * bias
  })
}

export function primaryReason(step3: Step3Input, step2: Step2Input): 'diagnosis' | 'step2' | 'fallback' {
  if (step3?.diagnosis && step3.diagnosis.length > 0) return 'diagnosis'
  if ((step2?.categories?.length || 0) + Object.values(step2?.refinements || {}).flat().length > 0) return 'step2'
  return 'fallback'
}


