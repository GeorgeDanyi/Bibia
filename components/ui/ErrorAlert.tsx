'use client'

import React from 'react'
import { AlertTriangle, X, RefreshCw } from 'lucide-react'

interface ErrorAlertProps {
  queryId: string
  error: string
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

export function ErrorAlert({
  queryId,
  error,
  reason,
  severity,
  recoverable,
  onDismiss,
  onRetry,
  className = ''
}: ErrorAlertProps) {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIconColor = () => {
    switch (severity) {
      case 'critical':
        return 'text-red-500'
      case 'high':
        return 'text-orange-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getSeverityStyles()} ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${getIconColor()}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">
              {severity === 'critical' && 'Kritická chyba'}
              {severity === 'high' && 'Vysoká priorita'}
              {severity === 'medium' && 'Problém s vyhledáváním'}
              {severity === 'low' && 'Informace'}
            </h3>
            <div className="flex items-center gap-2">
              {recoverable && onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs px-2 py-1 rounded hover:bg-white/50 transition-colors flex items-center gap-1"
                  title="Zkusit znovu"
                >
                  <RefreshCw className="w-3 h-3" />
                  Zkusit znovu
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs px-2 py-1 rounded hover:bg-white/50 transition-colors"
                  title="Zavřít"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          <p className="text-sm mt-1">
            {reason}
          </p>
          
          <div className="mt-2 text-xs opacity-75">
            ID dotazu: <code className="bg-white/30 px-1 rounded">{queryId}</code>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer hover:underline">
                Technické detaily
              </summary>
              <pre className="text-xs mt-1 bg-white/30 p-2 rounded overflow-auto">
                {error}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

interface ErrorAlertManagerProps {
  errors: Array<{
    id: string
    queryId: string
    error: string
    reason: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    recoverable: boolean
    timestamp: number
  }>
  onDismiss: (id: string) => void
  onRetry: (id: string) => void
  className?: string
}

export function ErrorAlertManager({
  errors,
  onDismiss,
  onRetry,
  className = ''
}: ErrorAlertManagerProps) {
  if (errors.length === 0) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {errors.map((error) => (
        <ErrorAlert
          key={error.id}
          queryId={error.queryId}
          error={error.error}
          reason={error.reason}
          severity={error.severity}
          recoverable={error.recoverable}
          onDismiss={() => onDismiss(error.id)}
          onRetry={() => onRetry(error.id)}
        />
      ))}
    </div>
  )
}
