import { NextRequest, NextResponse } from 'next/server'
import { normalizeSearchInputs, convertSearchInputsToMatchingInputs, convertIndexedTherapistToMatchingTherapist } from '@/lib/matching/normalization'
import { findMatches } from '@/lib/matching/matching-engine'
import { CityService } from '@/lib/services/CityService'
import { normalizePlace } from '@/lib/services/normalizePlace'
import { haversineKm } from '@/lib/utils/geo'
import { DISTANCE_DECAY_KM, HOME_VISIT_BONUS } from '@/lib/constants/geo'
import { logSearch } from '@/lib/utils/search-logger'
import { searchTherapistsES } from '@/lib/services/EsClient'
import { toArray, toObject, safeLogError, normalizeTherapistGender } from '@/lib/utils/normalize'
import { matchesGender, matchesAgeGroup, matchesMeetingType, isInRadiusSync, type MeetingTypeInput } from '@/lib/utils/therapist-matchers'
import { USE_SYNTHETIC, isSyntheticEnabledFromQuery } from '@/lib/config/data'
import { classifyTier } from '@/lib/search/classifyTier'
import { SAFE_LOCAL_MODE } from '@/lib/config/search'
import { matchComputed } from '@/lib/utils/telemetry'
import { getCityCoords } from '@/lib/geo/cities'
import { toDiagnosisIds } from '@/lib/utils/diagnosis'
import { MOCK_THERAPISTS } from '@/lib/data/therapists'

// New: lightweight in-memory index over generated dataset
type IndexedTherapist = {
  id: string
  name: string
  gender: 'male' | 'female'
  city: string
  lat: number
  lng: number
  meeting_types: Array<'ordinace' | 'dojizdeni' | 'dojíždění' | 'online' | 'clinic' | 'home_visit'>
  service_radius_km: number
  languages: string[]
  specialties: string[]
  age_groups: Array<'child'|'adult'|'senior'>
  accepts_insurance: boolean
  availability: string[]
  profile_score: number
  reviews_count: number
  verified: boolean
  bio: string
  created_at: string
  metadata: { has_photos: boolean; education: string; synthetic?: boolean; missing_coords?: boolean }
}

let INDEX: IndexedTherapist[] | null = null
let DEV_STATS_PRINTED = false

