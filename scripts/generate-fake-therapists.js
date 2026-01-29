#!/usr/bin/env node

// Script to generate comprehensive fake therapist dataset
// Ensures coverage of all questionnaire combinations

const fs = require('fs');
const path = require('path');

// City distribution: Praha (35), Brno (20), Ostrava (10), Plzeň (8), Olomouc (7), others (20)
const CITY_DISTRIBUTION = {
  'Praha': 35,
  'Brno': 20,
  'Ostrava': 10,
  'Plzeň': 8,
  'Olomouc': 7,
  'České Budějovice': 5,
  'Hradec Králové': 4,
  'Liberec': 3,
  'Pardubice': 3,
  'Ústí nad Labem': 3,
  'Zlín': 2
};

// Conditions from Step 2 - each needs 8-12 therapists
const CONDITIONS = [
  'Bolesti zad / krku',
  'Bolesti kloubů', 
  'Bolesti svalů / šlach',
  'Bolesti hlavy / migrény',
  'Sportovní úraz',
  'Rehabilitace po operaci',
  'Rehabilitace po úrazu',
  'Těhotenství / po porodu',
  'Dlouhodobé onemocnění / diagnóza',
  'Jiné potíže'
];

// Modalities to distribute
const MODALITIES = [
  'DNS', 'McKenzie', 'Visceral', 'Mulligan', 'Kaltenborn', 'Cyriax',
  'PNF', 'Bobath', 'Vojta', 'Kinesio Taping', 'Dry Needling',
  'Manuální terapie', 'Mobilizace', 'Manipulace'
];

// Languages with coverage requirements
const LANGUAGES = {
  'cs': 100, // All speak Czech
  'en': 25,  // 25+ with English
  'de': 8,   // 8+ with German
  'uk': 10,  // 10+ with Ukrainian
  'ru': 15,  // 15+ with Russian
  'sk': 12,  // 12+ with Slovak
  'pl': 5,   // 5+ with Polish
  'fr': 3,   // 3+ with French
  'es': 2    // 2+ with Spanish
};

// Price ranges: ~30 low, ~50 medium, ~20 high
const PRICE_RANGES = {
  'low': { min: 500, max: 800, count: 30 },
  'medium': { min: 800, max: 1200, count: 50 },
  'high': { min: 1200, max: 2000, count: 20 }
};

// Age groups and accessibility
const AGE_GROUPS = {
  'children': 20,      // 20+ children specialists
  'adults': 60,        // 60+ adult specialists  
  'seniors': 25,       // 25+ senior-friendly
  'accessibility': 25  // 25+ with accessibility
};

// Czech names for realistic data
const FIRST_NAMES = {
  male: ['Jan', 'Petr', 'Pavel', 'Tomáš', 'Martin', 'Jaroslav', 'Lukáš', 'Michal', 'David', 'Jiří', 'Ondřej', 'Jakub', 'Adam', 'Filip', 'Václav'],
  female: ['Anna', 'Marie', 'Eva', 'Jana', 'Hana', 'Věra', 'Alena', 'Lenka', 'Kateřina', 'Lucie', 'Markéta', 'Zuzana', 'Petra', 'Monika', 'Irena']
};

const LAST_NAMES = [
  'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kratochvíl', 'Veselý', 'Horák', 'Němec',
  'Pokorný', 'Pospíšil', 'Hájek', 'Jelínek', 'Růžička', 'Beneš', 'Fiala', 'Sedláček', 'Doležal', 'Zeman'
];

// City coordinates
const CITY_COORDINATES = {
  'Praha': { lat: 50.0755, lon: 14.4378 },
  'Brno': { lat: 49.1951, lon: 16.6068 },
  'Ostrava': { lat: 49.8209, lon: 18.2625 },
  'Plzeň': { lat: 49.7384, lon: 13.3736 },
  'Olomouc': { lat: 49.5938, lon: 17.2509 },
  'České Budějovice': { lat: 48.9745, lon: 14.4747 },
  'Hradec Králové': { lat: 50.2104, lon: 15.8252 },
  'Liberec': { lat: 50.7663, lon: 15.0543 },
  'Pardubice': { lat: 50.0343, lon: 15.7812 },
  'Ústí nad Labem': { lat: 50.6611, lon: 14.0531 },
  'Zlín': { lat: 49.2264, lon: 17.6707 }
};

// Insurance companies
const INSURANCE_COMPANIES = ['VZP', 'ZPMV', 'OZP', 'RBP', 'VOZP', 'CPZP', 'ZPŠ', 'ZP MV ČR'];

// Practice types
const PRACTICE_TYPES = ['private', 'clinic', 'hospital', 'home_visits', 'online'];

// Works with groups
const WORKS_WITH_GROUPS = [
  'těhotné', 'sportovci', 'senioři', 'děti', 'dospívající',
  'profesionální sportovci', 'rekreanti', 'pracovní úrazy', 'dopravní nehody'
];

