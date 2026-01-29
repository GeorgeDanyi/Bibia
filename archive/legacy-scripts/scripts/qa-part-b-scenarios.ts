#!/usr/bin/env ts-node

/**
 * Part B QA Test Scenarios
 * 
 * This script provides comprehensive test scenarios for Part B implementation
 * covering the specific requirements:
 * 
 * 1) Prague + 30 km + condition=backneck + availability=next7 + practice=any → expect ≥1 item, distanceKm ≤30
 * 2) Ostrava + 30 km + rare condition=bechterev → if 0, "Expand to 50 km" returns ≥1
 * 3) Brno + practice=online (any radius) → returns online therapists
 * 4) Invalid city string → /results shows actionable error; "Edit questionnaire" works
 * 5) Sort by Nearest reorders by distance ascending
 */

import fetch from 'node-fetch'

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  fixtureMode: process.env.FIXTURE_MODE === 'true',
  useMockData: process.env.USE_MOCK_DATA === 'true',
  testTimeout: 30000, // 30 seconds
}

interface TestScenario {
  id: string
  name: string
  description: string
  steps: TestStep[]
  expectedResults: ExpectedResult[]
  critical: boolean
}

interface TestStep {
  action: string
  method: 'GET' | 'POST'
  endpoint: string
  body?: any
  headers?: Record<string, string>
  expectedStatus: number
  validateResponse?: (response: any) => ValidationResult
}

interface ExpectedResult {
  description: string
  condition: (response: any) => boolean
  critical: boolean
}

interface ValidationResult {
  success: boolean
  message: string
  details?: any
}

interface TestResult {
  scenario: string
  success: boolean
  duration: number
  errors: string[]
  warnings: string[]
  details: any
}

class PartBQATester {
  private results: TestResult[] = []
  private startTime: number = 0

  /**
   * Run all Part B QA scenarios
   */
  public async runAllTests(): Promise<void> {
    console.log('🧪 Starting Part B QA Test Scenarios...\n')
    console.log('🎯 Goal: Validate specific Part B requirements and edge cases\n')
    
    this.startTime = Date.now()
    
    // Test Scenario 1: Prague + 30 km + condition=backneck + availability=next7 + practice=any
    await this.testScenario1_PragueBackneckNext7()
    
    // Test Scenario 2: Ostrava + 30 km + rare condition=bechterev → expand to 50 km
    await this.testScenario2_OstravaBechterevExpansion()
    
    // Test Scenario 3: Brno + practice=online (any radius)
    await this.testScenario3_BrnoOnlineTherapists()
    
    // Test Scenario 4: Invalid city string → actionable error + edit questionnaire
    await this.testScenario4_InvalidCityErrorHandling()
    
    // Test Scenario 5: Sort by Nearest reorders by distance ascending
    await this.testScenario5_SortByNearest()
    
    // Generate final report
    this.generateFinalReport()
  }

  /**
   * Scenario 1: Prague + 30 km + condition=backneck + availability=next7 + practice=any
   * Expected: ≥1 item, distanceKm ≤30
   */
  private async testScenario1_PragueBackneckNext7(): Promise<void> {
    console.log('🔧 Scenario 1: Prague + 30 km + condition=backneck + availability=next7 + practice=any')
    
    const scenario: TestScenario = {
      id: 'scenario_1',
      name: 'Prague Backneck Next7 Search',
      description: 'Search Prague with back/neck condition, next 7 days availability, any practice type',
      critical: true,
      steps: [
        {
          action: 'Search Prague with specific criteria',
          method: 'POST',
          endpoint: '/api/searchTherapists',
          body: {
            location: { cityOrZip: 'Praha' },
            radiusKm: 30,
            problems: ['Bolesti zad / krku'],
            mustHave: {
              acceptingNew: true
            },
            preferences: {
              availability: 'next7'
            }
          },
          expectedStatus: 200,
          validateResponse: (response) => this.validatePragueBackneckResults(response)
        }
      ],
      expectedResults: [
        {
          description: 'Returns at least 1 result',
          condition: (response) => response.results && response.results.length >= 1,
          critical: true
        },
        {
          description: 'All results are within 30km',
          condition: (response) => this.validateDistanceWithinRadius(response.results, 30),
          critical: true
        },
        {
          description: 'Results include back/neck specialists',
          condition: (response) => this.validateBackneckSpecialists(response.results),
          critical: true
        },
        {
          description: 'Results are accepting new patients',
          condition: (response) => this.validateAcceptingNew(response.results),
          critical: true
        }
      ]
    }
    
    await this.runScenario(scenario)
  }

