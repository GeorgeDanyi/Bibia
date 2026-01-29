# Data Model v1 - Therapist Schema & Questionnaire Mapping

## 🎯 Cíl
Definovat normalizované schéma terapeuta a mapování dotazníku → schéma pro optimální vyhledávání a doporučování.

---

## 📋 Therapist Schema (Normalized)

### Core Fields (Required)

```typescript
interface TherapistV1 {
  // === IDENTIFICATION ===
  id: string                    // UUID, unique identifier
  fullName: string             // "Jan Novák"
  gender: 'male' | 'female'    // Required for gender preference matching
  
  // === LOCATION ===
  city: string                 // "Praha", "Brno", "online"
  lat: number                  // Latitude coordinate
  lng: number                  // Longitude coordinate
  
  // === PRACTICE TYPE ===
  visitType: VisitType[]       // ["osobně", "online"] - multiple allowed
  acceptsNewClients: boolean   // Currently accepting new patients
  
  // === PRICING ===
  priceRange: PriceLevel       // "low" | "medium" | "high"
  
  // === INSURANCE & LANGUAGES ===
  insurance: InsuranceCompany[] // ["VZP", "OZP", "private"]
  languages: Language[]        // ["cs", "en", "de"]
  
  // === SPECIALIZATIONS ===
  modalities: Modality[]       // ["DNS", "McKenzie", "Manuální terapie"]
  conditions: Condition[]      // ["bolest zad", "sportovní úraz", "těhotenství"]
  ageGroups: AgeGroup[]        // ["děti", "dospělí", "senioři"]
  
  // === ACCESSIBILITY ===
  workplaceAccessibility: Accessibility[] // ["bezbariérový vstup", "výtah"]
  
  // === AVAILABILITY ===
  availability: AvailabilityString // "ranní/odpolední/večer" - plain text
  
  // === RATING & EXPERIENCE ===
  rating: number               // 0-5 (decimal allowed)
  experienceYears: number      // Years of experience
  
  // === BOOKING OPTIONS ===
  bookingOptions: BookingOption[] // ["telefon", "formulář", "link"]
  
  // === EVIDENCE ===
  notesEvidence: Evidence[]    // ["certifikace", "recenze", "reference"]
}
```

### Field Definitions & Enums

#### VisitType
```typescript
type VisitType = "osobně" | "online"
```

#### PriceLevel
```typescript
type PriceLevel = "low" | "medium" | "high"
// low: 0-800 CZK
// medium: 800-1200 CZK  
// high: 1200+ CZK
```

#### InsuranceCompany
```typescript
type InsuranceCompany = 
  | "VZP"      // Všeobecná zdravotní pojišťovna
  | "ZPMV"     // Zdravotní pojišťovna ministerstva vnitra
  | "OZP"      // Oborová zdravotní pojišťovna
  | "RBP"      // Revírní bratrská pokladna
  | "VOZP"     // Vojenská zdravotní pojišťovna
  | "CPZP"     // Česká průmyslová zdravotní pojišťovna
  | "ZPŠ"      // Zdravotní pojišťovna Škoda
  | "ZP MV ČR" // Zdravotní pojišťovna ministerstva vnitra ČR
  | "private"  // Soukromé platby
```

#### Language
```typescript
type Language = "cs" | "en" | "de" | "sk" | "pl" | "ru" | "fr" | "es"
```

#### Modality
```typescript
type Modality = 
  | "DNS"              // Dynamická neuromuskulární stabilizace
  | "McKenzie"         // McKenzie metoda
  | "Visceral"         // Viscerální terapie
  | "Mulligan"         // Mulligan koncept
  | "Kaltenborn"       // Kaltenborn-Evjenth koncept
  | "Cyriax"           // Cyriax koncept
  | "PNF"              // Proprioceptivní neuromuskulární facilitace
  | "Bobath"           // Bobath koncept
  | "Vojta"            // Vojta terapie
  | "Kinesio Taping"   // Kinesio taping
  | "Dry Needling"     // Suché jehly
  | "Manuální terapie" // Manuální terapie
  | "Mobilizace"       // Mobilizace
  | "Manipulace"       // Manipulace
  | "Sportovní"        // Sportovní fyzioterapie
  | "Rehabilitace"     // Rehabilitace
```

#### Condition
```typescript
type Condition = 
  | "bolest zad"           // Bolesti zad / krku
  | "bolest kloubů"        // Bolesti kloubů
  | "bolest svalů"         // Bolesti svalů / šlach
  | "bolest hlavy"         // Bolesti hlavy / migrény
  | "sportovní úraz"       // Sportovní úraz
  | "po operaci"           // Rehabilitace po operaci
  | "po úrazu"             // Rehabilitace po úrazu
  | "těhotenství"          // Těhotenství / po porodu
  | "chronické onemocnění" // Dlouhodobé onemocnění / diagnóza
  | "jiné potíže"          // Jiné potíže
```

#### AgeGroup
```typescript
type AgeGroup = "děti" | "dospělí" | "senioři"
```

#### Accessibility
```typescript
type Accessibility = 
  | "bezbariérový vstup"    // Bezbariérový vstup
  | "výtah"                // Výtah
  | "parkování"            // Parkování
  | "MHD dostupnost"       // MHD dostupnost
  | "WC pro vozíčkáře"     // WC pro vozíčkáře
```

#### BookingOption
```typescript
type BookingOption = "telefon" | "formulář" | "link"
```

#### Evidence
```typescript
type Evidence = 
  | "certifikace"    // Odborné certifikace
  | "recenze"        // Klient recenze
  | "reference"      // Reference od lékařů
  | "vzdělání"       // Vzdělání a kvalifikace
  | "praxe"          // Praxe a zkušenosti
```

---

## 🗺️ Questionnaire → Schema Mapping

### Step 1: Conditions (Problémy)
```typescript
// Questionnaire Answer
conditions: string[] // ["backNeck", "joints", "sports"]

// Maps to Schema
therapist.conditions: Condition[] // ["bolest zad", "bolest kloubů", "sportovní úraz"]
```

**Mapping Table:**
| Questionnaire | Schema |
|---------------|--------|
| "backNeck" | "bolest zad" |
| "joints" | "bolest kloubů" |
| "muscles" | "bolest svalů" |
| "headache" | "bolest hlavy" |
| "sports" | "sportovní úraz" |
| "postOp" | "po operaci" |
| "postInjury" | "po úrazu" |
| "pregnancy" | "těhotenství" |
| "chronic" | "chronické onemocnění" |
| "other" | "jiné potíže" |

### Step 2: Location (Místo)
```typescript
// Questionnaire Answer
location: {
  type: 'online' | 'clinic' | 'home' | 'any'
  city?: string
  coords?: { lat: number, lon: number }
}

// Maps to Schema
therapist.visitType: VisitType[] // ["osobně"] or ["online"] or ["osobně", "online"]
therapist.city: string // city from questionnaire or "online"
therapist.lat/lng: number // coords from questionnaire
```

**Mapping Logic:**
- `type: 'online'` → `visitType: ["online"]`, `city: "online"`
- `type: 'clinic'` → `visitType: ["osobně"]`, `city: city from questionnaire`
- `type: 'home'` → `visitType: ["osobně"]`, `city: city from questionnaire`
- `type: 'any'` → `visitType: ["osobně", "online"]`, `city: city from questionnaire`

### Step 3: Radius (Vzdálenost)
```typescript
// Questionnaire Answer
radius: number // 5, 10, 20, 30, 50

// Maps to Schema
// Used for distance filtering in search algorithm
// No direct schema field mapping
```

### Step 4: Availability (Dostupnost)
```typescript
// Questionnaire Answer
availability: {
  timeSlots: string[] // ["morning", "afternoon", "evening"]
  weekdays: string[]  // ["Mon", "Wed", "Fri"]
}

// Maps to Schema
therapist.availability: AvailabilityString // "ranní/odpolední/večer"
```

**Mapping Table:**
| Questionnaire | Schema |
|---------------|--------|
| "morning" | "ranní" |
| "afternoon" | "odpolední" |
| "evening" | "večer" |

### Step 5: Preferences (Preference)
```typescript
// Questionnaire Answer
preferences: {
  gender?: 'male' | 'female' | 'any'
  languages: string[]        // ["cs", "en"]
  experiences: string[]      // ["sports", "seniors"]
  diagnosis?: string         // "skolióza"
}

// Maps to Schema
therapist.gender: 'male' | 'female' // Direct mapping
therapist.languages: Language[]     // Direct mapping
therapist.modalities: Modality[]    // From experiences
therapist.conditions: Condition[]   // From diagnosis
```

**Experiences → Modalities Mapping:**
| Questionnaire | Schema |
|---------------|--------|
| "sports" | "Sportovní" |
| "seniors" | "Rehabilitace" |
| "pregnancy" | "Rehabilitace" |
| "children" | "Rehabilitace" |

**Diagnosis → Conditions Mapping:**
| Questionnaire | Schema |
|---------------|--------|
| "skolióza" | "chronické onemocnění" |
| "výhřez ploténky" | "bolest zad" |
| "sportovní úraz" | "sportovní úraz" |

---

## 📊 JSON Specification

### Complete Schema with Enums
```json
{
  "therapistSchema": {
    "id": "string (UUID)",
    "fullName": "string",
    "gender": "enum: ['male', 'female']",
    "city": "string",
    "lat": "number",
    "lng": "number",
    "visitType": "array of enum: ['osobně', 'online']",
    "acceptsNewClients": "boolean",
    "priceRange": "enum: ['low', 'medium', 'high']",
    "insurance": "array of enum: ['VZP', 'ZPMV', 'OZP', 'RBP', 'VOZP', 'CPZP', 'ZPŠ', 'ZP MV ČR', 'private']",
    "languages": "array of enum: ['cs', 'en', 'de', 'sk', 'pl', 'ru', 'fr', 'es']",
    "modalities": "array of enum: ['DNS', 'McKenzie', 'Visceral', 'Mulligan', 'Kaltenborn', 'Cyriax', 'PNF', 'Bobath', 'Vojta', 'Kinesio Taping', 'Dry Needling', 'Manuální terapie', 'Mobilizace', 'Manipulace', 'Sportovní', 'Rehabilitace']",
    "conditions": "array of enum: ['bolest zad', 'bolest kloubů', 'bolest svalů', 'bolest hlavy', 'sportovní úraz', 'po operaci', 'po úrazu', 'těhotenství', 'chronické onemocnění', 'jiné potíže']",
    "ageGroups": "array of enum: ['děti', 'dospělí', 'senioři']",
    "workplaceAccessibility": "array of enum: ['bezbariérový vstup', 'výtah', 'parkování', 'MHD dostupnost', 'WC pro vozíčkáře']",
    "availability": "string (plain text: 'ranní/odpolední/večer')",
    "rating": "number (0-5)",
    "experienceYears": "number",
    "bookingOptions": "array of enum: ['telefon', 'formulář', 'link']",
    "notesEvidence": "array of enum: ['certifikace', 'recenze', 'reference', 'vzdělání', 'praxe']"
  }
}
```

### Questionnaire Mapping Rules
```json
{
  "questionnaireMapping": {
    "conditions": {
      "backNeck": "bolest zad",
      "joints": "bolest kloubů",
      "muscles": "bolest svalů",
      "headache": "bolest hlavy",
      "sports": "sportovní úraz",
      "postOp": "po operaci",
      "postInjury": "po úrazu",
      "pregnancy": "těhotenství",
      "chronic": "chronické onemocnění",
      "other": "jiné potíže"
    },
    "location": {
      "online": {"visitType": ["online"], "city": "online"},
      "clinic": {"visitType": ["osobně"], "city": "from questionnaire"},
      "home": {"visitType": ["osobně"], "city": "from questionnaire"},
      "any": {"visitType": ["osobně", "online"], "city": "from questionnaire"}
    },
    "availability": {
      "morning": "ranní",
      "afternoon": "odpolední",
      "evening": "večer"
    },
    "experiences": {
      "sports": "Sportovní",
      "seniors": "Rehabilitace",
      "pregnancy": "Rehabilitace",
      "children": "Rehabilitace"
    }
  }
}
```

---

## 🔄 Data Flow

```
Questionnaire Answers → Mapping Function → Search Criteria → Therapist Filtering → Results
```

### Example Mapping
```typescript
// Input: Questionnaire Answers
const answers = {
  conditions: ["backNeck", "sports"],
  location: { type: "clinic", city: "Praha", coords: { lat: 50.0755, lon: 14.4378 } },
  radius: 20,
  availability: { timeSlots: ["morning", "afternoon"], weekdays: ["Mon", "Wed"] },
  preferences: { gender: "female", languages: ["cs", "en"], experiences: ["sports"] }
}

// Output: Search Criteria
const searchCriteria = {
  conditions: ["bolest zad", "sportovní úraz"],
  visitType: ["osobně"],
  city: "Praha",
  lat: 50.0755,
  lng: 14.4378,
  maxDistance: 20,
  availability: "ranní/odpolední",
  gender: "female",
  languages: ["cs", "en"],
  modalities: ["Sportovní"]
}
```

---

## ✅ Acceptance Criteria

- [x] **Jedna definice schématu existuje a je „source of truth"** - tento dokument
- [x] **Každá otázka v dotazníku má jasnou mapu → schema fields** - kompletní mapping tabulky
- [x] **JSON specification s allowed values** - kompletní enum definice
- [x] **Normalizované schéma terapeuta** - všechny požadované fieldy definovány
- [x] **Mapování dotazníku na schéma** - každá otázka má jasnou mapu

---

*Poslední aktualizace: $(date)*
*Verze: 1.0*
