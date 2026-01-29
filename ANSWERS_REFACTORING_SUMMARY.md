# Answers Model Refactoring Summary

## ✅ Completed

### 1. New Type Definition
- **File**: `lib/types/answers.ts`
- **Type**: `Answers` interface with the new structure
- **Features**:
  - Centralized type definition
  - Migration functions (`migrateToAnswers`, `migrateFromAnswers`)
  - Default answers helper

### 2. Storage Utilities
- **File**: `lib/utils/answers.ts`
- **Updated**: Now uses new `Answers` type
- **Features**:
  - Backward compatibility with old format
  - Automatic migration from old to new format
  - `getAnswers()` and `setAnswers()` functions

### 3. Normalization
- **File**: `lib/matching/normalization.ts`
- **Added**: `normalizeAnswersToSearchInputs()` function
- **Purpose**: Converts new `Answers` format to `SearchInputs` for matching engine

### 4. API Endpoint
- **File**: `app/api/searchTherapists/route.ts`
- **Updated**: Now accepts new `Answers` format
- **Features**:
  - Detects new format automatically
  - Normalizes to internal format
  - Maintains backward compatibility

### 5. Results Page
- **File**: `app/questionnaire/results/page.tsx`
- **Updated**: Uses new `Answers` type from storage
- **Features**: Reads and uses new structure directly

### 6. Context Provider
- **File**: `app/questionnaire/QuestionnaireCanonicalContext.tsx`
- **Updated**: Uses new `Answers` type
- **Features**:
  - Exports new type
  - Provides migration helpers
  - Maintains backward compatibility

## 📋 New Answers Structure

```typescript
type GenderPreference = 'male' | 'female' | 'any';

interface Answers {
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

## 🔄 Migration Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `visitMode` | `meetingType` | `'clinic'` → `'clinic'`, `'home_visit'` → `'home'`, `'online'` → `'online'` |
| `therapistGender` | `genderPreference` | `'muz'` → `'male'`, `'zena'` → `'female'`, `'nezalezi'` → `'any'` |
| `conditionsMain[0]` | `problemArea` | First condition becomes problem area |
| `conditionsDetail[0]` | `problemDetail` | First detail becomes problem detail |
| `ageGroups[0]` | `ageGroup` | First age group (or defaults to 'adult') |
| `workplaceAccessibility.length > 0` | `barrierFree` | Boolean conversion |
| `insurance` array | `insuranceMode` | `'insurance'` or `'self-pay'` |
| `step4.timeOfDay` | `timesOfDay` | Direct mapping |
| `step4.weekdays` | `weekdays` | Direct mapping |
| `languages` | `languages` | Direct mapping |
| `radiusKm` | `radiusKm` | Direct mapping (defaults to 30) |

## ⚠️ Remaining Work

### Questionnaire Component
The main questionnaire component (`app/questionnaire/QuestionnaireCanonicalClient.tsx`) still uses the old structure internally. To fully migrate:

1. **Update state management**: Change from `QuestionnaireCanonicalAnswers` to `Answers`
2. **Update form fields**: Map form inputs to new structure
3. **Update localStorage**: Use new `setAnswers()` function
4. **Update submission**: Send new format to API

### Example Migration in Questionnaire Component

```typescript
// OLD
const [answers, setAnswers] = useState<QuestionnaireCanonicalAnswers>({...})

// NEW
import { Answers, defaultAnswers } from '@/lib/types/answers'
const [answers, setAnswers] = useState<Answers>(defaultAnswers)

// When saving:
import { setAnswers } from '@/lib/utils/answers'
setAnswers(answers)

// When submitting:
const payload: Answers = answers  // Already in correct format
```

## 🧪 Testing

To test the new structure:

1. **Storage**: Verify `getAnswers()` returns new format
2. **API**: Send new format to `/api/searchTherapists`
3. **Results**: Verify results page reads new format correctly
4. **Migration**: Test backward compatibility with old localStorage data

## 📝 Usage Examples

### Reading Answers
```typescript
import { getAnswers } from '@/lib/utils/answers'
const answers = getAnswers()
console.log(answers.genderPreference)  // 'male' | 'female' | 'any'
```

### Saving Answers
```typescript
import { setAnswers } from '@/lib/utils/answers'
import { Answers } from '@/lib/types/answers'

const answers: Answers = {
  city: 'Praha',
  radiusKm: 30,
  meetingType: 'clinic',
  problemArea: 'back-pain',
  ageGroup: 'adult',
  genderPreference: 'female',
  strictGender: true,
  barrierFree: false,
  languages: ['cs'],
  insuranceMode: 'insurance',
  timesOfDay: ['morning', 'afternoon'],
  weekdays: ['po', 'ut', 'st', 'ct', 'pa']
}

setAnswers(answers)
```

### Using in API
```typescript
// The API automatically detects and normalizes the new format
const response = await fetch('/api/searchTherapists', {
  method: 'POST',
  body: JSON.stringify(answers)  // Send Answers directly
})
```

## 🔗 Related Files

- `lib/types/answers.ts` - Type definition
- `lib/utils/answers.ts` - Storage utilities
- `lib/matching/normalization.ts` - Normalization functions
- `app/api/searchTherapists/route.ts` - API endpoint
- `app/questionnaire/results/page.tsx` - Results page
- `app/questionnaire/QuestionnaireCanonicalContext.tsx` - Context provider

