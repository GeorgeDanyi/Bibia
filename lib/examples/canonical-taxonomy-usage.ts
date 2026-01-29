// Example usage of the canonical taxonomy system
// This file demonstrates how to use the new canonical condition and detail system

import { 
  CANONICAL_CONDITIONS, 
  CANONICAL_DETAIL_TAGS,
  getCanonicalConditionCode,
  getCanonicalDetailCode,
  getCzechConditionLabel,
  getCzechDetailLabel
} from '../constants/canonical-taxonomy';

import { 
  convertCzechLabelsToCanonical,
  convertCzechDetailLabelsToCanonical,
  convertCanonicalToCzechLabels,
  convertCanonicalDetailsToCzechLabels,
  migrateLegacyIssueTags
} from '../utils/canonical-migration';

import { useCanonicalConditions } from '../hooks/useCanonicalConditions';

// Example 1: Basic usage with Czech labels
export function exampleBasicUsage() {
  // User selects conditions in Czech
  const selectedCzechLabels = ['Bolesti zad', 'Po úrazu', 'Sportovní přetížení'];
  
  // Convert to canonical format
  const canonicalConditions = convertCzechLabelsToCanonical(selectedCzechLabels);
  console.log('Canonical conditions:', canonicalConditions);
  // Output: [
  //   { code: 'BACK_PAIN', selectedAt: '2024-01-15T10:30:00.000Z' },
  //   { code: 'POST_INJURY', selectedAt: '2024-01-15T10:30:00.000Z' },
  //   { code: 'SPORT_OVERUSE', selectedAt: '2024-01-15T10:30:00.000Z' }
  // ]
  
  // Convert back to Czech for display
  const displayLabels = convertCanonicalToCzechLabels(canonicalConditions);
  console.log('Display labels:', displayLabels);
  // Output: ['Bolesti zad', 'Po úrazu', 'Sportovní přetížení']
}

// Example 2: Using detail tags
export function exampleDetailTags() {
  const selectedDetailLabels = ['Akutní', 'Zánět', 'Ztuhlost'];
  
  const canonicalDetails = convertCzechDetailLabelsToCanonical(selectedDetailLabels);
  console.log('Canonical details:', canonicalDetails);
  // Output: [
  //   { code: 'ACUTE', selectedAt: '2024-01-15T10:30:00.000Z' },
  //   { code: 'INFLAMMATION', selectedAt: '2024-01-15T10:30:00.000Z' },
  //   { code: 'STIFFNESS', selectedAt: '2024-01-15T10:30:00.000Z' }
  // ]
}

// Example 3: Migration from legacy format
export function exampleLegacyMigration() {
  // Old questionnaire format
  const legacyIssueTags = ['backNeck', 'postTrauma', 'sportsInjury'];
  
  // Migrate to canonical format
  const canonicalConditions = migrateLegacyIssueTags(legacyIssueTags);
  console.log('Migrated conditions:', canonicalConditions);
  // Output: [
  //   { code: 'BACK_PAIN', selectedAt: '2024-01-15T10:30:00.000Z' },
  //   { code: 'POST_INJURY', selectedAt: '2024-01-15T10:30:00.000Z' },
  //   { code: 'SPORT_OVERUSE', selectedAt: '2024-01-15T10:30:00.000Z' }
  // ]
}

// Example 4: Using the hook in a React component
export function useExampleCanonicalConditionsDemo() {
  // This would be used in a React component
  const {
    toggleConditionByLabel,
    isConditionSelected,
    addConditionByLabel,
    removeConditionByCode,
    getConditionLabels
  } = useCanonicalConditions();
  
  // Example state
  const currentConditions = [
    { code: 'BACK_PAIN' as const, selectedAt: '2024-01-15T10:30:00.000Z' }
  ];
  
  // Toggle a condition
  const updatedConditions = toggleConditionByLabel(currentConditions, 'Po úrazu');
  console.log('Updated conditions:', updatedConditions);
  
  // Check if selected
  const isBackPainSelected = isConditionSelected(currentConditions, 'Bolesti zad');
  console.log('Is back pain selected:', isBackPainSelected);
  
  // Get display labels
  const labels = getConditionLabels(currentConditions);
  console.log('Display labels:', labels);
}

// Example 5: Complete questionnaire answers structure
export function exampleQuestionnaireAnswers() {
  const answers = {
    firstName: 'Jan',
    email: 'jan@example.cz',
    conditionsMain: [
      { code: 'BACK_PAIN' as const, selectedAt: '2024-01-15T10:30:00.000Z' },
      { code: 'POST_INJURY' as const, selectedAt: '2024-01-15T10:30:00.000Z' }
    ],
    conditionsDetail: [
      { code: 'ACUTE' as const, selectedAt: '2024-01-15T10:30:00.000Z' },
      { code: 'INFLAMMATION' as const, selectedAt: '2024-01-15T10:30:00.000Z' }
    ],
    // ... other fields
  };
  
  console.log('Complete answers:', answers);
  return answers;
}

// Example 6: Validation
export function exampleValidation() {
  const conditions = [
    { code: 'BACK_PAIN' as const, selectedAt: '2024-01-15T10:30:00.000Z' },
    { code: 'INVALID_CODE' as any, selectedAt: '2024-01-15T10:30:00.000Z' } // Invalid
  ];
  
  // This would be used with validation functions
  const isValid = conditions.every(condition => 
    Object.values(CANONICAL_CONDITIONS).includes(condition.code)
  );
  
  console.log('Are conditions valid:', isValid); // false
}

// Example 7: All available options
export function exampleAvailableOptions() {
  console.log('Available condition labels:', Object.keys(CANONICAL_CONDITIONS));
  console.log('Available detail labels:', Object.keys(CANONICAL_DETAIL_TAGS));
  
  // Available condition labels: [
  //   'Bolesti zad', 'Krční páteř', 'Rameno / horní končetiny',
  //   'Koleno / dolní končetiny', 'Po úrazu', 'Po operaci',
  //   'Sportovní přetížení', 'Dětské obtíže', 'Těhotenství / po porodu',
  //   'Jiná / nejsem si jistý'
  // ]
  
  // Available detail labels: [
  //   'Akutní', 'Chronické', 'Zánět', 'Ztuhlost',
  //   'Slabost', 'Závratě', 'Bolesti hlavy', 'Problémy se spánkem'
  // ]
}
