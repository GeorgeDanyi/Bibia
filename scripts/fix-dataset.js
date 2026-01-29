#!/usr/bin/env node

// Script to fix the fake therapist dataset

const fs = require('fs');
const path = require('path');

// Load the dataset
const datasetPath = path.join(__dirname, '..', 'data', 'fake-therapists-complete.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

console.log(`Fixing ${dataset.length} therapist profiles...`);

// Fix missing fields and improve distribution
dataset.forEach((therapist, index) => {
  // Ensure acceptingNew field exists
  if (therapist.acceptingNew === undefined) {
    therapist.acceptingNew = Math.random() < 0.8;
  }
  
  // Ensure all required fields exist
  if (!therapist.regions) {
    therapist.regions = [therapist.city === 'Praha' ? 'Praha' : 'Středočeský'];
  }
  
  if (!therapist.workingHours) {
    therapist.workingHours = {
      morning: Math.random() < 0.8,
      midday: Math.random() < 0.9,
      evening: Math.random() < 0.6,
      weekend: Math.random() < 0.4
    };
  }
  
  if (!therapist.rating) {
    therapist.rating = {
      average: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      count: Math.floor(Math.random() * 200) + 10
    };
  }
  
  if (!therapist.nextAvailableDays) {
    therapist.nextAvailableDays = Math.floor(Math.random() * 14) + 1;
  }
  
  if (!therapist.clinicName) {
    therapist.clinicName = `Fyzioterapie ${therapist.city}`;
  }
  
  if (!therapist.address) {
    therapist.address = `Náměstí ${Math.floor(Math.random() * 200) + 1}, ${therapist.city}`;
  }
  
  if (!therapist.phone) {
    therapist.phone = `+420 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`;
  }
  
  if (!therapist.email) {
    therapist.email = `${therapist.fullName.toLowerCase().replace(' ', '.')}@fyzio.cz`;
  }
  
  if (!therapist.insuranceAccepted) {
    therapist.insuranceAccepted = ['VZP', 'ZPMV'];
  }
  
  if (!therapist.postalCode) {
    therapist.postalCode = `${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10}`;
  }
  
  if (!therapist.homeVisitRadiusKm) {
    therapist.homeVisitRadiusKm = Math.floor(Math.random() * 30) + 5;
  }
  
  if (!therapist.isVerified) {
    therapist.isVerified = Math.random() < 0.9;
  }
  
  if (!therapist.isFixture) {
    therapist.isFixture = true;
  }
  
  // Ensure Czech language is included
  if (!therapist.languages.includes('cs')) {
    therapist.languages.unshift('cs');
  }
  
  // Ensure at least one specialty
  if (!therapist.specialties || therapist.specialties.length === 0) {
    therapist.specialties = ['Bolesti zad / krku'];
  }
  
  // Ensure at least one modality
  if (!therapist.modalities || therapist.modalities.length === 0) {
    therapist.modalities = ['Manuální terapie'];
  }
  
  // Ensure at least one worksWith
  if (!therapist.worksWith || therapist.worksWith.length === 0) {
    therapist.worksWith = ['sportovci'];
  }
  
  // Ensure tags exist
  if (!therapist.tags || therapist.tags.length === 0) {
    therapist.tags = [therapist.city, ...therapist.modalities.slice(0, 2), ...therapist.specialties.slice(0, 1)];
  }
  
  // Ensure diagnosisTags exist
  if (!therapist.diagnosisTags) {
    therapist.diagnosisTags = therapist.diagnoses || [];
  }
});

// Improve distribution for better test scenario coverage
// Add more seniors specialists
const seniorsNeeded = 25 - dataset.filter(t => t.worksWith.includes('senioři')).length;
if (seniorsNeeded > 0) {
  for (let i = 0; i < seniorsNeeded; i++) {
    const therapist = dataset[Math.floor(Math.random() * dataset.length)];
    if (!therapist.worksWith.includes('senioři')) {
      therapist.worksWith.push('senioři');
      therapist.tags.push('Senioři');
    }
  }
}

// Add more Vojta specialists
const vojtaNeeded = 15 - dataset.filter(t => t.modalities.includes('Vojta')).length;
if (vojtaNeeded > 0) {
  for (let i = 0; i < vojtaNeeded; i++) {
    const therapist = dataset[Math.floor(Math.random() * dataset.length)];
    if (!therapist.modalities.includes('Vojta')) {
      therapist.modalities.push('Vojta');
      therapist.tags.push('Vojta');
    }
  }
}

// Add more online practices
const onlineNeeded = 20 - dataset.filter(t => t.practiceType === 'online').length;
if (onlineNeeded > 0) {
  for (let i = 0; i < onlineNeeded; i++) {
    const therapist = dataset[Math.floor(Math.random() * dataset.length)];
    if (therapist.practiceType !== 'online') {
      therapist.practiceType = 'online';
      therapist.tags.push('Online');
    }
  }
}

// Add more high-price therapists in Brno
const brnoHighPriceNeeded = 5 - dataset.filter(t => t.city === 'Brno' && t.pricePerSession >= 1200).length;
if (brnoHighPriceNeeded > 0) {
  for (let i = 0; i < brnoHighPriceNeeded; i++) {
    const brnoTherapists = dataset.filter(t => t.city === 'Brno' && t.pricePerSession < 1200);
    if (brnoTherapists.length > 0) {
      const therapist = brnoTherapists[Math.floor(Math.random() * brnoTherapists.length)];
      therapist.pricePerSession = Math.floor(Math.random() * 800) + 1200;
      therapist.priceRange = { minCZK: 1200, maxCZK: 2000 };
    }
  }
}

// Add more German speakers in Brno
const brnoGermanNeeded = 5 - dataset.filter(t => t.city === 'Brno' && t.languages.includes('de')).length;
if (brnoGermanNeeded > 0) {
  for (let i = 0; i < brnoGermanNeeded; i++) {
    const brnoTherapists = dataset.filter(t => t.city === 'Brno' && !t.languages.includes('de'));
    if (brnoTherapists.length > 0) {
      const therapist = brnoTherapists[Math.floor(Math.random() * brnoTherapists.length)];
      therapist.languages.push('de');
    }
  }
}

// Add more rehabilitation specialists in Olomouc
const olomoucRehabNeeded = 3 - dataset.filter(t => t.city === 'Olomouc' && t.specialties.includes('Rehabilitace po operaci')).length;
if (olomoucRehabNeeded > 0) {
  for (let i = 0; i < olomoucRehabNeeded; i++) {
    const olomoucTherapists = dataset.filter(t => t.city === 'Olomouc' && !t.specialties.includes('Rehabilitace po operaci'));
    if (olomoucTherapists.length > 0) {
      const therapist = olomoucTherapists[Math.floor(Math.random() * olomoucTherapists.length)];
      therapist.specialties.push('Rehabilitace po operaci');
      therapist.tags.push('Rehabilitace');
    }
  }
}

// Write the fixed dataset
const outputPath = path.join(__dirname, '..', 'data', 'fake-therapists-fixed.json');
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

console.log(`Fixed dataset written to: ${outputPath}`);

// Generate summary
const summary = {
  total: dataset.length,
  cities: {},
  conditions: {},
  languages: {},
  priceRanges: {},
  ageGroups: {},
  modalities: {},
  practiceTypes: {}
};

dataset.forEach(therapist => {
  // Cities
  summary.cities[therapist.city] = (summary.cities[therapist.city] || 0) + 1;
  
  // Conditions
  therapist.specialties.forEach(specialty => {
    summary.conditions[specialty] = (summary.conditions[specialty] || 0) + 1;
  });
  
  // Languages
  therapist.languages.forEach(lang => {
    summary.languages[lang] = (summary.languages[lang] || 0) + 1;
  });
  
  // Price ranges
  const priceRange = therapist.pricePerSession < 800 ? 'low' : 
                    therapist.pricePerSession < 1200 ? 'medium' : 'high';
  summary.priceRanges[priceRange] = (summary.priceRanges[priceRange] || 0) + 1;
  
  // Age groups
  if (therapist.worksWith.includes('děti')) summary.ageGroups.children = (summary.ageGroups.children || 0) + 1;
  if (therapist.worksWith.includes('senioři')) summary.ageGroups.seniors = (summary.ageGroups.seniors || 0) + 1;
  if (therapist.worksWith.includes('těhotné')) summary.ageGroups.accessibility = (summary.ageGroups.accessibility || 0) + 1;
  
  // Modalities
  therapist.modalities.forEach(modality => {
    summary.modalities[modality] = (summary.modalities[modality] || 0) + 1;
  });
  
  // Practice types
  summary.practiceTypes[therapist.practiceType] = (summary.practiceTypes[therapist.practiceType] || 0) + 1;
});

console.log('\n=== FIXED DATASET SUMMARY ===');
console.log(JSON.stringify(summary, null, 2));

console.log('\nDataset fixing complete!');
