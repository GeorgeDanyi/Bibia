#!/usr/bin/env tsx

/**
 * Demo script for distance rings integration
 * Part C - Distance hooks demonstration
 */

import { 
  haversineKm, 
  ringForDistance, 
  proximityBoost,
  calculateDistanceAndRing,
  distanceRingsKm,
  distanceRingLabels,
  defaultUserPreferences,
  type ScoringInput,
  type UserPreferences
} from '../lib/distance-rings'

function demoBasicFunctionality() {
  console.log('🎯 Distance Rings Demo')
  console.log('=====================\n')
  
  // Demo coordinates
  const prague = { lat: 50.0755, lng: 14.4378 }
  const nearby = { lat: 50.0855, lng: 14.4478 } // ~1km away
  const medium = { lat: 50.1755, lng: 14.5378 } // ~15km away
  const far = { lat: 50.3755, lng: 14.7378 } // ~35km away
  
  console.log('📍 Testing different distances from Prague center:')
  
  const locations = [
    { name: 'Prague center', coords: prague },
    { name: 'Nearby (1km)', coords: nearby },
    { name: 'Medium (15km)', coords: medium },
    { name: 'Far (35km)', coords: far }
  ]
  
  locations.forEach(({ name, coords }) => {
    const result = calculateDistanceAndRing(prague, coords)
    const boost = proximityBoost(result.ringIndex)
    
    console.log(`  ${name}:`)
    console.log(`    Distance: ${result.distanceKm.toFixed(2)} km`)
    console.log(`    Ring: ${result.ringIndex} (${result.ringLabel})`)
    console.log(`    Proximity boost: ${boost}`)
    console.log()
  })
}

function demoScoringInput() {
  console.log('📊 Scoring Input Shape Demo:')
  console.log('============================\n')
  
  const scoringInput: ScoringInput = {
    user: {
      city: 'Praha',
      lat: 50.0755,
      lng: 14.4378,
      preferCloser: true,
      conditions: ['bolesti-krk-zada', 'menstrualni-potize']
    },
    therapist: {
      city: 'Praha',
      lat: 50.0855,
      lng: 14.4478,
      modalities: ['ordinace', 'online'],
      conditions: ['bolesti-krk-zada', 'sportovci']
    }
  }
  
  console.log('Scoring input structure:')
  console.log(JSON.stringify(scoringInput, null, 2))
  console.log()
}

function demoUserPreferences() {
  console.log('👤 User Preferences Demo:')
  console.log('=========================\n')
  
  const preferences: UserPreferences = {
    preferCloser: true
  }
  
  console.log('User preferences:')
  console.log(JSON.stringify(preferences, null, 2))
  console.log(`Matches default: ${JSON.stringify(preferences) === JSON.stringify(defaultUserPreferences)}`)
  console.log()
}

function demoDistanceRingsConfig() {
  console.log('⚙️  Distance Rings Configuration:')
  console.log('==================================\n')
  
  console.log('Rings and labels:')
  distanceRingsKm.forEach((ring, index) => {
    const label = distanceRingLabels[index]
    const boost = proximityBoost(index)
    console.log(`  Ring ${index}: ≤${ring} km - "${label}" (boost: ${boost})`)
  })
  console.log()
}

function demoIntegrationPoints() {
  console.log('🔗 Integration Points:')
  console.log('======================\n')
  
  console.log('1. Import in search/matching module:')
  console.log('   import { haversineKm, ringForDistance, proximityBoost } from "@/lib/distance-rings"')
  console.log()
  
  console.log('2. Add to existing scoreTherapist function:')
  console.log('   const distanceKm = haversineKm(userCoords, therapistCoords)')
  console.log('   const ringIndex = ringForDistance(distanceKm)')
  console.log('   const proximityScore = proximityBoost(ringIndex) * 20')
  console.log()
  
  console.log('3. Update ranking logic:')
  console.log('   - Sort by total score first')
  console.log('   - Then by proximity ring (if preferCloser)')
  console.log('   - Finally by exact distance within ring')
  console.log()
  
  console.log('4. Store user preferences:')
  console.log('   - Add preferCloser to user profile/session')
  console.log('   - Default to true for proximity-based matching')
  console.log()
}

function main() {
  demoBasicFunctionality()
  demoScoringInput()
  demoUserPreferences()
  demoDistanceRingsConfig()
  demoIntegrationPoints()
  
  console.log('✅ Demo completed!')
  console.log('📦 Distance rings system is ready for integration')
}

if (require.main === module) {
  main()
}
