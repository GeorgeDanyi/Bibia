#!/usr/bin/env ts-node

/**
 * Seed Part A deterministic fixtures script
 * Seeds therapist data within 30-50km of Prague, Ostrava, and Brno
 */

import { promises as fs } from 'fs'
import path from 'path'
import { getPartADeterministicFixtures, validatePartAFixtures } from '../lib/data/part-a-deterministic-fixtures'
import { kmDistance } from '../lib/distance'

// City centers for distance calculation
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 }
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }
const BRNO_CENTER = { lat: 49.1951, lng: 16.6068 }

interface ClusterStats {
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
}

function calculateClusterStats(therapists: any[], city: string, center: { lat: number; lng: number }): ClusterStats {
  const cityTherapists = therapists.filter(t => t.city === city)
  const distances = cityTherapists.map(t => kmDistance(center, { lat: t.latitude, lng: t.longitude }))
  
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
    sports: cityTherapists.filter(t => t.diagnosisTags?.some((tag: string) => tag.includes('sport'))).length,
    backPain: cityTherapists.filter(t => t.diagnosisTags?.some((tag: string) => tag.includes('bolest'))).length
  }
}

function printClusterStats(stats: ClusterStats): void {
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

function validatePartARequirements(stats: ClusterStats[]): boolean {
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

async function seedPartAFixtures(): Promise<void> {
  console.log('🌱 Seeding Part A deterministic fixtures...\n')
  console.log('🎯 Goal: Guarantee data exists for testing within 30–50 km of Prague, Ostrava, and Brno\n')
  
  // Check if BIBIA_USE_FIXTURES is enabled
  if (process.env.BIBIA_USE_FIXTURES !== 'true') {
    console.log('❌ BIBIA_USE_FIXTURES is not enabled. Set BIBIA_USE_FIXTURES=true to seed fixtures.')
    process.exit(1)
  }
  
  try {
    // Generate deterministic fixture data
    const fixtureTherapists = getPartADeterministicFixtures()
    
    // Validate fixture data
    const validation = validatePartAFixtures()
    if (!validation.isValid) {
      console.log('❌ Fixture validation failed:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
      process.exit(1)
    }
    
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
