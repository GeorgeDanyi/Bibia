// Test script for Part B endpoints and functionality
// Tests API console logging, health endpoints, and debug endpoints

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testHealthEndpoint() {
  console.log('🏥 Testing /api/searchTherapists/health endpoint...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/searchTherapists/health`)
    const data = await response.json()
    
    console.log('Health endpoint response:', data)
    
    if (data.ok && typeof data.therapistsTotal === 'number') {
      console.log('✅ Health endpoint working correctly')
    } else {
      console.log('❌ Health endpoint returned unexpected data')
    }
  } catch (error) {
    console.log('❌ Health endpoint failed:', error)
  }
}

async function testCountNearbyEndpoint() {
  console.log('\n📍 Testing /api/debug/countNearby endpoint...')
  
  const testCases = [
    {
      name: 'Prague center',
      lat: 50.0755,
      lng: 14.4378,
      radiusKm: 10
    },
    {
      name: 'Brno center',
      lat: 49.1951,
      lng: 16.6068,
      radiusKm: 5
    },
    {
      name: 'Invalid coordinates',
      lat: 999,
      lng: 999,
      radiusKm: 10
    },
    {
      name: 'Missing parameters',
      lat: 50.0755,
      // lng missing
      radiusKm: 10
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n  Testing: ${testCase.name}`)
    
    try {
      const response = await fetch(`${BASE_URL}/api/debug/countNearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: testCase.lat,
          lng: testCase.lng,
          radiusKm: testCase.radiusKm
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log(`    ✅ Found ${data.count} therapists within ${testCase.radiusKm}km`)
        console.log(`    📊 Total therapists in database: ${data.totalTherapists}`)
        if (data.statistics) {
          console.log(`    📈 Min distance: ${data.statistics.minDistance}km`)
          console.log(`    📈 Max distance: ${data.statistics.maxDistance}km`)
          console.log(`    📈 Avg distance: ${data.statistics.avgDistance}km`)
        }
      } else {
        console.log(`    ❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.log(`    ❌ Request failed: ${error}`)
    }
  }
}

async function testSearchAPIWithConsoleLogging() {
  console.log('\n🔍 Testing search API with console logging (dev mode)...')
  
  const searchRequest = {
    location: { cityOrZip: 'Prague' },
    radiusKm: 20,
    diagnosisTags: ['anxiety', 'depression'],
    mustHave: {
      practiceType: ['private'],
      languages: ['cs']
    },
    prefer: {
      distance: true,
      availability: true
    },
    page: 1,
    pageSize: 10
  }
  
  try {
    console.log('Sending search request:', {
      city: searchRequest.location.cityOrZip,
      radiusKm: searchRequest.radiusKm,
      conditions: searchRequest.diagnosisTags,
      practice: searchRequest.mustHave.practiceType,
      availability: searchRequest.mustHave.languages
    })
    
    const response = await fetch(`${BASE_URL}/api/searchTherapists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Query-ID': 'test_query_123',
        'X-Session-ID': 'test_session_456'
      },
      body: JSON.stringify(searchRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Search API working correctly')
      console.log(`📊 Results: ${data.results.length} therapists found`)
      console.log(`📊 Total: ${data.pagination.total} therapists`)
      console.log(`📊 Radius used: ${data.searchInfo.radiusKmUsed}km`)
      if (data.searchInfo.expandedRadiusKm) {
        console.log(`📊 Expanded radius: ${data.searchInfo.expandedRadiusKm}km`)
      }
    } else {
      console.log('❌ Search API error:', data.error)
    }
  } catch (error) {
    console.log('❌ Search API request failed:', error)
  }
}

async function testGeocodingErrorHandling() {
  console.log('\n🗺️ Testing geocoding error handling...')
  
  const invalidLocationRequest = {
    location: { cityOrZip: 'InvalidCityName12345' },
    radiusKm: 20,
    diagnosisTags: ['anxiety'],
    page: 1,
    pageSize: 10
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/searchTherapists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Query-ID': 'test_geocoding_error',
        'X-Session-ID': 'test_session_789'
      },
      body: JSON.stringify(invalidLocationRequest)
    })
    
    const data = await response.json()
    
    if (response.status === 400) {
      console.log('✅ Geocoding error handled correctly (400 status)')
      console.log(`📝 Error message: ${data.error}`)
      console.log(`📝 Details: ${data.details}`)
    } else {
      console.log('❌ Expected 400 status for invalid location')
      console.log('Response:', data)
    }
  } catch (error) {
    console.log('❌ Geocoding error test failed:', error)
  }
}

async function runAllTests() {
  console.log('🧪 Running Part B endpoint tests...\n')
  
  await testHealthEndpoint()
  await testCountNearbyEndpoint()
  await testSearchAPIWithConsoleLogging()
  await testGeocodingErrorHandling()
  
  console.log('\n✅ Part B tests completed!')
  console.log('\n💡 Notes:')
  console.log('   - API console.log only shows in development mode (NODE_ENV=development)')
  console.log('   - Health endpoint provides therapist count for monitoring')
  console.log('   - Debug endpoint helps diagnose location-based issues')
  console.log('   - Geocoding errors return 400 with helpful error messages')
  console.log('   - Client guardrails show "Please refine location" with questionnaire link')
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

export { testHealthEndpoint, testCountNearbyEndpoint, testSearchAPIWithConsoleLogging, testGeocodingErrorHandling }
