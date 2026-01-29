// Input normalization system for diacritics-insensitive matching

/**
 * Remove diacritics and normalize text for matching
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Normalize city names for consistent matching
 */
import { canonicalizeCity } from '@/lib/geo/cityIndex'

export function normalizeCity(city: string): string {
  const normalized = normalizeText(city)
  
  // Handle common Czech city variations
  const cityMappings: Record<string, string> = {
    'praha': 'praha',
    'prague': 'praha',
    'brno': 'brno',
    'ostrava': 'ostrava',
    'plzen': 'plzen',
    'pilsen': 'plzen',
    'liberec': 'liberec',
    'olomouc': 'olomouc',
    'budweis': 'ceske budejovice',
    'ceske budejovice': 'ceske budejovice',
    'hradec kralove': 'hradec kralove',
    'pardubice': 'pardubice',
    'zlin': 'zlin',
    'havirov': 'havirov',
    'most': 'most',
    'karvina': 'karvina',
    'frydek mistek': 'frydek mistek',
    'opava': 'opava',
    'decín': 'decin',
    'karlovy vary': 'karlovy vary',
    'jihlava': 'jihlava',
    'teplice': 'teplice',
    'chomutov': 'chomutov',
    'usti nad labem': 'usti nad labem',
    'prostejov': 'prostejov',
    'prerov': 'prerov',
    'jablonec nad nisou': 'jablonec nad nisou',
    'melnik': 'melnik',
    'trutnov': 'trutnov',
    'pribram': 'pribram',
    'cheb': 'cheb',
    'modrany': 'modrany',
    'kladno': 'kladno',
    'chrudim': 'chrudim',
    'ceska lipa': 'ceska lipa',
    'tabor': 'tabor',
    'trebic': 'trebic',
    'znojmo': 'znojmo',
    'kromeriz': 'kromeriz',
    'sumperk': 'sumperk',
    'vsetin': 'vsetin',
    'valasske mezirici': 'valasske mezirici',
    'litvinov': 'litvinov',
    'novy jicin': 'novy jicin',
    'turnov': 'turnov',
    'blansko': 'blansko',
    'kutna hora': 'kutna hora',
    'hranice': 'hranice',
    'breclav': 'breclav',
    'kralupy nad vltavou': 'kralupy nad vltavou',
    'sokolov': 'sokolov',
    'litomerice': 'litomerice',
    'havlickuv brod': 'havlickuv brod',
    'zatec': 'zatec',
    'kadan': 'kadan',
    'steti': 'steti',
    'novy bor': 'novy bor',
    'rokycany': 'rokycany'
  }
  
  return cityMappings[normalized] || normalized
}

/**
 * Tiny diagnosis rarity taxonomy
 */
function classifyDiagnosisRarity(input: { canonicalId?: string; text?: string; category?: string }): 'specialized' | 'common' | 'none' {
  const hay = normalizeText(
    [input.canonicalId, input.text, input.category].filter(Boolean).join(' ')
  )

  // Specialized set
  const specializedTokens = [
    'bechterev','bechterew','ankylosing spondylitis','ankylozujici spondylitida',
    'roztrousena skleroza','rs','multiple sclerosis',
    'parkinson','parkinsonova',
    'als','amyotroficka lateralni skleroza',
    'popaleniny','poopaleni','poopaleninove',
    'onkologie vzacna','vzacna onkologie','rare oncology',
    'tezka panevni dna','tezke panevni dna','pelvic floor severe',
    'cmp','mozkovy infarkt','mrtvice','po cmp','cerebrovaskularni prihoda'
  ]
  for (const t of specializedTokens) {
    if (hay.includes(normalizeText(t))) return 'specialized'
  }

  // Common set
  const commonTokens = [
    'vyhrezla plotenka','plotenka','hernia disku','vyklenuti disku',
    'uraz','kotnik','koleno','knee sprain','ankle sprain',
    'pooperacni rekonvalescence','rehabilitace po operaci','postoperative',
    'tenisovy loket','epikondylitida','lateralni epikondylitida',
    'rotatorova manzeta','rotator cuff'
  ]
  for (const t of commonTokens) {
    if (hay.includes(normalizeText(t))) return 'common'
  }

  return 'none'
}

function canonicalCityOrNormalized(city?: string): string | undefined {
  if (!city) return undefined
  const c = canonicalizeCity(city)
  return c?.city || normalizeCity(city)
}

