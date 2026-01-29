#!/usr/bin/env node

/**
 * Part B Fixture Seeding Script
 * Seeds specific therapist data as specified in Part B requirements
 * 
 * Environment: NEXT_PUBLIC_BIBIA_FIXTURES=true
 * Data: Specific therapists with isFixture=true markers
 */

const fs = require('fs').promises
const path = require('path')

// Part B specific therapist data as specified in requirements
const PART_B_THERAPISTS = [
  // Ostrava center ~ (49.83, 18.29)
  {
    id: 'ostrava_mgr_a',
    fullName: 'Mgr. A',
    latitude: 49.845,
    longitude: 18.20,
    city: 'Ostrava',
    practiceType: 'clinic',
    diagnosisTags: ['backneck', 'bechterev'],
    languages: ['cs', 'ru'],
    acceptingNew: true,
    nextAvailableDays: 3
  },
  {
    id: 'ostrava_bc_b',
    fullName: 'Bc. B',
    latitude: 49.78,
    longitude: 18.33,
    city: 'Ostrava',
    practiceType: 'online',
    diagnosisTags: ['backneck'],
    languages: ['cs', 'en'],
    acceptingNew: true,
    nextAvailableDays: 1
  },
  {
    id: 'opava_mgr_c',
    fullName: 'Mgr. C',
    latitude: 49.92,
    longitude: 18.15,
    city: 'Opava',
    practiceType: 'clinic',
    diagnosisTags: ['sports'],
    languages: ['cs'],
    acceptingNew: false,
    nextAvailableDays: 12
  },

  // Prague center ~ (50.0755,14.4378)
  {
    id: 'prague_mgr_d',
    fullName: 'Mgr. D',
    latitude: 50.10,
    longitude: 14.30,
    city: 'Praha',
    practiceType: 'clinic',
    diagnosisTags: ['backneck'],
    languages: ['cs', 'en'],
    acceptingNew: true,
    nextAvailableDays: 5
  },
  {
    id: 'prague_bc_e',
    fullName: 'Bc. E',
    latitude: 50.02,
    longitude: 14.52,
    city: 'Praha',
    practiceType: 'online',
    diagnosisTags: ['bechterev'],
    languages: ['cs'],
    acceptingNew: true,
    nextAvailableDays: 2
  },

  // Brno center ~ (49.1951,16.6068)
  {
    id: 'brno_mgr_f',
    fullName: 'Mgr. F',
    latitude: 49.26,
    longitude: 16.55,
    city: 'Brno',
    practiceType: 'clinic',
    diagnosisTags: ['backneck'],
    languages: ['cs'],
    acceptingNew: true,
    nextAvailableDays: 7
  }
]

/**
 * Create a complete therapist object with all required fields
 */
