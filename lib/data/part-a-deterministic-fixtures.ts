/**
 * Part A Deterministic Fixture Data - Guaranteed test data within 30-50km of target cities
 * 
 * Goals:
 * - Guarantee data exists for testing within 30–50 km of Prague, Ostrava, and Brno
 * - Use deterministic coordinates for consistent testing
 * - Ensure sufficient coverage for geo & scoring validation
 */

import { Therapist } from '../types/therapist'

// City centers with precise coordinates
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 }
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }
const BRNO_CENTER = { lat: 49.1951, lng: 16.6068 }

/**
 * Generate deterministic coordinates within specific distance range from center
 * Uses seeded random generation for consistent results
 */
function generateDeterministicCoordinates(
  center: { lat: number; lng: number }, 
  minKm: number, 
  maxKm: number, 
  seed: number
): { lat: number; lng: number } {
  // Simple seeded random number generator
  function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  const latDegreesPerKm = 1 / 111.32
  const lngDegreesPerKm = 1 / (111.32 * Math.cos(center.lat * Math.PI / 180))
  
  const angle = seededRandom(seed) * 2 * Math.PI
  const distance = minKm + seededRandom(seed + 1) * (maxKm - minKm)
  
  const latOffset = distance * latDegreesPerKm * Math.cos(angle)
  const lngOffset = distance * lngDegreesPerKm * Math.sin(angle)
  
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset
  }
}

/**
 * Generate Prague cluster therapists (15 total)
 * Distributed within 30-50km range
 */
