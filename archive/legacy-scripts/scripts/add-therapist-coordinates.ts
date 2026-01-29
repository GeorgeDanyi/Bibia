import fs from 'fs/promises'
import path from 'path'

interface CzechPlace {
  name: string
  zip: string
  lat: number
  lon: number
}

interface Therapist {
  id: string
  fullName: string
  city: string
  regions: string[]
  languages: string[]
  yearsExperience: number
  pricePerSession: number
  availability: any[]
  specialties: string[]
  insurance: string[]
  clinicLat?: number
  clinicLon?: number
  homeVisitRadiusKm?: number
  [key: string]: any
}

async function loadCzechPlaces(): Promise<CzechPlace[]> {
  const filePath = path.join(process.cwd(), 'data', 'cz_places.json')
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

function findPlaceByCity(city: string, places: CzechPlace[]): CzechPlace | null {
  // Direct match
  let match = places.find(place => 
    place.name.toLowerCase() === city.toLowerCase()
  )
  
  if (match) return match
  
  // Handle Prague districts
  if (city.toLowerCase().includes('praha')) {
    // Try to find any Prague district
    match = places.find(place => 
      place.name.toLowerCase().startsWith('praha')
    )
    if (match) return match
  }
  
  // Handle partial matches (remove diacritics)
  const normalizedCity = city.toLowerCase()
    .replace(/[áčďéěíňóřšťúůýž]/g, (char) => {
      const map: { [key: string]: string } = {
        'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e',
        'í': 'i', 'ň': 'n', 'ó': 'o', 'ř': 'r', 'š': 's',
        'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z'
      }
      return map[char] || char
    })
  
  match = places.find(place => {
    const normalizedPlace = place.name.toLowerCase()
      .replace(/[áčďéěíňóřšťúůýž]/g, (char) => {
        const map: { [key: string]: string } = {
          'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e',
          'í': 'i', 'ň': 'n', 'ó': 'o', 'ř': 'r', 'š': 's',
          'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z'
        }
        return map[char] || char
      })
    return normalizedPlace.includes(normalizedCity) || normalizedCity.includes(normalizedPlace)
  })
  
  return match || null
}

function generateHomeVisitRadius(experience: number, city: string): number {
  // Larger cities get smaller radius (more competition)
  const isLargeCity = ['Praha', 'Brno', 'Ostrava', 'Plzeň', 'České Budějovice'].some(
    largeCity => city.toLowerCase().includes(largeCity.toLowerCase())
  )
  
  // More experienced therapists might travel further
  const baseRadius = isLargeCity ? 15 : 25
  const experienceBonus = Math.min(experience / 2, 10) // Max 10km bonus
  
  return Math.round(baseRadius + experienceBonus)
}

async function addCoordinatesToTherapists() {
  try {
    console.log('Loading Czech places data...')
    const places = await loadCzechPlaces()
    console.log(`Loaded ${places.length} Czech places`)
    
    console.log('Loading therapists data...')
    const therapistsPath = path.join(process.cwd(), 'data', 'therapists.json')
    const therapistsContent = await fs.readFile(therapistsPath, 'utf-8')
    const therapists: Therapist[] = JSON.parse(therapistsContent)
    console.log(`Loaded ${therapists.length} therapists`)
    
    let updatedCount = 0
    let notFoundCount = 0
    const notFoundCities = new Set<string>()
    
    for (const therapist of therapists) {
      const place = findPlaceByCity(therapist.city, places)
      
      if (place) {
        therapist.clinicLat = place.lat
        therapist.clinicLon = place.lon
        therapist.homeVisitRadiusKm = generateHomeVisitRadius(
          therapist.yearsExperience, 
          therapist.city
        )
        updatedCount++
      } else {
        notFoundCount++
        notFoundCities.add(therapist.city)
        console.warn(`No coordinates found for city: ${therapist.city} (therapist: ${therapist.fullName})`)
      }
    }
    
    console.log(`\nResults:`)
    console.log(`- Updated ${updatedCount} therapists with coordinates`)
    console.log(`- ${notFoundCount} therapists without coordinates`)
    console.log(`- Cities not found: ${Array.from(notFoundCities).join(', ')}`)
    
    // Save updated therapists data
    console.log('\nSaving updated therapists data...')
    await fs.writeFile(therapistsPath, JSON.stringify(therapists, null, 2))
    console.log('✅ Therapists data updated successfully!')
    
  } catch (error) {
    console.error('Error adding coordinates to therapists:', error)
    process.exit(1)
  }
}

// Run the script
addCoordinatesToTherapists()

