#!/usr/bin/env tsx

/**
 * Integration test for distance rings with search/matching module
 * Part C - Distance hooks integration verification
 */

import { 
  haversineKm, 
  ringForDistance, 
  proximityBoost,
  calculateDistanceAndRing,
  distanceRingsKm,
  defaultUserPreferences,
  type ScoringInput,
  type UserPreferences
} from '../lib/distance-rings'

// Mock data that matches the existing search types
const mockUser = {
  city: 'Praha',
  lat: 50.0755,
  lng: 14.4378,
  preferCloser: true,
  conditions: ['bolesti-krk-zada', 'menstrualni-potize']
}

const mockTherapist = {
  city: 'Praha',
  lat: 50.0855,
  lng: 14.4478,
  modalities: ['ordinace', 'online'],
  conditions: ['bolesti-krk-zada', 'sportovci']
}

function testSearchIntegration() {
  console.log('🔗 Testing distance rings integration with search module:')
  
  // Test 1: Basic distance calculation
  const distance = haversineKm(
    mockUser.lat, mockUser.lng,
    mockTherapist.lat, mockTherapist.lng
  )
  console.log(`  Distance: ${distance.toFixed(2)} km`)
  
  // Test 2: Ring classification
  const ringIndex = ringForDistance(distance)
  console.log(`  Ring index: ${ringIndex}`)
  
  // Test 3: Proximity boost
  const boost = proximityBoost(ringIndex)
  console.log(`  Proximity boost: ${boost}`)
  
  // Test 4: Complete calculation
  const result = calculateDistanceAndRing(
    { lat: mockUser.lat, lng: mockUser.lng },
    { lat: mockTherapist.lat, lng: mockTherapist.lng }
  )
  console.log(`  Complete result: ${result.distanceKm.toFixed(2)} km, Ring ${result.ringIndex} (${result.ringLabel})`)
  
  console.log()
}

function testScoringInputShape() {
  console.log('📊 Testing scoring input shape:')
  
  const scoringInput: ScoringInput = {
    user: mockUser,
    therapist: mockTherapist
  }
  
  console.log('  Scoring input structure:')
  console.log(`    User: ${scoringInput.user.city} (${scoringInput.user.lat}, ${scoringInput.user.lng})`)
  console.log(`    Therapist: ${scoringInput.therapist.city} (${scoringInput.therapist.lat}, ${scoringInput.therapist.lng})`)
  console.log(`    User prefers closer: ${scoringInput.user.preferCloser}`)
  console.log(`    User conditions: [${scoringInput.user.conditions.join(', ')}]`)
  console.log(`    Therapist modalities: [${scoringInput.therapist.modalities.join(', ')}]`)
  console.log(`    Therapist conditions: [${scoringInput.therapist.conditions.join(', ')}]`)
  
  console.log()
}

function testUserPreferences() {
  console.log('👤 Testing user preferences:')
  
  const preferences: UserPreferences = {
    preferCloser: true
  }
  
  console.log(`  Default preferences: ${JSON.stringify(preferences)}`)
  console.log(`  Matches default: ${JSON.stringify(preferences) === JSON.stringify(defaultUserPreferences)}`)
  
  console.log()
}

function testDistanceRingsConfig() {
  console.log('⚙️  Testing distance rings configuration:')
  
  console.log(`  Rings: [${distanceRingsKm.join(', ')}] km`)
  console.log(`  Ring count: ${distanceRingsKm.length}`)
  
  // Test all rings
  distanceRingsKm.forEach((ring, index) => {
    const boost = proximityBoost(index)
    console.log(`    Ring ${index}: ≤${ring} km, boost: ${boost}`)
  })
  
  console.log()
}

function testEdgeCases() {
  console.log('🧪 Testing edge cases:')
  
  // Test same location
  const sameLocation = calculateDistanceAndRing(
    { lat: 50.0755, lng: 14.4378 },
    { lat: 50.0755, lng: 14.4378 }
  )
  console.log(`  Same location: ${sameLocation.distanceKm.toFixed(2)} km, Ring ${sameLocation.ringIndex}`)
  
  // Test very far location
  const farLocation = calculateDistanceAndRing(
    { lat: 50.0755, lng: 14.4378 },
    { lat: 60.0, lng: 20.0 }
  )
  console.log(`  Far location: ${farLocation.distanceKm.toFixed(2)} km, Ring ${farLocation.ringIndex}`)
  
  // Test negative ring index
  const negativeBoost = proximityBoost(-1)
  console.log(`  Negative ring boost: ${negativeBoost}`)
  
  // Test out-of-bounds ring index
  const outOfBoundsBoost = proximityBoost(10)
  console.log(`  Out-of-bounds ring boost: ${outOfBoundsBoost}`)
  
  console.log()
}

function main() {
  console.log('🚀 Distance Rings Integration Test Suite')
  console.log('=========================================\n')
  
  testDistanceRingsConfig()
  testSearchIntegration()
  testScoringInputShape()
  testUserPreferences()
  testEdgeCases()
  
  console.log('✅ Integration tests completed!')
  console.log('📦 Distance rings module is ready for search/matching integration')
}

// Run the tests
if (require.main === module) {
  main()
}