function generatePragueCluster(): Therapist[] {
  const therapists: Therapist[] = []
  
  // 5 therapists within 30-35km (close range)
  const closeRangeTherapists = [
    {
      id: 'prague_det_1',
      name: 'MUDr. Anna Bechtěrevová',
      diagnosisTags: ['Bechtěrev', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_2', 
      name: 'Bc. Tomáš Sportovní',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_3',
      name: 'MUDr. Marie Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'prague_det_4',
      name: 'Bc. Jana Rehab',
      diagnosisTags: ['rehabilitace', 'po operaci'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_5',
      name: 'MUDr. Pavel Bolest',
      diagnosisTags: ['bolesti zad', 'krční páteř'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // 5 therapists within 35-40km (mid range)
  const midRangeTherapists = [
    {
      id: 'prague_det_6',
      name: 'MUDr. Eva Sport',
      diagnosisTags: ['sportovní úraz', 'výkonnost'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_7',
      name: 'Bc. Jakub Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'prague_det_8',
      name: 'MUDr. Lucie Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_9',
      name: 'Bc. Martin Rehab',
      diagnosisTags: ['rehabilitace', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_10',
      name: 'MUDr. Petra Bolest',
      diagnosisTags: ['bolesti zad', 'skolióza'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // 5 therapists within 40-50km (far range)
  const farRangeTherapists = [
    {
      id: 'prague_det_11',
      name: 'Bc. Ondřej Sport',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_12',
      name: 'MUDr. Kateřina Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'prague_det_13',
      name: 'Bc. Filip Rehab',
      diagnosisTags: ['rehabilitace', 'po operaci'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_14',
      name: 'MUDr. Veronika Bolest',
      diagnosisTags: ['bolesti zad', 'krční páteř'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'prague_det_15',
      name: 'Bc. Michal Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // Generate close range therapists (30-35km)
  closeRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(PRAGUE_CENTER, 30, 35, therapist.id.charCodeAt(0) + index)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Praha'
    }))
  })
  
  // Generate mid range therapists (35-40km)
  midRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(PRAGUE_CENTER, 35, 40, therapist.id.charCodeAt(0) + index + 100)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Praha'
    }))
  })
  
  // Generate far range therapists (40-50km)
  farRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(PRAGUE_CENTER, 40, 50, therapist.id.charCodeAt(0) + index + 200)
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
 * Generate Ostrava cluster therapists (12 total)
 * Distributed within 30-50km range
 */
function generateOstravaCluster(): Therapist[] {
  const therapists: Therapist[] = []
  
  // 4 therapists within 30-35km (close range)
  const closeRangeTherapists = [
    {
      id: 'ostrava_det_1',
      name: 'MUDr. Pavel Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_det_2',
      name: 'Bc. Jana Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'ostrava_det_3',
      name: 'MUDr. Marie Rehab',
      diagnosisTags: ['rehabilitace', 'bolesti zad'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_det_4',
      name: 'Bc. Tomáš Sport',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    }
  ]
  
  // 4 therapists within 35-40km (mid range)
  const midRangeTherapists = [
    {
      id: 'ostrava_det_5',
      name: 'MUDr. Eva Bolest',
      diagnosisTags: ['bolesti zad', 'skolióza'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_det_6',
      name: 'Bc. Jakub Online',
      diagnosisTags: ['bolesti zad', 'krční páteř'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'ostrava_det_7',
      name: 'MUDr. Lucie Rehab',
      diagnosisTags: ['rehabilitace', 'po operaci'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_det_8',
      name: 'Bc. Martin Sport',
      diagnosisTags: ['sportovní úraz', 'výkonnost'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // 4 therapists within 40-50km (far range)
  const farRangeTherapists = [
    {
      id: 'ostrava_det_9',
      name: 'MUDr. Petra Bolest',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_det_10',
      name: 'Bc. Ondřej Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'ostrava_det_11',
      name: 'MUDr. Kateřina Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'ostrava_det_12',
      name: 'Bc. Filip Rehab',
      diagnosisTags: ['rehabilitace', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    }
  ]
  
  // Generate close range therapists (30-35km)
  closeRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(OSTRAVA_CENTER, 30, 35, therapist.id.charCodeAt(0) + index)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Ostrava'
    }))
  })
  
  // Generate mid range therapists (35-40km)
  midRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(OSTRAVA_CENTER, 35, 40, therapist.id.charCodeAt(0) + index + 100)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Ostrava'
    }))
  })
  
  // Generate far range therapists (40-50km)
  farRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(OSTRAVA_CENTER, 40, 50, therapist.id.charCodeAt(0) + index + 200)
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
 * Generate Brno cluster therapists (12 total)
 * Distributed within 30-50km range
 */
function generateBrnoCluster(): Therapist[] {
  const therapists: Therapist[] = []
  
  // 4 therapists within 30-35km (close range)
  const closeRangeTherapists = [
    {
      id: 'brno_det_1',
      name: 'MUDr. Anna Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'brno_det_2',
      name: 'Bc. Tomáš Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'brno_det_3',
      name: 'MUDr. Marie Sport',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'brno_det_4',
      name: 'Bc. Jana Rehab',
      diagnosisTags: ['rehabilitace', 'po operaci'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    }
  ]
  
  // 4 therapists within 35-40km (mid range)
  const midRangeTherapists = [
    {
      id: 'brno_det_5',
      name: 'MUDr. Pavel Bolest',
      diagnosisTags: ['bolesti zad', 'krční páteř'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'brno_det_6',
      name: 'Bc. Eva Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'brno_det_7',
      name: 'MUDr. Jakub Sport',
      diagnosisTags: ['sportovní úraz', 'výkonnost'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'brno_det_8',
      name: 'Bc. Lucie Rehab',
      diagnosisTags: ['rehabilitace', 'bolesti zad'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    }
  ]
  
  // 4 therapists within 40-50km (far range)
  const farRangeTherapists = [
    {
      id: 'brno_det_9',
      name: 'MUDr. Martin Bolest',
      diagnosisTags: ['bolesti zad', 'skolióza'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    },
    {
      id: 'brno_det_10',
      name: 'Bc. Petra Bechtěrev',
      diagnosisTags: ['Bechtěrev', 'chronické bolesti'],
      practiceType: 'private' as const,
      isOnlineOnly: false
    },
    {
      id: 'brno_det_11',
      name: 'MUDr. Ondřej Online',
      diagnosisTags: ['bolesti zad', 'rehabilitace'],
      practiceType: 'online' as const,
      isOnlineOnly: true
    },
    {
      id: 'brno_det_12',
      name: 'Bc. Kateřina Sport',
      diagnosisTags: ['sportovní úraz', 'bolesti zad'],
      practiceType: 'clinic' as const,
      isOnlineOnly: false
    }
  ]
  
  // Generate close range therapists (30-35km)
  closeRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(BRNO_CENTER, 30, 35, therapist.id.charCodeAt(0) + index)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Brno'
    }))
  })
  
  // Generate mid range therapists (35-40km)
  midRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(BRNO_CENTER, 35, 40, therapist.id.charCodeAt(0) + index + 100)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Brno'
    }))
  })
  
  // Generate far range therapists (40-50km)
  farRangeTherapists.forEach((therapist, index) => {
    const coords = generateDeterministicCoordinates(BRNO_CENTER, 40, 50, therapist.id.charCodeAt(0) + index + 200)
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Brno'
    }))
  })
  
  return therapists
}

