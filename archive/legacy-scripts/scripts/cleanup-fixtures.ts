#!/usr/bin/env ts-node

// Cleanup script to delete fixtures where isFixture=true
// This script removes all fixture records from the data

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { validateTherapists, type Therapist } from '../src/lib/validation/therapistSchema'

// Data file paths
const REAL_DATA_PATH = join(__dirname, '../data/therapists.json')
const FIXTURES_PATH = join(__dirname, '../src/data/fixtures.json')

/**
 * Remove fixtures from real data file
 */
function cleanupRealData() {
  console.log('🧹 Cleaning up real therapist data...')
  
  try {
    const data = JSON.parse(readFileSync(REAL_DATA_PATH, 'utf8'))
    const originalCount = data.length
    
    // Filter out fixtures
    const cleanedData = data.filter((item: any) => !item.isFixture)
    const removedCount = originalCount - cleanedData.length
    
    if (removedCount > 0) {
      // Validate remaining data
      const validation = validateTherapists(cleanedData)
      
      if (validation.bad.length > 0) {
        console.warn(`⚠️  ${validation.bad.length} records failed validation after cleanup:`)
        validation.bad.forEach(({ row, issues }) => {
          console.warn(`   - ${row.id || 'Unknown ID'}: ${issues.join(', ')}`)
        })
      }
      
      // Save cleaned data
      writeFileSync(REAL_DATA_PATH, JSON.stringify(validation.ok, null, 2))
      console.log(`✅ Removed ${removedCount} fixtures from real data`)
      console.log(`📊 ${validation.ok.length} valid records remaining`)
    } else {
      console.log('ℹ️  No fixtures found in real data')
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup real data:', error)
    throw error
  }
}

/**
 * Remove fixtures file
 */
function cleanupFixturesFile() {
  console.log('🧹 Cleaning up fixtures file...')
  
  try {
    const fs = require('fs')
    if (fs.existsSync(FIXTURES_PATH)) {
      fs.unlinkSync(FIXTURES_PATH)
      console.log('✅ Fixtures file removed')
    } else {
      console.log('ℹ️  No fixtures file found')
    }
  } catch (error) {
    console.error('❌ Failed to remove fixtures file:', error)
    throw error
  }
}

/**
 * Get cleanup statistics
 */
function getCleanupStats() {
  console.log('📊 Cleanup Statistics:')
  
  try {
    // Check real data
    const realData = JSON.parse(readFileSync(REAL_DATA_PATH, 'utf8'))
    const fixtureCount = realData.filter((item: any) => item.isFixture).length
    const realCount = realData.length - fixtureCount
    
    console.log(`   - Real data file: ${realData.length} total records`)
    console.log(`   - Fixtures in real data: ${fixtureCount}`)
    console.log(`   - Real records: ${realCount}`)
    
    // Check fixtures file
    try {
      const fixturesData = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'))
      console.log(`   - Fixtures file: ${fixturesData.length} records`)
    } catch {
      console.log(`   - Fixtures file: not found`)
    }
    
  } catch (error) {
    console.warn('⚠️  Could not read data files for statistics:', error)
  }
}

/**
 * Main cleanup function
 */
function main() {
  console.log('🧹 Starting fixture cleanup...\n')
  
  try {
    // Show current state
    getCleanupStats()
    console.log('')
    
    // Cleanup real data
    cleanupRealData()
    console.log('')
    
    // Cleanup fixtures file
    cleanupFixturesFile()
    console.log('')
    
    // Show final state
    console.log('📊 Final Statistics:')
    getCleanupStats()
    
    console.log('\n🎉 Fixture cleanup completed successfully!')
    console.log('💡 To re-enable fixtures, run: npm run seed-fixtures')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧹 Fixture Cleanup Script

Usage:
  npm run cleanup-fixtures
  ts-node scripts/cleanup-fixtures.ts

Options:
  --help, -h    Show this help message
  --stats       Show statistics only (no cleanup)

This script:
  - Removes all records with isFixture=true from data/therapists.json
  - Deletes the src/data/fixtures.json file
  - Validates remaining data
  - Shows cleanup statistics

To re-enable fixtures:
  npm run seed-fixtures
`)
    process.exit(0)
  }
  
  if (args.includes('--stats')) {
    getCleanupStats()
    process.exit(0)
  }
  
  main()
}

export { cleanupRealData, cleanupFixturesFile, getCleanupStats }