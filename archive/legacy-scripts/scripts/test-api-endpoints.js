#!/usr/bin/env node

/**
 * API Endpoint Test for Part C
 * Tests the actual API behavior with and without fixture mode
 */

const http = require('http')

// Test API endpoint
function testAPIEndpoint(port, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/therapists',
      method: 'GET'
    }

    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const therapists = JSON.parse(data)
          resolve({
            count: therapists.length,
            prague: therapists.filter(t => t.city === 'Praha').length,
            ostrava: therapists.filter(t => t.city === 'Ostrava').length,
            bechterev: therapists.filter(t => 
              t.diagnosisTags && t.diagnosisTags.some(tag => tag.includes('Bechtěrev'))
            ).length,
            fixtures: therapists.filter(t => t.isFixture).length,
            production: therapists.filter(t => !t.isFixture).length
          })
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

async function runAPITests() {
  console.log('🌐 API Endpoint Test for Part C\n')
  console.log('=' .repeat(50))
  
  try {
    // Test with fixture mode (port 3005)
    console.log('🔧 Testing with fixture mode enabled (BIBIA_USE_FIXTURES=true)...')
    const fixtureResults = await testAPIEndpoint(3005, 'Fixture Mode ON')
    
    console.log(`   Total therapists: ${fixtureResults.count}`)
    console.log(`   Praha therapists: ${fixtureResults.prague}`)
    console.log(`   Ostrava therapists: ${fixtureResults.ostrava}`)
    console.log(`   Bechtěrev specialists: ${fixtureResults.bechterev}`)
    console.log(`   Fixture therapists: ${fixtureResults.fixtures}`)
    console.log(`   Production therapists: ${fixtureResults.production}`)
    
    // Test without fixture mode (port 3000)
    console.log('\n🔧 Testing with fixture mode disabled...')
    const productionResults = await testAPIEndpoint(3000, 'Fixture Mode OFF')
    
    console.log(`   Total therapists: ${productionResults.count}`)
    console.log(`   Praha therapists: ${productionResults.prague}`)
    console.log(`   Ostrava therapists: ${productionResults.ostrava}`)
    console.log(`   Bechtěrev specialists: ${productionResults.bechterev}`)
    console.log(`   Fixture therapists: ${productionResults.fixtures}`)
    console.log(`   Production therapists: ${productionResults.production}`)
    
    // Validate results
    console.log('\n' + '=' .repeat(50))
    console.log('📊 API Test Results:\n')
    
    const fixtureModeWorks = fixtureResults.count > productionResults.count
    const productionClean = productionResults.fixtures === 0
    const pragueSearchPass = fixtureResults.prague >= 6
    const ostravaSearchPass = fixtureResults.ostrava >= 4
    const bechterevPass = fixtureResults.bechterev >= 2 // At least 2 total (1 per city)
    
    console.log(`1. Fixture mode toggle: ${fixtureModeWorks ? '✅ PASS' : '❌ FAIL'} (${fixtureResults.count} vs ${productionResults.count})`)
    console.log(`2. Production data clean: ${productionClean ? '✅ PASS' : '❌ FAIL'} (${productionResults.fixtures} fixtures in production)`)
    console.log(`3. Praha search (≥6): ${pragueSearchPass ? '✅ PASS' : '❌ FAIL'} (${fixtureResults.prague}/6)`)
    console.log(`4. Ostrava search (≥4): ${ostravaSearchPass ? '✅ PASS' : '❌ FAIL'} (${fixtureResults.ostrava}/4)`)
    console.log(`5. Bechtěrev coverage: ${bechterevPass ? '✅ PASS' : '❌ FAIL'} (${fixtureResults.bechterev} specialists)`)
    
    const allPassed = fixtureModeWorks && productionClean && pragueSearchPass && ostravaSearchPass && bechterevPass
    
    console.log('\n' + '=' .repeat(50))
    console.log(`Overall Result: ${allPassed ? '✅ ALL API TESTS PASS' : '❌ SOME API TESTS FAIL'}`)
    
    if (allPassed) {
      console.log('\n🎉 API endpoints are working correctly for Part C acceptance!')
    } else {
      console.log('\n❌ API tests failed. Please check the server configuration.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
    console.log('\n💡 Make sure the development server is running:')
    console.log('   - With fixtures: BIBIA_USE_FIXTURES=true npm run dev (port 3005)')
    console.log('   - Without fixtures: npm run dev (port 3000)')
    process.exit(1)
  }
}

// Run the tests
runAPITests()





