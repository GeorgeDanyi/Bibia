#!/usr/bin/env ts-node

// Test script for Part A - Therapist Data Schema, Validation & Fixtures (CZ)
// This script validates the new schema and fixtures

import { readFileSync } from 'fs'
import { join } from 'path'
import { 
  TherapistSchema, 
  validateTherapist, 
  validateTherapistBatch,
  checkDuplicateIds,
  generateValidationReport,
  type Therapist
} from '@/lib/types/therapist-schema'
import { 
  czechTherapistValidator,
  type TherapistValidationResult,
  type BatchValidationResult
} from '@/lib/validation/therapist-schema-validator'

// Test data paths
const FIXTURES_PATH = join(__dirname, '../data/cz-therapist-fixtures.json')
const EXISTING_THERAPISTS_PATH = join(__dirname, '../data/therapists.json')
const EXISTING_FIXTURES_PATH = join(__dirname, '../data/fixtures.json')

interface TestResult {
  testName: string
  success: boolean
  message: string
  details?: any
}

class PartAValidator {
  private results: TestResult[] = []
  
  /**
   * Run all Part A validation tests
   */
  public async runAllTests(): Promise<void> {
    console.log('🧪 Starting Part A Validation Tests...\n')
    
    // Test 1: Schema validation
    await this.testSchemaValidation()
    
    // Test 2: New fixtures validation
    await this.testNewFixturesValidation()
    
    // Test 3: Existing data compatibility
    await this.testExistingDataCompatibility()
    
    // Test 4: Czech-specific business rules
    await this.testCzechBusinessRules()
    
    // Test 5: Geographic validation
    await this.testGeographicValidation()
    
    // Test 6: Duplicate detection
    await this.testDuplicateDetection()
    
    // Test 7: Performance testing
    await this.testPerformance()
    
    // Generate final report
    this.generateFinalReport()
  }
  
  /**
   * Test 1: Schema validation
   */
  private async testSchemaValidation(): Promise<void> {
    console.log('📋 Test 1: Schema Validation')
    
    // Test valid therapist data
    const validTherapist = {
      id: "test_001",
      fullName: "MUDr. Test Test",
      city: "Praha",
      regions: ["Praha"],
      languages: ["cs", "en"],
      yearsExperience: 5,
      pricePerSession: 1000,
      latitude: 50.0755,
      longitude: 14.4378,
      practiceType: "clinic",
      acceptingNew: true,
      specialties: ["Bolesti zad / krku"],
      diagnoses: ["Skolióza"],
      modalities: ["DNS"],
      worksWith: ["sportovci"],
      tags: ["backneck", "sport"]
    }
    
    const result = validateTherapist(validTherapist)
    
    if (result.success) {
      this.addResult("Schema Validation - Valid Data", true, "Valid therapist data passed schema validation")
    } else {
      this.addResult("Schema Validation - Valid Data", false, "Valid therapist data failed schema validation", result.errors)
    }
    
    // Test invalid therapist data
    const invalidTherapist = {
      id: "test_002",
      fullName: "Invalid Name with Numbers 123",
      city: "InvalidCity",
      regions: ["InvalidRegion"],
      languages: ["invalid_lang"],
      yearsExperience: -1,
      pricePerSession: -100,
      latitude: 100, // Outside Czech bounds
      longitude: 200, // Outside Czech bounds
      practiceType: "invalid_type",
      acceptingNew: "not_boolean",
      specialties: [],
      diagnoses: [],
      modalities: [],
      worksWith: [],
      tags: []
    }
    
    const invalidResult = validateTherapist(invalidTherapist)
    
    if (!invalidResult.success) {
      this.addResult("Schema Validation - Invalid Data", true, "Invalid therapist data correctly rejected", invalidResult.errors)
    } else {
      this.addResult("Schema Validation - Invalid Data", false, "Invalid therapist data incorrectly passed validation")
    }
  }
  
  /**
   * Test 2: New fixtures validation
   */
  private async testNewFixturesValidation(): Promise<void> {
    console.log('📋 Test 2: New Fixtures Validation')
    
    try {
      const fixturesData = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'))
      const validation = validateTherapistBatch(fixturesData)
      
      if (validation.valid.length === fixturesData.length) {
        this.addResult("New Fixtures Validation", true, `All ${fixturesData.length} fixtures passed validation`)
      } else {
        this.addResult("New Fixtures Validation", false, 
          `${validation.invalid.length} fixtures failed validation`, 
          validation.invalid
        )
      }
      
      // Test Czech validator
      const czechValidation = czechTherapistValidator.validateTherapistRecords(fixturesData)
      
      if (czechValidation.valid.length === fixturesData.length) {
        this.addResult("Czech Validator - New Fixtures", true, "All fixtures passed Czech-specific validation")
      } else {
        this.addResult("Czech Validator - New Fixtures", false, 
          `${czechValidation.invalid.length} fixtures failed Czech validation`,
          czechValidation.invalid
        )
      }
      
    } catch (error) {
      this.addResult("New Fixtures Validation", false, "Failed to load fixtures", error)
    }
  }
  
