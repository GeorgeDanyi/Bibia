// End-to-end search tracing system for comprehensive monitoring and debugging

export interface SearchTrace {
  traceId: string
  queryId: string
  sessionId: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  
  // URL and routing
  url: {
    initial: string
    final?: string
    parameters: Record<string, any>
  }
  
  // Search criteria evolution
  criteria: {
    initial: any
    final?: any
    changes: Array<{
      timestamp: number
      field: string
      from: any
      to: any
      source: 'url' | 'ui' | 'fallback' | 'expansion'
    }>
  }
  
  // Orchestrator flow
  orchestrator: {
    debounceStart?: number
    debounceEnd?: number
    requestStart?: number
    requestEnd?: number
    cancellationReason?: string
    duplicateDetection?: {
      detected: boolean
      reason: string
    }
  }
  
  // API layer
  api: {
    endpoint: string
    requestStart?: number
    requestEnd?: number
    requestDuration?: number
    statusCode?: number
    requestSize?: number
    responseSize?: number
    retries?: number
    errors?: Array<{
      timestamp: number
      error: string
      retryable: boolean
    }>
  }
  
  // Database/Data layer
  data: {
    therapistsLoaded?: number
    therapistsFiltered?: number
    therapistsScored?: number
    geocodingAttempts?: number
    geocodingSuccess?: boolean
    coordinateGuaranteeUsed?: boolean
    fallbackExpansions?: Array<{
      radius: number
      resultsFound: number
      reason: string
    }>
  }
  
  // Results and UI
  results: {
    totalFound?: number
    returned?: number
    topScore?: number
    avgScore?: number
    scoreDistribution?: Record<string, number>
    zeroResults?: boolean
    zeroResultsReason?: string
    fallbackUsed?: boolean
    fallbackReason?: string
  }
  
  // Performance metrics
  performance: {
    totalDuration?: number
    orchestratorDuration?: number
    apiDuration?: number
    dataProcessingDuration?: number
    uiRenderDuration?: number
    memoryUsage?: number
  }
  
  // Error tracking
  errors: Array<{
    timestamp: number
    stage: 'url' | 'orchestrator' | 'api' | 'data' | 'ui'
    error: string
    stack?: string
    recoverable: boolean
    userVisible: boolean
  }>
  
  // User interactions
  interactions: Array<{
    timestamp: number
    type: 'filter_change' | 'sort_change' | 'radius_change' | 'online_toggle' | 'expert_toggle'
    data: any
  }>
}

export interface TraceSpan {
  spanId: string
  traceId: string
  parentSpanId?: string
  operation: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'started' | 'completed' | 'failed'
  tags: Record<string, any>
  logs: Array<{
    timestamp: number
    level: 'debug' | 'info' | 'warn' | 'error'
    message: string
    data?: any
  }>
}

class SearchTracer {
  private traces: Map<string, SearchTrace> = new Map()
  private spans: Map<string, TraceSpan> = new Map()
  private sessionId: string
  private maxTraces = 1000 // Keep last 1000 traces in memory

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Start a new search trace
  startTrace(queryId: string, initialUrl: string, initialCriteria: any): string {
    const traceId = this.generateTraceId()
    
    const trace: SearchTrace = {
      traceId,
      queryId,
      sessionId: this.sessionId,
      startTime: Date.now(),
      status: 'started',
      url: {
        initial: initialUrl,
        parameters: this.parseUrlParameters(initialUrl)
      },
      criteria: {
        initial: initialCriteria,
        changes: []
      },
      orchestrator: {},
      api: {
        endpoint: ''
      },
      data: {},
      results: {},
      performance: {},
      errors: [],
      interactions: []
    }

    this.traces.set(traceId, trace)
    this.logTraceEvent(traceId, 'trace_started', { queryId, initialUrl })
    
    // Cleanup old traces
    if (this.traces.size > this.maxTraces) {
      const oldestTrace = Array.from(this.traces.keys())[0]
      this.traces.delete(oldestTrace)
    }

    return traceId
  }

  // Start a span within a trace
  startSpan(traceId: string, operation: string, parentSpanId?: string, tags: Record<string, any> = {}): string {
    const spanId = this.generateSpanId()
    
    const span: TraceSpan = {
      spanId,
      traceId,
      parentSpanId,
      operation,
      startTime: Date.now(),
      status: 'started',
      tags,
      logs: []
    }

    this.spans.set(spanId, span)
    this.logSpanEvent(spanId, 'span_started', { operation, tags })
    
    return spanId
  }

