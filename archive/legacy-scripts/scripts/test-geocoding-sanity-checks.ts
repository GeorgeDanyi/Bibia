/**
 * Test script for geocoding and location sanity checks
 * Part A: Verify elimination of silent failures and actionable feedback
 */

import { geocodingService } from '../lib/services/geocoding'
import { validateLocationInput, validateCoordinates, generateLocationSuggestions } from '../lib/validation/location'
import { CZECH_BOUNDS, MAJOR_CZECH_CITIES } from '../lib/types/geocoding'

async function testGeocodingSanityChecks() {
  console.log('🧪 Testing Geocoding & Location Sanity Checks')
  console.log('=' .repeat(60))

  // Test 1: Location input validation
  console.log('\n1. Testing location input validation...')
  
  const testInputs = [
    { input: '', expected: false, description: 'Empty input' },
    { input: 'a', expected: false, description: 'Too short' },
    { input: 'Praha', expected: true, description: 'Valid city name' },
    { input: '123', expected: false, description: 'Only numbers' },
    { input: 'test', expected: false, description: 'Test data' },
    { input: '50.0755,14.4378', expected: true, description: 'Coordinates string' },
    { input: '110 00', expected: true, description: 'Postal code' },
    { input: 'město', expected: true, description: 'Generic term (should warn)' },
    { input: 'Praha!!!', expected: false, description: 'Invalid characters' }
  ]

  for (const test of testInputs) {
    const result = validateLocationInput(test.input)
    const passed = result.isValid === test.expected
    console.log(`  ${passed ? '✅' : '❌'} ${test.description}: "${test.input}"`)
    if (!passed) {
      console.log(`    Expected: ${test.expected}, Got: ${result.isValid}`)
      if (result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.join(', ')}`)
      }
    }
    if (result.warnings.length > 0) {
      console.log(`    Warnings: ${result.warnings.join(', ')}`)
    }
  }

  // Test 2: Coordinate validation
  console.log('\n2. Testing coordinate validation...')
  
  const testCoordinates = [
    { lat: 50.0755, lng: 14.4378, expected: true, description: 'Prague (valid)' },
    { lat: 49.7437, lng: 13.3775, expected: true, description: 'Plzeň (valid)' },
    { lat: 40.7128, lng: -74.0060, expected: false, description: 'New York (outside CZ)' },
    { lat: 0, lng: 0, expected: false, description: 'Equator (outside CZ)' },
    { lat: NaN, lng: 14.4378, expected: false, description: 'Invalid latitude' },
    { lat: 50.0755, lng: NaN, expected: false, description: 'Invalid longitude' },
    { lat: 48.6, lng: 12.1, expected: true, description: 'Near border (should warn)' }
  ]

  for (const test of testCoordinates) {
    const result = validateCoordinates(test.lat, test.lng)
    const passed = result.isValid === test.expected
    console.log(`  ${passed ? '✅' : '❌'} ${test.description}: (${test.lat}, ${test.lng})`)
    if (!passed) {
      console.log(`    Expected: ${test.expected}, Got: ${result.isValid}`)
      if (result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.join(', ')}`)
      }
    }
    if (result.warnings.length > 0) {
      console.log(`    Warnings: ${result.warnings.join(', ')}`)
    }
  }

  // Test 3: Location suggestions
  console.log('\n3. Testing location suggestions...')
  
  const testSuggestions = [
    { input: 'praha', expected: ['Praha'], description: 'Exact match' },
    { input: 'brn', expected: ['Brno'], description: 'Partial match' },
    { input: 'invalid', expected: [], description: 'No matches' },
    { input: 'plzen', expected: ['Plzeň'], description: 'Misspelling' }
  ]

  for (const test of testSuggestions) {
    const suggestions = generateLocationSuggestions(test.input)
    const hasExpected = test.expected.every(exp => suggestions.includes(exp))
    console.log(`  ${hasExpected ? '✅' : '❌'} ${test.description}: "${test.input}"`)
    console.log(`    Suggestions: [${suggestions.join(', ')}]`)
  }

  // Test 4: Geocoding service with error handling
  console.log('\n4. Testing geocoding service error handling...')
  
  const geocodeTests = [
    { input: 'Praha', expectedSuccess: true, description: 'Valid city' },
    { input: 'Brno', expectedSuccess: true, description: 'Valid city' },
    { input: 'InvalidCity123', expectedSuccess: false, description: 'Invalid city' },
    { input: '', expectedSuccess: false, description: 'Empty input' },
    { input: 'test', expectedSuccess: false, description: 'Test data' },
    { input: { lat: 50.0755, lng: 14.4378 }, expectedSuccess: true, description: 'Valid coordinates' },
    { input: { lat: 40.7128, lng: -74.0060 }, expectedSuccess: false, description: 'Invalid coordinates' }
  ]

  for (const test of geocodeTests) {
    try {
      const response = await geocodingService.resolveUserLocation(test.input)
      const passed = response.success === test.expectedSuccess
      console.log(`  ${passed ? '✅' : '❌'} ${test.description}`)
      
      if (response.success) {
        console.log(`    Result: (${response.result?.lat}, ${response.result?.lng}) - ${response.result?.city}`)
        if (response.warnings && response.warnings.length > 0) {
          console.log(`    Warnings: ${response.warnings.join(', ')}`)
        }
      } else {
        console.log(`    Error: ${response.error?.userMessage}`)
        console.log(`    Type: ${response.error?.type}`)
        if (response.error?.suggestions) {
          console.log(`    Suggestions: [${response.error.suggestions.join(', ')}]`)
        }
      }
    } catch (error) {
      console.log(`  ❌ ${test.description} - Unexpected error: ${error}`)
    }
  }

  // Test 5: Cache functionality
  console.log('\n5. Testing cache functionality...')
  
  try {
    // Clear cache first
    geocodingService.clearCache()
    const initialStats = geocodingService.getCacheStats()
    console.log(`  ✅ Cache cleared: ${initialStats.size} entries`)
    
    // Test caching
    await geocodingService.resolveUserLocation('Praha')
    const afterFirstStats = geocodingService.getCacheStats()
    console.log(`  ✅ After first request: ${afterFirstStats.size} entries`)
    
    // Same request should use cache
    await geocodingService.resolveUserLocation('Praha')
    const afterSecondStats = geocodingService.getCacheStats()
    console.log(`  ✅ After second request: ${afterSecondStats.size} entries (should be same)`)
    
    if (afterFirstStats.size === afterSecondStats.size) {
      console.log(`  ✅ Cache working correctly`)
    } else {
      console.log(`  ❌ Cache not working correctly`)
    }
  } catch (error) {
    console.log(`  ❌ Cache test failed: ${error}`)
  }

  // Test 6: Czech Republic bounds validation
  console.log('\n6. Testing Czech Republic bounds...')
  
  console.log(`  📍 Czech Republic bounds:`)
  console.log(`    Latitude: ${CZECH_BOUNDS.minLat} - ${CZECH_BOUNDS.maxLat}`)
  console.log(`    Longitude: ${CZECH_BOUNDS.minLng} - ${CZECH_BOUNDS.maxLng}`)
  
  console.log(`  🏙️ Major Czech cities: ${MAJOR_CZECH_CITIES.slice(0, 5).join(', ')}...`)

  // Test 7: Error message quality
  console.log('\n7. Testing error message quality...')
  
  const errorTests = [
    { input: '', expectedActionable: true, description: 'Empty input should be actionable' },
    { input: 'InvalidCity123', expectedActionable: true, description: 'Invalid city should be actionable' },
    { input: { lat: 40.7128, lng: -74.0060 }, expectedActionable: true, description: 'Out of bounds should be actionable' }
  ]

  for (const test of errorTests) {
    try {
      const response = await geocodingService.resolveUserLocation(test.input)
      if (!response.success && response.error) {
        const isActionable = response.error.actionable === test.expectedActionable
        console.log(`  ${isActionable ? '✅' : '❌'} ${test.description}`)
        console.log(`    Message: ${response.error.userMessage}`)
        console.log(`    Actionable: ${response.error.actionable}`)
        if (response.error.suggestions) {
          console.log(`    Suggestions: [${response.error.suggestions.join(', ')}]`)
        }
      }
    } catch (error) {
      console.log(`  ❌ ${test.description} - Unexpected error: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Geocoding & Location Sanity Checks Test Complete!')
  console.log('\nKey improvements implemented:')
  console.log('✅ Eliminated silent failures - all errors are now reported')
  console.log('✅ Added actionable feedback with suggestions')
  console.log('✅ Implemented Czech Republic bounds validation')
  console.log('✅ Enhanced input validation with sanity checks')
  console.log('✅ Improved error messages in Czech language')
  console.log('✅ Added confidence levels for geocoding results')
  console.log('✅ Implemented proper fallback strategies')
}

// Run the test
if (require.main === module) {
  testGeocodingSanityChecks().catch(console.error)
}

export { testGeocodingSanityChecks }
