#!/usr/bin/env node

/**
 * Test script to verify Part A fixture coverage
 * Validates that deterministic fixtures are properly distributed within 30-50km of target cities
 */

const fs = require('fs')
const path = require('path')

// City centers
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
    
    therapists.push({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Praha'
    })
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
    
    therapists.push({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Ostrava'
    })
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
    
    therapists.push({
      ...therapist,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Brno'
    })
  })
  
  return therapists
}

function generateCoverageReport(therapists, city, center) {
  const cityTherapists = therapists.filter(t => t.city === city)
  const distances = cityTherapists.map(t => calculateDistance(center, { lat: t.latitude, lng: t.longitude }))
  
  const errors = []
  
  // Check distance requirements
  const minDistance = Math.min(...distances)
  const maxDistance = Math.max(...distances)
  
  if (minDistance < 30) {
    errors.push(`Minimum distance ${minDistance.toFixed(1)}km is below 30km requirement`)
  }
  if (maxDistance > 50) {
    errors.push(`Maximum distance ${maxDistance.toFixed(1)}km exceeds 50km requirement`)
  }
  
  // Check count requirements
  if (cityTherapists.length < 10) {
    errors.push(`Only ${cityTherapists.length} therapists found, expected at least 10`)
  }
  
  return {
    city,
    total: cityTherapists.length,
    minDistance,
    maxDistance,
    avgDistance: Math.round((distances.reduce((a, b) => a + b, 0) / distances.length) * 10) / 10,
    within30km: distances.filter(d => d <= 30).length,
    within35km: distances.filter(d => d <= 35).length,
    within40km: distances.filter(d => d <= 40).length,
    within45km: distances.filter(d => d <= 45).length,
    within50km: distances.filter(d => d <= 50).length,
    onlineOnly: cityTherapists.filter(t => t.practiceType === 'online').length,
    bechterev: cityTherapists.filter(t => t.diagnosisTags?.includes('Bechtěrev')).length,
    sports: cityTherapists.filter(t => t.diagnosisTags?.some(tag => tag.includes('sport'))).length,
    backPain: cityTherapists.filter(t => t.diagnosisTags?.some(tag => tag.includes('bolest'))).length,
    isValid: errors.length === 0,
    errors
  }
}

function printCoverageReport(report) {
  console.log(`\n📍 ${report.city} Coverage Report:`)
  console.log(`   Status: ${report.isValid ? '✅ VALID' : '❌ INVALID'}`)
  console.log(`   Total therapists: ${report.total}`)
  console.log(`   Distance range: ${report.minDistance.toFixed(1)}km - ${report.maxDistance.toFixed(1)}km`)
  console.log(`   Average distance: ${report.avgDistance}km`)
  console.log(`   Distribution:`)
  console.log(`     - Within 30km: ${report.within30km}`)
  console.log(`     - Within 35km: ${report.within35km}`)
  console.log(`     - Within 40km: ${report.within40km}`)
  console.log(`     - Within 45km: ${report.within45km}`)
  console.log(`     - Within 50km: ${report.within50km}`)
  console.log(`   Specialties:`)
  console.log(`     - Online-only: ${report.onlineOnly}`)
  console.log(`     - Bechtěrev specialists: ${report.bechterev}`)
  console.log(`     - Sports specialists: ${report.sports}`)
  console.log(`     - Back pain specialists: ${report.backPain}`)
  
  if (report.errors.length > 0) {
    console.log(`   ❌ Errors:`)
    report.errors.forEach(error => console.log(`     - ${error}`))
  }
}

function testPartACoverage() {
  console.log('🧪 Testing Part A fixture coverage...\n')
  console.log('🎯 Goal: Verify data exists within 30–50 km of Prague, Ostrava, and Brno\n')
  
  try {
    // Generate fixture data
    const therapists = generatePartADeterministicFixtures()
    
    // Generate coverage reports
    const pragueReport = generateCoverageReport(therapists, 'Praha', PRAGUE_CENTER)
    const ostravaReport = generateCoverageReport(therapists, 'Ostrava', OSTRAVA_CENTER)
    const brnoReport = generateCoverageReport(therapists, 'Brno', BRNO_CENTER)
    
    // Print reports
    printCoverageReport(pragueReport)
    printCoverageReport(ostravaReport)
    printCoverageReport(brnoReport)
    
    // Overall validation
    const allValid = pragueReport.isValid && ostravaReport.isValid && brnoReport.isValid
    
    console.log(`\n📊 Overall Results:`)
    console.log(`   Total therapists: ${therapists.length}`)
    console.log(`   Prague: ${pragueReport.total} therapists (${pragueReport.isValid ? '✅' : '❌'})`)
    console.log(`   Ostrava: ${ostravaReport.total} therapists (${ostravaReport.isValid ? '✅' : '❌'})`)
    console.log(`   Brno: ${brnoReport.total} therapists (${brnoReport.isValid ? '✅' : '❌'})`)
    
    if (allValid) {
      console.log(`\n✅ PART A COVERAGE TEST PASSED`)
      console.log(`   🎯 All cities have guaranteed data within 30-50km range`)
      console.log(`   🎯 Deterministic coordinates ensure consistent testing`)
      console.log(`   🎯 Sufficient coverage for geo & scoring validation`)
    } else {
      console.log(`\n❌ PART A COVERAGE TEST FAILED`)
      console.log(`   Some cities do not meet the 30-50km coverage requirements`)
    }
    
  } catch (error) {
    console.error('❌ Error testing Part A coverage:', error)
  }
}

// Run the test
if (require.main === module) {
  testPartACoverage()
}
