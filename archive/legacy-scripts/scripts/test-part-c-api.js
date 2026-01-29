#!/usr/bin/env node

/**
 * Part C API Integration Test
 * Tests the actual API endpoints to ensure Part C acceptance criteria work
 * through the real search system
 */

const { execSync } = require('child_process')
const fs = require('fs').promises
const path = require('path')

// City centers
const OSTRAVA_CENTER = { lat: 49.8209, lng: 18.2625 }

/**
 * Make API request to search therapists
 */
async function searchTherapistsAPI(query) {
  const apiUrl = 'http://localhost:3000/api/searchTherapists'
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query)
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.log(`   ❌ API Error: ${error.message}`)
    return null
  }
}

/**
 * Start the development server
 */
async function startDevServer() {
  console.log('🚀 Starting development server...')
  
  try {
    // Start server in background
    const serverProcess = execSync('npm run dev', { 
      cwd: process.cwd(),
      stdio: 'pipe',
      detached: true
    })
    
    // Wait for server to start
    console.log('   ⏳ Waiting for server to start...')
    await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
    
    return true
  } catch (error) {
    console.log(`   ❌ Failed to start server: ${error.message}`)
    return false
  }
}

/**
 * Test Part C API Integration
 */
async function testPartCAPIIntegration() {
  console.log('🧪 Testing Part C API Integration\n')
  console.log('🎯 Testing actual API endpoints for acceptance criteria:\n')
  console.log('   1. "Ostrava + 30 km + backneck" → ≥1 result')
  console.log('   2. "Online consultations" → always shows the online fixture(s)\n')
  
  try {
    // Ensure fixtures are seeded
    console.log('📋 Step 1: Seeding Part B fixtures...')
    const seedResult = execSync('NEXT_PUBLIC_BIBIA_FIXTURES=true node scripts/seed-part-b-fixtures.js', {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    })
    console.log('   ✅ Fixtures seeded successfully')
    
    // Test 1: Ostrava + 30km + backneck via API
    console.log('\n📋 Step 2: Testing Ostrava + 30km + backneck via API')
    const ostravaBackneckQuery = {
      location: { lat: OSTRAVA_CENTER.lat, lng: OSTRAVA_CENTER.lng },
      radiusKm: 30,
      diagnosisTags: ['backneck'],
      page: 1,
      pageSize: 50
    }
    
    console.log(`   Query: ${JSON.stringify(ostravaBackneckQuery, null, 2)}`)
    
    const ostravaResults = await searchTherapistsAPI(ostravaBackneckQuery)
    
    if (ostravaResults && ostravaResults.results) {
      console.log(`   Results: ${ostravaResults.results.length} therapists`)
      
      if (ostravaResults.results.length >= 1) {
        console.log('   ✅ PASS: Found ≥1 result via API')
        ostravaResults.results.slice(0, 3).forEach((therapist, index) => {
          console.log(`     ${index + 1}. ${therapist.fullName} (${therapist.city}) - ${therapist.distanceKm?.toFixed(1)}km`)
          console.log(`        Diagnosis: ${therapist.diagnosisTags?.join(', ') || 'None'}`)
          console.log(`        Practice: ${therapist.practiceType}`)
        })
      } else {
        console.log('   ❌ FAIL: No results found via API')
      }
    } else {
      console.log('   ❌ FAIL: API request failed')
    }
    
    // Test 2: Online consultations via API
    console.log('\n📋 Step 3: Testing online consultations via API')
    const onlineQuery = {
      location: { cityOrZip: 'Czech Republic' },
      radiusKm: 1000,
      onlineOnly: true,
      mustHave: {
        practiceType: ['online']
      },
      page: 1,
      pageSize: 50
    }
    
    console.log(`   Query: ${JSON.stringify(onlineQuery, null, 2)}`)
    
    const onlineResults = await searchTherapistsAPI(onlineQuery)
    
    if (onlineResults && onlineResults.results) {
      console.log(`   Results: ${onlineResults.results.length} therapists`)
      
      if (onlineResults.results.length > 0) {
        console.log('   ✅ PASS: Found online therapists via API')
        onlineResults.results.forEach((therapist, index) => {
          console.log(`     ${index + 1}. ${therapist.fullName} (${therapist.city})`)
          console.log(`        Diagnosis: ${therapist.diagnosisTags?.join(', ') || 'None'}`)
          console.log(`        Practice: ${therapist.practiceType}`)
          console.log(`        Languages: ${therapist.languages?.join(', ') || 'None'}`)
        })
      } else {
        console.log('   ❌ FAIL: No online therapists found via API')
      }
    } else {
      console.log('   ❌ FAIL: API request failed')
    }
    
    // Test 3: Verify fixture data is being used
    console.log('\n📋 Step 4: Verifying fixture data usage')
    const fixtureQuery = {
      location: { lat: OSTRAVA_CENTER.lat, lng: OSTRAVA_CENTER.lng },
      radiusKm: 50,
      page: 1,
      pageSize: 100
    }
    
    const allResults = await searchTherapistsAPI(fixtureQuery)
    
    if (allResults && allResults.results) {
      const fixtureTherapists = allResults.results.filter(t => t.isFixture)
      console.log(`   Total results: ${allResults.results.length}`)
      console.log(`   Fixture therapists: ${fixtureTherapists.length}`)
      
      if (fixtureTherapists.length > 0) {
        console.log('   ✅ PASS: Fixture data is being used by API')
      } else {
        console.log('   ❌ FAIL: No fixture data found in API results')
      }
    }
    
    // Summary
    console.log('\n📊 Part C API Integration Test Summary:')
    const test1Passed = ostravaResults && ostravaResults.results && ostravaResults.results.length >= 1
    const test2Passed = onlineResults && onlineResults.results && onlineResults.results.length > 0
    const test3Passed = allResults && allResults.results && allResults.results.some(t => t.isFixture)
    
    console.log(`   Test 1 (Ostrava + 30km + backneck API): ${test1Passed ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`   Test 2 (Online consultations API): ${test2Passed ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`   Test 3 (Fixture data usage): ${test3Passed ? '✅ PASS' : '❌ FAIL'}`)
    
    const allTestsPassed = test1Passed && test2Passed && test3Passed
    
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL API TESTS PASSED' : '❌ SOME API TESTS FAILED'}`)
    
    if (allTestsPassed) {
      console.log('\n🚀 Part C API Integration Verified:')
      console.log('   ✅ API correctly returns Ostrava + 30km + backneck results')
      console.log('   ✅ API correctly returns online consultation results')
      console.log('   ✅ API correctly uses fixture data')
      console.log('   ✅ Search system integration works correctly')
    } else {
      console.log('\n❌ Some API tests failed. Please check the search system integration.')
    }
    
  } catch (error) {
    console.error('❌ Error testing Part C API integration:', error)
  }
}

// Run the test
if (require.main === module) {
  testPartCAPIIntegration()
}
