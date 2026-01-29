// Minimal Health Logger for 0-Results Diagnosis
// Part A: Lightweight logging focused on diagnosing zero results without heavy tracing

export interface HealthLogEntry {
  timestamp: number
  queryId: string
  stage: 'search_start' | 'criteria_parsed' | 'geocoding' | 'db_query' | 'filtering' | 'scoring' | 'results_final'
  status: 'ok' | 'warning' | 'error' | 'zero_results'
  message: string
  data: Record<string, any>
}

export interface ZeroResultsHealthCheck {
  queryId: string
  timestamp: number
  criteria: {
    location?: string
    radiusKm?: number
    onlineOnly?: boolean
    mustHave?: Record<string, any>
    prefer?: Record<string, any>
  }
  pipeline: {
    geocodingSuccess: boolean
    coordinatesResolved: boolean
    dbQuerySuccess: boolean
    filtersApplied: number
    therapistsFound: number
    finalResults: number
  }
  diagnosis: {
    likelyCause: string
    confidence: 'high' | 'medium' | 'low'
    suggestions: string[]
  }
}

class MinimalHealthLogger {
  private logs: HealthLogEntry[] = []
  private zeroResultsChecks: ZeroResultsHealthCheck[] = []
  private maxLogs = 1000 // Keep only recent logs
  private maxZeroResults = 100 // Keep recent zero results for analysis

  // Log a health event
  logHealth(
    queryId: string,
    stage: HealthLogEntry['stage'],
    status: HealthLogEntry['status'],
    message: string,
    data: Record<string, any> = {}
  ): void {
    const entry: HealthLogEntry = {
      timestamp: Date.now(),
      queryId,
      stage,
      status,
      message,
      data
    }

    this.logs.push(entry)

    // Trim logs if too many
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console log for immediate debugging
    this.logToConsole(entry)
  }

  // Perform zero results health check
  performZeroResultsHealthCheck(
    queryId: string,
    criteria: ZeroResultsHealthCheck['criteria'],
    pipeline: ZeroResultsHealthCheck['pipeline']
  ): ZeroResultsHealthCheck {
    const diagnosis = this.diagnoseZeroResults(criteria, pipeline)
    
    const healthCheck: ZeroResultsHealthCheck = {
      queryId,
      timestamp: Date.now(),
      criteria,
      pipeline,
      diagnosis
    }

    this.zeroResultsChecks.push(healthCheck)

    // Trim if too many
    if (this.zeroResultsChecks.length > this.maxZeroResults) {
      this.zeroResultsChecks = this.zeroResultsChecks.slice(-this.maxZeroResults)
    }

    // Log the health check
    this.logHealth(
      queryId,
      'results_final',
      'zero_results',
      `Zero results diagnosed: ${diagnosis.likelyCause}`,
      { healthCheck }
    )

    return healthCheck
  }

  // Diagnose zero results based on pipeline data
  private diagnoseZeroResults(
    criteria: ZeroResultsHealthCheck['criteria'],
    pipeline: ZeroResultsHealthCheck['pipeline']
  ): ZeroResultsHealthCheck['diagnosis'] {
    const suggestions: string[] = []
    let likelyCause = 'unknown'
    let confidence: 'high' | 'medium' | 'low' = 'low'

    // Check geocoding issues
    if (!pipeline.geocodingSuccess) {
      likelyCause = 'geocoding_failed'
      confidence = 'high'
      suggestions.push('Check location input format')
      suggestions.push('Try different location name')
    }
    // Check coordinate resolution
    else if (!pipeline.coordinatesResolved) {
      likelyCause = 'coordinates_not_resolved'
      confidence = 'high'
      suggestions.push('Location not found in database')
      suggestions.push('Try nearby city or postal code')
    }
    // Check database query
    else if (!pipeline.dbQuerySuccess) {
      likelyCause = 'database_query_failed'
      confidence = 'high'
      suggestions.push('Database connection issue')
      suggestions.push('Try again in a moment')
    }
    // Check if filters are too restrictive
    else if (pipeline.therapistsFound > 0 && pipeline.finalResults === 0) {
      likelyCause = 'filters_too_restrictive'
      confidence = 'high'
      suggestions.push('Relax search criteria')
      suggestions.push('Remove some must-have requirements')
      suggestions.push('Increase search radius')
    }
    // Check if no therapists in area
    else if (pipeline.therapistsFound === 0) {
      likelyCause = 'no_therapists_in_area'
      confidence = 'medium'
      suggestions.push('Try larger search radius')
      suggestions.push('Check nearby cities')
      suggestions.push('Consider online therapy option')
    }
    // Check radius issues
    else if (criteria.radiusKm && criteria.radiusKm < 10) {
      likelyCause = 'radius_too_small'
      confidence = 'medium'
      suggestions.push('Increase search radius to at least 10km')
    }
    // Check online mode
    else if (criteria.onlineOnly && pipeline.finalResults === 0) {
      likelyCause = 'no_online_therapists'
      confidence = 'medium'
      suggestions.push('Try local therapists instead')
      suggestions.push('Check if online option is available')
    }

    return {
      likelyCause,
      confidence,
      suggestions
    }
  }