  /**
   * Test 3: Existing data compatibility
   */
  private async testExistingDataCompatibility(): Promise<void> {
    console.log('📋 Test 3: Existing Data Compatibility')
    
    try {
      // Test existing therapists.json
      const existingTherapists = JSON.parse(readFileSync(EXISTING_THERAPISTS_PATH, 'utf8'))
      const validation = validateTherapistBatch(existingTherapists)
      
      this.addResult("Existing Therapists Compatibility", true, 
        `${validation.valid.length}/${existingTherapists.length} existing therapists compatible with new schema`,
        { valid: validation.valid.length, invalid: validation.invalid.length }
      )
      
      // Test existing fixtures.json
      const existingFixtures = JSON.parse(readFileSync(EXISTING_FIXTURES_PATH, 'utf8'))
      const fixturesValidation = validateTherapistBatch(existingFixtures)
      
      this.addResult("Existing Fixtures Compatibility", true,
        `${fixturesValidation.valid.length}/${existingFixtures.length} existing fixtures compatible with new schema`,
        { valid: fixturesValidation.valid.length, invalid: fixturesValidation.invalid.length }
      )
      
    } catch (error) {
      this.addResult("Existing Data Compatibility", false, "Failed to load existing data", error)
    }
  }
  
  /**
   * Test 4: Czech-specific business rules
   */
  private async testCzechBusinessRules(): Promise<void> {
    console.log('📋 Test 4: Czech-Specific Business Rules')
    
    // Test therapist without Czech language
    const noCzechTherapist = {
      id: "test_no_czech",
      fullName: "Dr. No Czech",
      city: "Praha",
      regions: ["Praha"],
      languages: ["en", "de"], // No Czech
      yearsExperience: 5,
      pricePerSession: 1000,
      latitude: 50.0755,
      longitude: 14.4378,
      practiceType: "clinic",
      acceptingNew: true,
      specialties: ["Bolesti zad / krku"],
      diagnoses: [],
      modalities: [],
      worksWith: [],
      tags: ["backneck"]
    }
    
    const result = czechTherapistValidator.validateTherapistRecord(noCzechTherapist)
    
    if (result.success && result.warnings?.some(w => w.includes("Czech"))) {
      this.addResult("Czech Business Rules - Language Warning", true, "Correctly warned about missing Czech language")
    } else {
      this.addResult("Czech Business Rules - Language Warning", false, "Failed to warn about missing Czech language")
    }
    
    // Test unrealistic pricing
    const unrealisticPricing = {
      id: "test_unrealistic_price",
      fullName: "Dr. Unrealistic Price",
      city: "Praha",
      regions: ["Praha"],
      languages: ["cs"],
      yearsExperience: 2,
      pricePerSession: 5000, // Unrealistically high
      latitude: 50.0755,
      longitude: 14.4378,
      practiceType: "clinic",
      acceptingNew: true,
      specialties: ["Bolesti zad / krku"],
      diagnoses: [],
      modalities: [],
      worksWith: [],
      tags: ["backneck"]
    }
    
    const priceResult = czechTherapistValidator.validateTherapistRecord(unrealisticPricing)
    
    if (priceResult.success && priceResult.warnings?.some(w => w.includes("high"))) {
      this.addResult("Czech Business Rules - Pricing Warning", true, "Correctly warned about unrealistic pricing")
    } else {
      this.addResult("Czech Business Rules - Pricing Warning", false, "Failed to warn about unrealistic pricing")
    }
  }
  
  /**
   * Test 5: Geographic validation
   */
  private async testGeographicValidation(): Promise<void> {
    console.log('📋 Test 5: Geographic Validation')
    
    // Test coordinates outside Czech Republic
    const outsideCzech = {
      id: "test_outside_cz",
      fullName: "Dr. Outside Czech",
      city: "Praha",
      regions: ["Praha"],
      languages: ["cs"],
      yearsExperience: 5,
      pricePerSession: 1000,
      latitude: 60.0, // Outside Czech bounds
      longitude: 20.0, // Outside Czech bounds
      practiceType: "clinic",
      acceptingNew: true,
      specialties: ["Bolesti zad / krku"],
      diagnoses: [],
      modalities: [],
      worksWith: [],
      tags: ["backneck"]
    }
    
    const result = validateTherapist(outsideCzech)
    
    if (!result.success && result.errors?.some(e => e.includes("bounds"))) {
      this.addResult("Geographic Validation - Outside Bounds", true, "Correctly rejected coordinates outside Czech Republic")
    } else {
      this.addResult("Geographic Validation - Outside Bounds", false, "Failed to reject coordinates outside Czech Republic")
    }
    
    // Test valid coordinates
    const validCoords = {
      id: "test_valid_coords",
      fullName: "Dr. Valid Coords",
      city: "Praha",
      regions: ["Praha"],
      languages: ["cs"],
      yearsExperience: 5,
      pricePerSession: 1000,
      latitude: 50.0755, // Valid Prague coordinates
      longitude: 14.4378, // Valid Prague coordinates
      practiceType: "clinic",
      acceptingNew: true,
      specialties: ["Bolesti zad / krku"],
      diagnoses: [],
      modalities: [],
      worksWith: [],
      tags: ["backneck"]
    }
    
    const validResult = validateTherapist(validCoords)
    
    if (validResult.success) {
      this.addResult("Geographic Validation - Valid Coordinates", true, "Correctly accepted valid Czech coordinates")
    } else {
      this.addResult("Geographic Validation - Valid Coordinates", false, "Incorrectly rejected valid Czech coordinates")
    }
  }
  
  /**
   * Test 6: Duplicate detection
   */
  private async testDuplicateDetection(): Promise<void> {
    console.log('📋 Test 6: Duplicate Detection')
    
    const therapistsWithDuplicates = [
      {
        id: "duplicate_001",
        fullName: "Dr. First",
        city: "Praha",
        regions: ["Praha"],
        languages: ["cs"],
        yearsExperience: 5,
        pricePerSession: 1000,
        latitude: 50.0755,
        longitude: 14.4378,
        practiceType: "clinic",
        acceptingNew: true,
        specialties: ["Bolesti zad / krku"],
        diagnoses: [],
        modalities: [],
        worksWith: [],
        tags: ["backneck"]
      },
      {
        id: "duplicate_001", // Same ID
        fullName: "Dr. Second",
        city: "Brno",
        regions: ["Jihomoravský"],
        languages: ["cs"],
        yearsExperience: 3,
        pricePerSession: 800,
        latitude: 49.1951,
        longitude: 16.6068,
        practiceType: "clinic",
        acceptingNew: true,
        specialties: ["Bolesti zad / krku"],
        diagnoses: [],
        modalities: [],
        worksWith: [],
        tags: ["backneck"]
      }
    ]
    
    const validation = validateTherapistBatch(therapistsWithDuplicates)
    const duplicateCheck = checkDuplicateIds(validation.valid)
    
    if (duplicateCheck.duplicates.length > 0) {
      this.addResult("Duplicate Detection", true, `Correctly detected ${duplicateCheck.duplicates.length} duplicate(s)`)
    } else {
      this.addResult("Duplicate Detection", false, "Failed to detect duplicates")
    }
  }
  
  /**
   * Test 7: Performance testing
   */
  private async testPerformance(): Promise<void> {
    console.log('📋 Test 7: Performance Testing')
    
    try {
      const fixturesData = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'))
      
      // Test batch validation performance
      const startTime = Date.now()
      const validation = validateTherapistBatch(fixturesData)
      const endTime = Date.now()
      
      const duration = endTime - startTime
      const recordsPerSecond = Math.round((fixturesData.length / duration) * 1000)
      
      if (duration < 1000) { // Less than 1 second
        this.addResult("Performance Testing", true, 
          `Validated ${fixturesData.length} records in ${duration}ms (${recordsPerSecond} records/sec)`)
      } else {
        this.addResult("Performance Testing", false, 
          `Validation took too long: ${duration}ms for ${fixturesData.length} records`)
      }
      
    } catch (error) {
      this.addResult("Performance Testing", false, "Performance test failed", error)
    }
  }
  
  /**
   * Add test result
   */
  private addResult(testName: string, success: boolean, message: string, details?: any): void {
    this.results.push({ testName, success, message, details })
    console.log(`  ${success ? '✅' : '❌'} ${testName}: ${message}`)
  }
  
  /**
   * Generate final report
   */
  private generateFinalReport(): void {
    console.log('\n📊 Final Test Report')
    console.log('=' .repeat(50))
    
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
          console.log(`  - ${r.testName}: ${r.message}`)
          if (r.details) {
            console.log(`    Details: ${JSON.stringify(r.details, null, 2)}`)
          }
        })
    }
    
    console.log('\n🎯 Part A Implementation Status:')
    if (failedTests === 0) {
      console.log('✅ All tests passed! Part A implementation is complete and working correctly.')
    } else {
      console.log('⚠️  Some tests failed. Please review and fix the issues above.')
    }
  }
}

// Run the tests
async function main() {
  const validator = new PartAValidator()
  await validator.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { PartAValidator }
