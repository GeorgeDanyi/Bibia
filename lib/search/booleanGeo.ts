import { canonicalizeCity } from '@/lib/geo/cityIndex'
import { computeEffectiveDistance } from '@/lib/geo/distance'
import { type TherapistNormalized } from '@/lib/types/therapist'
import { normalizeCondition, type SimpleQuery } from './simple'

export type TherapistMatch = {
  therapist: TherapistNormalized
  distanceKm: number | null
}

function conditionOverlap(therapist: TherapistNormalized, tags: string[], diagCategory?: 'injury'): boolean {
  const tset = new Set(therapist.specialties)
  // require overlap with provided tags
  const allTagsPresent = tags.every(t => tset.has(t as any))
  if (allTagsPresent) return true

  if (diagCategory === 'injury') {
    // accept if therapist has any injury diagnosis expertise OR ankle/lower_limb specialties
    const hasInjuryDiag = (therapist.diagnosis_expertise || []).some(d => typeof d === 'string' && d.includes('injury'))
    const hasLowerLimb = tset.has('lower_limb' as any)
    const hasAnkle = tset.has('ankle' as any)
    if (hasInjuryDiag || (hasLowerLimb || hasAnkle)) return true
  }
  return false
}

export function searchSimple(params: { query: SimpleQuery; therapists: TherapistNormalized[] }): TherapistMatch[] {
  const { query } = params
  const cityCanonical = canonicalizeCity(query.city)
  if (!cityCanonical) {
    throw new Error(`Unknown city: ${query.city}`)
  }

  const needGender = query.gender && query.gender !== 'any' ? query.gender : undefined
  const cond = normalizeCondition(query.conditionText)
  const radius = typeof query.radiusKm === 'number' ? query.radiusKm : 20

  const passing: TherapistMatch[] = []
  for (const t of params.therapists) {
    // ignore online-only
    const modes = t.meeting_modes || []
    const hasOffline = modes.includes('clinic') || modes.includes('home_visit')
    if (!hasOffline) continue

    if (needGender && t.gender !== needGender) continue

    // compute effective distance for the best offline mode
    let bestKm: number | null = null
    for (const mode of ['clinic','home_visit'] as const) {
      if (!modes.includes(mode)) continue
      const eff = computeEffectiveDistance({ clientCity: cityCanonical.city, therapist: t, meetingMode: mode })
      if (!eff.allowed) continue
      if (eff.km === null) continue
      bestKm = bestKm === null ? eff.km : Math.min(bestKm, eff.km)
    }

    if (bestKm === null) continue
    if (bestKm > radius) continue

    if (!conditionOverlap(t, cond.tags, cond.diagCategory)) continue

    passing.push({ therapist: t, distanceKm: bestKm })
  }

  passing.sort((a, b) => {
    const da = a.distanceKm ?? Infinity
    const db = b.distanceKm ?? Infinity
    if (da !== db) return da - db
    if (a.therapist.accepting_new !== b.therapist.accepting_new) return (b.therapist.accepting_new ? 1 : 0) - (a.therapist.accepting_new ? 1 : 0)
    return a.therapist.id.localeCompare(b.therapist.id)
  })

  return passing
}