  // Console logging with minimal format
  private logToConsole(entry: HealthLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const statusIcon = this.getStatusIcon(entry.status)
    
    console.log(
      `[${timestamp}] ${statusIcon} ${entry.stage}: ${entry.message}`,
      entry.data
    )
  }

  private getStatusIcon(status: HealthLogEntry['status']): string {
    switch (status) {
      case 'ok': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'zero_results': return '🔍'
      default: return 'ℹ️'
    }
  }

  // Get recent zero results for analysis
  getRecentZeroResults(limit: number = 10): ZeroResultsHealthCheck[] {
    return this.zeroResultsChecks.slice(-limit)
  }

  // Get health summary for debugging
  getHealthSummary(): {
    totalLogs: number
    recentZeroResults: number
    commonCauses: Record<string, number>
    lastHealthCheck?: ZeroResultsHealthCheck
  } {
    const recentZeroResults = this.zeroResultsChecks.slice(-24) // Last 24 checks
    const commonCauses: Record<string, number> = {}

    recentZeroResults.forEach(check => {
      const cause = check.diagnosis.likelyCause
      commonCauses[cause] = (commonCauses[cause] || 0) + 1
    })

    return {
      totalLogs: this.logs.length,
      recentZeroResults: recentZeroResults.length,
      commonCauses,
      lastHealthCheck: this.zeroResultsChecks[this.zeroResultsChecks.length - 1]
    }
  }

  // Clear all logs (for testing)
  clearLogs(): void {
    this.logs = []
    this.zeroResultsChecks = []
  }
}

// Global instance
export const healthLogger = new MinimalHealthLogger()

// Helper functions for common logging patterns
export const logSearchStart = (queryId: string, criteria: any) => {
  healthLogger.logHealth(
    queryId,
    'search_start',
    'ok',
    'Search initiated',
    { criteria: Object.keys(criteria) }
  )
}

export const logGeocoding = (queryId: string, success: boolean, location?: string) => {
  healthLogger.logHealth(
    queryId,
    'geocoding',
    success ? 'ok' : 'error',
    success ? 'Location geocoded successfully' : 'Geocoding failed',
    { location, success }
  )
}

export const logDbQuery = (queryId: string, success: boolean, therapistsFound: number) => {
  healthLogger.logHealth(
    queryId,
    'db_query',
    success ? 'ok' : 'error',
    success ? `Found ${therapistsFound} therapists` : 'Database query failed',
    { therapistsFound, success }
  )
}

export const logFiltering = (queryId: string, therapistsBefore: number, therapistsAfter: number) => {
  const filtered = therapistsBefore - therapistsAfter
  healthLogger.logHealth(
    queryId,
    'filtering',
    therapistsAfter > 0 ? 'ok' : 'warning',
    `Filtered ${filtered} therapists, ${therapistsAfter} remaining`,
    { therapistsBefore, therapistsAfter, filtered }
  )
}

export const logZeroResults = (
  queryId: string,
  criteria: any,
  pipeline: ZeroResultsHealthCheck['pipeline']
) => {
  return healthLogger.performZeroResultsHealthCheck(queryId, criteria, pipeline)
}

export const getHealthSummary = () => healthLogger.getHealthSummary()
export const getRecentZeroResults = (limit?: number) => healthLogger.getRecentZeroResults(limit)

// Console debugging helper
export const logHealthSummary = () => {
  const summary = healthLogger.getHealthSummary()
  const recentZeroResults = healthLogger.getRecentZeroResults(5)
  
  console.group('🔍 Search Health Summary')
  console.log(`Total logs: ${summary.totalLogs}`)
  console.log(`Recent zero results: ${summary.recentZeroResults}`)
  
  if (Object.keys(summary.commonCauses).length > 0) {
    console.log('Common zero result causes:')
    Object.entries(summary.commonCauses)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cause, count]) => {
        console.log(`  ${cause}: ${count} times`)
      })
  }
  
  if (summary.lastHealthCheck) {
    console.log('Last zero results check:')
    console.log(`  Query ID: ${summary.lastHealthCheck.queryId}`)
    console.log(`  Likely cause: ${summary.lastHealthCheck.diagnosis.likelyCause}`)
    console.log(`  Confidence: ${summary.lastHealthCheck.diagnosis.confidence}`)
    console.log(`  Suggestions: ${summary.lastHealthCheck.diagnosis.suggestions.join(', ')}`)
  }
  
  if (recentZeroResults.length > 0) {
    console.log('Recent zero results:')
    recentZeroResults.forEach((check, index) => {
      console.log(`  ${index + 1}. ${check.diagnosis.likelyCause} (${check.diagnosis.confidence})`)
    })
  }
  
  console.groupEnd()
}

// Make health summary available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).searchHealth = {
    summary: getHealthSummary,
    recentZeroResults: getRecentZeroResults,
    logSummary: logHealthSummary,
    clearLogs: () => healthLogger.clearLogs()
  }
}
