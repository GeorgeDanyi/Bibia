'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toArray, toObject, safeLogError } from '@/lib/utils/normalize'
import { useBibiaStore } from '@/lib/bibiaStore'
import { searchAnalytics, generateSearchId } from '@/lib/analytics/searchAnalytics'
import { SearchInputs, TherapistMatch, SearchResult } from '@/lib/matching/types'
import { normalizeSearchInputs } from '@/lib/matching/normalization'
import { uniqueById } from '@/src/utils/arrays'
import { normalizeMatchPercent } from '@/lib/matching/matching-engine'
import { mapReasonCodeToSummaryCs } from '@/lib/matching/reasonCopy'

export interface SearchQuery {
  lat?: number
  lon?: number
  city?: string
  meetingType?: 'ordinace' | 'dojíždění' | 'online'
  issues?: string[]
  diagnosis?: {
    canonicalId?: string
    synonyms?: string[]
    category?: string
  }
  timeFit?: 'ASAP' | 'weekday' | 'evening' | 'weekend'
  language?: string
  wantsInsurance?: boolean
  ageGroup?: 'child' | 'adult' | 'senior'
  therapistGenderPref?: 'male' | 'female' | 'any'
  strictGender?: boolean
  barrierFree?: boolean
  sort?: 'best' | 'nearest' | 'soonest' | 'price'
  radius?: number
  onlineOnly?: boolean
  // Additional properties for grouped results
  day?: string
  time?: string
}

export interface UseSearchResultsReturn {
  loading: boolean
  hasResults: boolean
  empty: boolean
  error: string | null
  results: TherapistMatch[]
  query: SearchQuery
  totalCount: number
  fallbackUsed: boolean
  fallbackLevel?: string
  searchMetadata?: {
    searchTime: number
    filtersApplied: string[]
    sortMethod: string
  }
  setQueryParam: (key: keyof SearchQuery, value: any) => void
  expandRadius: (radius: number) => void
  toggleOnline: () => void
  updateSort: (sort: string) => void
  removeFilter: (filter: string) => void
  search: (customQuery?: Partial<SearchQuery>) => Promise<void>
  // Interaction telemetry
  logResultOpened: (therapistId: string, matchScore: number) => void
  logContactClick: (therapistId: string, matchScore: number) => void
  // Debug overlay
  debugEnabled: boolean
  toggleDebug: () => void
  // Debug data
  normalizedInputs?: any
  normalizedQuery?: any
}

/**
 * Map canonical matching-engine results (matchResults.matches[]) into the
 * legacy TherapistMatch shape consumed by the UI.
 *
 * This keeps the UI code simple while letting the API expose richer
 * explainability metadata via matchResults.
 */
export function mapMatchResultsToTherapistMatches(matches: any[]): TherapistMatch[] {
  if (!Array.isArray(matches)) return []

  return matches.map((m: any) => {
    const t = m.therapist || {}
    const distanceKm = typeof m.distanceKm === 'number' ? m.distanceKm : null

    // Convert canonical meeting_types → legacy Czech labels used in UI.
    const meetingTypes: string[] = Array.isArray(t.meeting_types)
      ? t.meeting_types.map((mt: string) =>
          mt === 'clinic' ? 'ordinace' : mt === 'home_visit' ? 'dojíždění' : 'online'
        )
      : []

    // Prefer explicit matchPercent from the engine, but fall back to
    // normalized totalScore when matchPercent is missing. Never treat
    // totalScore itself as a percentage.
    let rawPercent: number
    if (typeof m.matchPercent === 'number') {
      rawPercent = m.matchPercent
    } else if (typeof m.totalScore === 'number') {
      rawPercent = normalizeMatchPercent(m.totalScore)
    } else {
      rawPercent = 0
    }
    const matchPercent = Math.round(rawPercent)

    // Prefer canonical reasons from matchResults[].reasons, but fall back to
    // legacy fields if needed (e.g. matchResults[].matchReasons or therapist.matchReasons).
    const rawReasonsSource =
      Array.isArray(m.reasons) && m.reasons.length > 0
        ? m.reasons
        : Array.isArray((m as any).matchReasons) && (m as any).matchReasons.length > 0
          ? (m as any).matchReasons
          : Array.isArray(t.matchReasons) && t.matchReasons.length > 0
            ? t.matchReasons
            : []

    const reasons: string[] = rawReasonsSource
      .map((r: any) => {
        // Prefer Czech detail text if present, otherwise fall back to Czech/primary label,
        // and finally to a mapped summary from the reason code. Keep raw strings as-is.
        if (typeof r === 'string') return r
        if (typeof r?.detailCs === 'string') return r.detailCs
        if (typeof r?.labelCs === 'string') return r.labelCs
        if (typeof r?.label === 'string') return r.label
        if (typeof r?.code === 'string') return mapReasonCodeToSummaryCs(r.code)
        return ''
      })
      .map((text: string) => (typeof text === 'string' ? text.trim() : ''))
      .filter((text: string) => text.length > 0)

    return {
      therapist: t,
      // Keep legacy field aligned with the displayed percent score
      match_score: matchPercent,
      reasons,
      rawReasons: rawReasonsSource,
      next_available: t.next_available_slot || m.next_available || undefined,
      distance_km: distanceKm ?? 0,
      supports_insurance: Boolean(t.accepts_insurance),
      meeting_types: meetingTypes,
      languages: Array.isArray(t.languages) ? t.languages : [],
      age_supported: Array.isArray(t.age_groups) ? t.age_groups : [],
      // Non-canonical field used by UI for primary score display
      matchPercent
    } as TherapistMatch
  })
}

