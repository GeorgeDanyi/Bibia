import { z } from "zod"
import { canonicalizeCity } from "@/lib/geo/cityIndex"
import { CZ_CITIES } from "@/data/cz_cities"
import { validateCoordinatePair, normalizeLocations } from "@/lib/validation/coordinates"
import {
  type TherapistNormalized,
  type MeetingMode,
  type LanguageCode,
  type PatientGroup,
  type TherapistGender,
  type TimeBand,
  type Day,
  type BodyRegion,
  type BodyRegionTag,
} from "@/lib/types/therapist"

// Comprehensive backend validator for therapist records
export const therapistRecordSchema = z.object({
  // Required core fields
  id: z.string()
    .min(1, "Therapist ID is required")
    .max(100, "Therapist ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Therapist ID must contain only alphanumeric characters, hyphens, and underscores"),
  
  fullName: z.string()
    .min(1, "Full name is required")
    .max(100, "Full name too long")
    .regex(/^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s.-]+$/, "Full name contains invalid characters"),
  
  city: z.string()
    .min(1, "City is required")
    .max(100, "City name too long")
    .regex(/^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s.-]+$/, "City name contains invalid characters"),
  
  // Geographic coordinates with Czech Republic bounds
  latitude: z.number()
    .min(48.5, "Latitude must be within Czech Republic bounds (min: 48.5)")
    .max(51.1, "Latitude must be within Czech Republic bounds (max: 51.1)")
    .refine(val => !isNaN(val), "Latitude must be a valid number"),
  
  longitude: z.number()
    .min(12.0, "Longitude must be within Czech Republic bounds (min: 12.0)")
    .max(18.9, "Longitude must be within Czech Republic bounds (max: 18.9)")
    .refine(val => !isNaN(val), "Longitude must be a valid number"),
  
  // Practice information
  practiceType: z.enum(['private', 'clinic', 'hospital', 'home_visits', 'online'], {
    required_error: "Practice type is required",
    invalid_type_error: "Practice type must be one of: private, clinic, hospital, home_visits, online"
  }),
  
  acceptingNew: z.boolean({
    required_error: "Accepting new patients status is required"
  }),
  
  // Experience and pricing
  yearsExperience: z.number()
    .int("Years of experience must be an integer")
    .min(0, "Years of experience cannot be negative")
    .max(50, "Years of experience cannot exceed 50 years"),
  
  pricePerSession: z.number()
    .int("Price per session must be an integer")
    .min(0, "Price per session cannot be negative")
    .max(10000, "Price per session cannot exceed 10,000 CZK"),
  
  priceRange: z.object({
    minCZK: z.number()
      .int("Minimum price must be an integer")
      .min(0, "Minimum price cannot be negative")
      .max(10000, "Minimum price cannot exceed 10,000 CZK"),
    maxCZK: z.number()
      .int("Maximum price must be an integer")
      .min(0, "Maximum price cannot be negative")
      .max(10000, "Maximum price cannot exceed 10,000 CZK")
  }).refine(data => data.minCZK <= data.maxCZK, {
    message: "Minimum price must be less than or equal to maximum price",
    path: ["maxCZK"]
  }).optional(),
  
  // Languages with validation
  languages: z.array(z.string())
    .min(1, "At least one language is required")
    .max(10, "Cannot have more than 10 languages")
    .refine(langs => langs.every(lang => 
      ['cs', 'en', 'de', 'ru', 'uk', 'sk', 'fr', 'es', 'it', 'pl'].includes(lang)
    ), "All languages must be valid language codes"),
  
  // Specializations and tags
  specialties: z.array(z.string())
    .min(1, "At least one specialty is required")
    .max(20, "Cannot have more than 20 specialties")
    .refine(specs => specs.every(spec => spec.length >= 2 && spec.length <= 50), 
      "Each specialty must be between 2 and 50 characters"),
  
  diagnosisTags: z.array(z.string())
    .max(30, "Cannot have more than 30 diagnosis tags")
    .refine(tags => tags.every(tag => tag.length >= 2 && tag.length <= 50), 
      "Each diagnosis tag must be between 2 and 50 characters"),
  
  tags: z.array(z.string())
    .max(50, "Cannot have more than 50 tags")
    .refine(tags => tags.every(tag => tag.length >= 2 && tag.length <= 50), 
      "Each tag must be between 2 and 50 characters"),
  
  // Rating validation
  rating: z.object({
    average: z.number()
      .min(0, "Rating average cannot be negative")
      .max(5, "Rating average cannot exceed 5.0")
      .refine(val => !isNaN(val), "Rating average must be a valid number"),
    count: z.number()
      .int("Rating count must be an integer")
      .min(0, "Rating count cannot be negative")
      .max(10000, "Rating count cannot exceed 10,000")
  }).optional(),
  
  // Availability information
  nextAvailableDays: z.number()
    .int("Next available days must be an integer")
    .min(0, "Next available days cannot be negative")
    .max(365, "Next available days cannot exceed 365")
    .nullable()
    .optional(),
  
  workingHours: z.object({
    morning: z.boolean(),
    midday: z.boolean(),
    evening: z.boolean(),
    weekend: z.boolean()
  }).optional(),
  
  // Optional fields with validation
  bio: z.string()
    .max(2000, "Bio cannot exceed 2000 characters")
    .optional(),
  
  profileImage: z.string()
    .url("Profile image must be a valid URL")
    .optional(),
  
  clinicName: z.string()
    .max(100, "Clinic name too long")
    .optional(),
  
  address: z.string()
    .max(200, "Address too long")
    .optional(),
  
  phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{9,20}$/, "Phone number format is invalid")
    .optional(),
  
  email: z.string()
    .email("Email format is invalid")
    .optional(),
  
  website: z.string()
    .url("Website must be a valid URL")
    .optional(),
  
  insuranceAccepted: z.array(z.string())
    .max(10, "Cannot accept more than 10 insurance companies")
    .refine(insurers => insurers.every(insurer => insurer.length >= 2 && insurer.length <= 20), 
      "Each insurance code must be between 2 and 20 characters")
    .optional(),
  
  isVerified: z.boolean().optional(),
  
  lastActive: z.string()
    .datetime("Last active must be a valid ISO datetime")
    .optional(),
  
  // Additional metadata
  regions: z.array(z.string())
    .max(5, "Cannot be in more than 5 regions")
    .optional(),
  
  modalities: z.array(z.string())
    .max(20, "Cannot have more than 20 modalities")
    .optional(),
  
  worksWith: z.array(z.string())
    .max(10, "Cannot work with more than 10 population groups")
    .optional(),
  
  reviewsCount: z.number()
    .int("Reviews count must be an integer")
    .min(0, "Reviews count cannot be negative")
    .max(10000, "Reviews count cannot exceed 10,000")
    .optional()
})

