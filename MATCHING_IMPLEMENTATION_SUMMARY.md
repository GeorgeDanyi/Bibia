# Matching Implementation Summary

## Overview

The matching logic has been refactored into a clean structure with clear separation between **hard filters** (must-pass criteria) and **soft scoring** (preference-based ranking).

## File Structure

**Main Module**: `lib/matching/findMatches.ts`

This module exports:
- `findMatches(answers, therapists)` - Main entry point
- `applyHardFilters(answers, therapists)` - Hard filter logic
- `applySoftScoring(answers, therapists)` - Soft scoring logic
- `sortByScore(scored)` - Sorting logic
- `convertToTherapist(indexed)` - Type conversion utility

## Hard Filters

Hard filters **completely exclude** therapists that don't meet the criteria. A therapist must pass ALL hard filters to be considered.

### 1. Meeting Type Support
- **Check**: Therapist must support the selected meeting type (`clinic` / `home` / `online`)
- **Exclusion**: If therapist doesn't offer the requested meeting type, they are excluded
- **Special case**: If user requests `clinic`, therapists that ONLY offer `online` or `home_visit` are excluded

### 2. Location/Radius
- **Check**: For in-person meetings (`clinic` or `home`), therapist must be within the specified radius
- **Exclusion**: If therapist is outside the radius (or distance cannot be calculated), they are excluded
- **Exception**: Online meetings skip this check
- **Home visits**: Uses therapist's `serviceRadiusKm` if available

### 3. Age Group Support
- **Check**: Therapist must support the requested age group (`child` / `adult` / `senior`)
- **Exclusion**: If therapist doesn't work with the requested age group, they are excluded
- **Note**: `adult` is always supported (no explicit check needed)

### 4. Barrier-Free Requirement
- **Check**: If `answers.barrierFree === true` and meeting type is in-person, therapist must have `barrier_free: true`
- **Exclusion**: If barrier-free is required but therapist is not barrier-free, they are excluded
- **Exception**: Online meetings skip this check

### 5. Strict Gender Matching
- **Check**: If `answers.strictGender === true` AND `answers.genderPreference !== 'any'`, therapist gender must match exactly
- **Exclusion**: If strict gender is enabled and therapist gender doesn't match, they are excluded
- **Note**: If `strictGender === false` or `genderPreference === 'any'`, this filter is not applied

## Soft Scoring

Soft scoring **influences ranking** but does NOT exclude therapists. All therapists that pass hard filters are scored and returned.

### Scoring Components (0-100 total)

1. **Problem Area Match** (20% of total)
   - Checks if therapist's `issues` include the user's `problemArea`
   - Score: 1.0 if match, 0.3 if no match, 0.5 if no problem area specified

2. **Problem Detail/Diagnosis Match** (20% of total)
   - Checks therapist's `diagnoses` (canonicalIds, synonyms, categories) against `problemDetail`
   - Score: 1.0 for canonical ID match, 0.9 for synonym match, 0.7 for category match, 0.2 if no match, 0.5 if no detail specified

3. **Language Overlap** (15% of total)
   - Calculates proportion of user's languages that therapist speaks
   - Score: Proportion of matching languages (0-1), 0.5 if no languages specified

4. **Weekday Overlap** (7.5% of total)
   - Checks if therapist's `timeWindows` match user's `weekdays`
   - Maps Czech weekday abbreviations (`po`, `ut`, `st`, etc.) to time windows
   - Score: 1.0 if any weekday matches, 0.3 if no match, 0.5 if no weekdays specified

5. **Time of Day Overlap** (7.5% of total)
   - Checks if therapist's `timeWindows` match user's `timesOfDay`
   - Maps time preferences (`morning`, `evening`, etc.) to time windows
   - Score: 1.0 if any time matches, 0.3 if no match, 0.5 if no times specified

6. **Insurance Compatibility** (10% of total)
   - If user wants insurance: 1.0 if therapist accepts insurance, 0.2 if not
   - If user wants self-pay: 0.5 (neutral - both are acceptable)

7. **Gender Preference** (10% of total)
   - Only scored when `strictGender === false`
   - Score: 1.0 if gender matches preference, 0.3 if doesn't match, 0.5 if no preference or strict mode

8. **Distance** (10% of total)
   - Closer therapists score higher
   - Score: 1.0 for 0-5km, 0.8 for 5-10km, 0.6 for 10-20km, 0.4 for 20-30km, 0.2 for 30+km
   - 0.5 if distance unknown or online meeting

### Final Score Calculation

```
totalScore = 
  (problemArea * 0.2 + problemDetail * 0.2) * 40 +
  languages * 15 +
  (weekdays * 0.5 + timesOfDay * 0.5) * 15 +
  insurance * 10 +
  gender * 10 +
  distance * 10
```

Score is rounded to integer (0-100).

### Sorting

Therapists are sorted by:
1. **Primary**: Score (highest first)
2. **Tie-breaker**: Distance (closer first)

## Usage

### From API Endpoint

The matching logic can be called from `app/api/searchTherapists/route.ts`:

```typescript
import { findMatches, convertToTherapist } from '@/lib/matching/findMatches'
import type { Answers } from '@/lib/types/answers'

// Convert IndexedTherapist[] to Therapist[]
const therapists = indexedTherapists.map(convertToTherapist)

// Find matches
const results = findMatches(answers, therapists)

// Results are already sorted by score
```

### From Results Page

The results page (`app/questionnaire/results/page.tsx`) currently calls the API endpoint, which can use this matching logic internally.

## Integration Points

1. **API Endpoint**: `app/api/searchTherapists/route.ts`
   - Currently uses inline hard filters and soft scoring
   - Can be refactored to use `findMatches()` from this module

2. **Results Page**: `app/questionnaire/results/page.tsx`
   - Calls API endpoint with `Answers` payload
   - Receives sorted results

3. **Type Conversion**: 
   - `convertToTherapist()` converts `IndexedTherapist` (from JSON data) to `Therapist` (matching engine type)
   - Handles field mapping and default values

## Key Design Decisions

1. **Clear Separation**: Hard filters and soft scoring are completely separate functions
2. **Type Safety**: Uses strict TypeScript types (`Answers`, `Therapist`)
3. **No Side Effects**: All functions are pure (no mutations)
4. **Composable**: Functions can be used independently or together
5. **Czech UI Preserved**: All user-facing text remains in Czech, only logic is refactored

## Testing

The matching logic can be tested independently:

```typescript
import { findMatches, applyHardFilters, applySoftScoring } from '@/lib/matching/findMatches'

// Test hard filters
const filtered = applyHardFilters(answers, therapists)
console.log(`${filtered.length} therapists passed hard filters`)

// Test soft scoring
const scored = applySoftScoring(answers, filtered)
console.log(`Top score: ${scored[0]?.score}`)

// Test full matching
const results = findMatches(answers, therapists)
console.log(`Found ${results.length} matches`)
```

