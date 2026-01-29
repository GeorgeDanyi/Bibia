/**
 * Deterministic Test Data Generator for Prague & Ostrava
 * 
 * PART A Goals:
 * - Guarantee realistic test hits within 10–30 km of Prague and Ostrava to validate geo & scoring
 * - Enable fixture mode via ENV without touching production data
 * 
 * This generator creates deterministic, realistic therapist data with guaranteed geographic coverage
 */

// NOTE: Avoid importing runtime Therapist types to keep fixtures flexible for build/tests

// City centers with precise coordinates
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 }
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }

// Realistic Czech therapist names for deterministic generation
const PRAGUE_NAMES = [
  'MUDr. Anna Nováková',
  'Bc. Tomáš Svoboda', 
  'MUDr. Marie Kratochvílová',
  'Bc. Petr Novotný',
  'MUDr. Eva Dvořáková',
  'Bc. Jakub Procházka',
  'MUDr. Lucie Svobodová',
  'Bc. Martin Černý',
  'MUDr. Petra Nováková',
  'Bc. Ondřej Veselý',
  'MUDr. Kateřina Svobodová',
  'Bc. David Novotný',
  'MUDr. Anna Kratochvílová',
  'Bc. Michal Dvořák',
  'MUDr. Barbora Procházková',
  'Bc. Jan Svoboda',
  'MUDr. Zuzana Nováková',
  'Bc. Pavel Kratochvíl'
]

const OSTRAVA_NAMES = [
  'MUDr. Pavel Novák',
  'Bc. Zuzana Svobodová',
  'MUDr. Jiří Kratochvíl',
  'Bc. Lenka Novotná',
  'MUDr. Roman Dvořák',
  'Bc. Monika Procházková',
  'MUDr. Stanislav Svoboda',
  'Bc. Hana Černá',
  'MUDr. Václav Novák',
  'Bc. Iveta Veselá',
  'MUDr. František Svoboda',
  'Bc. Alena Novotná',
  'MUDr. Josef Kratochvíl',
  'Bc. Věra Dvořáková',
  'MUDr. Karel Procházka',
  'Bc. Ludmila Nováková',
  'MUDr. Jaroslav Svoboda',
  'Bc. Marie Kratochvílová'
]

// Common specializations for realistic data
const SPECIALIZATIONS = [
  'Bolesti zad / krku',
  'Sportovní úraz', 
  'Rehabilitace po operaci',
  'Těhotenství a porod',
  'Dětská fyzioterapie',
  'Chronické bolesti',
  'Skolióza',
  'Po operaci menisku',
  'Průmyslové úrazy',
  'Rehabilitace páteře'
]

const DIAGNOSIS_TAGS = [
  'bolesti zad',
  'sportovní úraz',
  'rehabilitace',
  'těhotenství',
  'skolióza',
  'chronické bolesti',
  'po operaci',
  'krční páteř',
  'průmyslový úraz',
  'Bechtěrev'
]

