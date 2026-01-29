export interface GeocodeResult {
  label: string
  city: string
  postalCode?: string
  lat: number
  lon: number
}

export async function forwardGeocode(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) {
    return []
  }

  try {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }
    return await response.json()
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}
