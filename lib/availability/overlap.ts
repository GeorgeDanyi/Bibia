import { type Day, type TimeBand, type WeeklyAvailability } from '@/lib/types/therapist'

const DAYS: Day[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const BANDS: TimeBand[] = ['morning','late_morning','afternoon','evening','weekend','asap']

function normDay(value: string): Day | null {
  const key = value.trim().slice(0,3).toLowerCase()
  const map: Record<string, Day> = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }
  return map[key] || null
}

function normBand(value: string): TimeBand | null {
  const v = value.trim().toLowerCase().replace(/[\s\-]+/g,'_')
  if ((BANDS as readonly string[]).includes(v)) return v as TimeBand
  return null
}

export function computeOverlap(params: {
  userDays: string[]
  userBands: string[]
  therapistWeekly: WeeklyAvailability
}): { requestedPairs: number; matchedPairs: number; fraction: number } {
  const days = Array.from(new Set(params.userDays.map(normDay).filter(Boolean))) as Day[]
  const bands = Array.from(new Set(params.userBands.map(normBand).filter(Boolean))) as TimeBand[]
  let requestedPairs = 0
  let matchedPairs = 0
  for (const d of days) {
    for (const b of bands) {
      // weekend band should only match weekend days
      if (b === 'weekend' && (d !== 'Sat' && d !== 'Sun')) continue
      requestedPairs++
      const tBands = params.therapistWeekly[d] || []
      if (tBands.includes(b)) matchedPairs++
    }
  }
  const fraction = requestedPairs > 0 ? matchedPairs / requestedPairs : 0
  return { requestedPairs, matchedPairs, fraction }
}

export function computeAsapBonus(nextAvailableInDays: number | null | undefined): number {
  if (nextAvailableInDays === null || nextAvailableInDays === undefined) return 0
  const x = Math.max(0, Math.min(1, (30 - nextAvailableInDays) / 30))
  return Math.round(x * 10 * 100) / 100 // up to 10; precise to 2 decimals
}


