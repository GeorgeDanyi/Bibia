// Comprehensive failure visibility system for search operations

export interface FailureReason {
  code: string
  message: string
  userMessage: string
  technicalDetails: string
  recoverable: boolean
  suggestedActions: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  stage: 'url' | 'orchestrator' | 'api' | 'data' | 'ui'
  timestamp: number
  traceId?: string
  queryId?: string
}

export interface ZeroResultAnalysis {
  queryId: string
  traceId: string
  timestamp: number
  location: {
    type: 'gps' | 'city' | 'zip'
    value: string
    coordinates?: { lat: number; lng: number }
    confidence?: number
    source?: string
  }
  radiusKm: number
  mustHaveFilters: {
    diagnosis?: string[]
    practiceType?: string[]
    languages?: string[]
  }
  preferences: {
    distance?: boolean
    price?: boolean
    availability?: boolean
    expertEvenIfFarther?: boolean
  }
  fallbackAttempts: Array<{
    radiusKm: number
    resultsFound: number
    reason: string
    timestamp: number
  }>
  possibleReasons: string[]
  suggestedActions: string[]
  dataQualityIssues: string[]
  coverageGaps: string[]
  // Enhanced root cause analysis
  rootCause: 'geocoding_failed' | 'coordinate_resolution_failed' | 'db_filter_too_restrictive' | 'no_therapists_in_area' | 'ui_state_issue' | 'data_quality_issue' | 'api_error' | 'unknown'
  pipelineAnalysis: {
    geocodingSuccess: boolean
    coordinateResolutionSuccess: boolean
    dbFilteringSuccess: boolean
    uiStateSuccess: boolean
    failureStage?: 'geocoding' | 'coordinate_resolution' | 'db_filtering' | 'ui_rendering' | 'api_call'
    totalTherapistsInDatabase: number
    therapistsAfterGeocoding: number
    therapistsAfterFilters: number
    therapistsAfterScoring: number
  }
  alertRequired: boolean
  alertType: 'geocoding' | 'coordinate' | 'db_filter' | 'ui_state' | 'general'
  userMessage: string
  technicalDetails: string
}

export interface SearchFailure {
  queryId: string
  traceId: string
  timestamp: number
  stage: FailureReason['stage']
  error: string
  stack?: string
  userMessage: string
  technicalDetails: string
  recoverable: boolean
  suggestedActions: string[]
  severity: FailureReason['severity']
  context: {
    url?: string
    criteria?: any
    apiEndpoint?: string
    statusCode?: number
    responseTime?: number
  }
}

class FailureVisibilitySystem {
  private failures: Map<string, SearchFailure> = new Map()
  private zeroResults: Map<string, ZeroResultAnalysis> = new Map()
  private failureReasons: Map<string, FailureReason> = new Map()
  private maxFailures = 1000

  // Record a search failure
  recordFailure(failure: Omit<SearchFailure, 'timestamp'>): string {
    const failureId = `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullFailure: SearchFailure = {
      ...failure,
      timestamp: Date.now()
    }

    this.failures.set(failureId, fullFailure)
    this.logFailure(fullFailure)
    this.persistFailures()

    return failureId
  }

  // Record zero results with analysis
  recordZeroResults(analysis: Omit<ZeroResultAnalysis, 'timestamp'>): string {
    const zeroResultId = `zero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullAnalysis: ZeroResultAnalysis = {
      ...analysis,
      timestamp: Date.now()
    }

    this.zeroResults.set(zeroResultId, fullAnalysis)
    this.logZeroResults(fullAnalysis)
    this.persistZeroResults()

    return zeroResultId
  }