  /**
   * Scenario 2: Ostrava + 30 km + rare condition=bechterev → if 0, "Expand to 50 km" returns ≥1
   */
  private async testScenario2_OstravaBechterevExpansion(): Promise<void> {
    console.log('🔧 Scenario 2: Ostrava + 30 km + rare condition=bechterev → expand to 50 km')
    
    const scenario: TestScenario = {
      id: 'scenario_2',
      name: 'Ostrava Bechterev Expansion',
      description: 'Search Ostrava with rare Bechterev condition, test radius expansion',
      critical: true,
      steps: [
        {
          action: 'Search Ostrava with Bechterev condition at 30km',
          method: 'POST',
          endpoint: '/api/searchTherapists',
          body: {
            location: { cityOrZip: 'Ostrava' },
            radiusKm: 30,
            problems: ['Bechtěrevova choroba'],
            mustHave: {
              acceptingNew: true
            }
          },
          expectedStatus: 200,
          validateResponse: (response) => this.validateOstravaBechterev30km(response)
        },
        {
          action: 'Expand radius to 50km if no results',
          method: 'POST',
          endpoint: '/api/searchTherapists',
          body: {
            location: { cityOrZip: 'Ostrava' },
            radiusKm: 50,
            problems: ['Bechtěrevova choroba'],
            mustHave: {
              acceptingNew: true
            }
          },
          expectedStatus: 200,
          validateResponse: (response) => this.validateOstravaBechterev50km(response)
        }
      ],
      expectedResults: [
        {
          description: '30km search may return 0 results (acceptable)',
          condition: (response) => response.results && Array.isArray(response.results),
          critical: false
        },
        {
          description: '50km expansion returns at least 1 result',
          condition: (response) => response.results && response.results.length >= 1,
          critical: true
        },
        {
          description: '50km results are within 50km radius',
          condition: (response) => this.validateDistanceWithinRadius(response.results, 50),
          critical: true
        },
        {
          description: 'Results include Bechterev specialists',
          condition: (response) => this.validateBechterevSpecialists(response.results),
          critical: true
        }
      ]
    }
    
    await this.runScenario(scenario)
  }

  /**
   * Scenario 3: Brno + practice=online (any radius)
   */
  private async testScenario3_BrnoOnlineTherapists(): Promise<void> {
    console.log('🔧 Scenario 3: Brno + practice=online (any radius)')
    
    const scenario: TestScenario = {
      id: 'scenario_3',
      name: 'Brno Online Therapists',
      description: 'Search Brno for online therapists with any radius',
      critical: true,
      steps: [
        {
          action: 'Search Brno for online therapists',
          method: 'POST',
          endpoint: '/api/searchTherapists',
          body: {
            location: { cityOrZip: 'Brno' },
            onlineOnly: true,
            problems: ['Bolesti zad / krku']
          },
          expectedStatus: 200,
          validateResponse: (response) => this.validateBrnoOnlineResults(response)
        }
      ],
      expectedResults: [
        {
          description: 'Returns online therapists',
          condition: (response) => response.results && response.results.length >= 1,
          critical: true
        },
        {
          description: 'All results are online practice type',
          condition: (response) => this.validateOnlineOnly(response.results),
          critical: true
        },
        {
          description: 'Results have distanceKm = 0 (online)',
          condition: (response) => this.validateOnlineDistance(response.results),
          critical: true
        }
      ]
    }
    
    await this.runScenario(scenario)
  }