function normalizeLanguagesList(input: unknown, fallbackSingle?: string): string[] | undefined {
  const arr = Array.isArray(input) ? input : (typeof input === 'string' ? input.split(/[;,\s]+/) : [])
  const mapped = arr.map(x => normalizeLanguage(String(x))).filter(Boolean)
  if (mapped.length === 0 && fallbackSingle) {
    const one = normalizeLanguage(fallbackSingle)
    if (one) mapped.push(one)
  }
  if (mapped.length === 0) return undefined
  const uniq = Array.from(new Set(mapped))
  // prioritize cs first
  const cs = uniq.filter(l => l === 'cs')
  const rest = uniq.filter(l => l !== 'cs')
  return [...cs, ...rest]
}

type AnyMeeting = 'clinic' | 'home_visit' | 'online' | 'any' | string

function mapMeetingToken(raw: string): 'clinic' | 'home_visit' | 'online' | undefined {
  const t = normalizeText(raw)
  // clinic variants
  if (t === 'ordinace' || t === 'klinika' || t === 'clinic' || t === 'ambulance') return 'clinic'
  // home_visit variants
  if (t === 'dojizdeni' || t === 'dojizdeni' || t === 'dojizdeni' || t === 'dojizdeni') return 'home_visit'
  if (t === 'dojizdeni' || t === 'dojizdeni' || t === 'domu' || t === 'home' || t === 'homevisit' || t === 'home_visit' || t === 'home-visit') return 'home_visit'
  // online variants
  if (t === 'online' || t === 'virtual' || t === 'video' || t === 'telemedicina') return 'online'
  // already canonical
  if (t === 'clinic' || t === 'home_visit' || t === 'online') return t as any
  return undefined
}

function normalizeMeetingModes(input?: unknown, single?: 'ordinace' | 'dojíždění' | 'online'): Array<'clinic'|'home_visit'|'online'> | undefined {
  const arr: string[] = Array.isArray(input)
    ? (input as any[]).map(x => String(x))
    : (typeof input === 'string' ? [input] : [])
  const modes: Set<'clinic'|'home_visit'|'online'> = new Set()
  for (const raw of arr) {
    const mapped = mapMeetingToken(raw)
    if (mapped) modes.add(mapped)
    else if (normalizeText(raw) === 'any') { modes.add('clinic'); modes.add('home_visit') }
  }
  if (modes.size === 0 && single) {
    if (single === 'ordinace') modes.add('clinic')
    else if (single === 'dojíždění') modes.add('home_visit')
    else if (single === 'online') modes.add('online')
  }
  return modes.size > 0 ? Array.from(modes) : undefined
}

/**
 * Normalize diagnosis terms for matching
 */
export function normalizeDiagnosis(diagnosis: string): string {
  return normalizeText(diagnosis)
}

function mapDiagnosis(raw: any): { canonicalId?: string; synonyms: string[]; category?: string } {
  const diag = typeof raw === 'string' ? normalizeDiagnosis(raw) : normalizeDiagnosis(raw?.canonicalId || '')
  const synonyms: string[] = []
  let canonicalId: string | undefined
  let category: string | undefined

  if (diag) {
    // Bechterev mapping → ankylosing_spondylitis with synonyms and fallback category spine_pain
    if (diag.includes('bechterev') || diag.includes('bechterew') || diag.includes('ankylosing spondylitis')) {
      canonicalId = 'ankylosing_spondylitis'
      category = 'spine_pain'
      synonyms.push('bechterev', 'bechtěrev', 'ankylosing spondylitis', 'morbus bechterew')
    }
  }

  // If raw has provided synonyms, merge them
  const rawSyn = Array.isArray(raw?.synonyms) ? raw.synonyms.map(normalizeDiagnosis) : []
  const mergedSyn = Array.from(new Set([...synonyms, ...rawSyn]))
  return { canonicalId, synonyms: mergedSyn, category }
}

/**
 * Normalize issue/body region terms
 */
export function normalizeIssue(issue: string): string {
  return normalizeText(issue)
}

