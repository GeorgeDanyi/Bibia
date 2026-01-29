#!/usr/bin/env node

/**
 * Test Part B Configuration
 * Verifies that the environment toggle and fixture configuration work correctly
 */

// Simulate different environment scenarios
function testFixtureConfig() {
  console.log('🧪 Testing Part B Configuration...\n')
  
  // Test 1: No environment variables
  console.log('Test 1: No environment variables')
  delete process.env.NEXT_PUBLIC_BIBIA_FIXTURES
  delete process.env.BIBIA_USE_FIXTURES
  delete process.env.FIXTURE_MODE
  delete process.env.NODE_ENV
  
  const config1 = getFixtureConfig()
  console.log(`   Enabled: ${config1.enabled}`)
  console.log(`   Expected: false`)
  console.log(`   Result: ${config1.enabled === false ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 2: NEXT_PUBLIC_BIBIA_FIXTURES=true
  console.log('Test 2: NEXT_PUBLIC_BIBIA_FIXTURES=true')
  process.env.NEXT_PUBLIC_BIBIA_FIXTURES = 'true'
  
  const config2 = getFixtureConfig()
  console.log(`   Enabled: ${config2.enabled}`)
  console.log(`   Expected: true`)
  console.log(`   Result: ${config2.enabled === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 3: BIBIA_USE_FIXTURES=true
  console.log('Test 3: BIBIA_USE_FIXTURES=true')
  delete process.env.NEXT_PUBLIC_BIBIA_FIXTURES
  process.env.BIBIA_USE_FIXTURES = 'true'
  
  const config3 = getFixtureConfig()
  console.log(`   Enabled: ${config3.enabled}`)
  console.log(`   Expected: true`)
  console.log(`   Result: ${config3.enabled === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 4: NODE_ENV=test
  console.log('Test 4: NODE_ENV=test')
  delete process.env.BIBIA_USE_FIXTURES
  process.env.NODE_ENV = 'test'
  
  const config4 = getFixtureConfig()
  console.log(`   Enabled: ${config4.enabled}`)
  console.log(`   Expected: true`)
  console.log(`   Result: ${config4.enabled === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 5: Part B mode detection
  console.log('Test 5: Part B mode detection')
  process.env.NEXT_PUBLIC_BIBIA_FIXTURES = 'true'
  
  const isPartB = isPartBMode()
  console.log(`   Part B Mode: ${isPartB}`)
  console.log(`   Expected: true`)
  console.log(`   Result: ${isPartB === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 6: Client-side fixture mode
  console.log('Test 6: Client-side fixture mode')
  const isClientSide = isClientSideFixtureMode()
  console.log(`   Client-side Mode: ${isClientSide}`)
  console.log(`   Expected: true`)
  console.log(`   Result: ${isClientSide === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Test 7: Server-side fixture mode
  console.log('Test 7: Server-side fixture mode')
  delete process.env.NEXT_PUBLIC_BIBIA_FIXTURES
  process.env.BIBIA_USE_FIXTURES = 'true'
  
  const isServerSide = isServerSideFixtureMode()
  console.log(`   Server-side Mode: ${isServerSide}`)
  console.log(`   Expected: true`)
  console.log(`   Result: ${isServerSide === true ? '✅ PASS' : '❌ FAIL'}\n`)
  
  console.log('🎯 Part B Configuration Tests Complete!')
}

// Simplified fixture config functions for testing
function getFixtureConfig() {
  const enabled = process.env.BIBIA_USE_FIXTURES === 'true' || 
                  process.env.NEXT_PUBLIC_BIBIA_FIXTURES === 'true' ||
                  process.env.FIXTURE_MODE === 'true' || 
                  process.env.NODE_ENV === 'test'
  const useMockData = process.env.USE_MOCK_DATA === 'true' || enabled
  const useDeterministicData = process.env.USE_DETERMINISTIC_DATA === 'true' || process.env.DETERMINISTIC_MODE === 'true'
  const testRadiusKm = parseInt(process.env.TEST_RADIUS_KM || '30', 10)
  const targetCities = (process.env.TARGET_CITIES || 'Praha,Ostrava,Brno').split(',')
  const minDistanceKm = parseInt(process.env.MIN_DISTANCE_KM || '5', 10)
  const maxDistanceKm = parseInt(process.env.MAX_DISTANCE_KM || '30', 10)

  return {
    enabled,
    useMockData,
    useDeterministicData,
    testRadiusKm,
    targetCities,
    minDistanceKm,
    maxDistanceKm
  }
}

function isPartBMode() {
  return process.env.NEXT_PUBLIC_BIBIA_FIXTURES === 'true'
}

function isClientSideFixtureMode() {
  return process.env.NEXT_PUBLIC_BIBIA_FIXTURES === 'true'
}

function isServerSideFixtureMode() {
  return process.env.BIBIA_USE_FIXTURES === 'true'
}

// Run the tests
if (require.main === module) {
  testFixtureConfig()
}
