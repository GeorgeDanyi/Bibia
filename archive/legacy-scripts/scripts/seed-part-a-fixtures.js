#!/usr/bin/env node

/**
 * Seed Part A deterministic fixtures script
 * Seeds therapist data within 30-50km of Prague, Ostrava, and Brno
 */

const fs = require('fs').promises
const path = require('path')

// City centers for distance calculation
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 }
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }
const BRNO_CENTER = { lat: 49.1951, lng: 16.6068 }

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
 * Generate deterministic coordinates within specific distance range from center
 */
function generateDeterministicCoordinates(center, minKm, maxKm, seed) {
  // Simple seeded random number generator
  function seededRandom(seed) {
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
 * Create a therapist with all required fields
 */
function createTherapist(data) {
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
    regions: data.city === 'Praha' ? ['Praha', 'Středočeský'] : 
             data.city === 'Brno' ? ['Jihomoravský'] : ['Moravskoslezský'],
    languages: ['cs', (idHash % 3) === 0 ? 'en' : 'cs'],
    yearsExperience,
    pricePerSession: priceRange.minCZK,
    latitude: data.latitude,
    longitude: data.longitude,
    clinicLat: data.latitude,
    clinicLon: data.longitude,
    homeVisitRadiusKm: data.practiceType === 'online' ? 0 : 5 + (idHash % 15),
    practiceType: data.practiceType,
    acceptingNew,
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
    isVerified,
    tags: data.diagnosisTags,
    diagnosisTags: data.diagnosisTags,
    experienceTags: data.diagnosisTags,
    isFixture: true,
    priceRange: priceRange
  }
}

/**
 * Generate Part A deterministic fixtures
 */
function generatePartADeterministicFixtures() {
  const therapists = []
  
  // Prague cluster (15 therapists)
  const pragueTherapists = [
    { id: 'prague_det_1', name: 'MUDr. Anna Bechtěrevová', diagnosisTags: ['Bechtěrev', 'bolesti zad'], practiceType: 'clinic' },
    { id: 'prague_det_2', name: 'Bc. Tomáš Sportovní', diagnosisTags: ['sportovní úraz', 'bolesti zad'], practiceType: 'private' },
    { id: 'prague_det_3', name: 'MUDr. Marie Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'prague_det_4', name: 'Bc. Jana Rehab', diagnosisTags: ['rehabilitace', 'po operaci'], practiceType: 'clinic' },
    { id: 'prague_det_5', name: 'MUDr. Pavel Bolest', diagnosisTags: ['bolesti zad', 'krční páteř'], practiceType: 'private' },
    { id: 'prague_det_6', name: 'MUDr. Eva Sport', diagnosisTags: ['sportovní úraz', 'výkonnost'], practiceType: 'clinic' },
    { id: 'prague_det_7', name: 'Bc. Jakub Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'prague_det_8', name: 'MUDr. Lucie Bechtěrev', diagnosisTags: ['Bechtěrev', 'chronické bolesti'], practiceType: 'private' },
    { id: 'prague_det_9', name: 'Bc. Martin Rehab', diagnosisTags: ['rehabilitace', 'bolesti zad'], practiceType: 'clinic' },
    { id: 'prague_det_10', name: 'MUDr. Petra Bolest', diagnosisTags: ['bolesti zad', 'skolióza'], practiceType: 'private' },
    { id: 'prague_det_11', name: 'Bc. Ondřej Sport', diagnosisTags: ['sportovní úraz', 'bolesti zad'], practiceType: 'clinic' },
    { id: 'prague_det_12', name: 'MUDr. Kateřina Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'prague_det_13', name: 'Bc. Filip Rehab', diagnosisTags: ['rehabilitace', 'po operaci'], practiceType: 'private' },
    { id: 'prague_det_14', name: 'MUDr. Veronika Bolest', diagnosisTags: ['bolesti zad', 'krční páteř'], practiceType: 'clinic' },
    { id: 'prague_det_15', name: 'Bc. Michal Bechtěrev', diagnosisTags: ['Bechtěrev', 'chronické bolesti'], practiceType: 'private' }
  ]
  
  // Ostrava cluster (12 therapists)
  const ostravaTherapists = [
    { id: 'ostrava_det_1', name: 'MUDr. Pavel Bechtěrev', diagnosisTags: ['Bechtěrev', 'chronické bolesti'], practiceType: 'clinic' },
    { id: 'ostrava_det_2', name: 'Bc. Jana Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'ostrava_det_3', name: 'MUDr. Marie Rehab', diagnosisTags: ['rehabilitace', 'bolesti zad'], practiceType: 'private' },
    { id: 'ostrava_det_4', name: 'Bc. Tomáš Sport', diagnosisTags: ['sportovní úraz', 'bolesti zad'], practiceType: 'clinic' },
    { id: 'ostrava_det_5', name: 'MUDr. Eva Bolest', diagnosisTags: ['bolesti zad', 'skolióza'], practiceType: 'private' },
    { id: 'ostrava_det_6', name: 'Bc. Jakub Online', diagnosisTags: ['bolesti zad', 'krční páteř'], practiceType: 'online' },
    { id: 'ostrava_det_7', name: 'MUDr. Lucie Rehab', diagnosisTags: ['rehabilitace', 'po operaci'], practiceType: 'clinic' },
    { id: 'ostrava_det_8', name: 'Bc. Martin Sport', diagnosisTags: ['sportovní úraz', 'výkonnost'], practiceType: 'private' },
    { id: 'ostrava_det_9', name: 'MUDr. Petra Bolest', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'clinic' },
    { id: 'ostrava_det_10', name: 'Bc. Ondřej Bechtěrev', diagnosisTags: ['Bechtěrev', 'chronické bolesti'], practiceType: 'private' },
    { id: 'ostrava_det_11', name: 'MUDr. Kateřina Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'ostrava_det_12', name: 'Bc. Filip Rehab', diagnosisTags: ['rehabilitace', 'bolesti zad'], practiceType: 'clinic' }
  ]
  
  // Brno cluster (12 therapists)
  const brnoTherapists = [
    { id: 'brno_det_1', name: 'MUDr. Anna Bechtěrev', diagnosisTags: ['Bechtěrev', 'chronické bolesti'], practiceType: 'clinic' },
    { id: 'brno_det_2', name: 'Bc. Tomáš Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'brno_det_3', name: 'MUDr. Marie Sport', diagnosisTags: ['sportovní úraz', 'bolesti zad'], practiceType: 'private' },
    { id: 'brno_det_4', name: 'Bc. Jana Rehab', diagnosisTags: ['rehabilitace', 'po operaci'], practiceType: 'clinic' },
    { id: 'brno_det_5', name: 'MUDr. Pavel Bolest', diagnosisTags: ['bolesti zad', 'krční páteř'], practiceType: 'private' },
    { id: 'brno_det_6', name: 'Bc. Eva Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'brno_det_7', name: 'MUDr. Jakub Sport', diagnosisTags: ['sportovní úraz', 'výkonnost'], practiceType: 'clinic' },
    { id: 'brno_det_8', name: 'Bc. Lucie Rehab', diagnosisTags: ['rehabilitace', 'bolesti zad'], practiceType: 'private' },
    { id: 'brno_det_9', name: 'MUDr. Martin Bolest', diagnosisTags: ['bolesti zad', 'skolióza'], practiceType: 'clinic' },
    { id: 'brno_det_10', name: 'Bc. Petra Bechtěrev', diagnosisTags: ['Bechtěrev', 'chronické bolesti'], practiceType: 'private' },
    { id: 'brno_det_11', name: 'MUDr. Ondřej Online', diagnosisTags: ['bolesti zad', 'rehabilitace'], practiceType: 'online' },
    { id: 'brno_det_12', name: 'Bc. Kateřina Sport', diagnosisTags: ['sportovní úraz', 'bolesti zad'], practiceType: 'clinic' }
  ]
  
  // Generate Prague therapists (30-50km range)
  pragueTherapists.forEach((therapist, index) => {
    let coords
    if (index < 5) {
      coords = generateDeterministicCoordinates(PRAGUE_CENTER, 30, 35, therapist.id.charCodeAt(0) + index)
    } else if (index < 10) {
      coords = generateDeterministicCoordinates(PRAGUE_CENTER, 35, 40, therapist.id.charCodeAt(0) + index + 100)
    } else {
      coords = generateDeterministicCoordinates(PRAGUE_CENTER, 40, 50, therapist.id.charCodeAt(0) + index + 200)
    }
    
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Praha'
    }))
  })
  
  // Generate Ostrava therapists (30-50km range)
  ostravaTherapists.forEach((therapist, index) => {
    let coords
    if (index < 4) {
      coords = generateDeterministicCoordinates(OSTRAVA_CENTER, 30, 35, therapist.id.charCodeAt(0) + index)
    } else if (index < 8) {
      coords = generateDeterministicCoordinates(OSTRAVA_CENTER, 35, 40, therapist.id.charCodeAt(0) + index + 100)
    } else {
      coords = generateDeterministicCoordinates(OSTRAVA_CENTER, 40, 50, therapist.id.charCodeAt(0) + index + 200)
    }
    
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Ostrava'
    }))
  })
  
  // Generate Brno therapists (30-50km range)
  brnoTherapists.forEach((therapist, index) => {
    let coords
    if (index < 4) {
      coords = generateDeterministicCoordinates(BRNO_CENTER, 30, 35, therapist.id.charCodeAt(0) + index)
    } else if (index < 8) {
      coords = generateDeterministicCoordinates(BRNO_CENTER, 35, 40, therapist.id.charCodeAt(0) + index + 100)
    } else {
      coords = generateDeterministicCoordinates(BRNO_CENTER, 40, 50, therapist.id.charCodeAt(0) + index + 200)
    }
    
    therapists.push(createTherapist({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Brno'
    }))
  })
  
  return therapists
}

function calculateClusterStats(therapists, city, center) {
  const cityTherapists = therapists.filter(t => t.city === city)
  const distances = cityTherapists.map(t => calculateDistance(center, { lat: t.latitude, lng: t.longitude }))
  
  return {
    city,
    total: cityTherapists.length,
    minDistance: Math.min(...distances),
    maxDistance: Math.max(...distances),
    avgDistance: Math.round((distances.reduce((a, b) => a + b, 0) / distances.length) * 10) / 10,
    within30km: distances.filter(d => d <= 30).length,
    within35km: distances.filter(d => d <= 35).length,
    within40km: distances.filter(d => d <= 40).length,
    within45km: distances.filter(d => d <= 45).length,
    within50km: distances.filter(d => d <= 50).length,
    onlineOnly: cityTherapists.filter(t => t.practiceType === 'online').length,
    bechterev: cityTherapists.filter(t => t.diagnosisTags?.includes('Bechtěrev')).length,
    sports: cityTherapists.filter(t => t.diagnosisTags?.some(tag => tag.includes('sport'))).length,
    backPain: cityTherapists.filter(t => t.diagnosisTags?.some(tag => tag.includes('bolest'))).length
  }
}

function printClusterStats(stats) {
  console.log(`\n📍 ${stats.city} Cluster:`)
  console.log(`   Total therapists: ${stats.total}`)
  console.log(`   Distance range: ${stats.minDistance.toFixed(1)}km - ${stats.maxDistance.toFixed(1)}km`)
  console.log(`   Average distance: ${stats.avgDistance}km`)
  console.log(`   Within 30km: ${stats.within30km}`)
  console.log(`   Within 35km: ${stats.within35km}`)
  console.log(`   Within 40km: ${stats.within40km}`)
  console.log(`   Within 45km: ${stats.within45km}`)
  console.log(`   Within 50km: ${stats.within50km}`)
  console.log(`   Online-only: ${stats.onlineOnly}`)
  console.log(`   Bechtěrev specialists: ${stats.bechterev}`)
  console.log(`   Sports specialists: ${stats.sports}`)
  console.log(`   Back pain specialists: ${stats.backPain}`)
  
  // Print min/max distance to city center as required by Part A
  console.log(`\n   🎯 Part A Validation:`)
  console.log(`   Min distance to city center: ${stats.minDistance.toFixed(1)}km`)
  console.log(`   Max distance to city center: ${stats.maxDistance.toFixed(1)}km`)
  console.log(`   ✅ All within 30-50km range: ${stats.minDistance >= 30 && stats.maxDistance <= 50 ? 'YES' : 'NO'}`)
}

function validatePartARequirements(stats) {
  console.log('\n✅ Validating Part A requirements...\n')
  
  let allPassed = true
  
  const pragueStats = stats.find(s => s.city === 'Praha')
  const ostravaStats = stats.find(s => s.city === 'Ostrava')
  const brnoStats = stats.find(s => s.city === 'Brno')
  
  if (pragueStats) {
    console.log('Prague requirements:')
    const pragueTotal = pragueStats.total === 15
    const pragueRange = pragueStats.minDistance >= 30 && pragueStats.maxDistance <= 50
    const pragueBechterev = pragueStats.bechterev >= 2
    const pragueOnline = pragueStats.onlineOnly >= 2
    
    console.log(`  - 15 therapists total: ${pragueTotal ? '✅' : '❌'} (${pragueStats.total})`)
    console.log(`  - All within 30-50km: ${pragueRange ? '✅' : '❌'} (${pragueStats.minDistance.toFixed(1)}-${pragueStats.maxDistance.toFixed(1)}km)`)
    console.log(`  - ≥2 Bechtěrev specialists: ${pragueBechterev ? '✅' : '❌'} (${pragueStats.bechterev})`)
    console.log(`  - ≥2 online-only: ${pragueOnline ? '✅' : '❌'} (${pragueStats.onlineOnly})`)
    
    if (!pragueTotal || !pragueRange || !pragueBechterev || !pragueOnline) {
      allPassed = false
    }
  }
  
  if (ostravaStats) {
    console.log('\nOstrava requirements:')
    const ostravaTotal = ostravaStats.total === 12
    const ostravaRange = ostravaStats.minDistance >= 30 && ostravaStats.maxDistance <= 50
    const ostravaBechterev = ostravaStats.bechterev >= 1
    const ostravaOnline = ostravaStats.onlineOnly >= 2
    
    console.log(`  - 12 therapists total: ${ostravaTotal ? '✅' : '❌'} (${ostravaStats.total})`)
    console.log(`  - All within 30-50km: ${ostravaRange ? '✅' : '❌'} (${ostravaStats.minDistance.toFixed(1)}-${ostravaStats.maxDistance.toFixed(1)}km)`)
    console.log(`  - ≥1 Bechtěrev specialist: ${ostravaBechterev ? '✅' : '❌'} (${ostravaStats.bechterev})`)
    console.log(`  - ≥2 online-only: ${ostravaOnline ? '✅' : '❌'} (${ostravaStats.onlineOnly})`)
    
    if (!ostravaTotal || !ostravaRange || !ostravaBechterev || !ostravaOnline) {
      allPassed = false
    }
  }
  
  if (brnoStats) {
    console.log('\nBrno requirements:')
    const brnoTotal = brnoStats.total === 12
    const brnoRange = brnoStats.minDistance >= 30 && brnoStats.maxDistance <= 50
    const brnoBechterev = brnoStats.bechterev >= 1
    const brnoOnline = brnoStats.onlineOnly >= 2
    
    console.log(`  - 12 therapists total: ${brnoTotal ? '✅' : '❌'} (${brnoStats.total})`)
    console.log(`  - All within 30-50km: ${brnoRange ? '✅' : '❌'} (${brnoStats.minDistance.toFixed(1)}-${brnoStats.maxDistance.toFixed(1)}km)`)
    console.log(`  - ≥1 Bechtěrev specialist: ${brnoBechterev ? '✅' : '❌'} (${brnoStats.bechterev})`)
    console.log(`  - ≥2 online-only: ${brnoOnline ? '✅' : '❌'} (${brnoStats.onlineOnly})`)
    
    if (!brnoTotal || !brnoRange || !brnoBechterev || !brnoOnline) {
      allPassed = false
    }
  }
  
  console.log(`\nOverall result: ${allPassed ? '✅ ALL PART A REQUIREMENTS MET' : '❌ SOME REQUIREMENTS NOT MET'}`)
  return allPassed
}

async function seedPartAFixtures() {
  console.log('🌱 Seeding Part A deterministic fixtures...\n')
  console.log('🎯 Goal: Guarantee data exists for testing within 30–50 km of Prague, Ostrava, and Brno\n')
  
  // Check if BIBIA_USE_FIXTURES is enabled
  if (process.env.BIBIA_USE_FIXTURES !== 'true') {
    console.log('❌ BIBIA_USE_FIXTURES is not enabled. Set BIBIA_USE_FIXTURES=true to seed fixtures.')
    process.exit(1)
  }
  
  try {
    // Generate deterministic fixture data
    const fixtureTherapists = generatePartADeterministicFixtures()
    
    // Calculate statistics
    const pragueStats = calculateClusterStats(fixtureTherapists, 'Praha', PRAGUE_CENTER)
    const ostravaStats = calculateClusterStats(fixtureTherapists, 'Ostrava', OSTRAVA_CENTER)
    const brnoStats = calculateClusterStats(fixtureTherapists, 'Brno', BRNO_CENTER)
    
    // Print statistics
    printClusterStats(pragueStats)
    printClusterStats(ostravaStats)
    printClusterStats(brnoStats)
    
    // Validate requirements
    const passed = validatePartARequirements([pragueStats, ostravaStats, brnoStats])
    
    if (!passed) {
      console.log('\n❌ Part A requirements validation failed. Please check the fixture data generation.')
      process.exit(1)
    }
    
    // Save to fixtures file
    const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
    await fs.writeFile(fixturesPath, JSON.stringify(fixtureTherapists, null, 2))
    
    console.log(`\n💾 Part A fixtures saved to: ${fixturesPath}`)
    console.log(`📊 Total therapists seeded: ${fixtureTherapists.length}`)
    console.log(`   - Prague: ${pragueStats.total} therapists`)
    console.log(`   - Ostrava: ${ostravaStats.total} therapists`)
    console.log(`   - Brno: ${brnoStats.total} therapists`)
    console.log('✅ Part A seeding completed successfully!')
    console.log('\n🎯 Part A Goals Achieved:')
    console.log('   ✅ Guaranteed data exists for testing within 30–50 km of Prague')
    console.log('   ✅ Guaranteed data exists for testing within 30–50 km of Ostrava')
    console.log('   ✅ Guaranteed data exists for testing within 30–50 km of Brno')
    console.log('   ✅ Deterministic coordinates for consistent testing')
    
  } catch (error) {
    console.error('❌ Error seeding Part A fixtures:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  seedPartAFixtures()
}
