"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { CityService, CityData, CityResolution } from '@/lib/services/CityService'

export interface CityInputProps {
  value: string
  onChange: (value: string) => void
  onCityResolved?: (resolution: CityResolution | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  featureFlags?: {
    citiesAutocomplete?: boolean
    useGeolocation?: boolean
  }
  showHelperText?: boolean
}

export default function CityInput({
  value,
  onChange,
  onCityResolved,
  placeholder = "Např. Praha, Brno, Ostrava",
  className = "",
  disabled = false,
  featureFlags = { citiesAutocomplete: false, useGeolocation: false },
  showHelperText = true
}: CityInputProps) {
  const [suggestions, setSuggestions] = useState<CityData[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isResolved, setIsResolved] = useState(false)
  const [helperText, setHelperText] = useState<string>("")
  const [isGeolocating, setIsGeolocating] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const normalizedValue = CityService.normalize(inputValue)
    
    onChange(normalizedValue)
    setIsResolved(false)
    setHelperText("")

    // Show autocomplete suggestions if feature is enabled
    if (featureFlags.citiesAutocomplete && normalizedValue.length > 0) {
      const matches = CityService.searchCities(normalizedValue, 8)
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
      setSelectedIndex(-1)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }, [onChange, featureFlags.citiesAutocomplete])

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
      
      // Try to resolve the city
      if (value.trim()) {
        const resolution = CityService.resolve(value)
        setIsResolved(!!resolution)
        
        if (resolution) {
          onCityResolved?.(resolution)
          setHelperText("")
        } else {
          onCityResolved?.(null)
          if (showHelperText) {
            setHelperText("Město jsme nenašli. Zkus jiný název nebo nejbližší větší město.")
          }
        }
      }
    }, 200)
  }, [value, onCityResolved, showHelperText])

  // Handle suggestion selection
  const handleSuggestionClick = useCallback((city: CityData) => {
    const normalizedName = CityService.normalize(city.name)
    onChange(normalizedName)
    setShowSuggestions(false)
    setIsResolved(true)
    setHelperText("")
    
    const resolution: CityResolution = {
      city: city.name,
      lat: city.lat,
      lng: city.lng
    }
    onCityResolved?.(resolution)
  }, [onChange, onCityResolved])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionClick])

  // Handle geolocation
  const handleGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setHelperText("Geolokace není podporována v tomto prohlížeči.")
      return
    }

    setIsGeolocating(true)
    setHelperText("Získávám vaši polohu...")

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      const nearestCity = CityService.findNearestCity(latitude, longitude)
      
      if (nearestCity) {
        onChange(nearestCity.city)
        setIsResolved(true)
        setHelperText("")
        onCityResolved?.(nearestCity)
      } else {
        setHelperText("Nepodařilo se najít nejbližší město.")
      }
    } catch (error) {
      console.error('Geolocation error:', error)
      setHelperText("Nepodařilo se získat vaši polohu. Zkuste to znovu.")
    } finally {
      setIsGeolocating(false)
    }
  }, [onChange, onCityResolved])

  // Focus management
  const handleFocus = useCallback(() => {
    if (featureFlags.citiesAutocomplete && value.length > 0) {
      const matches = CityService.searchCities(value, 8)
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    }
  }, [featureFlags.citiesAutocomplete, value])

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="relative flex-1">
          {/* City Icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] focus:outline-none transition-all duration-200 ${
              isResolved ? 'border-[#0d9488] bg-[#f0fdfa]' : helperText ? 'border-red-300 bg-red-50/50' : 'bg-white hover:border-[#0d9488]/30'
            } ${className}`}
          />
        </div>
        
        {featureFlags.useGeolocation && (
          <button
            type="button"
            onClick={handleGeolocation}
            disabled={disabled || isGeolocating}
            className="px-4 py-4 border border-gray-200 text-gray-600 rounded-xl hover:border-[#0d9488]/30 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap transition-all duration-200 shadow-sm"
          >
            {isGeolocating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Načítám...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-[#0a6b5c]">Použít moji polohu</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
        >
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.lat}-${city.lng}`}
              type="button"
              onClick={() => handleSuggestionClick(city)}
              className={`w-full px-4 py-3 text-left hover:bg-[#E9F7F3] focus:bg-[#E9F7F3] focus:outline-none transition-colors duration-150 ${
                index === selectedIndex ? 'bg-[#E9F7F3]' : ''
              } ${index === 0 ? 'rounded-t-xl' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{city.name}</div>
              {city.zip && (
                <div className="text-sm text-gray-500">PSČ: {city.zip}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {helperText && (
        <div className={`mt-2 text-sm ${
          isResolved ? 'text-[#0d9488]' : 'text-red-600'
        }`}>
          {helperText}
        </div>
      )}
    </div>
  )
}
