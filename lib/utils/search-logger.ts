// Append-only search logging system for relevance tuning and quality analysis

export interface SearchLogEntry {
  queryId: string
  timestamp: number
  location: {
    type: 'gps' | 'city' | 'zip'
    value: string
    coordinates?: { lat: number; lng: number }
  }
  radiusKmRequested: number
  radiusKmUsed: number
  mustHave: {
    diagnosis?: string[]
    practiceType?: string[]
    languages?: string[]
  }
  prefer: {
    distance?: boolean
    price?: boolean
    availability?: boolean
    expertEvenIfFarther?: boolean
  }
  top3Ids: string[]
  resultsCount: number
  processingTimeMs: number
  fallbackUsed: boolean
  fallbackReason?: string
  quality: {
    topScore: number
    avgScore: number
    scoreDistribution: { [range: string]: number }
  }
  userAgent?: string
  sessionId?: string
}

export interface ZeroResultQuery {
  queryId: string
  timestamp: number
  location: SearchLogEntry['location']
  radiusKmRequested: number
  mustHave: SearchLogEntry['mustHave']
  prefer: SearchLogEntry['prefer']
  fallbackExpansions: {
    radiusKm: number
    resultsFound: number
    reason: string
  }[]
  finalResultsCount: number
  processingTimeMs: number
}

class SearchLogger {
  private logs: SearchLogEntry[] = []
  private zeroResultQueries: ZeroResultQuery[] = []
  private maxLogs = 10000 // Keep last 10k searches in memory

  // Log a search query
  logSearch(entry: Omit<SearchLogEntry, 'timestamp'>): void {
    const logEntry: SearchLogEntry = {
      ...entry,
      timestamp: Date.now()
    }

    // Add to logs
    this.logs.push(logEntry)
    
    // Trim if too many logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Check for zero results
    if (entry.resultsCount === 0) {
      this.logZeroResultQuery(logEntry)
    }

    // Log to console for debugging
    this.logToConsole(logEntry)

    // Store in localStorage for persistence
    this.persistLogs()
  }

  // Log zero result queries separately for analysis
  private logZeroResultQuery(entry: SearchLogEntry): void {
    const zeroResultQuery: ZeroResultQuery = {
      queryId: entry.queryId,
      timestamp: entry.timestamp,
      location: entry.location,
      radiusKmRequested: entry.radiusKmRequested,
      mustHave: entry.mustHave,
      prefer: entry.prefer,
      fallbackExpansions: entry.fallbackUsed ? [{
        radiusKm: entry.radiusKmUsed,
        resultsFound: entry.resultsCount,
        reason: entry.fallbackReason || 'No results in requested radius'
      }] : [],
      finalResultsCount: entry.resultsCount,
      processingTimeMs: entry.processingTimeMs
    }

    this.zeroResultQueries.push(zeroResultQuery)

    // Trim if too many
    if (this.zeroResultQueries.length > 1000) {
      this.zeroResultQueries = this.zeroResultQueries.slice(-1000)
    }
  }

