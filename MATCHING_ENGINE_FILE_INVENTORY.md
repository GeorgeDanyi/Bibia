# Matching Engine File Inventory

## 1. Questionnaire Answer Storage

### Primary Storage Files
- **`lib/storage.ts`**
  - Purpose: Centralized localStorage management for questionnaire data
  - Functions: `getQuestionnaireData()`, `setQuestionnaireData()`
  - Storage key: `bibiaQuestionnaireV1`

- **`lib/utils/answers.ts`**
  - Purpose: Simple localStorage utility for answers
  - Functions: `getAnswers()`, `setAnswer()`
  - Storage key: `answers`

- **`lib/bibiaStore.ts`**
  - Purpose: Central store for questionnaire step data (Step 1, Step 2, etc.)
  - Functions: `storeSetStep1()`, `storeSetStep2()`, etc.

### Questionnaire Components (with localStorage)
- **`app/questionnaire/QuestionnaireCanonicalClient.tsx`**
  - Purpose: Main questionnaire component that saves/loads answers to/from localStorage
  - Storage: `localStorage.getItem('bibiaQuestionnaireV1')`
  - Saves: answers, currentStep, gender preference, strictGender flag

- **`app/questionnaire/QuestionnaireCanonicalContext.tsx`**
  - Purpose: Context provider for questionnaire state
  - Defines: `QuestionnaireCanonicalAnswers` interface

- **`app/questionnaire/QuestionnaireClient.tsx`**
  - Purpose: Legacy questionnaire component (also uses localStorage)

- **`app/questionnaire-v1/QuestionnaireV1Client.tsx`**
  - Purpose: Alternative questionnaire implementation
  - Storage: `localStorage.getItem('bibiaQuestionnaireV1')`

- **`app/questionnaire/results/page.tsx`**
  - Purpose: Results page that reads questionnaire answers from localStorage
  - Reads: `localStorage.getItem('bibiaQuestionnaireV1')`

---

## 2. Types/Interfaces Describing User Answers

### Primary Type Definitions
- **`app/questionnaire/QuestionnaireCanonicalContext.tsx`**
  - Interface: `QuestionnaireCanonicalAnswers`
  - Fields: city, visitMode, conditionsMain, conditionsDetail, diagnosis, availability, languages, insurance, ageGroups, workplaceAccessibility, therapistGender, strictGender

- **`lib/types/questionnaire.ts`**
  - Type: `QuestionnaireAnswers`
  - Fields: firstName, lastName, email, phone, location, distancePreference, timePreferences, conditionsMain, conditionsDetail, diagnosis, sessionMode, coverageType, constraints, startTiming

- **`lib/matching/types.ts`**
  - Interface: `SearchInputs`
  - Fields: location, radiusKm, meetingType, issues, diagnosis, timeFit, language, wantsInsurance, ageGroup, therapistGenderPref, barrierFree

- **`lib/types/therapist-extended.ts`**
  - Interface: `UserAnswers`
  - Fields: location, visitMode, conditions, diagnosis, availability, languages, insurance, ageGroups, workplaceAccessibility

- **`core/lib/types/index.ts`**
  - Interface: `QuestionnaireAnswers` (simplified version)
  - Fields: firstName, email, conditions, location, timePreferences, genderPreference, languagePreference

- **`lib/utils/matchTherapists.ts`**
  - Interface: `QuestionnaireAnswers` (local definition)
  - Fields: issueTags, diagnosisTags, timePrefs, weekdays, locationPreference, locationCoords

---

## 3. Therapist Database / Therapist Type Definitions

### Primary Therapist Type Definitions
- **`lib/matching/types.ts`**
  - Interface: `Therapist` (matching engine version)
  - Fields: id, fullName, city, latitude, longitude, meetingTypes, serviceRadiusKm, barrier_free, ageGroups, acceptingNewClients, activeProfile, diagnoses, issues, nextAvailableSlot, timeWindows, languages, acceptsInsurance, gender, isVerified, profileCompleteness, reviewCount, hasPhotos

