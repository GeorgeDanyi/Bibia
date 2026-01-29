# Questionnaire Flow Analysis

## 1. Relevant Files

### Core Questionnaire Files

1. **`app/questionnaire/page.tsx`**
   - Entry point for the questionnaire route
   - Wraps `QuestionnaireCanonicalClient` with `QuestionnaireCanonicalProvider`

2. **`app/questionnaire/QuestionnaireCanonicalClient.tsx`**
   - Main questionnaire component (2586 lines)
   - Contains all 6 step UI implementations inline
   - Handles form validation, navigation, and answer collection
   - Contains `mapAnswersToSearchCriteria()` function for transforming answers

3. **`app/questionnaire/QuestionnaireCanonicalContext.tsx`**
   - React Context provider for questionnaire state management
   - Manages step navigation and answers state
   - Uses the new `Answers` type internally

4. **`app/questionnaire/canonical-steps.ts`**
   - Defines the 6 questionnaire steps with IDs and labels
   - Step constants: LOCATION, CONDITIONS, DIAGNOSIS, AVAILABILITY, PREFERENCES, SPECIAL_NEEDS

5. **`app/questionnaire/results/page.tsx`**
   - Results page that loads answers from localStorage
   - Sends POST request to `/api/searchTherapists` with answers payload

### Type Definitions

6. **`lib/types/answers.ts`**
   - **PRIMARY TYPE**: `Answers` interface (canonical format)
   - Migration functions: `migrateToAnswers()`, `migrateFromAnswers()`
   - Default answers: `defaultAnswers`

7. **`app/questionnaire/QuestionnaireCanonicalContext.tsx`**
   - **LEGACY TYPE**: `QuestionnaireCanonicalAnswers` interface (still used in UI during data collection)

### Storage & Utilities

8. **`lib/utils/answers.ts`**
   - localStorage management functions
   - `getAnswers()`: Retrieves and migrates answers from localStorage
   - `setAnswers()`: Saves answers to localStorage
   - Storage key: `bibiaQuestionnaireV1`

### Transformation Functions

9. **`lib/matching/normalization.ts`**
   - `normalizeAnswersToSearchInputs()`: Transforms `Answers` → `SearchInputs`
   - Used by the matching engine

10. **`app/api/searchTherapists/route.ts`**
    - API endpoint that receives answers
    - Uses `normalizeSearchInputs()` to process the payload
    - Applies hard filters and matching logic

### Supporting Components

11. **`components/questionnaire/StepShell.tsx`**
    - Reusable wrapper component for questionnaire steps

12. **`components/questionnaire/Progress.tsx`**
    - Progress indicator component

### Legacy Files (Not Primary)

13. **`app/questionnaire/QuestionnaireClient.tsx`**
    - Legacy questionnaire implementation (still exists but not primary)

14. **`app/questionnaire/QuestionnaireContext.tsx`**
    - Legacy context (not used by canonical questionnaire)

15. **`app/questionnaire/steps.ts`**
    - Legacy step definitions (not used by canonical questionnaire)

---

## 2. TypeScript Type/Interface for User Answers

### Primary Type: `Answers` (Canonical Format)

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

### Legacy Type: `QuestionnaireCanonicalAnswers` (Used During UI Collection)

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

**Note**: The UI component (`QuestionnaireCanonicalClient.tsx`) collects answers in the legacy `QuestionnaireCanonicalAnswers` format, then migrates them to the new `Answers` format before storage and matching.

---

## 3. Answer Flow: UI → Storage → Matching Engine

### Step-by-Step Flow

#### **Phase 1: Data Collection (UI)**

1. **User Interaction** (`app/questionnaire/QuestionnaireCanonicalClient.tsx`)
   - User fills out 6 steps:
     - Step 0: Location (`location`) - City and meeting type
     - Step 1: Conditions (`conditions`) - Problem areas and refinements
     - Step 2: Diagnosis (`diagnosis`) - Diagnosis information
     - Step 3: Availability (`availability`) - Time preferences
     - Step 4: Preferences (`preferences`) - Language and insurance
     - Step 5: Special Needs (`special-needs`) - Age groups, accessibility, gender preference

