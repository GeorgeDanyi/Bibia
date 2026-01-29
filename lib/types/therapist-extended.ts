/**
 * Extended Therapist Model for Four Visit Modes
 * Supports: clinic, home_visit, online, any
 */

export interface TherapistExtended {
  // Core identification
  id: string
  fullName: string
  city: string
  lat: number
  lng: number
  
  // Visit mode capabilities
  offersClinic: boolean
  offersHomeVisit: {
    enabled: boolean
    radiusKm: number
  }
  offersOnline: boolean
  
  // Legacy fields (for backward compatibility)
  practiceType?: 'private' | 'clinic' | 'hospital' | 'home_visits' | 'online'
  homeVisitRadiusKm?: number
  
  // Other existing fields
  acceptingNew: boolean
  yearsExperience: number
  pricePerSession?: number
  priceRange?: { minCZK: number; maxCZK: number }
  languages: string[]
  specialties: string[]
  diagnoses: string[]
  modalities: string[]
  worksWith: string[]
  rating?: { average: number; count: number }
  nextAvailableDays?: number | null
  workingHours?: {
    morning: boolean
    midday: boolean
    evening: boolean
    weekend: boolean
  }
  clinicName?: string
  address?: string
  phone?: string
  email?: string
  insuranceAccepted?: string[]
  isVerified?: boolean
  postalCode?: string
  isFixture?: boolean
}

export interface UserAnswers {
  city: string
  visitMode: 'clinic' | 'home_visit' | 'online' | 'any'
  conditionsMain: string[]
  conditionsDetail: string[]
  modalities: string[]
  availability: string[]
  languages: string[]
  priceRange?: string
  insurance: string[]
  ageGroups: string[]
  workplaceAccessibility: string[]
  consentGiven: boolean
}

export interface RankedTherapist {
  therapist: TherapistExtended
  score: number
  distanceKm: number
  matchReasons: string[]
}

export interface CityCoordinates {
  lat: number
  lng: number
}
