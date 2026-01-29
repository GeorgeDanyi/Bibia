// Error surfacing system for Part B requirements

export interface SurfacedError {
  id: string
  queryId: string
  error: string
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  timestamp: number
  userVisible: boolean
  context?: {
    stage: 'orchestrator' | 'api' | 'db' | 'ui'
    location?: {
      lat: number
      lng: number
      confidence: number
    }
    apiEndpoint?: string
    statusCode?: number
  }
}

class ErrorSurfacingSystem {
  private errors: Map<string, SurfacedError> = new Map()
  private maxErrors = 50 // Keep last 50 errors

  // Surface an error for user visibility
  surfaceError(error: Omit<SurfacedError, 'id' | 'timestamp'>): string {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const surfacedError: SurfacedError = {
      ...error,
      id,
      timestamp: Date.now()
    }

    this.errors.set(id, surfacedError)
    
    // Trim if too many errors
    if (this.errors.size > this.maxErrors) {
      const oldestError = Array.from(this.errors.entries())[0]
      this.errors.delete(oldestError[0])
    }

    // Log to console for debugging
    const timestamp = new Date(surfacedError.timestamp).toISOString()
    console.error(`[${timestamp}] [ERROR_SURFACED] [${surfacedError.severity.toUpperCase()}] [${surfacedError.queryId}] ${surfacedError.reason}:`, {
      error: surfacedError.error,
      context: surfacedError.context
    })

    return id
  }

  // Surface API error with location confidence check
  surfaceApiError(
    queryId: string,
    error: string,
    context: {
      apiEndpoint: string
      statusCode?: number
      location?: {
        lat: number
        lng: number
        confidence: number
      }
    }
  ): string | null {
    let reason: string
    let severity: SurfacedError['severity'] = 'medium'
    let recoverable = true

    // Check for specific error conditions
    if (context.statusCode === 400) {
      reason = 'Neplatné vyhledávací parametry. Zkontrolujte prosím zadané údaje.'
      severity = 'medium'
    } else if (context.statusCode === 404) {
      reason = 'Služba vyhledávání není dostupná. Zkuste to prosím později.'
      severity = 'high'
    } else if (context.statusCode === 500) {
      reason = 'Chyba serveru. Zkuste to prosím znovu.'
      severity = 'high'
    } else if (context.statusCode === 408) {
      reason = 'Vyhledávání trvá příliš dlouho. Zkuste to prosím znovu.'
      severity = 'medium'
    } else {
      reason = 'Nepodařilo se dokončit vyhledávání. Zkuste to prosím znovu.'
      severity = 'medium'
    }

    // Check location confidence
    if (context.location && context.location.confidence < 0.6) {
      reason = `Nízká přesnost polohy (${Math.round(context.location.confidence * 100)}%). Zkuste zadat přesnější adresu.`
      severity = 'low'
    }

    return this.surfaceError({
      queryId,
      error,
      reason,
      severity,
      recoverable,
      userVisible: true,
      context: {
        stage: 'api',
        location: context.location,
        apiEndpoint: context.apiEndpoint,
        statusCode: context.statusCode
      }
    })
  }

  // Surface coordinate resolution error
  surfaceCoordinateError(
    queryId: string,
    error: string,
    location: string,
    confidence?: number
  ): string {
    let reason: string
    let severity: SurfacedError['severity'] = 'medium'

    if (confidence !== undefined && confidence < 0.6) {
      reason = `Nízká přesnost polohy pro "${location}" (${Math.round(confidence * 100)}%). Zkuste zadat přesnější adresu nebo použijte mapu.`
      severity = 'low'
    } else {
      reason = `Nepodařilo se najít souřadnice pro "${location}". Zkuste zadat jiné město nebo použijte mapu.`
      severity = 'medium'
    }

    return this.surfaceError({
      queryId,
      error,
      reason,
      severity,
      recoverable: true,
      userVisible: true,
      context: {
        stage: 'api',
        location: confidence ? { lat: 0, lng: 0, confidence } : undefined
      }
    })
  }

  // Surface orchestrator error
  surfaceOrchestratorError(
    queryId: string,
    error: string,
    context?: {
      action: string
      criteria?: any
    }
  ): string {
    let reason: string
    let severity: SurfacedError['severity'] = 'medium'

    if (error.includes('timeout')) {
      reason = 'Vyhledávání trvá příliš dlouho. Zkuste to prosím znovu.'
      severity = 'medium'
    } else if (error.includes('cancelled')) {
      reason = 'Vyhledávání bylo zrušeno.'
      severity = 'low'
    } else {
      reason = 'Nepodařilo se spustit vyhledávání. Zkuste to prosím znovu.'
      severity = 'medium'
    }

    return this.surfaceError({
      queryId,
      error,
      reason,
      severity,
      recoverable: true,
      userVisible: true,
      context: {
        stage: 'orchestrator'
      }
    })
  }

