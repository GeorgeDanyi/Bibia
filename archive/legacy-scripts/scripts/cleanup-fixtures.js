#!/usr/bin/env node

/**
 * Fixture Cleanup Script
 * Removes all therapists with isFixture=true to keep production data clean
 * 
 * This script ensures that test fixture data doesn't interfere with production
 */

const fs = require('fs').promises
const path = require('path')

/**
 * Clean up fixture data from therapists file
 */
async function cleanupFixtures() {
  console.log('🧹 Cleaning up fixture data...\n')
  
  try {
    const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
    
    // Check if fixtures file exists
    try {
      await fs.access(fixturesPath)
    } catch (error) {
      console.log('❌ Fixtures file not found:', fixturesPath)
      console.log('   No cleanup needed.')
      return
    }
    
    // Read current fixtures
    const fixturesContent = await fs.readFile(fixturesPath, 'utf8')
    const allTherapists = JSON.parse(fixturesContent)
    
    // Filter out fixture therapists
    const productionTherapists = allTherapists.filter(therapist => !therapist.isFixture)
    const fixtureTherapists = allTherapists.filter(therapist => therapist.isFixture)
    
    console.log(`📊 Found ${allTherapists.length} total therapists`)
    console.log(`   - Production therapists: ${productionTherapists.length}`)
    console.log(`   - Fixture therapists: ${fixtureTherapists.length}`)
    
    if (fixtureTherapists.length === 0) {
      console.log('✅ No fixture data found. Cleanup not needed.')
      return
    }
    
    // Show which fixture therapists will be removed
    console.log('\n🗑️  Fixture therapists to be removed:')
    fixtureTherapists.forEach(therapist => {
      console.log(`   - ${therapist.fullName} (${therapist.city}) - ${therapist.id}`)
    })
    
    // Write cleaned data back to file
    await fs.writeFile(fixturesPath, JSON.stringify(productionTherapists, null, 2))
    
    console.log(`\n💾 Cleaned fixtures saved to: ${fixturesPath}`)
    console.log(`📊 Remaining therapists: ${productionTherapists.length}`)
    console.log('✅ Cleanup completed successfully!')
    
    console.log('\n🎯 Production data is now clean:')
    console.log('   ✅ All isFixture=true records removed')
    console.log('   ✅ Only production therapists remain')
    console.log('   ✅ Ready for production deployment')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

/**
 * Show current fixture status without cleaning
 */
async function showFixtureStatus() {
  console.log('📊 Checking fixture status...\n')
  
  try {
    const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
    
    // Check if fixtures file exists
    try {
      await fs.access(fixturesPath)
    } catch (error) {
      console.log('❌ Fixtures file not found:', fixturesPath)
      return
    }
    
    // Read current fixtures
    const fixturesContent = await fs.readFile(fixturesPath, 'utf8')
    const allTherapists = JSON.parse(fixturesContent)
    
    // Analyze therapists
    const productionTherapists = allTherapists.filter(therapist => !therapist.isFixture)
    const fixtureTherapists = allTherapists.filter(therapist => therapist.isFixture)
    
    console.log(`📊 Current status:`)
    console.log(`   - Total therapists: ${allTherapists.length}`)
    console.log(`   - Production therapists: ${productionTherapists.length}`)
    console.log(`   - Fixture therapists: ${fixtureTherapists.length}`)
    
    if (fixtureTherapists.length > 0) {
      console.log('\n🗑️  Fixture therapists found:')
      fixtureTherapists.forEach(therapist => {
        console.log(`   - ${therapist.fullName} (${therapist.city}) - ${therapist.id}`)
      })
      console.log('\n💡 Run cleanup to remove fixture data:')
      console.log('   node scripts/cleanup-fixtures.js --cleanup')
    } else {
      console.log('\n✅ No fixture data found. Production data is clean.')
    }
    
  } catch (error) {
    console.error('❌ Error checking fixture status:', error)
    process.exit(1)
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--cleanup') || args.includes('-c')) {
    await cleanupFixtures()
  } else if (args.includes('--status') || args.includes('-s')) {
    await showFixtureStatus()
  } else {
    console.log('🧹 Fixture Cleanup Script\n')
    console.log('Usage:')
    console.log('  node scripts/cleanup-fixtures.js --cleanup   # Remove all isFixture=true records')
    console.log('  node scripts/cleanup-fixtures.js --status    # Show current fixture status')
    console.log('  node scripts/cleanup-fixtures.js -c          # Short form for cleanup')
    console.log('  node scripts/cleanup-fixtures.js -s          # Short form for status')
    console.log('\nExamples:')
    console.log('  # Check what fixture data exists')
    console.log('  node scripts/cleanup-fixtures.js --status')
    console.log('\n  # Remove all fixture data')
    console.log('  node scripts/cleanup-fixtures.js --cleanup')
  }
}

// Run the script
if (require.main === module) {
  main()
}
