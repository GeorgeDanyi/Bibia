import { Therapist } from '../types/therapist'
import { haversineKm } from './distance'

export interface MatchResult {
  therapist: Therapist
  matchScore: number
  distanceKm: number
  composite: number
}

export type Preferences = {
  gender: 'male' | 'female' | 'any'
  languages: Array<'cs' | 'en' | 'de' | 'other'>
  experiences: Array<'sports' | 'kids' | 'seniors' | 'pregnancy'>
}

export function filterByPreferences(therapists: Therapist[], prefs?: Partial<Preferences>): Therapist[] {
  if (!prefs) return therapists
  const gender = prefs.gender || 'any'
  const languages = prefs.languages || []
  const experiences = prefs.experiences || []

  return therapists.filter(t => {
    // Gender
    if (gender !== 'any') {
      if ((t as any).gender !== gender) return false
    }

    // Languages overlap
    if (languages.length > 0) {
      const tLangs: string[] = ((t as any).languages || [])
      if (!tLangs.some(l => languages.includes(l as any))) return false
    }

    // Experiences overlap (specializations)
    if (experiences.length > 0) {
      const specs: string[] = (t.specialties || [])
      if (!specs.some(s => (experiences as string[]).includes(s))) return false
    }

    return true
  })
}

export function calculateMatchScore(
  therapist: Therapist, 
  issues: string[], 
  diagnosisTags: string[]
): number {
  let score = 0

  // +15 per overlapping issue tag (cap 45)
  const matchingIssues = therapist.specialties.filter(spec => 
    issues.includes(spec)
  )
  score += Math.min(matchingIssues.length * 15, 45)

  // +25 per overlapping diagnosis tag (cap 50)
  const matchingDiagnoses = therapist.diagnoses.filter(diag => 
    diagnosisTags.includes(diag)
  )
  score += Math.min(matchingDiagnoses.length * 25, 50)

  // + up to +5 for worksWith overlap
  const worksWithBonus = therapist.worksWith.length > 0 ? 5 : 0
  score += worksWithBonus

  return Math.min(score, 100) // Cap at 100
}

export function calculateDistanceScore(
  therapist: Therapist,
  userCoords: { lat: number, lon: number } | null
): number {
  if (!userCoords) {
    return 0.5 // Neutral score when no coordinates
  }

  const distanceKm = haversineKm(userCoords, { lat: therapist.latitude, lon: therapist.longitude })
  // Clamp between 0 and 1, with 50km being the cutoff
  return Math.max(0, Math.min(1, 1 - (distanceKm / 50)))
}

export function matchTherapists(
  therapists: Therapist[],
  issues: string[],
  diagnosisTags: string[],
  userCoords: { lat: number, lon: number } | null,
  prefs?: Partial<Preferences>
): MatchResult[] {
  // Apply preference filtering before scoring
  const base = filterByPreferences(therapists, prefs)

  const results: MatchResult[] = base.map(therapist => {
    const matchScore = calculateMatchScore(therapist, issues, diagnosisTags)
    const distanceKm = userCoords ? haversineKm(userCoords, therapist.location) : 0
    const distanceScore = calculateDistanceScore(therapist, userCoords)
    
    // Composite score: 70% match score + 30% distance score
    const composite = 0.7 * (matchScore / 100) + 0.3 * distanceScore

    return {
      therapist,
      matchScore,
      distanceKm,
      composite
    }
  })

  // Sort by composite score descending
  return results.sort((a, b) => b.composite - a.composite)
}
