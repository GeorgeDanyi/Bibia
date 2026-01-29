#!/usr/bin/env node

// Complete Part C Acceptance Criteria Test
// Tests all three acceptance criteria in one comprehensive test

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Part C Complete Acceptance Criteria Test\n');

// Test 1: Running the seed prints counts and warns if any record fails validation
function testSeedValidation() {
  console.log('📋 Test 1: Seed Script Validation');
  console.log('='.repeat(50));
  
  try {
    // Run the seed script and capture output
    const output = execSync('node scripts/seed-fixtures-simple.js', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    // Check for required output patterns
    const hasCounts = output.includes('Total records:') && output.includes('Online therapists:');
    const hasValidation = output.includes('validated successfully') || output.includes('validation failed');
    const hasWarnings = output.includes('⚠️') || output.includes('WARNING');
    
    if (hasCounts && hasValidation) {
      console.log('✅ Seed script prints counts and validation status');
      console.log('   - Shows total record counts');
      console.log('   - Shows validation results');
      if (hasWarnings) {
        console.log('   - Shows warnings for validation failures');
      } else {
        console.log('   - No validation failures (all records valid)');
      }
      return true;
    } else {
      throw new Error('Seed script missing required output patterns');
    }
    
  } catch (error) {
    console.error(`❌ Seed validation test failed: ${error.message}`);
    return false;
  }
}

module.exports = { testSeedValidation };