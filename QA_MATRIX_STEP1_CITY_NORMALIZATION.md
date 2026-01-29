# PART D — Quick QA Matrix for Step 1 (Manual Test Cards)

## Goal
Ensure city normalization works and we collect solid inputs for matching.

## Test Environment Setup
- **URL**: `/questionnaire-v1` (or main questionnaire with `?v1=true`)
- **Browser**: Test in Chrome, Firefox, Safari
- **Device**: Test on desktop and mobile
- **Feature Flags**: Ensure `citiesAutocomplete: true` and `useGeolocation: true` are enabled

## Test Scenarios

### Scenario 1: Basic City Normalization
**Input**: `"praha"`
**Expected Outcome**: 
- ✅ Resolves to `"Praha"`
- ✅ Next button disabled until care type chosen
- ✅ `answers.city` stores `"Praha"` (canonical name)
- ✅ Input field shows green border (resolved)
- ✅ No error messages

**Test Steps**:
1. Navigate to questionnaire Step 1
2. Type "praha" in city input field
3. Click outside input or press Tab (trigger blur)
4. Verify city resolves to "Praha"
5. Verify Next button is disabled
6. Check browser dev tools for `answers.city = "Praha"`

---

### Scenario 2: City with Extra Spaces
**Input**: `" BrNo  "` (leading/trailing spaces)
**Expected Outcome**:
- ✅ Resolves to `"Brno"`
- ✅ Spaces trimmed and normalized
- ✅ Next button disabled until care type chosen
- ✅ `answers.city` stores `"Brno"`

**Test Steps**:
1. Type " BrNo  " (with spaces)
2. Trigger blur event
3. Verify normalization to "Brno"
4. Verify Next button state

---

### Scenario 3: City with Diacritics
**Input**: `"ustí nad labem"`
**Expected Outcome**:
- ✅ Resolves to `"Ústí nad Labem"`
- ✅ Diacritics properly handled
- ✅ Title case applied correctly
- ✅ `answers.city` stores `"Ústí nad Labem"`

**Test Steps**:
1. Type "ustí nad labem"
2. Trigger blur event
3. Verify proper diacritic handling
4. Verify canonical name storage

---

### Scenario 4: City with Double Spaces
**Input**: `"mladá  boleslav"` (double space between words)
**Expected Outcome**:
- ✅ Resolves to `"Mladá Boleslav"`
- ✅ Double spaces collapsed to single space
- ✅ Title case applied
- ✅ `answers.city` stores `"Mladá Boleslav"`

**Test Steps**:
1. Type "mladá  boleslav" (with double space)
2. Trigger blur event
3. Verify space normalization
4. Verify final result

---

### Scenario 5: City without Diacritics
**Input**: `"kolin"` (missing diacritics)
**Expected Outcome**:
- ✅ Resolves to `"Kolín"`
- ✅ Missing diacritics added correctly
- ✅ `answers.city` stores `"Kolín"`

**Test Steps**:
1. Type "kolin" (without diacritics)
2. Trigger blur event
3. Verify diacritic restoration
4. Verify canonical name

---

### Scenario 6: Unrecognized City/Abbreviation
**Input**: `"kr. vary"` (abbreviation not in dataset)
**Expected Outcome**:
- ❌ Fails to resolve
- ✅ Shows helper text: "Město jsme nenašli. Zkus jiný název nebo nejbližší větší město."
- ✅ Input field shows red border
- ✅ Next button remains disabled
- ✅ `answers.city` remains empty or invalid

**Test Steps**:
1. Type "kr. vary"
2. Trigger blur event
3. Verify error state
4. Verify helper text appears
5. Verify Next button state

---

### Scenario 7: Geolocation Auto-fill
**Input**: Geolocation ON near Plzeň
**Expected Outcome**:
- ✅ Auto-fills `"Plzeň"`
- ✅ Geolocation button shows loading state
- ✅ City resolves automatically
- ✅ `answers.city` stores `"Plzeň"`
- ✅ Next button disabled until care type chosen

**Test Steps**:
1. Ensure location services enabled in browser
2. Click "Použít moji polohu" button
3. Allow location access when prompted
4. Verify auto-fill with "Plzeň" (or nearest city)
5. Verify button loading states
6. Verify Next button state

---

### Scenario 8: Empty City + Selected Care Type
**Input**: Empty city field + care type selected
**Expected Outcome**:
- ❌ Error under input: "Vyber prosím město."
- ✅ Next button disabled
- ✅ Input field shows red border
- ✅ Care type selection remains valid

