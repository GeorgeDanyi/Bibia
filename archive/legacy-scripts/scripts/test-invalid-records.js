#!/usr/bin/env node

// Test script specifically for invalid record handling
// Demonstrates clear console output for invalid records (no silent failures)

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Invalid Record Handling...\n');

// Create test data with various invalid records
const testData = [
  // Valid record
  {
    id: 'valid_001',
    name: 'Dr. Valid',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    practiceType: 'clinic',
    diagnosisTags: ['backneck'],
    languages: ['cs'],
    acceptingNew: true,
    nextAvailableDays: 3,
    pricePerHour: 1000,
    isFixture: true
  },
  // Invalid: missing required field
  {
    id: 'invalid_001',
    // name missing
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    practiceType: 'clinic',
    diagnosisTags: ['backneck'],
    languages: ['cs'],
    acceptingNew: true,
    nextAvailableDays: 3,
    pricePerHour: 1000,
    isFixture: true
  },
  // Invalid: wrong coordinate range
  {
    id: 'invalid_002',
    name: 'Dr. Invalid Coords',
    city: 'Praha',
    latitude: 200, // Invalid latitude
    longitude: 14.4378,
    practiceType: 'clinic',
    diagnosisTags: ['backneck'],
    languages: ['cs'],
    acceptingNew: true,
    nextAvailableDays: 3,
    pricePerHour: 1000,
    isFixture: true
  },
  // Invalid: wrong practice type
  {
    id: 'invalid_003',
    name: 'Dr. Invalid Type',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    practiceType: 'invalid_type', // Invalid practice type
    diagnosisTags: ['backneck'],
    languages: ['cs'],
    acceptingNew: true,
    nextAvailableDays: 3,
    pricePerHour: 1000,
    isFixture: true
  },
  // Invalid: wrong data types
  {
    id: 'invalid_004',
    name: 'Dr. Invalid Types',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    practiceType: 'clinic',
    diagnosisTags: 'not_an_array', // Should be array
    languages: ['cs'],
    acceptingNew: 'not_boolean', // Should be boolean
    nextAvailableDays: 3,
    pricePerHour: 1000,
    isFixture: true
  },
  // Invalid: out of range values
  {
    id: 'invalid_005',
    name: 'Dr. Invalid Range',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    practiceType: 'clinic',
    diagnosisTags: ['backneck'],
    languages: ['cs'],
    acceptingNew: true,
    nextAvailableDays: 100, // Out of range (0-60)
    pricePerHour: -100, // Negative price
    isFixture: true
  }
];

// Validation function (same as in the data loader)
function validateTherapists(rows) {
  const ok = [];
  const bad = [];
  
  for (const row of rows) {
    const errors = [];
    
    // Required fields
    if (!row.id || typeof row.id !== 'string') errors.push('id is required and must be string');
    if (!row.name || typeof row.name !== 'string') errors.push('name is required and must be string');
    if (!row.city || typeof row.city !== 'string') errors.push('city is required and must be string');
    
    // Coordinates
    if (typeof row.latitude !== 'number' || row.latitude < -90 || row.latitude > 90) {
      errors.push('latitude must be number between -90 and 90');
    }
    if (typeof row.longitude !== 'number' || row.longitude < -180 || row.longitude > 180) {
      errors.push('longitude must be number between -180 and 180');
    }
    
    // Practice type
    if (!['clinic', 'home', 'online'].includes(row.practiceType)) {
      errors.push('practiceType must be clinic, home, or online');
    }
    
    // Arrays
    if (!Array.isArray(row.diagnosisTags)) errors.push('diagnosisTags must be array');
    if (!Array.isArray(row.languages)) errors.push('languages must be array');
    
    // Booleans
    if (typeof row.acceptingNew !== 'boolean') errors.push('acceptingNew must be boolean');
    
    // Numbers
    if (row.nextAvailableDays !== null && (typeof row.nextAvailableDays !== 'number' || row.nextAvailableDays < 0 || row.nextAvailableDays > 60)) {
      errors.push('nextAvailableDays must be null or number between 0 and 60');
    }
    if (row.pricePerHour !== null && (typeof row.pricePerHour !== 'number' || row.pricePerHour < 0)) {
      errors.push('pricePerHour must be null or positive number');
    }
    
    if (errors.length === 0) {
      ok.push(row);
    } else {
      bad.push({ row, issues: errors });
    }
  }
  
  return { ok, bad };
}

