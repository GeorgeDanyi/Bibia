// Comprehensive telemetry and logging system for data hygiene and relevance tuning

export interface TelemetryEvent {
  eventType: string
  timestamp: number
  sessionId: string
  queryId?: string
  userId?: string
  data: Record<string, any>
  metadata?: {
    userAgent?: string
    ip?: string
    referrer?: string
  }
}

export interface SearchTelemetryData {
  // Input data
  input: {
    location: { lat: number; lng: number } | { cityOrZip: string }
    radiusKm?: number
    problems?: string[]
    diagnosisTags?: string[]
    preferences?: any
    mustHave?: any
    prefer?: any
  }
  
  // Processing data
  processing: {
    therapistsLoaded: number
    therapistsFiltered: number
    therapistsScored: number
    processingTimeMs: number
    validationErrors?: string[]
    sanitizationApplied?: boolean
  }
  
  // Results data
  results: {
    totalResults: number
    resultsReturned: number
    radiusKmUsed: number
    expandedRadiusKm?: number
    expansionReason?: string
    topScore?: number
    avgScore?: number
    scoreDistribution?: { [range: string]: number }
  }
  
  // User interaction data
  interactions?: {
    filtersApplied?: string[]
    sortChanged?: string
    distanceChanged?: number
    cardsViewed?: string[]
    bookingAttempts?: string[]
    detailViews?: string[]
  }
}

export interface DataHygieneEvent {
  eventType: 'data_validation_error' | 'data_sanitization' | 'data_consistency_check' | 'api_error'
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  details: {
    errorType?: string
    errorMessage?: string
    affectedFields?: string[]
    sanitizedData?: any
    originalData?: any
    validationSchema?: string
  }
  context?: {
    queryId?: string
    therapistId?: string
    userId?: string
    apiEndpoint?: string
  }
}

class TelemetryLogger {
  private sessionId: string
  private events: TelemetryEvent[] = []
  private hygieneEvents: DataHygieneEvent[] = []

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Log search telemetry
  logSearchTelemetry(data: SearchTelemetryData, queryId?: string): void {
    const event: TelemetryEvent = {
      eventType: 'search_executed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      queryId,
      data: {
        ...data,
        // Add computed metrics
        metrics: {
          resultQuality: this.computeResultQuality(data.results),
          searchEfficiency: this.computeSearchEfficiency(data.processing),
          userSatisfaction: this.computeUserSatisfaction(data.results, data.interactions)
        }
      }
    }

    this.events.push(event)
    this.logToConsole('search', event)
    this.logToAnalytics(event)
  }

  // Log data hygiene events
  logDataHygieneEvent(event: DataHygieneEvent): void {
    this.hygieneEvents.push(event)
    this.logToConsole('hygiene', event)
    
    // Alert on critical issues
    if (event.severity === 'critical') {
      this.alertCriticalIssue(event)
    }
  }