**Test Steps**:
1. Leave city field empty
2. Select a care type (Osobně or Online)
3. Try to proceed to next step
4. Verify city error message
5. Verify Next button disabled

---

### Scenario 9: City Filled + No Care Type
**Input**: Valid city + no care type selected
**Expected Outcome**:
- ❌ Error under care type cards: "Vyber prosím formu péče."
- ✅ Next button disabled
- ✅ City field shows green border (resolved)
- ✅ Care type cards show error state

**Test Steps**:
1. Enter valid city (e.g., "Praha")
2. Leave care type unselected
3. Try to proceed to next step
4. Verify care type error message
5. Verify Next button disabled

---

## Validation Rules Summary

### City Validation
- **Required**: City must be entered and resolved
- **Resolution**: Must match Czech cities dataset
- **Storage**: `answers.city` stores canonical name (e.g., "Praha")
- **Error**: "Město jsme nenašli. Zkus jiný název nebo nejbližší větší město."

### Care Type Validation
- **Required**: At least one care type must be selected
- **Options**: "Osobně" (in-person) or "Online"
- **Error**: "Vyber prosím formu péče."

### Next Button Logic
- **Disabled when**: City not resolved OR no care type selected
- **Enabled when**: Both city resolved AND care type selected

## Data Storage Verification

### answers.city Format
- ✅ Always stores canonical city name
- ✅ Proper Czech diacritics
- ✅ Title case formatting
- ❌ Never stores raw user input
- ❌ Never stores postal codes or extra data

### answers.visitType Format
- ✅ Stores `"in-person"` or `"online"`
- ✅ Single selection (radio behavior)
- ❌ Never stores multiple values

## Browser Dev Tools Verification

### Local Storage
```javascript
// Check saved progress
JSON.parse(localStorage.getItem('questionnaire-v1-progress'))

// Expected structure:
{
  "step": 0,
  "answers": {
    "city": "Praha",           // Canonical name
    "visitType": "in-person",  // Selected care type
    "additionalConditions": [],
    "modalities": [],
    "availability": [],
    "languages": [],
    "insurance": [],
    "ageGroups": [],
    "workplaceAccessibility": [],
    "consentGiven": false
  }
}
```

### Console Logs
- Check for city resolution logs
- Verify no JavaScript errors
- Monitor geolocation API calls

## Edge Cases to Test

### Input Variations
- Very long city names
- Special characters
- Numbers mixed with city names
- Copy-paste from external sources
- Rapid typing and deletion

### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Network Conditions
- Slow network (test geolocation timeout)
- Offline mode (test fallback behavior)
- Geolocation denied by user

## Success Criteria

### ✅ All Scenarios Pass When:
1. All 9 test scenarios behave exactly as described
2. City normalization works for all Czech cities in dataset
3. Error messages appear in correct locations
4. Next button enable/disable logic works correctly
5. `answers.city` always stores canonical names
6. Geolocation integration works smoothly
7. No JavaScript errors in console
8. Responsive design works on mobile

### ❌ Test Fails When:
1. City doesn't resolve to expected canonical name
2. Error messages don't appear or appear in wrong location
3. Next button logic is incorrect
4. Raw user input stored instead of canonical name
5. Geolocation doesn't work or causes errors
6. JavaScript errors in console
7. Mobile experience is broken

## Test Execution Checklist

- [ ] Scenario 1: "praha" → "Praha"
- [ ] Scenario 2: " BrNo  " → "Brno"
- [ ] Scenario 3: "ustí nad labem" → "Ústí nad Labem"
- [ ] Scenario 4: "mladá  boleslav" → "Mladá Boleslav"
- [ ] Scenario 5: "kolin" → "Kolín"
- [ ] Scenario 6: "kr. vary" → Error + helper text
- [ ] Scenario 7: Geolocation → "Plzeň"
- [ ] Scenario 8: Empty city + care type → City error
- [ ] Scenario 9: City + no care type → Care type error
- [ ] Data storage verification
- [ ] Browser compatibility
- [ ] Mobile responsiveness
- [ ] Console error check

## Notes

- Test with both autocomplete enabled and disabled
- Verify keyboard navigation works in autocomplete
- Test geolocation permission denied scenario
- Verify proper cleanup of temporary states
- Check accessibility with screen readers
