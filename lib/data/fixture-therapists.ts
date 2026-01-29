/**
 * Fixture therapist data for testing within 10-30km of Prague and Ostrava
 * This data is designed to guarantee realistic test hits for geographic validation
 */

import { Therapist } from '../types/therapist'

// Prague center coordinates
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 }

// Ostrava center coordinates  
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }

/**
 * Generate realistic coordinates within specified radius of a center point
 */
function generateCoordinatesInRadius(center: { lat: number; lng: number }, radiusKm: number): { lat: number; lng: number } {
  // Convert radius to degrees (approximate)
  const latDegreesPerKm = 1 / 111.32
  const lngDegreesPerKm = 1 / (111.32 * Math.cos(center.lat * Math.PI / 180))
  
  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radiusKm
  
  // Calculate offset in degrees
  const latOffset = distance * latDegreesPerKm * Math.cos(angle)
  const lngOffset = distance * lngDegreesPerKm * Math.sin(angle)
  
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset
  }
}

/**
 * Generate realistic therapist data for Prague area
 */
function generatePragueTherapist(id: number, baseName: string): Therapist {
  const coords = generateCoordinatesInRadius(PRAGUE_CENTER, 25) // Within 25km of Prague
  const distanceFromCenter = Math.round(Math.random() * 25 + 5) // 5-30km from center
  
  const skills = ['fyzioterapie', 'rehabilitace', 'bolesti zad']
  const therapist: any = {
    id: `prague_${id}`,
    fullName: baseName,
    city: 'Praha',
    latitude: coords.lat,
    longitude: coords.lng,
    regions: ['Praha', 'Středočeský'],
    languages: ['cs'],
    practiceType: (Math.random() > 0.3 ? 'private' : 'clinic'),
    acceptingNew: true,
    yearsExperience: 5,
    pricePerSession: 1000,
    nextAvailableDays: distanceFromCenter % 15,
    workingHours: {
      morning: true,
      midday: true,
      evening: true,
      weekend: false,
    },
    availability: [],
    specialties: ['bolesti zad'],
    diagnoses: [],
    tags: [],
    diagnosisTags: [],
    modalities: [],
    worksWith: [],
    rating: { average: 4.5, count: 10 },
    reviewsCount: 10,
    bio: '',
  }
  return therapist as Therapist
}

/**
 * Generate realistic therapist data for Ostrava area
 */
function generateOstravaTherapist(id: number, baseName: string): Therapist {
  const coords = generateCoordinatesInRadius(OSTRAVA_CENTER, 25) // Within 25km of Ostrava
  const distanceFromCenter = Math.round(Math.random() * 25 + 5) // 5-30km from center
  
  const skills = ['fyzioterapie', 'rehabilitace', 'bolesti zad']
  const therapist: any = {
    id: `ostrava_${id}`,
    fullName: baseName,
    city: 'Ostrava',
    latitude: coords.lat,
    longitude: coords.lng,
    regions: ['Moravskoslezský'],
    languages: ['cs'],
    practiceType: (Math.random() > 0.4 ? 'private' : 'clinic'),
    acceptingNew: true,
    yearsExperience: 5,
    pricePerSession: 900,
    nextAvailableDays: distanceFromCenter % 15,
    workingHours: {
      morning: true,
      midday: true,
      evening: true,
      weekend: false,
    },
    availability: [],
    specialties: ['bolesti zad'],
    diagnoses: [],
    tags: [],
    diagnosisTags: [],
    modalities: [],
    worksWith: [],
    rating: { average: 4.4, count: 8 },
    reviewsCount: 8,
    bio: '',
  }
  return therapist as Therapist
}

/**
 * Generate fixture therapist data for testing
 * Guarantees realistic hits within 10-30km of Prague and Ostrava
 */
export function generateFixtureTherapists(): Therapist[] {
  const pragueNames = [
    'MUDr. Jana Nováková',
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
    'MUDr. Barbora Procházková'
  ]

  const ostravaNames = [
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
    'MUDr. Karel Procházka'
  ]

  const therapists: Therapist[] = []

  // Generate Prague therapists (15 therapists)
  pragueNames.forEach((name, index) => {
    therapists.push(generatePragueTherapist(index + 1, name))
  })

  // Generate Ostrava therapists (15 therapists)
  ostravaNames.forEach((name, index) => {
    therapists.push(generateOstravaTherapist(index + 1, name))
  })

  return therapists
}

/**
 * Get fixture therapists with guaranteed coverage
 */
export function getFixtureTherapists(): Therapist[] {
  return generateFixtureTherapists()
}


