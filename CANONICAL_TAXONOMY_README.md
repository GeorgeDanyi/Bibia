# Canonical Taxonomy System

This document describes the new canonical taxonomy system for conditions and detail tags in the Bibia questionnaire.

## Overview

The canonical taxonomy system provides a single source of truth for mapping Czech UI labels to canonical codes used by the search and matching system. This ensures consistency across the application and makes it easier to maintain and extend the condition taxonomy.

## Key Features

- **Single source of truth**: All mappings are defined in one place
- **Type safety**: Full TypeScript support with strict typing
- **Order preservation**: Conditions maintain selection order via timestamps
- **No duplicates**: Automatic deduplication of selected conditions
- **Backward compatibility**: Migration utilities for legacy data

## Structure

### Main Condition Codes

| Czech Label | Canonical Code | Description |
|-------------|----------------|-------------|
| "Bolesti zad" | `BACK_PAIN` | Back pain |
| "Krční páteř" | `NECK` | Neck/cervical spine |
| "Rameno / horní končetiny" | `SHOULDER_UPPER_LIMB` | Shoulder/upper limbs |
| "Koleno / dolní končetiny" | `KNEE_LOWER_LIMB` | Knee/lower limbs |
| "Po úrazu" | `POST_INJURY` | Post-injury rehabilitation |
| "Po operaci" | `POST_SURGERY` | Post-surgery rehabilitation |
| "Sportovní přetížení" | `SPORT_OVERUSE` | Sports overuse |
| "Dětské obtíže" | `PEDIATRIC` | Pediatric issues |
| "Těhotenství / po porodu" | `PREGNANCY_POSTPARTUM` | Pregnancy/postpartum |
| "Jiná / nejsem si jistý" | `OTHER_UNSURE` | Other/unsure |

### Detail Tags (Optional)

| Czech Label | Canonical Code | Description |
|-------------|----------------|-------------|
| "Akutní" | `ACUTE` | Acute condition |
| "Chronické" | `CHRONIC` | Chronic condition |
| "Zánět" | `INFLAMMATION` | Inflammation |
| "Ztuhlost" | `STIFFNESS` | Stiffness |
| "Slabost" | `WEAKNESS` | Weakness |
| "Závratě" | `VERTIGO` | Vertigo |
| "Bolesti hlavy" | `HEADACHE` | Headaches |
| "Problémy se spánkem" | `SLEEP_ISSUE` | Sleep issues |

## Data Structure

### CanonicalCondition

```typescript
type CanonicalCondition = {
  code: CanonicalConditionCode;
  selectedAt: string; // ISO timestamp when selected
};
```

### CanonicalDetail

```typescript
type CanonicalDetail = {
  code: CanonicalDetailCode;
  selectedAt: string; // ISO timestamp when selected
};
```

### Updated QuestionnaireAnswers

```typescript
type QuestionnaireAnswers = {
  // ... other fields
  conditionsMain: CanonicalCondition[]; // Primary conditions with canonical codes
  conditionsDetail: CanonicalDetail[];  // Detail tags with canonical codes
  
  // Legacy fields (deprecated)
  issueTags?: string[];
  otherIssue?: string;
};
```

## Usage

### 1. Basic Usage

```typescript
import { 
  CANONICAL_CONDITIONS, 
  getCanonicalConditionCode,
  getCzechConditionLabel 
} from '@/lib/constants/canonical-taxonomy';

// Convert Czech label to canonical code
const code = getCanonicalConditionCode('Bolesti zad'); // 'BACK_PAIN'

// Convert canonical code back to Czech label
const label = getCzechConditionLabel('BACK_PAIN'); // 'Bolesti zad'
```

### 2. Using the React Hook

```typescript
import { useCanonicalConditions } from '@/lib/hooks/useCanonicalConditions';

function ConditionSelector() {
  const { toggleConditionByLabel, isConditionSelected } = useCanonicalConditions();
  const [conditions, setConditions] = useState<CanonicalCondition[]>([]);
  
  const handleToggle = (czechLabel: string) => {
    const updated = toggleConditionByLabel(conditions, czechLabel);
    setConditions(updated);
  };
  
  return (
    <div>
      {Object.keys(CANONICAL_CONDITIONS).map(label => (
        <button
          key={label}
          onClick={() => handleToggle(label)}
          className={isConditionSelected(conditions, label) ? 'selected' : ''}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

### 3. Migration from Legacy Format

```typescript
import { migrateLegacyIssueTags } from '@/lib/utils/canonical-migration';

// Convert old format to new canonical format
const legacyTags = ['backNeck', 'postTrauma', 'sportsInjury'];
const canonicalConditions = migrateLegacyIssueTags(legacyTags);
```

### 4. Validation

```typescript
import { validateCanonicalConditions } from '@/lib/utils/canonical-migration';

const isValid = validateCanonicalConditions(conditions);
```

## Files

### Core Files

- `lib/constants/canonical-taxonomy.ts` - Main taxonomy definitions and mappings
- `lib/types/questionnaire.ts` - Updated TypeScript types
- `lib/hooks/useCanonicalConditions.ts` - React hook for managing conditions
- `lib/utils/canonical-migration.ts` - Migration and utility functions

### Updated Files

- `app/questionnaire/QuestionnaireContext.tsx` - Updated context with new structure
- `app/questionnaire/QuestionnaireClient.tsx` - Updated UI to use canonical system
- `lib/constants/mappings.ts` - Marked legacy mappings as deprecated

### Examples

- `lib/examples/canonical-taxonomy-usage.ts` - Comprehensive usage examples

## Migration Guide

### For Existing Data

1. Use `migrateLegacyIssueTags()` to convert existing `issueTags` arrays
2. Update validation logic to check `conditionsMain.length > 0`
3. Update display logic to use `convertCanonicalToCzechLabels()`

### For New Development

1. Always use the canonical taxonomy system for new features
2. Store canonical codes, not Czech labels, in the database
3. Use the provided hooks and utilities for consistency

## Benefits

1. **Consistency**: Single source of truth for all condition mappings
2. **Type Safety**: Full TypeScript support prevents runtime errors
3. **Maintainability**: Easy to add new conditions or modify existing ones
4. **Performance**: Efficient lookups and validations
5. **Extensibility**: Easy to add new detail tags or condition categories

## Acceptance Criteria Met

✅ **Single source-of-truth map exists (labels → codes)**
- All mappings defined in `canonical-taxonomy.ts`

✅ **Store always contains codes, not UI labels**
- `conditionsMain` and `conditionsDetail` use canonical codes
- Timestamps preserve selection order

✅ **No duplicates; order preserved by selection time**
- Automatic deduplication in utility functions
- `selectedAt` timestamps maintain chronological order

## Future Enhancements

- Add support for condition hierarchies
- Implement condition severity levels
- Add support for multi-language labels
- Create admin interface for managing taxonomy