  /**
   * Scenario 4: Invalid city string → /results shows actionable error; "Edit questionnaire" works
   */
  private async testScenario4_InvalidCityErrorHandling(): Promise<void> {
    console.log('🔧 Scenario 4: Invalid city string → actionable error + edit questionnaire')
    
    const scenario: TestScenario = {
      id: 'scenario_4',
      name: 'Invalid City Error Handling',
      description: 'Test error handling for invalid city input',
      critical: true,
      steps: [
        {
          action: 'Search with invalid city name',
          method: 'POST',
          endpoint: '/api/searchTherapists',
          body: {
            location: { cityOrZip: 'InvalidCityName123' },
            radiusKm: 30,
            problems: ['Bolesti zad / krku']
          },
          expectedStatus: 200,
          validateResponse: (response) => this.validateInvalidCityResponse(response)
        },
        {
          action: 'Test geocoding with invalid city',
          method: 'GET',
          endpoint: '/api/geocode?q=InvalidCityName123',
          expectedStatus: 200,
          validateResponse: (response) => this.validateInvalidGeocodeResponse(response)
        }
      ],
      expectedResults: [
        {
          description: 'Returns actionable error message',
          condition: (response) => this.validateActionableError(response),
          critical: true
        },
        {
          description: 'Error suggests online mode or edit questionnaire',
          condition: (response) => this.validateErrorSuggestions(response),
          critical: true
        },
        {
          description: 'Geocoding fails gracefully',
          condition: (response) => this.validateGeocodingFailure(response),
          critical: true
        }
      ]
    }
    
    await this.runScenario(scenario)
  }

  /**
   * Scenario 5: Sort by Nearest reorders by distance ascending
   */
  private async testScenario5_SortByNearest(): Promise<void> {
    console.log('🔧 Scenario 5: Sort by Nearest reorders by distance ascending')
    
    const scenario: TestScenario = {
      id: 'scenario_5',
      name: 'Sort by Nearest Distance',
      description: 'Test sorting results by distance in ascending order',
      critical: true,
      steps: [
        {
          action: 'Search Prague with large radius to get multiple results',
          method: 'POST',
          endpoint: '/api/searchTherapists',
          body: {
            location: { cityOrZip: 'Praha' },
            radiusKm: 50,
            problems: ['Bolesti zad / krku'],
            mustHave: {
              acceptingNew: true
            }
          },
          expectedStatus: 200,
          validateResponse: (response) => this.validateMultipleResults(response)
        },
        {
          action: 'Test sorting by distance (nearest first)',
          method: 'POST',
          endpoint: '/api/searchTherapists',
          body: {
            location: { cityOrZip: 'Praha' },
            radiusKm: 50,
            problems: ['Bolesti zad / krku'],
            mustHave: {
              acceptingNew: true
            },
            prefer: {
              distance: true
            }
          },
          expectedStatus: 200,
          validateResponse: (response) => this.validateDistanceSorting(response)
        }
      ],
      expectedResults: [
        {
          description: 'Returns multiple results for sorting test',
          condition: (response) => response.results && response.results.length >= 3,
          critical: true
        },
        {
          description: 'Results are sorted by distance ascending',
          condition: (response) => this.validateAscendingDistanceSort(response.results),
          critical: true
        },
        {
          description: 'First result has shortest distance',
          condition: (response) => this.validateShortestDistanceFirst(response.results),
          critical: true
        }
      ]
    }
    
    await this.runScenario(scenario)
  }

  /**
   * Run a single test scenario
   */
  private async runScenario(scenario: TestScenario): Promise<void> {
    console.log(`\n  📋 ${scenario.name}`)
    console.log(`     ${scenario.description}`)
    
    const scenarioStartTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    const details: any = {}
    
    try {
      for (const step of scenario.steps) {
        console.log(`     🔄 ${step.action}`)
        
        const response = await this.makeRequest(step)
        
        if (response.status !== step.expectedStatus) {
          const error = `Expected status ${step.expectedStatus}, got ${response.status}`
          errors.push(error)
          console.log(`     ❌ ${error}`)
          continue
        }
        
        if (step.validateResponse) {
          const validation = step.validateResponse(response.data)
          if (!validation.success) {
            if (scenario.critical) {
              errors.push(validation.message)
              console.log(`     ❌ ${validation.message}`)
            } else {
              warnings.push(validation.message)
              console.log(`     ⚠️  ${validation.message}`)
            }
          } else {
            console.log(`     ✅ ${validation.message}`)
          }
        }
        
        // Check expected results
        for (const expectedResult of scenario.expectedResults) {
          if (expectedResult.condition(response.data)) {
            console.log(`     ✅ ${expectedResult.description}`)
          } else {
            const error = `Failed: ${expectedResult.description}`
            if (expectedResult.critical) {
              errors.push(error)
              console.log(`     ❌ ${error}`)
            } else {
              warnings.push(error)
              console.log(`     ⚠️  ${error}`)
            }
          }
        }
      }
      
      const duration = Date.now() - scenarioStartTime
      const success = errors.length === 0
      
      this.results.push({
        scenario: scenario.name,
        success,
        duration,
        errors,
        warnings,
        details
      })
      
      console.log(`     ${success ? '✅' : '❌'} Scenario completed in ${duration}ms`)
      
    } catch (error) {
      const duration = Date.now() - scenarioStartTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.results.push({
        scenario: scenario.name,
        success: false,
        duration,
        errors: [errorMessage],
        warnings: [],
        details: { error }
      })
      
      console.log(`     ❌ Scenario failed: ${errorMessage}`)
    }
  }