const MODALITIES = [
  'DNS',
  'McKenzie', 
  'Manuální terapie',
  'Kinesiotaping',
  'Pilates',
  'Viscerální terapie',
  'Craniosakrální terapie'
]

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
  const seededRandom = (seed: number) => {
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
 * Generate deterministic therapist data for Prague area
 * Guarantees coverage within 5-30km range with some within 10km
 */
function generatePragueTherapist(id: number, name: string) {
  // Create deterministic coordinates based on ID
  // Ensure some therapists are within 10km by using different ranges
  const minKm = id <= 6 ? 5 : 10  // First 6 therapists within 5-10km, rest 10-30km
  const maxKm = id <= 6 ? 10 : 30
  const coords = generateDeterministicCoordinates(PRAGUE_CENTER, minKm, maxKm, id * 1000)
  
  // Deterministic selection of specializations based on ID
  const specCount = (id % 3) + 1 // 1-3 specializations
  const selectedSpecs = SPECIALIZATIONS.slice(id % SPECIALIZATIONS.length, id % SPECIALIZATIONS.length + specCount)
  const selectedDiagnoses = DIAGNOSIS_TAGS.slice(id % DIAGNOSIS_TAGS.length, id % DIAGNOSIS_TAGS.length + specCount)
  const selectedModalities = MODALITIES.slice(id % MODALITIES.length, id % MODALITIES.length + 2)
  
  return {
    id: `prague_det_${id}`,
    name: name,
    city: 'Praha',
    regions: ['Praha', 'Středočeský'],
    languages: ['cs', id % 3 === 0 ? 'en' : 'cs'], // 33% English
    yearsExperience: 3 + (id % 15), // 3-18 years
    pricePerSession: 800 + (id % 500), // 800-1300 CZK
    latitude: coords.lat,
    longitude: coords.lng,
    practiceType: id % 3 === 0 ? ['office'] : ['online'],
    acceptingNew: id % 5 !== 0, // 80% accepting new patients
    nextAvailableDays: id % 14, // 0-13 days
    workingHours: {
      morning: true,
      midday: true,
      evening: id % 2 === 0,
      weekend: id % 3 === 0
    },
    availability: [],
    specialties: selectedSpecs,
    diagnoses: selectedDiagnoses,
    modalities: selectedModalities,
    worksWith: ['sportovci', 'těhotné', 'děti', 'senioři'].slice(0, (id % 3) + 1),
    rating: { 
      average: 4.0 + (id % 10) / 10, // 4.0-4.9
      count: 20 + (id % 200) // 20-220 reviews
    },
    reviewsCount: 20 + (id % 200),
    bio: `Specializuji se na ${selectedSpecs.join(', ')}. Mám bohaté zkušenosti s prací s různými skupinami pacientů.`,
    clinicName: `Fyzioterapie ${name.split(' ')[1]}`,
    address: `Praha ${(id % 10) + 1}, ${(id % 100) + 1}`,
    phone: `+420 ${(id % 900) + 100} ${(id % 900) + 100} ${(id % 900) + 100}`,
    email: `${name.toLowerCase().replace(' ', '.').replace('MUDr.', '').replace('Bc.', '')}@example.cz`,
    insuranceAccepted: ['VZP', 'ZPMV', 'OZP'].slice(0, (id % 3) + 1),
    isVerified: id % 3 !== 0, // 67% verified
    tags: selectedDiagnoses,
    diagnosisTags: selectedDiagnoses,
    priceRange: { 
      minCZK: 800 + (id % 300), 
      maxCZK: 1100 + (id % 200) 
    }
  }
}

/**
 * Generate deterministic therapist data for Ostrava area
 * Guarantees coverage within 5-30km range with some within 10km
 */
function generateOstravaTherapist(id: number, name: string) {
  // Create deterministic coordinates based on ID
  // Ensure some therapists are within 10km by using different ranges
  const minKm = id <= 6 ? 5 : 10  // First 6 therapists within 5-10km, rest 10-30km
  const maxKm = id <= 6 ? 10 : 30
  const coords = generateDeterministicCoordinates(OSTRAVA_CENTER, minKm, maxKm, id * 2000)
  
  // Deterministic selection of specializations based on ID
  const specCount = (id % 3) + 1 // 1-3 specializations
  const selectedSpecs = SPECIALIZATIONS.slice(id % SPECIALIZATIONS.length, id % SPECIALIZATIONS.length + specCount)
  const selectedDiagnoses = DIAGNOSIS_TAGS.slice(id % DIAGNOSIS_TAGS.length, id % DIAGNOSIS_TAGS.length + specCount)
  const selectedModalities = MODALITIES.slice(id % MODALITIES.length, id % MODALITIES.length + 2)
  
  return {
    id: `ostrava_det_${id}`,
    name: name,
    city: 'Ostrava',
    regions: ['Moravskoslezský'],
    languages: ['cs', id % 5 === 0 ? 'sk' : 'cs'], // 20% Slovak
    yearsExperience: 3 + (id % 15), // 3-18 years
    pricePerSession: 700 + (id % 400), // 700-1100 CZK (slightly lower than Prague)
    latitude: coords.lat,
    longitude: coords.lng,
    practiceType: id % 3 === 0 ? ['office'] : ['online'],
    acceptingNew: id % 6 !== 0, // 83% accepting new patients
    nextAvailableDays: id % 10, // 0-9 days (better availability)
    workingHours: {
      morning: true,
      midday: true,
      evening: id % 2 === 0,
      weekend: id % 3 === 0
    },
    availability: [],
    specialties: selectedSpecs,
    diagnoses: selectedDiagnoses,
    modalities: selectedModalities,
    worksWith: ['sportovci', 'děti', 'senioři', 'pracovníci'].slice(0, (id % 3) + 1),
    rating: { 
      average: 4.0 + (id % 10) / 10, // 4.0-4.9
      count: 15 + (id % 150) // 15-165 reviews
    },
    reviewsCount: 15 + (id % 150),
    bio: `Specializuji se na ${selectedSpecs.join(', ')}. Mám zkušenosti s prací v průmyslovém prostředí.`,
    clinicName: `Fyzioterapie ${name.split(' ')[1]}`,
    address: `Ostrava ${(id % 8) + 1}, ${(id % 100) + 1}`,
    phone: `+420 ${(id % 900) + 100} ${(id % 900) + 100} ${(id % 900) + 100}`,
    email: `${name.toLowerCase().replace(' ', '.').replace('MUDR.', '').replace('Bc.', '')}@example.cz`,
    insuranceAccepted: ['VZP', 'ZPMV', 'OZP'].slice(0, (id % 3) + 1),
    isVerified: id % 4 !== 0, // 75% verified
    tags: selectedDiagnoses,
    diagnosisTags: selectedDiagnoses,
    priceRange: { 
      minCZK: 700 + (id % 300), 
      maxCZK: 1000 + (id % 200) 
    }
  }
}

/**
 * Generate deterministic fixture therapists for testing
 * Guarantees realistic hits within 10-30km of Prague and Ostrava
 */
export function generateDeterministicFixtures() {
  const therapists: any[] = []
  
  // Generate Prague therapists (18 therapists for good coverage)
  PRAGUE_NAMES.forEach((name, index) => {
    therapists.push(generatePragueTherapist(index + 1, name))
  })
  
  // Generate Ostrava therapists (18 therapists for good coverage)
  OSTRAVA_NAMES.forEach((name, index) => {
    therapists.push(generateOstravaTherapist(index + 1, name))
  })
  
  return therapists
}

/**
 * Get deterministic fixture therapists with guaranteed coverage
 */
export function getDeterministicFixtures() {
  return generateDeterministicFixtures()
}

/**
 * Validate geographic coverage of deterministic fixtures
 */
export function validateGeographicCoverage(): {
  prague: { total: number; within10km: number; within20km: number; within30km: number }
  ostrava: { total: number; within10km: number; within20km: number; within30km: number }
} {
  const therapists = getDeterministicFixtures()
  
  // Calculate distances for Prague
  const pragueTherapists = therapists.filter(t => t.city === 'Praha')
  const pragueDistances = pragueTherapists.map(t => {
    const lat1 = PRAGUE_CENTER.lat * Math.PI / 180
    const lat2 = t.latitude * Math.PI / 180
    const deltaLat = (t.latitude - PRAGUE_CENTER.lat) * Math.PI / 180
    const deltaLng = (t.longitude - PRAGUE_CENTER.lng) * Math.PI / 180
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    
    return 6371 * c // Earth's radius in km
  })
  
  // Calculate distances for Ostrava
  const ostravaTherapists = therapists.filter(t => t.city === 'Ostrava')
  const ostravaDistances = ostravaTherapists.map(t => {
    const lat1 = OSTRAVA_CENTER.lat * Math.PI / 180
    const lat2 = t.latitude * Math.PI / 180
    const deltaLat = (t.latitude - OSTRAVA_CENTER.lat) * Math.PI / 180
    const deltaLng = (t.longitude - OSTRAVA_CENTER.lng) * Math.PI / 180
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    
    return 6371 * c // Earth's radius in km
  })
  
  return {
    prague: {
      total: pragueTherapists.length,
      within10km: pragueDistances.filter(d => d <= 10).length,
      within20km: pragueDistances.filter(d => d <= 20).length,
      within30km: pragueDistances.filter(d => d <= 30).length
    },
    ostrava: {
      total: ostravaTherapists.length,
      within10km: ostravaDistances.filter(d => d <= 10).length,
      within20km: ostravaDistances.filter(d => d <= 20).length,
      within30km: ostravaDistances.filter(d => d <= 30).length
    }
  }
}
