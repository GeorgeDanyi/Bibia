/**
 * Enhanced location input with confidence-based blocking and map picker
 * Part B: Integrates confidence checking, blocking, and map picker fallback
 */

import React, { useState, useCallback } from 'react'
import { LocationInput } from './LocationInput'
import { ConfidenceBlockingPrompt } from './ConfidenceBlockingPrompt'
import { MapPicker } from './MapPicker'
import { GeocodeResult } from '@/lib/types/geocoding'
import { geocodingService } from '@/lib/services/geocoding'

interface EnhancedLocationInputProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: { lat: number; lng: number; city: string; confidence: number }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  confidenceThreshold?: number
  enableMapPicker?: boolean
}

export function EnhancedLocationInput({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Zadejte název města...",
  className = "",
  disabled = false,
  confidenceThreshold = 0.6,
  enableMapPicker = true
}: EnhancedLocationInputProps) {
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null)
  const [showConfidencePrompt, setShowConfidencePrompt] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Handle location input change
  const handleLocationChange = useCallback((newValue: string) => {
    onChange(newValue)
    setGeocodeResult(null)
    setShowConfidencePrompt(false)
  }, [onChange])

  // Handle location selection from input
  const handleLocationSelect = useCallback(async (location: { lat: number; lng: number; city: string }) => {
    try {
      setIsGeocoding(true)
      
      // Use the enhanced geocoding service to get confidence
      const response = await geocodingService.resolveUserLocation(location.city)
      
      if (response.success && response.result) {
        const result = response.result
        
        // Check confidence threshold
        if (result.confidence < confidenceThreshold) {
          setGeocodeResult(result)
          setShowConfidencePrompt(true)
          return
        }
        
        // High confidence - proceed directly
        if (onLocationSelect) {
          onLocationSelect({
            lat: result.lat,
            lng: result.lng,
            city: result.city || location.city,
            confidence: result.confidence
          })
        }
        
        setGeocodeResult(null)
        setShowConfidencePrompt(false)
      } else {
        // Handle geocoding error
        console.error('Geocoding failed:', response.error)
      }
    } catch (error) {
      console.error('Location selection error:', error)
    } finally {
      setIsGeocoding(false)
    }
  }, [confidenceThreshold, onLocationSelect])

  // Handle confidence prompt actions
  const handleRefineLocation = useCallback(() => {
    setShowConfidencePrompt(false)
    setGeocodeResult(null)
    // Focus back to input for refinement
  }, [])

  const handleUseAnyway = useCallback(() => {
    if (geocodeResult && onLocationSelect) {
      onLocationSelect({
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        city: geocodeResult.city || value,
        confidence: geocodeResult.confidence
      })
    }
    setShowConfidencePrompt(false)
    setGeocodeResult(null)
  }, [geocodeResult, onLocationSelect, value])

  const handlePickOnMap = useCallback(() => {
    setShowMapPicker(true)
    setShowConfidencePrompt(false)
  }, [])

  // Handle map picker selection
  const handleMapLocationSelect = useCallback((location: { lat: number; lng: number; label: string }) => {
    if (onLocationSelect) {
      onLocationSelect({
        lat: location.lat,
        lng: location.lng,
        city: location.label,
        confidence: 1.0 // Map selection is always high confidence
      })
    }
    
    // Update the input value with the selected location
    onChange(location.label)
    
    setShowMapPicker(false)
    setGeocodeResult(null)
    setShowConfidencePrompt(false)
  }, [onLocationSelect, onChange])

  const handleMapPickerCancel = useCallback(() => {
    setShowMapPicker(false)
    setShowConfidencePrompt(true) // Show confidence prompt again
  }, [])

  // Handle direct geocoding (when user types and presses enter)
  const handleDirectGeocoding = useCallback(async (inputValue: string) => {
    if (!inputValue.trim()) return

    try {
      setIsGeocoding(true)
      
      const response = await geocodingService.resolveUserLocation(inputValue)
      
      if (response.success && response.result) {
        const result = response.result
        
        // Check confidence threshold
        if (result.confidence < confidenceThreshold) {
          setGeocodeResult(result)
          setShowConfidencePrompt(true)
          return
        }
        
        // High confidence - proceed directly
        if (onLocationSelect) {
          onLocationSelect({
            lat: result.lat,
            lng: result.lng,
            city: result.city || inputValue,
            confidence: result.confidence
          })
        }
      }
    } catch (error) {
      console.error('Direct geocoding error:', error)
    } finally {
      setIsGeocoding(false)
    }
  }, [confidenceThreshold, onLocationSelect])

  return (
    <div className={className}>
      {/* Main location input */}
      <LocationInput
        value={value}
        onChange={handleLocationChange}
        onLocationSelect={handleLocationSelect}
        placeholder={placeholder}
        disabled={disabled || isGeocoding}
        showSuggestions={true}
        validateOnChange={true}
      />

      {/* Loading indicator */}
      {isGeocoding && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Kontrola přesnosti polohy...</span>
        </div>
      )}

      {/* Confidence blocking prompt */}
      {showConfidencePrompt && geocodeResult && (
        <div className="mt-3">
          <ConfidenceBlockingPrompt
            result={geocodeResult}
            onRefineLocation={handleRefineLocation}
            onUseAnyway={handleUseAnyway}
            onPickOnMap={handlePickOnMap}
          />
        </div>
      )}

      {/* Map picker modal */}
      {enableMapPicker && showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <MapPicker
              initialLocation={geocodeResult ? { lat: geocodeResult.lat, lng: geocodeResult.lng } : undefined}
              onLocationSelect={handleMapLocationSelect}
              onCancel={handleMapPickerCancel}
            />
          </div>
        </div>
      )}

      {/* Direct geocoding button (for manual trigger) */}
      {value.trim() && !showConfidencePrompt && !showMapPicker && (
        <div className="mt-2">
          <button
            onClick={() => handleDirectGeocoding(value)}
            disabled={isGeocoding}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeocoding ? 'Kontrola...' : 'Zkontrolovat polohu'}
          </button>
        </div>
      )}
    </div>
  )
}
