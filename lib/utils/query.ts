import { ROUTES } from '@/src/config/routes'

// Client-safe interface for Czech places
export interface CzPlace {
  name: string
  zip: string
  lat: number
  lon: number
}

// Client-safe function to load places via API
async function loadPlacesViaAPI(): Promise<CzPlace[]> {
  try {
    const response = await fetch('/api/places')
    if (!response.ok) {
      throw new Error(`Failed to load places: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading places via API:', error)
    return []
  }
}

// Mapping from Step 2 selections to issue tags
const ISSUE_TAG_MAPPING: Record<string, string[]> = {
  "Bolesti zad / krku": ["backNeck"],
  "Sportovní zranění": ["sport", "injury"],
  "Chronické bolesti": ["chronic"],
  "Těhotenství / po porodu": ["pregnancy", "postpartum"],
  "Neurologické problémy": ["neurological"],
  "Dětské problémy": ["pediatric"],
  "Stáří / mobility": ["elderly", "mobility"],
  "Posturální problémy": ["posture"],
  "Pánevní dno": ["pelvic"],
  "Výkonnostní sport": ["performance", "sport"]
}

// Simple keyword rules for diagnosis mapping
const DIAGNOSIS_KEYWORDS: Record<string, string> = {
  "bechterev": "bechterev",
  "ankylozující spondylitida": "bechterev",
  "scoliosis": "scoliosis", 
  "skolióza": "scoliosis",
  "herniation": "herniation",
  "hernie": "herniation",
  "výhřez": "herniation",
  "ms": "ms",
  "roztroušená skleróza": "ms",
  "multiple sclerosis": "ms",
  "osteoporosis": "osteoporosis",
  "osteoporóza": "osteoporosis",
  "parkinson": "parkinson",
  "parkinsonova choroba": "parkinson",
  "cerebral palsy": "cerebral palsy",
  "dětská mozková obrna": "cerebral palsy",
  "dmo": "cerebral palsy"
}

export interface QueryResult {
  issues: string[]
  diagnosisTags: string[]
  diagnosisText?: string
  coords?: { lat: number, lon: number } | null
  maxDistanceKm: number
  preferences?: {
    gender?: 'male'|'female'|'any'
    languages?: Array<'cs'|'en'|'de'|'other'>
    experiences?: Array<'sports'|'kids'|'seniors'|'pregnancy'>
  }
}

export async function processQuestionnaire(answers: any): Promise<QueryResult> {
  // Map Step 2 selections to issue tags
  const issues: string[] = []
  if (answers.issueTags) {
    for (const issue of answers.issueTags) {
      const mappedTags = ISSUE_TAG_MAPPING[issue] || [issue.toLowerCase().replace(/\s+/g, '')]
      issues.push(...mappedTags)
    }
  }

  // Process diagnosis text to tags
  const diagnosisTags: string[] = []
  let diagnosisText = answers.diagnosis || answers.diagnosisText || ""
  
  if (diagnosisText) {
    const lowerText = diagnosisText.toLowerCase()
    for (const [keyword, tag] of Object.entries(DIAGNOSIS_KEYWORDS)) {
      if (lowerText.includes(keyword)) {
        diagnosisTags.push(tag)
      }
    }
  }

  // Resolve user coordinates with precedence
  let coords: { lat: number, lon: number } | null = null

  // New precedence:
  // 1) If manual with coords -> use
  if (answers.location?.source === 'manual' && answers.location?.coords) {
    coords = answers.location.coords
  }
  // 2) Else if geo -> use geo coords
  else if (answers.location?.source === 'geo' && answers.location?.coords) {
    coords = answers.location.coords
  }
  // 3) Else fallback to label lookup
  else if (answers.location?.label || answers.locationCity || answers.locationZip) {
    const places = await loadPlacesViaAPI()
    const searchTerm = (answers.location?.label || answers.locationCity || answers.locationZip || '').toString()
    
    const matchingPlace = places.find(place => 
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.zip === searchTerm
    )
    
    if (matchingPlace) {
      coords = { lat: matchingPlace.lat, lon: matchingPlace.lon }
    }
  }

  // Default max distance
  const maxDistanceKm = answers.maxDistanceKm || 30

  // Preferences under questionnaire.preferences
  const rawPrefs = (answers as any).preferences || {
    gender: (answers as any).gender,
    languages: (answers as any).languages,
    experiences: (answers as any).experiences
  }

  // Runtime validator/sanitizer for preferences
  const allowedGender = new Set(['male','female','any'])
  const allowedLangs = new Set(['cs','en','de','ru','uk','fr','es','it','pl','sk','hu','other'])
  const allowedExp = new Set(['sports','kids','seniors','pregnancy','womensHealth','rehabInjury'])

  const sanitizeArray = (arr: any[], allowed: Set<string>) =>
    Array.isArray(arr) ? Array.from(new Set(arr.filter(x => typeof x === 'string' && allowed.has(x)))) : []

  const preferences = {
    gender: allowedGender.has(rawPrefs?.gender) ? rawPrefs.gender : 'any',
    languages: sanitizeArray(rawPrefs?.languages || [], allowedLangs),
    experiences: sanitizeArray(rawPrefs?.experiences || [], allowedExp)
  }

  return {
    issues,
    diagnosisTags,
    diagnosisText: diagnosisText || undefined,
    coords,
    maxDistanceKm,
    preferences
  }
}

// Build a canonical /results URL with readable params from questionnaire answers
export async function buildResultsUrl(answers: any, maxDistanceOverride?: number): Promise<string> {
  const query = await processQuestionnaire(answers)

  const params = new URLSearchParams()

  const addCsv = (key: string, values?: string[] | null) => {
    if (Array.isArray(values) && values.length > 0) {
      params.set(key, values.join(','))
    }
  }

  // Core filters
  addCsv('issue', query.issues)
  addCsv('diag', query.diagnosisTags)

  // Raw selections useful for scheduling
  addCsv('time', (answers?.timePreferences as string[]) || [])
  addCsv('weekday', (answers?.weekdays as string[]) || [])

  // Preferences
  const gender = query.preferences?.gender
  if (gender && gender !== 'any') params.set('gender', gender)
  addCsv('lang', query.preferences?.languages || [])
  addCsv('exp', query.preferences?.experiences || [])

  // Location
  const locPref = (answers as any)?.locationPreference
  if (locPref) params.set('locPref', locPref)
  const place = (answers as any)?.location?.label || (answers as any)?.locationCity
  if (place) params.set('place', String(place))
  if (query.coords) {
    params.set('lat', String(query.coords.lat))
    params.set('lon', String(query.coords.lon))
  }

  // Distance
  const maxKm = typeof maxDistanceOverride === 'number' ? maxDistanceOverride : query.maxDistanceKm
  if (typeof maxKm === 'number') params.set('maxKm', String(maxKm))

  const qs = params.toString()
  return qs ? `${ROUTES.results}?${qs}` : ROUTES.results
}