function createCompleteTherapist(data) {
  // Generate deterministic values based on ID
  const idHash = data.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  
  // Price ranges based on city
  const priceRange = data.city === 'Praha' 
    ? { minCZK: 1000, maxCZK: 1500 }
    : data.city === 'Brno'
    ? { minCZK: 900, maxCZK: 1300 }
    : { minCZK: 800, maxCZK: 1200 } // Ostrava/Opava
  
  return {
    id: data.id,
    fullName: data.fullName,
    city: data.city,
    regions: data.city === 'Praha' ? ['Praha', 'Středočeský'] : 
             data.city === 'Brno' ? ['Jihomoravský'] : 
             data.city === 'Opava' ? ['Moravskoslezský'] : ['Moravskoslezský'],
    languages: data.languages,
    yearsExperience: 5 + (idHash % 15),
    pricePerSession: priceRange.minCZK,
    latitude: data.latitude,
    longitude: data.longitude,
    clinicLat: data.latitude,
    clinicLon: data.longitude,
    homeVisitRadiusKm: data.practiceType === 'online' ? 0 : 5 + (idHash % 15),
    practiceType: data.practiceType,
    acceptingNew: data.acceptingNew,
    nextAvailableDays: data.nextAvailableDays,
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
      average: Math.round((4.0 + (idHash % 10) / 10) * 10) / 10,
      count: 50 + (idHash % 150)
    },
    reviewsCount: 50 + (idHash % 150),
    bio: `Specializuji se na ${data.diagnosisTags.join(', ')}. Mám bohaté zkušenosti s prací s různými skupinami pacientů.`,
    clinicName: `Fyzioterapie ${data.fullName.split(' ')[1]}`,
    address: `${data.city} ${1 + (idHash % 10)}, ${1 + (idHash % 100)}`,
    phone: `+420 ${200 + (idHash % 800)} ${100 + (idHash % 900)} ${100 + (idHash % 900)}`,
    email: `${data.fullName.toLowerCase().replace(/\s+/g, '.').replace(/mgr\.|bc\./g, '')}@example.cz`,
    insuranceAccepted: ['VZP', 'ZPMV', 'OZP'].slice(0, 1 + (idHash % 3)),
    isVerified: (idHash % 4) !== 0,
    tags: data.diagnosisTags,
    diagnosisTags: data.diagnosisTags,
    experienceTags: data.diagnosisTags,
    isFixture: true, // Mark as fixture data for cleanup
    priceRange: priceRange
  }
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(point1, point2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLng = (point2.lng - point1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Validate Part B therapist data
 */
function validatePartBData(therapists) {
  const errors = []
  
  // City centers for distance validation
  const cityCenters = {
    'Ostrava': { lat: 49.83, lng: 18.29 },
    'Opava': { lat: 49.83, lng: 18.29 }, // Close to Ostrava
    'Praha': { lat: 50.0755, lng: 14.4378 },
    'Brno': { lat: 49.1951, lng: 16.6068 }
  }
  
  therapists.forEach(therapist => {
    const center = cityCenters[therapist.city]
    if (center) {
      const distance = calculateDistance(center, { lat: therapist.latitude, lng: therapist.longitude })
      if (distance > 50) {
        errors.push(`${therapist.fullName} in ${therapist.city} is ${distance.toFixed(1)}km from center (too far)`)
      }
    }
    
    // Validate required fields
    if (!therapist.isFixture) {
      errors.push(`${therapist.fullName} is not marked as fixture`)
    }
    
    if (!therapist.diagnosisTags || therapist.diagnosisTags.length === 0) {
      errors.push(`${therapist.fullName} has no diagnosis tags`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Print Part B therapist summary
 */
function printPartBSummary(therapists) {
  console.log('\n📍 Part B Therapist Summary:')
  
  const byCity = therapists.reduce((acc, therapist) => {
    if (!acc[therapist.city]) acc[therapist.city] = []
    acc[therapist.city].push(therapist)
    return acc
  }, {})
  
  Object.entries(byCity).forEach(([city, cityTherapists]) => {
    console.log(`\n   ${city}:`)
    cityTherapists.forEach(therapist => {
      const distance = city === 'Ostrava' || city === 'Opava' 
        ? calculateDistance({ lat: 49.83, lng: 18.29 }, { lat: therapist.latitude, lng: therapist.longitude })
        : city === 'Praha'
        ? calculateDistance({ lat: 50.0755, lng: 14.4378 }, { lat: therapist.latitude, lng: therapist.longitude })
        : calculateDistance({ lat: 49.1951, lng: 16.6068 }, { lat: therapist.latitude, lng: therapist.longitude })
      
      console.log(`     - ${therapist.fullName}: ${therapist.practiceType}, ${therapist.diagnosisTags.join(', ')}, ${distance.toFixed(1)}km from center`)
      console.log(`       Languages: ${therapist.languages.join(', ')}, Available: ${therapist.nextAvailableDays} days, Accepting: ${therapist.acceptingNew ? 'Yes' : 'No'}`)
    })
  })
}

/**
 * Seed Part B fixtures
 */
async function seedPartBFixtures() {
  console.log('🌱 Seeding Part B fixtures...\n')
  console.log('🎯 Environment: NEXT_PUBLIC_BIBIA_FIXTURES=true\n')
  
  // Check if Part B mode is enabled
  if (process.env.NEXT_PUBLIC_BIBIA_FIXTURES !== 'true') {
    console.log('❌ NEXT_PUBLIC_BIBIA_FIXTURES is not enabled.')
    console.log('   Set NEXT_PUBLIC_BIBIA_FIXTURES=true to seed Part B fixtures.')
    process.exit(1)
  }
  
  try {
    // Create complete therapist objects
    const completeTherapists = PART_B_THERAPISTS.map(createCompleteTherapist)
    
    // Validate data
    const validation = validatePartBData(completeTherapists)
    if (!validation.isValid) {
      console.log('❌ Part B data validation failed:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
      process.exit(1)
    }
    
    // Print summary
    printPartBSummary(completeTherapists)
    
    // Save to fixtures file
    const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
    await fs.writeFile(fixturesPath, JSON.stringify(completeTherapists, null, 2))
    
    console.log(`\n💾 Part B fixtures saved to: ${fixturesPath}`)
    console.log(`📊 Total therapists seeded: ${completeTherapists.length}`)
    console.log('✅ Part B seeding completed successfully!')
    
    console.log('\n🎯 Part B Features:')
    console.log('   ✅ NEXT_PUBLIC_BIBIA_FIXTURES environment toggle')
    console.log('   ✅ Specific therapist data as specified')
    console.log('   ✅ All therapists marked with isFixture=true')
    console.log('   ✅ Ready for cleanup with cleanup script')
    
  } catch (error) {
    console.error('❌ Error seeding Part B fixtures:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  seedPartBFixtures()
}