function expandIssues(rawIssues: any): string[] {
  const arr = Array.isArray(rawIssues) ? rawIssues : (typeof rawIssues === 'string' ? rawIssues.split(',') : [])
  const base = arr.map(normalizeIssue)
  const expanded: string[] = []
  for (const tag of base) {
    // Map URL-friendly tags to canonical internal tags
    if (
      tag === 'back' || tag === 'zada' || tag === 'spine' || tag === 'back_pain'
      || tag === 'pater' || tag === 'bolesti zad' || tag === 'bolest zad'
    ) {
      expanded.push('spine_pain', 'back_pain')
      continue
    }
    expanded.push(tag)
  }
  return Array.from(new Set(expanded))
}

/**
 * Normalize language codes
 */
export function normalizeLanguage(language: string): string {
  const normalized = normalizeText(language)
  
  const languageMappings: Record<string, string> = {
    'czech': 'cs',
    'cesky': 'cs',
    'cestina': 'cs',
    'english': 'en',
    'anglicky': 'en',
    'anglictina': 'en',
    'german': 'de',
    'nemecky': 'de',
    'nemcina': 'de',
    'slovak': 'sk',
    'slovensky': 'sk',
    'slovencina': 'sk',
    'polish': 'pl',
    'polsky': 'pl',
    'polstina': 'pl'
  }
  
  return languageMappings[normalized] || normalized
}

/**
 * Normalize meeting type
 */
export function normalizeMeetingType(meetingType: string): 'ordinace' | 'dojíždění' | 'online' {
  const normalized = normalizeText(meetingType)
  
  if (normalized.includes('ordinace') || normalized.includes('klinika') || normalized.includes('clinic') || normalized.includes('ambulant')) {
    return 'ordinace'
  }
  if (normalized.includes('dojizdeni') || normalized.includes('domu') || normalized.includes('home')) {
    return 'dojíždění'
  }
  if (normalized.includes('online') || normalized.includes('video') || normalized.includes('telemedicina')) {
    return 'online'
  }
  
  return 'ordinace' // default
}

/**
 * Normalize age group
 */
export function normalizeAgeGroup(ageGroup: string): 'child' | 'adult' | 'senior' {
  const normalized = normalizeText(ageGroup)
  
  if (normalized.includes('dite') || normalized.includes('detsky') || normalized.includes('child')) {
    return 'child'
  }
  if (normalized.includes('senior') || normalized.includes('starsi') || normalized.includes('elderly')) {
    return 'senior'
  }
  
  return 'adult' // default
}

/**
 * Normalize time preferences
 */
export function normalizeTimeFit(timeFit: string): 'ASAP' | 'weekday' | 'evening' | 'weekend' {
  const normalized = normalizeText(timeFit)
  
  if (normalized.includes('asap') || normalized.includes('ihned') || normalized.includes('co nejdrive')) {
    return 'ASAP'
  }
  if (normalized.includes('vecerni') || normalized.includes('evening') || normalized.includes('po 17')) {
    return 'evening'
  }
  if (normalized.includes('vikend') || normalized.includes('weekend') || normalized.includes('sobota') || normalized.includes('nedele')) {
    return 'weekend'
  }
  
  return 'weekday' // default
}

/**
 * Normalize gender preference
 */
export function normalizeGenderPref(genderPref: string): 'male' | 'female' | 'any' {
  const normalized = normalizeText(genderPref)

  // 1) Exact canonical values – NEVER flip these
  if (normalized === 'male') return 'male'
  if (normalized === 'female') return 'female'
  if (normalized === 'any' || normalized === '') return 'any'

  // Helper to check token-level matches (avoid "male" matching inside "female")
  const tokens = normalized.split(/\s+/).filter(Boolean)
  const hasToken = (candidates: string[]) =>
    tokens.some(t => candidates.includes(t))

  // 2) Legacy Czech + English words for MALE
  //    - "muz", "muž", "pan", simple variants
  if (
    hasToken(['muz', 'muzsky', 'muzskeho', 'muze', 'muzi']) ||
    hasToken(['muz', 'muž']) || // explicit diacritics variants
    hasToken(['pan'])
  ) {
    return 'male'
  }

  // 3) Legacy Czech + English words for FEMALE
  //    - "zena", "žena", "pani", simple variants
  if (
    hasToken(['zena', 'zenska', 'zeny']) ||
    hasToken(['žena']) ||
    hasToken(['pani'])
  ) {
    return 'female'
  }

  // 4) "No preference" → any
  if (
    normalized.includes('nezalezi') ||
    normalized.includes('nezáleží') ||
    normalized === 'bez preference'
  ) {
    return 'any'
  }

  // Fallback – treat unknown values as "any" to be safe
  return 'any'
}