  // Complete a span
  completeSpan(spanId: string, status: 'completed' | 'failed' = 'completed', tags: Record<string, any> = {}): void {
    const span = this.spans.get(spanId)
    if (!span) return

    span.endTime = Date.now()
    span.duration = span.endTime - span.startTime
    span.status = status
    span.tags = { ...span.tags, ...tags }

    this.logSpanEvent(spanId, 'span_completed', { status, duration: span.duration, tags })
  }

  // Log to a span
  logToSpan(spanId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const span = this.spans.get(spanId)
    if (!span) return

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data
    })
  }

  // Update trace with orchestrator events
  updateOrchestrator(traceId: string, updates: Partial<SearchTrace['orchestrator']>): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.orchestrator = { ...trace.orchestrator, ...updates }
    this.logTraceEvent(traceId, 'orchestrator_updated', updates)
  }

  // Update trace with API events
  updateApi(traceId: string, updates: Partial<SearchTrace['api']>): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.api = { ...trace.api, ...updates }
    this.logTraceEvent(traceId, 'api_updated', updates)
  }

  // Update trace with data events
  updateData(traceId: string, updates: Partial<SearchTrace['data']>): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.data = { ...trace.data, ...updates }
    this.logTraceEvent(traceId, 'data_updated', updates)
  }

  // Update trace with results
  updateResults(traceId: string, updates: Partial<SearchTrace['results']>): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.results = { ...trace.results, ...updates }
    this.logTraceEvent(traceId, 'results_updated', updates)
  }

  // Record criteria change
  recordCriteriaChange(traceId: string, field: string, from: any, to: any, source: 'url' | 'ui' | 'fallback' | 'expansion'): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.criteria.changes.push({
      timestamp: Date.now(),
      field,
      from,
      to,
      source
    })

    trace.criteria.final = { ...trace.criteria.final, [field]: to }
    this.logTraceEvent(traceId, 'criteria_changed', { field, from, to, source })
  }

  // Record error
  recordError(traceId: string, stage: SearchTrace['errors'][0]['stage'], error: string, stack?: string, recoverable: boolean = true, userVisible: boolean = true): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.errors.push({
      timestamp: Date.now(),
      stage,
      error,
      stack,
      recoverable,
      userVisible
    })

    this.logTraceEvent(traceId, 'error_recorded', { stage, error, recoverable, userVisible })
  }

  // Record user interaction
  recordInteraction(traceId: string, type: SearchTrace['interactions'][0]['type'], data: any): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.interactions.push({
      timestamp: Date.now(),
      type,
      data
    })

    this.logTraceEvent(traceId, 'interaction_recorded', { type, data })
  }

  // Complete trace
  completeTrace(traceId: string, status: 'completed' | 'failed' | 'cancelled' = 'completed'): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.endTime = Date.now()
    trace.duration = trace.endTime - trace.startTime
    trace.status = status

    // Calculate performance metrics
    trace.performance = {
      totalDuration: trace.duration,
      orchestratorDuration: trace.orchestrator.requestEnd && trace.orchestrator.requestStart 
        ? trace.orchestrator.requestEnd - trace.orchestrator.requestStart 
        : undefined,
      apiDuration: trace.api.requestDuration,
      dataProcessingDuration: trace.data.therapistsLoaded ? Date.now() - (trace.api.requestEnd || trace.startTime) : undefined,
      uiRenderDuration: undefined // Will be set by UI components
    }

    this.logTraceEvent(traceId, 'trace_completed', { status, duration: trace.duration })
    this.persistTrace(trace)
  }

  // Get trace by ID
  getTrace(traceId: string): SearchTrace | undefined {
    return this.traces.get(traceId)
  }

  // Get trace by query ID
  getTraceByQueryId(queryId: string): SearchTrace | undefined {
    return Array.from(this.traces.values()).find(trace => trace.queryId === queryId)
  }

  // Get all traces for current session
  getSessionTraces(): SearchTrace[] {
    return Array.from(this.traces.values()).filter(trace => trace.sessionId === this.sessionId)
  }

  // Get traces with zero results
  getZeroResultTraces(): SearchTrace[] {
    return Array.from(this.traces.values()).filter(trace => 
      trace.results.zeroResults || trace.results.totalFound === 0
    )
  }

  // Get failed traces
  getFailedTraces(): SearchTrace[] {
    return Array.from(this.traces.values()).filter(trace => 
      trace.status === 'failed' || trace.errors.length > 0
    )
  }

  // Get performance statistics
  getPerformanceStats(): {
    avgTotalDuration: number
    avgApiDuration: number
    avgResultsCount: number
    zeroResultRate: number
    errorRate: number
    fallbackUsageRate: number
  } {
    const traces = Array.from(this.traces.values())
    if (traces.length === 0) {
      return {
        avgTotalDuration: 0,
        avgApiDuration: 0,
        avgResultsCount: 0,
        zeroResultRate: 0,
        errorRate: 0,
        fallbackUsageRate: 0
      }
    }

    const completedTraces = traces.filter(t => t.status === 'completed')
    const avgTotalDuration = completedTraces.length > 0
      ? completedTraces.reduce((sum, t) => sum + (t.performance.totalDuration || 0), 0) / completedTraces.length
      : 0

    const avgApiDuration = completedTraces.length > 0
      ? completedTraces.reduce((sum, t) => sum + (t.performance.apiDuration || 0), 0) / completedTraces.length
      : 0

    const avgResultsCount = completedTraces.length > 0
      ? completedTraces.reduce((sum, t) => sum + (t.results.totalFound || 0), 0) / completedTraces.length
      : 0

    const zeroResultRate = traces.length > 0
      ? traces.filter(t => t.results.zeroResults || t.results.totalFound === 0).length / traces.length
      : 0

    const errorRate = traces.length > 0
      ? traces.filter(t => t.errors.length > 0).length / traces.length
      : 0

    const fallbackUsageRate = traces.length > 0
      ? traces.filter(t => t.results.fallbackUsed).length / traces.length
      : 0

    return {
      avgTotalDuration,
      avgApiDuration,
      avgResultsCount,
      zeroResultRate,
      errorRate,
      fallbackUsageRate
    }
  }

  // Export traces for analysis
  exportTraces(): {
    traces: SearchTrace[]
    spans: TraceSpan[]
    stats: ReturnType<SearchTracer['getPerformanceStats']>
    sessionId: string
    exportTimestamp: number
  } {
    return {
      traces: Array.from(this.traces.values()),
      spans: Array.from(this.spans.values()),
      stats: this.getPerformanceStats(),
      sessionId: this.sessionId,
      exportTimestamp: Date.now()
    }
  }

  // Clear all traces
  clearTraces(): void {
    this.traces.clear()
    this.spans.clear()
  }

  // Private helper methods
  private parseUrlParameters(url: string): Record<string, any> {
    try {
      const urlObj = new URL(url, window.location.origin)
      const params: Record<string, any> = {}
      
      urlObj.searchParams.forEach((value, key) => {
        // Try to parse as JSON for complex values
        try {
          params[key] = JSON.parse(value)
        } catch {
          // If not JSON, keep as string
          params[key] = value
        }
      })
      
      return params
    } catch {
      return {}
    }
  }

  private logTraceEvent(traceId: string, event: string, data: any): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [TRACE:${traceId}] ${event}:`, data)
  }

  private logSpanEvent(spanId: string, event: string, data: any): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [SPAN:${spanId}] ${event}:`, data)
  }

  private persistTrace(trace: SearchTrace): void {
    if (typeof window === 'undefined') return

    try {
      const stored = JSON.parse(localStorage.getItem('bibia_search_traces') || '[]')
      stored.push(trace)
      
      // Keep only last 100 traces in localStorage
      const trimmed = stored.slice(-100)
      localStorage.setItem('bibia_search_traces', JSON.stringify(trimmed))
    } catch (error) {
      console.warn('Failed to persist trace:', error)
    }
  }
}

