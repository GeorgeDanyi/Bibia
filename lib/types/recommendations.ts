export type Criteria = {
  gender?: 'Muž' | 'Žena' | 'Nezáleží'
  place?: 'Ordinace' | 'U mě doma' | 'Online' | 'Nezáleží'
  langs: string[]
  experiences: string[]
  time?: string[]
  maxKm?: number
}

export type Physio = {
  id: string
  name: string
  title?: string
  city: string
  distanceKm: number
  gender: 'Muž' | 'Žena'
  languages: string[]
  experiences: string[]
  rating?: number
  years?: number
  priceFrom?: number
  photo?: string
  lat?: number
  lng?: number
}