  // Console logging with structured format
  private logToConsole(entry: SearchLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [SEARCH_LOG]`
    
    console.log(`${prefix} Query ${entry.queryId}:`, {
      location: entry.location,
      radius: `${entry.radiusKmRequested}km → ${entry.radiusKmUsed}km`,
      results: entry.resultsCount,
      top3: entry.top3Ids,
      quality: {
        topScore: entry.quality.topScore,
        avgScore: entry.quality.avgScore
      },
      fallback: entry.fallbackUsed ? entry.fallbackReason : 'none'
    })
  }

  // Persist logs to localStorage
  private persistLogs(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        logs: this.logs.slice(-1000), // Keep last 1000 in localStorage
        zeroResultQueries: this.zeroResultQueries.slice(-100), // Keep last 100 zero results
        lastUpdated: Date.now()
      }
      localStorage.setItem('bibia_search_logs', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist search logs:', error)
    }
  }

  // Load logs from localStorage
  loadPersistedLogs(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('bibia_search_logs')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.logs && Array.isArray(data.logs)) {
          this.logs = data.logs
        }
        if (data.zeroResultQueries && Array.isArray(data.zeroResultQueries)) {
          this.zeroResultQueries = data.zeroResultQueries
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted search logs:', error)
    }
  }

  // Get search statistics
  getSearchStats(): {
    totalSearches: number
    zeroResultSearches: number
    avgResultsPerSearch: number
    avgProcessingTime: number
    fallbackUsageRate: number
    topLocations: { location: string; count: number }[]
    commonMustHaveFilters: { filter: string; count: number }[]
  } {
    const totalSearches = this.logs.length
    const zeroResultSearches = this.zeroResultQueries.length
    const avgResultsPerSearch = totalSearches > 0 
      ? this.logs.reduce((sum, log) => sum + log.resultsCount, 0) / totalSearches 
      : 0
    const avgProcessingTime = totalSearches > 0
      ? this.logs.reduce((sum, log) => sum + log.processingTimeMs, 0) / totalSearches
      : 0
    const fallbackUsageRate = totalSearches > 0
      ? this.logs.filter(log => log.fallbackUsed).length / totalSearches
      : 0

    // Top locations
    const locationCounts = new Map<string, number>()
    this.logs.forEach(log => {
      const locationKey = `${log.location.type}:${log.location.value}`
      locationCounts.set(locationKey, (locationCounts.get(locationKey) || 0) + 1)
    })
    const topLocations = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Common must-have filters
    const filterCounts = new Map<string, number>()
    this.logs.forEach(log => {
      if (log.mustHave.diagnosis) {
        log.mustHave.diagnosis.forEach(diag => {
          filterCounts.set(`diagnosis:${diag}`, (filterCounts.get(`diagnosis:${diag}`) || 0) + 1)
        })
      }
      if (log.mustHave.languages) {
        log.mustHave.languages.forEach(lang => {
          filterCounts.set(`language:${lang}`, (filterCounts.get(`language:${lang}`) || 0) + 1)
        })
      }
      if (log.mustHave.practiceType) {
        log.mustHave.practiceType.forEach(type => {
          filterCounts.set(`practiceType:${type}`, (filterCounts.get(`practiceType:${type}`) || 0) + 1)
        })
      }
    })
    const commonMustHaveFilters = Array.from(filterCounts.entries())
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalSearches,
      zeroResultSearches,
      avgResultsPerSearch,
      avgProcessingTime,
      fallbackUsageRate,
      topLocations,
      commonMustHaveFilters
    }
  }

  // Get zero result analysis
  getZeroResultAnalysis(): {
    totalZeroResults: number
    commonPatterns: {
      location: string
      mustHave: string
      count: number
    }[]
    fallbackSuccessRate: number
    avgFallbackRadius: number
  } {
    const totalZeroResults = this.zeroResultQueries.length

    // Common patterns in zero result queries
    const patternCounts = new Map<string, number>()
    this.zeroResultQueries.forEach(query => {
      const locationKey = `${query.location.type}:${query.location.value}`
      const mustHaveKey = JSON.stringify(query.mustHave)
      const patternKey = `${locationKey}|${mustHaveKey}`
      patternCounts.set(patternKey, (patternCounts.get(patternKey) || 0) + 1)
    })

    const commonPatterns = Array.from(patternCounts.entries())
      .map(([pattern, count]) => {
        const [location, mustHave] = pattern.split('|')
        return { location, mustHave, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Fallback analysis
    const queriesWithFallback = this.zeroResultQueries.filter(q => q.fallbackExpansions.length > 0)
    const fallbackSuccessRate = totalZeroResults > 0 
      ? queriesWithFallback.filter(q => q.finalResultsCount > 0).length / totalZeroResults
      : 0

    const avgFallbackRadius = queriesWithFallback.length > 0
      ? queriesWithFallback.reduce((sum, q) => {
          const maxRadius = Math.max(...q.fallbackExpansions.map(f => f.radiusKm))
          return sum + maxRadius
        }, 0) / queriesWithFallback.length
      : 0

    return {
      totalZeroResults,
      commonPatterns,
      fallbackSuccessRate,
      avgFallbackRadius
    }
  }

  // Export logs for analysis
  exportLogs(): {
    logs: SearchLogEntry[]
    zeroResultQueries: ZeroResultQuery[]
    stats: ReturnType<SearchLogger['getSearchStats']>
    zeroResultAnalysis: ReturnType<SearchLogger['getZeroResultAnalysis']>
    exportTimestamp: number
  } {
    return {
      logs: [...this.logs],
      zeroResultQueries: [...this.zeroResultQueries],
      stats: this.getSearchStats(),
      zeroResultAnalysis: this.getZeroResultAnalysis(),
      exportTimestamp: Date.now()
    }
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
    this.zeroResultQueries = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bibia_search_logs')
    }
  }
}

// Global search logger instance
export const searchLogger = new SearchLogger()

// Initialize by loading persisted logs
if (typeof window !== 'undefined') {
  searchLogger.loadPersistedLogs()
}

// Helper function to create search log entry
export function createSearchLogEntry(params: {
  queryId: string
  location: SearchLogEntry['location']
  radiusKmRequested: number
  radiusKmUsed: number
  mustHave: SearchLogEntry['mustHave']
  prefer: SearchLogEntry['prefer']
  top3Ids: string[]
  resultsCount: number
  processingTimeMs: number
  fallbackUsed: boolean
  fallbackReason?: string
  quality: SearchLogEntry['quality']
  userAgent?: string
  sessionId?: string
}): SearchLogEntry {
  return {
    ...params,
    timestamp: Date.now()
  }
}

// Helper function to log search
export function logSearch(entry: Omit<SearchLogEntry, 'timestamp'>): void {
  searchLogger.logSearch(entry)
}

