export interface CzechPlace {
  name: string
  zip: string
  lat: number
  lon: number
}

let placesCache: CzechPlace[] | null = null

export async function loadPlaces(): Promise<CzechPlace[]> {
  if (placesCache) {
    return placesCache
  }

  try {
    // Always use fetch for client-side compatibility
    const response = await fetch('/data/cz_places.json')
    if (!response.ok) {
      throw new Error(`Failed to load places: ${response.statusText}`)
    }
    placesCache = await response.json()
    return placesCache || []
  } catch (error) {
    console.error('Error loading Czech places:', error)
    return []
  }
}

export function searchPlaces(query: string, places: CzechPlace[]): CzechPlace[] {
  if (!query || query.length < 2) {
    return []
  }

  const normalizedQuery = query.toLowerCase().trim()
  
  return places
    .filter(place => {
      const normalizedName = place.name.toLowerCase()
      const normalizedZip = place.zip
      
      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedZip.includes(normalizedQuery) ||
        // Handle accented characters
        normalizedName.replace(/[áčďéěíňóřšťúůýž]/g, (char) => {
          const map: { [key: string]: string } = {
            'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e',
            'í': 'i', 'ň': 'n', 'ó': 'o', 'ř': 'r', 'š': 's',
            'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z'
          }
          return map[char] || char
        }).includes(normalizedQuery)
      )
    })
    .slice(0, 5) // Limit to 5 results
}

export function findPlaceByCoordinates(lat: number, lon: number, places: CzechPlace[]): CzechPlace | null {
  if (!places.length) return null

  let closestPlace: CzechPlace | null = null
  let minDistance = Infinity

  for (const place of places) {
    const distance = Math.sqrt(
      Math.pow(place.lat - lat, 2) + Math.pow(place.lon - lon, 2)
    )
    
    if (distance < minDistance) {
      minDistance = distance
      closestPlace = place
    }
  }

  // Only return if within reasonable distance (roughly 10km)
  return minDistance < 0.1 ? closestPlace : null
}