  // Surface data quality error
  surfaceDataError(
    queryId: string,
    error: string,
    context: {
      dataSource: string
      validationErrors?: number
    }
  ): string {
    let reason: string
    let severity: SurfacedError['severity'] = 'low'

    if (context.validationErrors && context.validationErrors > 10) {
      reason = 'Problém s kvalitou dat. Některé výsledky mohou být neúplné.'
      severity = 'medium'
    } else {
      reason = 'Problém s načítáním dat. Zkuste to prosím znovu.'
      severity = 'low'
    }

    return this.surfaceError({
      queryId,
      error,
      reason,
      severity,
      recoverable: true,
      userVisible: true,
      context: {
        stage: 'db'
      }
    })
  }

  // Surface zero result error with detailed analysis
  surfaceZeroResultError(
    queryId: string,
    analysis: {
      rootCause: string
      userMessage: string
      technicalDetails: string
      alertType: 'geocoding' | 'coordinate' | 'db_filter' | 'ui_state' | 'general'
      pipelineData?: {
        geocodingSuccess: boolean
        coordinateResolutionSuccess: boolean
        dbFilteringSuccess: boolean
        uiStateSuccess: boolean
        failureStage?: string
      }
    }
  ): string {
    let severity: SurfacedError['severity'] = 'low'
    let recoverable = true

    // Determine severity based on root cause
    switch (analysis.rootCause) {
      case 'geocoding_failed':
      case 'coordinate_resolution_failed':
        severity = 'medium'
        break
      case 'db_filter_too_restrictive':
        severity = 'low'
        break
      case 'ui_state_issue':
        severity = 'high'
        break
      case 'no_therapists_in_area':
        severity = 'low'
        break
      default:
        severity = 'medium'
    }

    return this.surfaceError({
      queryId,
      error: analysis.technicalDetails,
      reason: analysis.userMessage,
      severity,
      recoverable,
      userVisible: true,
      context: {
        stage: analysis.pipelineData?.failureStage as any || 'api',
        location: analysis.pipelineData?.coordinateResolutionSuccess ? { lat: 0, lng: 0, confidence: 1 } : undefined
      }
    })
  }

  // Get all surfaced errors
  getErrors(): SurfacedError[] {
    return Array.from(this.errors.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  // Get errors by queryId
  getErrorsByQueryId(queryId: string): SurfacedError[] {
    return Array.from(this.errors.values())
      .filter(error => error.queryId === queryId)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Get user-visible errors
  getUserVisibleErrors(): SurfacedError[] {
    return Array.from(this.errors.values())
      .filter(error => error.userVisible)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Get errors by severity
  getErrorsBySeverity(severity: SurfacedError['severity']): SurfacedError[] {
    return Array.from(this.errors.values())
      .filter(error => error.severity === severity)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Dismiss an error
  dismissError(id: string): void {
    this.errors.delete(id)
  }

  // Dismiss all errors for a queryId
  dismissErrorsByQueryId(queryId: string): void {
    const errorsToDelete = Array.from(this.errors.entries())
      .filter(([_, error]) => error.queryId === queryId)
      .map(([id, _]) => id)
    
    errorsToDelete.forEach(id => this.errors.delete(id))
  }

  // Clear all errors
  clearErrors(): void {
    this.errors.clear()
  }

  // Get error statistics
  getStats(): {
    totalErrors: number
    errorsBySeverity: Record<string, number>
    errorsByStage: Record<string, number>
    recentErrorRate: number
  } {
    const totalErrors = this.errors.size
    
    const errorsBySeverity = Array.from(this.errors.values()).reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorsByStage = Array.from(this.errors.values()).reduce((acc, error) => {
      const stage = error.context?.stage || 'unknown'
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate recent error rate (last hour)
    const lastHour = Date.now() - (60 * 60 * 1000)
    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.timestamp > lastHour).length
    const recentErrorRate = recentErrors / 60 // errors per minute

    return {
      totalErrors,
      errorsBySeverity,
      errorsByStage,
      recentErrorRate
    }
  }

  // Export errors
  exportErrors(): {
    errors: SurfacedError[]
    stats: ReturnType<ErrorSurfacingSystem['getStats']>
    exportTimestamp: number
  } {
    return {
      errors: Array.from(this.errors.values()),
      stats: this.getStats(),
      exportTimestamp: Date.now()
    }
  }
}

// Global error surfacing system instance
export const errorSurfacing = new ErrorSurfacingSystem()

// Helper functions
export const surfaceApiError = (queryId: string, error: string, context: Parameters<ErrorSurfacingSystem['surfaceApiError']>[2]) => {
  return errorSurfacing.surfaceApiError(queryId, error, context)
}

export const surfaceCoordinateError = (queryId: string, error: string, location: string, confidence?: number) => {
  return errorSurfacing.surfaceCoordinateError(queryId, error, location, confidence)
}

export const surfaceOrchestratorError = (queryId: string, error: string, context?: Parameters<ErrorSurfacingSystem['surfaceOrchestratorError']>[2]) => {
  return errorSurfacing.surfaceOrchestratorError(queryId, error, context)
}

export const surfaceDataError = (queryId: string, error: string, context: Parameters<ErrorSurfacingSystem['surfaceDataError']>[2]) => {
  return errorSurfacing.surfaceDataError(queryId, error, context)
}

export const surfaceZeroResultError = (queryId: string, analysis: Parameters<ErrorSurfacingSystem['surfaceZeroResultError']>[1]) => {
  return errorSurfacing.surfaceZeroResultError(queryId, analysis)
}