/**
 * Select the best available result source from the API response.
 *
 * Preference order:
 * 1) matchResults.matches[] from the canonical matching engine
 * 2) matches[] (older API shape)
 * 3) results[] (legacy search API)
 */
export function selectResultsFromApiResponse(data: any): TherapistMatch[] {
  const mr = data?.matchResults

  if (Array.isArray(mr)) {
    return mapMatchResultsToTherapistMatches(mr)
  }

  if (Array.isArray(mr?.matches)) {
    return mapMatchResultsToTherapistMatches(mr.matches)
  }

  if (Array.isArray(data?.matches)) {
    return toArray(data.matches) as TherapistMatch[]
  }

  return toArray(data?.results) as TherapistMatch[]
}

export function useSearchResults(): UseSearchResultsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<TherapistMatch[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [fallbackUsed, setFallbackUsed] = useState(false)
  const [fallbackLevel, setFallbackLevel] = useState<string | undefined>()
  const [searchMetadata, setSearchMetadata] = useState<SearchResult['searchMetadata']>()
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null)
  const [debugEnabled, setDebugEnabled] = useState(false)
  const [normalizedInputs, setNormalizedInputs] = useState<any | null>(null)
  const [normalizedQuery, setNormalizedQuery] = useState<any | null>(null)

  // Get URL parameters
  const searchParams = useSearchParams()
  
  // Get questionnaire data from store
  const storeData = useBibiaStore(state => state)

  // Initialize query from URL params or store data
  const [query, setQuery] = useState<SearchQuery>(() => {
    // Read URL parameters first
    const city = searchParams?.get('city') || storeData.step1.city
    const practice = searchParams?.get('practice') || 'clinic'
    const conditions = searchParams?.get('conditions') || ''
    const hasDiagnosis = searchParams?.get('hasDiagnosis') === 'true'
    const time = searchParams?.get('time') || 'asap'
    const languages = searchParams?.get('languages') || 'cs'
    const ageGroups = searchParams?.get('ageGroups') || 'adult'
    const therapistGender = searchParams?.get('therapistGender') || 'any'
    const strictGender = searchParams?.get('strictGender') === 'true'
    
    // Map practice to meeting type
    const meetingType = practice === 'clinic' ? 'ordinace' 
      : practice === 'home' ? 'dojíždění'
      : practice === 'online' ? 'online'
      : 'ordinace'
    
    // Map gender preference
    const genderMapping: Record<string, 'male' | 'female' | 'any'> = {
      'muz': 'male',
      'zena': 'female',
      'nezalezi': 'any',
      'male': 'male',
      'female': 'female',
      'any': 'any'
    }
    const therapistGenderPref = genderMapping[therapistGender] || 'any'
    
    // Map time to timeFit
    const timeFit = time === 'asap' ? 'ASAP' 
      : time === 'evening' ? 'evening'
      : time === 'weekend' ? 'weekend'
      : 'weekday'
    
    console.log('🔍 [USE SEARCH RESULTS] Initializing with URL params:', {
      city, practice, conditions, hasDiagnosis, time, languages, ageGroups, therapistGender, therapistGenderPref, strictGender
    })

    return {
      city,
      meetingType,
      issues: conditions ? conditions.split(',') : Object.values(storeData.step2.refinements).flat(),
      diagnosis: hasDiagnosis ? {
        canonicalId: storeData.step3.diagnosis[0],
        synonyms: storeData.step3.diagnosis.slice(1),
        category: undefined
      } : undefined,
      timeFit,
      language: languages,
      wantsInsurance: true, // Default assumption
      ageGroup: ageGroups as 'child' | 'adult' | 'senior',
      therapistGenderPref,
      strictGender,
      barrierFree: false, // Default assumption
      sort: 'best',
      radius: 30,
      onlineOnly: meetingType === 'online'
    }
  })

  // Search function
  const search = useCallback(async (customQuery?: Partial<SearchQuery>) => {
    const searchQuery = { ...toObject(query), ...(toObject(customQuery)) }
    const searchId = generateSearchId()
    
    console.log('🔍 [USE SEARCH RESULTS] Search function called with:', { query, customQuery, searchQuery })
    
    setLoading(true)
    setError(null)
    setCurrentSearchId(searchId)
    
    // Log search started
    searchAnalytics.logSearchStarted(searchId)
    
    try {
      // Check for questionnaire payload in localStorage
      let payload: any = null
      try {
        const stored = localStorage.getItem('bibiaQuestionnairePayload')
        if (stored) {
          payload = JSON.parse(stored)
          // Clear after use
          localStorage.removeItem('bibiaQuestionnairePayload')
        }
      } catch {}
      
      // Use questionnaire payload if available, otherwise normalize query
      // Map therapistGenderPref to genderPref for normalization
      const normalizedQuery: any = { ...searchQuery }
      if (normalizedQuery.therapistGenderPref) {
        normalizedQuery.genderPref = normalizedQuery.therapistGenderPref
        delete normalizedQuery.therapistGenderPref
      }
      const requestBody = payload || normalizeSearchInputs(normalizedQuery)
      
      // Ensure strictGender is passed to API if set in query
      if (searchQuery.strictGender !== undefined) {
        requestBody.strictGender = searchQuery.strictGender
      }
      
      // Make API request
      const response = await fetch('/api/searchTherapists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      const data: any = await response.json()
      try { (window as any).__last_search_info__ = data?.searchInfo || null } catch {}
      
      // Select best available result source from API
      const rawResults = selectResultsFromApiResponse(data)
      // Only deduplicate if results have id property; cast to any to satisfy generic constraint
      let uniqueResults: TherapistMatch[]
      if (rawResults.every((r: any) => r.id)) {
        uniqueResults = uniqueById(rawResults as any) as unknown as TherapistMatch[]
      } else {
        uniqueResults = rawResults
      }
      let sortedResults: TherapistMatch[] = [...uniqueResults]
      if (searchQuery.sort === 'nearest') {
        sortedResults.sort((a, b) => a.distance_km - b.distance_km)
      } else if (searchQuery.sort === 'soonest') {
        sortedResults.sort((a, b) => {
          if (!a.next_available && !b.next_available) return 0
          if (!a.next_available) return 1
          if (!b.next_available) return -1
          return new Date(a.next_available).getTime() - new Date(b.next_available).getTime()
        })
      } else if (searchQuery.sort === 'price') {
        // Sort by price (assuming lower is better, but we don't have price data in current schema)
        // For now, sort by match score as fallback
        sortedResults.sort((a, b) => b.match_score - a.match_score)
      }
      // 'best' is already sorted by match score from API
      
      // Support both legacy { totalCount, searchMetadata } and new { total, searchInfo }
      const totalCount = typeof data.totalCount === 'number' ? data.totalCount
        : typeof data.total === 'number' ? data.total
        : sortedResults.length
      const searchTime = (data.searchMetadata && typeof data.searchMetadata.searchTime === 'number')
        ? data.searchMetadata.searchTime
        : (data.searchInfo && typeof data.searchInfo.searchTime === 'number')
          ? data.searchInfo.searchTime
          : undefined
      setResults(sortedResults)
      // Persist last search results client-side so detail pages can reuse
      // explainability reasons without another API request.
      try {
        if (typeof window !== 'undefined') {
          ;(window as any).sessionStorage?.setItem('bibiaLastResults', JSON.stringify(sortedResults))
        }
      } catch {
        // ignore storage errors (e.g. disabled cookies)
      }
      setTotalCount(totalCount)
      setFallbackUsed(!!data.fallbackUsed)
      setFallbackLevel(data.fallbackLevel)
      setNormalizedInputs(data.normalizedInputs || null)
        // Build normalizedQuery from API response shapes
        try {
          const inp = data.normalizedInputs || {}
          const fallbackObj = (data.fallbackUsed || data.fallbackLevel || data.fallback)
            ? { used: Boolean(data.fallbackUsed), reason: (data.fallback && data.fallback.reason) || undefined }
            : null
          // Map meeting type to API contract if needed
          const mtRaw: any = inp.meetingType
          const mt = mtRaw === 'ordinace' ? 'clinic' : (mtRaw === 'dojíždění' || mtRaw === 'dojizdeni') ? 'home_visit' : mtRaw
          
          // Build diagnoses from questionnaire payload or normalized inputs
          let diagnoses = null
          if (payload && payload.diagnosisIds && Array.isArray(payload.diagnosisIds)) {
            diagnoses = payload.diagnosisIds.map((id: string) => ({ id, label: id }))
          } else if (inp?.diagnosis && (inp.diagnosis.canonicalId || (inp.diagnosis.synonyms||[]).length)) {
            diagnoses = [{ id: inp.diagnosis.canonicalId || (inp.diagnosis.synonyms||[])[0], label: inp.diagnosis.canonicalId || (inp.diagnosis.synonyms||[])[0] }]
          }
          
          const nq = {
            city: inp?.location?.city ?? null,
            radiusKm: inp?.radiusKm ?? null,
            meetingType: mt ?? null,
            languages: Array.isArray(inp?.languages) ? inp.languages : (inp?.language ? [inp.language] : null),
            day: (inp?.timeFit === 'weekend') ? 'weekend' : (inp?.timeFit ? 'weekday' : null),
            timeSlot: (inp?.timeFit === 'evening') ? 'evening' : null,
            insurance: inp?.wantsInsurance ? ['insurance'] : null,
            genderPref: inp?.therapistGenderPref ?? null,
            diagnoses,
            problemAreas: Array.isArray(inp?.issues) ? inp.issues : (Array.isArray(inp?.problemAreas) ? inp.problemAreas : null),
            availabilityHint: null,
            fallback: fallbackObj
          }
          setNormalizedQuery(nq)
        } catch (e) {
          setNormalizedQuery(null)
        }
      if (searchTime !== undefined) {
        setSearchMetadata({
          searchTime,
          filtersApplied: Array.isArray(data?.searchMetadata?.filtersApplied) ? data.searchMetadata.filtersApplied : [],
          sortMethod: typeof data?.searchMetadata?.sortMethod === 'string' ? data.searchMetadata.sortMethod : (searchQuery.sort || 'best')
        })
      } else {
        setSearchMetadata(undefined)
      }
      
      // Log results count (guard missing metadata)
      try {
        searchAnalytics.logResultsCount(
          searchId,
          totalCount,
          !!data.fallbackUsed,
          data.fallbackLevel,
          typeof searchTime === 'number' ? searchTime : 0
        )
      } catch (e) {
        safeLogError('searchAnalytics.logResultsCount failed', { totalCount, fallbackUsed: data.fallbackUsed }, e)
      }
      
      // Additional telemetry
      try {
        if (sortedResults.length === 0) {
          searchAnalytics.emit('no_results', { searchId, resultCount: 0, searchTime: searchTime || 0 })
        } else {
          searchAnalytics.emit('top_score', { searchId, matchScore: sortedResults[0].match_score, resultCount: sortedResults.length, searchTime: searchTime || 0 })
        }
      } catch (e) {
        safeLogError('searchAnalytics.emit failed', { event: sortedResults.length === 0 ? 'no_results' : 'top_score' }, e)
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      safeLogError('useSearchResults.search failed', { query }, err)
    } finally {
      setLoading(false)
    }
  }, []) // DISABLED to prevent duplicate searches - ResultsClient handles search manually

  // Auto-search on mount - DISABLED to prevent duplicate searches
  // ResultsClient will handle the search manually
  // useEffect(() => {
  //   console.log('🔍 [USE SEARCH RESULTS] Auto-search triggered, query:', query)
  //   search()
  // }, []) // Only run on mount

  // Query parameter setters
  const setQueryParam = useCallback((key: keyof SearchQuery, value: any) => {
    setQuery(prev => ({ ...prev, [key]: value }))
  }, [])

  const expandRadius = useCallback((radius: number) => {
    setQuery(prev => ({ ...prev, radius }))
    search({ radius })
  }, [search])

  const toggleOnline = useCallback(() => {
    const newOnlineOnly = !query.onlineOnly
    const newMeetingType = newOnlineOnly ? 'online' : 'ordinace'
    setQuery(prev => ({ 
      ...prev, 
      onlineOnly: newOnlineOnly,
      meetingType: newMeetingType
    }))
    // When switching to online, hide distance downstream; when switching back, keep coords
    search({ onlineOnly: newOnlineOnly, meetingType: newMeetingType })
  }, [query.onlineOnly, search])

  const updateSort = useCallback((sort: string) => {
    setQuery(prev => ({ ...prev, sort: sort as any }))
    if (currentSearchId) {
      searchAnalytics.emit('sort_changed', { searchId: currentSearchId, sort })
    }
    
    // Apply local sorting instead of triggering new API call
    setResults(prevResults => {
      const sortedResults = [...prevResults]
      if (sort === 'nearest') {
        sortedResults.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
      } else if (sort === 'soonest') {
        sortedResults.sort((a, b) => {
          if (!a.next_available && !b.next_available) return 0
          if (!a.next_available) return 1
          if (!b.next_available) return -1
          return new Date(a.next_available).getTime() - new Date(b.next_available).getTime()
        })
      } else if (sort === 'price') {
        // Sort by match score as fallback for price
        sortedResults.sort((a, b) => b.match_score - a.match_score)
      } else if (sort === 'best') {
        // Sort by match score (best first)
        sortedResults.sort((a, b) => b.match_score - a.match_score)
      }
      return sortedResults
    })
  }, [currentSearchId])

  const toggleDebug = useCallback(() => {
    setDebugEnabled(prev => !prev)
  }, [])

  const removeFilter = useCallback((filter: string) => {
    const newQuery = { ...query }
    
    switch (filter) {
      case 'city':
        delete newQuery.city
        break
      case 'radius':
        newQuery.radius = 30 // Reset to default
        break
      case 'conditions':
        newQuery.issues = []
        break
      case 'availability':
        newQuery.timeFit = 'weekday' // Reset to default
        break
      case 'practice':
        newQuery.meetingType = 'ordinace' // Reset to default
        break
      case 'languages':
        newQuery.language = undefined
        break
    }
    
    setQuery(newQuery)
    if (currentSearchId) {
      searchAnalytics.emit('chip_toggled', { searchId: currentSearchId, chipKey: filter, chipValue: '' })
    }
    search(newQuery)
  }, [query, search, currentSearchId])

  // Log result interactions
  const logResultOpened = useCallback((therapistId: string, matchScore: number) => {
    if (currentSearchId) {
      searchAnalytics.logResultOpened(currentSearchId, therapistId, matchScore)
    }
  }, [currentSearchId])

  const logContactClick = useCallback((therapistId: string, matchScore: number) => {
    if (currentSearchId) {
      searchAnalytics.logContactClick(currentSearchId, therapistId, matchScore)
    }
  }, [currentSearchId])

  return {
    loading,
    hasResults: results.length > 0,
    empty: !loading && results.length === 0 && !error,
    error,
    results,
    query,
    totalCount,
    fallbackUsed,
    fallbackLevel,
    searchMetadata,
    setQueryParam,
    expandRadius,
    toggleOnline,
    updateSort,
    removeFilter,
    search,
    // Expose logging functions for components
    logResultOpened,
    logContactClick,
    // Debug overlay
    debugEnabled,
    toggleDebug,
    // Debug data
    normalizedInputs,
    normalizedQuery
  } as UseSearchResultsReturn & { logResultOpened: typeof logResultOpened; logContactClick: typeof logContactClick }
}