// Validation result type
export interface TherapistValidationResult {
  success: boolean
  data?: z.infer<typeof therapistRecordSchema>
  errors?: string[]
  warnings?: string[]
}

// === PART A normalized schema & validator ===

const MEETING_MODES = ["clinic","home_visit","online"] as const satisfies Readonly<MeetingMode[]>
const LANGUAGE_CODES = ["cs","en","de","ru","uk","sk"] as const satisfies Readonly<LanguageCode[]>
const PATIENT_GROUPS = ["adult","child","senior"] as const satisfies Readonly<PatientGroup[]>
const GENDERS = ["male","female"] as const satisfies Readonly<TherapistGender[]>
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] as const satisfies Readonly<Day[]>
const TIME_BANDS = ["morning","late_morning","afternoon","evening","weekend","asap"] as const satisfies Readonly<TimeBand[]>

const BODY_REGIONS: readonly BodyRegion[] = [
  "upper_limb","lower_limb","spine","head_neck","pelvis","torso","post_surgery","postpartum","pelvic_floor","sports_specific"
] as const

const BODY_REGION_TAGS: readonly BodyRegionTag[] = [
  "shoulder","elbow","wrist","hand","fingers","thumb",
  "hip","knee","ankle","foot","toes","achilles",
  "cervical","thoracic","lumbar","sacral","sciatica",
  "headache","tmj","dizziness","whiplash",
  "si_joint","pelvic_instability","groin",
  "ribs","diaphragm","abdominal_wall",
  "tka","tha","acl","meniscus","rotator_cuff","spine_fusion",
  "diastasis","c_section_recovery","lactation_related","return_to_sport_postpartum",
  "incontinence","prolapse","pain","pregnancy","postpartum_recovery",
  "running","cycling","swimming","strength_training","team_sports"
] as const