// Global tracer instance
export const searchTracer = new SearchTracer()

// Helper functions for common tracing patterns
export const startSearchTrace = (queryId: string, url: string, criteria: any) => {
  return searchTracer.startTrace(queryId, url, criteria)
}

export const startTraceSpan = (traceId: string, operation: string, parentSpanId?: string, tags?: Record<string, any>) => {
  return searchTracer.startSpan(traceId, operation, parentSpanId, tags)
}

export const completeTraceSpan = (spanId: string, status?: 'completed' | 'failed', tags?: Record<string, any>) => {
  searchTracer.completeSpan(spanId, status, tags)
}

export const logToSpan = (spanId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
  searchTracer.logToSpan(spanId, level, message, data)
}

export const recordTraceError = (traceId: string, stage: SearchTrace['errors'][0]['stage'], error: string, stack?: string, recoverable?: boolean, userVisible?: boolean) => {
  searchTracer.recordError(traceId, stage, error, stack, recoverable, userVisible)
}

export const recordTraceInteraction = (traceId: string, type: SearchTrace['interactions'][0]['type'], data: any) => {
  searchTracer.recordInteraction(traceId, type, data)
}

export const completeSearchTrace = (traceId: string, status?: 'completed' | 'failed' | 'cancelled') => {
  searchTracer.completeTrace(traceId, status)
}
