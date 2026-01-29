#!/usr/bin/env tsx

/**
 * Test script for distance rings functionality
 * Part C - Distance hooks testing
 */

import { 
  haversineKm, 
  ringForDistance, 
  getRingLabel, 
  proximityBoost,
  calculateDistanceAndRing,
  distanceRingsKm,
  distanceRingLabels,
  defaultUserPreferences
} from '../lib/distance-rings'

// Test coordinates (Prague area)
const prague = { lat: 50.0755, lng: 14.4378 }
const brno = { lat: 49.1951, lng: 16.6068 }
const ostrava = { lat: 49.8209, lng: 18.2625 }
const nearby = { lat: 50.0855, lng: 14.4478 } // ~1km from Prague
const close = { lat: 50.1055, lng: 14.4678 } // ~5km from Prague
const medium = { lat: 50.1755, lng: 14.5378 } // ~15km from Prague
const far = { lat: 50.3755, lng: 14.7378 } // ~35km from Prague

function testHaversineKm() {
  console.log('🧮 Testing haversineKm function:')
  
  // Test same point (should be 0)
  const samePoint = haversineKm(prague.lat, prague.lng, prague.lat, prague.lng)
  console.log(`  Same point: ${samePoint.toFixed(2)} km (expected: 0.00)`)
  
  // Test known distances
  const pragueToBrno = haversineKm(prague.lat, prague.lng, brno.lat, brno.lng)
  console.log(`  Prague to Brno: ${pragueToBrno.toFixed(2)} km (expected: ~205 km)`)
  
  const pragueToOstrava = haversineKm(prague.lat, prague.lng, ostrava.lat, ostrava.lng)
  console.log(`  Prague to Ostrava: ${pragueToOstrava.toFixed(2)} km (expected: ~355 km)`)
  
  const pragueToNearby = haversineKm(prague.lat, prague.lng, nearby.lat, nearby.lng)
  console.log(`  Prague to nearby: ${pragueToNearby.toFixed(2)} km (expected: ~1 km)`)
  
  console.log()
}

function testRingForDistance() {
  console.log('🎯 Testing ringForDistance function:')
  
  const testDistances = [0, 5, 10, 15, 25, 30, 50, 60, 150, 200]
  
  testDistances.forEach(km => {
    const ringIndex = ringForDistance(km)
    const label = getRingLabel(ringIndex)
    console.log(`  ${km} km → Ring ${ringIndex}: ${label}`)
  })
  
  console.log()
}

function testProximityBoost() {
  console.log('⚡ Testing proximityBoost function:')
  
  for (let i = 0; i < distanceRingsKm.length; i++) {
    const boost = proximityBoost(i)
    const label = getRingLabel(i)
    console.log(`  Ring ${i} (${label}): boost = ${boost}`)
  }
  
  console.log()
}

function testCalculateDistanceAndRing() {
  console.log('📍 Testing calculateDistanceAndRing function:')
  
  const testLocations = [
    { name: 'Prague center', coords: prague },
    { name: 'Nearby (1km)', coords: nearby },
    { name: 'Close (5km)', coords: close },
    { name: 'Medium (15km)', coords: medium },
    { name: 'Far (35km)', coords: far },
    { name: 'Brno (205km)', coords: brno }
  ]
  
  testLocations.forEach(({ name, coords }) => {
    const result = calculateDistanceAndRing(prague, coords)
    console.log(`  Prague → ${name}: ${result.distanceKm.toFixed(2)} km, Ring ${result.ringIndex} (${result.ringLabel})`)
  })
  
  console.log()
}

function testUserPreferences() {
  console.log('👤 Testing user preferences:')
  console.log(`  Default preferCloser: ${defaultUserPreferences.preferCloser}`)
  console.log()
}

function testDistanceRingsConfig() {
  console.log('⚙️  Distance rings configuration:')
  console.log(`  Rings: [${distanceRingsKm.join(', ')}] km`)
  console.log(`  Labels: [${distanceRingLabels.join(', ')}]`)
  console.log()
}

function main() {
  console.log('🚀 Distance Rings Test Suite')
  console.log('============================\n')
  
  testDistanceRingsConfig()
  testHaversineKm()
  testRingForDistance()
  testProximityBoost()
  testCalculateDistanceAndRing()
  testUserPreferences()
  
  console.log('✅ All tests completed!')
}

// Run the tests
if (require.main === module) {
  main()
}