2. **State Management** (`app/questionnaire/QuestionnaireCanonicalContext.tsx`)
   - Answers stored in React state via `useQuestionnaireCanonical()` hook
   - State uses the new `Answers` type internally
   - UI component still works with legacy `QuestionnaireCanonicalAnswers` format during collection

#### **Phase 2: Submission & Storage**

3. **Final Step Submission** (`QuestionnaireCanonicalClient.tsx`, line ~375-427)
   - When user completes Step 5 (Special Needs), `handleNext()` is triggered
   - Answers are converted from legacy format to new `Answers` format:
     ```typescript
     const newFormatAnswers = migrateToAnswers(oldFormatAnswers)
     ```
   - Answers saved to localStorage via `setAnswers(newFormatAnswers)`:
     - Storage key: `bibiaQuestionnaireV1`
     - Format: `{ answers: Answers, currentStep: number, timestamp: number }`
   - Legacy format also saved for backward compatibility

4. **Navigation** (`QuestionnaireCanonicalClient.tsx`, line ~440-466)
   - After saving, user is navigated to `/questionnaire/results` (or `/results` with URL params)

#### **Phase 3: Results Page & API Call**

5. **Results Page Load** (`app/questionnaire/results/page.tsx`)
   - On mount, retrieves answers from localStorage:
     ```typescript
     const answers: Answers = getAnswers();
     ```
   - `getAnswers()` automatically migrates old format if detected

6. **API Request** (`app/questionnaire/results/page.tsx`, line ~41-45)
   - Creates payload from `Answers` type
   - Sends POST request to `/api/searchTherapists?debug=1`
   - Body: JSON stringified `Answers` object

#### **Phase 4: API Processing & Matching**

7. **API Endpoint** (`app/api/searchTherapists/route.ts`)
   - Receives `Answers` payload
   - Calls `normalizeSearchInputs()` to transform to `SearchInputs` format
   - Applies hard filters (meeting type, radius, gender, age group, barrier-free)
   - Runs matching/scoring logic
   - Returns ranked therapist results

8. **Normalization** (`lib/matching/normalization.ts`, `normalizeAnswersToSearchInputs()`)
   - Transforms `Answers` → `SearchInputs`:
     - `meetingType` → `'ordinace' | 'dojíždění' | 'online'`
     - `problemArea` → `issues[]`
     - `problemDetail` → `diagnosis`
     - `insuranceMode` → `wantsInsurance: boolean`
     - `timesOfDay` → `timeFit: 'evening' | 'weekend' | 'weekday' | 'ASAP'`
     - `languages` → `language` (first) + `languages[]`
     - Other fields mapped directly

9. **Matching Engine**
   - Uses `SearchInputs` to filter and score therapists
   - Returns ranked results with match scores

### Summary Flow Diagram

```
User Input (UI)
    ↓
QuestionnaireCanonicalClient (collects in QuestionnaireCanonicalAnswers format)
    ↓
handleNext() on Step 5
    ↓
migrateToAnswers() → converts to Answers format
    ↓
setAnswers() → saves to localStorage (key: 'bibiaQuestionnaireV1')
    ↓
Navigate to /questionnaire/results
    ↓
Results page: getAnswers() → retrieves from localStorage
    ↓
POST /api/searchTherapists with Answers payload
    ↓
normalizeSearchInputs() → converts Answers to SearchInputs
    ↓
Matching Engine → filters & scores therapists
    ↓
Returns ranked results
```

---

## Key Transformation Points

1. **UI Collection → Storage**: `migrateToAnswers()` in `lib/types/answers.ts`
2. **Storage → API**: Direct `Answers` type (no transformation)
3. **API → Matching**: `normalizeAnswersToSearchInputs()` in `lib/matching/normalization.ts`

---

## Notes

- The system maintains backward compatibility by storing both old and new formats
- Migration happens automatically when reading from localStorage
- The UI still uses legacy format during collection, but converts before storage
- All Czech UI text is preserved in the components