// Simple diacritics removal
function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
}

function unifySeparators(value: string): string {
  return value.replace(/[\s\-]+/g, '_').replace(/_+/g, '_')
}

function normalizeToken(value: unknown): string {
  if (typeof value !== 'string') return ''
  return unifySeparators(stripDiacritics(value.trim().toLowerCase()))
}

// Alias maps (expandable)
const MEETING_MODE_ALIASES: Record<string, MeetingMode> = {
  // czech variants
  'ordinace': 'clinic',
  'klinika': 'clinic',
  'clinic_visit': 'clinic',
  'ambulance': 'clinic',
  'dojizdeni': 'home_visit',
  'dojíždění': 'home_visit',
  'home': 'home_visit',
  'home-visit': 'home_visit',
  'domu': 'home_visit',
  'domů': 'home_visit',
  'online_konzultace': 'online',
  'virtual': 'online',
}

const LANGUAGE_ALIASES: Record<string, LanguageCode | 'es' | 'pl' | 'it' | 'fr'> = {
  // allowed
  'cestina': 'cs', 'cesky': 'cs', 'česky': 'cs', 'cz': 'cs', 'cs': 'cs',
  'anglictina': 'en', 'english': 'en', 'en': 'en',
  'nemcina': 'de', 'de': 'de', 'deutsch': 'de',
  'rustina': 'ru', 'ruština': 'ru', 'ru': 'ru',
  'ukrajinstina': 'uk', 'ukrajinsky': 'uk', 'uk': 'uk',
  'slovencina': 'sk', 'slovensky': 'sk', 'sk': 'sk',
  // unsupported (kept to surface precise errors with suggestions)
  'spanelstina': 'es', 'spanelsky': 'es', 'es': 'es',
  'polstina': 'pl', 'polsky': 'pl', 'pl': 'pl',
  'italstina': 'it', 'italsky': 'it', 'it': 'it',
  'francouzstina': 'fr', 'francouzsky': 'fr', 'fr': 'fr',
}

// Levenshtein distance (iterative DP)
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  return dp[m][n]
}

function suggestClosest(value: string, domain: readonly string[]): string | undefined {
  let best: { d: number; v: string } | undefined
  for (const v of domain) {
    const d = levenshtein(value, v)
    if (!best || d < best.d) best = { d, v }
  }
  return best && best.d <= 2 ? best.v : undefined
}

export interface ValidationError {
  path: string
  expected: string
  received: string
  suggestion?: string
}

export interface ValidationResult {
  ok: boolean
  value?: TherapistNormalized
  errors?: ValidationError[]
  warnings?: string[]
}

function makeError(path: string, expected: string, received: unknown, domain?: readonly string[]): ValidationError {
  const rec = typeof received === 'string' ? received : JSON.stringify(received)
  const suggestion = typeof received === 'string' && domain ? suggestClosest(normalizeToken(received), domain.map(v => normalizeToken(v))) : undefined
  return { path, expected, received: rec ?? 'undefined', suggestion }
}

// Use PART B canonicalization
const cityCanonicalize = (cityRaw: unknown): string => {
  if (typeof cityRaw !== 'string') return ''
  const can = canonicalizeCity(cityRaw)
  return can ? can.city : ''
}

// Zod schema for normalized record
const ZodWeeklyAvailability = z.object({
  Mon: z.array(z.enum(TIME_BANDS)).default([]),
  Tue: z.array(z.enum(TIME_BANDS)).default([]),
  Wed: z.array(z.enum(TIME_BANDS)).default([]),
  Thu: z.array(z.enum(TIME_BANDS)).default([]),
  Fri: z.array(z.enum(TIME_BANDS)).default([]),
  Sat: z.array(z.enum(TIME_BANDS)).default([]),
  Sun: z.array(z.enum(TIME_BANDS)).default([]),
})

export const TherapistNormalizedSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  full_name: z.string().min(1).max(100),
  gender: z.enum(GENDERS),
  accepting_new: z.boolean(),

  meeting_modes: z.array(z.enum(MEETING_MODES)).min(1),
  base_city: z.string().min(1).max(100),
  locations: z.array(z.object({
    city: z.string().min(1).max(100),
    lat: z.number().min(48.5).max(51.1).refine(v => Number.isFinite(v)),
    lon: z.number().min(12.0).max(18.9).refine(v => Number.isFinite(v)),
    barrier_free: z.boolean(),
  })).default([]),
  service_radius_km: z.number().min(0).max(200).optional(),
  service_areas: z.array(z.string()).optional(),

  languages: z.array(z.enum(LANGUAGE_CODES)).min(1),
  insurers: z.array(z.string()).default([]),
  specialties: z.array(z.union([z.enum(BODY_REGIONS as [BodyRegion, ...BodyRegion[]]), z.enum(BODY_REGION_TAGS as [BodyRegionTag, ...BodyRegionTag[]])])).default([]),
  diagnosis_expertise: z.array(z.string()).default([]),
  patient_groups: z.array(z.enum(PATIENT_GROUPS)).min(1),

  weekly_availability: ZodWeeklyAvailability,
  price_info: z.object({
    range_czk: z.object({ min: z.number().min(0).max(100000), max: z.number().min(0).max(100000) }).optional(),
    fixed_czk: z.number().min(0).max(100000).optional(),
    note: z.string().max(140).optional(),
  }).partial().refine(obj => !!obj.range_czk || obj.fixed_czk !== undefined || !!obj.note, { message: 'price_info must have range_czk or fixed_czk or note' }).optional(),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().min(0).max(100000) }).optional(),
  next_available_in_days: z.number().int().min(0).max(365).nullable().optional(),
})

export function normalizeTherapist(input: any): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // id
  const idRaw = input?.id
  const id = typeof idRaw === 'string' ? idRaw.trim() : ''
  if (!id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
    errors.push(makeError('id', 'string 1-100 (URL-safe slug)', idRaw))
  }

  // full_name
  const fullNameRaw = input?.full_name ?? input?.fullName ?? input?.name
  const full_name = typeof fullNameRaw === 'string' ? fullNameRaw.trim() : ''
  if (!full_name || full_name.length > 100) {
    errors.push(makeError('full_name', 'string 1-100', fullNameRaw))
  }

  // gender
  const genderTok = normalizeToken(input?.gender)
  const gender = (GENDERS as readonly string[]).includes(genderTok) ? (genderTok as TherapistGender) : undefined
  if (!gender) {
    errors.push(makeError('gender', `one of ${GENDERS.join(', ')}`, input?.gender, GENDERS))
  }

  // accepting_new
  const accepting_new = Boolean(input?.accepting_new ?? input?.acceptingNew)

  // meeting_modes
  const rawModes: unknown[] = Array.isArray(input?.meeting_modes ?? input?.meetingModes ?? input?.meeting_types) ? (input.meeting_modes ?? input.meetingModes ?? input.meeting_types) : []
  const meeting_modes = Array.from(new Set(rawModes.map(v => {
    const t = normalizeToken(v)
    return (MEETING_MODE_ALIASES[t] ?? t) as string
  })) ).filter(v => (MEETING_MODES as readonly string[]).includes(v)) as MeetingMode[]
  if (meeting_modes.length === 0) {
    errors.push(makeError('meeting_modes', `non-empty subset of ${MEETING_MODES.join(', ')}`, rawModes, MEETING_MODES))
  }

  // base_city
  const base_city = cityCanonicalize(input?.base_city ?? input?.city)
  if (!base_city) {
    errors.push(makeError('base_city', 'canonical Czech city or "online"', input?.base_city ?? input?.city))
  }

  // locations
  const rawLocs: unknown[] = Array.isArray(input?.locations) ? input.locations : []
  const locations = rawLocs.map((loc, i) => {
    const city = cityCanonicalize((loc as any)?.city)
    const lat = Number((loc as any)?.lat)
    const lon = Number((loc as any)?.lon)
    const barrier_free = Boolean((loc as any)?.barrier_free)
    if (!city) errors.push(makeError(`locations[${i}].city`, 'canonical city', (loc as any)?.city))
    if (!Number.isFinite(lat) || lat < 48.5 || lat > 51.1) errors.push(makeError(`locations[${i}].lat`, '48.5–51.1', (loc as any)?.lat))
    if (!Number.isFinite(lon) || lon < 12.0 || lon > 18.9) errors.push(makeError(`locations[${i}].lon`, '12.0–18.9', (loc as any)?.lon))
    // Geo street-level diagnostics: if coordinates are exactly matching city centroid or missing precision
    const czCity = CZ_CITIES.find(c => c.city === city)
    if (czCity) {
      const sameAsCentroid = Math.abs(czCity.lat - lat) < 1e-6 && Math.abs(czCity.lon - lon) < 1e-6
      if (sameAsCentroid) {
        warnings.push('GEO_STREET_LEVEL=false (city centroid used)')
      }
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      errors.push(makeError(`locations[${i}].coords`, 'finite lat/lon within Czech bounds', { lat, lon }))
    }
    return { city, lat, lon, barrier_free }
  })

  // service_radius_km
  const service_radius_km = input?.service_radius_km !== undefined ? Number(input.service_radius_km) : undefined
  if (service_radius_km !== undefined && (!Number.isFinite(service_radius_km) || service_radius_km < 0 || service_radius_km > 200)) {
    errors.push(makeError('service_radius_km', '0–200', input?.service_radius_km))
  }

  // service_areas
  const service_areas: string[] | undefined = Array.isArray(input?.service_areas)
    ? Array.from(new Set((input.service_areas as any[]).map(cityCanonicalize).filter(Boolean)))
    : undefined

  // languages
  const rawLangs: unknown[] = Array.isArray(input?.languages) ? input.languages : []
  const normLangs = Array.from(new Set(rawLangs.map(v => LANGUAGE_ALIASES[normalizeToken(v)] ?? normalizeToken(v))))
  const languages = normLangs.filter(v => (LANGUAGE_CODES as readonly string[]).includes(v)) as LanguageCode[]
  if (languages.length === 0) {
    errors.push(makeError('languages', `non-empty subset of ${LANGUAGE_CODES.join(', ')}`, rawLangs, LANGUAGE_CODES))
  }
  // report unknowns with suggestions
  normLangs.filter(v => !(LANGUAGE_CODES as readonly string[]).includes(v)).forEach(v => {
    errors.push(makeError('languages[]', `one of ${LANGUAGE_CODES.join(', ')}`, v, LANGUAGE_CODES))
  })

  // insurers (codes as strings)
  const insurers: string[] = Array.isArray(input?.insurers) ? Array.from(new Set((input.insurers as any[]).map(x => normalizeToken(String(x))))) : []

  // specialties
  const rawSpecs: unknown[] = Array.isArray(input?.specialties) ? input.specialties : []
  const specsNorm = Array.from(new Set(rawSpecs.map(normalizeToken)))
  const specialties = specsNorm.filter(v => (BODY_REGIONS as readonly string[]).includes(v) || (BODY_REGION_TAGS as readonly string[]).includes(v)) as (BodyRegion | BodyRegionTag)[]
  specsNorm.filter(v => !specialties.includes(v as any)).forEach(v => {
    errors.push(makeError('specialties[]', 'known body region or tag', v, [...BODY_REGIONS, ...BODY_REGION_TAGS]))
  })

  // diagnosis_expertise (ids; must be non-empty strings if present)
  const diagnosis_expertise: string[] = Array.isArray(input?.diagnosis_expertise) ? Array.from(new Set((input.diagnosis_expertise as any[]).map(x => String(x).trim()).filter(x => x.length > 0))) : []

  // patient_groups
  const rawGroups: unknown[] = Array.isArray(input?.patient_groups) ? input.patient_groups : []
  const normGroups = Array.from(new Set(rawGroups.map(normalizeToken)))
  const patient_groups = normGroups.filter(v => (PATIENT_GROUPS as readonly string[]).includes(v)) as PatientGroup[]
  if (patient_groups.length === 0) {
    errors.push(makeError('patient_groups', `non-empty subset of ${PATIENT_GROUPS.join(', ')}`, rawGroups, PATIENT_GROUPS))
  }
  normGroups.filter(v => !(PATIENT_GROUPS as readonly string[]).includes(v)).forEach(v => {
    errors.push(makeError('patient_groups[]', `one of ${PATIENT_GROUPS.join(', ')}`, v, PATIENT_GROUPS))
  })

  // weekly_availability
  const weekly_availability: Record<Day, TimeBand[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] }
  const waRaw = input?.weekly_availability && typeof input.weekly_availability === 'object' ? input.weekly_availability : {}
  for (const dayKey of Object.keys(waRaw)) {
    const dNorm = (DAYS as readonly string[]).find(d => normalizeToken(d) === normalizeToken(dayKey)) as Day | undefined
    if (!dNorm) {
      errors.push(makeError(`weekly_availability.${dayKey}`, `day key in ${DAYS.join(', ')}`, dayKey, DAYS))
      continue
    }
    const bandsRaw: unknown[] = Array.isArray(waRaw[dayKey]) ? waRaw[dayKey] : []
    const bandsNorm = Array.from(new Set(bandsRaw.map(normalizeToken)))
    const validBands = bandsNorm.filter(v => (TIME_BANDS as readonly string[]).includes(v)) as TimeBand[]
    weekly_availability[dNorm] = validBands
    bandsNorm.filter(v => !(TIME_BANDS as readonly string[]).includes(v)).forEach(v => {
      errors.push(makeError(`weekly_availability.${dNorm}[]`, `one of ${TIME_BANDS.join(', ')}`, v, TIME_BANDS))
    })
  }

  // price_info
  const price_info = (() => {
    const p = input?.price_info
    if (!p) return undefined
    const out: any = {}
    if (p.range_czk) {
      const min = Number(p.range_czk.min)
      const max = Number(p.range_czk.max)
      if (!Number.isFinite(min) || min < 0 || min > 100000) errors.push(makeError('price_info.range_czk.min', '0–100000', p.range_czk.min))
      if (!Number.isFinite(max) || max < 0 || max > 100000) errors.push(makeError('price_info.range_czk.max', '0–100000', p.range_czk.max))
      if (Number.isFinite(min) && Number.isFinite(max) && min > max) errors.push(makeError('price_info.range_czk', 'min ≤ max', `${min} > ${max}`))
      out.range_czk = { min, max }
    }
    if (p.fixed_czk !== undefined) {
      const fixed = Number(p.fixed_czk)
      if (!Number.isFinite(fixed) || fixed < 0 || fixed > 100000) errors.push(makeError('price_info.fixed_czk', '0–100000', p.fixed_czk))
      out.fixed_czk = fixed
    }
    if (p.note !== undefined) {
      if (typeof p.note !== 'string' || p.note.trim().length > 140) errors.push(makeError('price_info.note', 'string ≤ 140', p.note))
      else out.note = p.note.trim()
    }
    if (!out.range_czk && out.fixed_czk === undefined && !out.note) return undefined
    return out
  })()

  // rating
  const rating = (() => {
    const r = input?.rating
    if (!r) return undefined
    const average = Number(r.average)
    const count = Number(r.count)
    if (!Number.isFinite(average) || average < 0 || average > 5) errors.push(makeError('rating.average', '0–5', r.average))
    if (!Number.isFinite(count) || count < 0 || !Number.isInteger(count) || count > 100000) errors.push(makeError('rating.count', 'integer 0–100000', r.count))
    return { average, count }
  })()

  // next_available_in_days
  const next_available_in_days = input?.next_available_in_days === null ? null : input?.next_available_in_days !== undefined ? Number(input.next_available_in_days) : undefined
  if (next_available_in_days !== undefined && next_available_in_days !== null) {
    if (!Number.isInteger(next_available_in_days) || next_available_in_days < 0 || next_available_in_days > 365) {
      errors.push(makeError('next_available_in_days', 'integer 0–365 or null', input?.next_available_in_days))
    }
  }

  // Invariants
  const hasInPerson = meeting_modes.includes('clinic') || meeting_modes.includes('home_visit')
  if (meeting_modes.includes('home_visit') && service_radius_km === undefined) {
    errors.push(makeError('service_radius_km', 'required when meeting_modes includes home_visit', undefined))
  }
  if (meeting_modes.length === 1 && meeting_modes[0] === 'online' && (locations?.length ?? 0) > 0) {
    warnings.push('online-only profile: locations provided will be ignored by search')
  }

  // Hard coordinate rule per request
  if (hasInPerson) {
    const normalized: Array<{ lat: number; lon: number; [key: string]: any }> = normalizeLocations(locations as any[])
    // replace computed locations with normalized ones
    (locations as any) = normalized

    // DEV/TEST rescue: inject city centroid when in-person has no locations
    if ((process.env.NODE_ENV !== 'production') && normalized.length === 0 && hasInPerson) {
      const fallbackCityName = base_city || (Array.isArray(rawLocs) && rawLocs[0] ? cityCanonicalize((rawLocs[0] as any)?.city) : '')
      if (fallbackCityName) {
        const rec = CZ_CITIES.find(c => c.city === fallbackCityName)
        if (rec) {
          (locations as any) = [{ city: rec.city, lat: rec.lat, lon: rec.lon, barrier_free: false }]
          warnings.push('USED_CITY_CENTROID')
        }
      }
    }

    if ((locations as any).length === 0 && meeting_modes.includes('clinic')) {
      errors.push(`locations: at least 1 valid CZ coordinate required for clinic (${id})`)
    }
  }

  // If no valid CZ locations remain for in-person, offer online-only alternative
  // - For clinic: already handled by hard error above
  // - For home_visit without valid CZ locations: drop home_visit; if nothing remains, set online-only
  let meeting_modes_out = meeting_modes
  if ((locations as any).length === 0 && hasInPerson && !meeting_modes.includes('clinic')) {
    const kept = meeting_modes.filter(m => m !== 'home_visit')
    if (kept.length === 0) {
      meeting_modes_out = ['online'] as any
    } else {
      meeting_modes_out = kept as any
      if (!kept.includes('online')) meeting_modes_out = [...kept, 'online'] as any
    }
    warnings.push('DOWNGRADED_TO_ONLINE_NO_VALID_CZ_LOCATION')
  }

  // apply potentially downgraded meeting modes
  const meeting_modes_final = meeting_modes_out

  const candidate: TherapistNormalized = {
    id,
    full_name,
    gender: gender as TherapistGender,
    accepting_new,
    meeting_modes: meeting_modes_final,
    base_city,
    locations,
    service_radius_km,
    service_areas,
    languages,
    insurers,
    specialties,
    diagnosis_expertise,
    patient_groups,
    weekly_availability: {
      Mon: weekly_availability.Mon,
      Tue: weekly_availability.Tue,
      Wed: weekly_availability.Wed,
      Thu: weekly_availability.Thu,
      Fri: weekly_availability.Fri,
      Sat: weekly_availability.Sat,
      Sun: weekly_availability.Sun,
    },
    price_info,
    rating,
    next_available_in_days,
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings: warnings.length ? warnings : undefined }
  }

  // Final Zod structural check
  const parsed = TherapistNormalizedSchema.safeParse(candidate)
  if (!parsed.success) {
    parsed.error.errors.forEach(e => {
      errors.push(makeError(e.path.join('.'), e.message, undefined))
    })
    return { ok: false, errors, warnings: warnings.length ? warnings : undefined }
  }

  return { ok: true, value: parsed.data, warnings: warnings.length ? warnings : undefined }
}