  // Log user interactions
  logUserInteraction(interactionType: string, data: any, queryId?: string): void {
    const event: TelemetryEvent = {
      eventType: `user_${interactionType}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      queryId,
      data
    }

    this.events.push(event)
    this.logToConsole('interaction', event)
  }

  // Log general events
  logEvent(eventType: string, data: any, queryId?: string): void {
    const event: TelemetryEvent = {
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      queryId,
      data
    }

    this.events.push(event)
    this.logToConsole('event', event)
  }

  // Log API errors
  logApiError(endpoint: string, error: Error, context?: any): void {
    const hygieneEvent: DataHygieneEvent = {
      eventType: 'api_error',
      timestamp: Date.now(),
      severity: 'high',
      source: endpoint,
      details: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        originalData: context
      },
      context: {
        apiEndpoint: endpoint
      }
    }

    this.logDataHygieneEvent(hygieneEvent)
  }

  // Log validation errors
  logValidationError(source: string, errors: string[], data?: any): void {
    const hygieneEvent: DataHygieneEvent = {
      eventType: 'data_validation_error',
      timestamp: Date.now(),
      severity: errors.length > 5 ? 'high' : 'medium',
      source,
      details: {
        errorMessage: errors.join('; '),
        affectedFields: errors.map(e => e.split(':')[0]),
        originalData: data
      }
    }

    this.logDataHygieneEvent(hygieneEvent)
  }

  // Log data sanitization
  logDataSanitization(source: string, originalData: any, sanitizedData: any): void {
    const hygieneEvent: DataHygieneEvent = {
      eventType: 'data_sanitization',
      timestamp: Date.now(),
      severity: 'low',
      source,
      details: {
        originalData,
        sanitizedData
      }
    }

    this.logDataHygieneEvent(hygieneEvent)
  }

  // Log data consistency issues
  logDataConsistencyIssue(source: string, issue: string, data?: any): void {
    const hygieneEvent: DataHygieneEvent = {
      eventType: 'data_consistency_check',
      timestamp: Date.now(),
      severity: 'medium',
      source,
      details: {
        errorMessage: issue,
        originalData: data
      }
    }

    this.logDataHygieneEvent(hygieneEvent)
  }

  // Compute result quality metrics
  private computeResultQuality(results: SearchTelemetryData['results']): number {
    if (results.totalResults === 0) return 0
    
    const score = (results.topScore || 0) / 100
    const diversity = Math.min(1, results.totalResults / 10) // More results = better diversity
    const relevance = results.avgScore ? results.avgScore / 100 : 0.5
    
    return (score * 0.4 + diversity * 0.3 + relevance * 0.3)
  }

  // Compute search efficiency metrics
  private computeSearchEfficiency(processing: SearchTelemetryData['processing']): number {
    const loadTime = processing.processingTimeMs
    const filterRatio = processing.therapistsFiltered / Math.max(1, processing.therapistsLoaded)
    
    // Lower load time and higher filter ratio = better efficiency
    const timeScore = Math.max(0, 1 - (loadTime / 5000)) // 5s max
    const filterScore = Math.min(1, filterRatio * 2) // 50% filter ratio is good
    
    return (timeScore * 0.6 + filterScore * 0.4)
  }

  // Compute user satisfaction proxy
  private computeUserSatisfaction(results: SearchTelemetryData['results'], interactions?: SearchTelemetryData['interactions']): number {
    let satisfaction = 0.5 // Base score
    
    // More results = higher satisfaction
    if (results.totalResults > 0) {
      satisfaction += Math.min(0.3, results.totalResults / 20)
    }
    
    // High scores = higher satisfaction
    if (results.avgScore && results.avgScore > 70) {
      satisfaction += 0.2
    }
    
    // User interactions indicate engagement
    if (interactions) {
      if (interactions.cardsViewed && interactions.cardsViewed.length > 3) {
        satisfaction += 0.1
      }
      if (interactions.bookingAttempts && interactions.bookingAttempts.length > 0) {
        satisfaction += 0.2
      }
    }
    
    return Math.min(1, satisfaction)
  }

  // Console logging with structured format
  private logToConsole(type: string, event: TelemetryEvent | DataHygieneEvent): void {
    const timestamp = new Date(event.timestamp).toISOString()
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`
    
    if ('eventType' in event) {
      console.log(`${prefix} ${event.eventType}:`, {
        sessionId: 'sessionId' in event ? event.sessionId : undefined,
        queryId: 'queryId' in event ? event.queryId : undefined,
        data: 'data' in event ? event.data : event.details
      })
    }
  }

  // Analytics logging (placeholder for real analytics service)
  private logToAnalytics(event: TelemetryEvent): void {
    // In production, this would send to your analytics service
    // For now, we'll just store locally for debugging
    if (typeof window !== 'undefined') {
      try {
        const analytics = JSON.parse(localStorage.getItem('bibia_analytics') || '[]')
        analytics.push(event)
        localStorage.setItem('bibia_analytics', JSON.stringify(analytics.slice(-100))) // Keep last 100 events
      } catch (e) {
        console.warn('Failed to store analytics data:', e)
      }
    }
  }

  // Alert critical issues
  private alertCriticalIssue(event: DataHygieneEvent): void {
    console.error('🚨 CRITICAL DATA HYGIENE ISSUE:', {
      type: event.eventType,
      source: event.source,
      message: event.details.errorMessage,
      timestamp: new Date(event.timestamp).toISOString()
    })
    
    // In production, this would send alerts to monitoring systems
  }

  // Get telemetry summary
  getTelemetrySummary(): {
    sessionId: string
    totalEvents: number
    hygieneEvents: number
    criticalIssues: number
    avgResultQuality: number
    avgSearchEfficiency: number
  } {
    const searchEvents = this.events.filter(e => e.eventType === 'search_executed')
    const criticalIssues = this.hygieneEvents.filter(e => e.severity === 'critical').length
    
    const avgResultQuality = searchEvents.length > 0 
      ? searchEvents.reduce((sum, e) => sum + (e.data.metrics?.resultQuality || 0), 0) / searchEvents.length
      : 0
    
    const avgSearchEfficiency = searchEvents.length > 0
      ? searchEvents.reduce((sum, e) => sum + (e.data.metrics?.searchEfficiency || 0), 0) / searchEvents.length
      : 0

    return {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      hygieneEvents: this.hygieneEvents.length,
      criticalIssues,
      avgResultQuality,
      avgSearchEfficiency
    }
  }

  // Export data for analysis
  exportTelemetryData(): {
    events: TelemetryEvent[]
    hygieneEvents: DataHygieneEvent[]
    summary: ReturnType<TelemetryLogger['getTelemetrySummary']>
  } {
    return {
      events: [...this.events],
      hygieneEvents: [...this.hygieneEvents],
      summary: this.getTelemetrySummary()
    }
  }
}

// Global telemetry instance
export const telemetry = new TelemetryLogger()

// Utility functions for common logging patterns
export const logSearch = (data: SearchTelemetryData, queryId?: string) => {
  telemetry.logSearchTelemetry(data, queryId)
}

export const logValidationError = (source: string, errors: string[], data?: any) => {
  telemetry.logValidationError(source, errors, data)
}

export const logDataSanitization = (source: string, originalData: any, sanitizedData: any) => {
  telemetry.logDataSanitization(source, originalData, sanitizedData)
}

export const logApiError = (endpoint: string, error: Error, context?: any) => {
  telemetry.logApiError(endpoint, error, context)
}

export const logUserInteraction = (interactionType: string, data: any, queryId?: string) => {
  telemetry.logUserInteraction(interactionType, data, queryId)
}

// Debug-only detailed match component logging
export const matchComputed = (event: {
  therapistId: string
  diagnosis_score: number
  distance_score: number
  time_score: number
  gender_score: number
  total: number
}) => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') return
    const ts = new Date().toISOString()
    console.log(`[${ts}] [MATCH_COMPUTED]`, event)
  } catch {}
}
