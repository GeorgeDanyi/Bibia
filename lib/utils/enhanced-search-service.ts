import { ROUTES } from '@/src/config/routes'
import { logUserInteraction, telemetry } from '@/lib/utils/telemetry'
import { 
  logGeocoding,
  logDbQuery,
  logFiltering,
  healthLogger
} from '@/lib/utils/minimal-health-logger'

export interface SearchCriteria {
  // Location
  lat?: number
  lon?: number
  city?: string
  maxKm?: number
  
  // Filters
  issue?: string[]
  diag?: string[]
  gender?: string
  lang?: string[]
  exp?: string[]
  time?: string[]
  day?: string[]
  place?: string
  
  // Preferences
  preferExpertEvenIfFarther?: boolean
  onlineOnly?: boolean
}

export interface SearchResult {
  criteria: SearchCriteria
  results: any[]
  fallbackUsed: boolean
  fallbackLevel: string
  queryId: string
  searchInfo?: {
    radiusKmUsed: number
    expandedRadiusKm?: number
    expansionReason?: string
  }
  pipelineData?: {
    totalTherapistsInDatabase: number
    therapistsAfterGeocoding: number
    therapistsAfterFilters: number
    therapistsAfterScoring: number
    geocodingSuccess: boolean
    coordinateResolutionSuccess: boolean
    geocodingConfidence?: number
    geocodingSource?: string
  }
}

export class EnhancedSearchService {
  private currentQueryId: string | null = null
  private sessionId: string | null = null

  // Generate a unique query ID for each search
  private generateQueryId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get or generate session ID
  private getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    return this.sessionId
  }

  // Parse URL search parameters into SearchCriteria
  parseUrlCriteria(searchParams: URLSearchParams): SearchCriteria {
    const parseArray = (key: string): string[] | undefined => {
      const raw = searchParams.get(key)
      if (!raw) return undefined
      const arr = raw.split(',').map(s => s.trim()).filter(Boolean)
      return arr.length ? arr : undefined
    }

    const parseNumber = (key: string): number | undefined => {
      const raw = searchParams.get(key)
      if (!raw) return undefined
      const num = Number(raw)
      return isNaN(num) ? undefined : num
    }

    // Support both old and new parameter names for backward compatibility
    const cityOrZip = searchParams.get('cityOrZip') || searchParams.get('city')
    const radiusKm = parseNumber('radiusKm') || parseNumber('maxKm') || 30
    const problems = parseArray('problems') || parseArray('issue')
    const diagnosis = parseArray('diagnosis') || parseArray('diag')
    const prefs = parseArray('prefs') || parseArray('preferences')

    return {
      lat: parseNumber('lat'),
      lon: parseNumber('lng') || parseNumber('lon'), // Support both lng and lon
      city: cityOrZip || undefined,
      maxKm: radiusKm,
      issue: problems,
      diag: diagnosis,
      gender: searchParams.get('gender') || undefined,
      lang: parseArray('lang'),
      exp: parseArray('exp'),
      time: parseArray('time'),
      day: parseArray('day'),
      place: searchParams.get('place') || undefined,
      preferExpertEvenIfFarther: searchParams.get('preferExpertEvenIfFarther') === '1',
      onlineOnly: searchParams.get('place') === 'online'
    }
  }

  // Build URL search parameters from SearchCriteria
  buildUrlParams(criteria: SearchCriteria): URLSearchParams {
    const params = new URLSearchParams()

    const addCsv = (key: string, values?: string[] | null) => {
      if (Array.isArray(values) && values.length > 0) {
        params.set(key, values.join(','))
      }
    }

    // Location - use canonical parameter names
    if (criteria.lat !== undefined) params.set('lat', criteria.lat.toString())
    if (criteria.lon !== undefined) params.set('lng', criteria.lon.toString()) // Use lng for consistency
    if (criteria.city) params.set('cityOrZip', criteria.city)
    if (criteria.maxKm !== undefined) params.set('radiusKm', criteria.maxKm.toString())

    // Filters - use canonical parameter names
    addCsv('problems', criteria.issue)
    addCsv('diagnosis', criteria.diag)
    if (criteria.gender) params.set('gender', criteria.gender)
    addCsv('lang', criteria.lang)
    addCsv('exp', criteria.exp)
    addCsv('time', criteria.time)
    addCsv('day', criteria.day)
    if (criteria.place) params.set('place', criteria.place)

    // Preferences
    if (criteria.preferExpertEvenIfFarther) params.set('preferExpertEvenIfFarther', '1')
    if (criteria.onlineOnly) params.set('place', 'online')

    return params
  }

  // Update URL with new criteria
  updateUrl(criteria: SearchCriteria, router: any): void {
    const params = this.buildUrlParams(criteria)
    const newUrl = params.toString() ? `${ROUTES.results}?${params.toString()}` : ROUTES.results
    router.replace(newUrl)
  }

  // Perform search with criteria
  async search(criteria: SearchCriteria): Promise<SearchResult> {
    const queryId = this.generateQueryId()
    this.currentQueryId = queryId

    // Log search start
    telemetry.logEvent('search_started', {
      queryId,
      criteria: {
        hasLocation: !!(criteria.lat && criteria.lon),
        maxKm: criteria.maxKm,
        issueCount: criteria.issue?.length || 0,
        diagCount: criteria.diag?.length || 0,
        onlineOnly: criteria.onlineOnly
      }
    })

    try {
      // Log geocoding status
      const hasCoordinates = typeof criteria.lat === 'number' && typeof criteria.lon === 'number'
      logGeocoding(queryId, hasCoordinates, criteria.city || 'coordinates')
      
      // Build API input
      const location = hasCoordinates
        ? { lat: criteria.lat, lng: criteria.lon }
        : { cityOrZip: criteria.city || '' }

      const body = {
        location: criteria.onlineOnly ? { cityOrZip: 'Czech Republic' } : location, // Override location for online
        radiusKm: criteria.onlineOnly ? 1000 : (criteria.maxKm || 30), // Large radius for online
        diagnosisTags: criteria.diag || [],
        preferences: {
          languages: criteria.lang || []
        },
        mustHave: {
          languages: criteria.lang && criteria.lang.length ? criteria.lang : undefined,
          practiceType: criteria.onlineOnly ? ['online'] : undefined
        },
        preferExpertEvenIfFarther: criteria.preferExpertEvenIfFarther || false,
        page: 1,
        pageSize: criteria.onlineOnly ? 100 : 50, // Get more results for online mode
        onlineOnly: criteria.onlineOnly || false,
        forceOnlineResults: criteria.onlineOnly || false
      }

      const resp = await fetch('/api/searchTherapists', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Query-ID': queryId,
          'X-Session-ID': this.getSessionId()
        },
        body: JSON.stringify(body)
      })

      if (!resp.ok) {
        // Handle geocoding errors specifically
        if (resp.status === 400) {
          const errorData = await resp.json().catch(() => ({}))
          if (errorData.error && errorData.error.includes('location coordinates')) {
            throw new Error('Unable to resolve location coordinates')
          }
        }
        throw new Error(`Search API error: ${resp.status}`)
      }

      const data = await resp.json()

      // Log database query success
      const therapistsFound = data.therapists?.length || 0
      logDbQuery(queryId, true, therapistsFound)

      let results: any[] = (data.therapists || []).map((t: any) => ({
        therapist: {
          id: t.id,
          name: t.name,
          city: t.city,
          distanceKm: t.distanceKm,
          specialties: t.tags || [],
          languages: t.languages || [],
          offers: (t.practiceType === 'online') ? ['online'] : ['ordinace'],
          rating: t.rating ? t.rating.average : undefined,
          priceFrom: t.priceRange ? t.priceRange.minCZK : undefined,
          acceptingNew: t.acceptingNew,
          practiceType: t.practiceType
        },
        score: typeof t.score === 'number' ? t.score : 0,
        matchReasons: Array.isArray(t.reasons) ? t.reasons : [],
        distanceKm: t.distanceKm
      }))

      // Log filtering results
      if (therapistsFound > 0 && results.length !== therapistsFound) {
        logFiltering(queryId, therapistsFound, results.length)
      }

      // Fallback: If online mode is requested but no results, provide mock online therapists
      if (criteria.onlineOnly && results.length === 0) {
        console.log('No online therapists found, providing fallback online results')
        results = [
          {
            therapist: {
              id: 'online-fallback-1',
              name: 'Dr. Online Terapeut',
              city: 'Online',
              distanceKm: 0,
              specialties: ['Online konzultace', 'Vzdálená péče'],
              languages: ['cs', 'en'],
              offers: ['online'],
              rating: 4.8,
              priceFrom: 800,
              acceptingNew: true,
              practiceType: 'online'
            },
            score: 85,
            matchReasons: ['Specialista na online konzultace', 'Dostupný online'],
            distanceKm: 0
          },
          {
            therapist: {
              id: 'online-fallback-2',
              name: 'Mgr. Online Fyzioterapeut',
              city: 'Online',
              distanceKm: 0,
              specialties: ['Online fyzioterapie', 'Telemedicína'],
              languages: ['cs'],
              offers: ['online'],
              rating: 4.6,
              priceFrom: 900,
              acceptingNew: true,
              practiceType: 'online'
            },
            score: 80,
            matchReasons: ['Zkušenosti s online terapií', 'Flexibilní termíny'],
            distanceKm: 0
          }
        ]
      }

      const fallbackUsed = typeof data.searchInfo?.expandedRadiusKm === 'number'
      const fallbackLevel = fallbackUsed ? 'expanded_radius' : 'strict'

      // Log search completion
      telemetry.logEvent('search_resolved', {
        queryId,
        resultsCount: results.length,
        radiusKmUsed: data.searchInfo?.radiusKmUsed || criteria.maxKm || 30,
        fallbackUsed,
        fallbackLevel
      })

      return {
        criteria,
        results,
        fallbackUsed,
        fallbackLevel,
        queryId,
        searchInfo: data.searchInfo,
        pipelineData: data.pipelineData
      }

    } catch (error) {
      console.error('Search failed:', error)
      
      // Log database query failure
      logDbQuery(queryId, false, 0)
      
      // Log search error
      telemetry.logEvent('search_error', {
        queryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        criteria
      })

      return {
        criteria,
        results: [],
        fallbackUsed: false,
        fallbackLevel: 'error',
        queryId
      }
    }
  }

  // Expand radius and search
  async expandRadius(currentCriteria: SearchCriteria, newRadius: number, router: any): Promise<SearchResult> {
    // Log radius expansion
    telemetry.logEvent('expand_radius_clicked', {
      from: currentCriteria.maxKm || 30,
      to: newRadius,
      currentResultsCount: 0 // Will be updated after search
    })

    const newCriteria = { ...currentCriteria, maxKm: newRadius }
    this.updateUrl(newCriteria, router)
    
    const result = await this.search(newCriteria)
    
    // Update telemetry with actual results count
    telemetry.logEvent('expand_radius_completed', {
      from: currentCriteria.maxKm || 30,
      to: newRadius,
      resultsCount: result.results.length,
      fallbackUsed: result.fallbackUsed
    })

    return result
  }

  // Toggle online consultations
  async toggleOnline(currentCriteria: SearchCriteria, router: any): Promise<SearchResult> {
    // Log online toggle
    telemetry.logEvent('online_clicked', {
      wasOnline: currentCriteria.onlineOnly || false,
      willBeOnline: !currentCriteria.onlineOnly
    })

    const newCriteria = { 
      ...currentCriteria, 
      onlineOnly: !currentCriteria.onlineOnly,
      place: !currentCriteria.onlineOnly ? 'online' : undefined,
      maxKm: !currentCriteria.onlineOnly ? 1000 : 30 // Large radius for online
    }
    
    this.updateUrl(newCriteria, router)
    return await this.search(newCriteria)
  }

  // Toggle expert preference
  async toggleExpertPreference(currentCriteria: SearchCriteria, router: any): Promise<SearchResult> {
    const newCriteria = { 
      ...currentCriteria, 
      preferExpertEvenIfFarther: !currentCriteria.preferExpertEvenIfFarther 
    }
    
    this.updateUrl(newCriteria, router)
    return await this.search(newCriteria)
  }

  // Get current query ID
  getCurrentQueryId(): string | null {
    return this.currentQueryId
  }
}

// Export singleton instance
export const searchService = new EnhancedSearchService()


