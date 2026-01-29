# Questionnaire V1 - Czech Implementation

## Overview
A short, friendly Czech questionnaire (≤ 5 min) with 6 steps and clear mapping to search schema.

## Structure

### Step 1: Lokalita & forma péče
- **City Selection**: Dropdown with major Czech cities (Praha, Brno, Ostrava, etc.)
- **Visit Type**: Multi-select between "Osobně" (in-person) and "Online"
- **Required**: Both city and at least one visit type

### Step 2: Důvod návštěvy (S čím ti můžeme pomoct?)
- **Main Condition**: Single select from 10 common conditions:
  - Bolest zad, Krční páteř, Rameno, Koleno
  - Po úrazu, Po operaci, Sportovní přetížení
  - Dětské obtíže, Těhotenství/po porodu
  - Jiná/nejsem si jistý/á
- **Additional Conditions**: Optional multi-select tags (Akutní bolest, Chronická bolest, etc.)
- **Required**: Main condition

### Step 3: Preferované přístupy/modality
- **Modalities**: Optional multi-select checkboxes:
  - DNS, Vojta, McKenzie, Manuální terapie
  - Mobilizace, Kineziotaping, Dechová terapie
  - Sportovní fyzio, Žádná preference
- **Required**: None (optional step)

### Step 4: Dostupnost & rychlost nástupu
- **Time Slots**: Multi-select from:
  - Ráno (7–11), Odpoledne (11–17), Večer (17–20), Víkend
- **Booking Speed**: Single select:
  - Co nejdřív (1–3 dny), Tento týden, Nespěchá
- **Required**: At least one time slot and booking speed

### Step 5: Jazyk, cena, pojišťovna
- **Languages**: Multi-select from:
  - Čeština, Angličtina, Ukrajinština, Ruština, Němčina
- **Price Range**: Single select:
  - Nízká (do 800 Kč/hod), Střední (800–1200 Kč/hod), Vyšší (nad 1200 Kč/hod)
- **Insurance**: Optional multi-select:
  - VZP, OZP, ZPMV, ČPZP, ZP MV ČR, Self-pay
- **Required**: At least one language and price range

### Step 6: Speciální potřeby
- **Age Groups**: Multi-select from:
  - Dítě (do 18 let), Dospělý/á (18–65 let), Senior/ka (nad 65 let)
- **Accessibility**: Multi-select:
  - Ano (bezbariérový přístup), Ne
- **Consent**: Required checkbox for data processing
- **Required**: At least one age group and consent

## Data Mapping

The questionnaire maps to search criteria as follows:

```typescript
{
  city: string,                    // From Step 1
  practice: 'online' | 'in-person', // From Step 1 visitType
  conditions: string[],            // From Step 2 (main + additional)
  modalities: string[],            // From Step 3
  availability: string,            // From Step 4 (comma-separated)
  acceptsNewClients: boolean,      // From Step 4 bookingSpeed
  languages: string[],             // From Step 5
  priceRange: string,              // From Step 5
  insurance: string[],             // From Step 5
  ageGroups: string[],             // From Step 6
  workplaceAccessibility: string[] // From Step 6
}
```

## Validation Rules

- **Step 1**: City required, at least one visit type
- **Step 2**: Main condition required
- **Step 3**: No validation (optional)
- **Step 4**: At least one time slot and booking speed
- **Step 5**: At least one language and price range
- **Step 6**: At least one age group and consent required

## Features

- **Progress Tracking**: Visual progress circle and step indicators
- **Local Storage**: Saves progress automatically
- **Responsive Design**: Works on mobile and desktop
- **Czech Language**: All content in Czech with informal tone (tykání)
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Validation**: Real-time validation with helpful error messages

## Usage

Access the questionnaire at `/questionnaire-v1` or integrate with the main questionnaire flow using the `?v1=true` parameter.

## Files

- `page.tsx` - Main page component with Suspense wrapper
- `QuestionnaireV1Client.tsx` - Main questionnaire component
- `QuestionnaireV1Context.tsx` - Context provider and state management
- `steps.ts` - Step definitions and constants
- `README.md` - This documentation
