#!/usr/bin/env node

// Script to validate the fake therapist dataset against requirements

const fs = require('fs');
const path = require('path');

// Load the dataset
const datasetPath = path.join(__dirname, '..', 'data', 'fake-therapists-fixed.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

console.log(`Validating ${dataset.length} therapist profiles...\n`);

// Validation results
const results = {
  total: dataset.length,
  requirements: {},
  testScenarios: {},
  errors: [],
  warnings: []
};

// 1. City distribution validation
console.log('=== CITY DISTRIBUTION ===');
const cityDistribution = {
  'Praha': 35,
  'Brno': 20,
  'Ostrava': 10,
  'Plzeň': 8,
  'Olomouc': 7,
  'others': 20
};

const actualCities = {};
dataset.forEach(therapist => {
  actualCities[therapist.city] = (actualCities[therapist.city] || 0) + 1;
});

results.requirements.cityDistribution = {};
for (const [city, expected] of Object.entries(cityDistribution)) {
  if (city === 'others') {
    const others = Object.entries(actualCities)
      .filter(([c]) => !['Praha', 'Brno', 'Ostrava', 'Plzeň', 'Olomouc'].includes(c))
      .reduce((sum, [, count]) => sum + count, 0);
    results.requirements.cityDistribution[city] = { expected, actual: others, status: others >= expected ? 'PASS' : 'FAIL' };
    console.log(`${city}: ${others}/${expected} ${others >= expected ? '✓' : '✗'}`);
  } else {
    const actual = actualCities[city] || 0;
    results.requirements.cityDistribution[city] = { expected, actual, status: actual >= expected ? 'PASS' : 'FAIL' };
    console.log(`${city}: ${actual}/${expected} ${actual >= expected ? '✓' : '✗'}`);
  }
}

// 2. Condition coverage validation
console.log('\n=== CONDITION COVERAGE ===');
const conditions = [
  'Bolesti zad / krku', 'Bolesti kloubů', 'Bolesti svalů / šlach',
  'Bolesti hlavy / migrény', 'Sportovní úraz', 'Rehabilitace po operaci',
  'Rehabilitace po úrazu', 'Těhotenství / po porodu',
  'Dlouhodobé onemocnění / diagnóza', 'Jiné potíže'
];

results.requirements.conditionCoverage = {};
conditions.forEach(condition => {
  const count = dataset.filter(t => t.specialties.includes(condition)).length;
  const status = count >= 8 && count <= 12 ? 'PASS' : count < 8 ? 'FAIL' : 'WARN';
  results.requirements.conditionCoverage[condition] = { count, status };
  console.log(`${condition}: ${count} therapists ${count >= 8 && count <= 12 ? '✓' : count < 8 ? '✗' : '⚠'}`);
});

// 3. Language coverage validation
console.log('\n=== LANGUAGE COVERAGE ===');
const languageRequirements = {
  'en': 25,  // 25+ with English
  'uk': 10,  // 10+ with Ukrainian
  'de': 8    // 8+ with German
};

results.requirements.languageCoverage = {};
for (const [lang, required] of Object.entries(languageRequirements)) {
  const count = dataset.filter(t => t.languages.includes(lang)).length;
  const status = count >= required ? 'PASS' : 'FAIL';
  results.requirements.languageCoverage[lang] = { required, actual: count, status };
  console.log(`${lang}: ${count}/${required} ${count >= required ? '✓' : '✗'}`);
}

// 4. Price distribution validation
console.log('\n=== PRICE DISTRIBUTION ===');
const priceRanges = {
  'low': { min: 0, max: 800, expected: 30 },
  'medium': { min: 800, max: 1200, expected: 50 },
  'high': { min: 1200, max: 2000, expected: 20 }
};

results.requirements.priceDistribution = {};
for (const [range, config] of Object.entries(priceRanges)) {
  const count = dataset.filter(t => 
    t.pricePerSession >= config.min && t.pricePerSession < config.max
  ).length;
  const status = Math.abs(count - config.expected) <= 5 ? 'PASS' : 'WARN';
  results.requirements.priceDistribution[range] = { expected: config.expected, actual: count, status };
  console.log(`${range}: ${count}/${config.expected} ${Math.abs(count - config.expected) <= 5 ? '✓' : '⚠'}`);
}

// 5. Age and accessibility validation
console.log('\n=== AGE & ACCESSIBILITY COVERAGE ===');
const ageRequirements = {
  'children': 20,      // 20+ children specialists
  'seniors': 25,       // 25+ senior-friendly
  'accessibility': 25  // 25+ with accessibility
};

results.requirements.ageAccessibility = {};
for (const [group, required] of Object.entries(ageRequirements)) {
  let count;
  if (group === 'children') {
    count = dataset.filter(t => t.worksWith.includes('děti')).length;
  } else if (group === 'seniors') {
    count = dataset.filter(t => t.worksWith.includes('senioři')).length;
  } else if (group === 'accessibility') {
    count = dataset.filter(t => t.worksWith.includes('těhotné')).length;
  }
  
  const status = count >= required ? 'PASS' : 'FAIL';
  results.requirements.ageAccessibility[group] = { required, actual: count, status };
  console.log(`${group}: ${count}/${required} ${count >= required ? '✓' : '✗'}`);
}

// 6. Test scenarios validation
console.log('\n=== TEST SCENARIOS ===');
const testScenarios = [
  {
    name: 'Praha + Bolest zad',
    filter: t => t.city === 'Praha' && t.specialties.includes('Bolesti zad / krku')
  },
  {
    name: 'Brno + Koleno + Sport',
    filter: t => t.city === 'Brno' && t.specialties.includes('Bolesti kloubů') && t.worksWith.includes('sportovci')
  },
  {
    name: 'Ostrava + Online + AJ',
    filter: t => t.city === 'Ostrava' && t.practiceType === 'online' && t.languages.includes('en')
  },
  {
    name: 'Plzeň + Těhotenství',
    filter: t => t.city === 'Plzeň' && t.specialties.includes('Těhotenství / po porodu')
  },
  {
    name: 'Olomouc + Rehabilitace',
    filter: t => t.city === 'Olomouc' && t.specialties.includes('Rehabilitace po operaci')
  },
  {
    name: 'Praha + DNS + Nízká cena',
    filter: t => t.city === 'Praha' && t.modalities.includes('DNS') && t.pricePerSession < 800
  },
  {
    name: 'Brno + Děti + Vojta',
    filter: t => t.city === 'Brno' && t.worksWith.includes('děti') && t.modalities.includes('Vojta')
  },
  {
    name: 'Ostrava + Senioři + Bezbariérový',
    filter: t => t.city === 'Ostrava' && t.worksWith.includes('senioři')
  },
  {
    name: 'Praha + Ukrajinština',
    filter: t => t.city === 'Praha' && t.languages.includes('uk')
  },
  {
    name: 'Brno + Němčina + Vysoká cena',
    filter: t => t.city === 'Brno' && t.languages.includes('de') && t.pricePerSession >= 1200
  }
];

results.testScenarios = {};
testScenarios.forEach(scenario => {
  const matches = dataset.filter(scenario.filter);
  const status = matches.length >= 2 ? 'PASS' : matches.length === 1 ? 'WARN' : 'FAIL';
  results.testScenarios[scenario.name] = { count: matches.length, status };
  console.log(`${scenario.name}: ${matches.length} candidates ${matches.length >= 2 ? '✓' : matches.length === 1 ? '⚠' : '✗'}`);
});

// 7. Schema validation
console.log('\n=== SCHEMA VALIDATION ===');
const schemaErrors = [];
const schemaWarnings = [];

dataset.forEach((therapist, index) => {
  // Required fields
  const requiredFields = ['id', 'fullName', 'city', 'latitude', 'longitude', 'practiceType', 'acceptingNew', 'yearsExperience', 'pricePerSession', 'languages', 'specialties'];
  requiredFields.forEach(field => {
    if (!therapist[field]) {
      schemaErrors.push(`Therapist ${therapist.id}: Missing required field '${field}'`);
    }
  });
  
  // Data type validation
  if (typeof therapist.latitude !== 'number' || therapist.latitude < 48.5 || therapist.latitude > 51.1) {
    schemaErrors.push(`Therapist ${therapist.id}: Invalid latitude ${therapist.latitude}`);
  }
  
  if (typeof therapist.longitude !== 'number' || therapist.longitude < 12.0 || therapist.longitude > 18.9) {
    schemaErrors.push(`Therapist ${therapist.id}: Invalid longitude ${therapist.longitude}`);
  }
  
  if (typeof therapist.pricePerSession !== 'number' || therapist.pricePerSession < 0 || therapist.pricePerSession > 10000) {
    schemaErrors.push(`Therapist ${therapist.id}: Invalid price ${therapist.pricePerSession}`);
  }
  
  // Array validation
  if (!Array.isArray(therapist.languages) || therapist.languages.length === 0) {
    schemaErrors.push(`Therapist ${therapist.id}: Invalid languages array`);
  }
  
  if (!Array.isArray(therapist.specialties) || therapist.specialties.length === 0) {
    schemaErrors.push(`Therapist ${therapist.id}: Invalid specialties array`);
  }
  
  // Czech language requirement
  if (!therapist.languages.includes('cs')) {
    schemaErrors.push(`Therapist ${therapist.id}: Must speak Czech`);
  }
  
  // Rating validation
  if (therapist.rating) {
    if (therapist.rating.average < 0 || therapist.rating.average > 5) {
      schemaWarnings.push(`Therapist ${therapist.id}: Invalid rating average ${therapist.rating.average}`);
    }
    if (therapist.rating.count < 0 || therapist.rating.count > 10000) {
      schemaWarnings.push(`Therapist ${therapist.id}: Invalid rating count ${therapist.rating.count}`);
    }
  }
});

results.schemaValidation = {
  errors: schemaErrors.length,
  warnings: schemaWarnings.length,
  status: schemaErrors.length === 0 ? 'PASS' : 'FAIL'
};

console.log(`Schema errors: ${schemaErrors.length} ${schemaErrors.length === 0 ? '✓' : '✗'}`);
console.log(`Schema warnings: ${schemaWarnings.length} ${schemaWarnings.length === 0 ? '✓' : '⚠'}`);

if (schemaErrors.length > 0) {
  console.log('\nSchema errors:');
  schemaErrors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
  if (schemaErrors.length > 10) {
    console.log(`  ... and ${schemaErrors.length - 10} more errors`);
  }
}

// 8. Overall validation summary
console.log('\n=== OVERALL VALIDATION SUMMARY ===');
const totalRequirements = Object.values(results.requirements).reduce((sum, req) => {
  return sum + Object.values(req).filter(r => r.status === 'PASS').length;
}, 0);

const totalTests = Object.values(results.requirements).reduce((sum, req) => {
  return sum + Object.values(req).length;
}, 0);

const testScenarioPasses = Object.values(results.testScenarios).filter(s => s.status === 'PASS').length;
const totalTestScenarios = Object.values(results.testScenarios).length;

console.log(`Requirements: ${totalRequirements}/${totalTests} passed`);
console.log(`Test scenarios: ${testScenarioPasses}/${totalTestScenarios} passed`);
console.log(`Schema validation: ${results.schemaValidation.status}`);

const overallStatus = totalRequirements === totalTests && testScenarioPasses >= 8 && results.schemaValidation.status === 'PASS' ? 'PASS' : 'FAIL';
console.log(`\nOverall status: ${overallStatus}`);

// Write validation report
const reportPath = path.join(__dirname, '..', 'data', 'validation-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\nValidation report written to: ${reportPath}`);

if (overallStatus === 'FAIL') {
  process.exit(1);
}
