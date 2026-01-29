import { NextRequest, NextResponse } from 'next/server'
import MapboxClient from '@mapbox/mapbox-sdk'
import GeocodingService from '@mapbox/mapbox-sdk/services/geocoding'
import { loadPlaces, searchPlaces, CzechPlace } from '@/lib/data/cz-places'
import { validateLocationInput, generateLocationSuggestions } from '@/lib/validation/location'
import { CZECH_BOUNDS } from '@/lib/types/geocoding'

interface GeocodeApiResponse {
  success: boolean
  results?: Array<{
    label: string
    city: string
    postalCode?: string
    lat: number
    lon: number
    confidence?: 'high' | 'medium' | 'low'
  }>
  error?: {
    type: string
    message: string
    userMessage: string
    suggestions?: string[]
  }
  warnings?: string[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  // Validate input
  if (!query) {
    return NextResponse.json({
      success: false,
      error: {
        type: 'validation',
        message: 'Query parameter is required',
        userMessage: 'Vyhledávací dotaz je povinný.'
      }
    } as GeocodeApiResponse, { status: 400 })
  }

  // Validate location input
  const validation = validateLocationInput(query)
  if (!validation.isValid) {
    return NextResponse.json({
      success: false,
      error: {
        type: 'validation',
        message: `Invalid input: ${validation.errors.join(', ')}`,
        userMessage: 'Neplatný vstup. Zkuste zadat název města v České republice.',
        suggestions: generateLocationSuggestions(query)
      },
      warnings: validation.warnings
    } as GeocodeApiResponse, { status: 400 })
  }

  const sanitizedQuery = validation.sanitizedInput!

  // Check if Mapbox is configured
  const hasMapboxToken = process.env.MAPBOX_TOKEN && process.env.MAPBOX_TOKEN !== 'pk.test_token_placeholder'

  if (!hasMapboxToken) {
    console.warn('MAPBOX_TOKEN not configured, using local Czech places data')
    
    try {
      const places = await loadPlaces()
      const searchResults = searchPlaces(sanitizedQuery, places)
      
      if (!searchResults || searchResults.length === 0) {
        return NextResponse.json({
          success: false,
          error: {
            type: 'not_found',
            message: 'No results found in local data',
            userMessage: `Město "${sanitizedQuery}" nebylo nalezeno. Zkuste jiný název.`,
            suggestions: generateLocationSuggestions(sanitizedQuery)
          },
          warnings: validation.warnings
        } as GeocodeApiResponse, { status: 404 })
      }
      
      const results = searchResults.map(place => ({
        label: `${place.name}, Czech Republic`,
        city: place.name,
        postalCode: place.zip,
        lat: place.lat,
        lon: place.lon,
        confidence: determineConfidence(place.name, sanitizedQuery) as 'high' | 'medium' | 'low'
      }))
      
      return NextResponse.json({
        success: true,
        results,
        warnings: validation.warnings
      } as GeocodeApiResponse)
    } catch (error) {
      console.error('Error loading local places:', error)
      return NextResponse.json({
        success: false,
        error: {
          type: 'service',
          message: 'Local geocoding service failed',
          userMessage: 'Lokální geocoding služba selhala. Zkuste to později.'
        },
        warnings: validation.warnings
      } as GeocodeApiResponse, { status: 500 })
    }
  }

  // Use Mapbox service
  try {
    const mapboxClient = MapboxClient({ accessToken: process.env.MAPBOX_TOKEN! })
    const geocoding = GeocodingService(mapboxClient)
    
    const response = await geocoding.forwardGeocode({
      query: sanitizedQuery,
      countries: ['cz'],
      types: ['place', 'postcode', 'locality', 'neighborhood', 'address'],
      limit: 5,
      proximity: [14.4378, 50.0755], // Prague coordinates for better Czech results
    })

    if (!response.body.features || response.body.features.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'not_found',
          message: 'No results from Mapbox',
          userMessage: `Město "${sanitizedQuery}" nebylo nalezeno. Zkuste jiný název.`,
          suggestions: generateLocationSuggestions(sanitizedQuery)
        },
        warnings: validation.warnings
      } as GeocodeApiResponse, { status: 404 })
    }

    const results = response.body.features.map(feature => {
      const context = feature.context || []
      const place = context.find(c => c.id.startsWith('place.'))
      const postcode = context.find(c => c.id.startsWith('postcode.'))
      
      const lat = feature.center[1]
      const lon = feature.center[0]
      
      // Validate coordinates are within Czech Republic bounds
      const isWithinBounds = lat >= CZECH_BOUNDS.minLat && lat <= CZECH_BOUNDS.maxLat &&
                            lon >= CZECH_BOUNDS.minLng && lon <= CZECH_BOUNDS.maxLng
      
      if (!isWithinBounds) {
        console.warn(`Coordinates outside Czech Republic bounds: ${lat}, ${lon}`)
      }
      
      return {
        label: feature.place_name,
        city: place?.text || feature.text || '',
        postalCode: postcode?.text,
        lat,
        lon,
        confidence: determineConfidence(place?.text || feature.text || '', sanitizedQuery) as 'high' | 'medium' | 'low'
      }
    })

    // Filter out results outside Czech Republic bounds
    const validResults = results.filter(result => {
      const isWithinBounds = result.lat >= CZECH_BOUNDS.minLat && result.lat <= CZECH_BOUNDS.maxLat &&
                            result.lon >= CZECH_BOUNDS.minLng && result.lon <= CZECH_BOUNDS.maxLng
      return isWithinBounds
    })

    if (validResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'bounds',
          message: 'All results are outside Czech Republic bounds',
          userMessage: 'Nalezené výsledky jsou mimo Českou republiku.',
          suggestions: generateLocationSuggestions(sanitizedQuery)
        },
        warnings: validation.warnings
      } as GeocodeApiResponse, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      results: validResults,
      warnings: validation.warnings
    } as GeocodeApiResponse)

  } catch (error) {
    console.error('Mapbox geocoding error:', error)
    return NextResponse.json({
      success: false,
      error: {
        type: 'service',
        message: 'Mapbox geocoding service failed',
        userMessage: 'Externí geocoding služba selhala. Zkuste to později.'
      },
      warnings: validation.warnings
    } as GeocodeApiResponse, { status: 500 })
  }
}

/**
 * Determine confidence level based on match quality
 */
function determineConfidence(resultCity: string, input: string): 'high' | 'medium' | 'low' {
  const inputLower = input.toLowerCase()
  const cityLower = resultCity.toLowerCase()
  
  // Exact match
  if (cityLower === inputLower) {
    return 'high'
  }
  
  // Contains match
  if (cityLower.includes(inputLower) || inputLower.includes(cityLower)) {
    return 'medium'
  }
  
  return 'low'
}
