/**
 * Map picker component for precise coordinate selection
 * Part B: Optional step to set precise coordinates; then re-run search
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { CZECH_BOUNDS } from '@/lib/types/geocoding'

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number }
  onLocationSelect: (location: { lat: number; lng: number; label: string }) => void
  onCancel: () => void
  className?: string
}

interface MapMarker {
  lat: number
  lng: number
  label: string
}

export function MapPicker({
  initialLocation,
  onLocationSelect,
  onCancel,
  className = ''
}: MapPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapMarker | null>(
    initialLocation ? {
      lat: initialLocation.lat,
      lng: initialLocation.lng,
      label: `Vybraná poloha (${initialLocation.lat.toFixed(4)}, ${initialLocation.lng.toFixed(4)})`
    } : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const initializeMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if Mapbox is available
        if (typeof window === 'undefined' || !window.mapboxgl) {
          throw new Error('Mapbox GL JS is not available')
        }

        const mapboxgl = window.mapboxgl

        // Set default access token if not configured
        if (!mapboxgl.accessToken && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
          mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        }

        if (!mapboxgl.accessToken) {
          throw new Error('Mapbox access token is not configured')
        }

        // Create map
        const map = new mapboxgl.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [14.4378, 50.0755], // Prague
          zoom: initialLocation ? 12 : 8,
          maxBounds: [
            [CZECH_BOUNDS.minLng, CZECH_BOUNDS.minLat],
            [CZECH_BOUNDS.maxLng, CZECH_BOUNDS.maxLat]
          ]
        })

        mapInstanceRef.current = map

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        })
        map.addControl(geolocate, 'top-left')

        // Handle map clicks
        map.on('click', (e: any) => {
          const { lng, lat } = e.lngLat
          
          // Validate coordinates are within Czech Republic
          if (lat < CZECH_BOUNDS.minLat || lat > CZECH_BOUNDS.maxLat ||
              lng < CZECH_BOUNDS.minLng || lng > CZECH_BOUNDS.maxLng) {
            setError('Vybraná poloha je mimo Českou republiku. Zkuste vybrat jiné místo.')
            return
          }

          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.remove()
          }

          // Add new marker
          const marker = new mapboxgl.Marker({
            color: '#3B82F6',
            draggable: true
          })
            .setLngLat([lng, lat])
            .addTo(map)

          markerRef.current = marker

          // Update selected location
          const newLocation: MapMarker = {
            lat,
            lng,
            label: `Vybraná poloha (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          }
          setSelectedLocation(newLocation)
          setError(null)

          // Handle marker drag
          marker.on('dragend', () => {
            const newLngLat = marker.getLngLat()
            const newMarker: MapMarker = {
              lat: newLngLat.lat,
              lng: newLngLat.lng,
              label: `Vybraná poloha (${newLngLat.lat.toFixed(4)}, ${newLngLat.lng.toFixed(4)})`
            }
            setSelectedLocation(newMarker)
          })
        })

        // Add initial marker if location provided
        if (initialLocation) {
          const marker = new mapboxgl.Marker({
            color: '#3B82F6',
            draggable: true
          })
            .setLngLat([initialLocation.lng, initialLocation.lat])
            .addTo(map)

          markerRef.current = marker
        }

        // Handle geolocate success
        geolocate.on('geolocate', (e: any) => {
          const { longitude, latitude } = e.coords
          
          if (latitude < CZECH_BOUNDS.minLat || latitude > CZECH_BOUNDS.maxLat ||
              longitude < CZECH_BOUNDS.minLng || longitude > CZECH_BOUNDS.maxLng) {
            setError('Vaše poloha je mimo Českou republiku.')
            return
          }

          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.remove()
          }

          // Add new marker
          const marker = new mapboxgl.Marker({
            color: '#10B981',
            draggable: true
          })
            .setLngLat([longitude, latitude])
            .addTo(map)

          markerRef.current = marker

          // Update selected location
          const newLocation: MapMarker = {
            lat: latitude,
            lng: longitude,
            label: `Moje poloha (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          }
          setSelectedLocation(newLocation)
          setError(null)

          // Center map on location
          map.flyTo({
            center: [longitude, latitude],
            zoom: 14
          })
        })

      } catch (err) {
        console.error('Map initialization error:', err)
        setError('Nepodařilo se načíst mapu. Zkuste to znovu.')
      } finally {
        setIsLoading(false)
      }
    }

    initializeMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [initialLocation])

  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation)
    }
  }, [selectedLocation, onLocationSelect])

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolokace není podporována vaším prohlížečem.')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        if (latitude < CZECH_BOUNDS.minLat || latitude > CZECH_BOUNDS.maxLat ||
            longitude < CZECH_BOUNDS.minLng || longitude > CZECH_BOUNDS.maxLng) {
          setError('Vaše poloha je mimo Českou republiku.')
          setIsLoading(false)
          return
        }

        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.remove()
        }

        // Add new marker
        if (mapInstanceRef.current && window.mapboxgl) {
          const marker = new window.mapboxgl.Marker({
            color: '#10B981',
            draggable: true
          })
            .setLngLat([longitude, latitude])
            .addTo(mapInstanceRef.current)

          markerRef.current = marker

          // Update selected location
          const newLocation: MapMarker = {
            lat: latitude,
            lng: longitude,
            label: `Moje poloha (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          }
          setSelectedLocation(newLocation)

          // Center map on location
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 14
          })
        }

        setIsLoading(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Nepodařilo se získat vaši polohu. Zkuste to znovu.')
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }, [])

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Vyberte polohu na mapě
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Klikněte na mapu nebo použijte tlačítko pro získání vaší polohy
        </p>
      </div>

      <div className="p-4">
        {/* Map container */}
        <div className="relative">
          <div 
            ref={mapRef}
            className="w-full h-96 rounded-lg border border-gray-300"
            style={{ minHeight: '384px' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Načítání mapy...</span>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Selected location display */}
        {selectedLocation && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-blue-700 font-medium">
                {selectedLocation.label}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Moje poloha
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selectedLocation || isLoading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Potvrdit výběr
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Zrušit
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Jak použít mapu:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Klikněte na mapu pro výběr polohy</li>
            <li>• Přetáhněte značku pro přesné umístění</li>
            <li>• Použijte tlačítko &quot;Moje poloha&quot; pro GPS</li>
            <li>• Mapa je omezena na Českou republiku</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Extend Window interface for Mapbox GL
declare global {
  interface Window {
    mapboxgl: any
  }
}