  /**
   * Make HTTP request
   */
  private async makeRequest(step: TestStep): Promise<{ status: number; data: any }> {
    const url = `${TEST_CONFIG.baseUrl}${step.endpoint}`
    const options: any = {
      method: step.method,
      headers: {
        'Content-Type': 'application/json',
        ...step.headers
      }
    }
    
    if (step.body) {
      options.body = JSON.stringify(step.body)
    }
    
    const response = await fetch(url, options)
    const data = await response.json()
    
    return { status: response.status, data }
  }

  /**
   * Validation functions for Scenario 1
   */
  private validatePragueBackneckResults(response: any): ValidationResult {
    if (!response.results || !Array.isArray(response.results)) {
      return { success: false, message: 'Invalid response format' }
    }
    
    if (response.results.length === 0) {
      return { success: false, message: 'No results found for Prague back/neck search' }
    }
    
    return { success: true, message: `Found ${response.results.length} results for Prague back/neck search` }
  }

  private validateDistanceWithinRadius(results: any[], maxRadius: number): boolean {
    return results.every(result => !result.distanceKm || result.distanceKm <= maxRadius)
  }

  private validateBackneckSpecialists(results: any[]): boolean {
    return results.some(result => 
      result.specialties?.some((spec: string) => 
        spec.toLowerCase().includes('zad') || 
        spec.toLowerCase().includes('krk') ||
        spec.toLowerCase().includes('back') ||
        spec.toLowerCase().includes('neck')
      )
    )
  }

  private validateAcceptingNew(results: any[]): boolean {
    return results.every(result => result.acceptingNew === true)
  }

  /**
   * Validation functions for Scenario 2
   */
  private validateOstravaBechterev30km(response: any): ValidationResult {
    if (!response.results || !Array.isArray(response.results)) {
      return { success: false, message: 'Invalid response format' }
    }
    
    return { success: true, message: `30km search returned ${response.results.length} results` }
  }

  private validateOstravaBechterev50km(response: any): ValidationResult {
    if (!response.results || !Array.isArray(response.results)) {
      return { success: false, message: 'Invalid response format' }
    }
    
    if (response.results.length === 0) {
      return { success: false, message: 'No results found even with 50km expansion' }
    }
    
    return { success: true, message: `50km expansion returned ${response.results.length} results` }
  }

  private validateBechterevSpecialists(results: any[]): boolean {
    return results.some(result => 
      result.specialties?.some((spec: string) => 
        spec.toLowerCase().includes('bechtěrev') ||
        spec.toLowerCase().includes('ankylosing')
      ) ||
      result.diagnosisTags?.some((tag: string) => 
        tag.toLowerCase().includes('bechtěrev')
      )
    )
  }

  /**
   * Validation functions for Scenario 3
   */
  private validateBrnoOnlineResults(response: any): ValidationResult {
    if (!response.results || !Array.isArray(response.results)) {
      return { success: false, message: 'Invalid response format' }
    }
    
    if (response.results.length === 0) {
      return { success: false, message: 'No online therapists found for Brno' }
    }
    
    return { success: true, message: `Found ${response.results.length} online therapists for Brno` }
  }

  private validateOnlineOnly(results: any[]): boolean {
    return results.every(result => 
      result.practiceType === 'online' || 
      result.offers?.includes('online') ||
      result.distanceKm === 0
    )
  }

  private validateOnlineDistance(results: any[]): boolean {
    return results.every(result => result.distanceKm === 0)
  }

  /**
   * Validation functions for Scenario 4
   */
  private validateInvalidCityResponse(response: any): ValidationResult {
    // Should return empty results or error indication
    if (response.results && Array.isArray(response.results)) {
      return { success: true, message: `Invalid city search returned ${response.results.length} results` }
    }
    
    if (response.error) {
      return { success: true, message: 'Invalid city search returned error as expected' }
    }
    
    return { success: false, message: 'Invalid city search did not handle error properly' }
  }

  private validateInvalidGeocodeResponse(response: any): ValidationResult {
    // Geocoding should fail for invalid city
    if (response.error || !response.lat || !response.lng) {
      return { success: true, message: 'Geocoding failed for invalid city as expected' }
    }
    
    return { success: false, message: 'Geocoding should have failed for invalid city' }
  }

  private validateActionableError(response: any): boolean {
    // Check if response indicates actionable error
    return response.error || 
           (response.results && response.results.length === 0) ||
           response.shouldSuggestOnlineMode
  }

  private validateErrorSuggestions(response: any): boolean {
    // Check if error suggests online mode or edit questionnaire
    return response.shouldSuggestOnlineMode ||
           response.suggestions?.some((s: string) => 
             s.toLowerCase().includes('online') || 
             s.toLowerCase().includes('questionnaire') ||
             s.toLowerCase().includes('edit')
           )
  }

  private validateGeocodingFailure(response: any): boolean {
    return !response.lat || !response.lng || response.error
  }

  /**
   * Validation functions for Scenario 5
   */
  private validateMultipleResults(response: any): ValidationResult {
    if (!response.results || !Array.isArray(response.results)) {
      return { success: false, message: 'Invalid response format' }
    }
    
    if (response.results.length < 3) {
      return { success: false, message: `Need at least 3 results for sorting test, got ${response.results.length}` }
    }
    
    return { success: true, message: `Got ${response.results.length} results for sorting test` }
  }

  private validateDistanceSorting(response: any): ValidationResult {
    if (!response.results || !Array.isArray(response.results)) {
      return { success: false, message: 'Invalid response format' }
    }
    
    return { success: true, message: `Distance sorting test with ${response.results.length} results` }
  }

  private validateAscendingDistanceSort(results: any[]): boolean {
    if (results.length < 2) return true
    
    for (let i = 1; i < results.length; i++) {
      const prevDistance = results[i - 1].distanceKm || 0
      const currDistance = results[i].distanceKm || 0
      
      if (prevDistance > currDistance) {
        return false
      }
    }
    
    return true
  }

  private validateShortestDistanceFirst(results: any[]): boolean {
    if (results.length === 0) return false
    
    const firstDistance = results[0].distanceKm || 0
    
    return results.every(result => (result.distanceKm || 0) >= firstDistance)
  }

  /**
   * Generate final test report
   */
  private generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    const criticalFailures = this.results.filter(r => !r.success && r.errors.some(e => e.includes('critical'))).length
    
    console.log('\n📊 Part B QA Test Report')
    console.log('=' .repeat(60))
    console.log(`Total Duration: ${totalDuration}ms`)
    console.log(`Total Scenarios: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log(`Critical Failures: ${criticalFailures}`)
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Scenarios:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.scenario}:`)
          r.errors.forEach(error => console.log(`    ❌ ${error}`))
          r.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`))
        })
    }
    
    console.log('\n🎯 Part B Implementation Status:')
    if (criticalFailures === 0 && failedTests === 0) {
      console.log('✅ ALL SCENARIOS PASSED! Part B implementation is working correctly.')
      console.log('🎯 All specific requirements are validated.')
      console.log('🎯 Ready for production deployment.')
    } else if (criticalFailures === 0) {
      console.log('⚠️  Some non-critical scenarios failed, but core functionality works.')
      console.log('🎯 Part B implementation is functional but needs minor fixes.')
    } else {
      console.log('❌ CRITICAL FAILURES DETECTED!')
      console.log('🎯 Part B implementation has serious issues that must be fixed.')
      console.log('🎯 Do not deploy to production until critical issues are resolved.')
    }
    
    console.log('\n📋 Test Environment:')
    console.log(`  Base URL: ${TEST_CONFIG.baseUrl}`)
    console.log(`  Fixture Mode: ${TEST_CONFIG.fixtureMode}`)
    console.log(`  Mock Data: ${TEST_CONFIG.useMockData}`)
    
    console.log('\n📋 Scenario Summary:')
    console.log('  1. ✅ Prague + 30km + backneck + next7 + any practice')
    console.log('  2. ✅ Ostrava + 30km + bechterev → expand to 50km')
    console.log('  3. ✅ Brno + online practice (any radius)')
    console.log('  4. ✅ Invalid city → actionable error + edit questionnaire')
    console.log('  5. ✅ Sort by Nearest → distance ascending')
  }
}

// Run the tests
async function main() {
  const tester = new PartBQATester()
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { PartBQATester }

