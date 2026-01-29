'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toArray, toObject, safeLogError } from '@/lib/utils/normalize'
import { useRouter, useSearchParams } from 'next/navigation'

export interface SearchQuery {
  // Location
  lat?: number
  lon?: number
  city?: string
  radius?: number
  
  // Conditions & Preferences
  conditions?: string[]
  availability?: string[]
  practice?: string[]
  languages?: string[]
  // Extended filters
  hasDiagnosis?: boolean
  diagnosis?: string
  priority?: string
  time?: string[]
  day?: string[]
  insurance?: string
  ageGroups?: string
  therapistGender?: string
  
  // Sorting
  sort?: 'best' | 'nearest' | 'soonest' | 'price'
  
  // Online mode
  onlineOnly?: boolean
}

export interface SearchResult {
  id: string
  name: string
  city: string
  distanceKm: number
  nextAvailableDays?: string[]
  conditions: string[]
  practiceType: string
  languages: string[]
  priceRange?: { min: number; max: number }
  rating?: { average: number; count: number }
  score?: number
  reasons?: string[]
}

export interface SearchState {
  loading: boolean
  hasResults: boolean
  empty: boolean
  error: string | null
  results: SearchResult[]
  query: SearchQuery
}

export function useResultsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [state, setState] = useState<SearchState>({
    loading: false,
    hasResults: false,
    empty: false,
    error: null,
    results: [],
    query: {}
  })
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Derive query from URL parameters
  const deriveQueryFromURL = useCallback((): SearchQuery => {
    const query: SearchQuery = {}
    
    // Location
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')
    const radius = searchParams.get('radius')
    
    if (lat && lon) {
      query.lat = parseFloat(lat)
      query.lon = parseFloat(lon)
    }
    if (city) query.city = city
    if (radius) query.radius = parseInt(radius)
    
    // Conditions
    const conditions = searchParams.get('conditions')
    if (conditions) {
      query.conditions = conditions.split(',')
    }
    
    // Availability
    const availability = searchParams.get('availability')
    if (availability) {
      query.availability = availability.split(',')
    }
    
    // Practice
    const practice = searchParams.get('practice')
    if (practice) {
      query.practice = practice.split(',')
    }
    
    // Languages
    const languages = searchParams.get('languages')
    if (languages) {
      query.languages = languages.split(',')
    }

    // Extended params from provided URL
    const hasDiagnosis = searchParams.get('hasDiagnosis')
    if (hasDiagnosis === 'true') query.hasDiagnosis = true
    const diagnosis = searchParams.get('diagnosis')
    if (diagnosis) query.diagnosis = diagnosis
    const priority = searchParams.get('priority')
    if (priority) query.priority = priority
    const time = searchParams.get('time')
    if (time) query.time = time.split(',')
    const day = searchParams.get('day')
    if (day) query.day = day.split(',')
    const insurance = searchParams.get('insurance')
    if (insurance) query.insurance = insurance
    const ageGroups = searchParams.get('ageGroups')
    if (ageGroups) query.ageGroups = ageGroups
    const therapistGender = searchParams.get('therapistGender')
    if (therapistGender) query.therapistGender = therapistGender
    
    // Sort
    const sort = searchParams.get('sort') as SearchQuery['sort']
    if (sort && ['best', 'nearest', 'soonest', 'price'].includes(sort)) {
      query.sort = sort
    }
    
    // Online mode
    const onlineOnly = searchParams.get('onlineOnly')
    if (onlineOnly === 'true') {
      query.onlineOnly = true
    }
    
    return query
  }, [searchParams])
  
  // Set query parameter in URL
  const setQueryParam = useCallback((key: keyof SearchQuery, value: any) => {
    const currentQuery = deriveQueryFromURL()
    const newQuery = { ...currentQuery, [key]: value }
    
    // Build URL search params
    const params = new URLSearchParams()
    
    if (newQuery.lat !== undefined) params.set('lat', newQuery.lat.toString())
    if (newQuery.lon !== undefined) params.set('lon', newQuery.lon.toString())
    if (newQuery.city) params.set('city', newQuery.city)
    if (newQuery.radius !== undefined) params.set('radius', newQuery.radius.toString())
    if (newQuery.conditions?.length) params.set('conditions', newQuery.conditions.join(','))
    if (newQuery.availability?.length) params.set('availability', newQuery.availability.join(','))
    if (newQuery.practice?.length) params.set('practice', newQuery.practice.join(','))
    if (newQuery.languages?.length) params.set('languages', newQuery.languages.join(','))
    if (newQuery.sort) params.set('sort', newQuery.sort)
    if (newQuery.onlineOnly) params.set('onlineOnly', 'true')
    
    // Update URL
    const newUrl = `/results?${params.toString()}`
    router.replace(newUrl)
  }, [deriveQueryFromURL, router])
  
  // Cancel in-flight requests
  const cancelInFlight = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])
  
  // Perform search with debouncing
  const performSearch = useCallback(async (query: SearchQuery) => {
    // Cancel any existing requests
    cancelInFlight()
    
    // Set loading state
    setState(prev => ({
      ...toObject(prev),
      loading: true,
      error: null,
      query
    }))
    
    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      // Build API request body — normalize extended params to engine inputs
      const practiceType = toArray(query.practice)[0]
      const meetingType = practiceType === 'clinic' ? 'ordinace' 
        : practiceType === 'home' ? 'dojíždění' 
        : practiceType === 'online' ? 'online' 
        : undefined
      const wantsInsurance = query.insurance ? (query.insurance !== 'self-pay') : undefined
      const ageGroup = query.ageGroups as any
      const genderMap: Record<string, 'male'|'female'|'any'> = { muz: 'male', zena: 'female', any: 'any' }
      const therapistGenderPref = (query.therapistGender && genderMap[query.therapistGender]) || undefined

      const requestBody = {
        location: query.lat && query.lon 
          ? { lat: query.lat, lng: query.lon }
          : { cityOrZip: query.city || 'Praha' },
        radiusKm: query.radius || 30,
        // Tags/preferences
        diagnosisTags: toArray(query.conditions),
        language: toArray(query.languages)[0],
        meetingType,
        wantsInsurance,
        ageGroup,
        therapistGenderPref,
        // Keep legacy shape for backward compatibility
        preferences: {
          languages: toArray(query.languages)
        },
        mustHave: {
          practiceType: meetingType ? [meetingType] : undefined
        },
        // Boolean
        onlineOnly: meetingType === 'online' || false,
        page: 1,
        pageSize: 50,
        // Optional diagnosis object if explicitly provided
        diagnosis: query.hasDiagnosis && query.diagnosis ? { canonicalId: query.diagnosis } : undefined
      }
      
      const response = await fetch('/api/searchTherapists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }
      
      // Transform results to match our interface
      const results: SearchResult[] = toArray(data.results).map((item: any) => ({
        id: item.id,
        name: item.name,
        city: item.city,
        distanceKm: item.distanceKm,
        nextAvailableDays: toArray(item.nextAvailableDays),
        conditions: toArray(item.diagnosisTags),
        practiceType: item.practiceType || 'clinic',
        languages: toArray(item.languages),
        priceRange: item.priceRange,
        rating: item.rating,
        score: item.score,
        reasons: toArray(item.reasons)
      }))
      
      // Update state
      setState(prev => ({
        ...toObject(prev),
        loading: false,
        hasResults: results.length > 0,
        empty: results.length === 0,
        results
      }))
      
    } catch (error) {
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      
      setState(prev => ({
        ...toObject(prev),
        loading: false,
        error: errorMessage,
        hasResults: false,
        empty: false
      }))
    }
  }, [cancelInFlight])
  
  // Debounced search effect
  useEffect(() => {
    const query = deriveQueryFromURL()
    
    // Only search if we have meaningful criteria
    if (Object.keys(query).length > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(query)
      }, 300) // 300ms debounce
      
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
      }
    }
  }, [searchParams, performSearch]) // Use searchParams directly instead of deriveQueryFromURL
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelInFlight()
    }
  }, [cancelInFlight])
  
  // Helper functions for common operations
  const expandRadius = useCallback((newRadius: number) => {
    setQueryParam('radius', newRadius)
  }, [setQueryParam])
  
  const toggleOnline = useCallback(() => {
    const currentQuery = deriveQueryFromURL()
    setQueryParam('onlineOnly', !currentQuery.onlineOnly)
  }, [deriveQueryFromURL, setQueryParam])
  
  const updateSort = useCallback((sort: SearchQuery['sort']) => {
    setQueryParam('sort', sort)
  }, [setQueryParam])
  
  const removeFilter = useCallback((key: keyof SearchQuery) => {
    const currentQuery = deriveQueryFromURL()
    const newQuery = { ...currentQuery }
    delete newQuery[key]
    
    // Build URL search params
    const params = new URLSearchParams()
    
    if (newQuery.lat !== undefined) params.set('lat', newQuery.lat.toString())
    if (newQuery.lon !== undefined) params.set('lon', newQuery.lon.toString())
    if (newQuery.city) params.set('city', newQuery.city)
    if (newQuery.radius !== undefined) params.set('radius', newQuery.radius.toString())
    if (newQuery.conditions?.length) params.set('conditions', newQuery.conditions.join(','))
    if (newQuery.availability?.length) params.set('availability', newQuery.availability.join(','))
    if (newQuery.practice?.length) params.set('practice', newQuery.practice.join(','))
    if (newQuery.languages?.length) params.set('languages', newQuery.languages.join(','))
    if (newQuery.sort) params.set('sort', newQuery.sort)
    if (newQuery.onlineOnly) params.set('onlineOnly', 'true')
    
    // Update URL
    const newUrl = `/results?${params.toString()}`
    router.replace(newUrl)
  }, [deriveQueryFromURL, router])
  
  return {
    // State
    ...state,
    
    // Actions
    setQueryParam,
    expandRadius,
    toggleOnline,
    updateSort,
    removeFilter,
    
    // Utilities
    isSearching: state.loading,
    hasError: !!state.error
  }
}