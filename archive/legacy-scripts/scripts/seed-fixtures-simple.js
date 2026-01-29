#!/usr/bin/env node

// Simple seed fixtures script for Part B
// Creates 12+ therapist records around Prague, Brno, Ostrava centers

const fs = require('fs');
const path = require('path');

// Generate fixtures data
const fixtures = [
  // Prague fixtures (5 records)
  {
    id: 'prague_001',
    name: 'MUDr. Anna Nováková',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    practiceType: 'clinic',
    diagnosisTags: ['backneck', 'sports'],
    languages: ['cs', 'en'],
    acceptingNew: true,
    nextAvailableDays: 3,
    pricePerHour: 1200,
    isFixture: true
  },
  {
    id: 'prague_002',
    name: 'Mgr. Petr Svoboda',
    city: 'Praha',
    latitude: 50.0855,
    longitude: 14.4278,
    practiceType: 'home',
    diagnosisTags: ['bechterev', 'backneck'],
    languages: ['cs', 'de'],
    acceptingNew: true,
    nextAvailableDays: 1,
    pricePerHour: 1000,
    isFixture: true
  },
  {
    id: 'prague_003',
    name: 'Bc. Marie Kratochvílová',
    city: 'Praha',
    latitude: 50.0655,
    longitude: 14.4478,
    practiceType: 'online',
    diagnosisTags: ['sports', 'backneck'],
    languages: ['cs', 'en', 'ru'],
    acceptingNew: true,
    nextAvailableDays: 0,
    pricePerHour: 800,
    isFixture: true
  },
  {
    id: 'prague_004',
    name: 'MUDr. Jan Horák',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4178,
    practiceType: 'clinic',
    diagnosisTags: ['bechterev'],
    languages: ['cs', 'en', 'de'],
    acceptingNew: false,
    nextAvailableDays: 14,
    pricePerHour: 1500,
    isFixture: true
  },
  {
    id: 'prague_005',
    name: 'Mgr. Eva Veselá',
    city: 'Praha',
    latitude: 50.0855,
    longitude: 14.4578,
    practiceType: 'online',
    diagnosisTags: ['backneck', 'sports'],
    languages: ['cs', 'en'],
    acceptingNew: true,
    nextAvailableDays: 2,
    pricePerHour: 900,
    isFixture: true
  },

  // Brno fixtures (4 records)
  {
    id: 'brno_001',
    name: 'MUDr. Tomáš Krejčí',
    city: 'Brno',
    latitude: 49.1951,
    longitude: 16.6068,
    practiceType: 'clinic',
    diagnosisTags: ['sports', 'backneck'],
    languages: ['cs', 'en', 'de'],
    acceptingNew: true,
    nextAvailableDays: 2,
    pricePerHour: 1100,
    isFixture: true
  },
  {
    id: 'brno_002',
    name: 'Mgr. Jana Novotná',
    city: 'Brno',
    latitude: 49.1851,
    longitude: 16.6168,
    practiceType: 'home',
    diagnosisTags: ['bechterev', 'backneck'],
    languages: ['cs', 'en'],
    acceptingNew: true,
    nextAvailableDays: 5,
    pricePerHour: 950,
    isFixture: true
  },
  {
    id: 'brno_003',
    name: 'Bc. Pavel Havlíček',
    city: 'Brno',
    latitude: 49.2051,
    longitude: 16.5968,
    practiceType: 'online',
    diagnosisTags: ['sports'],
    languages: ['cs', 'en', 'sk'],
    acceptingNew: true,
    nextAvailableDays: 1,
    pricePerHour: 800,
    isFixture: true
  },
  {
    id: 'brno_004',
    name: 'MUDr. Petra Urbanová',
    city: 'Brno',
    latitude: 49.1951,
    longitude: 16.5968,
    practiceType: 'clinic',
    diagnosisTags: ['bechterev', 'sports'],
    languages: ['cs', 'en', 'de'],
    acceptingNew: false,
    nextAvailableDays: 21,
    pricePerHour: 1200,
    isFixture: true
  },

  // Ostrava fixtures (4 records)
  {
    id: 'ostrava_001',
    name: 'MUDr. Martin Kovář',
    city: 'Ostrava',
    latitude: 49.8300,
    longitude: 18.2850,
    practiceType: 'clinic',
    diagnosisTags: ['sports', 'backneck'],
    languages: ['cs', 'en', 'pl'],
    acceptingNew: true,
    nextAvailableDays: 2,
    pricePerHour: 1000,
    isFixture: true
  },
  {
    id: 'ostrava_002',
    name: 'Mgr. Lenka Petříková',
    city: 'Ostrava',
    latitude: 49.8400,
    longitude: 18.2750,
    practiceType: 'home',
    diagnosisTags: ['bechterev', 'backneck'],
    languages: ['cs', 'en', 'ru'],
    acceptingNew: true,
    nextAvailableDays: 4,
    pricePerHour: 850,
    isFixture: true
  },
  {
    id: 'ostrava_003',
    name: 'Bc. Jakub Hrdina',
    city: 'Ostrava',
    latitude: 49.8200,
    longitude: 18.2950,
    practiceType: 'online',
    diagnosisTags: ['sports', 'bechterev'],
    languages: ['cs', 'en', 'sk'],
    acceptingNew: true,
    nextAvailableDays: 0,
    pricePerHour: 750,
    isFixture: true
  },
  {
    id: 'ostrava_004',
    name: 'MUDr. Zuzana Balcarová',
    city: 'Ostrava',
    latitude: 49.8300,
    longitude: 18.2750,
    practiceType: 'clinic',
    diagnosisTags: ['backneck', 'sports'],
    languages: ['cs', 'en', 'de'],
    acceptingNew: false,
    nextAvailableDays: 18,
    pricePerHour: 1100,
    isFixture: true
  }
];

