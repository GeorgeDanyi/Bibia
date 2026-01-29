export type TimeSlot = 'rano'|'dopoledne'|'odpoledne'|'vecer'
export type Mode = 'ordinace'|'online'|'both'

export interface Criteria {
  gender: 'male'|'female'|'any'
  languages: string[]
  specialties: string[]
  issues: string[]
  mode: Mode
  place?: { lat: number; lng: number }
  maxDistanceKm: number
  timeSlots: TimeSlot[]
  days: number[]
  strict: boolean
  sort: 'match'|'nearest'|'soonest'|'rating'
}

export interface Therapist {
  id: string
  name: string
  sex: 'male'|'female'
  coords?: { lat: number; lng: number }
  city: string
  modes: ('ordinace'|'online')[]
  languages: string[]
  specialties: string[]
  issues: string[]
  rating: number
  years: number
  availability: { days: number[]; slots: TimeSlot[] }
}