  // Analyze zero results and provide insights
  analyzeZeroResults(
    queryId: string, 
    traceId: string, 
    location: any, 
    radiusKm: number, 
    mustHave: any, 
    prefer: any, 
    fallbackAttempts: any[],
    pipelineData?: {
      geocodingSuccess?: boolean
      coordinateResolutionSuccess?: boolean
      totalTherapistsInDatabase?: number
      therapistsAfterGeocoding?: number
      therapistsAfterFilters?: number
      therapistsAfterScoring?: number
      uiState?: 'loading' | 'hasResults' | 'empty' | 'error'
    }
  ): ZeroResultAnalysis {
    const possibleReasons: string[] = []
    const suggestedActions: string[] = []
    const dataQualityIssues: string[] = []
    const coverageGaps: string[] = []

    // Enhanced root cause analysis
    let rootCause: ZeroResultAnalysis['rootCause'] = 'unknown'
    let alertRequired = false
    let alertType: ZeroResultAnalysis['alertType'] = 'general'
    let userMessage = 'Nebyly nalezeny žádné výsledky.'
    let technicalDetails = 'Zero results analysis'
    let failureStage: ZeroResultAnalysis['pipelineAnalysis']['failureStage']

    // Analyze geocoding issues
    if (location.type === 'city' && !location.coordinates) {
      rootCause = 'geocoding_failed'
      alertRequired = true
      alertType = 'geocoding'
      failureStage = 'geocoding'
      userMessage = `Nepodařilo se najít souřadnice pro "${location.value}". Zkuste zadat přesnější adresu.`
      technicalDetails = `Geocoding failed for location: ${location.value}`
      possibleReasons.push('Location could not be geocoded accurately')
      suggestedActions.push('Try entering a more specific address or postal code')
      dataQualityIssues.push('Geocoding failed for location')
    } else if (location.confidence && location.confidence < 0.6) {
      rootCause = 'coordinate_resolution_failed'
      alertRequired = true
      alertType = 'coordinate'
      failureStage = 'coordinate_resolution'
      userMessage = `Nízká přesnost polohy pro "${location.value}" (${Math.round(location.confidence * 100)}%). Zkuste zadat přesnější adresu.`
      technicalDetails = `Low coordinate confidence: ${location.confidence} for ${location.value}`
      possibleReasons.push('Location coordinates have low confidence')
      suggestedActions.push('Try entering a more specific address or use GPS')
      dataQualityIssues.push('Low confidence geocoding')
    }

    // Analyze radius
    if (radiusKm < 10) {
      possibleReasons.push('Search radius is very small')
      suggestedActions.push('Try expanding the search radius to 20-30km')
      coverageGaps.push('Small radius may not cover enough area')
    } else if (radiusKm > 100) {
      possibleReasons.push('Search radius is very large but still no results')
      suggestedActions.push('Check if the location is correct or try a different area')
      dataQualityIssues.push('Large radius with zero results suggests data coverage issues')
    }

    // Analyze DB filtering issues
    if (pipelineData) {
      const { 
        totalTherapistsInDatabase = 0,
        therapistsAfterGeocoding = 0,
        therapistsAfterFilters = 0,
        therapistsAfterScoring = 0,
        geocodingSuccess = true,
        coordinateResolutionSuccess = true,
        uiState = 'empty'
      } = pipelineData

      // Check if DB filtering is too restrictive
      if (totalTherapistsInDatabase > 0 && therapistsAfterFilters === 0 && therapistsAfterGeocoding > 0) {
        rootCause = 'db_filter_too_restrictive'
        alertRequired = true
        alertType = 'db_filter'
        failureStage = 'db_filtering'
        userMessage = 'Filtry jsou příliš omezující. Zkuste odstranit některé filtry.'
        technicalDetails = `DB filtering eliminated all ${therapistsAfterGeocoding} therapists`
        possibleReasons.push('Database filters are too restrictive')
        suggestedActions.push('Remove some must-have filters', 'Try different filter combinations')
        dataQualityIssues.push('Filters too restrictive for available data')
      }

      // Check UI state issues
      if (uiState === 'error') {
        rootCause = 'ui_state_issue'
        alertRequired = true
        alertType = 'ui_state'
        failureStage = 'ui_rendering'
        userMessage = 'Chyba při zobrazování výsledků. Zkuste to prosím znovu.'
        technicalDetails = 'UI state is error - rendering failed'
        possibleReasons.push('UI rendering failed')
        suggestedActions.push('Refresh the page', 'Try a different search')
        dataQualityIssues.push('UI state error')
      }
    }

    // Analyze must-have filters
    if (mustHave.diagnosis && mustHave.diagnosis.length > 0) {
      const rareDiagnoses = ['ADHD', 'Autism', 'Bipolar', 'Schizophrenia', 'OCD']
      const hasRareDiagnosis = mustHave.diagnosis.some((d: string) => 
        rareDiagnoses.some(rare => d.toLowerCase().includes(rare.toLowerCase()))
      )
      
      if (hasRareDiagnosis) {
        if (rootCause === 'unknown') {
          rootCause = 'db_filter_too_restrictive'
          alertRequired = true
          alertType = 'db_filter'
        }
        possibleReasons.push('Searching for rare or specialized diagnoses')
        suggestedActions.push('Try expanding radius or removing some diagnosis filters')
        coverageGaps.push('Limited specialists for rare conditions')
      }
    }

    if (mustHave.languages && mustHave.languages.length > 0) {
      const uncommonLanguages = ['en', 'de', 'fr', 'es', 'it']
      const hasUncommonLanguage = mustHave.languages.some((lang: string) => 
        uncommonLanguages.includes(lang.toLowerCase())
      )
      
      if (hasUncommonLanguage) {
        possibleReasons.push('Searching for therapists in uncommon languages')
        suggestedActions.push('Try removing language filters or expanding search area')
        coverageGaps.push('Limited therapists speaking uncommon languages')
      }
    }

    if (mustHave.practiceType && mustHave.practiceType.includes('online')) {
      possibleReasons.push('Online-only search with no results')
      suggestedActions.push('Try searching without online-only filter')
      dataQualityIssues.push('Online therapist data may be incomplete')
    }

    // Analyze preferences
    if (prefer.expertEvenIfFarther) {
      possibleReasons.push('Expert preference may be too restrictive')
      suggestedActions.push('Try searching without expert preference')
      coverageGaps.push('Limited expert therapists in area')
    }

    // Analyze fallback attempts
    if (fallbackAttempts.length > 0) {
      const maxRadius = Math.max(...fallbackAttempts.map(f => f.radiusKm))
      if (maxRadius > 100) {
        possibleReasons.push('Even with large radius expansion, no results found')
        suggestedActions.push('Try different location or remove some filters')
        dataQualityIssues.push('Data coverage gap in this area')
      }
    }

    // Default suggestions if no specific issues found
    if (possibleReasons.length === 0) {
      if (rootCause === 'unknown') {
        rootCause = 'no_therapists_in_area'
        alertRequired = true
        alertType = 'general'
        userMessage = 'V této oblasti nejsou k dispozici žádní terapeuti. Zkuste rozšířit vyhledávání.'
        technicalDetails = 'No therapists found in the specified area'
      }
      possibleReasons.push('No therapists match the current search criteria')
      suggestedActions.push('Try expanding the search radius', 'Remove some filters', 'Try a different location')
    }

    return {
      queryId,
      traceId,
      timestamp: Date.now(),
      location,
      radiusKm,
      mustHaveFilters: mustHave,
      preferences: prefer,
      fallbackAttempts,
      possibleReasons,
      suggestedActions,
      dataQualityIssues,
      coverageGaps,
      rootCause,
      pipelineAnalysis: {
        geocodingSuccess: pipelineData?.geocodingSuccess ?? true,
        coordinateResolutionSuccess: pipelineData?.coordinateResolutionSuccess ?? true,
        dbFilteringSuccess: pipelineData ? ((pipelineData.therapistsAfterFilters ?? 0) > 0) : true,
        uiStateSuccess: pipelineData?.uiState !== 'error',
        failureStage,
        totalTherapistsInDatabase: pipelineData?.totalTherapistsInDatabase ?? 0,
        therapistsAfterGeocoding: pipelineData?.therapistsAfterGeocoding ?? 0,
        therapistsAfterFilters: pipelineData?.therapistsAfterFilters ?? 0,
        therapistsAfterScoring: pipelineData?.therapistsAfterScoring ?? 0
      },
      alertRequired,
      alertType,
      userMessage,
      technicalDetails
    }
  }

