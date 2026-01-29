'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { searchService, SearchCriteria } from '@/lib/utils/enhanced-search-service'

export interface UrlStateManagerOptions {
  syncOnMount?: boolean
  updateUrlOnChange?: boolean
  debounceUrlUpdates?: boolean
  debounceMs?: number
}

export function useUrlStateManager(options: UrlStateManagerOptions = {}) {
  const { 
    syncOnMount = true, 
    updateUrlOnChange = true, 
    debounceUrlUpdates = false,
    debounceMs = 100 
  } = options
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUpdatingRef = useRef(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUrlUpdateRef = useRef<string>('')
  
  // Parse current URL parameters into search criteria
  const getCurrentCriteria = useCallback((): SearchCriteria => {
    return searchService.parseUrlCriteria(searchParams)
  }, [searchParams])
  
  // Enhanced URL update with debouncing and duplicate prevention
  const updateUrl = useCallback((criteria: SearchCriteria) => {
    if (isUpdatingRef.current) return
    
    const newUrl = searchService.buildUrlParams(criteria).toString()
    const fullUrl = newUrl ? `${window.location.pathname}?${newUrl}` : window.location.pathname
    
    // Prevent duplicate URL updates
    if (fullUrl === lastUrlUpdateRef.current) {
      return
    }
    
    lastUrlUpdateRef.current = fullUrl
    
    if (debounceUrlUpdates) {
      // Cancel previous debounced update
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      // Set up debounced update
      debounceTimeoutRef.current = setTimeout(() => {
        isUpdatingRef.current = true
        try {
          searchService.updateUrl(criteria, router)
        } finally {
          setTimeout(() => {
            isUpdatingRef.current = false
          }, 50)
        }
      }, debounceMs)
    } else {
      // Immediate update
      isUpdatingRef.current = true
      try {
        searchService.updateUrl(criteria, router)
      } finally {
        setTimeout(() => {
          isUpdatingRef.current = false
        }, 50)
      }
    }
  }, [router, debounceUrlUpdates, debounceMs])
  
  // Update specific criteria fields
  const updateCriteriaField = useCallback((
    field: keyof SearchCriteria, 
    value: any, 
    currentCriteria: SearchCriteria
  ) => {
    const newCriteria = { ...currentCriteria, [field]: value }
    updateUrl(newCriteria)
    return newCriteria
  }, [updateUrl])
  
  // Update array fields (add/remove items)
  const updateArrayField = useCallback((
    field: keyof SearchCriteria,
    action: 'add' | 'remove' | 'set',
    value: string | string[],
    currentCriteria: SearchCriteria
  ) => {
    const currentArray = (currentCriteria[field] as string[]) || []
    let newArray: string[]
    
    switch (action) {
      case 'add':
        const addValue = Array.isArray(value) ? value : [value]
        newArray = [...new Set([...currentArray, ...addValue])]
        break
      case 'remove':
        const removeValue = Array.isArray(value) ? value : [value]
        newArray = currentArray.filter(item => !removeValue.includes(item))
        break
      case 'set':
        newArray = Array.isArray(value) ? value : [value]
        break
      default:
        newArray = currentArray
    }
    
    const newCriteria = { ...currentCriteria, [field]: newArray.length > 0 ? newArray : undefined }
    updateUrl(newCriteria)
    return newCriteria
  }, [updateUrl])
  
  // Toggle boolean fields
  const toggleBooleanField = useCallback((
    field: keyof SearchCriteria,
    currentCriteria: SearchCriteria
  ) => {
    const currentValue = currentCriteria[field] as boolean
    const newCriteria = { ...currentCriteria, [field]: !currentValue }
    updateUrl(newCriteria)
    return newCriteria
  }, [updateUrl])
  
  // Clear specific fields
  const clearField = useCallback((
    field: keyof SearchCriteria,
    currentCriteria: SearchCriteria
  ) => {
    const newCriteria = { ...currentCriteria, [field]: undefined }
    updateUrl(newCriteria)
    return newCriteria
  }, [updateUrl])
  
  // Clear all filters (keep location)
  const clearFilters = useCallback((currentCriteria: SearchCriteria) => {
    const newCriteria: SearchCriteria = {
      lat: currentCriteria.lat,
      lon: currentCriteria.lon,
      city: currentCriteria.city,
      maxKm: currentCriteria.maxKm
    }
    updateUrl(newCriteria)
    return newCriteria
  }, [updateUrl])
  
  // Reset to default state
  const resetToDefaults = useCallback(() => {
    const defaultCriteria: SearchCriteria = {
      maxKm: 30
    }
    updateUrl(defaultCriteria)
    return defaultCriteria
  }, [updateUrl])
  
  // Get URL string for current criteria
  const getUrlString = useCallback((criteria: SearchCriteria): string => {
    const params = searchService.buildUrlParams(criteria)
    return params.toString() ? `?${params.toString()}` : ''
  }, [])
  
  // Check if URL has changed (useful for detecting external navigation)
  const hasUrlChanged = useCallback((previousUrl: string): boolean => {
    const currentUrl = window.location.search
    return currentUrl !== previousUrl
  }, [])
  
  // Listen for URL changes (browser back/forward)
  useEffect(() => {
    if (!syncOnMount) return
    
    const handlePopState = () => {
      // URL changed via browser navigation
      // This will trigger a re-render with new searchParams
      lastUrlUpdateRef.current = window.location.href
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [syncOnMount])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    // Current state
    getCurrentCriteria,
    getUrlString,
    hasUrlChanged,
    
    // Update methods
    updateUrl,
    updateCriteriaField,
    updateArrayField,
    toggleBooleanField,
    clearField,
    clearFilters,
    resetToDefaults,
    
    // Utilities
    isUpdating: isUpdatingRef.current,
    isDebouncing: !!debounceTimeoutRef.current,
    lastUrl: lastUrlUpdateRef.current
  }
}