// Diagnoses
const DIAGNOSES = [
  'Bechtěrev', 'Skolióza', 'Výhřez ploténky', 'Roztroušená skleróza',
  'Osteoporóza', 'Po operaci menisku', 'Po úrazu kotníku'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateName() {
  const gender = Math.random() < 0.4 ? 'male' : 'female';
  const firstName = getRandomElement(FIRST_NAMES[gender]);
  const lastName = getRandomElement(LAST_NAMES);
  return {
    name: `${firstName} ${lastName}`,
    gender: gender
  };
}

function generateTherapist(id, city, condition, priceRange, languageRequirements) {
  const nameData = generateName();
  const coords = CITY_COORDINATES[city];
  
  // Add small random offset to coordinates for variety
  const latitude = coords.lat + (Math.random() - 0.5) * 0.1;
  const longitude = coords.lon + (Math.random() - 0.5) * 0.1;
  
  const yearsExperience = Math.floor(Math.random() * 25) + 3; // 3-27 years
  const pricePerSession = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
  
  // Generate languages based on requirements
  const languages = ['cs']; // All speak Czech
  if (languageRequirements.en > 0) languages.push('en');
  if (languageRequirements.de > 0) languages.push('de');
  if (languageRequirements.uk > 0) languages.push('uk');
  if (languageRequirements.ru > 0) languages.push('ru');
  if (languageRequirements.sk > 0) languages.push('sk');
  if (languageRequirements.pl > 0) languages.push('pl');
  if (languageRequirements.fr > 0) languages.push('fr');
  if (languageRequirements.es > 0) languages.push('es');
  
  // Add random additional languages
  const additionalLangs = getRandomElements(['en', 'de', 'sk', 'ru', 'uk'], Math.floor(Math.random() * 3));
  additionalLangs.forEach(lang => {
    if (!languages.includes(lang)) languages.push(lang);
  });
  
  // Generate specialties (1-3 conditions)
  const specialties = [condition];
  const otherConditions = CONDITIONS.filter(c => c !== condition);
  const additionalSpecialties = getRandomElements(otherConditions, Math.floor(Math.random() * 2));
  specialties.push(...additionalSpecialties);
  
  // Generate modalities (1-4)
  const modalities = getRandomElements(MODALITIES, Math.floor(Math.random() * 4) + 1);
  
  // Generate works with (1-3 groups)
  const worksWith = getRandomElements(WORKS_WITH_GROUPS, Math.floor(Math.random() * 3) + 1);
  
  // Generate diagnoses (0-3)
  const diagnoses = getRandomElements(DIAGNOSES, Math.floor(Math.random() * 4));
  
  // Generate tags for search
  const tags = [
    city,
    ...modalities.slice(0, 2),
    condition,
    ...worksWith.slice(0, 2)
  ];
  
  // Generate diagnosis tags
  const diagnosisTags = [...diagnoses];
  
  // Generate rating
  const rating = {
    average: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5-5.0
    count: Math.floor(Math.random() * 200) + 10 // 10-210 reviews
  };
  
  // Generate availability
  const nextAvailableDays = Math.floor(Math.random() * 14) + 1; // 1-14 days
  
  // Generate working hours
  const workingHours = {
    morning: Math.random() < 0.8,
    midday: Math.random() < 0.9,
    evening: Math.random() < 0.6,
    weekend: Math.random() < 0.4
  };
  
  // Generate practice type
  const practiceType = getRandomElement(PRACTICE_TYPES);
  
  // Generate insurance accepted
  const insuranceAccepted = getRandomElements(INSURANCE_COMPANIES, Math.floor(Math.random() * 4) + 1);
  
  // Generate clinic name
  const clinicName = `${getRandomElement(['Fyzioterapie', 'Rehabilitace', 'Centrum', 'Ordinace'])} ${city}`;
  
  // Generate address
  const address = `${getRandomElement(['Náměstí', 'Třída', 'Ulice', 'Národní'])} ${Math.floor(Math.random() * 200) + 1}, ${city}`;
  
  // Generate phone
  const phone = `+420 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`;
  
  // Generate email
  const email = `${nameData.name.toLowerCase().replace(' ', '.')}@${getRandomElement(['fyzio', 'rehab', 'centrum'])}.cz`;
  
  // Generate postal code
  const postalCode = `${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10}`;
  
  // Generate home visit radius
  const homeVisitRadiusKm = Math.floor(Math.random() * 30) + 5; // 5-35 km
  
  return {
    id: `t${id.toString().padStart(3, '0')}`,
    fullName: nameData.name,
    city: city,
    regions: [city === 'Praha' ? 'Praha' : getRandomElement(['Středočeský', 'Jihomoravský', 'Moravskoslezský', 'Plzeňský', 'Olomoucký'])],
    latitude: latitude,
    longitude: longitude,
    practiceType: practiceType,
    acceptingNew: Math.random() < 0.8, // 80% accepting new patients
    yearsExperience: yearsExperience,
    pricePerSession: pricePerSession,
    priceRange: { minCZK: priceRange.min, maxCZK: priceRange.max },
    languages: languages,
    specialties: specialties,
    diagnoses: diagnoses,
    modalities: modalities,
    worksWith: worksWith,
    tags: tags,
    diagnosisTags: diagnosisTags,
    rating: rating,
    nextAvailableDays: nextAvailableDays,
    workingHours: workingHours,
    clinicName: clinicName,
    address: address,
    phone: phone,
    email: email,
    insuranceAccepted: insuranceAccepted,
    isVerified: Math.random() < 0.9, // 90% verified
    postalCode: postalCode,
    homeVisitRadiusKm: homeVisitRadiusKm,
    isFixture: true
  };
}

function generateDataset() {
  const therapists = [];
  let id = 1;
  
  // Track language requirements
  const languageCounts = {
    en: 0, de: 0, uk: 0, ru: 0, sk: 0, pl: 0, fr: 0, es: 0
  };
  
  // Track age group requirements
  const ageGroupCounts = {
    children: 0,
    adults: 0,
    seniors: 0,
    accessibility: 0
  };
  
  // Track price range requirements
  const priceRangeCounts = {
    low: 0,
    medium: 0,
    high: 0
  };
  
  // Generate therapists for each city
  for (const [city, count] of Object.entries(CITY_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      // Select condition (ensure each condition gets 8-12 therapists)
      const condition = getRandomElement(CONDITIONS);
      
      // Select price range based on requirements
      let priceRange;
      if (priceRangeCounts.low < PRICE_RANGES.low.count) {
        priceRange = PRICE_RANGES.low;
        priceRangeCounts.low++;
      } else if (priceRangeCounts.medium < PRICE_RANGES.medium.count) {
        priceRange = PRICE_RANGES.medium;
        priceRangeCounts.medium++;
      } else if (priceRangeCounts.high < PRICE_RANGES.high.count) {
        priceRange = PRICE_RANGES.high;
        priceRangeCounts.high++;
      } else {
        priceRange = getRandomElement(Object.values(PRICE_RANGES));
      }
      
      // Select language requirements
      const languageRequirements = {};
      for (const [lang, required] of Object.entries(LANGUAGES)) {
        if (lang === 'cs') continue; // All speak Czech
        languageRequirements[lang] = languageCounts[lang] < required ? 1 : 0;
      }
      
      // Generate therapist
      const therapist = generateTherapist(id, city, condition, priceRange, languageRequirements);
      
      // Update language counts
      therapist.languages.forEach(lang => {
        if (languageCounts[lang] !== undefined) {
          languageCounts[lang]++;
        }
      });
      
      // Update age group counts
      if (therapist.worksWith.includes('děti')) ageGroupCounts.children++;
      if (therapist.worksWith.includes('senioři')) ageGroupCounts.seniors++;
      if (therapist.worksWith.includes('těhotné')) ageGroupCounts.accessibility++;
      
      therapists.push(therapist);
      id++;
    }
  }
  
  return therapists;
}

// Generate the dataset
const dataset = generateDataset();

// Write to file
const outputPath = path.join(__dirname, '..', 'data', 'fake-therapists-complete.json');
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

console.log(`Generated ${dataset.length} therapist profiles`);
console.log(`Written to: ${outputPath}`);

// Generate summary report
const summary = {
  total: dataset.length,
  cities: {},
  conditions: {},
  languages: {},
  priceRanges: {},
  ageGroups: {},
  modalities: {}
};

// Count distributions
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
});