// Basic validation function
function validateFixture(fixture) {
  const errors = [];
  
  // Required fields
  if (!fixture.id || typeof fixture.id !== 'string') errors.push('id is required and must be string');
  if (!fixture.name || typeof fixture.name !== 'string') errors.push('name is required and must be string');
  if (!fixture.city || typeof fixture.city !== 'string') errors.push('city is required and must be string');
  
  // Coordinates
  if (typeof fixture.latitude !== 'number' || fixture.latitude < -90 || fixture.latitude > 90) {
    errors.push('latitude must be number between -90 and 90');
  }
  if (typeof fixture.longitude !== 'number' || fixture.longitude < -180 || fixture.longitude > 180) {
    errors.push('longitude must be number between -180 and 180');
  }
  
  // Practice type
  if (!['clinic', 'home', 'online'].includes(fixture.practiceType)) {
    errors.push('practiceType must be clinic, home, or online');
  }
  
  // Arrays
  if (!Array.isArray(fixture.diagnosisTags)) errors.push('diagnosisTags must be array');
  if (!Array.isArray(fixture.languages)) errors.push('languages must be array');
  
  // Booleans
  if (typeof fixture.acceptingNew !== 'boolean') errors.push('acceptingNew must be boolean');
  
  // Numbers
  if (fixture.nextAvailableDays !== null && (typeof fixture.nextAvailableDays !== 'number' || fixture.nextAvailableDays < 0 || fixture.nextAvailableDays > 60)) {
    errors.push('nextAvailableDays must be null or number between 0 and 60');
  }
  if (fixture.pricePerHour !== null && (typeof fixture.pricePerHour !== 'number' || fixture.pricePerHour < 0)) {
    errors.push('pricePerHour must be null or positive number');
  }
  
  // Fixture flag
  if (fixture.isFixture !== true) errors.push('isFixture must be true');
  
  return errors;
}

// Validate all fixtures
function validateFixtures() {
  console.log('🔍 Validating fixtures...');
  
  for (const fixture of fixtures) {
    const errors = validateFixture(fixture);
    if (errors.length > 0) {
      console.error(`❌ Validation failed for ${fixture.id}:`, errors);
      throw new Error(`Validation failed for ${fixture.id}`);
    }
  }
  
  console.log(`✅ All ${fixtures.length} fixtures validated successfully`);
}

// Check requirements
function checkRequirements() {
  console.log('📋 Checking Part B requirements...');
  
  // Check total count (≥ 12)
  if (fixtures.length < 12) {
    throw new Error(`Requirement: ≥ 12 records, got ${fixtures.length}`);
  }
  console.log(`✅ Total records: ${fixtures.length} (≥ 12 required)`);
  
  // Check practice types
  const practiceTypes = [...new Set(fixtures.map(f => f.practiceType))];
  const requiredTypes = ['clinic', 'home', 'online'];
  const hasAllTypes = requiredTypes.every(type => practiceTypes.includes(type));
  if (!hasAllTypes) {
    throw new Error(`Missing practice types. Required: ${requiredTypes.join(', ')}, got: ${practiceTypes.join(', ')}`);
  }
  console.log(`✅ Practice types: ${practiceTypes.join(', ')}`);
  
  // Check online count (≥ 3)
  const onlineCount = fixtures.filter(f => f.practiceType === 'online').length;
  if (onlineCount < 3) {
    throw new Error(`Requirement: ≥ 3 online, got ${onlineCount}`);
  }
  console.log(`✅ Online therapists: ${onlineCount} (≥ 3 required)`);
  
  // Check required tags
  const allTags = [...new Set(fixtures.flatMap(f => f.diagnosisTags))];
  const requiredTags = ['backneck', 'bechterev', 'sports'];
  const hasAllTags = requiredTags.every(tag => allTags.includes(tag));
  if (!hasAllTags) {
    throw new Error(`Missing required tags. Required: ${requiredTags.join(', ')}, got: ${allTags.join(', ')}`);
  }
  console.log(`✅ Required tags present: ${requiredTags.join(', ')}`);
  
  // Check language diversity
  const allLanguages = [...new Set(fixtures.flatMap(f => f.languages))];
  console.log(`✅ Languages: ${allLanguages.join(', ')}`);
  
  // Check cities
  const cities = [...new Set(fixtures.map(f => f.city))];
  console.log(`✅ Cities: ${cities.join(', ')}`);
  
  // Check isFixture flag
  const allMarkedAsFixtures = fixtures.every(f => f.isFixture === true);
  if (!allMarkedAsFixtures) {
    throw new Error('All fixtures must have isFixture=true');
  }
  console.log(`✅ All ${fixtures.length} records marked as fixtures`);
}

// Save fixtures to file
function saveFixtures() {
  const outputPath = path.join(__dirname, '../src/data/fixtures.json');
  console.log(`💾 Saving fixtures to ${outputPath}...`);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(fixtures, null, 2));
  console.log(`✅ Fixtures saved successfully`);
}

// Main execution
function main() {
  console.log('🌱 Seeding Part B fixtures...\n');
  
  try {
    validateFixtures();
    checkRequirements();
    saveFixtures();
    
    console.log('\n🎉 Part B fixtures seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Total records: ${fixtures.length}`);
    console.log(`   - Cities: ${[...new Set(fixtures.map(f => f.city))].join(', ')}`);
    console.log(`   - Practice types: ${[...new Set(fixtures.map(f => f.practiceType))].join(', ')}`);
    console.log(`   - Online therapists: ${fixtures.filter(f => f.practiceType === 'online').length}`);
    console.log(`   - Required tags: ${['backneck', 'bechterev', 'sports'].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to seed fixtures:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixtures };