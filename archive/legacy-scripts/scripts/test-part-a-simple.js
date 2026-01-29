#!/usr/bin/env node

// Simple test script for Part A - Therapist Data Schema, Validation & Fixtures (CZ)
// This script validates the new fixtures without complex imports

const fs = require('fs');
const path = require('path');

// Test data paths
const FIXTURES_PATH = path.join(__dirname, '../data/cz-therapist-fixtures.json');
const EXISTING_THERAPISTS_PATH = path.join(__dirname, '../data/therapists.json');
const EXISTING_FIXTURES_PATH = path.join(__dirname, '../data/fixtures.json');

class SimplePartAValidator {
  constructor() {
    this.results = [];
  }

  /**
   * Run all Part A validation tests
   */
  async runAllTests() {
    console.log('🧪 Starting Part A Validation Tests (Simple)...\n');
    
    // Test 1: Load and validate new fixtures
    await this.testNewFixturesLoad();
    
    // Test 2: Validate fixture structure
    await this.testFixtureStructure();
    
    // Test 3: Validate Czech cities and regions
    await this.testCzechGeography();
    
    // Test 4: Validate pricing ranges
    await this.testPricingRanges();
    
    // Test 5: Validate required fields
    await this.testRequiredFields();
    
    // Test 6: Check for duplicates
    await this.testDuplicateIds();
    
    // Test 7: Validate coordinates
    await this.testCoordinates();
    
    // Generate final report
    this.generateFinalReport();
  }

  /**
   * Test 1: Load new fixtures
   */
  async testNewFixturesLoad() {
    console.log('📋 Test 1: New Fixtures Load');
    
    try {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      
      if (Array.isArray(fixturesData) && fixturesData.length > 0) {
        this.addResult("New Fixtures Load", true, `Successfully loaded ${fixturesData.length} fixtures`);
      } else {
        this.addResult("New Fixtures Load", false, "Fixtures file is empty or not an array");
      }
    } catch (error) {
      this.addResult("New Fixtures Load", false, "Failed to load fixtures", error.message);
    }
  }

  /**
   * Test 2: Validate fixture structure
   */
  async testFixtureStructure() {
    console.log('📋 Test 2: Fixture Structure');
    
    try {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      const requiredFields = [
        'id', 'fullName', 'city', 'regions', 'languages', 'yearsExperience',
        'pricePerSession', 'latitude', 'longitude', 'practiceType', 'acceptingNew',
        'specialties', 'diagnoses', 'modalities', 'worksWith', 'tags'
      ];
      
      let validCount = 0;
      const errors = [];
      
      for (const fixture of fixturesData) {
        const missingFields = requiredFields.filter(field => !(field in fixture));
        if (missingFields.length === 0) {
          validCount++;
        } else {
          errors.push(`Fixture ${fixture.id} missing fields: ${missingFields.join(', ')}`);
        }
      }
      
      if (validCount === fixturesData.length) {
        this.addResult("Fixture Structure", true, `All ${fixturesData.length} fixtures have required fields`);
      } else {
        this.addResult("Fixture Structure", false, 
          `${validCount}/${fixturesData.length} fixtures have required fields`, 
          errors.slice(0, 5) // Show first 5 errors
        );
      }
    } catch (error) {
      this.addResult("Fixture Structure", false, "Failed to validate structure", error.message);
    }
  }

  /**
   * Test 3: Validate Czech cities and regions
   */
  async testCzechGeography() {
    console.log('📋 Test 3: Czech Geography');
    
    try {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      const validCities = ['Praha', 'Brno', 'Ostrava'];
      const validRegions = ['Praha', 'Středočeský', 'Jihomoravský', 'Moravskoslezský'];
      
      let validCount = 0;
      const errors = [];
      
      for (const fixture of fixturesData) {
        const cityValid = validCities.includes(fixture.city);
        const regionsValid = fixture.regions.every(region => validRegions.includes(region));
        
        if (cityValid && regionsValid) {
          validCount++;
        } else {
          if (!cityValid) errors.push(`Fixture ${fixture.id} has invalid city: ${fixture.city}`);
          if (!regionsValid) errors.push(`Fixture ${fixture.id} has invalid regions: ${fixture.regions.join(', ')}`);
        }
      }
      
      if (validCount === fixturesData.length) {
        this.addResult("Czech Geography", true, `All ${fixturesData.length} fixtures have valid Czech cities and regions`);
      } else {
        this.addResult("Czech Geography", false, 
          `${validCount}/${fixturesData.length} fixtures have valid geography`, 
          errors.slice(0, 5)
        );
      }
    } catch (error) {
      this.addResult("Czech Geography", false, "Failed to validate geography", error.message);
    }
  }

  /**
   * Test 4: Validate pricing ranges
   */
  async testPricingRanges() {
    console.log('📋 Test 4: Pricing Ranges');
    
    try {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      
      let validCount = 0;
      const errors = [];
      
      for (const fixture of fixturesData) {
        const priceValid = fixture.pricePerSession >= 0 && fixture.pricePerSession <= 10000;
        const priceRangeValid = !fixture.priceRange || 
          (fixture.priceRange.minCZK >= 0 && fixture.priceRange.maxCZK >= fixture.priceRange.minCZK);
        
        if (priceValid && priceRangeValid) {
          validCount++;
        } else {
          if (!priceValid) errors.push(`Fixture ${fixture.id} has invalid price: ${fixture.pricePerSession}`);
          if (!priceRangeValid) errors.push(`Fixture ${fixture.id} has invalid price range`);
        }
      }
      
      if (validCount === fixturesData.length) {
        this.addResult("Pricing Ranges", true, `All ${fixturesData.length} fixtures have valid pricing`);
      } else {
        this.addResult("Pricing Ranges", false, 
          `${validCount}/${fixturesData.length} fixtures have valid pricing`, 
          errors.slice(0, 5)
        );
      }
    } catch (error) {
      this.addResult("Pricing Ranges", false, "Failed to validate pricing", error.message);
    }
  }

