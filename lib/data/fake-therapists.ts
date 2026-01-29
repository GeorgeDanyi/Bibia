// Fake dataset seeding for 100 therapists with availability data
// Implements Part B requirements with realistic data distribution

// Avoid strict coupling to runtime Therapist interface for data generation
type AnyTherapist = any;

// Czech cities for realistic data
const CITIES = [
  'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice',
  'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín', 'Havířov', 'Kladno',
  'Most', 'Opava', 'Frýdek-Místek', 'Karviná', 'Jihlava', 'Teplice', 'Děčín'
];

// Therapist names for realistic data
const FIRST_NAMES = [
  'Anna', 'Petr', 'Marie', 'Jan', 'Jana', 'Tomáš', 'Eva', 'Pavel', 'Hana', 'Martin',
  'Lucie', 'Jiří', 'Kateřina', 'Michal', 'Alena', 'David', 'Lenka', 'Jakub', 'Jitka', 'Lukáš',
  'Monika', 'Ondřej', 'Zuzana', 'Marek', 'Jarmila', 'Roman', 'Dana', 'Václav', 'Ivana', 'Stanislav'
];

const LAST_NAMES = [
  'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec',
  'Pokorný', 'Pospíšil', 'Hájek', 'Jelínek', 'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček', 'Doležal'
];

// Specializations
const SPECIALIZATIONS = [
  'Sportovní fyzioterapie', 'Rehabilitace páteře', 'Dětská fyzioterapie', 'Těhotenská fyzioterapie',
  'Rehabilitace po úrazech', 'Lymfodrenáž', 'Manuální terapie', 'DNS terapie', 'McKenzie metoda',
  'Viscerální terapie', 'Kraniosakrální terapie', 'Reflexní terapie', 'Pilates', 'Jóga terapie'
];

// Generate random working hours with realistic patterns
function generateWorkingHours(): { morning: boolean; midday: boolean; evening: boolean; weekend: boolean } {
  const patterns = [
    // Standard office hours
    { morning: true, midday: true, evening: false, weekend: false },
    // Extended hours
    { morning: true, midday: true, evening: true, weekend: false },
    // Weekend worker
    { morning: false, midday: true, evening: true, weekend: true },
    // Full availability
    { morning: true, midday: true, evening: true, weekend: true },
    // Morning specialist
    { morning: true, midday: false, evening: false, weekend: false },
    // Evening specialist
    { morning: false, midday: false, evening: true, weekend: true }
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Generate next available days with realistic distribution (0-30 days max)
function generateNextAvailableDays(): number | null {
  // 15% not accepting new clients
  if (Math.random() < 0.15) {
    return null; // Will be handled by acceptingNew flag
  }
  
  // Realistic distribution: 0-30 days maximum (no absurd values)
  const weights = [
    { days: 0, weight: 0.05 },    // 5% available today
    { days: 1, weight: 0.10 },    // 10% available tomorrow
    { days: 2, weight: 0.15 },    // 15% available in 2 days
    { days: 3, weight: 0.20 },    // 20% available in 3 days
    { days: 4, weight: 0.15 },    // 15% available in 4 days
    { days: 5, weight: 0.10 },    // 10% available in 5 days
    { days: 7, weight: 0.10 },    // 10% available in 7 days
    { days: 10, weight: 0.08 },   // 8% available in 10 days
    { days: 14, weight: 0.05 },    // 5% available in 14 days
    { days: 21, weight: 0.02 }     // 2% available in 21 days
  ];
  
  const random = Math.random();
  let cumulative = 0;
  
  for (const item of weights) {
    cumulative += item.weight;
    if (random <= cumulative) {
      return item.days;
    }
  }
  
  return 7; // Fallback
}

// Generate random therapist data
function generateTherapist(id: number): AnyTherapist {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  
  // Generate coordinates within Czech Republic
  const lat = 48.5 + Math.random() * 3.5; // 48.5 to 52.0
  const lng = 12.0 + Math.random() * 8.0; // 12.0 to 20.0
  
  const acceptingNew = Math.random() > 0.15; // 85% accepting new clients
  const nextAvailableDays = acceptingNew ? generateNextAvailableDays() : null;
  
  // Generate 2-4 specializations
  const numSpecializations = 2 + Math.floor(Math.random() * 3);
  const specialties = SPECIALIZATIONS
    .sort(() => Math.random() - 0.5)
    .slice(0, numSpecializations);
  
  // Generate rating (skewed towards higher ratings)
  const rating = Math.max(3.0, Math.min(5.0, 3.5 + Math.random() * 1.5));
  const reviewsCount = Math.floor(Math.random() * 50) + 5;
  
  // Generate price (800-2000 CZK)
  const pricePerSession = 800 + Math.floor(Math.random() * 1200);
  
  // Generate years of experience (1-25 years)
  const yearsExperience = 1 + Math.floor(Math.random() * 25);
  
  return {
    id: `therapist-${id.toString().padStart(3, '0')}`,
    fullName: `${firstName} ${lastName}`,
    city,
    postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
    latitude: lat,
    longitude: lng,
    regions: [city],
    languages: ['cs', Math.random() > 0.7 ? 'en' : 'cs'],
    
    practiceType: ['private', 'clinic', 'hospital'][Math.floor(Math.random() * 3)] as any,
    acceptingNew,
    
    yearsExperience,
    pricePerSession,
    priceRange: {
      minCZK: pricePerSession,
      maxCZK: pricePerSession + Math.floor(Math.random() * 500)
    },
    
    // NEW AVAILABILITY FIELDS
    nextAvailableDays,
    workingHours: generateWorkingHours(),
    
    // Legacy availability (empty for now)
    availability: [],
    
    specialties,
    diagnoses: specialties.slice(0, Math.floor(Math.random() * 3)),
    tags: specialties,
    diagnosisTags: specialties.slice(0, Math.floor(Math.random() * 2)),
    modalities: ['Manuální terapie', 'DNS', 'McKenzie'][Math.floor(Math.random() * 3)] ? ['Manuální terapie'] : [],
    worksWith: ['dospělí', 'děti', 'sportovci'][Math.floor(Math.random() * 3)] ? ['dospělí'] : [],
    
    rating: {
      average: rating,
      count: reviewsCount
    },
    reviewsCount,
    
    bio: `Zkušený fyzioterapeut se specializací na ${specialties[0].toLowerCase()}. Praxe ${yearsExperience} let.`,
    
    profileImage: Math.random() > 0.3 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}` : undefined,
    clinicName: Math.random() > 0.5 ? `Ordinace ${lastName}` : undefined,
    address: `${Math.floor(Math.random() * 200) + 1}. května ${Math.floor(Math.random() * 50) + 1}, ${city}`,
    phone: `+420 ${Math.floor(Math.random() * 900000000) + 100000000}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.cz`,
    website: Math.random() > 0.7 ? `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.cz` : undefined,
    insuranceAccepted: Math.random() > 0.3 ? ['VZP', 'ZPMV', 'OZP'] : [],
    isVerified: Math.random() > 0.2, // 80% verified
    lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

// Generate 100 therapists
export function generateFakeTherapists(): AnyTherapist[] {
  const therapists: AnyTherapist[] = [];
  
  for (let i = 1; i <= 100; i++) {
    therapists.push(generateTherapist(i));
  }
  
  return therapists;
}

// Export the generated dataset
export const FAKE_THERAPISTS = generateFakeTherapists();

// Statistics about the generated dataset
export function getDatasetStats() {
  const total = FAKE_THERAPISTS.length;
  const acceptingNew = FAKE_THERAPISTS.filter(t => t.acceptingNew).length;
  const notAccepting = total - acceptingNew;
  
  const nextAvailableDays = FAKE_THERAPISTS
    .filter(t => t.acceptingNew && t.nextAvailableDays !== null)
    .map(t => t.nextAvailableDays!);
  
  const avgDays = nextAvailableDays.length > 0 
    ? nextAvailableDays.reduce((a, b) => a + b, 0) / nextAvailableDays.length 
    : 0;
  
  const workingHoursStats = {
    morning: FAKE_THERAPISTS.filter(t => t.workingHours.morning).length,
    midday: FAKE_THERAPISTS.filter(t => t.workingHours.midday).length,
    evening: FAKE_THERAPISTS.filter(t => t.workingHours.evening).length,
    weekend: FAKE_THERAPISTS.filter(t => t.workingHours.weekend).length
  };
  
  return {
    total,
    acceptingNew,
    notAccepting,
    notAcceptingPercentage: (notAccepting / total * 100).toFixed(1),
    avgNextAvailableDays: avgDays.toFixed(1),
    workingHoursStats
  };
}