- **`lib/types/therapist.ts`**
  - Interface: `Therapist` (main application version)
  - Fields: id, fullName, city, latitude, longitude, practiceType, acceptingNew, yearsExperience, pricePerSession, availability, specialties, diagnoses, tags, modalities, worksWith, rating, reviewsCount, bio, insuranceAccepted, isVerified

- **`lib/types/therapist-schema.ts`**
  - Schema: `TherapistSchema` (Zod validation schema)
  - Purpose: Runtime validation of therapist data

- **`lib/types/therapist-extended.ts`**
  - Interface: `TherapistExtended`
  - Fields: Extended therapist data with additional metadata

- **`src/data/therapists.ts`**
  - Interface: `Therapist` (simplified version)
  - Purpose: In-memory therapist data source

- **`types/search.ts`**
  - Interface: `Therapist` (search-specific version)

- **`core/lib/types/index.ts`**
  - Interface: `Therapist` (core version)

- **`DATA_MODEL_V1.md`**
  - Documentation: Therapist schema specification
  - Defines: TherapistV1 interface with all fields

---

## 4. Matching Logic (Filters, Scoring, Sorting)

### Core Matching Engine
- **`lib/matching/engine.ts`** ⭐ PRIMARY MATCHING ENGINE
  - Functions: `applyHardFilters()`, `calculateMatchScore()`, `getTieBreakerScore()`, `matchTherapists()`, `applyFallbackLogic()`
  - Purpose: Main matching algorithm with hard filters, scoring (0-100), and tie-breakers
  - Filters: meeting type, barrier-free, age group, gender, therapist status
  - Scoring: diagnosis (40pts), availability (15pts), distance (15pts), language (10pts), age (5pts), gender (10pts), insurance (5pts), quality (5pts)

- **`app/api/searchTherapists/route.ts`** ⭐ PRIMARY SEARCH API
  - Purpose: Main API endpoint that orchestrates matching
  - Functions: Hard filtering, gender filtering, distance calculation, scoring, tier classification
  - Key logic: Applies hard filters, then gender filter (strict), then scoring and sorting

### Alternative Matching Implementations
- **`lib/utils/matching-engine.ts`**
  - Functions: `answersToCriteria()`, `passesStrictFilters()`, `passesFullFilters()`, `matchTherapists()`
  - Purpose: Alternative matching engine with relaxation levels

- **`lib/utils/matching.ts`**
  - Functions: `answersToCriteria()`, `scoreTherapist()`
  - Purpose: Scoring and criteria conversion utilities

- **`lib/utils/match.ts`**
  - Functions: `filterByPreferences()`, `calculateMatchScore()`, `matchTherapists()`
  - Purpose: Preference-based filtering and matching

- **`lib/utils/matchTherapists.ts`**
  - Functions: `findMatchingTherapists()`, `getTopMatches()`
  - Purpose: Legacy matching utilities

- **`lib/utils/therapist-matching.ts`**
  - Functions: `calculateScore()`, `rankTherapists()`
  - Purpose: Scoring and ranking utilities

- **`lib/search.ts`**
  - Functions: `hardPass()`, `scoreTherapist()`, `rankTherapists()`
  - Purpose: Search and ranking logic

- **`lib/search/booleanGeo.ts`**
  - Functions: `searchSimple()`
  - Purpose: Boolean geographic search

- **`lib/search/classifyTier.ts`**
  - Functions: `classifyTier()`
  - Purpose: Classifies therapists into tiers (1-4) based on match quality

- **`lib/filters/hardGates.ts`**
  - Functions: `applyHardGates()`, `humanizeHardGateReason()`
  - Purpose: Hard filter gates for therapist matching

- **`lib/scoring/index.ts`**
  - Purpose: Scoring utilities (if exists)

---

## 5. Result Page Components (Chips & Filters)

