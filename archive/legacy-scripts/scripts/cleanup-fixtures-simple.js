#!/usr/bin/env node

// Simple cleanup script to delete fixtures where isFixture=true
// This script removes all fixture records from the data

const fs = require('fs');
const path = require('path');

// Data file paths
const REAL_DATA_PATH = path.join(__dirname, '../data/therapists.json');
const FIXTURES_PATH = path.join(__dirname, '../src/data/fixtures.json');

/**
 * Get cleanup statistics
 */
function getCleanupStats() {
  console.log('📊 Current data statistics:');
  
  try {
    // Check real data
    if (fs.existsSync(REAL_DATA_PATH)) {
      const realData = JSON.parse(fs.readFileSync(REAL_DATA_PATH, 'utf8'));
      const fixtureCount = realData.filter(item => item.isFixture).length;
      const realCount = realData.length - fixtureCount;
      
      console.log(`   Total therapists: ${realData.length}`);
      console.log(`   Fixture therapists: ${fixtureCount}`);
      console.log(`   Production therapists: ${realCount}`);
    } else {
      console.log('   Real data file: not found');
    }
    
    // Check fixtures file
    if (fs.existsSync(FIXTURES_PATH)) {
      const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
      console.log(`   Fixtures file: ${fixturesData.length} records`);
    } else {
      console.log(`   Fixtures file: not found`);
    }
    
  } catch (error) {
    console.warn('⚠️  Could not read data files for statistics:', error.message);
  }
}

/**
 * Remove fixtures from real data file
 */
function cleanupRealData() {
  console.log('🧹 Cleaning up real therapist data...');
  
  try {
    if (!fs.existsSync(REAL_DATA_PATH)) {
      console.log('ℹ️  No real data file found');
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(REAL_DATA_PATH, 'utf8'));
    const originalCount = data.length;
    
    // Filter out fixtures
    const cleanedData = data.filter(item => !item.isFixture);
    const removedCount = originalCount - cleanedData.length;
    
    if (removedCount > 0) {
      // Save cleaned data
      fs.writeFileSync(REAL_DATA_PATH, JSON.stringify(cleanedData, null, 2));
      console.log(`✅ Removed ${removedCount} fixtures from real data`);
      console.log(`📊 ${cleanedData.length} valid records remaining`);
    } else {
      console.log('ℹ️  No fixtures found in real data');
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup real data:', error.message);
    throw error;
  }
}

/**
 * Remove fixtures file
 */
function cleanupFixturesFile() {
  console.log('🧹 Cleaning up fixtures file...');
  
  try {
    if (fs.existsSync(FIXTURES_PATH)) {
      fs.unlinkSync(FIXTURES_PATH);
      console.log('✅ Fixtures file removed');
    } else {
      console.log('ℹ️  No fixtures file found');
    }
  } catch (error) {
    console.error('❌ Failed to remove fixtures file:', error.message);
    throw error;
  }
}

/**
 * Main cleanup function
 */
function main() {
  console.log('🧹 Starting fixture cleanup...\n');
  
  try {
    // Show current state
    getCleanupStats();
    console.log('');
    
    // Cleanup real data
    cleanupRealData();
    console.log('');
    
    // Cleanup fixtures file
    cleanupFixturesFile();
    console.log('');
    
    // Show final state
    console.log('📊 Final Statistics:');
    getCleanupStats();
    
    console.log('\n🎉 Fixture cleanup completed successfully!');
    console.log('💡 To re-enable fixtures, run: node scripts/seed-fixtures-simple.js');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧹 Fixture Cleanup Script

Usage:
  node scripts/cleanup-fixtures-simple.js
  node scripts/cleanup-fixtures-simple.js --stats

Options:
  --help, -h    Show this help message
  --stats       Show statistics only (no cleanup)

This script:
  - Removes all records with isFixture=true from data/therapists.json
  - Deletes the src/data/fixtures.json file
  - Shows cleanup statistics

To re-enable fixtures:
  node scripts/seed-fixtures-simple.js
`);
    process.exit(0);
  }
  
  if (args.includes('--stats')) {
    getCleanupStats();
    process.exit(0);
  }
  
  main();
}

module.exports = { cleanupRealData, cleanupFixturesFile, getCleanupStats };