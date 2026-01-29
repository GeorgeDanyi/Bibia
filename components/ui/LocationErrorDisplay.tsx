/**
 * User-friendly location error display component
 * Part A: Provide actionable feedback when location cannot be resolved
 */

import React from 'react'
import { GeocodeError } from '@/lib/types/geocoding'

interface LocationErrorDisplayProps {
  error: GeocodeError
  onRetry?: () => void
  onSuggestionClick?: (suggestion: string) => void
  className?: string
}

export function LocationErrorDisplay({ 
  error, 
  onRetry, 
  onSuggestionClick,
  className = '' 
}: LocationErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'validation':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'network':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      case 'service':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'not_found':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'ambiguous':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'bounds':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case 'validation':
        return 'Neplatný vstup'
      case 'network':
        return 'Problém s připojením'
      case 'service':
        return 'Služba není dostupná'
      case 'not_found':
        return 'Město nebylo nalezeno'
      case 'ambiguous':
        return 'Nejasný výsledek'
      case 'bounds':
        return 'Místo mimo Českou republiku'
      default:
        return 'Chyba při vyhledávání'
    }
  }

  const getActionableMessage = () => {
    if (!error.actionable) {
      return null
    }

    switch (error.type) {
      case 'validation':
        return 'Zkuste zadat název města v České republice bez speciálních znaků.'
      case 'network':
        return 'Zkontrolujte připojení k internetu a zkuste to znovu.'
      case 'not_found':
        return 'Zkuste zadat jiný název města nebo použijte mapu pro výběr polohy.'
      case 'ambiguous':
        return 'Buďte prosím konkrétnější s názvem města.'
      case 'bounds':
        return 'Zkuste zadat město v České republice.'
      default:
        return 'Zkuste to znovu nebo kontaktujte podporu.'
    }
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            {getErrorTitle()}
          </h3>
          <p className="text-sm text-red-700 mb-3">
            {error.userMessage}
          </p>
          
          {getActionableMessage() && (
            <p className="text-sm text-red-600 mb-3">
              {getActionableMessage()}
            </p>
          )}

          {/* Suggestions */}
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-red-700 mb-2">
                Možné alternativy:
              </p>
              <div className="flex flex-wrap gap-2">
                {error.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors border border-red-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Zkusit znovu
              </button>
            )}
            <button
              onClick={() => window.open('https://www.google.com/maps', '_blank')}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Otevřít mapu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface LocationWarningDisplayProps {
  warnings: string[]
  className?: string
}

export function LocationWarningDisplay({ warnings, className = '' }: LocationWarningDisplayProps) {
  if (!warnings || warnings.length === 0) {
    return null
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800 mb-1">
            Upozornění
          </h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