  // Get failure statistics
  getFailureStats(): {
    totalFailures: number
    failuresByStage: Record<string, number>
    failuresBySeverity: Record<string, number>
    recoverableFailures: number
    criticalFailures: number
    avgFailuresPerHour: number
    topFailureReasons: Array<{ reason: string; count: number }>
  } {
    const failures = Array.from(this.failures.values())
    const totalFailures = failures.length

    const failuresByStage = failures.reduce((acc, f) => {
      acc[f.stage] = (acc[f.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const failuresBySeverity = failures.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recoverableFailures = failures.filter(f => f.recoverable).length
    const criticalFailures = failures.filter(f => f.severity === 'critical').length

    // Calculate average failures per hour (last 24 hours)
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000)
    const recentFailures = failures.filter(f => f.timestamp > last24Hours)
    const avgFailuresPerHour = recentFailures.length / 24

    // Top failure reasons
    const reasonCounts = new Map<string, number>()
    failures.forEach(f => {
      const reason = f.error.split(':')[0] // Get first part of error
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
    })

    const topFailureReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalFailures,
      failuresByStage,
      failuresBySeverity,
      recoverableFailures,
      criticalFailures,
      avgFailuresPerHour,
      topFailureReasons
    }
  }

  // Get zero results statistics
  getZeroResultsStats(): {
    totalZeroResults: number
    zeroResultsByLocation: Array<{ location: string; count: number }>
    zeroResultsByRadius: Array<{ radius: string; count: number }>
    commonZeroResultPatterns: Array<{ pattern: string; count: number }>
    fallbackSuccessRate: number
    avgFallbackRadius: number
  } {
    const zeroResults = Array.from(this.zeroResults.values())
    const totalZeroResults = zeroResults.length

    // Zero results by location
    const locationCounts = new Map<string, number>()
    zeroResults.forEach(zr => {
      const locationKey = `${zr.location.type}:${zr.location.value}`
      locationCounts.set(locationKey, (locationCounts.get(locationKey) || 0) + 1)
    })

    const zeroResultsByLocation = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Zero results by radius
    const radiusCounts = new Map<string, number>()
    zeroResults.forEach(zr => {
      const radiusKey = `${zr.radiusKm}km`
      radiusCounts.set(radiusKey, (radiusCounts.get(radiusKey) || 0) + 1)
    })

    const zeroResultsByRadius = Array.from(radiusCounts.entries())
      .map(([radius, count]) => ({ radius, count }))
      .sort((a, b) => b.count - a.count)

    // Common patterns
    const patternCounts = new Map<string, number>()
    zeroResults.forEach(zr => {
      const pattern = JSON.stringify({
        diagnosis: zr.mustHaveFilters.diagnosis?.length || 0,
        languages: zr.mustHaveFilters.languages?.length || 0,
        practiceType: zr.mustHaveFilters.practiceType?.length || 0
      })
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
    })

    const commonZeroResultPatterns = Array.from(patternCounts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Fallback analysis
    const withFallbacks = zeroResults.filter(zr => zr.fallbackAttempts.length > 0)
    const fallbackSuccessRate = withFallbacks.length > 0
      ? withFallbacks.filter(zr => zr.fallbackAttempts.some(f => f.resultsFound > 0)).length / withFallbacks.length
      : 0

    const avgFallbackRadius = withFallbacks.length > 0
      ? withFallbacks.reduce((sum, zr) => {
          const maxRadius = Math.max(...zr.fallbackAttempts.map(f => f.radiusKm))
          return sum + maxRadius
        }, 0) / withFallbacks.length
      : 0

    return {
      totalZeroResults,
      zeroResultsByLocation,
      zeroResultsByRadius,
      commonZeroResultPatterns,
      fallbackSuccessRate,
      avgFallbackRadius
    }
  }

  // Get recent failures (last hour)
  getRecentFailures(): SearchFailure[] {
    const lastHour = Date.now() - (60 * 60 * 1000)
    return Array.from(this.failures.values())
      .filter(f => f.timestamp > lastHour)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Get recent zero results (last hour)
  getRecentZeroResults(): ZeroResultAnalysis[] {
    const lastHour = Date.now() - (60 * 60 * 1000)
    return Array.from(this.zeroResults.values())
      .filter(zr => zr.timestamp > lastHour)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Export all data
  exportData(): {
    failures: SearchFailure[]
    zeroResults: ZeroResultAnalysis[]
    failureStats: ReturnType<FailureVisibilitySystem['getFailureStats']>
    zeroResultsStats: ReturnType<FailureVisibilitySystem['getZeroResultsStats']>
    exportTimestamp: number
  } {
    return {
      failures: Array.from(this.failures.values()),
      zeroResults: Array.from(this.zeroResults.values()),
      failureStats: this.getFailureStats(),
      zeroResultsStats: this.getZeroResultsStats(),
      exportTimestamp: Date.now()
    }
  }

  // Clear all data
  clearData(): void {
    this.failures.clear()
    this.zeroResults.clear()
    this.failureReasons.clear()
  }

  // Private helper methods
  private logFailure(failure: SearchFailure): void {
    const timestamp = new Date(failure.timestamp).toISOString()
    const severity = failure.severity.toUpperCase()
    const stage = failure.stage.toUpperCase()
    
    console.error(`[${timestamp}] [FAILURE:${severity}] [${stage}] ${failure.error}:`, {
      queryId: failure.queryId,
      traceId: failure.traceId,
      userMessage: failure.userMessage,
      recoverable: failure.recoverable,
      suggestedActions: failure.suggestedActions,
      context: failure.context
    })

    // Alert on critical failures
    if (failure.severity === 'critical') {
      console.error('🚨 CRITICAL SEARCH FAILURE:', {
        queryId: failure.queryId,
        stage: failure.stage,
        error: failure.error,
        userMessage: failure.userMessage
      })
    }
  }

  private logZeroResults(analysis: ZeroResultAnalysis): void {
    const timestamp = new Date(analysis.timestamp).toISOString()
    
    console.warn(`[${timestamp}] [ZERO_RESULTS] Query ${analysis.queryId}:`, {
      location: analysis.location,
      radius: analysis.radiusKm,
      possibleReasons: analysis.possibleReasons,
      suggestedActions: analysis.suggestedActions,
      dataQualityIssues: analysis.dataQualityIssues,
      coverageGaps: analysis.coverageGaps
    })
  }

  private persistFailures(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.failures.values()).slice(-100) // Keep last 100
      localStorage.setItem('bibia_search_failures', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist failures:', error)
    }
  }

  private persistZeroResults(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.zeroResults.values()).slice(-100) // Keep last 100
      localStorage.setItem('bibia_zero_results', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist zero results:', error)
    }
  }
}

// Global failure visibility system instance
export const failureVisibility = new FailureVisibilitySystem()

// Helper functions
export const recordSearchFailure = (failure: Omit<SearchFailure, 'timestamp'>) => {
  return failureVisibility.recordFailure(failure)
}

export const recordZeroResults = (analysis: Omit<ZeroResultAnalysis, 'timestamp'>) => {
  return failureVisibility.recordZeroResults(analysis)
}

export const analyzeZeroResults = (queryId: string, traceId: string, location: any, radiusKm: number, mustHave: any, prefer: any, fallbackAttempts: any[]) => {
  return failureVisibility.analyzeZeroResults(queryId, traceId, location, radiusKm, mustHave, prefer, fallbackAttempts)
}
