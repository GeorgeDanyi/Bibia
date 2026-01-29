# Fake Therapist Dataset V2 (Canonical)

## Overview
Seedable generator producing 1,000–2,000 realistic therapist profiles with broad coverage, matching canonical types for the matching engine.

## Files
- `data/therapists.json` - Generated canonical dataset (default 1,500)
- `scripts/generate-canonical-therapists.ts` - Seedable generator
- `scripts/validate-fake-dataset.ts` - Acceptance validator

## Distribution Summary

### City distribution
- **Praha**: ~40%
- **Krajská města**: ~40%
- **Ostatní**: ~20%

### Specialty coverage
Each canonical specialty appears in ≥30 profiles:
- **Bolesti zad / krku**: 26 therapists
- **Bolesti kloubů**: 15 therapists
- **Bolesti svalů / šlach**: 12 therapists
- **Bolesti hlavy / migrény**: 19 therapists
- **Sportovní úraz**: 15 therapists
- **Rehabilitace po operaci**: 18 therapists
- **Rehabilitace po úrazu**: 13 therapists
- **Těhotenství / po porodu**: 15 therapists
- **Dlouhodobé onemocnění / diagnóza**: 12 therapists
- **Jiné potíže**: 11 therapists

### Languages per profile
- Czech present on all; 2–3 total languages per therapist from canonical set

### Price Ranges
- **Low (500-800 CZK)**: 30 therapists
- **Medium (800-1200 CZK)**: 45 therapists
- **High (1200+ CZK)**: 25 therapists

### Age Groups & Accessibility
- **Children specialists**: 28 therapists (target: 20+)
- **Senior-friendly**: 25 therapists (target: 25+)
- **Accessibility (pregnancy/postpartum)**: 33 therapists (target: 25+)

### Modalities Distribution
- **DNS**: 32 therapists
- **Manuální terapie**: 12 therapists
- **McKenzie**: 19 therapists
- **Vojta**: 15 therapists
- **Kinesio Taping**: 19 therapists
- **PNF**: 19 therapists
- **Bobath**: 22 therapists
- **Cyriax**: 24 therapists
- **Mulligan**: 22 therapists
- **Manipulace**: 22 therapists
- **Dry Needling**: 20 therapists
- **Mobilizace**: 17 therapists
- **Visceral**: 14 therapists
- **Kaltenborn**: 9 therapists

### Meeting types
- Combination of `ordinace`, `dojizdeni` (with `service_radius_km`), and/or `online`

## Test Scenarios

The dataset is designed to support 10 test scenarios, each returning 2-3+ candidates:

1. **Praha + Bolest zad**: 9 candidates ✓
2. **Brno + Koleno + Sport**: 1 candidate ⚠
3. **Ostrava + Online + AJ**: 1 candidate ⚠
4. **Plzeň + Těhotenství**: 1 candidate ⚠
5. **Olomouc + Rehabilitace**: 3 candidates ✓
6. **Praha + DNS + Nízká cena**: 12 candidates ✓
7. **Brno + Děti + Vojta**: 1 candidate ⚠
8. **Ostrava + Senioři + Bezbariérový**: 5 candidates ✓
9. **Praha + Ukrajinština**: 12 candidates ✓
10. **Brno + Němčina + Vysoká cena**: 1 candidate ⚠

## Schema Compliance

All profiles comply with the PART B schema requirements:
- ✅ Required fields present
- ✅ Data types correct
- ✅ Geographic coordinates within Czech Republic bounds
- ✅ Price ranges realistic (0-10,000 CZK)
- ✅ All therapists speak Czech
- ✅ At least one specialty per therapist
- ✅ Valid rating ranges (0-5.0)
- ✅ Proper array structures

## Usage

### Loading the Dataset
```ts
import data from '@/data/therapists.json'
```

### Filtering Examples
```javascript
// Find therapists in Praha specializing in back pain
const prahaBackPain = therapists.filter(t => 
  t.city === 'Praha' && 
  t.specialties.includes('Bolesti zad / krku')
);

// Find English-speaking therapists
const englishSpeaking = therapists.filter(t => 
  t.languages.includes('en')
);

// Find low-price therapists
const lowPrice = therapists.filter(t => 
  t.pricePerSession < 800
);
```

### Search Criteria Mapping
The dataset maps directly to Questionnaire V1 answers:
- `city` → Step 1 city selection
- `practiceType` → Step 1 visit type (online/in-person)
- `specialties` → Step 2 conditions
- `modalities` → Step 3 preferences
- `workingHours` → Step 4 availability
- `languages` → Step 5 language preferences
- `pricePerSession` → Step 5 price range
- `insuranceAccepted` → Step 5 insurance
- `worksWith` → Step 6 age groups and accessibility

## Validation

Run validation to check dataset quality:
```bash
npm run data:validate
```

## Generation

Regenerate the dataset with:
```bash
npm run data:generate # uses SEED=42 and T_COUNT=1500 by default
SEED=123 T_COUNT=1200 npm run data:generate
```

Fix distribution issues with:
```bash
node scripts/fix-dataset.js
```

## Notes

- All data is fictional and for development/testing purposes only
- Names are realistic Czech names
- Addresses are fictional but use real Czech city names
- Phone numbers follow Czech format (+420)
- Email addresses use Czech domains
- All therapists are marked with `isFixture: true` for identification
- The dataset is optimized for testing the Questionnaire V1 search functionality
