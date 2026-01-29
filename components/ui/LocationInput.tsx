/**
 * Enhanced location input component with validation and error handling
 * Part A: Provide actionable feedback and eliminate silent failures
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { GeocodeResponse, GeocodeError } from '@/lib/types/geocoding'
import { LocationErrorDisplay, LocationWarningDisplay } from './LocationErrorDisplay'

interface LocationInputProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: { lat: number; lng: number; city: string }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showSuggestions?: boolean
  validateOnChange?: boolean
}

interface LocationSuggestion {
  label: string
  city: string
  postalCode?: string
  lat: number
  lon: number
  confidence?: 'high' | 'medium' | 'low'
}

export function LocationInput({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Zadejte název města...",
  className = "",
  disabled = false,
  showSuggestions = true,
  validateOnChange = true
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<GeocodeError | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [lastValidatedValue, setLastValidatedValue] = useState('')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  // Debounced geocoding
  const debouncedGeocode = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([])
        setShowDropdown(false)
        setError(null)
        setWarnings([])
        return
      }

      await performGeocoding(query)
    }, 300)
  }, [])

  // Perform geocoding with error handling
  const performGeocoding = async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)
    setWarnings([])

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
        signal: abortControllerRef.current.signal
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.error) {
          setError(data.error)
        } else {
          setError({
            type: 'service',
            message: 'Unknown error',
            userMessage: 'Nastala neočekávaná chyba při vyhledávání.',
            actionable: false
          })
        }
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      if (data.results && data.results.length > 0) {
        setSuggestions(data.results)
        setShowDropdown(true)
        setError(null)
      } else {
        setSuggestions([])
        setShowDropdown(false)
        setError({
          type: 'not_found',
          message: 'No results found',
          userMessage: `Město "${query}" nebylo nalezeno. Zkuste jiný název.`,
          actionable: true,
          suggestions: ['Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec']
        })
      }

      if (data.warnings) {
        setWarnings(data.warnings)
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled
      }

      console.error('Geocoding error:', err)
      setError({
        type: 'network',
        message: 'Network error',
        userMessage: 'Problém s připojením. Zkuste to znovu.',
        actionable: true
      })
      setSuggestions([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (validateOnChange && newValue !== lastValidatedValue) {
      debouncedGeocode(newValue)
      setLastValidatedValue(newValue)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.city)
    setShowDropdown(false)
    setError(null)
    setWarnings([])
    
    if (onLocationSelect) {
      onLocationSelect({
        lat: suggestion.lat,
        lng: suggestion.lon,
        city: suggestion.city
      })
    }
  }

  // Handle suggestion click from error display
  const handleErrorSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setError(null)
    debouncedGeocode(suggestion)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle retry
  const handleRetry = () => {
    if (value.trim()) {
      debouncedGeocode(value)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            ${isLoading ? 'pr-10' : ''}
          `}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`
                w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                ${index === selectedIndex ? 'bg-gray-100' : ''}
                ${suggestion.confidence === 'high' ? 'font-medium' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-900">{suggestion.label}</div>
                  {suggestion.postalCode && (
                    <div className="text-xs text-gray-500">{suggestion.postalCode}</div>
                  )}
                </div>
                {suggestion.confidence && (
                  <div className={`
                    text-xs px-2 py-1 rounded
                    ${suggestion.confidence === 'high' ? 'bg-green-100 text-green-800' : ''}
                    ${suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${suggestion.confidence === 'low' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {suggestion.confidence === 'high' ? 'Vysoká' : 
                     suggestion.confidence === 'medium' ? 'Střední' : 'Nízká'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-2">
          <LocationErrorDisplay
            error={error}
            onRetry={handleRetry}
            onSuggestionClick={handleErrorSuggestionClick}
          />
        </div>
      )}

      {/* Warning display */}
      {warnings.length > 0 && !error && (
        <div className="mt-2">
          <LocationWarningDisplay warnings={warnings} />
        </div>
      )}
    </div>
  )
}
