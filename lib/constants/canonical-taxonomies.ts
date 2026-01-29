// Canonical taxonomies used across dataset generation and validation

export const CANONICAL_LANGUAGES = [
  'cestina', // cs
  'anglictina', // en
  'nemcina', // de
  'ukrajinstina', // uk
  'rustina', // ru
  'slovencina', // sk
  'polstina', // pl
  'francouzstina', // fr
  'spanelstina' // es
] as const

export const CANONICAL_AGE_GROUPS = [
  'child',
  'adult',
  'senior'
] as const

export const CANONICAL_MEETING_TYPES = [
  'ordinace',
  'dojizdeni',
  'online'
] as const

// Specialties include both generalist and niche topics
export const SPECIALTIES_GENERAL = [
  'general_physiotherapy',
  'manual_therapy'
] as const

export const SPECIALTIES_NICHE = [
  'womens_health',
  'pelvic_floor',
  'menstrual_pain',
  'pregnancy',
  'postpartum',
  'spine_pain',
  'shoulder',
  'knee',
  'sport',
  'pediatrics',
  'geriatrics'
] as const

export const CANONICAL_SPECIALTIES = [
  ...SPECIALTIES_GENERAL,
  ...SPECIALTIES_NICHE
] as const

export type CanonicalLanguage = typeof CANONICAL_LANGUAGES[number]
export type CanonicalAgeGroup = typeof CANONICAL_AGE_GROUPS[number]
export type CanonicalMeetingType = typeof CANONICAL_MEETING_TYPES[number]
export type CanonicalSpecialty = typeof CANONICAL_SPECIALTIES[number]