console.log('\n=== DATASET SUMMARY ===');
console.log(JSON.stringify(summary, null, 2));

// Generate test scenarios
const testScenarios = [
  {
    name: 'Praha + Bolest zad',
    criteria: { city: 'Praha', condition: 'Bolesti zad / krku' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Brno + Koleno + Sport',
    criteria: { city: 'Brno', condition: 'Bolesti kloubů', worksWith: 'sportovci' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Ostrava + Online + AJ',
    criteria: { city: 'Ostrava', practiceType: 'online', language: 'en' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Plzeň + Těhotenství',
    criteria: { city: 'Plzeň', condition: 'Těhotenství / po porodu' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Olomouc + Rehabilitace',
    criteria: { city: 'Olomouc', condition: 'Rehabilitace po operaci' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Praha + DNS + Nízká cena',
    criteria: { city: 'Praha', modality: 'DNS', priceRange: 'low' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Brno + Děti + Vojta',
    criteria: { city: 'Brno', worksWith: 'děti', modality: 'Vojta' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Ostrava + Senioři + Bezbariérový',
    criteria: { city: 'Ostrava', worksWith: 'senioři', accessibility: true },
    expected: '2-3+ candidates'
  },
  {
    name: 'Praha + Ukrajinština',
    criteria: { city: 'Praha', language: 'uk' },
    expected: '2-3+ candidates'
  },
  {
    name: 'Brno + Němčina + Vysoká cena',
    criteria: { city: 'Brno', language: 'de', priceRange: 'high' },
    expected: '2-3+ candidates'
  }
];

console.log('\n=== TEST SCENARIOS ===');
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}: ${scenario.expected}`);
});

console.log('\nDataset generation complete!');
