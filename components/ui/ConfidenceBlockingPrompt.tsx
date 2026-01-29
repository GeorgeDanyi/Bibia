/**
 * Confidence-based blocking prompt component
 * Part B: Block search when confidence < 0.6 and offer map picker
 */

import React from 'react'
import { GeocodeResult } from '@/lib/types/geocoding'

interface ConfidenceBlockingPromptProps {
  result: GeocodeResult
  onRefineLocation: () => void
  onUseAnyway: () => void
  onPickOnMap: () => void
  className?: string
}

export function ConfidenceBlockingPrompt({
  result,
  onRefineLocation,
  onUseAnyway,
  onPickOnMap,
  className = ''
}: ConfidenceBlockingPromptProps) {
  const confidencePercentage = Math.round(result.confidence * 100)
  const isLowConfidence = result.confidence < 0.6

  const getConfidenceColor = () => {
    if (result.confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (result.confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceLabel = () => {
    if (result.confidence >= 0.8) return 'Vysoká'
    if (result.confidence >= 0.6) return 'Střední'
    return 'Nízká'
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-amber-800">
              {isLowConfidence ? 'Nízká přesnost polohy' : 'Střední přesnost polohy'}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor()}`}>
              {getConfidenceLabel()} ({confidencePercentage}%)
            </span>
          </div>
          
          <p className="text-sm text-amber-700 mb-3">
            Nalezená poloha: <strong>{result.normalizedLabel}</strong>
          </p>
          
          {isLowConfidence && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
              <p className="text-sm text-red-700">
                <strong>Doporučujeme upřesnit polohu</strong> - nízká přesnost může ovlivnit kvalitu výsledků vyhledávání.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm text-amber-700">
              Co chcete udělat?
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onPickOnMap}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Vybrat na mapě
              </button>
              
              <button
                onClick={onRefineLocation}
                className="px-3 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Upřesnit název
              </button>
              
              <button
                onClick={onUseAnyway}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Použít takto
              </button>
            </div>
          </div>
          
          {isLowConfidence && (
            <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-700">
              💡 <strong>Tip:</strong> Výběr na mapě poskytuje nejpřesnější výsledky
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ConfidenceIndicatorProps {
  confidence: number
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ConfidenceIndicator({ 
  confidence, 
  showPercentage = true, 
  size = 'md',
  className = '' 
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100)
  
  const getColor = () => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }
  
  const getLabel = () => {
    if (confidence >= 0.8) return 'Vysoká'
    if (confidence >= 0.6) return 'Střední'
    return 'Nízká'
  }
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs'
      case 'lg': return 'px-3 py-1.5 text-sm'
      default: return 'px-2.5 py-1 text-xs'
    }
  }
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${getColor()} ${getSizeClasses()} ${className}`}>
      {getLabel()}
      {showPercentage && (
        <span className="ml-1 opacity-75">
          ({percentage}%)
        </span>
      )}
    </span>
  )
}
