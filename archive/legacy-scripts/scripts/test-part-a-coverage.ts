#!/usr/bin/env ts-node

/**
 * Test script to verify Part A fixture coverage
 * Validates that deterministic fixtures are properly distributed within 30-50km of target cities
 */

import { getPartADeterministicFixtures, validatePartAFixtures } from '../lib/data/part-a-deterministic-fixtures'
import { kmDistance } from '../lib/distance'

// City centers
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 }
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }
const BRNO_CENTER = { lat: 49.1951, lng: 16.6068 }

interface CoverageReport {
  city: string
  total: number
  minDistance: number
  maxDistance: number
  avgDistance: number
  within30km: number
  within35km: number
  within40km: number
  within45km: number
  within50km: number
  onlineOnly: number
  bechterev: number
  sports: number
  backPain: number
  isValid: boolean
  errors: string[]
}

function generateCoverageReport(therapists: any[], city: string, center: { lat: number; lng: number }): CoverageReport {
  const cityTherapists = therapists.filter(t => t.city === city)
  const distances = cityTherapists.map(t => kmDistance(center, { lat: t.latitude, lng: t.longitude }))
  
  const errors: string[] = []
  
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
    sports: cityTherapists.filter(t => t.diagnosisTags?.some((tag: string) => tag.includes('sport'))).length,
    backPain: cityTherapists.filter(t => t.diagnosisTags?.some((tag: string) => tag.includes('bolest'))).length,
    isValid: errors.length === 0,
    errors
  }
}

function printCoverageReport(report: CoverageReport): void {
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

function testPartACoverage(): void {
  console.log('🧪 Testing Part A fixture coverage...\n')
  console.log('🎯 Goal: Verify data exists within 30–50 km of Prague, Ostrava, and Brno\n')
  
  try {
    // Get fixture data
    const therapists = getPartADeterministicFixtures()
    
    // Validate fixtures
    const validation = validatePartAFixtures()
    if (!validation.isValid) {
      console.log('❌ Fixture validation failed:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
      return
    }
    
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
