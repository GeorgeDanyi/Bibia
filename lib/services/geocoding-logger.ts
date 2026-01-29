/**
 * Geocoding logging service for low-confidence locations
 * Part B: Log low-confidence locations with input string for later improvements
 */

import { LowConfidenceLog, GeocodeResult } from '@/lib/types/geocoding'

class GeocodingLogger {
  private logs: LowConfidenceLog[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory
  private isEnabled = true

  /**
   * Log a low-confidence geocoding result
   */
  logLowConfidence(
    input: string,
    result: GeocodeResult,
    confidence: number,
    source: string = 'geocoding-service'
  ): void {
    if (!this.isEnabled) return

    const log: LowConfidenceLog = {
      timestamp: Date.now(),
      input: input.trim(),
      result,
      confidence,
      source,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      sessionId: this.getSessionId()
    }

    this.logs.push(log)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Low confidence geocoding result:', {
        input: log.input,
        confidence: log.confidence,
        result: log.result.normalizedLabel,
        source: log.source
      })
    }

    // In production, you might want to send this to an analytics service
    this.sendToAnalytics(log)
  }

  /**
   * Get all low-confidence logs
   */
  getLogs(): LowConfidenceLog[] {
    return [...this.logs]
  }

  /**
   * Get logs for a specific time range
   */
  getLogsInRange(startTime: number, endTime: number): LowConfidenceLog[] {
    return this.logs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    )
  }

  /**
   * Get logs for a specific input pattern
   */
  getLogsForInput(inputPattern: string): LowConfidenceLog[] {
    const pattern = inputPattern.toLowerCase()
    return this.logs.filter(log => 
      log.input.toLowerCase().includes(pattern)
    )
  }

  /**
   * Get confidence statistics
   */
  getConfidenceStats(): {
    total: number
    average: number
    min: number
    max: number
    belowThreshold: number
  } {
    if (this.logs.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0, belowThreshold: 0 }
    }

    const confidences = this.logs.map(log => log.confidence)
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    const min = Math.min(...confidences)
    const max = Math.max(...confidences)
    const belowThreshold = confidences.filter(conf => conf < 0.6).length

    return {
      total: this.logs.length,
      average,
      min,
      max,
      belowThreshold
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Get session ID for tracking
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('geocoding-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('geocoding-session-id', sessionId)
    }
    return sessionId
  }

  /**
   * Send log to analytics service (placeholder for production implementation)
   */
  private sendToAnalytics(log: LowConfidenceLog): void {
    // In production, you would send this to your analytics service
    // For now, we'll just store it locally
    
    // Example: Send to Google Analytics
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', 'low_confidence_geocoding', {
    //     input: log.input,
    //     confidence: log.confidence,
    //     result_label: log.result.normalizedLabel,
    //     source: log.source
    //   })
    // }

    // Example: Send to custom analytics endpoint
    // fetch('/api/analytics/geocoding', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(log)
    // }).catch(console.error)
  }
}

// Export singleton instance
export const geocodingLogger = new GeocodingLogger()

// Export class for testing
export { GeocodingLogger }