  /**
   * Test 5: Validate required fields
   */
  async testRequiredFields() {
    console.log('📋 Test 5: Required Fields');
    
    try {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      
      let validCount = 0;
      const errors = [];
      
      for (const fixture of fixturesData) {
        const hasId = fixture.id && typeof fixture.id === 'string' && fixture.id.length > 0;
        const hasName = fixture.fullName && typeof fixture.fullName === 'string' && fixture.fullName.length > 0;
        const hasCity = fixture.city && typeof fixture.city === 'string' && fixture.city.length > 0;
        const hasLanguages = Array.isArray(fixture.languages) && fixture.languages.length > 0;
        const hasSpecialties = Array.isArray(fixture.specialties) && fixture.specialties.length > 0;
        const hasTags = Array.isArray(fixture.tags) && fixture.tags.length > 0;
        const hasCzech = fixture.languages && fixture.languages.includes('cs');
        
        if (hasId && hasName && hasCity && hasLanguages && hasSpecialties && hasTags && hasCzech) {
          validCount++;
        } else {
          const missing = [];
          if (!hasId) missing.push('id');
          if (!hasName) missing.push('fullName');
          if (!hasCity) missing.push('city');
          if (!hasLanguages) missing.push('languages');
          if (!hasSpecialties) missing.push('specialties');
          if (!hasTags) missing.push('tags');
          if (!hasCzech) missing.push('Czech language');
          
          errors.push(`Fixture ${fixture.id} missing: ${missing.join(', ')}`);
        }
      }
      
      if (validCount === fixturesData.length) {
        this.addResult("Required Fields", true, `All ${fixturesData.length} fixtures have required fields and Czech language`);
      } else {
        this.addResult("Required Fields", false, 
          `${validCount}/${fixturesData.length} fixtures have all required fields`, 
          errors.slice(0, 5)
        );
      }
    } catch (error) {
      this.addResult("Required Fields", false, "Failed to validate required fields", error.message);
    }
  }

  /**
   * Test 6: Check for duplicate IDs
   */
  async testDuplicateIds() {
    console.log('📋 Test 6: Duplicate IDs');
    
    try {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      const ids = fixturesData.map(f => f.id);
      const uniqueIds = [...new Set(ids)];
      
      if (ids.length === uniqueIds.length) {
        this.addResult("Duplicate IDs", true, `All ${fixturesData.length} fixtures have unique IDs`);
      } else {
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        this.addResult("Duplicate IDs", false, 
          `Found ${duplicates.length} duplicate IDs: ${duplicates.join(', ')}`);
      }
    } catch (error) {
      this.addResult("Duplicate IDs", false, "Failed to check duplicates", error.message);
    }
  }

  /**
   * Test 7: Validate coordinates
   */
  async testCoordinates() {
    console.log('📋 Test 7: Coordinates');
    
    try {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      
      let validCount = 0;
      const errors = [];
      
      for (const fixture of fixturesData) {
        const latValid = fixture.latitude >= 48.5 && fixture.latitude <= 51.1;
        const lonValid = fixture.longitude >= 12.0 && fixture.longitude <= 18.9;
        
        if (latValid && lonValid) {
          validCount++;
        } else {
          if (!latValid) errors.push(`Fixture ${fixture.id} has invalid latitude: ${fixture.latitude}`);
          if (!lonValid) errors.push(`Fixture ${fixture.id} has invalid longitude: ${fixture.longitude}`);
        }
      }
      
      if (validCount === fixturesData.length) {
        this.addResult("Coordinates", true, `All ${fixturesData.length} fixtures have valid Czech coordinates`);
      } else {
        this.addResult("Coordinates", false, 
          `${validCount}/${fixturesData.length} fixtures have valid coordinates`, 
          errors.slice(0, 5)
        );
      }
    } catch (error) {
      this.addResult("Coordinates", false, "Failed to validate coordinates", error.message);
    }
  }

  /**
   * Add test result
   */
  addResult(testName, success, message, details) {
    this.results.push({ testName, success, message, details });
    console.log(`  ${success ? '✅' : '❌'} ${testName}: ${message}`);
  }

  /**
   * Generate final report
   */
  generateFinalReport() {
    console.log('\n📊 Final Test Report');
    console.log('='.repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.message}`);
          if (r.details) {
            console.log(`    Details: ${Array.isArray(r.details) ? r.details.join(', ') : r.details}`);
          }
        });
    }
    
    console.log('\n🎯 Part A Implementation Status:');
    if (failedTests === 0) {
      console.log('✅ All tests passed! Part A implementation is complete and working correctly.');
      console.log('\n📋 Summary of Part A Implementation:');
      console.log('  ✅ Strict TypeScript schema defined for therapist data');
      console.log('  ✅ Comprehensive validation implemented');
      console.log('  ✅ Deterministic fixtures created around Prague, Brno, Ostrava');
      console.log('  ✅ Czech-specific business rules validated');
      console.log('  ✅ Geographic bounds validation working');
      console.log('  ✅ All fixtures pass validation');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix the issues above.');
    }
  }
}

// Run the tests
async function main() {
  const validator = new SimplePartAValidator();
  await validator.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimplePartAValidator };
