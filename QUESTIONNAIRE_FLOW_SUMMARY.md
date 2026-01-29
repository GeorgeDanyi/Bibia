# Questionnaire Flow Summary

## Main Questionnaire Implementation

**Primary File**: `app/questionnaire/QuestionnaireCanonicalClient.tsx`
- This is the main questionnaire component that handles all user interactions
- Wrapped by `QuestionnaireCanonicalProvider` from `app/questionnaire/QuestionnaireCanonicalContext.tsx`
- Entry point: `app/questionnaire/page.tsx`

## Questionnaire Steps

**File**: `app/questionnaire/canonical-steps.ts`

The questionnaire has **6 steps**:
1. **Step 0 - Location** (`location`): "Kde a jak" - City and meeting type (clinic/home/online)
2. **Step 1 - Conditions** (`conditions`): "S čím pomoct" - Problem areas and refinements
3. **Step 2 - Diagnosis** (`diagnosis`): "Diagnóza" - Diagnosis information
4. **Step 3 - Availability** (`availability`): "Kdy se hodí" - Time preferences
5. **Step 4 - Preferences** (`preferences`): "Jazyk a pojišťovna" - Language and insurance
6. **Step 5 - Special Needs** (`special-needs`): "Další potřeby" - Age groups, accessibility, gender preference

## TypeScript Answer Types

### Primary Type: `Answers` (New Canonical Format)

**File**: `lib/types/answers.ts`

```typescript
export type GenderPreference = 'male' | 'female' | 'any';

export interface Answers {
  city: string;
  radiusKm: number;
  meetingType: 'clinic' | 'home' | 'online' | 'any';
  problemArea: string;
  problemDetail?: string;
  ageGroup: 'child' | 'adult' | 'senior';
  genderPreference: GenderPreference;
  strictGender: boolean;
  barrierFree: boolean;
  languages: string[];
  insuranceMode: 'insurance' | 'self-pay';
  timesOfDay: string[];
  weekdays: string[];
}
```

### Legacy Type: `QuestionnaireCanonicalAnswers` (Still Used in UI)

**File**: `app/questionnaire/QuestionnaireCanonicalContext.tsx`

```typescript
export interface QuestionnaireCanonicalAnswers {
  // Step 1: Lokalita & forma péče
  city?: string
  visitMode?: "clinic" | "home_visit" | "online" | "any"
  
  // Step 2: Důvod návštěvy (redesigned with dynamic refinement)
  conditionsMain: string[]
  conditionsDetail: string[]
  conditionsDetailByCategory?: Record<string, string[]>
  activeRefinementCategory?: string
  
  // Step 3: Diagnóza (hlavní vstup)
  diagnosisHasDoctor?: boolean
  diagnosisText?: string
  diagnosisTags?: string[]
  hasDiagnosis?: boolean
  diagnosis?: string[]
  customDiagnosis?: string
  priority?: 'diagnosis' | 'none'
  
  // Step 4: Dostupnost
  availability: string[]
  weekdays?: string[]
  step4?: {
    timeOfDay: string[]
    weekdays: string[]
  }
  
  // Step 5: Jazyk, cena, pojišťovna
  languages: string[]
  priceRange?: string
  insurance: string[]
  
  // Step 6: Speciální potřeby
  ageGroups: string[]
  workplaceAccessibility: string[]
  therapistGender?: 'muz' | 'zena' | 'nezalezi'
  consentGiven: boolean
}
```

**Note**: The context provider uses the new `Answers` type internally, but the UI component (`QuestionnaireCanonicalClient.tsx`) still works with the legacy `QuestionnaireCanonicalAnswers` format during data collection.

## Answer Storage

**File**: `lib/utils/answers.ts`

- **Storage Key**: `bibiaQuestionnaireV1` (localStorage)
- **Functions**:
  - `getAnswers()`: Retrieves answers from localStorage, automatically migrates from old format if needed
  - `setAnswers(answers: Answers)`: Saves answers to localStorage
- **Migration**: The system automatically migrates between old `QuestionnaireCanonicalAnswers` and new `Answers` formats using `migrateToAnswers()` and `migrateFromAnswers()`

## Flow: UI → Storage → Matching Logic

### 1. **Data Collection** (QuestionnaireCanonicalClient.tsx)
- User fills out the 6-step questionnaire
- Answers are stored in React state via `useQuestionnaireCanonical()` hook
- On final step submission (Step 5), answers are:
  - Stored to localStorage: `localStorage.setItem('bibiaQuestionnaireV1', JSON.stringify({ answers, currentStep }))`
  - Also stored as payload: `localStorage.setItem('bibiaQuestionnairePayload', JSON.stringify(payload))`
  - User is navigated to `/results` page

### 2. **Data Retrieval** (app/questionnaire/results/page.tsx)
- Results page loads on mount
- Reads answers from localStorage using `getAnswers()` from `lib/utils/answers.ts`
- Creates a payload object using the `Answers` type structure
- Sends POST request to `/api/searchTherapists` with the answers as JSON body

### 3. **Data Transformation** (app/api/searchTherapists/route.ts)
- API endpoint receives the answers payload
- Detects if it's the new `Answers` format (checks for `city`, `meetingType`, `genderPreference` fields)
- If new format, calls `normalizeAnswersToSearchInputs()` from `lib/matching/normalization.ts`
- This function converts `Answers` → `SearchInputs` (internal matching engine format)
- The normalized data is then passed to the matching engine

### 4. **Normalization Function** (lib/matching/normalization.ts)
- `normalizeAnswersToSearchInputs(answers: Answers): SearchInputs`
- Maps fields:
  - `meetingType` → `'ordinace' | 'dojíždění' | 'online'`
  - `problemArea` → `issues[]`
  - `problemDetail` → `diagnosis` object
  - `insuranceMode` → `wantsInsurance` boolean
  - `timesOfDay` → `timeFit` preference
  - `genderPreference` → `therapistGenderPref`
  - etc.

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/questionnaire/QuestionnaireCanonicalClient.tsx` | Main questionnaire UI component |
| `app/questionnaire/QuestionnaireCanonicalContext.tsx` | React context provider for questionnaire state |
| `app/questionnaire/canonical-steps.ts` | Step definitions |
| `lib/types/answers.ts` | **Canonical `Answers` type definition** |
| `lib/utils/answers.ts` | localStorage utilities for answers |
| `lib/matching/normalization.ts` | Converts `Answers` → `SearchInputs` for matching |
| `app/api/searchTherapists/route.ts` | API endpoint that receives answers and triggers matching |
| `app/questionnaire/results/page.tsx` | Results page that reads answers and calls API |

## Summary

The questionnaire collects answers in the legacy `QuestionnaireCanonicalAnswers` format during UI interaction, but the system is transitioning to use the new canonical `Answers` type. Answers flow: **UI State** → **localStorage** → **Results Page** → **API Endpoint** → **Normalization** → **Matching Engine**.

