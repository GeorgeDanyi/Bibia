#!/usr/bin/env node

/**
 * Data Health Check Script
 * 
 * Tests the therapist data loading system and provides clear feedback
 * about the health of the data pipeline.
 */

const http = require('http')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const req = http.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        } catch (error) {
          resolve({ status: res.statusCode, data: data, error: error.message })
        }
      })
    })
    
    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function runHealthCheck() {
  console.log('🔍 Therapist Data Health Check')
  console.log('=' .repeat(50))
  console.log(`Base URL: ${BASE_URL}`)
  console.log('')

  try {
    // Test 1: Health check endpoint
    console.log('1. Testing health check endpoint...')
    const healthResult = await makeRequest('/api/health')
    
    if (healthResult.status === 200) {
      console.log('   ✅ Health check passed')
      console.log(`   Status: ${healthResult.data.status}`)
      console.log(`   Timestamp: ${healthResult.data.timestamp}`)
      console.log('')
      
      // Display individual checks
      Object.entries(healthResult.data.checks).forEach(([checkName, check]) => {
        const icon = check.status === 'pass' ? '✅' : '❌'
        console.log(`   ${icon} ${checkName}: ${check.message}`)
        if (check.therapistCount) {
          console.log(`      Count: ${check.therapistCount} therapists`)
        }
      })
    } else {
      console.log('   ❌ Health check failed')
      console.log(`   Status: ${healthResult.status}`)
      console.log(`   Response: ${JSON.stringify(healthResult.data, null, 2)}`)
    }
    
    console.log('')

    // Test 2: Direct static file access
    console.log('2. Testing static file access...')
    const staticResult = await makeRequest('/data/therapists.json')
    
    if (staticResult.status === 200) {
      const therapistCount = Array.isArray(staticResult.data) ? staticResult.data.length : 0
      console.log(`   ✅ Static file accessible: ${therapistCount} therapists`)
    } else {
      console.log(`   ❌ Static file not accessible (${staticResult.status})`)
    }
    
    console.log('')

    // Test 3: API endpoint
    console.log('3. Testing API endpoint...')
    const apiResult = await makeRequest('/api/therapists')
    
    if (apiResult.status === 200) {
      const therapistCount = Array.isArray(apiResult.data) ? apiResult.data.length : 0
      console.log(`   ✅ API endpoint working: ${therapistCount} therapists`)
    } else {
      console.log(`   ❌ API endpoint failed (${apiResult.status})`)
    }
    
    console.log('')

    // Summary
    const allPassed = healthResult.status === 200 && 
                     staticResult.status === 200 && 
                     apiResult.status === 200
    
    if (allPassed) {
      console.log('🎉 All checks passed! Therapist data is healthy.')
      process.exit(0)
    } else {
      console.log('⚠️  Some checks failed. Review the output above.')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Health check failed with error:', error.message)
    console.error('')
    console.error('Make sure the development server is running:')
    console.error('  npm run dev')
    process.exit(1)
  }
}

// Run the health check
runHealthCheck()
