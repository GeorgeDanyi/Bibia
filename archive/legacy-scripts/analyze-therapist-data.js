const fs = require('fs');
const path = require('path');

// Read the therapist data
const dataPath = path.join(__dirname, 'data', 'therapists.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const therapists = JSON.parse(rawData);

// Filter out fixture data if present
const productionData = therapists.filter(therapist => !therapist.isFixture);

console.log(`Total therapists in dataset: ${productionData.length}`);
console.log('='.repeat(80));

// Function to check if coordinates are within Czech Republic bounds
function isWithinCzechRepublic(lat, lng) {
  // Czech Republic approximate bounds: lat ~ 48–51, lng ~ 12–19
  return lat >= 48 && lat <= 51 && lng >= 12 && lng <= 19;
}

// Get 5 random records
const randomIndices = [];
while (randomIndices.length < 5) {
  const randomIndex = Math.floor(Math.random() * productionData.length);
  if (!randomIndices.includes(randomIndex)) {
    randomIndices.push(randomIndex);
  }
}

console.log('5 Random Therapist Records:');
console.log('='.repeat(80));

randomIndices.forEach((index, i) => {
  const therapist = productionData[index];
  const lat = therapist.location?.lat;
  const lng = therapist.location?.lon;
  const withinCzech = isWithinCzechRepublic(lat, lng);
  
  console.log(`\n${i + 1}. Record ${index + 1}:`);
  console.log(`   ID: ${therapist.id}`);
  console.log(`   Name: ${therapist.name}`);
  console.log(`   City: ${therapist.city}`);
  console.log(`   Latitude: ${lat}`);
  console.log(`   Longitude: ${lng}`);
  console.log(`   Practice Type: ${therapist.practiceType || 'NOT SPECIFIED'}`);
  
  if (withinCzech) {
    console.log(`   ✅ Coordinates are within Czech Republic bounds`);
  } else {
    console.log(`   ⚠️  WARNING: Coordinates are OUTSIDE Czech Republic bounds!`);
  }
});

// Summary statistics
console.log('\n' + '='.repeat(80));
console.log('SUMMARY STATISTICS:');
console.log('='.repeat(80));

const coordsWithinCzech = productionData.filter(t => 
  isWithinCzechRepublic(t.location?.lat, t.location?.lon)
).length;

const coordsOutsideCzech = productionData.length - coordsWithinCzech;

console.log(`Total records: ${productionData.length}`);
console.log(`Records within Czech Republic bounds: ${coordsWithinCzech}`);
console.log(`Records outside Czech Republic bounds: ${coordsOutsideCzech}`);

if (coordsOutsideCzech > 0) {
  console.log(`\n⚠️  WARNING: ${coordsOutsideCzech} records have coordinates outside Czech Republic bounds!`);
  
  // Show some examples of out-of-bounds records
  const outOfBounds = productionData.filter(t => 
    !isWithinCzechRepublic(t.location?.lat, t.location?.lon)
  ).slice(0, 3);
  
  console.log('\nExamples of out-of-bounds records:');
  outOfBounds.forEach((therapist, i) => {
    console.log(`  ${i + 1}. ${therapist.name} (${therapist.city}): lat=${therapist.location?.lat}, lng=${therapist.location?.lon}`);
  });
}

// Check for missing practiceType
const missingPracticeType = productionData.filter(t => !t.practiceType).length;
console.log(`\nRecords missing practiceType: ${missingPracticeType}`);