// Validate a single therapist record
export function validateTherapistRecord(therapist: any): TherapistValidationResult {
  try {
    const validated = therapistRecordSchema.parse(therapist)
    
    // HARD VALIDATION: Check coordinates for in-person profiles
    const isInPerson = validated.practiceType === 'private' || 
                      validated.practiceType === 'clinic' || 
                      validated.practiceType === 'hospital' ||
                      validated.practiceType === 'home_visits'
    
    if (isInPerson) {
      try {
        validateCoordinatePair(validated.latitude, validated.longitude, `therapist ${validated.id}`)
      } catch (error) {
        return {
          success: false,
          errors: [error instanceof Error ? error.message : String(error)]
        }
      }
    }
    
    // Additional business logic validations
    const warnings: string[] = []
    
    // Check for suspicious data patterns
    if (validated.yearsExperience > 40 && validated.pricePerSession < 500) {
      warnings.push("Low price for high experience - verify data accuracy")
    }
    
    if (validated.rating && validated.rating.count > 0 && validated.rating.average < 2.0) {
      warnings.push("Very low rating with reviews - verify data accuracy")
    }
    
    if (validated.languages.length === 1 && !validated.languages.includes('cs')) {
      warnings.push("Therapist doesn't speak Czech - verify market relevance")
    }
    
    if (validated.nextAvailableDays && validated.nextAvailableDays > 90) {
      warnings.push("Very long wait time - verify availability data")
    }
    
    return {
      success: true,
      data: validated,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    
    return {
      success: false,
      errors: ['Invalid therapist data format']
    }
  }
}

// Validate multiple therapist records
export function validateTherapistRecords(therapists: any[]): {
  valid: z.infer<typeof therapistRecordSchema>[]
  invalid: { therapist: any; errors: string[] }[]
  warnings: { therapist: z.infer<typeof therapistRecordSchema>; warnings: string[] }[]
} {
  const valid: z.infer<typeof therapistRecordSchema>[] = []
  const invalid: { therapist: any; errors: string[] }[] = []
  const warnings: { therapist: z.infer<typeof therapistRecordSchema>; warnings: string[] }[] = []
  
  for (const therapist of therapists) {
    const result = validateTherapistRecord(therapist)
    
    if (result.success && result.data) {
      valid.push(result.data)
      
      if (result.warnings && result.warnings.length > 0) {
        warnings.push({
          therapist: result.data,
          warnings: result.warnings
        })
      }
    } else {
      invalid.push({
        therapist,
        errors: result.errors || ['Unknown validation error']
      })
    }
  }
  
  return { valid, invalid, warnings }
}

// Check for duplicate IDs in therapist records
export function checkDuplicateIds(therapists: z.infer<typeof therapistRecordSchema>[]): {
  duplicates: string[]
  unique: z.infer<typeof therapistRecordSchema>[]
} {
  const seen = new Set<string>()
  const duplicates: string[] = []
  const unique: z.infer<typeof therapistRecordSchema>[] = []
  
  for (const therapist of therapists) {
    if (seen.has(therapist.id)) {
      duplicates.push(therapist.id)
    } else {
      seen.add(therapist.id)
      unique.push(therapist)
    }
  }
  
  return { duplicates, unique }
}

// Generate validation report
export function generateValidationReport(therapists: any[]): {
  total: number
  valid: number
  invalid: number
  warnings: number
  duplicates: number
  summary: {
    criticalIssues: string[]
    warnings: string[]
    recommendations: string[]
  }
} {
  const validation = validateTherapistRecords(therapists)
  const duplicateCheck = checkDuplicateIds(validation.valid)
  
  const criticalIssues: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Analyze critical issues
  if (validation.invalid.length > 0) {
    criticalIssues.push(`${validation.invalid.length} therapist records failed validation`)
  }
  
  if (duplicateCheck.duplicates.length > 0) {
    criticalIssues.push(`${duplicateCheck.duplicates.length} duplicate therapist IDs found`)
  }
  
  // Analyze warnings
  if (validation.warnings.length > 0) {
    warnings.push(`${validation.warnings.length} therapist records have warnings`)
  }
  
  // Generate recommendations
  if (validation.invalid.length > validation.valid.length * 0.1) {
    recommendations.push("High validation failure rate - review data quality processes")
  }
  
  if (validation.warnings.length > validation.valid.length * 0.2) {
    recommendations.push("Many warnings detected - consider data quality improvements")
  }
  
  if (duplicateCheck.duplicates.length > 0) {
    recommendations.push("Implement duplicate detection in data ingestion pipeline")
  }
  
  return {
    total: therapists.length,
    valid: validation.valid.length,
    invalid: validation.invalid.length,
    warnings: validation.warnings.length,
    duplicates: duplicateCheck.duplicates.length,
    summary: {
      criticalIssues,
      warnings,
      recommendations
    }
  }
}

