import type { Criteria, TimeSlot, Mode } from '@/types/search'

const DEFAULTS: Criteria = {
  gender: 'any',
  languages: [],
  specialties: [],
  issues: [],
  mode: 'both',
  maxDistanceKm: 50,
  timeSlots: [],
  days: [],
  strict: false,
  sort: 'match',
}

export function normalizeList(s?: string | null): string[] {
  if (!s) return []
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

export function safeNum(v: string | null, fallback: number): number {
  const n = v == null ? NaN : Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function parseCriteria(search: string): Criteria {
  const sp = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const gender = (sp.get('gender') as Criteria['gender']) || DEFAULTS.gender
  const languages = normalizeList(sp.get('language') || sp.get('languages'))
  const specialties = normalizeList(sp.get('specialties') || sp.get('spec'))
  const issues = normalizeList(sp.get('issues') || sp.get('problems'))
  const mode = ((sp.get('mode') as Mode) || DEFAULTS.mode)
  const lat = sp.get('lat'); const lng = sp.get('lng')
  const place = (lat && lng) ? { lat: safeNum(lat, 0), lng: safeNum(lng, 0) } : undefined
  const maxDistanceKm = safeNum(sp.get('distance') || sp.get('maxDistanceKm'), DEFAULTS.maxDistanceKm)
  const timeSlots = normalizeList(sp.get('time') || sp.get('slots')) as TimeSlot[]
  const days = normalizeList(sp.get('days')).map(n => safeNum(n, 0)).filter(n => n>=1 && n<=7)
  const strict = (sp.get('strict') === 'true')
  const sort = (sp.get('sort') as Criteria['sort']) || DEFAULTS.sort
  return { gender, languages, specialties, issues, mode, place, maxDistanceKm, timeSlots, days, strict, sort }
}

export function criteriaToQuery(c: Criteria): string {
  const sp = new URLSearchParams()
  if (c.gender && c.gender!=='any') sp.set('gender', c.gender)
  if (c.languages.length) sp.set('language', c.languages.join(','))
  if (c.specialties.length) sp.set('specialties', c.specialties.join(','))
  if (c.issues.length) sp.set('issues', c.issues.join(','))
  if (c.mode && c.mode!=='both') sp.set('mode', c.mode)
  if (c.place) { sp.set('lat', String(c.place.lat)); sp.set('lng', String(c.place.lng)) }
  if (c.maxDistanceKm !== DEFAULTS.maxDistanceKm) sp.set('distance', String(c.maxDistanceKm))
  if (c.timeSlots.length) sp.set('time', c.timeSlots.join(','))
  if (c.days.length) sp.set('days', c.days.join(','))
  if (c.strict) sp.set('strict', 'true')
  if (c.sort !== DEFAULTS.sort) sp.set('sort', c.sort)
  const q = sp.toString()
  return q ? `?${q}` : ''
}


