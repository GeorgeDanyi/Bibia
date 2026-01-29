import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Use relative import to avoid TS path alias resolution issues during scripts
import { CITIES, REGIONS, DIAGNOSES, ISSUES } from '../lib/constants/taxonomy';
import { validateTherapists } from '../src/lib/validation/therapistSchema';

// Map city to region (simple heuristic/fallback)
const cityToRegion: Record<string, string> = {
  'Praha': 'Praha',
  'Brno': 'Jihomoravský',
  'Ostrava': 'Moravskoslezský',
  'Plzeň': 'Plzeňský',
  'Liberec': 'Liberecký',
  'Olomouc': 'Olomoucký',
  'České Budějovice': 'Jihočeský',
  'Hradec Králové': 'Královéhradecký',
  'Ústí nad Labem': 'Ústecký',
  'Pardubice': 'Pardubický'
};

// Normalized specialties mapping
const issueToTag: Record<string, string> = {
  'Bolesti zad / krku': 'backNeck',
  'Bolesti kloubů': 'joints',
  'Bolesti svalů / šlach': 'muscles',
  'Bolesti hlavy / migrény': 'headaches',
  'Sportovní úraz': 'sportsInjury',
  'Rehabilitace po operaci': 'postSurgery',
  'Rehabilitace po úrazu': 'postTrauma',
  'Těhotenství / po porodu': 'pregnancyPostpartum',
  'Dlouhodobé onemocnění / diagnóza': 'chronicCondition',
  'Jiné potíže': 'other'
};

const languageSets = [ ['cs'], ['cs','en'], ['cs','sk'] ];
const modalityPool = ['DNS','McKenzie','Manual','Trigger points','Visceral','SM systém'];
const worksWithPool = ['těhotné','sportovci','senioři','děti'];

function pickN<T>(arr: readonly T[] | T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max });
  return faker.helpers.shuffle([...arr]).slice(0, count);
}

function randomSlots(): string[] {
  const possible = [
    '07:00-11:00','08:00-12:00','09:00-12:00','12:00-16:00','13:00-17:00','14:00-18:00'
  ];
  return pickN(possible, 1, 2);
}

function randomAvailability() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat'] as const;
  const used = new Set<string>();
  const entries: { day: string; slots: string[] }[] = [];
  const numDays = faker.number.int({ min: 3, max: 5 });
  while (entries.length < numDays) {
    const day = faker.helpers.arrayElement(days);
    if (used.has(day)) continue;
    used.add(day);
    entries.push({ day, slots: randomSlots() });
  }
  return entries;
}

function toOneDecimal(n: number) { return Math.round(n * 10) / 10; }

function generateTherapist() {
  const fullName = faker.person.fullName();
  const cityEntry = faker.helpers.arrayElement(CITIES);
  const city = cityEntry.city;
  const region = cityEntry.region;
  const languages = faker.helpers.arrayElement(languageSets);
  const yearsExperience = faker.number.int({ min: 1, max: 25 });
  const pricePerSession = faker.number.int({ min: 700, max: 1600 });
  const availability = randomAvailability();
  const specialtiesRaw = pickN(ISSUES as unknown as string[], 2, 4);
  const specialties = specialtiesRaw.map(i => issueToTag[i] || 'other');
  const diagnoses = pickN(DIAGNOSES as unknown as string[], 0, 3);
  const modalities = pickN(modalityPool, 1, 3);
  const worksWith = pickN(worksWithPool, 1, 3);
  const rating = faker.number.float({ min: 4.2, max: 5, fractionDigits: 1 });
  const reviewsCount = faker.number.int({ min: 10, max: 250 });
  const bio = faker.lorem.sentences(faker.number.int({ min: 1, max: 2 }));

  // Generate coordinates for the city (simplified)
  const cityCoords = {
    'Praha': { lat: 50.0755, lng: 14.4378 },
    'Brno': { lat: 49.1951, lng: 16.6068 },
    'Ostrava': { lat: 49.8209, lng: 18.2625 },
    'Plzeň': { lat: 49.7384, lng: 13.3736 },
    'Liberec': { lat: 50.7663, lng: 15.0543 },
    'Olomouc': { lat: 49.5938, lng: 17.2509 },
    'České Budějovice': { lat: 48.9745, lng: 14.4747 },
    'Hradec Králové': { lat: 50.2104, lng: 15.8252 },
    'Ústí nad Labem': { lat: 50.6611, lng: 14.0531 },
    'Pardubice': { lat: 50.0343, lng: 15.7812 }
  };

  const coords = cityCoords[city as keyof typeof cityCoords] || { lat: 50.0755, lng: 14.4378 };

  return {
    id: uuidv4(),
    name: fullName, // Changed from fullName to name to match schema
    city,
    postalCode: faker.location.zipCode('### ##'),
    latitude: coords.lat,
    longitude: coords.lng,
    practiceType: faker.helpers.arrayElement(['clinic', 'home', 'online']),
    diagnosisTags: diagnoses,
    tags: specialties,
    languages,
    acceptingNew: faker.datatype.boolean(),
    nextAvailableDays: faker.number.int({ min: 0, max: 30 }),
    priceRange: `${pricePerSession - 200}-${pricePerSession + 200}`,
    isFixture: true,
    // Keep additional fields for backward compatibility
    regions: [city, region],
    yearsExperience,
    pricePerSession,
    availability,
    specialties,
    modalities,
    worksWith,
    rating,
    reviewsCount,
    bio
  };
}

function main() {
  // Ensure Czech locale
  (faker as any).setDefaultLocale?.('cs');
  const count = 100;
  const data = Array.from({ length: count }, generateTherapist);
  // Ensure coverage: inject at least 2 therapists for each key diagnosis & issue
  const requiredIssues = Object.values(issueToTag);
  const requiredLangs = languageSets;
  const requiredWork = worksWithPool;
  const ensureSet: any[] = [];
  for (const tag of requiredIssues) {
    ensureSet.push({ ...generateTherapist(), tags: [tag] }); // Changed specialties to tags
  }
  for (const langs of requiredLangs) {
    ensureSet.push({ ...generateTherapist(), languages: langs });
  }
  for (const group of requiredWork) {
    ensureSet.push({ ...generateTherapist(), worksWith: [group] });
  }
  const merged = [...data, ...ensureSet].slice(0, count);
  
  // Validate therapist data before writing
  console.log('🔍 Validating therapist data...');
  const validation = validateTherapists(merged);
  
  if (validation.bad.length > 0) {
    console.log('❌ Validation failed! Found invalid therapist records:');
    validation.bad.forEach((badRecord, index) => {
      console.log(`\n📋 Invalid Record ${index + 1}:`);
      console.log(`   ID: ${badRecord.r.id || 'MISSING'}`);
      console.log(`   Name: ${badRecord.r.name || 'MISSING'}`);
      console.log(`   City: ${badRecord.r.city || 'MISSING'}`);
      console.log(`   Issues:`);
      badRecord.issues.forEach((issue: any) => {
        console.log(`     - ${issue.path.join('.')}: ${issue.message}`);
      });
    });
    console.log(`\n❌ Import aborted due to ${validation.bad.length} invalid records.`);
    console.log(`✅ Valid records: ${validation.ok.length}`);
    console.log(`❌ Invalid records: ${validation.bad.length}`);
    process.exit(1);
  }
  
  console.log(`✅ Validation passed! All ${validation.ok.length} records are valid.`);
  
  const outDir = path.join(process.cwd(), 'data');
  const outPath = path.join(outDir, 'therapists.json');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`💾 Wrote ${merged.length} therapists to ${outPath}`);
}

main();