/**
 * Create a therapist with all required fields
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
  // Deterministic price ranges based on city
  const priceRange = data.city === 'Praha' 
    ? { minCZK: 1000, maxCZK: 1500 }
    : data.city === 'Brno'
    ? { minCZK: 900, maxCZK: 1300 }
    : { minCZK: 800, maxCZK: 1200 } // Ostrava
  
  // Deterministic values based on ID hash
  const idHash = data.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  const yearsExperience = 5 + (idHash % 15)
  const acceptingNew = (idHash % 3) !== 0
  const nextAvailableDays = idHash % 15
  const rating = 4.0 + (idHash % 10) / 10
  const reviewsCount = 50 + (idHash % 150)
  const isVerified = (idHash % 4) !== 0
  
  return {
    id: data.id,
    fullName: data.name,
    city: data.city,
    postalCode: (data as any).postalCode,
    latitude: data.latitude,
    longitude: data.longitude,
    regions: (data as any).regions || [],
    languages: ['cs', (idHash % 3) === 0 ? 'en' : 'cs'],
    practiceType: data.practiceType as any,
    acceptingNew,
    yearsExperience,
    pricePerSession: priceRange.minCZK,
    priceRange,
    nextAvailableDays,
    workingHours: {
      morning: true,
      midday: true,
      evening: (idHash % 2) === 0,
      weekend: (idHash % 3) === 0
    },
    availability: [],
    specialties: data.diagnosisTags,
    diagnoses: data.diagnosisTags,
    modalities: ['DNS', 'McKenzie', 'Manuální terapie'].slice(0, 1 + (idHash % 3)),
    worksWith: ['sportovci', 'děti', 'senioři'].slice(0, 1 + (idHash % 3)),
    rating: {
      average: Math.round(rating * 10) / 10,
      count: reviewsCount
    },
    reviewsCount,
    bio: `Specializuji se na ${data.diagnosisTags.join(', ')}. Mám bohaté zkušenosti s prací s různými skupinami pacientů.`,
    clinicName: `Fyzioterapie ${data.name.split(' ')[1]}`,
    address: `${data.city} ${1 + (idHash % 10)}, ${1 + (idHash % 100)}`,
    phone: `+420 ${200 + (idHash % 800)} ${100 + (idHash % 900)} ${100 + (idHash % 900)}`,
    email: `${data.name.toLowerCase().replace(/\s+/g, '.').replace(/mudr\.|bc\./g, '')}@example.cz`,
    insuranceAccepted: ['VZP', 'ZPMV', 'OZP'].slice(0, 1 + (idHash % 3)),
    clinicLat: data.latitude,
    clinicLon: data.longitude,
    homeVisitRadiusKm: data.isOnlineOnly ? 0 : 5 + (idHash % 15),
    isVerified,
    tags: data.diagnosisTags,
    diagnosisTags: data.diagnosisTags,
    experienceTags: data.diagnosisTags,
    isFixture: true
  }
}

/**
 * Get Part A deterministic fixture therapists
 * Returns therapists distributed within 30-50km of Prague, Ostrava, and Brno
 */
export function getPartADeterministicFixtures(): Therapist[] {
  const pragueTherapists = generatePragueCluster()
  const ostravaTherapists = generateOstravaCluster()
  const brnoTherapists = generateBrnoCluster()
  
  return [...pragueTherapists, ...ostravaTherapists, ...brnoTherapists]
}

/**
 * Get fixture therapists by city
 */
export function getPartAFixturesByCity(city: string): Therapist[] {
  return getPartADeterministicFixtures().filter(t => t.city === city)
}

/**
 * Validate that all therapists are within the required distance range
 */
export function validatePartAFixtures(): { isValid: boolean; errors: string[] } {
  const therapists = getPartADeterministicFixtures()
  const errors: string[] = []
  
  // Check Prague therapists
  const pragueTherapists = therapists.filter(t => t.city === 'Praha')
  pragueTherapists.forEach(t => {
    const tt = t as any
    const distance = calculateDistance(PRAGUE_CENTER, { lat: tt.latitude, lng: tt.longitude })
    if (distance < 30 || distance > 50) {
      errors.push(`Prague therapist ${t.id} is ${distance.toFixed(1)}km from center (should be 30-50km)`)
    }
  })
  
  // Check Ostrava therapists
  const ostravaTherapists = therapists.filter(t => t.city === 'Ostrava')
  ostravaTherapists.forEach(t => {
    const tt = t as any
    const distance = calculateDistance(OSTRAVA_CENTER, { lat: tt.latitude, lng: tt.longitude })
    if (distance < 30 || distance > 50) {
      errors.push(`Ostrava therapist ${t.id} is ${distance.toFixed(1)}km from center (should be 30-50km)`)
    }
  })
  
  // Check Brno therapists
  const brnoTherapists = therapists.filter(t => t.city === 'Brno')
  brnoTherapists.forEach(t => {
    const tt = t as any
    const distance = calculateDistance(BRNO_CENTER, { lat: tt.latitude, lng: tt.longitude })
    if (distance < 30 || distance > 50) {
      errors.push(`Brno therapist ${t.id} is ${distance.toFixed(1)}km from center (should be 30-50km)`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLng = (point2.lng - point1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