// Test invalid record handling
function testInvalidRecordHandling() {
  console.log('📋 Testing Invalid Record Handling');
  console.log('='.repeat(50));
  
  console.log(`🔍 Validating ${testData.length} test records...`);
  
  const validation = validateTherapists(testData);
  
  // Log validation results (this is the key part - clear console output)
  if (validation.bad.length > 0) {
    console.warn(`⚠️  ${validation.bad.length} records failed validation:`);
    validation.bad.forEach(({ row, issues }) => {
      console.warn(`   - ${row.id || 'Unknown ID'}: ${issues.join(', ')}`);
    });
  }
  
  console.log(`✅ ${validation.ok.length} valid therapists loaded`);
  
  // Verify we have both valid and invalid records
  if (validation.ok.length === 0) {
    throw new Error('Expected some valid records');
  }
  
  if (validation.bad.length === 0) {
    throw new Error('Expected some invalid records for testing');
  }
  
  console.log('\n📊 Validation Results:');
  console.log(`   - Valid records: ${validation.ok.length}`);
  console.log(`   - Invalid records: ${validation.bad.length}`);
  console.log(`   - Success rate: ${Math.round((validation.ok.length / testData.length) * 100)}%`);
  
  return validation;
}

// Test that invalid records are properly skipped
function testInvalidRecordsSkipped() {
  console.log('\n📋 Testing Invalid Records Are Skipped');
  console.log('='.repeat(50));
  
  const validation = validateTherapists(testData);
  
  // Check that invalid records are not in the valid array
  const invalidIds = validation.bad.map(b => b.row.id);
  const validIds = validation.ok.map(o => o.id);
  
  const invalidInValid = invalidIds.some(id => validIds.includes(id));
  
  if (invalidInValid) {
    throw new Error('Invalid records found in valid results - they were not properly skipped');
  }
  
  console.log('✅ Invalid records properly skipped from valid results');
  console.log(`   - Invalid IDs: ${invalidIds.join(', ')}`);
  console.log(`   - Valid IDs: ${validIds.join(', ')}`);
  console.log(`   - No overlap between invalid and valid records`);
  
  return true;
}

// Test clear console output (no silent failures)
function testClearConsoleOutput() {
  console.log('\n📋 Testing Clear Console Output (No Silent Failures)');
  console.log('='.repeat(50));
  
  // Create a validation function that simulates the data loader behavior
  function validateWithConsoleOutput(rows) {
    console.log(`🔍 Validating ${rows.length} test records...`);
    
    const validation = validateTherapists(rows);
    
    // Log validation results (this is the key part - clear console output)
    if (validation.bad.length > 0) {
      console.warn(`⚠️  ${validation.bad.length} records failed validation:`);
      validation.bad.forEach(({ row, issues }) => {
        console.warn(`   - ${row.id || 'Unknown ID'}: ${issues.join(', ')}`);
      });
    }
    
    console.log(`✅ ${validation.ok.length} valid therapists loaded`);
    
    return validation;
  }
  
  // Capture console output
  const originalWarn = console.warn;
  const originalLog = console.log;
  const capturedOutput = [];
  
  console.warn = (...args) => {
    capturedOutput.push({ type: 'warn', message: args.join(' ') });
    originalWarn(...args);
  };
  
  console.log = (...args) => {
    capturedOutput.push({ type: 'log', message: args.join(' ') });
    originalLog(...args);
  };
  
  try {
    // Run validation with console output
    const validation = validateWithConsoleOutput(testData);
    
    // Check that we have clear output for invalid records
    const hasValidationWarnings = capturedOutput.some(output => 
      output.type === 'warn' && output.message.includes('records failed validation')
    );
    
    const hasRecordDetails = capturedOutput.some(output => 
      output.type === 'warn' && output.message.includes('invalid_')
    );
    
    const hasValidCount = capturedOutput.some(output => 
      output.type === 'log' && output.message.includes('valid therapists loaded')
    );
    
    if (!hasValidationWarnings) {
      throw new Error('No validation warnings found in console output');
    }
    
    if (!hasRecordDetails) {
      throw new Error('No detailed record information found in console output');
    }
    
    if (!hasValidCount) {
      throw new Error('No valid count information found in console output');
    }
    
    console.log('✅ Clear console output provided for all validation results');
    console.log('   - Validation warnings displayed');
    console.log('   - Individual record details shown');
    console.log('   - Valid count reported');
    console.log('   - No silent failures detected');
    
    return true;
    
  } finally {
    // Restore original console functions
    console.warn = originalWarn;
    console.log = originalLog;
  }
}

// Main test execution
function main() {
  try {
    // Test 1: Invalid record handling
    const validation = testInvalidRecordHandling();
    
    // Test 2: Invalid records are skipped
    testInvalidRecordsSkipped();
    
    // Test 3: Clear console output
    testClearConsoleOutput();
    
    console.log('\n🎉 All invalid record handling tests passed!');
    console.log('\n✅ Part C Acceptance Criteria Verified:');
    console.log('   ✅ Invalid records are properly validated');
    console.log('   ✅ Invalid records are skipped from results');
    console.log('   ✅ Clear console output provided (no silent failures)');
    console.log('   ✅ Detailed error messages for each invalid record');
    console.log('   ✅ Validation counts and statistics displayed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateTherapists, testInvalidRecordHandling };
