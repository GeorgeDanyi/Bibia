/**
 * Part B Fixture Data - Specific therapist clusters for Prague and Ostrava
 * 
 * Requirements:
 * - Prague cluster: 12 therapists within 5-25km (mixed tags: back pain, Bechtěrev (2), sports (3); 2 online-only)
 * - Ostrava cluster: 8 therapists within 5-20km (1 Bechtěrev, 2 online-only)
 * - Ensure at least 3 within 10-15km for each city
 * - Fields: {id,name,latitude,longitude,city,practiceType,diagnosisTags[],languages[],acceptingNew,nextAvailableDays(0-14),priceRange}
 */

import { Therapist } from '../types/therapist'

// City centers
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 }
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }

/**
 * Generate coordinates within specific distance range from center
 */
function generateCoordinatesInRange(center: { lat: number; lng: number }, minKm: number, maxKm: number): { lat: number; lng: number } {
  const latDegreesPerKm = 1 / 111.32
  const lngDegreesPerKm = 1 / (111.32 * Math.cos(center.lat * Math.PI / 180))
  
  const angle = Math.random() * 2 * Math.PI
  const distance = minKm + Math.random() * (maxKm - minKm)
  
  const latOffset = distance * latDegreesPerKm * Math.cos(angle)
  const lngOffset = distance * lngDegreesPerKm * Math.sin(angle)
  
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset
  }
}

/**
 * Generate Prague cluster therapists (12 total)
 * Requirements: mixed tags (back pain, Bechtěrev (2), sports (3); 2 online-only)
 * At least 3 within 10-15km
 */
