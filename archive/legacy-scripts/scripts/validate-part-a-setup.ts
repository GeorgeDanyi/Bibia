#!/usr/bin/env ts-node

/**
 * Part A Setup Validation Script
 * 
 * Quick validation script to ensure Part A implementation is properly set up
 * and ready for testing. This script checks:
 * 
 * 1. Environment configuration
 * 2. Fixture data availability
 * 3. API endpoint accessibility
 * 4. Basic search functionality
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface ValidationResult {
  test: string
  success: boolean
  message: string
  details?: any
}

class PartASetupValidator {
  private results: ValidationResult[] = []

  /**
   * Run all validation checks
   */
  public async runValidation(): Promise<void> {
    console.log('🔍 Part A Setup Validation')
    console.log('==========================\n')

    // Check environment
    this.checkEnvironment()
    
    // Check fixture data
    this.checkFixtureData()
    
    // Check API endpoints (if server is running)
    await this.checkApiEndpoints()
    
    // Generate report
    this.generateReport()
  }

  /**
   * Check environment configuration
   */
  private checkEnvironment(): void {
    console.log('🔧 Checking Environment Configuration...')
    
    // Check if fixture mode is enabled
    const fixtureMode = process.env.FIXTURE_MODE === 'true'
    this.addResult(
      'Fixture Mode',
      fixtureMode,
      fixtureMode ? 'Fixture mode is enabled' : 'Fixture mode is disabled (set FIXTURE_MODE=true)'
    )
    
    // Check if mock data is enabled
    const mockData = process.env.USE_MOCK_DATA === 'true'
    this.addResult(
      'Mock Data',
      mockData,
      mockData ? 'Mock data is enabled' : 'Mock data is disabled (set USE_MOCK_DATA=true)'
    )
    
    // Check if BIBIA_USE_FIXTURES is set
    const bibiaFixtures = process.env.BIBIA_USE_FIXTURES === 'true'
    this.addResult(
      'BIBIA Fixtures',
      bibiaFixtures,
      bibiaFixtures ? 'BIBIA_USE_FIXTURES is enabled' : 'BIBIA_USE_FIXTURES is disabled (set BIBIA_USE_FIXTURES=true)'
    )
  }

  /**
   * Check fixture data availability
   */
  private checkFixtureData(): void {
    console.log('\n📊 Checking Fixture Data...')
    
    // Check fixtures.json
    const fixturesPath = join(process.cwd(), 'data', 'fixtures.json')
    const fixturesExist = existsSync(fixturesPath)
    
    if (fixturesExist) {
      try {
        const fixturesData = JSON.parse(readFileSync(fixturesPath, 'utf8'))
        this.addResult(
          'Fixtures File',
          true,
          `Fixtures file exists with ${fixturesData.length} therapists`,
          { count: fixturesData.length }
        )
        
        // Check if fixtures have required fields
        const hasRequiredFields = fixturesData.every((t: any) => 
          t.id && t.fullName && t.city && t.latitude && t.longitude
        )
        this.addResult(
          'Fixture Schema',
          hasRequiredFields,
          hasRequiredFields ? 'All fixtures have required fields' : 'Some fixtures missing required fields'
        )
        
        // Check geographic coverage
        const pragueCount = fixturesData.filter((t: any) => t.city === 'Praha').length
        const ostravaCount = fixturesData.filter((t: any) => t.city === 'Ostrava').length
        const brnoCount = fixturesData.filter((t: any) => t.city === 'Brno').length
        
        this.addResult(
          'Geographic Coverage',
          pragueCount >= 5 && ostravaCount >= 5 && brnoCount >= 5,
          `Coverage: Prague(${pragueCount}), Ostrava(${ostravaCount}), Brno(${brnoCount})`,
          { prague: pragueCount, ostrava: ostravaCount, brno: brnoCount }
        )
        
      } catch (error) {
        this.addResult(
          'Fixtures File',
          false,
          'Fixtures file exists but cannot be parsed',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      }
    } else {
      this.addResult(
        'Fixtures File',
        false,
        'Fixtures file does not exist. Run: npm run seed:fixtures'
      )
    }
    
    // Check cz-therapist-fixtures.json
    const czFixturesPath = join(process.cwd(), 'data', 'cz-therapist-fixtures.json')
    const czFixturesExist = existsSync(czFixturesPath)
    
    this.addResult(
      'CZ Fixtures File',
      czFixturesExist,
      czFixturesExist ? 'CZ fixtures file exists' : 'CZ fixtures file does not exist'
    )
    
    // Check therapists.json
    const therapistsPath = join(process.cwd(), 'data', 'therapists.json')
    const therapistsExist = existsSync(therapistsPath)
    
    this.addResult(
      'Therapists File',
      therapistsExist,
      therapistsExist ? 'Therapists file exists' : 'Therapists file does not exist'
    )
  }

  /**
   * Check API endpoints (if server is running)
   */
  private async checkApiEndpoints(): Promise<void> {
    console.log('\n🌐 Checking API Endpoints...')
    
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
    
    try {
      // Test therapists endpoint
      const response = await fetch(`${baseUrl}/api/therapists`)
      
      if (response.ok) {
        const data = await response.json()
        this.addResult(
          'Therapists API',
          true,
          `API is accessible and returns ${data.length} therapists`,
          { count: data.length }
        )
        
        // Check if we're getting fixture data
        const isFixtureData = data.some((t: any) => t.isFixture || t.id?.includes('fixture'))
        this.addResult(
          'Fixture Data Active',
          isFixtureData,
          isFixtureData ? 'API is returning fixture data' : 'API is returning production data'
        )
        
      } else {
        this.addResult(
          'Therapists API',
          false,
          `API returned status ${response.status}`,
          { status: response.status }
        )
      }
      
    } catch (error) {
      this.addResult(
        'Therapists API',
        false,
        'API is not accessible. Make sure server is running: npm run dev',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
    
    try {
      // Test geocoding endpoint
      const response = await fetch(`${baseUrl}/api/geocode?q=Praha`)
      
      if (response.ok) {
        const data = await response.json()
        this.addResult(
          'Geocoding API',
          true,
          `Geocoding works: Praha -> ${data.lat}, ${data.lng}`,
          { lat: data.lat, lng: data.lng }
        )
      } else {
        this.addResult(
          'Geocoding API',
          false,
          `Geocoding API returned status ${response.status}`
        )
      }
      
    } catch (error) {
      this.addResult(
        'Geocoding API',
        false,
        'Geocoding API is not accessible',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Add validation result
   */
  private addResult(test: string, success: boolean, message: string, details?: any): void {
    this.results.push({ test, success, message, details })
    console.log(`  ${success ? '✅' : '❌'} ${test}: ${message}`)
  }

  /**
   * Generate validation report
   */
  private generateReport(): void {
    console.log('\n📋 Validation Report')
    console.log('===================')
    
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`)
          if (r.details) {
            console.log(`    Details: ${JSON.stringify(r.details, null, 2)}`)
          }
        })
    }
    
    console.log('\n🎯 Setup Status:')
    if (failedTests === 0) {
      console.log('✅ Part A setup is complete and ready for testing!')
      console.log('\n📋 Next Steps:')
      console.log('1. Run quick tests: npm run test:qa-part-a-quick')
      console.log('2. Run full QA tests: npm run test:qa-part-a')
      console.log('3. Test UI integration manually')
    } else {
      console.log('⚠️  Part A setup has issues that need to be resolved.')
      console.log('\n🔧 Recommended Actions:')
      
      if (this.results.some(r => r.test === 'Fixtures File' && !r.success)) {
        console.log('- Run: npm run seed:fixtures')
      }
      
      if (this.results.some(r => r.test === 'Therapists API' && !r.success)) {
        console.log('- Start server: npm run dev')
      }
      
      if (this.results.some(r => r.test === 'Fixture Mode' && !r.success)) {
        console.log('- Set environment: export FIXTURE_MODE=true')
      }
      
      console.log('- Check the failed tests above for specific issues')
    }
  }
}

// Run validation
async function main() {
  const validator = new PartASetupValidator()
  await validator.runValidation()
}

if (require.main === module) {
  main().catch(console.error)
}

export { PartASetupValidator }

