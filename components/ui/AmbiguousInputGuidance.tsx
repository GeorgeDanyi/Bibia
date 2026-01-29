/**
 * Ambiguous input guidance component
 * Part C: Guide users to correct ambiguous locations and prevent 0 results forever
 */

import React from 'react'
import { LocationGuidance } from '@/lib/services/ambiguous-input-handler'

interface AmbiguousInputGuidanceProps {
  guidance: LocationGuidance
  onSuggestionSelect?: (suggestion: string) => void
  onMapPicker?: () => void
  onRefineInput?: () => void
  onRetry?: () => void
  className?: string
}

export function AmbiguousInputGuidance({
  guidance,
  onSuggestionSelect,
  onMapPicker,
  onRefineInput,
  onRetry,
  className = ''
}: AmbiguousInputGuidanceProps) {
  const getIcon = () => {
    switch (guidance.type) {
      case 'ambiguous':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'not_found':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'low_confidence':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'invalid':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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

  const getTitle = () => {
    switch (guidance.type) {
      case 'ambiguous':
        return 'Nejasný vstup'
      case 'not_found':
        return 'Město nebylo nalezeno'
      case 'low_confidence':
        return 'Nízká přesnost polohy'
      case 'invalid':
        return 'Neplatný vstup'
      default:
        return 'Problém s polohou'
    }
  }

  const getBackgroundColor = () => {
    switch (guidance.type) {
      case 'ambiguous':
        return 'bg-yellow-50 border-yellow-200'
      case 'not_found':
        return 'bg-red-50 border-red-200'
      case 'low_confidence':
        return 'bg-amber-50 border-amber-200'
      case 'invalid':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (guidance.type) {
      case 'ambiguous':
        return 'text-yellow-800'
      case 'not_found':
        return 'text-red-800'
      case 'low_confidence':
        return 'text-amber-800'
      case 'invalid':
        return 'text-red-800'
      default:
        return 'text-gray-800'
    }
  }

  const handleAction = (action: any) => {
    switch (action.action) {
      case 'select':
        if (action.data?.suggestions && action.data.suggestions.length > 0) {
          // Show suggestions for selection
          return
        }
        break
      case 'map':
        onMapPicker?.()
        break
      case 'refine':
        onRefineInput?.()
        break
      case 'retry':
        onRetry?.()
        break
    }
  }

  return (
    <div className={`${getBackgroundColor()} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${getTextColor()} mb-1`}>
            {getTitle()}
          </h3>
          
          <p className={`text-sm ${getTextColor().replace('800', '700')} mb-3`}>
            {guidance.message}
          </p>

          {/* Suggestions */}
          {guidance.suggestions && guidance.suggestions.length > 0 && (
            <div className="mb-3">
              <p className={`text-sm ${getTextColor().replace('800', '700')} mb-2`}>
                Možné alternativy:
              </p>
              <div className="flex flex-wrap gap-2">
                {guidance.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionSelect?.(suggestion)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors border ${
                      guidance.type === 'ambiguous' 
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                        : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {guidance.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  action.action === 'map'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : action.action === 'select'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Help text */}
          <div className={`mt-3 p-2 rounded text-xs ${getTextColor().replace('800', '600')} bg-opacity-50`}>
            💡 <strong>Tip:</strong> Pro nejlepší výsledky zadejte úplný název města nebo použijte mapu pro přesný výběr polohy.
          </div>
        </div>
      </div>
    </div>
  )
}

interface SuggestionSelectorProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  onCancel: () => void
  className?: string
}

export function SuggestionSelector({
  suggestions,
  onSelect,
  onCancel,
  className = ''
}: SuggestionSelectorProps) {
  return (
    <div className={`bg-white border border-gray-300 rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Vyberte město
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Klikněte na město, které jste měli na mysli
        </p>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion)}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  )
}