function generatePragueCluster(): Therapist[] {
  const therapists: Therapist[] = []
  
  // 3 therapists within 10-15km (guaranteed close range)
  const closeRangeTherapists = [
    {
      id: 'prague_close_1',
      name: 'MUDr. Anna Bechtěrevová',
      diagnosisTags: ['Bechtěrev', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_close_2', 
      name: 'Bc. Tomáš Sportovní',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_close_3',
      name: 'MUDr. Marie Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    }
  ]
  
  // 9 therapists within 5-25km (mixed distribution)
  // Ensure we have exactly 2 Bechtěrev, 3 sports, and 2 online-only total
  const mixedRangeTherapists = [
    {
      id: 'prague_mixed_1',
      name: 'MUDr. Pavel Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_mixed_2',
      name: 'Bc. Jana Sportovní',
      diagnosisTags: ['sportovní úraz', 'rehabilitace'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_mixed_3',
      name: 'MUDr. Petr Sportovní',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_mixed_4',
      name: 'Bc. Eva Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'prague_mixed_5',
      name: 'MUDr. Jakub Bolest',
      diagnosisTags: ['bolesti zad', 'krční páteř'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_mixed_6',
      name: 'Bc. Lucie Rehab',
      diagnosisTags: ['rehabilitace', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_mixed_7',
      name: 'MUDr. Martin Rehab',
      diagnosisTags: ['rehabilitace', 'výkonnost'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_mixed_8',
      name: 'Bc. Petra Bolest',
      diagnosisTags: ['bolesti zad', 'skolióza'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_mixed_9',
      name: 'MUDr. Ondřej Rehab',
      diagnosisTags: ['rehabilitace', 'po operaci'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // Generate close range therapists (10-15km)
  closeRangeTherapists.forEach((therapist, index) => {
    const coords = generateCoordinatesInRange(PRAGUE_CENTER, 10, 15)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Praha'
    }))
  })
  
  // Generate mixed range therapists (5-25km)
  mixedRangeTherapists.forEach((therapist, index) => {
    const coords = generateCoordinatesInRange(PRAGUE_CENTER, 5, 25)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Praha'
    }))
  })
  
  return therapists
}

/**
 * Generate Ostrava cluster therapists (8 total)
 * Requirements: 1 Bechtěrev, 2 online-only
 * At least 3 within 10-15km
 */
function generateOstravaCluster(): Therapist[] {
  const therapists: Therapist[] = []
  
  // 3 therapists within 10-15km (guaranteed close range)
  const closeRangeTherapists = [
    {
      id: 'ostrava_close_1',
      name: 'MUDr. Pavel Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_close_2',
      name: 'Bc. Jana Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'ostrava_close_3',
      name: 'MUDr. Marie Rehab',
      diagnosisTags: ['rehabilitace', 'bolesti zad'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // 5 therapists within 5-20km (mixed distribution)
  // Ensure we have exactly 1 Bechtěrev and 2 online-only total
  const mixedRangeTherapists = [
    {
      id: 'ostrava_mixed_1',
      name: 'Bc. Tomáš Online',
      diagnosisTags: ['bolesti zad', 'krční páteř'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'ostrava_mixed_2',
      name: 'MUDr. Eva Bolest',
      diagnosisTags: ['bolesti zad', 'skolióza'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_mixed_3',
      name: 'Bc. Jakub Rehab',
      diagnosisTags: ['rehabilitace', 'po operaci'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_mixed_4',
      name: 'MUDr. Lucie Sport',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_mixed_5',
      name: 'Bc. Martin Bolest',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // Generate close range therapists (10-15km)
  closeRangeTherapists.forEach((therapist, index) => {
    const coords = generateCoordinatesInRange(OSTRAVA_CENTER, 10, 15)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Ostrava'
    }))
  })
  
  // Generate mixed range therapists (5-20km)
  mixedRangeTherapists.forEach((therapist, index) => {
    const coords = generateCoordinatesInRange(OSTRAVA_CENTER, 5, 20)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Ostrava'
    }))
  })
  
  return therapists
}

/**
 * Create a therapist with all required fields
 * Fields: {id,name,latitude,longitude,city,practiceType,diagnosisTags[],languages[],acceptingNew,nextAvailableDays(0-14),priceRange}
 */
function createTherapist(data: {
  id: string
  name: string
  latitude: number
  longitude: number
  city: string
  diagnosisTags: string[]
  practiceType: 'clinic' | 'private' | 'online'
  isOnlineOnly: boolean
}): any {
  const priceRange = data.city === 'Praha' 
    ? { minCZK: 800 + Math.floor(Math.random() * 400), maxCZK: 1200 + Math.floor(Math.random() * 300) }
    : { minCZK: 700 + Math.floor(Math.random() * 300), maxCZK: 1000 + Math.floor(Math.random() * 200) }
  
  return {
    id: data.id,
    fullName: data.name,
    city: data.city,
    regions: data.city === 'Praha' ? ['Praha', 'Středočeský'] : ['Moravskoslezský'],
    languages: ['cs', Math.random() > 0.7 ? 'en' : 'cs'],
    yearsExperience: Math.floor(Math.random() * 15) + 3,
    pricePerSession: priceRange.minCZK,
    latitude: data.latitude,
    longitude: data.longitude,
    practiceType: [data.practiceType] as any,
    acceptingNew: Math.random() > 0.2,
    nextAvailableDays: Math.floor(Math.random() * 15), // 0-14 days
    workingHours: {
      morning: true,
      midday: true,
      evening: Math.random() > 0.5,
      weekend: Math.random() > 0.7
    },
    availability: [],
    specialties: data.diagnosisTags,
    diagnoses: data.diagnosisTags,
    modalities: ['DNS', 'McKenzie', 'Manuální terapie'].slice(0, Math.floor(Math.random() * 3) + 1),
    worksWith: ['sportovci', 'děti', 'senioři'].slice(0, Math.floor(Math.random() * 3) + 1),
    rating: {
      average: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
      count: Math.floor(Math.random() * 200) + 20
    },
    reviewsCount: Math.floor(Math.random() * 200) + 20,
    bio: `Specializuji se na ${data.diagnosisTags.join(', ')}. Mám bohaté zkušenosti s prací s různými skupinami pacientů.`,
    clinicName: `Fyzioterapie ${data.name.split(' ')[1]}`,
    address: `${data.city} ${Math.floor(Math.random() * 10) + 1}, ${Math.floor(Math.random() * 100) + 1}`,
    phone: `+420 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`,
    email: `${data.name.toLowerCase().replace(' ', '.').replace('MUDr.', '').replace('Bc.', '')}@example.cz`,
    insuranceAccepted: ['VZP', 'ZPMV', 'OZP'].slice(0, Math.floor(Math.random() * 3) + 1),
    isVerified: Math.random() > 0.3,
    tags: data.diagnosisTags,
    diagnosisTags: data.diagnosisTags,
 // Mark as fixture data for safe cleanup
    priceRange: priceRange
  }
}

/**
 * Get Part B fixture therapists
 */
export function getPartBFixtureTherapists(): Therapist[] {
  const pragueTherapists = generatePragueCluster()
  const ostravaTherapists = generateOstravaCluster()
  
  return [...pragueTherapists, ...ostravaTherapists]
}

/**
 * Get fixture therapists by city
 */
export function getFixtureTherapistsByCity(city: string): Therapist[] {
  return getPartBFixtureTherapists().filter(t => t.city === city)
}


