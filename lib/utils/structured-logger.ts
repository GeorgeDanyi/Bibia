// Structured logging system for Part B requirements

export interface StructuredLogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  component: 'orchestrator' | 'api' | 'db' | 'ui'
  queryId: string
  message: string
  data: Record<string, any>
}

export interface OrchestratorLogData {
  queryId: string
  urlParams: Record<string, any>
  criteria?: any
  action?: string
  duration?: number
}

export interface ApiLogData {
  queryId: string
  resolvedLocation?: {
    lat: number
    lng: number
    source: string
    confidence: number
  }
  radiusKm: number
  filters: {
    mustHave?: any
    prefer?: any
    diagnosisTags?: string[]
  }
  requestSize?: number
  responseSize?: number
  statusCode?: number
  processingTimeMs?: number
}

export interface DbLogData {
  queryId: string
  sqlUsedOrStrategy: string
  prefilterCount: number
  finalCount: number
  dataSource: string
  validationErrors?: number
  fallbackUsed?: boolean
}

export interface UiLogData {
  queryId: string
  state: 'loading' | 'hasResults' | 'empty' | 'error'
  resultsCount?: number
  errorMessage?: string
  userAction?: string
}

class StructuredLogger {
  private logs: StructuredLogEntry[] = []
  private maxLogs = 10000

  // Log orchestrator events
  logOrchestrator(data: OrchestratorLogData, message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    this.log({
      timestamp: Date.now(),
      level,
      component: 'orchestrator',
      queryId: data.queryId,
      message,
      data: {
        urlParams: data.urlParams,
        criteria: data.criteria,
        action: data.action,
        duration: data.duration
      }
    })
  }

  // Log API events
  logApi(data: ApiLogData, message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    this.log({
      timestamp: Date.now(),
      level,
      component: 'api',
      queryId: data.queryId,
      message,
      data: {
        resolvedLocation: data.resolvedLocation,
        radiusKm: data.radiusKm,
        filters: data.filters,
        requestSize: data.requestSize,
        responseSize: data.responseSize,
        statusCode: data.statusCode,
        processingTimeMs: data.processingTimeMs
      }
    })
  }

  // Log DB events
  logDb(data: DbLogData, message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    this.log({
      timestamp: Date.now(),
      level,
      component: 'db',
      queryId: data.queryId,
      message,
      data: {
        sqlUsedOrStrategy: data.sqlUsedOrStrategy,
        prefilterCount: data.prefilterCount,
        finalCount: data.finalCount,
        dataSource: data.dataSource,
        validationErrors: data.validationErrors,
        fallbackUsed: data.fallbackUsed
      }
    })
  }

  // Log UI events
  logUi(data: UiLogData, message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    this.log({
      timestamp: Date.now(),
      level,
      component: 'ui',
      queryId: data.queryId,
      message,
      data: {
        state: data.state,
        resultsCount: data.resultsCount,
        errorMessage: data.errorMessage,
        userAction: data.userAction
      }
    })
  }

  // Core logging method
  private log(entry: StructuredLogEntry): void {
    this.logs.push(entry)
    
    // Trim logs if too many
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output with structured format
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.component.toUpperCase()}] [${entry.queryId}]`
    
    console.log(`${prefix} ${entry.message}:`, entry.data)

    // Persist to localStorage for debugging
    this.persistLogs()
  }

  // Get logs by queryId
  getLogsByQueryId(queryId: string): StructuredLogEntry[] {
    return this.logs.filter(log => log.queryId === queryId)
  }

  // Get logs by component
  getLogsByComponent(component: StructuredLogEntry['component']): StructuredLogEntry[] {
    return this.logs.filter(log => log.component === component)
  }

  // Get recent logs
  getRecentLogs(limit: number = 100): StructuredLogEntry[] {
    return this.logs.slice(-limit)
  }

  // Get logs by level
  getLogsByLevel(level: StructuredLogEntry['level']): StructuredLogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  // Get statistics
  getStats(): {
    totalLogs: number
    logsByComponent: Record<string, number>
    logsByLevel: Record<string, number>
    uniqueQueryIds: number
    recentErrorRate: number
  } {
    const totalLogs = this.logs.length
    const logsByComponent = this.logs.reduce((acc, log) => {
      acc[log.component] = (acc[log.component] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const logsByLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const uniqueQueryIds = new Set(this.logs.map(log => log.queryId)).size

    // Calculate recent error rate (last 100 logs)
    const recentLogs = this.logs.slice(-100)
    const recentErrors = recentLogs.filter(log => log.level === 'error').length
    const recentErrorRate = recentLogs.length > 0 ? recentErrors / recentLogs.length : 0

    return {
      totalLogs,
      logsByComponent,
      logsByLevel,
      uniqueQueryIds,
      recentErrorRate
    }
  }

  // Export logs
  exportLogs(): {
    logs: StructuredLogEntry[]
    stats: ReturnType<StructuredLogger['getStats']>
    exportTimestamp: number
  } {
    return {
      logs: [...this.logs],
      stats: this.getStats(),
      exportTimestamp: Date.now()
    }
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bibia_structured_logs')
    }
  }

  // Persist logs to localStorage
  private persistLogs(): void {
    if (typeof window === 'undefined') return

    try {
      const data = this.logs.slice(-1000) // Keep last 1000 logs
      localStorage.setItem('bibia_structured_logs', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist structured logs:', error)
    }
  }

  // Load logs from localStorage
  loadPersistedLogs(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('bibia_structured_logs')
      if (stored) {
        const data = JSON.parse(stored)
        if (Array.isArray(data)) {
          this.logs = data
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted structured logs:', error)
    }
  }
}

// Global structured logger instance
export const structuredLogger = new StructuredLogger()

// Initialize by loading persisted logs
if (typeof window !== 'undefined') {
  structuredLogger.loadPersistedLogs()
}

// Helper functions for common logging patterns
export const logOrchestrator = (data: OrchestratorLogData, message: string, level?: 'info' | 'warn' | 'error' | 'debug') => {
  structuredLogger.logOrchestrator(data, message, level)
}

export const logApi = (data: ApiLogData, message: string, level?: 'info' | 'warn' | 'error' | 'debug') => {
  structuredLogger.logApi(data, message, level)
}

export const logDb = (data: DbLogData, message: string, level?: 'info' | 'warn' | 'error' | 'debug') => {
  structuredLogger.logDb(data, message, level)
}

export const logUi = (data: UiLogData, message: string, level?: 'info' | 'warn' | 'error' | 'debug') => {
  structuredLogger.logUi(data, message, level)
}
