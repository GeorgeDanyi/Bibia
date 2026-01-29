// Telemetry logging for search events per PART F specifications

export type SearchEventType = 
  | 'search_started'
  | 'results_count'
  | 'result_opened'
  | 'cta_contact_click'
  | 'top_score'
  | 'no_results'
  | 'chip_toggled'
  | 'sort_changed'

export interface SearchEventPayload {
  event: SearchEventType
  timestamp: string
  sessionId: string
  searchId?: string // Unique identifier for this search session
  resultCount?: number
  therapistId?: string
  matchScore?: number
  fallbackUsed?: boolean
  fallbackLevel?: string
  searchTime?: number
  // Anonymous session identifier
}

// Analytics event emitter for search events
class SearchAnalytics {
  private events: SearchEventPayload[] = []
  private sessionId: string
  private isDevelopment: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private generateSessionId(): string {
    // Generate anonymous session ID (no PII)
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Emit a search analytics event
  emit(event: SearchEventType, context: {
    searchId?: string
    resultCount?: number
    therapistId?: string
    matchScore?: number
    fallbackUsed?: boolean
    fallbackLevel?: string
    searchTime?: number
    chipKey?: string
    chipValue?: string
    sort?: string
  }): void {
    const payload: SearchEventPayload = {
      event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      searchId: context.searchId,
      resultCount: context.resultCount,
      therapistId: context.therapistId,
      matchScore: context.matchScore,
      fallbackUsed: context.fallbackUsed,
      fallbackLevel: context.fallbackLevel,
      searchTime: context.searchTime
    }

    // Store event locally
    this.events.push(payload)

    // Log in development
    if (this.isDevelopment) {
      console.log('📊 Search Analytics Event:', payload)
    }

    // In production, this would send to analytics service
    // Example: analytics.track('search_event', payload)
  }

  // Log search started
  logSearchStarted(searchId: string): void {
    this.emit('search_started', { searchId })
  }

  // Log results count
  logResultsCount(searchId: string, resultCount: number, fallbackUsed: boolean, fallbackLevel?: string, searchTime?: number): void {
    this.emit('results_count', { 
      searchId, 
      resultCount, 
      fallbackUsed, 
      fallbackLevel,
      searchTime 
    })
  }

  // Log result opened (user clicked on a therapist card)
  logResultOpened(searchId: string, therapistId: string, matchScore: number): void {
    this.emit('result_opened', { 
      searchId, 
      therapistId, 
      matchScore 
    })
  }

  // Log contact CTA click
  logContactClick(searchId: string, therapistId: string, matchScore: number): void {
    this.emit('cta_contact_click', { 
      searchId, 
      therapistId, 
      matchScore 
    })
  }

  // Get all events for debugging
  getEvents(): SearchEventPayload[] {
    return [...this.events]
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId
  }

  // Clear events (for testing)
  clearEvents(): void {
    this.events = []
  }

  // Get events by type
  getEventsByType(eventType: SearchEventType): SearchEventPayload[] {
    return this.events.filter(event => event.event === eventType)
  }

  // Get events for current session
  getSessionEvents(): SearchEventPayload[] {
    return this.events.filter(event => event.sessionId === this.sessionId)
  }

  // Get search performance metrics
  getSearchMetrics(): {
    totalSearches: number
    averageResultCount: number
    fallbackUsageRate: number
    averageSearchTime: number
  } {
    const searchStartedEvents = this.getEventsByType('search_started')
    const resultsCountEvents = this.getEventsByType('results_count')
    
    const totalSearches = searchStartedEvents.length
    const averageResultCount = resultsCountEvents.length > 0 
      ? resultsCountEvents.reduce((sum, event) => sum + (event.resultCount || 0), 0) / resultsCountEvents.length
      : 0
    const fallbackUsageRate = resultsCountEvents.length > 0
      ? resultsCountEvents.filter(event => event.fallbackUsed).length / resultsCountEvents.length
      : 0
    const averageSearchTime = resultsCountEvents.length > 0
      ? resultsCountEvents.reduce((sum, event) => sum + (event.searchTime || 0), 0) / resultsCountEvents.length
      : 0

    return {
      totalSearches,
      averageResultCount,
      fallbackUsageRate,
      averageSearchTime
    }
  }
}

// Singleton instance
export const searchAnalytics = new SearchAnalytics()

// Helper function to generate unique search ID
export function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
