// Core types for BIBIA application

export interface Therapist {
  id: string
  name: string
  city: string
  specializations: string[]
  languages: string[]
  rating?: {
    average: number
    count: number
  }
  nextAvailableSlot?: string
  priceRange?: {
    min: number
    max: number
  }
}

export interface QuestionnaireAnswers {
  firstName?: string
  email?: string
  conditions?: string[]
  location?: string
  timePreferences?: string[]
  genderPreference?: string
  languagePreference?: string[]
}

export interface SearchCriteria {
  conditions?: string[]
  location?: string
  timePreferences?: string[]
  genderPreference?: string
  languagePreference?: string[]
  radius?: number
}

export interface SearchResult {
  therapist: Therapist
  score: number
  distanceKm: number
  matchReasons: string[]
}

export interface AppConfig {
  features: {
    questionnaireV2: boolean
    advancedSearch: boolean
    analytics: boolean
  }
  data: {
    useMockData: boolean
    source: string
  }
  debug: {
    enabled: boolean
    showStatusPage: boolean
  }
}

export interface StatusInfo {
  build: {
    version: string
    environment: string
    buildTime: string
    nodeVersion: string
  }
  features: Array<{
    name: string
    enabled: boolean
  }>
  dataHealth: {
    mockData: boolean
    dataSource: string
    hasApiUrl: boolean
    hasDatabase: boolean
  }
  uxToggles: {
    debugMode: boolean
    statusPage: boolean
  }
}
