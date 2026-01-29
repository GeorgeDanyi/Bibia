export type MatchInput = {
  diagnosisIds: string[]
  city: string
  when: { day: string; timeSlot: string }
  genderPref: 'female' | 'male' | 'any'
}

export type Therapist = {
  id: string
  coords: [number, number]
  skills: string[]
  calendar: Record<string, string[]>
  gender: 'female' | 'male'
  city: string
}

export type MatchBreakdown = {
  diagnosis: number
  distance: number
  time: number
  gender: number
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function diagnosisComponent(diagnosisIds: string[] = [], skills: string[] = []): number {
  if (!Array.isArray(diagnosisIds) || diagnosisIds.length === 0) return 0
  if (!Array.isArray(skills) || skills.length === 0) return 0

  // exact
  if (diagnosisIds.some(id => skills.includes(id))) return 1.0

  const toCategory = (s: string) => {
    const byColon = s.split(':')[0]
    const byDot = s.split('.')[0]
    return byColon.length <= byDot.length ? byColon : byDot
  }
  const toRegion = (s: string) => s.split('_')[0]

  // category
  if (diagnosisIds.some(id => skills.some(s => toCategory(s) === toCategory(id)))) return 0.75
  // region
  if (diagnosisIds.some(id => skills.some(s => toRegion(s) === toRegion(id)))) return 0.5

  return 0
}

function distanceComponentKm(km: number | null | undefined): number {
  if (km === undefined || km === null || !Number.isFinite(km)) return 0.25
  if (km <= 5) return 1.0
  if (km <= 15) return 0.75
  if (km <= 30) return 0.5
  return 0.25
}

function timeComponent(day: string, slot: string, calendar: Record<string, string[]> = {}): number {
  const dayKey = String(day || '')
  const slotKey = String(slot || '')
  if (!dayKey && !slotKey) return 0
  const daySlots = Array.isArray(calendar[dayKey]) ? calendar[dayKey] : []
  if (dayKey && slotKey && daySlots.includes(slotKey)) return 1.0
  if (dayKey && daySlots.length > 0) return 0.75
  const hasSlotAnyDay = slotKey ? Object.values(calendar).some(slots => Array.isArray(slots) && slots.includes(slotKey)) : false
  return hasSlotAnyDay ? 0.5 : 0
}

function genderComponent(pref: 'female'|'male'|'any', gender: 'female'|'male'): number {
  if (pref === 'any') return 0.75
  return pref === gender ? 1.0 : 0
}

/**
 * Compute final therapist match score.
 * NOTE: Distance in km is derived from input.city vs t.city centroid if available in the caller.
 * This function itself does not compute geo distance to avoid coupling; use distanceComponentKm(null)
 * to represent unknown distance which resolves to 0.25 by spec (>30km bucket).
 */
export function computeTherapistMatchScore(input: MatchInput, t: Therapist): number {
  const dDiag = diagnosisComponent(input?.diagnosisIds || [], t?.skills || [])
  // Distance is not provided in the signature; treat as unknown (0.25) per spec fallback
  const dDist = distanceComponentKm(undefined)
  const dTime = timeComponent(input?.when?.day || '', input?.when?.timeSlot || '', t?.calendar || {})
  const dGender = genderComponent((input?.genderPref || 'any') as any, t?.gender)
  const total = 0.5 * dDiag + 0.25 * dDist + 0.15 * dTime + 0.10 * dGender
  return clamp01(total)
}