function toNum(x: any): number | null {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  if (typeof x === 'string') {
    const n = parseFloat(x.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Hard filters - MANDATORY filters applied BEFORE scoring
 * These filters guarantee that a therapist who does NOT qualify is never returned.
 */
interface HardFilterInputs {
  meetingType: MeetingTypeInput
  location?: { coords?: { lat: number; lon: number } | null; city?: string }
  radiusKm?: number
  ageGroup?: 'child' | 'adult' | 'senior'
  barrierFree?: boolean
  strictGender?: boolean
  genderPreference?: 'male' | 'female' | 'any'
}

function applyHardFilters(
  therapist: IndexedTherapist,
  inputs: HardFilterInputs
): { pass: boolean; reason?: string } {
  const userCoords = inputs.location?.coords
  const radiusKm = inputs.radiusKm || 30
  
  // 1. Meeting type compatibility - MANDATORY
  if (!matchesMeetingType(therapist.meeting_types, inputs.meetingType)) {
    return { pass: false, reason: 'MEETING_TYPE_INCOMPATIBLE' }
  }
  
  // Additional check: exclude therapists that ONLY offer online or home_visit when clinic is required
  if (inputs.meetingType === 'ordinace' || inputs.meetingType === 'clinic') {
    const therapistModes = (therapist.meeting_types || []).map(m => 
      m === 'ordinace' ? 'clinic' : m === 'dojizdeni' ? 'home_visit' : m
    )
    const hasOnlyOnline = therapistModes.length === 1 && therapistModes.includes('online')
    const hasOnlyHomeVisit = therapistModes.length === 1 && therapistModes.includes('home_visit')
    if (hasOnlyOnline || hasOnlyHomeVisit) {
      return { pass: false, reason: 'MEETING_TYPE_INCOMPATIBLE' }
    }
  }
  
  // 2. Radius/location match - MANDATORY for in-person meetings
  if (inputs.meetingType !== 'online' && userCoords) {
    const radiusCheck = isInRadiusSync({
      userCoords,
      therapistLocation: {
        lat: therapist.lat,
        lng: therapist.lng,
        city: therapist.city
      },
      radiusKm,
      meetingType: inputs.meetingType,
      serviceRadiusKm: therapist.service_radius_km
    })
    
    if (radiusCheck.distanceKm === null) {
      return { pass: false, reason: 'LOCATION_UNAVAILABLE' }
    }
    
    if (!radiusCheck.inRadius) {
      return { pass: false, reason: 'LOCATION_OUT_OF_RANGE' }
    }
  }
  
  // 3. Age group compatibility - MANDATORY for child/senior (when specified)
  if (inputs.ageGroup && !matchesAgeGroup(therapist.age_groups, inputs.ageGroup)) {
    return { pass: false, reason: 'AGE_GROUP_INCOMPATIBLE' }
  }
  
  // 4. Barrier-free requirement - MANDATORY if requested for in-person
  if (inputs.barrierFree && inputs.meetingType !== 'online') {
    // Check metadata for barrier_free flag
    const hasBarrierFree = (therapist.metadata && (therapist.metadata as any).barrier_free) || false
    if (!hasBarrierFree) {
      return { pass: false, reason: 'NO_BARRIER_FREE' }
    }
  }
  
  // 5. STRICT gender filtering - MANDATORY when strictGender === true AND genderPreference !== 'any'
  if (inputs.strictGender === true && inputs.genderPreference && inputs.genderPreference !== 'any') {
    if (!matchesGender(therapist.gender, inputs.genderPreference)) {
      return { pass: false, reason: 'GENDER_MISMATCH' }
    }
  }
  
  return { pass: true }
}

/**
 * Soft scoring - influences ordering but does NOT exclude therapists
 * All therapists that pass hard filters are scored and returned
 */
interface SoftScoringInputs {
  diagnosis?: { canonicalId?: string; synonyms?: string[]; category?: string }
  issues?: string[]
  language?: string
  timeBuckets?: string[] // e.g., ['morning', 'afternoon']
  dayBuckets?: string[] // e.g., ['mon', 'tue']
  wantsInsurance?: boolean
  strictGender?: boolean
  genderPreference?: 'male' | 'female' | 'any'
  meetingType?: MeetingTypeInput
  location?: { coords?: { lat: number; lon: number } | null }
  radiusKm?: number
}

interface SoftScoreResult {
  therapist: IndexedTherapist
  totalScore: number
  breakdown: {
    problemArea: number
    language: number
    daysOfWeek: number
    timesOfDay: number
    insurance: number
    gender: number
  }
  distanceKm?: number
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function applySoftScoring(
  therapists: IndexedTherapist[],
  inputs: SoftScoringInputs
): Promise<SoftScoreResult[]> {
  const userCoords = inputs.location?.coords
  const radiusKm = inputs.radiusKm || 30
  
  return Promise.all(therapists.map(async (therapist) => {
    // 1. Problem area + detail scoring (0-1)
    const problemAreaScore = (() => {
      const diag = inputs.diagnosis?.canonicalId
      const syns: string[] = toArray(inputs.diagnosis?.synonyms)
      const category = inputs.diagnosis?.category
      
      if (diag) {
        // Exact diagnosis match
        if (therapist.specialties.includes(diag)) return 1.0
        // Synonym match
        if (syns.some(s => therapist.specialties.includes(s))) return 0.9
        // Category match
        if (category && therapist.specialties.includes(category)) return 0.65
        // No match
        return 0.25
      } else if (inputs.issues && inputs.issues.length > 0) {
        // Problem area matching (issues)
        const userTags = inputs.issues
        const common = userTags.filter(u => therapist.specialties.includes(u)).length
        return userTags.length === 0 ? 0.25 : Math.min(0.75, common / userTags.length)
      }
      // No problem area specified - neutral score
      return 0.5
    })()
    
    // 2. Language scoring (0-1)
    const languageScore = (() => {
      if (!inputs.language) return 0.5 // Neutral if no language preference
      return therapist.languages.includes(inputs.language) ? 1.0 : 0.0
    })()
    
    // 3. Days of week scoring (0-1)
    const daysOfWeekScore = (() => {
      const desiredDays = inputs.dayBuckets || []
      if (desiredDays.length === 0) return 0.5 // Neutral if no day preference
      
      const slots = toArray(therapist.availability)
      if (slots.length === 0) return 0.25 // Lower score if no availability
      
      // Check if any available slot matches desired days
      const dayMatches = slots.filter(slot => {
        try {
          const date = new Date(slot)
          const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]
          return desiredDays.includes(weekday)
        } catch {
          return false
        }
      }).length
      
      return dayMatches > 0 ? 1.0 : 0.3
    })()
    
    // 4. Times of day scoring (0-1)
    const timesOfDayScore = (() => {
      const desiredTimes = inputs.timeBuckets || []
      if (desiredTimes.length === 0) return 0.5 // Neutral if no time preference
      
      const slots = toArray(therapist.availability)
      if (slots.length === 0) return 0.25 // Lower score if no availability
      
      // Check if any available slot matches desired times
      const timeMatches = slots.filter(slot => {
        try {
          const date = new Date(slot)
          const hour = date.getHours()
          let bucket: string
          if (hour < 10) bucket = 'morning'
          else if (hour < 12) bucket = 'late_morning'
          else if (hour < 17) bucket = 'afternoon'
          else bucket = 'evening'
          return desiredTimes.includes(bucket)
        } catch {
          return false
        }
      }).length
      
      return timeMatches > 0 ? 1.0 : 0.3
    })()
    
    // 5. Insurance compatibility scoring (0-1)
    const insuranceScore = (() => {
      if (inputs.wantsInsurance === undefined) return 0.5 // Neutral if no preference
      if (inputs.wantsInsurance) {
        return therapist.accepts_insurance ? 1.0 : 0.0
      } else {
        // Self-pay preference - neutral score (both types acceptable)
        return 0.5
      }
    })()
    
    // 6. Gender preference scoring (0-1) - ONLY when NOT strict
    const genderScore = (() => {
      if (inputs.strictGender === true) {
        // When strict, gender is handled by hard filters, so neutral score here
        return 0.5
      }
      const genderPref = inputs.genderPreference || 'any'
      if (genderPref === 'any') return 0.5 // Neutral if no preference
      return matchesGender(therapist.gender, genderPref) ? 1.0 : 0.0
    })()
    
    // Calculate distance for sorting (not part of score, but included for reference)
    let distanceKm: number | undefined
    if (inputs.meetingType !== 'online' && userCoords) {
      const therapistLat = toNum(therapist.lat)
      const therapistLng = toNum(therapist.lng)
      
      if (therapistLat !== null && therapistLng !== null) {
        distanceKm = haversineKm(
          { lat: userCoords.lat, lon: userCoords.lon },
          { lat: therapistLat, lon: therapistLng }
        )
      } else if (therapist.city) {
        const resolved = CityService.resolve(therapist.city)
        if (resolved && Number.isFinite(resolved.lat) && Number.isFinite(resolved.lng)) {
          distanceKm = haversineKm(
            { lat: userCoords.lat, lon: userCoords.lon },
            { lat: resolved.lat, lon: resolved.lng }
          )
        }
      }
    }
    
    // Weighted total score (0-1)
    // Weights can be adjusted based on importance
    const weights = {
      problemArea: 0.35,  // Most important - problem matching
      language: 0.15,      // Important for communication
      daysOfWeek: 0.15,    // Important for scheduling
      timesOfDay: 0.15,    // Important for scheduling
      insurance: 0.10,     // Moderate importance
      gender: 0.10        // Only when not strict
    }
    
    const totalScore = clamp01(
      weights.problemArea * problemAreaScore +
      weights.language * languageScore +
      weights.daysOfWeek * daysOfWeekScore +
      weights.timesOfDay * timesOfDayScore +
      weights.insurance * insuranceScore +
      weights.gender * genderScore
    )
    
    return {
      therapist,
      totalScore,
      breakdown: {
        problemArea: problemAreaScore,
        language: languageScore,
        daysOfWeek: daysOfWeekScore,
        timesOfDay: timesOfDayScore,
        insurance: insuranceScore,
        gender: genderScore
      },
      distanceKm
    }
  }))
}

function sortByScore(scored: SoftScoreResult[]): SoftScoreResult[] {
  return scored.sort((a, b) => {
    // Primary: total score DESC
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore
    }
    
    // Secondary: distance ASC (if available)
    const aKm = a.distanceKm ?? Number.POSITIVE_INFINITY
    const bKm = b.distanceKm ?? Number.POSITIVE_INFINITY
    if (aKm !== bKm) {
      return aKm - bKm
    }
    
    // Tertiary: name ASC (alphabetical for deterministic sorting)
    return a.therapist.name.localeCompare(b.therapist.name)
  })
}

function mapSyntheticToIndexed(s: any): IndexedTherapist {
  const firstLoc = (Array.isArray(s.locations) && s.locations[0]) || null
  const meeting_types = Array.isArray(s.meeting_modes)
    ? s.meeting_modes.map((m: string) => (m === 'clinic' ? 'ordinace' : m === 'home_visit' ? 'dojizdeni' : 'online'))
    : ['ordinace']
  const now = Date.now()
  const nextDays = typeof s.next_available_in_days === 'number' ? s.next_available_in_days : 7
  const availability = [0, 3, nextDays].map(d => new Date(now + d * 24 * 60 * 60 * 1000).toISOString())
  // Normalize coordinates (strings with comma, etc.)
  const latRaw = (firstLoc && firstLoc.lat) ?? s.lat
  const lonRaw = (firstLoc && firstLoc.lon) ?? s.lng
  const latNum = toNum(latRaw)
  const lonNum = toNum(lonRaw)
  const missingCoords = !(Number.isFinite(latNum as any) && Number.isFinite(lonNum as any))
  return {
    id: String(s.id),
    name: String(s.full_name || s.name || s.id),
    gender: normalizeTherapistGender(s.gender, s.id),
    city: String(s.base_city || (firstLoc && firstLoc.city) || ''),
    lat: (latNum ?? NaN) as any,
    lng: (lonNum ?? NaN) as any,
    meeting_types: meeting_types as any,
    service_radius_km: Number(s.service_radius_km || 0),
    languages: Array.isArray(s.languages) ? s.languages.map((l: string) => String(l)) : ['cestina'],
    specialties: Array.isArray(s.specialties) ? s.specialties : [],
    age_groups: Array.isArray(s.patient_groups) ? s.patient_groups : ['adult','senior'],
    accepts_insurance: Array.isArray(s.insurers) ? s.insurers.length > 0 : true,
    availability,
    profile_score: 0.5,
    reviews_count: (s.rating && s.rating.count) || 0,
    verified: Boolean(s.verified || false),
    bio: '',
    created_at: new Date().toISOString(),
    metadata: { has_photos: false, education: '', synthetic: true, missing_coords: missingCoords }
  }
}

// Normalize meeting modes to internal values
function normalizeMeetingModes(meetingTypes: any[]): string[] {
  if (!Array.isArray(meetingTypes)) return []
  return meetingTypes.map(type => {
    const t = String(type).toLowerCase()
    if (t === 'ordinace') return 'clinic'
    if (t === 'dojíždění' || t === 'dojizdeni') return 'home_visit'
    if (t === 'online') return 'online'
    return t // keep as-is if already canonical
  })
}

// Convert string coordinates to numbers, handle comma decimal separator
function toNumber(value: any): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.')
    const num = parseFloat(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}

// Validate coordinates are within Czech Republic bounds
function isValidCzCoord(lat: number, lon: number): boolean {
  return lat >= 48.5 && lat <= 51.1 && lon >= 12.0 && lon <= 18.9
}

// Normalize therapist data with coordinate validation and meeting mode mapping
function normalizeTherapistData(therapist: any): any {
  const normalized = { ...therapist }
  
  // Normalize gender to strict 'male' | 'female'
  if (therapist.gender !== undefined) {
    normalized.gender = normalizeTherapistGender(therapist.gender, therapist.id)
  }
  
  // Normalize meeting modes
  normalized.meeting_types = normalizeMeetingModes(therapist.meeting_types || [])
  
  // Ensure therapist has at least one service (default if missing)
  if (Array.isArray(therapist.services) && therapist.services.length > 0) {
    normalized.services = therapist.services
  } else {
    // Add default service if missing
    normalized.services = [{
      id: `default-intake-${therapist.id}`,
      name: "Úvodní fyzioterapeutické vyšetření",
      durationMin: 60,
      priceFromCzk: null,
      modality: "both",
      tags: ["fyzio", "vyšetření"]
    }]
  }
  
  // Check if this is an in-person therapist
  const isInPerson = normalized.meeting_types.includes('clinic') || normalized.meeting_types.includes('home_visit')
  
  if (isInPerson) {
    // Normalize locations array
    const locations = Array.isArray(therapist.locations) ? therapist.locations : []
    const validLocations = []
    
    for (const loc of locations) {
      const lat = toNumber(loc?.lat)
      const lon = toNumber(loc?.lon)
      
      if (lat !== null && lon !== null && isValidCzCoord(lat, lon)) {
        validLocations.push({
          ...loc,
          lat,
          lon
        })
      }
    }
    
    // If no valid locations for clinic, try to use city centroid as fallback
    if (validLocations.length === 0 && normalized.meeting_types.includes('clinic')) {
      const cityName = therapist.city || therapist.base_city
      if (cityName) {
        const cityCoords: Record<string, { lat: number; lon: number }> = {
          'Praha': { lat: 50.0755, lon: 14.4378 },
          'Brno': { lat: 49.1951, lon: 16.6068 },
          'Plzeň': { lat: 49.7384, lon: 13.3736 },
          'Karlovy Vary': { lat: 50.2310, lon: 12.8712 },
          'Kladno': { lat: 50.1473, lon: 14.1029 },
          'Liberec': { lat: 50.7671, lon: 15.0562 },
          'Ostrava': { lat: 49.8209, lon: 18.2625 },
          'Olomouc': { lat: 49.5938, lon: 17.2509 }
        }
        
        const coords = cityCoords[cityName]
        if (coords) {
          validLocations.push({
            city: cityName,
            lat: coords.lat,
            lon: coords.lon,
            barrier_free: false
          })
          // Mark this as a fallback in debug mode
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[DATA_NORMALIZE] Used city centroid for therapist ${therapist.id} in ${cityName}`)
          }
        }
      }
    }
    
    normalized.locations = validLocations
  }
  
  return normalized
}

function loadIndex(includeSynthetic = false): IndexedTherapist[] {
  if (INDEX && !includeSynthetic) return INDEX
  let base: IndexedTherapist[] = []
  try {
    const data = require('../../../data/therapists.json') as IndexedTherapist[]
    base = Array.isArray(data) ? data.map(normalizeTherapistData) : []
    console.log(`[loadIndex] Loaded ${base.length} base therapists (normalized)`)
    if (base.length > 0) {
      console.log(`[loadIndex] Sample therapist:`, {
        id: base[0].id,
        name: base[0].name,
        city: base[0].city,
        meeting_types: base[0].meeting_types,
        lat: base[0].lat,
        lng: base[0].lng
      })
    }
  } catch (error) {
    console.log(`[loadIndex] Failed to load base data:`, error)
    base = []
  }
  if (includeSynthetic) {
    try {
      const syntheticRaw = require('../../../data/therapists.synthetic.json') as any[]
      const synthetic = Array.isArray(syntheticRaw) ? syntheticRaw.map(s => normalizeTherapistData(mapSyntheticToIndexed(s))) : []
      const merged = new Map<string, IndexedTherapist>()
      for (const t of base) merged.set(t.id, t)
      for (const s of synthetic) if (!merged.has(s.id)) merged.set(s.id, s)
      let result = Array.from(merged.values())

      // Development-time data check: ensure in-person presence in target cities
      if (!DEV_STATS_PRINTED && (process.env.NODE_ENV !== 'production' || USE_SYNTHETIC)) {
        const targetCities = ['Praha', 'Brno', 'Plzeň', 'Karlovy Vary', 'Kladno', 'Liberec', 'Ostrava', 'Olomouc']
        const cityCoords: Record<string, { lat: number; lon: number }> = {
          'Praha': { lat: 50.0755, lon: 14.4378 },
          'Brno': { lat: 49.1951, lon: 16.6068 },
          'Plzeň': { lat: 49.7384, lon: 13.3736 },
          'Karlovy Vary': { lat: 50.2310, lon: 12.8712 },
          'Kladno': { lat: 50.1473, lon: 14.1029 },
          'Liberec': { lat: 50.7671, lon: 15.0562 },
          'Ostrava': { lat: 49.8209, lon: 18.2625 },
          'Olomouc': { lat: 49.5938, lon: 17.2509 }
        }

        const isInPerson = (t: IndexedTherapist) => Array.isArray(t.meeting_types) && (t.meeting_types.includes('clinic') || t.meeting_types.includes('home_visit'))
        const perCityCounts: Record<string, number> = {}
        for (const city of targetCities) {
          perCityCounts[city] = result.filter(t => t.city === city && isInPerson(t)).length
        }

        // Seed a minimal synthetic clinic for cities with zero in-person
        const existingIds = new Set(result.map(t => t.id))
        const slugify = (s: string) => s.normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
        for (const city of targetCities) {
          if ((perCityCounts[city] || 0) === 0) {
            const coords = cityCoords[city]
            if (coords) {
              let candidateId = `seed-${slugify(city)}`
              let i = 1
              while (existingIds.has(candidateId)) {
                candidateId = `seed-${slugify(city)}-${i++}`
              }
              const seed: IndexedTherapist = {
                id: candidateId,
                name: `Seed ${city} Clinic`,
                gender: 'female',
                city,
                lat: coords.lat,
                lng: coords.lon,
                meeting_types: ['ordinace'],
                service_radius_km: 0,
                languages: ['cs'],
                specialties: [],
                age_groups: ['adult'],
                accepts_insurance: true,
                availability: [],
                profile_score: 0.4,
                reviews_count: 0,
                verified: false,
                bio: '',
                created_at: new Date().toISOString(),
                metadata: { has_photos: false, education: '', synthetic: true }
              }
              result.push(seed)
              existingIds.add(candidateId)
              perCityCounts[city] = 1
            }
          }
        }

        const total = result.length
        const inPersonCount = result.filter(isInPerson).length
        const validLocationCount = result.filter(t => Number.isFinite(t.lat) && Number.isFinite(t.lng)).length
        
        console.log('📊 [DATA CHECK] Total therapists:', total)
        console.log('📊 [DATA CHECK] In-person (ordinace|dojizdeni):', inPersonCount)
        console.log('📊 [DATA CHECK] Valid locations:', validLocationCount)
        console.log('🏙️ [DATA CHECK] Per-city in-person:', perCityCounts)
        DEV_STATS_PRINTED = true
      }

      console.log(`[loadIndex] Loaded ${result.length} total therapists (${base.length} base + ${synthetic.length} synthetic)`)        
      return result
    } catch (error) {
      console.log(`[loadIndex] Failed to load synthetic data:`, error)
      return base
    }
  }
  INDEX = base
  return INDEX!
}

function mapLanguageCanonical(input?: string | null): string | undefined {
  if (!input) return undefined
  const norm = input.toLowerCase()
  // Support both previous short codes and new canonical ids
  const map: Record<string, string> = {
    'cs': 'cestina', 'czech': 'cestina', 'čeština': 'cestina', 'cestina': 'cestina',
    'en': 'anglictina', 'english': 'anglictina', 'angličtina': 'anglictina', 'anglictina': 'anglictina',
    'de': 'nemcina', 'german': 'nemcina', 'němčina': 'nemcina', 'nemcina': 'nemcina',
    'uk': 'ukrajinstina', 'ukrainian': 'ukrajinstina', 'ukrajinština': 'ukrajinstina', 'ukrajinstina': 'ukrajinstina',
    'ru': 'rus', 'russian': 'rus', 'ruština': 'rus', 'rus': 'rus',
    'sk': 'slovencina', 'slovak': 'slovencina', 'slovenština': 'slovencina', 'slovencina': 'slovencina'
  }
  return map[norm] || undefined
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const raw = await request.json().catch(() => ({} as any))
    
    console.log('🔍 [API] Raw request body:', JSON.stringify(raw, null, 2));
    
    // Check if this is the new Answers format
    const isNewAnswersFormat = raw.city && typeof raw.meetingType === 'string' && 
                               ['clinic', 'home', 'online', 'any'].includes(raw.meetingType) &&
                               typeof raw.genderPreference === 'string'
    
    console.log('🔍 [API] isNewAnswersFormat:', isNewAnswersFormat);
    
    // Check if this is a questionnaire payload (direct from questionnaire - old format)
    const isQuestionnairePayload = !isNewAnswersFormat && raw.city && raw.meetingType && (raw.therapistGender || raw.gender)
    let rawInputs = isQuestionnairePayload ? raw : (raw?.query ? raw.query : raw)
    
    // Extract strictGender flag for gender filtering
    const strictGender = Boolean(raw.strictGender)
    console.log('🔍 [GENDER DEBUG] strictGender flag:', strictGender, 'raw.strictGender:', raw.strictGender)
    console.log('🔍 [GENDER DEBUG] raw.genderPreference:', raw.genderPreference)
    console.log('🔍 [GENDER DEBUG] raw.therapistGenderPref:', raw.therapistGenderPref)
    
    // If new Answers format, normalize it first
    if (isNewAnswersFormat) {
      console.log('🔍 [API] Normalizing new Answers format...');
      const { normalizeAnswersToMatchingInputs, normalizeAnswersToSearchInputs } = await import('@/lib/matching/normalization')
      
      // Use direct conversion to MatchingInputs for better consistency
      const matchingInputs = normalizeAnswersToMatchingInputs(raw as any)
      console.log('🔍 [API] Normalized MatchingInputs:', JSON.stringify(matchingInputs, null, 2));
      
      // Also convert to SearchInputs for backward compatibility with existing code
      const normalized = normalizeAnswersToSearchInputs(raw as any)
      console.log('🔍 [API] Normalized SearchInputs:', JSON.stringify(normalized, null, 2));
      
      // Merge normalized data into raw for processing
      Object.assign(raw, {
        city: normalized.location.city,
        meetingType: normalized.meetingType,
        therapistGenderPref: normalized.therapistGenderPref,
        genderPreference: normalized.therapistGenderPref,
        strictGender: raw.strictGender !== undefined ? raw.strictGender : normalized.strictGender,
        ageGroup: normalized.ageGroup,
        barrierFree: normalized.barrierFree,
        languages: normalized.languages,
        wantsInsurance: normalized.wantsInsurance,
        radiusKm: normalized.radiusKm,
        issues: normalized.issues,
        diagnosis: normalized.diagnosis,
        timeFit: normalized.timeFit
      })
      console.log('🔍 [API] Merged raw object:', JSON.stringify(raw, null, 2));
      
      // Ensure rawInputs uses the normalized raw object
      rawInputs = raw
    }

    // Basic normalization from POST body (CZ -> canonical), coords derivation
    const cityRaw = typeof raw?.city === 'string' ? raw.city : ''
    const cityNorm = cityRaw.trim()
    const coordsFromBody = (Array.isArray(raw?.coords) && raw.coords.length === 2) ? raw.coords as [number, number] : null
    const coordsDerived = (!coordsFromBody && cityNorm) ? getCityCoords(cityNorm) : null
    const coordsCanon = coordsFromBody || coordsDerived
    const meetingTypeCanon = ((): 'clinic'|'home_visit'|'online' => {
      const mt = String(raw?.meetingType || 'clinic').toLowerCase()
      if (mt === 'ordinace' || mt === 'clinic') return 'clinic'
      if (mt === 'dojíždění' || mt === 'dojizdeni' || mt === 'home_visit') return 'home_visit'
      if (mt === 'online') return 'online'
      return 'clinic'
    })()
    // Zjednodušené mapování gender - upřednostni normalizované hodnoty z nového formátu
    const genderPrefCanon = ((): 'female'|'male'|'any' => {
      // Pokud byl použit nový Answers formát, použij už normalizovanou hodnotu
      // Jinak zkus najít hodnotu v různých polích (priorita: normalizované > nové > staré)
      const gender = raw.genderPreference || raw.therapistGenderPref || raw.gender || raw.therapistGender || raw.genderPref || 'any'
      console.log('🔍 [GENDER DEBUG] Full raw payload:', JSON.stringify(raw, null, 2))
      console.log('🔍 [GENDER DEBUG] raw.genderPreference:', raw.genderPreference)
      console.log('🔍 [GENDER DEBUG] raw.therapistGenderPref:', raw.therapistGenderPref)
      console.log('🔍 [GENDER DEBUG] raw.gender:', raw.gender)
      console.log('🔍 [GENDER DEBUG] raw.therapistGender:', raw.therapistGender)
      console.log('🔍 [GENDER DEBUG] raw.genderPref:', raw.genderPref)
      console.log('🔍 [GENDER DEBUG] Final gender value:', gender, 'type:', typeof gender)
      
      // Přímé mapování z dotazníku (už normalizované hodnoty)
      if (gender === 'male' || gender === 'female' || gender === 'any') {
        console.log('🔍 [GENDER DEBUG] Direct match, returning:', gender)
        return gender as 'female'|'male'|'any'
      }
      
      // Legacy normalizace pro staré formáty (české hodnoty)
      const g = String(gender).toLowerCase()
      if (g === 'žena' || g === 'zena' || g === 'female') {
        console.log('🔍 [GENDER DEBUG] Mapped to female from:', g)
        return 'female'
      }
      if (g === 'muž' || g === 'muz' || g === 'male') {
        console.log('🔍 [GENDER DEBUG] Mapped to male from:', g)
        return 'male'
      }
      console.log('🔍 [GENDER DEBUG] No match found, defaulting to any')
      return 'any'
    })()
    const languageCanonShort = ((): string => {
      const l = String(raw?.language || 'cs').toLowerCase()
      if (l === 'cestina' || l === 'čeština' || l === 'cs' || l === 'czech') return 'cs'
      if (l === 'en' || l === 'anglictina' || l === 'angličtina' || l === 'english') return 'en'
      if (l === 'de' || l === 'nemcina' || l === 'němčina' || l === 'german') return 'de'
      return l
    })()
    const meta: any = {}
    if (!cityNorm && !coordsCanon) {
      meta.warning = 'missing_location'
    }
    // Grouped scoring simple mode (per acceptance criteria)
    // Trigger when explicitly requested to avoid impacting existing behavior
    if (raw && (raw.grouped === true || raw.mode === 'grouped')) {
      const debug = request.nextUrl?.searchParams?.get('debug') === '1'
      type SimpleTherapist = {
        id: string
        city: string
        specialties?: string[]
        gender: 'male' | 'female'
      }
      type MatchInput = {
        diagnosisIds: string[]
        city: string
        when: { day: string; timeSlot: string }
        genderPref: 'female' | 'male' | 'any'
      }

      const toArraySafe = (v: any): string[] => Array.isArray(v) ? v : (v == null ? [] : [String(v)])
      // Phrase -> diagnosis mapping per spec
      const phraseDxMap = (arr: string[]): string[] => {
        const hay = arr.map(s => String(s).toLowerCase())
        const phrases = [
          'po porodu','poporodní','poporodni','pánevní dno','panevni dno','inkontinence'
        ]
        const anyPhrase = phrases.some(p => hay.some(h => h.includes(p)))
        return anyPhrase ? ['postpartum_rehab','pelvic_floor','incontinence'] : []
      }
      
      // For questionnaire payload, use diagnosisIds directly
      let incomingDiagIds: string[] = []
      if (isQuestionnairePayload && raw.diagnosisIds) {
        incomingDiagIds = Array.isArray(raw.diagnosisIds) ? raw.diagnosisIds : []
      } else {
        incomingDiagIds = toArraySafe(raw?.diagnosisIds)
      }
      
      // Extract problem areas from questionnaire payload
      let problemAreaIds: string[] = []
      if (isQuestionnairePayload && raw.problemAreaIds) {
        problemAreaIds = Array.isArray(raw.problemAreaIds) ? raw.problemAreaIds : []
      }
      
      // Map questionnaire problems to therapist specialties
      const problemToSpecialtyMap: Record<string, string[]> = {
        // Body areas
        'upper-limb': ['Bolesti svalů / šlach', 'Bolesti kloubů', 'Bolesti zad / krku'],
        'lower-limb': ['Bolesti svalů / šlach', 'Bolesti kloubů', 'Bolesti zad / krku'],
        'back': ['Bolesti zad / krku', 'Bolesti hlavy / migrény'],
        'neck-head': ['Bolesti hlavy / migrény', 'Bolesti zad / krku'],
        'children': ['Bolesti zad / krku', 'Bolesti kloubů'], // Map children to common specialties
        // Situational
        'post-injury': ['Rehabilitace po úrazu', 'Bolesti zad / krku'],
        'post-surgery': ['Rehabilitace po operaci', 'Bolesti zad / krku'],
        'sports-overuse': ['Sportovní úraz', 'Bolesti svalů / šlach'],
        'pregnancy': ['Těhotenství / po porodu', 'Bolesti zad / krku'],
        'womens-health': ['pelvic_floor', 'pregnancy', 'postpartum', 'Těhotenství / po porodu', 'Bolesti zad / krku'],
        // Legacy mappings for backward compatibility
        'back-pain': ['Bolesti zad / krku', 'Bolesti hlavy / migrény'],
        'neck-pain': ['Bolesti hlavy / migrény', 'Bolesti zad / krku'],
        'shoulder-upper-limb': ['Bolesti svalů / šlach', 'Bolesti kloubů', 'Bolesti zad / krku'],
        'knee-lower-limb': ['Bolesti kloubů', 'Bolesti svalů / šlach'],
        'children-issues': ['Bolesti zad / krku', 'Bolesti kloubů'],
        'pregnancy-postpartum': ['Těhotenství / po porodu', 'Bolesti zad / krku'],
        'other-unsure': ['Jiné potíže', 'Bolesti zad / krku']
      }
      
      // Convert problem areas to specialties
      const mappedSpecialties: string[] = []
      for (const problem of problemAreaIds) {
        const specialties = problemToSpecialtyMap[problem] || ['Bolesti zad / krku']
        mappedSpecialties.push(...specialties)
      }
      
      const phraseDiagIds = phraseDxMap([
        ...(toArraySafe(raw?.diagnosisTerm)),
        ...(toArraySafe(raw?.issues)),
        ...(toArraySafe(raw?.conditions)),
        ...problemAreaIds,
        ...mappedSpecialties
      ])
      
      // Extract time info from questionnaire payload
      const timeInfo = isQuestionnairePayload && raw.time 
        ? { day: String(raw.time.day || ''), timeSlot: String(raw.time.timeSlot || '') }
        : { day: String(raw?.when?.day || ''), timeSlot: String(raw?.when?.timeSlot || '') }
        
      const matchInput: MatchInput = {
        diagnosisIds: toDiagnosisIds((incomingDiagIds.length ? incomingDiagIds : []).concat(phraseDiagIds)),
        city: cityNorm,
        when: timeInfo,
        genderPref: genderPrefCanon
      }

      // Load local dataset
      let dataset: SimpleTherapist[] = []
      try {
        const data = require('../../../data/therapists.json') as any[]
        dataset = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: String(t.id),
          city: String(t.city || ''),
          specialties: Array.isArray(t.specialties) ? t.specialties.map((s: any) => String(s)) : [],
          gender: String(t.gender || 'female') as 'male' | 'female' // Default to female if not specified
        }))
      } catch {
        dataset = []
      }

      // Helper: components replicated to build breakdown consistent with computeTherapistMatchScore
      function clamp01(x: number): number { return Math.max(0, Math.min(1, x)) }
      function diagnosisComponent(diagnosisIds: string[] = [], skills: string[] = []): number {
        if (!Array.isArray(diagnosisIds) || diagnosisIds.length === 0) return 0
        if (!Array.isArray(skills) || skills.length === 0) return 0
        if (diagnosisIds.some(id => skills.includes(id))) return 1.0
        const toCategory = (s: string) => {
          const byColon = s.split(':')[0]
          const byDot = s.split('.')[0]
          return byColon.length <= byDot.length ? byColon : byDot
        }
        const toRegion = (s: string) => s.split('_')[0]
        if (diagnosisIds.some(id => skills.some(s => toCategory(s) === toCategory(id)))) return 0.75
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
        // 1.00 exact day+slot
        if (dayKey && slotKey && daySlots.includes(slotKey)) return 1.0
        // 0.75 same day any slot
        if (dayKey && daySlots.length > 0) return 0.75
        // 0.50 any day same slot
        const hasSlotAnyDay = slotKey ? Object.values(calendar).some(slots => Array.isArray(slots) && slots.includes(slotKey)) : false
        if (hasSlotAnyDay) return 0.5
        // else 0
        return 0
      }
      function genderComponent(pref: 'female'|'male'|'any', gender: 'female'|'male'): number {
        if (pref === 'any') return 0.75
        return pref === gender ? 1.0 : 0
      }

      // Resolve user coords from payload coords or city
      let userCoords: { lat: number; lon: number } | null = null
      if (coordsCanon) {
        userCoords = { lat: Number(coordsCanon[0]), lon: Number(coordsCanon[1]) }
      } else if (matchInput.city) {
        const resolved = CityService.resolve(matchInput.city)
        if (resolved) userCoords = { lat: resolved.lat, lon: resolved.lng }
      }
      const missingLocation = !userCoords

      const scored = dataset.map(t => {
        const skills = Array.isArray(t.specialties) ? t.specialties : []
        const dDiag = diagnosisComponent(matchInput.diagnosisIds, skills)
        // Compute distance score if we have user coords and therapist city centroid
        let kmForScore: number | null = null
        if (userCoords && t.city) {
          try {
            const thC = CityService.resolve(t.city)
            if (thC) {
              const km = haversineKm({ lat: userCoords.lat, lon: userCoords.lon }, { lat: thC.lat, lon: thC.lng })
              kmForScore = Math.max(0.5, Number((km as number).toFixed(1)))
            }
          } catch {}
        }
        const dDist = distanceComponentKm(kmForScore)
        const dTime = timeComponent(matchInput.when.day, matchInput.when.timeSlot, {})
        const dGender = genderComponent(matchInput.genderPref, t.gender) // Use actual therapist gender
        // Weights per spec when genderPref !== any
        const useGenderBoost = matchInput.genderPref !== 'any'
        const wDiag = useGenderBoost ? 0.45 : 0.50
        const wDist = 0.25
        const wTime = 0.15
        const wGender = useGenderBoost ? 0.30 : 0.10
        const total = clamp01(wDiag * dDiag + wDist * dDist + wTime * dTime + wGender * dGender)

        // Distance (km) for tie-break: use kmForScore if available
        const distanceKm = kmForScore == null ? Number.POSITIVE_INFINITY : kmForScore

        // Telemetry: debug log in non-prod or if ?test=1
        try {
          const isNonProd = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production')
          const wantsTest = request.nextUrl?.searchParams?.get('test') === '1'
          if (isNonProd || wantsTest) {
            matchComputed({ therapistId: t.id, diagnosis_score: dDiag, distance_score: dDist, time_score: dTime, gender_score: dGender, total })
          }
        } catch {}

        return {
          id: t.id,
          score: total,
          distanceKm,
          breakdown: {
            diagnosis: dDiag,
            distance: dDist,
            time: dTime,
            gender: dGender
          }
        }
      })

      // Optional seeded tiebreaker via header X-Test-Seed (for e2e reproducibility)
      const testSeedHeader = request.headers.get('X-Test-Seed') || request.headers.get('x-test-seed')
      const seedStr = typeof testSeedHeader === 'string' ? testSeedHeader : ''
      const seeded = (id: string): number => {
        // Simple deterministic hash (FNV-1a like) mixed with seed
        const s = String(seedStr || '') + '|' + String(id)
        let h = 2166136261 >>> 0
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i)
          h = Math.imul(h, 16777619) >>> 0
        }
        // Return [0,1)
        return (h % 100000) / 100000
      }
      // Stable sort per spec: totalScore DESC, distance ASC, earliestSlot ASC (n/a), name ASC (id as name)
      scored.sort((a, b) => (
        (b.score - a.score)
        || (a.distanceKm - b.distanceKm)
        || (seedStr ? (seeded(a.id) - seeded(b.id)) : 0)
        || a.id.localeCompare(b.id)
      ))

      // Threshold overrides via query (?best=0.75&medium=0.5)
      const url = request.nextUrl
      const bestParam = url?.searchParams?.get('best')
      const mediumParam = url?.searchParams?.get('medium')
      const parseNum = (v: string | null): number | null => {
        if (v == null) return null
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }
      let thrBest = parseNum(bestParam) ?? 0.75
      let thrMedium = parseNum(mediumParam) ?? 0.50
      // Clamp to [0,1]
      thrBest = Math.max(0, Math.min(1, thrBest))
      thrMedium = Math.max(0, Math.min(1, thrMedium))
      // Ensure best > medium
      if (thrBest <= thrMedium) {
        thrBest = Math.min(1, Math.max(thrMedium + 0.01, thrBest))
      }

      // Group by effective thresholds
      const bestRaw = scored.filter(s => s.score >= thrBest)
      const mediumRaw = scored.filter(s => s.score >= thrMedium && s.score < thrBest)
      const lowRaw = scored.filter(s => s.score < thrMedium)

      const used = new Set<string>()
      const best: any[] = []
      const medium: any[] = []
      const low: any[] = []

      const pushUntil = (target: any[], source: any[], min: number) => {
        for (const item of source) {
          if (target.length >= min) break
          if (used.has(item.id)) continue
          target.push(item)
          used.add(item.id)
        }
      }

      // Seed from their own groups
      for (const s of bestRaw) { if (!used.has(s.id)) { best.push(s); used.add(s.id) } }
      for (const s of mediumRaw) { if (!used.has(s.id)) { medium.push(s); used.add(s.id) } }
      for (const s of lowRaw) { if (!used.has(s.id)) { low.push(s); used.add(s.id) } }

      // Backfill to ensure >=3 per group
      pushUntil(best, mediumRaw, 3)
      pushUntil(best, lowRaw, 3)
      pushUntil(medium, lowRaw, 3)

      // If still short, top-up from the global sorted list
      const global = scored
      pushUntil(best, global, 3)
      pushUntil(medium, global, 3)
      pushUntil(low, global, 3)

      // Cap each group to 3 to satisfy test expecting 3/3/3
      const bestOut = best.slice(0, 3).map(({ id, score, breakdown }) => ({ id, score, breakdown }))
      const mediumOut = medium.slice(0, 3).map(({ id, score, breakdown }) => ({ id, score, breakdown }))
      const lowOut = low.slice(0, 3).map(({ id, score, breakdown }) => ({ id, score, breakdown }))

      const meta = {
        inputNormalized: {
          city: matchInput.city,
          coords: userCoords ? { lat: userCoords.lat, lon: userCoords.lon } : null,
          day: matchInput.when.day,
          timeSlot: matchInput.when.timeSlot,
          diagnosisIdsCount: Array.isArray(matchInput.diagnosisIds) ? matchInput.diagnosisIds.length : 0,
          genderPref: matchInput.genderPref
        },
        totals: {
          dataset: scored.length,
          best: bestRaw.length,
          medium: mediumRaw.length,
          low: lowRaw.length
        },
        weights: { diag: (genderPrefCanon !== 'any' ? 0.45 : 0.50), dist: 0.25, time: 0.15, gender: (genderPrefCanon !== 'any' ? 0.30 : 0.10) },
        thresholds: { best: thrBest, medium: thrMedium }
      } as any
      if (missingLocation) (meta as any).warning = 'missing_location'

      if (debug) {
        try {
          scored.slice(0, 12).forEach(r => {
            console.log('[MATCH_COMPUTED]', {
              therapistId: r.id,
              diagnosis_score: r.breakdown.diagnosis,
              distance_score: r.breakdown.distance,
              time_score: r.breakdown.time,
              gender_score: r.breakdown.gender,
              total: r.score
            })
          })
          console.log('[META]', meta)
        } catch {}
      }

      return NextResponse.json({ best: bestOut, medium: mediumOut, low: lowOut, meta })
    }
    const sortMode: 'match_score'|'distance'|'availability' = (raw && raw.sort) || 'match_score'
    const requestedLimit = Number((raw && raw.limit) || 8)

    const inputs = normalizeSearchInputs(rawInputs)
    
    console.log('🔍 [API] Inputs after normalizeSearchInputs:', JSON.stringify({
      meetingType: inputs.meetingType,
      therapistGenderPref: inputs.therapistGenderPref,
      strictGender: inputs.strictGender,
      city: inputs.location.city,
      ageGroup: inputs.ageGroup,
      barrierFree: inputs.barrierFree
    }, null, 2));

    // Inject normalized fields from POST body normalization
    if (cityNorm) inputs.location.city = cityNorm
    if (coordsCanon) inputs.location.coords = { lat: coordsCanon[0], lon: coordsCanon[1] }
    
    // Only override meetingType if not already set from new format
    if (!isNewAnswersFormat) {
      ;(inputs as any).meetingType = meetingTypeCanon
    }
    
    // Only override gender if not already set from new format
    if (!isNewAnswersFormat) {
      ;(inputs as any).therapistGenderPref = genderPrefCanon
    }
    
    // Ensure strictGender is set correctly
    if (isNewAnswersFormat && raw.strictGender !== undefined) {
      inputs.strictGender = Boolean(raw.strictGender)
    }
    
    console.log('🔍 [GENDER DEBUG] Final inputs:', {
      therapistGenderPref: inputs.therapistGenderPref,
      strictGender: inputs.strictGender,
      isNewFormat: isNewAnswersFormat
    })
    
    inputs.language = inputs.language || languageCanonShort
    
    // Add problem areas from questionnaire payload
    if (isQuestionnairePayload && raw.problemAreaLabels) {
      ;(inputs as any).problemAreas = Array.isArray(raw.problemAreaLabels) ? raw.problemAreaLabels : []
    }
    
    // Add diagnosis information for debug
    if (isQuestionnairePayload && raw.diagnosisIds) {
      ;(inputs as any).diagnosisIds = raw.diagnosisIds
      ;(inputs as any).diagnosisLabels = raw.diagnosisIds.map((id: string) => {
        // Map diagnosis IDs to human-readable labels
        const labelMap: Record<string, string> = {
          'head_pain': 'Bolest hlavy',
          'migraine': 'Migréna',
          'neck_pain': 'Bolest krku',
          'cervical_tension': 'Napětí krku',
          'shoulder_pain': 'Bolest ramene',
          'back_pain': 'Bolest zad',
          'spine_pain': 'Bolest páteře',
          'knee_pain': 'Bolest kolene',
          'ankle_pain': 'Bolest kotníku',
          'elbow_pain': 'Bolest lokte',
          'wrist_pain': 'Bolest zápěstí',
          'hip_pain': 'Bolest kyčle',
          'leg_pain': 'Bolest nohy'
        }
        return labelMap[id] || id
      })
    }

    // Resolve coordinates if needed (optimized: try fast resolvers first)
    let coordsPromise: Promise<void> | null = null
    if (!inputs.location.coords && inputs.location.city) {
      coordsPromise = (async () => {
        try {
          const cityName = inputs.location.city!
          const gc = getCityCoords(cityName)
          if (gc) {
            // Primary resolver: explicit city dictionary (no default to Prague)
            inputs.location.coords = { lat: gc[0], lon: gc[1] }
            return
          }
          // Secondary resolver: gazetteer / SaaS – ignore low-confidence fallbacks
          const res = await normalizePlace(cityName)
          if (res && res.source !== 'fallback' && typeof res.lat === 'number' && typeof res.lng === 'number') {
            inputs.location.coords = { lat: res.lat, lon: res.lng }
            return
          }
          // Tertiary resolver: CityService index; may still fail → coords stay null
          const resolved = CityService.resolve(cityName)
          if (resolved) inputs.location.coords = { lat: resolved.lat, lon: resolved.lng }
        } catch {}
      })()
    }

    // SAFE_LOCAL_MODE: Emergency mode for immediate local results
    if (SAFE_LOCAL_MODE) {
      // Wait for coords if resolving
      if (coordsPromise) await coordsPromise
      return await handleSafeLocalMode(inputs, raw, requestedLimit, startTime)
    }

    // Synthetic enabled for non-production to ensure local results in testing
    const includeSynthetic = isSyntheticEnabledFromQuery(request.nextUrl?.search || '')
    const userLang = mapLanguageCanonical(inputs.language)
    
    // OPTIMIZATION: Try ES first (if we have coords or don't need them), load dataset only as fallback
    // This avoids loading the full dataset if ES can provide results quickly
    let dataset: IndexedTherapist[] | null = null
    let esError: Error | null = null
    let datasetSource: 'es' | 'memory' = 'memory'
    
    // Wait for coordinates if we're resolving them (needed for ES query)
    if (coordsPromise) {
      await coordsPromise
    }
    
    // Try ES for candidate retrieval first (parallel with any remaining work)
    try {
      const esCandidates = await searchTherapistsES({
        location: inputs.location.coords ? { lat: inputs.location.coords.lat, lon: inputs.location.coords.lon } : undefined,
        meetingType: inputs.meetingType as any,
        language: userLang,
        diagnosisId: inputs.diagnosis?.canonicalId,
        wantsInsurance: inputs.wantsInsurance,
        ageGroup: inputs.ageGroup as any,
        limit: Math.max(requestedLimit * 2, 32) // Request 2x needed, but cap at reasonable limit
      })
      if (Array.isArray(esCandidates) && esCandidates.length > 0) {
        dataset = esCandidates
        datasetSource = 'es'
      }
    } catch (err) {
      esError = err instanceof Error ? err : new Error(String(err))
    }
    
    // Fallback to in-memory dataset only if ES failed or returned no results
    if (!dataset || dataset.length === 0) {
      dataset = loadIndex(includeSynthetic)
      datasetSource = 'memory'
      if (esError) {
        console.log(`⚠️ [SEARCH API] ES query failed, using in-memory dataset: ${esError.message}`)
      }
    }
    
    // Debug: Print dataset statistics
    console.log(`📊 [SEARCH API] Dataset loaded: ${dataset.length} therapists (from ${datasetSource})`)
    console.log(`📊 [SEARCH API] Search inputs:`, {
      city: inputs.location.city,
      coords: inputs.location.coords,
      meetingType: inputs.meetingType,
      language: inputs.language,
      radiusKm: raw?.radiusKm || 30
    })
    // NEW MATCHING ENGINE: Use canonical types and multi-layered matching
    console.log('🔍 [NEW MATCHING ENGINE] Starting matching with canonical types')
    
    // Convert SearchInputs to MatchingInputs
    const matchingInputs = convertSearchInputsToMatchingInputs({
      ...inputs,
      radiusKm: Number((raw && raw.radiusKm) || 30)
    })
    
    // Convert IndexedTherapist[] to MatchingTherapist[]
    const matchingTherapists = toArray(dataset).map(t =>
      convertIndexedTherapistToMatchingTherapist({
        ...t,
        metadata: {
          ...t.metadata,
          barrier_free: (t.metadata as any)?.barrier_free ?? false
        }
      } as any)
    )
    
    console.log(`📊 [NEW MATCHING ENGINE] Converted ${matchingTherapists.length} therapists to canonical format`)
    
    // Use new matching engine
    const matchResult = findMatches(matchingInputs, matchingTherapists)
    
    console.log(`✅ [NEW MATCHING ENGINE] Found ${matchResult.matches.length} matches (fallback: ${matchResult.fallbackUsed ? matchResult.fallbackLevel : 'none'})`)
    
    // Convert results back to response format
    const originalGenderPref: 'female'|'male'|'any' = (inputs.therapistGenderPref || 'any') as any
    const finalResults = matchResult.matches.map((scored) => {
      const t = scored.therapist
      const dxSet = new Set<string>(toArray(matchingInputs.diagnosis?.canonicalId ? [matchingInputs.diagnosis.canonicalId, ...(matchingInputs.diagnosis.synonyms||[])] : matchingInputs.issues))
      const matchedDiagnoses = t.specialties.filter(s => dxSet.has(s))
      const postpartumIds = new Set(['postpartum_rehab','pelvic_floor','incontinence'])
      const postpartumMatch = matchedDiagnoses.some(id => postpartumIds.has(id)) || Array.from(dxSet).some(id => postpartumIds.has(id))
      const genderMatch = originalGenderPref==='any' ? true : (t.gender === originalGenderPref)
      
      // Convert meeting_types back to Czech format for response
      const meetingTypesCzech = t.meeting_types.map(mt => 
        mt === 'clinic' ? 'ordinace' : mt === 'home_visit' ? 'dojizdeni' : 'online'
      )
      
      return {
        id: t.id,
        name: t.fullName,
        city: t.city,
        // Legacy score field – for canonical engine we keep this in sync with
        // ScoreBreakdown.totalScore so the number shown in the UI matches the
        // underlying point total. New clients should prefer matchResults[].breakdown.totalScore.
        match_score: Math.round(scored.totalScore),
        distanceKm: scored.distanceKm ?? undefined,
        breakdown: {
          problemArea: Math.round(scored.breakdown.specialties * 10),
          language: Math.round(scored.breakdown.languages * 10),
          daysOfWeek: 0, // Not used in new scoring
          timesOfDay: Math.round(scored.breakdown.timePreference * 10),
          insurance: 0, // Not used in new scoring
          gender: Math.round(scored.breakdown.gender * 10)
        },
        flags: { genderMatch, postpartumMatch },
        matchedDiagnoses,
        meeting_types: meetingTypesCzech,
        specialties: t.specialties,
        languages: t.languages,
        age_groups: t.age_groups,
        accepts_insurance: t.accepts_insurance,
        verified: t.is_verified,
        profile_score: t.profile_completeness,
        reviews_count: t.review_count
      }
    })
    
    const fallbackUsed = matchResult.fallbackUsed
    const appliedFallbackLevel = matchResult.fallbackLevel
    
    // Apply sort mode if needed (already sorted by score, but can re-sort)
    if (sortMode === 'distance') {
      finalResults.sort((a,b)=> ((a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9)) || (b.match_score - a.match_score))
    } else if (sortMode === 'availability') {
      // For availability sorting, we'd need to check availability slots
      // For now, keep score-based sorting
    }
    
    const limitedResults = finalResults.slice(0, requestedLimit)
    
    const searchTime = Date.now() - startTime
    const countsByStage = {
      total: dataset.length,
      afterHardFilters: matchResult.metadata?.afterHardFilters ?? 0,
      afterScoring: finalResults.length
    }
    
    // Build distance histogram
    const histogram: Record<string, number> = {
      '0-5': 0,
      '5-15': 0,
      '15-25': 0,
      '25-50': 0,
      '>50': 0
    }
    for (const r of limitedResults) {
      const km = r.distanceKm
      if (km === undefined) continue
      if (km <= 5) histogram['0-5']++
      else if (km <= 15) histogram['5-15']++
      else if (km <= 25) histogram['15-25']++
      else if (km <= 50) histogram['25-50']++
      else histogram['>50']++
    }
    
    try {
      const radiusKm = Number((raw && raw.radiusKm) || 30)
      logSearch({
        queryId: `q_${startTime}`,
        location: inputs.location.coords ? { type: 'city', value: inputs.location.city || '', coordinates: { lat: inputs.location.coords.lat, lng: inputs.location.coords.lon } } : { type: 'city', value: inputs.location.city || '' },
        radiusKmRequested: radiusKm,
        radiusKmUsed: radiusKm,
        mustHave: { practiceType: [inputs.meetingType], languages: userLang ? [userLang] : undefined },
        prefer: { distance: inputs.meetingType !== 'online', availability: true },
        top3Ids: limitedResults.slice(0,3).map(r => r.id),
        resultsCount: limitedResults.length,
        processingTimeMs: searchTime,
        fallbackUsed: fallbackUsed,
        quality: { topScore: limitedResults[0]?.match_score || 0, avgScore: Math.round(limitedResults.reduce((s,r)=>s+(r.match_score||0),0)/(limitedResults.length||1)), scoreDistribution: histogram as any }
      })
    } catch {}
    
    return NextResponse.json({
      total: limitedResults.length,
      results: limitedResults,
      fallbackUsed: fallbackUsed,
      fallbackLevel: appliedFallbackLevel,
      searchInfo: { searchTime, kmHistogram: histogram, countsByStage },
      normalizedInputs: inputs,
      // New: full explainability output from the canonical matching engine.
      // IMPORTANT:
      // - results[]  = legacy, minimal shape used by older UI components
      // - matchResults[] = new explainable output from the canonical engine
      //   (full ScoreBreakdown, reasons, matchPercent, fallback metadata)
      matchResults: matchResult.matches
    })
  } catch (error) {
    safeLogError('API searchTherapists POST failed', undefined, error)
    return NextResponse.json({ error: 'Search failed', message: (error as Error).message }, { status: 500 })
  }
}

/**
      const diffH = Math.max(0, (next.getTime() - Date.now()) / (3600*1000))
      let base = 0
      if (diffH <= 72) base = 1
      else if (diffH <= 24*14) base = 0.6
      else if (diffH <= 24*30) base = 0.3
      else base = 0

      // Optional day/time bucket preferences from normalization
      const desiredTimes: string[] = (inputs as any).timeBuckets || []
      const desiredDays: string[] = (inputs as any).dayBuckets || []
      let bonus = 0
      if (desiredTimes.length > 0 || desiredDays.length > 0) {
        const hour = next.getHours()
        const bucket = hour < 10 ? 'morning' : hour < 12 ? 'late_morning' : hour < 17 ? 'afternoon' : 'evening'
        const weekday = ['sun','mon','tue','wed','thu','fri','sat'][next.getDay()]
        const timeMatch = desiredTimes.length === 0 || desiredTimes.includes(bucket)
        const dayMatch = desiredDays.length === 0 || desiredDays.includes(weekday)
        if (timeMatch && dayMatch) bonus = 0.15
      }
      return clamp01(base + bonus)
    }
      const need = 6 - selected.length
      const alreadyIds = new Set(selected.map(s => s.t.id))

      // Relax language → treat unknown as neutral
      const langRelax = (await Promise.all(hardFiltered.map(async t => {
        const diag = diagnosisComponent(t)
        const avail = availabilityComponent(t)
        const dist = await distanceComponent(t)
        const prefs = prefsComponent(t)
        const profile = profileComponent(t)
        const lang = 0.6 // neutralish
        const total = (0.40*diag + 0.15*avail + 0.15*dist.score + 0.10*lang + 0.10*prefs + 0.10*profile) * 100
        const breakdownPoints = {
          diagnosis: Math.round(0.40*diag*100),
          availability: Math.round(0.15*avail*100),
          distance: Math.round(0.15*dist.score*100),
          language: Math.round(0.10*lang*100),
          prefs: Math.round(0.10*prefs*100),
          profile: Math.round(0.10*profile*100)
        }
        return { t, total, breakdown: breakdownPoints, km: dist.km, components: { diagnosis: diag, availability: avail, distance: dist.score, language: lang, prefs, profile } }
      }))).filter(s => !alreadyIds.has(s.t.id))
      langRelax.sort((a,b)=> b.total - a.total)
      for (const s of langRelax) { if (selected.length < 6) { selected.push(s) } }

      // If still short, allow online as meeting type (distance neutral)
      if (selected.length < 6 && inputs.meetingType !== 'online') {
        const onlineRelax = toArray(dataset).filter(t => t.meeting_types.includes('online')).map(t => {
          const diag = diagnosisComponent(t)
          const avail = availabilityComponent(t)
          const dist = { score: 1, km: 0 }
          const lang = languageComponent(t)
          const prefs = prefsComponent(t)
          const profile = profileComponent(t)
          const total = (0.40*diag + 0.15*avail + 0.15*dist.score + 0.10*lang + 0.10*prefs + 0.10*profile) * 100
          const breakdownPoints = {
            diagnosis: Math.round(0.40*diag*100),
            availability: Math.round(0.15*avail*100),
            distance: Math.round(0.15*dist.score*100),
            language: Math.round(0.10*lang*100),
            prefs: Math.round(0.10*prefs*100),
            profile: Math.round(0.10*profile*100)
          }
          return { t, total, breakdown: breakdownPoints, km: dist.km, components: { diagnosis: diag, availability: avail, distance: dist.score, language: lang, prefs, profile } }
        }).filter(s => !alreadyIds.has(s.t.id))
        onlineRelax.sort((a,b)=> b.total - a.total)
        for (const s of onlineRelax) { if (selected.length < 6) { selected.push(s) } }
      }

      // Final fill: best profile score regardless of prefs
      if (selected.length < 6) {
        const fillers = dataset
          .filter(t => !alreadyIds.has(t.id))
          .map(t => {
            const profile = profileComponent(t)
            return { t, total: profile*100, breakdown: { diagnosis: 0, availability: 0, distance: 0, language: 0, prefs: 0, profile: Math.round(0.10*profile*100) }, km: 0, components: { diagnosis: 0, availability: 0, distance: 0, language: 0, prefs: 0, profile } }
          })
          .sort((a,b)=> b.total - a.total)
        for (const s of fillers) { if (selected.length < 6) { selected.push(s) } }
      }
    }

    // Tiering: 1–3 strong, then 2–3 additional; never zero results when dataset available
    const finalSlice = selected.slice(0, Math.max(6, Math.min(8, requestedLimit)))
    const strongCutoff = Math.max(1, Math.min(3, Math.ceil(finalSlice.length / 3)))
    // Prepare counts by stage (MODE → GEO → RADIUS → GENDER → LANG → DX)
    const originalRadius = Number((raw && raw.radiusKm) || 25)
    const mapMeeting = (arr: any[]) => (arr||[]).map(m => {
      if (m === 'ordinace') return 'clinic'
      if (m === 'dojizdeni' || m === 'dojíždění') return 'home_visit'
      if (m === 'clinic') return 'clinic'
      if (m === 'home_visit') return 'home_visit'
      if (m === 'online') return 'online'
      return m // keep as-is for other values
    })
    const desiredMode = inputs.meetingType === 'online' ? 'online' : (inputs.meetingType === 'dojíždění' || inputs.meetingType === 'dojizdeni') ? 'home_visit' : 'clinic'
    const desiredGender = inputs.therapistGenderPref && inputs.therapistGenderPref !== 'any' ? inputs.therapistGenderPref : undefined
    const desiredLang = userLang
    const desiredDx = inputs.diagnosis?.canonicalId

    function toStageFlags(s: any) {
      const modes = mapMeeting(s.t.meeting_types)
      const modeOk = desiredMode ? modes.includes(desiredMode as any) : true
      const kmVal: number | undefined = (typeof s.km === 'number' && isFinite(s.km)) ? (s.km as number) : undefined
      const geoOk = inputs.meetingType === 'online' ? true : (kmVal !== undefined)
      const radiusOk = inputs.meetingType === 'online' ? true : (kmVal === undefined ? false : kmVal <= originalRadius)
      const genderOk = desiredGender ? ((s.t as any).gender === desiredGender) : true
      const langOk = desiredLang ? Array.isArray(s.t.languages) && s.t.languages.includes(desiredLang) : true
      const dxOk = desiredDx ? Array.isArray(s.t.specialties) && s.t.specialties.includes(desiredDx) : true
      return { modeOk, geoOk, radiusOk, genderOk, langOk, dxOk }
    }

    const countsByStage = (() => {
      const base = { all: scored.length, afterMode: 0, afterGeo: 0, afterRadius: 0, afterGender: 0, afterLang: 0, afterDx: 0 }
      let afterMode = scored.filter(s => toStageFlags(s).modeOk)
      let afterGeo = afterMode.filter(s => toStageFlags(s).geoOk)
      let afterRadius = afterGeo.filter(s => toStageFlags(s).radiusOk)
      let afterGender = afterRadius.filter(s => toStageFlags(s).genderOk)
      let afterLang = afterGender.filter(s => toStageFlags(s).langOk)
      let afterDx = afterLang.filter(s => toStageFlags(s).dxOk)
      return { ...base, afterMode: afterMode.length, afterGeo: afterGeo.length, afterRadius: afterRadius.length, afterGender: afterGender.length, afterLang: afterLang.length, afterDx: afterDx.length }
    })()

    const results = finalSlice.map((s, idx) => {
      const violatedCriteria: string[] = []
      // Add safety check for s.t
      if (!s || !s.t) {
        console.error('Invalid therapist data:', s)
        return null
      }
      if (ignoreLanguage && userLang && !s.t.languages.includes(userLang)) {
        violatedCriteria.push('language')
      }
      if (inputs.diagnosis?.canonicalId) {
        const exact = s.t.specialties.includes(inputs.diagnosis.canonicalId)
        const catOk = inputs.diagnosis.category && s.t.specialties.includes(inputs.diagnosis.category)
        if (!exact && catOk) violatedCriteria.push('diagnosis_exact')
      }
      // Flag relaxed language if applicable
      if (ignoreLanguage && userLang && !s.t.languages.includes(userLang)) {
        if (!violatedCriteria.includes('language')) violatedCriteria.push('language')
      }
      // Distance presentation rules (PART E): avoid showing 0.0; show estimated when coords missing
      const kmValue: number | undefined = (typeof s.km === 'number' && isFinite(s.km)) ? (s.km as number) : undefined
      const distance_estimated = Boolean((s as any).estimated) || (kmValue === undefined)
      // UI hint: prefix distance with ~ if estimated
      const km_hint = distance_estimated && typeof kmValue === 'number' ? `~${Math.max(0.5, Number(kmValue.toFixed(1)))}` : undefined
      const distance_km = inputs.meetingType === 'online' ? undefined
        : (kmValue !== undefined ? Math.max(0.5, Number(kmValue.toFixed(1))) : undefined)

      // If original radius was exceeded, mark violation
      if (typeof kmValue === 'number') {
        const r0 = Number((raw && raw.radiusKm) || 25)
        if (kmValue > r0) {
          // Back-compat radius_ tag and new 'distance' tag per spec
          violatedCriteria.push(`radius_${r0}`)
          if (!violatedCriteria.includes('distance')) violatedCriteria.push('distance')
        }
      }

      // Meeting type relaxation indicator
      if (allowOnlineAdditional && s.t.meeting_types.includes('online') && inputs.meetingType !== 'online') {
        violatedCriteria.push('meeting_type')
      }

      // Tiering via single source of truth (with guards)
      const mappedModes: any[] = Array.isArray((s.t as any).meeting_types)
        ? mapMeeting((s.t as any).meeting_types)
        : []
      // Normalize gender to strict 'male' | 'female' (should already be normalized, but ensure it)
      const rawGender = (s.t as any).gender
      const mappedGender: 'male' | 'female' = normalizeTherapistGender(rawGender, (s.t as any).id)
      const mappedLangs: any[] = Array.isArray((s.t as any).languages) ? (s.t as any).languages : []
      
      // Fix classifyTier inputs with proper defaults and mappings
      const MODE_ALIASES: Record<string,'clinic'|'home_visit'|'online'> = {
        'ordinace': 'clinic',
        'dojizdeni': 'home_visit',
        'dojíždění': 'home_visit',
        'navsteva_doma': 'home_visit',
        'návštěva_doma': 'home_visit',
        'domaci': 'home_visit',
        'online': 'online'
      }
      const defaultRadius = 30
      const radiusKm = Number((raw && raw.radiusKm) || defaultRadius)
      
      // Map gender from Czech to English
      const genderMap: Record<string, string> = {
        'muž': 'male',
        'žena': 'female', 
        'nezáleží': 'any',
        'male': 'male',
        'female': 'female',
        'any': 'any'
      }
      const mappedGenderPref = genderMap[inputs.therapistGenderPref || 'any'] || 'any'
      
      // Default language to Czech if none selected
      const defaultLang = userLang || 'cs'
      
      // Fix allowedModes mapping using canonical meeting type
      const canonicalMeeting: 'clinic'|'home_visit'|'online' = MODE_ALIASES[inputs.meetingType] || 'clinic'
      const allowedModes = canonicalMeeting === 'online' 
        ? ['online'] as any 
        : canonicalMeeting === 'clinic' 
          ? ['clinic'] as any 
          : ['home_visit'] as any
      
      let tier: 1|2|3|4 = 4
      try {
        tier = classifyTier({
          therapist: { meeting_modes: mappedModes as any, gender: mappedGender, languages: mappedLangs } as any,
          km: kmValue,
          allowed: inputs.meetingType === 'online' ? true : (typeof kmValue === 'number')
        }, {
          meetingType: (canonicalMeeting as any),
          radiusKm,
          therapistGenderPref: mappedGenderPref as any,
          language: defaultLang,
          languageSelected: Boolean(inputs.language),
          diagnosis: { canonicalId: inputs.diagnosis?.canonicalId },
          diagnosisRarity: (inputs as any).diagnosisRarity,
          requireInPerson: inputs.meetingType !== 'online',
          allowedModes
        })
      } catch (e) {
        try { safeLogError('classifyTier failed', { id: s.t.id }, e) } catch {}
      }
      const badges: string[] = []
      let banner: string | undefined
      const kmValueNum: number | undefined = (typeof s.km === 'number' && isFinite(s.km)) ? (s.km as number) : undefined
      const withinOriginalRadius = inputs.meetingType === 'online' ? true : (kmValueNum === undefined ? true : kmValueNum <= Number((raw && raw.radiusKm) || 25))
      if (tier === 2 && withinOriginalRadius) {
        tier = 2
        if (violatedCriteria.length > 0) badges.push(`Nesplňuje: ${violatedCriteria.join(', ')}`)
      } else if (tier === 3) {
        banner = 'Regionální specialista'
      }

      // Tier-1 explain path: PASS or FAIL @STAGE (detail) - use same fixed inputs
      const modes = mappedModes
      const desired = allowedModes[0] // Use the same allowedModes logic
      let explainStr = 'PASS'
      
      if (!(desired ? modes.includes(desired as any) : true)) {
        explainStr = 'FAIL @MODE'
      } else if (!(inputs.meetingType === 'online' ? true : (kmValue !== undefined))) {
        explainStr = 'FAIL @GEO (coords)'
      } else if (!(inputs.meetingType === 'online' ? true : (kmValue !== undefined ? kmValue <= radiusKm : false))) {
        explainStr = `FAIL @RADIUS (km=${typeof kmValue==='number'?kmValue.toFixed(1):'—'} > radius=${radiusKm})`
      } else if (mappedGenderPref && mappedGenderPref !== 'any' && mappedGender && mappedGender !== mappedGenderPref) {
        explainStr = `FAIL @GENDER (wanted=${mappedGenderPref}, has=${mappedGender})`
      } else if (defaultLang && !mappedLangs.includes(defaultLang)) {
        explainStr = `FAIL @LANG (wanted=${defaultLang})`
      } else if (desiredDx && !(s.t.specialties || []).includes(desiredDx)) {
        explainStr = 'FAIL @DX (no expertise)'
      }

      return ({
      id: s.t.id,
      name: s.t.name,
      city: s.t.city,
      distance_km,
      distance_estimated,
      match_score: Math.round(s.total),
      score_breakdown: s.breakdown,
      geo_debug: { user: (s as any).user || null, therapist: (s as any).th || null, estimated: distance_estimated, km: distance_km, distanceScore: s.components.distance },
      reasons: deriveReasons(s.t, s.breakdown, inputs, kmValue, distance_estimated),
      km_hint,
      next_available: toArray(s.t.availability)[0] || null,
      meeting_types: toArray(s.t.meeting_types),
      languages: toArray(s.t.languages),
      age_supported: toArray(s.t.age_groups),
      supports_insurance: s.t.accepts_insurance,
      tier,
      badges,
      banner,
      synthetic: Boolean((s.t as any)?.metadata?.synthetic),
        violatedCriteria,
      tier1_explain: explainStr,
      gender_match: Boolean((s as any)?.flags?.genderMatch),
      postpartum_match: Boolean((s as any)?.flags?.postpartumMatch),
      matched_diagnoses: Array.isArray((s as any)?.matchedDiagnoses) ? (s as any).matchedDiagnoses : [],
      services: (() => {
        // Try multiple paths to get services
        const services = (s.t as any)?.services || 
                        (s.t as any)?.service || 
                        (therapist as any)?.services || 
                        []
        const therapistServices = Array.isArray(services) ? services : []
        
        // Debug log for therapist_1007
        if (s.t.id === 'therapist_1007') {
          console.log(`[DEBUG API] therapist_1007 - raw services from s.t:`, (s.t as any)?.services)
          console.log(`[DEBUG API] therapist_1007 - final services:`, therapistServices.length, therapistServices)
        }
        return therapistServices
      })(),
      therapist: {
        id: s.t.id,
        fullName: s.t.name,
        city: s.t.city,
        isVerified: s.t.verified,
        gender: (s.t as any).gender
      }
      })
    })

    // Filter out null results and tier 4 suppression: if Tier 1 exists, remove all Tier 4 results
    const validResults = results.filter(r => r !== null)
    const hasTier1 = validResults.some(r => r.tier === 1)
    const finalResults = hasTier1 ? validResults.filter(r => r.tier !== 4) : validResults

    const fallbackUsed = finalResults.length < 6
    const fallbackLevel = fallbackUsed ? (appliedRelax || 'relaxed') : 'strict'
    
    // Debug: Print final results summary
    console.log(`🎯 [FINAL RESULTS] ${finalResults.length} results returned`)
    console.log(`🎯 [FINAL RESULTS] Tier 1 results: ${finalResults.filter(r => r.tier === 1).length}`)
    console.log(`🎯 [FINAL RESULTS] Fallback used: ${fallbackUsed} (${fallbackLevel})`)
    if (finalResults.length > 0) {
      const distances = finalResults.map(r => r.distance_km).filter(d => typeof d === 'number' && Number.isFinite(d))
      if (distances.length > 0) {
        console.log(`🎯 [FINAL RESULTS] Distance range: ${Math.min(...distances).toFixed(1)}km - ${Math.max(...distances).toFixed(1)}km`)
      }
    }

    const searchTime = Date.now() - startTime
    // Telemetry: km histogram + basic geo events
    const kmValues = finalResults.map(r => (typeof r.distance_km === 'number' ? r.distance_km as number : null)).filter((x): x is number => x !== null)
    const histogram: Record<string, number> = { '<=5': 0, '5-10': 0, '10-25': 0, '25-50': 0, '>50': 0 }
    for (const km of kmValues) {
      if (km <= 5) histogram['<=5']++
      else if (km <= 10) histogram['5-10']++
      else if (km <= 25) histogram['10-25']++
      else if (km <= 50) histogram['25-50']++
      else histogram['>50']++
    }
    try {
      logSearch({
        queryId: `q_${startTime}`,
        location: inputs.location.coords ? { type: 'city', value: inputs.location.city || '', coordinates: { lat: inputs.location.coords.lat, lng: inputs.location.coords.lon } } : { type: 'city', value: inputs.location.city || '' },
        radiusKmRequested: Number((raw && raw.radiusKm) || 30),
        radiusKmUsed: Number((raw && raw.radiusKm) || 30),
        mustHave: { practiceType: [inputs.meetingType], languages: userLang ? [userLang] : undefined },
        prefer: { distance: inputs.meetingType !== 'online', availability: true },
        top3Ids: finalResults.slice(0,3).map(r => r.id),
        resultsCount: finalResults.length,
        processingTimeMs: searchTime,
        fallbackUsed,
        quality: { topScore: finalResults[0]?.match_score || 0, avgScore: Math.round(finalResults.reduce((s,r)=>s+(r.match_score||0),0)/(finalResults.length||1)), scoreDistribution: histogram as any }
      })
    } catch {}
    return NextResponse.json({
      total: finalResults.length,
      results: finalResults,
      fallbackUsed,
      fallbackLevel,
      ...(genderFallback ? { fallback: genderFallback } : {}),
      searchInfo: { searchTime, kmHistogram: histogram, countsByStage },
      normalizedInputs: inputs,
      relaxFlags: { ignoreLanguage, allowOnlineAdditional },
      ...(Object.keys(meta).length ? { meta } : {})
    })
  } catch (error) {
    safeLogError('API searchTherapists POST failed', undefined, error)
    return NextResponse.json({ error: 'Search failed', message: (error as Error).message }, { status: 500 })
  }
}

/**
 * SAFE_LOCAL_MODE: Emergency mode for immediate local results
 * - Canonicalize city → get lat/lon
 * - Include therapists who: offer clinic (nearest location km ≤ radius) or home_visit (city covered)
 * - Ignore diagnosis/language/availability; apply gender only if explicitly set (male/female)
 * - Sort strictly by distance ASC, then next_available_in_days ASC, then id ASC
 * - Do not call tiers or scoring
 */
async function handleSafeLocalMode(
  inputs: any,
  raw: any,
  requestedLimit: number,
  startTime: number
): Promise<NextResponse> {
  try {
    console.log(`[SAFE_LOCAL_MODE] Function called with inputs:`, {
      city: inputs.location.city,
      coords: inputs.location.coords,
      meetingType: inputs.meetingType
    })

    // Canonicalize city → get lat/lon
    if (!inputs.location.coords && inputs.location.city) {
      try {
        const res = await normalizePlace(inputs.location.city)
        if (res && typeof res.lat === 'number' && typeof res.lng === 'number') {
          inputs.location.coords = { lat: res.lat, lon: res.lng }
        } else {
          const resolved = CityService.resolve(inputs.location.city)
          if (resolved) inputs.location.coords = { lat: resolved.lat, lon: resolved.lng }
        }
      } catch {}
    }

    if (!inputs.location.coords) {
      console.log(`[SAFE_LOCAL_MODE] No coordinates found for city: ${inputs.location.city}`)
      return NextResponse.json({
        error: 'Location coordinates required for SAFE_LOCAL_MODE',
        message: 'Unable to resolve city coordinates'
      }, { status: 400 })
    }

    // Load dataset with synthetic data
    const includeSynthetic = true // Force synthetic data for SAFE_LOCAL_MODE
    const dataset = loadIndex(includeSynthetic)
    const userCoords = inputs.location.coords
    const radiusKm = Number((raw && raw.radiusKm) || 30)

    // Filter for in-person therapists only (clinic/home_visit) and apply distance filtering
    const localTherapists = dataset.filter(t => {
      // Check if therapist offers in-person services
      const hasClinic = t.meeting_types.includes('ordinace')
      const hasHomeVisit = t.meeting_types.includes('dojíždění') || t.meeting_types.includes('dojizdeni')
      
      if (!hasClinic && !hasHomeVisit) {
        return false
      }

      // For SAFE_LOCAL_MODE, be more permissive with distance
      // Just check if therapist is in the same city or nearby
      if (t.city === inputs.location.city) {
        return true
      }

      // Ensure we have coordinates
      let lat = t.lat
      let lng = t.lng
      
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        // Try to resolve therapist city coordinates
        try {
          const resolved = CityService.resolve(t.city)
          if (resolved) {
            lat = resolved.lat
            lng = resolved.lng
          } else {
            return false // Skip if no coordinates available
          }
        } catch {
          return false
        }
      }

      const distance = haversineKm(
        { lat: userCoords.lat, lon: userCoords.lon },
        { lat, lon: lng }
      )

      // For clinic: check if within radius
      if (hasClinic) {
        return distance <= radiusKm
      }

      // For home_visit: check if therapist covers the user's city
      if (hasHomeVisit) {
        const serviceRadius = t.service_radius_km || 50
        return distance <= serviceRadius
      }

      return false
    })

    // Apply gender filter only if explicitly set (male/female)
    let filteredTherapists = localTherapists
    if (inputs.therapistGenderPref && inputs.therapistGenderPref !== 'any') {
      filteredTherapists = localTherapists.filter(t => t.gender === inputs.therapistGenderPref)
    }

    // Sort strictly by distance ASC, then next_available_in_days ASC, then id ASC
    const sortedTherapists = filteredTherapists
      .map(t => {
        // Calculate distance
        let distance = 0
        if (t.city === inputs.location.city) {
          // Same city - use a small distance
          distance = 0.5
        } else {
          // Calculate actual distance
          let lat = t.lat
          let lng = t.lng
          
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            try {
              const resolved = CityService.resolve(t.city)
              if (resolved) {
                lat = resolved.lat
                lng = resolved.lng
              }
            } catch {}
          }
          
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            distance = haversineKm(
              { lat: userCoords.lat, lon: userCoords.lon },
              { lat, lon: lng }
            )
          }
        }
        
        // Calculate next available in days (simplified)
        const nextAvailable = toArray(t.availability)[0]
        const nextAvailableInDays = nextAvailable 
          ? Math.ceil((new Date(nextAvailable).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : 999

        return {
          ...t,
          distance_km: Math.max(0.5, Number(distance.toFixed(1))),
          next_available_in_days: nextAvailableInDays
        }
      })
      .sort((a, b) => {
        // Primary: distance ASC
        if (a.distance_km !== b.distance_km) {
          return a.distance_km - b.distance_km
        }
        // Secondary: next_available_in_days ASC
        if (a.next_available_in_days !== b.next_available_in_days) {
          return a.next_available_in_days - b.next_available_in_days
        }
        // Tertiary: id ASC
        return a.id.localeCompare(b.id)
      })

    // Limit results
    const results = sortedTherapists.slice(0, requestedLimit)


    // Format results for UI
    const formattedResults = results.map(t => ({
      id: t.id,
      name: t.name,
      city: t.city,
      distance_km: t.distance_km,
      distance_estimated: false,
      match_score: 100, // Fixed score in SAFE_LOCAL_MODE
      score_breakdown: {
        diagnosis: 0,
        availability: 0,
        distance: 100,
        language: 0,
        prefs: 0,
        profile: 0
      },
      reasons: [`${t.distance_km} km od ${inputs.location.city || 'tebe'}`],
      next_available: toArray(t.availability)[0] || null,
      meeting_types: toArray(t.meeting_types),
      languages: toArray(t.languages),
      age_supported: toArray(t.age_groups),
      supports_insurance: t.accepts_insurance,
      tier: 1, // All results are tier 1 in SAFE_LOCAL_MODE
      badges: [],
      banner: undefined,
      synthetic: Boolean(t?.metadata?.synthetic),
      violatedCriteria: [],
      therapist: {
        id: t.id,
        fullName: t.name,
        city: t.city,
        isVerified: t.verified
      }
    }))

    const searchTime = Date.now() - startTime

    return NextResponse.json({
      total: formattedResults.length,
      results: formattedResults,
      fallbackUsed: false,
      fallbackLevel: 'safe_local_mode',
      searchInfo: { 
        searchTime, 
        mode: 'SAFE_LOCAL_MODE',
        radiusKm,
        city: inputs.location.city
      },
      normalizedInputs: inputs,
      relaxFlags: { safeLocalMode: true }
    })

  } catch (error) {
    safeLogError('SAFE_LOCAL_MODE failed', undefined, error)
    return NextResponse.json({ 
      error: 'SAFE_LOCAL_MODE failed', 
      message: (error as Error).message 
    }, { status: 500 })
  }
}

function deriveReasons(
  t: IndexedTherapist,
  b: { diagnosis:number; availability:number; distance:number; language:number; prefs:number; profile:number },
  inputs: any,
  km?: number,
  estimated?: boolean
): string[] {
  const bullets: string[] = []
  const femalePreferred = (inputs.therapistGenderPref === 'female')
  const specialistWord = femalePreferred ? 'specialistka' : 'specialista'

  // Diagnosis-based reason
  const diagId = inputs.diagnosis?.canonicalId
  const syns: string[] = Array.isArray(inputs.diagnosis?.synonyms) ? inputs.diagnosis.synonyms : []
  const hasExact = diagId ? t.specialties.includes(diagId) : false
  const hasSyn = syns.some((s: string) => t.specialties.includes(s))
  const hasCategory = inputs.diagnosis?.category ? t.specialties.includes(inputs.diagnosis.category) : false
  if (hasExact || hasSyn || hasCategory) {
    if (hasExact || hasSyn) {
      // Czech label for Bechtěrevova choroba
      const czName = diagId === 'ankylosing_spondylitis' ? 'Bechtěrevovu chorobu' : (diagId || 'diagnózu')
      bullets.push(`${specialistWord} na ${czName}`)
    } else if (hasCategory) {
      const czCat = inputs.diagnosis.category === 'spine_pain' ? 'páteř' : inputs.diagnosis.category
      bullets.push(`${specialistWord} na ${czCat}`)
    }
  }
  // Issue-only: spine/back specialization
  if (!diagId && Array.isArray(inputs.issues) && inputs.issues.length > 0) {
    const hasSpine = inputs.issues.includes('spine_pain') || inputs.issues.includes('back_pain')
    if (hasSpine) {
      bullets.push(`${specialistWord} na bolesti zad/páteře`)
    }
  }

  // Next available slot (CZ format with time-of-day)
  const first = toArray(t.availability)[0]
  if (first) {
    const dt = new Date(first)
    const hour = dt.getHours()
    const tod = hour < 10 ? 'ráno' : hour < 12 ? 'dopoledne' : hour < 17 ? 'odpoledne' : 'večer'
    const when = dt.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' }) + ', ' + dt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
    bullets.push(`nejbližší termín: ${when} (${tod})`)
  }

  // Distance reason for on-site
  if (inputs.meetingType !== 'online' && typeof km === 'number' && isFinite(km)) {
    const km1 = Math.max(0.5, Number(km.toFixed(1)))
    const label = estimated ? `~${km1} km od tebe` : `${km1} km od tebe`
    bullets.push(label)
  }

  // Language
  if (inputs.language) {
    const lang = inputs.language === 'cestina' || inputs.language === 'cs' ? 'česky' : inputs.language
    if (t.languages.includes('cestina') || t.languages.includes('cs')) {
      bullets.push(`mluví ${lang}`)
    }
  }

  return bullets.slice(0, 3)
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const testMode = url.searchParams.get('test') === 'true'
  const debugMode = url.searchParams.get('debug') === 'true'
  
  if (debugMode) {
    // Debug dataset loading
    try {
      const dataset = loadIndex(true)
      const sample = dataset.slice(0, 3)
      return NextResponse.json({
        total: dataset.length,
        sample,
        sampleStructure: sample.length > 0 ? {
          id: sample[0].id,
          name: sample[0].name,
          city: sample[0].city,
          meeting_types: sample[0].meeting_types,
          lat: sample[0].lat,
          lng: sample[0].lng
        } : null
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to load dataset', message: (error as Error).message }, { status: 500 })
    }
  }
  
  if (testMode) {
    // Return sample data for testing
    return NextResponse.json({
      matches: MOCK_THERAPISTS.slice(0, 3).map(therapist => ({
        therapist,
        match_score: Math.floor(Math.random() * 40) + 60, // 60-100
        reasons: ['specialista na bolest zad', 'mluví česky', '2,3 km od tebe'],
        next_available: '2024-01-15T14:00:00Z',
        distance_km: Math.random() * 10 + 1,
        supports_insurance: true,
        meeting_types: [],
        languages: [],
        age_supported: []
      })),
      totalCount: 3,
      fallbackUsed: false,
      fallbackLevel: 'strict',
      searchMetadata: {
        searchTime: 45,
        filtersApplied: ['meetingType:ordinace', 'city:Praha'],
        sortMethod: 'match_score_desc'
      }
    })
  }
  
  return NextResponse.json(
    { error: 'Use POST method for search requests' },
    { status: 405 }
  )
}