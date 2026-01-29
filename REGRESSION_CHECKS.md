# Regression Checks

This document outlines the critical regression checks that ensure the system works correctly in key user scenarios.

## Test Scenarios

### 1. Female Strict Gender Filter
**Scenario**: User selects "female" with strict gender preference
**Expected Behavior**: No male therapist cards should appear in results
**Implementation**: 
- When `strictGender: true` and `therapistGenderPref: 'female'`, the API filters out all male therapists
- The gender filter is applied as a hard filter in the matching engine
- If no female therapists are found, the system may show fallback message (depending on configuration)

**Test Verification**:
```typescript
// Verify no male therapists in results
const maleTherapists = results.filter(t => t.therapist.gender === 'male')
expect(maleTherapists.length).toBe(0)
```

### 2. No Problem Selected
**Scenario**: User completes questionnaire without selecting any specific problem/diagnosis
**Expected Behavior**: 
- Summary should display "neuvedeno" for the problem field
- Debug scores should show neutral/problem scores (0)
- No matched diagnoses should be displayed

**Implementation**:
- Questionnaire summary logic: `prob = diagnoses.length > 0 ? diagnoses.join(", ") : "neuvedeno"`
- Debug scoring: `diagnosis: 0` and `matched_diagnoses: []` when no problem selected
- Problem score components are neutral (0) when no diagnosis is provided

**Test Verification**:
```typescript
// Verify summary display
const prob = (diagnoses && diagnoses.length) ? diagnoses.join(", ") : "neuvedeno"
expect(prob).toBe("neuvedeno")

// Verify debug scores
expect(therapist.score_breakdown.diagnosis).toBe(0)
expect(therapist.components.diagnosis).toBe(0)
expect(therapist.matched_diagnoses.length).toBe(0)
```

### 3. City and Meeting Type Updates
**Scenario**: User changes city or meeting type in the questionnaire
**Expected Behavior**: 
- Both header summary and results should update consistently
- Query parameters should be synchronized between header and results
- Results should reflect the new city/meeting type selection

**Implementation**:
- City changes trigger new search with updated location parameters
- Meeting type changes filter results based on therapist's supported meeting types
- Header summary updates to reflect current query state
- Results are re-fetched and re-rendered with new parameters

**Test Verification**:
```typescript
// Verify city change updates both header and results
expect(headerDisplay.city).toBe(resultsQuery.city)
expect(results.length).toBeGreaterThan(0)

// Verify meeting type change updates both header and results  
expect(headerDisplay.meetingType).toBe(resultsQuery.meetingType)
expect(results.every(t => t.meeting_types.includes(updatedMeetingType))).toBe(true)
```

## Running Regression Tests

### Quick Verification
```bash
# Run the regression test script
npx tsx scripts/verify-regression-scenarios.ts
```

### Expected Output
```
🚀 Running Regression Tests

==================================================
🧪 Testing: Female strict gender filter
  ✅ PASS: No male therapists returned with female strict filter

🧪 Testing: No problem selected scenario
  ✅ PASS: Summary correctly shows "neuvedeno" when no problem selected
  ✅ PASS: Debug shows neutral problem scores when no problem selected

🧪 Testing: City and meeting type updates
  ✅ PASS: City change is detected
  ✅ PASS: Meeting type change is detected

==================================================
📊 Results: 3/3 tests passed
✅ All regression tests passed!
```

## Implementation Details

### Gender Filtering Logic
The strict gender filtering is implemented in the API route (`app/api/searchTherapists/route.ts`):

```typescript
// Apply strict gender filter if specified
if (originalGenderPref && originalGenderPref !== 'any') {
  genderFiltered = hardFiltered.filter(t => ((t as any).gender === originalGenderPref))
  if (genderFiltered.length === 0 && !strictGender) {
    // Fallback to any gender only if strictGender is false
    genderFiltered = hardFiltered
    genderFallback = { reason: 'no_gender_match' }
  }
}
```

### Problem Display Logic
The questionnaire summary component (`components/search/QuestionnaireSummary.tsx`) handles the "neuvedeno" display:

```typescript
const prob = (q.diagnoses && q.diagnoses.length) 
  ? q.diagnoses.map(d => d.label).join(", ") 
  : "neuvedeno"
```

### Debug Score Implementation
The debug scoring is implemented in the therapist card component (`app/results/ResultsClient.tsx`):

```typescript
// Debug display shows actual scoring breakdown
<div><span className="font-medium">diag_score:</span> {score_breakdown?.diagnosis || 0}</div>
<div><span className="font-medium">problem_score:</span> {score_breakdown?.diagnosis || 0}</div>
```

## Monitoring and Maintenance

### When to Run Tests
- Before each deployment
- After changes to matching logic
- After changes to questionnaire flow
- After changes to result display logic

### What to Watch For
- Gender filtering not working correctly
- Summary showing incorrect problem information
- Header and results becoming inconsistent
- Debug scores not reflecting actual matching logic

### Troubleshooting
If tests fail:
1. Check the matching engine logic in `lib/matching/engine.ts`
2. Verify API route filtering in `app/api/searchTherapists/route.ts`
3. Review questionnaire summary logic in `components/search/QuestionnaireSummary.tsx`
4. Ensure debug display is using correct data sources

## Related Files
- `scripts/verify-regression-scenarios.ts` - Test implementation
- `__tests__/regression-checks.test.ts` - Jest test suite
- `app/api/searchTherapists/route.ts` - API filtering logic
- `components/search/QuestionnaireSummary.tsx` - Summary display
- `app/results/ResultsClient.tsx` - Debug display
- `lib/matching/engine.ts` - Matching logic