/**
 * Map therapist attributes to canonical IDs
 */
export function mapToCanonicalIds(attributes: string[], mapping: Record<string, string>): string[] {
  return attributes
    .map(attr => mapping[normalizeText(attr)] || attr)
    .filter((id, index, array) => array.indexOf(id) === index) // remove duplicates
}

/**
 * Create a comprehensive normalization function for search inputs
 */
import type { Answers } from '@/lib/types/answers'
import type { MatchingInputs, SearchInputs, MatchingTherapist } from '@/lib/matching/types'

/**
 * Normalize new Answers format to MatchingInputs (canonical matching engine input)
 * 
 * This is the explicit, type-safe conversion from user-facing Answers to matching engine input.
 * 
 * @param answers - User-facing questionnaire answers
 * @returns MatchingInputs - Canonical input type for the matching engine
 */
export function normalizeAnswersToMatchingInputs(answers: Answers): MatchingInputs {
  console.log('🔍 [NORMALIZE_ANSWERS] Input answers:', JSON.stringify(answers, null, 2));
  
  // Map meetingType to canonical English values
  const meetingType: 'clinic' | 'home_visit' | 'online' | 'any' = 
    answers.meetingType === 'clinic' ? 'clinic' :
    answers.meetingType === 'home' ? 'home_visit' :
    answers.meetingType === 'online' ? 'online' : 'any';

  // Map genderPreference (already in canonical form)
  const genderPreference = answers.genderPreference;

  // Map problemArea to issues (normalized)
  const issues = answers.problemArea ? [answers.problemArea] : [];

  // Map problemDetail to diagnosis if available
  const diagnosis = answers.problemDetail ? { 
    canonicalId: undefined, 
    synonyms: [answers.problemDetail], 
    category: undefined 
  } : { canonicalId: undefined, synonyms: [], category: undefined };

  // Map insuranceMode
  const wantsInsurance = answers.insuranceMode === 'insurance';

  // Map timesOfDay/weekdays to timePreference
  const hasTimePreference = answers.timesOfDay.length > 0 || answers.weekdays.length > 0;
  const timePreference: 'asap' | 'flexible' | 'specific' | 'unknown' = 
    hasTimePreference ? 'specific' : 'flexible';
  
  // Legacy timeFit for backward compatibility
  const timeFit: 'ASAP' | 'weekday' | 'evening' | 'weekend' = 
    answers.timesOfDay.includes('evening') ? 'evening' :
    answers.timesOfDay.includes('weekend') ? 'weekend' :
    answers.timesOfDay.length > 0 ? 'weekday' : 'ASAP';

  // Map languages - normalize and use 'cs' as default if empty
  const languages = answers.languages && answers.languages.length > 0 
    ? answers.languages.map(lang => normalizeLanguage(lang))
    : ['cs'];

  const result: MatchingInputs = {
    location: {
      city: answers.city || null,
      coords: null // Will be derived from city if needed
    },
    radiusKm: answers.radiusKm || null,
    meetingType,
    issues,
    diagnosis,
    timePreference,
    timeFit,
    languages,
    wantsInsurance,
    ageGroup: answers.ageGroup || 'adult',
    genderPreference,
    strictGender: answers.strictGender,
    barrierFree: answers.barrierFree,
    // Legacy fields for backward compatibility
    language: languages[0],
    therapistGenderPref: genderPreference
  };
  
  console.log('🔍 [NORMALIZE_ANSWERS] Output MatchingInputs:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Legacy function: Normalize new Answers format to SearchInputs (deprecated)
 * @deprecated Use normalizeAnswersToMatchingInputs instead
 */
export function normalizeAnswersToSearchInputs(answers: Answers): SearchInputs {
  const matchingInputs = normalizeAnswersToMatchingInputs(answers);
  
  // Convert MatchingInputs to legacy SearchInputs format
  const meetingTypeMap: Record<string, 'ordinace' | 'dojíždění' | 'online'> = {
    'clinic': 'ordinace',
    'home_visit': 'dojíždění',
    'online': 'online',
    'any': 'ordinace'
  };
  
  return {
    location: {
      city: matchingInputs.location.city || undefined,
      coords: matchingInputs.location.coords || undefined
    },
    radiusKm: matchingInputs.radiusKm || undefined,
    meetingType: meetingTypeMap[matchingInputs.meetingType] || 'ordinace',
    issues: matchingInputs.issues,
    diagnosis: matchingInputs.diagnosis,
    diagnosisRarity: matchingInputs.diagnosisRarity,
    timeFit: matchingInputs.timeFit || 'ASAP',
    language: matchingInputs.language,
    languages: matchingInputs.languages,
    wantsInsurance: matchingInputs.wantsInsurance,
    ageGroup: matchingInputs.ageGroup,
    therapistGenderPref: matchingInputs.genderPreference,
    strictGender: matchingInputs.strictGender,
    barrierFree: matchingInputs.barrierFree,
    profileCompleteness: matchingInputs.profileCompleteness,
    verification: matchingInputs.verification,
    nextAvailableSlot: matchingInputs.nextAvailableSlot,
    geoDistance: matchingInputs.geoDistance
  };
}

export function normalizeSearchInputs(rawInputs: any): SearchInputs {
  // Derive mapped/expanded fields
  const issues = expandIssues(rawInputs.issues || rawInputs.conditions || [])
  const hasDiagnosis = Boolean(rawInputs.hasDiagnosis)
  let diagnosisMapped = hasDiagnosis ? mapDiagnosis(rawInputs.diagnosis || rawInputs.diagnosisId || rawInputs.diagnosisTerm) : { canonicalId: undefined, synonyms: [], category: undefined }
  // Phrase → diagnosis mapping to ensure diagnosisIdsCount > 0 for postpartum phrases
  const haystack: string[] = []
  if (typeof rawInputs.diagnosis === 'string') haystack.push(rawInputs.diagnosis)
  if (typeof rawInputs.diagnosisTerm === 'string') haystack.push(rawInputs.diagnosisTerm)
  if (Array.isArray(rawInputs.issues)) haystack.push(...rawInputs.issues)
  if (Array.isArray(rawInputs.conditions)) haystack.push(...rawInputs.conditions)
  const hay = haystack.map(s => normalizeText(String(s)))
  const triggers = ['po porodu','poporodni','poporodní','panevni dno','pánevní dno','inkontinence'].map(normalizeText)
  const hit = triggers.some(t => hay.some(h => h.includes(t)))
  if (hit) {
    // merge postpartum-related canonical ids as synonyms/category hints
    const postpartumSet = new Set([...(diagnosisMapped.synonyms||[]), 'postpartum_rehab','pelvic_floor','incontinence'])
    diagnosisMapped = { ...diagnosisMapped, synonyms: Array.from(postpartumSet) }
    if (!diagnosisMapped.canonicalId) {
      diagnosisMapped.canonicalId = 'pelvic_floor'
      diagnosisMapped.category = diagnosisMapped.category || 'pelvic_floor'
    }
  }
  const languageShort = rawInputs.language ? normalizeLanguage(rawInputs.language) : undefined
  let languageCanonical = languageShort === 'cs' ? 'cestina' : languageShort === 'en' ? 'anglictina' : languageShort === 'de' ? 'nemcina' : languageShort

  // Time/day buckets (kept for future use; scoring currently time-agnostic)
  const time = typeof rawInputs.time === 'string' ? rawInputs.time.split(',').map(normalizeText) : []
  const day = typeof rawInputs.day === 'string' ? rawInputs.day.split(',').map(normalizeText) : []
  const czDayMap: Record<string,string> = { po: 'mon', ut: 'tue', st: 'wed', ct: 'thu', pa: 'fri', so: 'sat', ne: 'sun' }
  const dayBuckets = day.map((d: string) => czDayMap[d] || d)

  const meetingType = normalizeMeetingType(rawInputs.meetingType || rawInputs.visitMode || rawInputs.practice || 'ordinace')

  // Insurance mapping
  const wantsInsurance = rawInputs.insurance ? (normalizeText(rawInputs.insurance) !== 'self pay' && normalizeText(rawInputs.insurance) !== 'selfpay' && normalizeText(rawInputs.insurance) !== 'self-pay') : Boolean(rawInputs.wantsInsurance)

  // Gender preference mapping
  // Do not override provided value; accept genderPref directly
  const providedGender = rawInputs.genderPref ?? rawInputs.therapistGenderPref ?? rawInputs.gender ?? rawInputs.therapistGender
  const therapistGenderPref = normalizeGenderPref(providedGender ?? 'any')

  // Optional priority handling: boost diagnosis component
  const priority = normalizeText(String(rawInputs.priority || ''))
  const diagnosisBoost = priority === 'diagnosis' ? 0.05 : 0

  // radius handling (km)
  const radiusRaw = rawInputs.radiusKm ?? rawInputs.radius ?? rawInputs.distanceKm ?? rawInputs.km
  const radiusNum = typeof radiusRaw === 'number' ? radiusRaw : (typeof radiusRaw === 'string' ? Number(radiusRaw) : NaN)
  const radiusKm = Number.isFinite(radiusNum) && radiusNum > 0 ? Math.min(200, Math.max(1, radiusNum)) : 20

  // languages array
  const languages = normalizeLanguagesList(rawInputs.languages, languageShort)
  // Default language to Czech if none provided
  if (!languageCanonical && (!languages || languages.length === 0)) {
    languageCanonical = 'cestina'
  }

  // meeting modes array
  const meetingModes = normalizeMeetingModes(rawInputs.meetingModes || rawInputs.meeting_mode || rawInputs.visitModes, meetingType)

  // diagnosis rarity
  const diagnosisRarity = classifyDiagnosisRarity({
    canonicalId: diagnosisMapped.canonicalId,
    text: typeof rawInputs.diagnosis === 'string' ? rawInputs.diagnosis : rawInputs.diagnosisTerm,
    category: diagnosisMapped.category
  })

  return {
    location: {
      city: rawInputs.location?.city ? canonicalCityOrNormalized(rawInputs.location.city) : (rawInputs.city ? canonicalCityOrNormalized(rawInputs.city) : undefined),
      coords: rawInputs.location?.coords || rawInputs.location?.coordinates
    },
    meetingType,
    meetingModes,
    radiusKm,
    issues,
    diagnosis: diagnosisMapped,
    diagnosisRarity,
    timeFit: normalizeTimeFit(rawInputs.timeFit || rawInputs.timePreferences || 'weekday'),
    language: languageCanonical,
    languages,
    wantsInsurance,
    ageGroup: normalizeAgeGroup(rawInputs.ageGroup || 'adult'),
    therapistGenderPref,
    strictGender: Boolean(rawInputs.strictGender),
    barrierFree: Boolean(rawInputs.barrierFree || rawInputs.accessibility),
    profileCompleteness: rawInputs.profileCompleteness,
    verification: rawInputs.verification,
    nextAvailableSlot: rawInputs.nextAvailableSlot,
    geoDistance: rawInputs.geoDistance,
    // carry micro-boost for diagnosis priority; downstream clamps to [0,1]
    // not part of the public type but safely carried at runtime
    ...(diagnosisBoost ? { diagnosisBoost } : {}),
    ...(time.length > 0 ? { timeBuckets: time } : {}),
    ...(dayBuckets.length > 0 ? { dayBuckets } : {})
  }
}

/**
 * Convert IndexedTherapist to MatchingTherapist (canonical therapist type for matching)
 * 
 * This function normalizes therapist data from the indexed format (with Czech meeting types)
 * to the canonical matching format (with English meeting types).
 * 
 * @param indexed - IndexedTherapist from the API/database
 * @returns MatchingTherapist - Canonical therapist type for matching engine
 */
export function convertIndexedTherapistToMatchingTherapist(indexed: {
  id: string
  name: string
  gender: 'male' | 'female'
  city: string
  lat: number | null
  lng: number | null
  meeting_types: Array<'ordinace' | 'dojizdeni' | 'online' | 'clinic' | 'home_visit'>
  service_radius_km: number
  languages: string[]
  specialties: string[]
  age_groups: Array<'child' | 'adult' | 'senior'>
  accepts_insurance: boolean
  availability: string[]
  profile_score?: number
  reviews_count?: number
  verified?: boolean
  metadata?: { barrier_free?: boolean; has_photos?: boolean }
}): MatchingTherapist {
  // Normalize meeting types from Czech to English
  const meeting_types: Array<'clinic' | 'home_visit' | 'online'> = indexed.meeting_types
    .map(mt => {
      const normalized = String(mt).toLowerCase()
      if (normalized === 'ordinace' || normalized === 'clinic') return 'clinic'
      if (normalized === 'dojizdeni' || normalized === 'dojíždění' || normalized === 'home_visit') return 'home_visit'
      if (normalized === 'online') return 'online'
      return null
    })
    .filter((mt): mt is 'clinic' | 'home_visit' | 'online' => mt !== null)

  // Normalize coordinates
  const coordinates = (indexed.lat !== null && indexed.lng !== null && 
                       Number.isFinite(indexed.lat) && Number.isFinite(indexed.lng))
    ? { lat: indexed.lat, lon: indexed.lng }
    : null

  // Normalize languages
  const languages = indexed.languages.map(lang => normalizeLanguage(lang))

  // Extract diagnosis expertise from specialties (specialties that look like diagnosis IDs)
  const diagnosis_expertise = indexed.specialties.filter(s => 
    s.includes('_') || s.includes('-') || s.includes('diagnosis')
  )

  // Get next available slot
  const next_available_slot = indexed.availability && indexed.availability.length > 0
    ? indexed.availability[0]
    : null

  return {
    id: indexed.id,
    fullName: indexed.name,
    city: indexed.city,
    coordinates,
    meeting_types,
    service_radius_km: indexed.service_radius_km > 0 ? indexed.service_radius_km : null,
    barrier_free: indexed.metadata?.barrier_free ?? false,
    age_groups: indexed.age_groups,
    accepting_new: true, // Assume true if not specified
    active_profile: true, // Assume true if not specified
    specialties: indexed.specialties,
    diagnosis_expertise,
    availability: indexed.availability || [],
    next_available_slot,
    languages,
    accepts_insurance: indexed.accepts_insurance,
    gender: indexed.gender, // Already normalized to 'male' | 'female'
    is_verified: indexed.verified ?? false,
    profile_completeness: indexed.profile_score ?? 0.5,
    review_count: indexed.reviews_count ?? 0,
    has_photos: indexed.metadata?.has_photos ?? false
  }
}

/**
 * Convert SearchInputs to MatchingInputs
 * 
 * This function converts the legacy SearchInputs format (with Czech meeting types)
 * to the canonical MatchingInputs format (with English meeting types).
 */
export function convertSearchInputsToMatchingInputs(searchInputs: {
  location?: { city?: string; coords?: { lat: number; lon: number } }
  radiusKm?: number
  meetingType: 'ordinace' | 'dojíždění' | 'online' | string
  issues?: string[]
  diagnosis?: { canonicalId?: string; synonyms?: string[]; category?: string }
  ageGroup?: 'child' | 'adult' | 'senior'
  therapistGenderPref?: 'male' | 'female' | 'any'
  strictGender?: boolean
  barrierFree?: boolean
  languages?: string[]
  wantsInsurance?: boolean
  timeFit?: 'ASAP' | 'weekday' | 'evening' | 'weekend'
}): MatchingInputs {
  // Convert meeting type from Czech to English
  const meetingTypeMap: Record<string, 'clinic' | 'home_visit' | 'online' | 'any'> = {
    'ordinace': 'clinic',
    'dojíždění': 'home_visit',
    'dojizdeni': 'home_visit',
    'clinic': 'clinic',
    'home_visit': 'home_visit',
    'home': 'home_visit',
    'online': 'online',
    'any': 'any'
  }
  
  const meetingType = meetingTypeMap[searchInputs.meetingType] || 'any'
  
  // Map timeFit to timePreference
  const timePreferenceMap: Record<string, 'asap' | 'flexible' | 'specific' | 'unknown'> = {
    'ASAP': 'asap',
    'weekday': 'flexible',
    'evening': 'flexible',
    'weekend': 'flexible'
  }
  const timePreference = timePreferenceMap[searchInputs.timeFit || ''] || 'flexible'
  
  return {
    location: {
      city: searchInputs.location?.city || null,
      coords: searchInputs.location?.coords || null
    },
    radiusKm: searchInputs.radiusKm || null,
    meetingType,
    issues: searchInputs.issues || [],
    diagnosis: searchInputs.diagnosis || { canonicalId: undefined, synonyms: [], category: undefined },
    timePreference,
    timeFit: searchInputs.timeFit,
    languages: searchInputs.languages || [],
    wantsInsurance: searchInputs.wantsInsurance ?? false,
    ageGroup: searchInputs.ageGroup || 'adult',
    genderPreference: searchInputs.therapistGenderPref || 'any',
    strictGender: searchInputs.strictGender ?? false,
    barrierFree: searchInputs.barrierFree ?? false,
    // Legacy fields
    language: searchInputs.languages?.[0],
    therapistGenderPref: searchInputs.therapistGenderPref
  }
}
