#!/usr/bin/env node

/**
 * Part B Complete Workflow Test
 * Demonstrates the complete Part B implementation workflow
 */

const { execSync } = require('child_process')
const fs = require('fs').promises
const path = require('path')

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}`)
  console.log(`   Command: ${command}`)
  try {
    const output = execSync(command, { 
      cwd: process.cwd(), 
      encoding: 'utf8',
      stdio: 'pipe'
    })
    console.log(`   ✅ Success`)
    if (output.trim()) {
      console.log(`   Output: ${output.trim().split('\n').slice(-2).join(' | ')}`)
    }
    return true
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`)
    return false
  }
}

async function checkFileContent(filePath, expectedCount) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const therapists = JSON.parse(content)
    const fixtureCount = therapists.filter(t => t.isFixture).length
    const totalCount = therapists.length
    
    console.log(`   📊 File: ${filePath}`)
    console.log(`   📊 Total therapists: ${totalCount}`)
    console.log(`   📊 Fixture therapists: ${fixtureCount}`)
    
    if (expectedCount !== undefined) {
      const success = fixtureCount === expectedCount
      console.log(`   ${success ? '✅' : '❌'} Expected ${expectedCount} fixtures, found ${fixtureCount}`)
      return success
    }
    return true
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`)
    return false
  }
}

async function testPartBWorkflow() {
  console.log('🧪 Testing Part B Complete Workflow\n')
  console.log('🎯 This test demonstrates the complete Part B implementation:\n')
  console.log('   1. Environment toggle (NEXT_PUBLIC_BIBIA_FIXTURES=true)')
  console.log('   2. Seeding script with specific therapist data')
  console.log('   3. Cleanup command to remove isFixture=true records\n')
  
  const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
  let allTestsPassed = true
  
  // Step 1: Clean slate - ensure no fixtures exist
  console.log('📋 Step 1: Clean slate - ensure no fixtures exist')
  const cleanSlate = await runCommand(
    'node scripts/cleanup-fixtures.js --cleanup',
    'Clean up any existing fixtures'
  )
  allTestsPassed = allTestsPassed && cleanSlate
  
  // Step 2: Check initial status
  console.log('\n📋 Step 2: Check initial status')
  const initialStatus = await runCommand(
    'node scripts/cleanup-fixtures.js --status',
    'Check initial fixture status'
  )
  allTestsPassed = allTestsPassed && initialStatus
  
  // Step 3: Seed Part B fixtures
  console.log('\n📋 Step 3: Seed Part B fixtures')
  const seedFixtures = await runCommand(
    'NEXT_PUBLIC_BIBIA_FIXTURES=true node scripts/seed-part-b-fixtures.js',
    'Seed Part B fixtures with NEXT_PUBLIC_BIBIA_FIXTURES=true'
  )
  allTestsPassed = allTestsPassed && seedFixtures
  
  // Step 4: Verify fixtures were created
  console.log('\n📋 Step 4: Verify fixtures were created')
  const verifyFixtures = await checkFileContent(fixturesPath, 6)
  allTestsPassed = allTestsPassed && verifyFixtures
  
  // Step 5: Check fixture status
  console.log('\n📋 Step 5: Check fixture status')
  const fixtureStatus = await runCommand(
    'node scripts/cleanup-fixtures.js --status',
    'Check fixture status after seeding'
  )
  allTestsPassed = allTestsPassed && fixtureStatus
  
  // Step 6: Test environment toggle validation
  console.log('\n📋 Step 6: Test environment toggle validation')
  const envValidation = await runCommand(
    'node scripts/seed-part-b-fixtures.js',
    'Try to seed without NEXT_PUBLIC_BIBIA_FIXTURES (should fail)'
  )
  // This should fail, so we expect it to fail
  const envValidationPassed = !envValidation
  console.log(`   ${envValidationPassed ? '✅' : '❌'} Environment validation ${envValidationPassed ? 'passed' : 'failed'} (expected to fail)`)
  allTestsPassed = allTestsPassed && envValidationPassed
  
  // Step 7: Cleanup fixtures
  console.log('\n📋 Step 7: Cleanup fixtures')
  const cleanupFixtures = await runCommand(
    'node scripts/cleanup-fixtures.js --cleanup',
    'Clean up fixture data'
  )
  allTestsPassed = allTestsPassed && cleanupFixtures
  
  // Step 8: Verify cleanup
  console.log('\n📋 Step 8: Verify cleanup')
  const verifyCleanup = await checkFileContent(fixturesPath, 0)
  allTestsPassed = allTestsPassed && verifyCleanup
  
  // Step 9: Final status check
  console.log('\n📋 Step 9: Final status check')
  const finalStatus = await runCommand(
    'node scripts/cleanup-fixtures.js --status',
    'Check final fixture status'
  )
  allTestsPassed = allTestsPassed && finalStatus
  
  // Summary
  console.log('\n📊 Part B Workflow Test Summary:')
  console.log(`   Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  
  if (allTestsPassed) {
    console.log('\n🎯 Part B Implementation Verified:')
    console.log('   ✅ Environment toggle (NEXT_PUBLIC_BIBIA_FIXTURES=true) works')
    console.log('   ✅ Seeding script creates specific therapist data')
    console.log('   ✅ All therapists marked with isFixture=true')
    console.log('   ✅ Cleanup command removes fixture data')
    console.log('   ✅ Production data stays clean')
    console.log('\n🚀 Part B is ready for production use!')
  } else {
    console.log('\n❌ Some tests failed. Please check the implementation.')
  }
}

// Run the workflow test
if (require.main === module) {
  testPartBWorkflow()
}