### Main Results Components
- **`app/results/ResultsClient.tsx`** ⭐ PRIMARY RESULTS PAGE
  - Component: `TherapistCard` - displays therapist cards with chips/badges
  - Chips displayed: Meeting types, Gender, Problem/Issues, Languages, Age groups
  - Filters: Query-based filtering from URL params
  - Key lines: 302-340 (chip rendering logic)

- **`app/questionnaire/results/page.tsx`**
  - Purpose: Results page for questionnaire flow
  - Displays: Therapist cards with match scores, distance, reasons

- **`app/results/ResultsPageEnhanced.tsx`**
  - Purpose: Enhanced results page component
  - Displays: Therapist cards with match scores and reasons

### Results Utilities
- **`lib/hooks/useSearchResults.ts`**
  - Hook: `useSearchResults()`
  - Purpose: Manages search results state, query building, API calls
  - Handles: Query normalization, fallback logic, result processing

- **`lib/results/shape.ts`**
  - Functions: `shapeResults()`
  - Purpose: Shapes and formats results for display

---

## 6. Answer Transformers / Normalizers

### Primary Normalization
- **`lib/matching/normalization.ts`** ⭐ PRIMARY NORMALIZER
  - Functions: `normalizeText()`, `normalizeCity()`, `normalizeSearchInputs()`
  - Purpose: Converts raw questionnaire answers to normalized SearchInputs
  - Handles: Diacritics removal, city name normalization, meeting type mapping, gender preference mapping, diagnosis normalization

- **`app/api/searchTherapists/route.ts`**
  - Functions: `mapLanguageCanonical()`, inline normalization logic
  - Purpose: Normalizes raw POST body data to canonical format
  - Handles: City normalization, meeting type mapping, gender preference mapping, language mapping, coordinates derivation

### Answer Transformation Functions
- **`app/questionnaire/QuestionnaireCanonicalClient.tsx`**
  - Function: `mapAnswersToSearchCriteria()`
  - Purpose: Maps questionnaire answers to SearchCriteria format
  - Lines: 54-93

- **`app/questionnaire-v1/QuestionnaireV1Client.tsx`**
  - Function: `mapAnswersToSearchCriteria()`
  - Purpose: Maps questionnaire answers to SearchCriteria format
  - Lines: 163-204

- **`lib/utils/matching-engine.ts`**
  - Function: `answersToCriteria()`
  - Purpose: Converts QuestionnaireAnswers to MatchingCriteria
  - Lines: 37-108

- **`lib/utils/matching.ts`**
  - Function: `answersToCriteria()`
  - Purpose: Converts QuestionnaireAnswers to MatchingCriteria
  - Lines: 18-79

- **`lib/utils/query.ts`**
  - Function: `processQuestionnaire()`
  - Purpose: Processes questionnaire answers into QueryResult
  - Handles: Issue tag mapping, diagnosis text processing, coordinate resolution, preference sanitization

- **`lib/services/normalizePlace.ts`**
  - Function: `normalizePlace()`
  - Purpose: Normalizes location/place names and resolves coordinates

---

## Summary by Category

### Critical Files for Gender Filtering Fix
1. **`app/api/searchTherapists/route.ts`** - Main search API (FIXED ✅)
2. **`lib/matching/engine.ts`** - Matching engine (already correct)
3. **`lib/matching/normalization.ts`** - Answer normalization
4. **`app/questionnaire/QuestionnaireCanonicalClient.tsx`** - Sends gender preference
5. **`app/results/ResultsClient.tsx`** - Displays results with gender chips

### Data Flow
1. **Questionnaire** → `QuestionnaireCanonicalClient.tsx` → saves to localStorage
2. **Results Page** → reads from localStorage → calls `searchTherapists` API
3. **API** → `app/api/searchTherapists/route.ts` → normalizes inputs → applies filters
4. **Matching** → `lib/matching/engine.ts` → hard filters → scoring → sorting
5. **Display** → `ResultsClient.tsx` → renders therapist cards with chips

