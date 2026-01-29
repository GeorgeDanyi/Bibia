// Migration utilities for converting between old and new canonical taxonomy formats

import { 
  CanonicalCondition, 
  CanonicalDetail, 
} from '../types/questionnaire';
import { 
  getCanonicalConditionCode, 
  getCanonicalDetailCode,
  getCzechConditionLabel,
  getCzechDetailLabel,
  CANONICAL_CONDITIONS,
  CANONICAL_DETAIL_TAGS,
  CanonicalConditionCode, 
  CanonicalDetailCode 
} from '../constants/canonical-taxonomy';

// Legacy mapping from old questionnaire format to new canonical codes
const LEGACY_TO_CANONICAL_MAPPING: Record<string, CanonicalConditionCode> = {
  'backNeck': 'BACK_PAIN',
  'joints': 'KNEE_LOWER_LIMB', // Assuming joints refers to lower limb joints
  'musclesTendons': 'SHOULDER_UPPER_LIMB', // Assuming upper limb muscles
  'headaches': 'OTHER_UNSURE', // Headaches not in new taxonomy, map to other
  'sportsInjury': 'SPORT_OVERUSE',
  'postSurgery': 'POST_SURGERY',
  'postTrauma': 'POST_INJURY',
  'pregnancyPostpartum': 'PREGNANCY_POSTPARTUM',
  'chronicCondition': 'OTHER_UNSURE', // Chronic not in new taxonomy, map to other
  'other': 'OTHER_UNSURE'
};

// Convert legacy issue tags to canonical conditions
export function migrateLegacyIssueTags(legacyTags: string[]): CanonicalCondition[] {
  const now = new Date().toISOString();
  
  return legacyTags
    .map(tag => {
      const canonicalCode = LEGACY_TO_CANONICAL_MAPPING[tag];
      if (!canonicalCode) {
        console.warn(`Unknown legacy tag: ${tag}, mapping to OTHER_UNSURE`);
        return { code: 'OTHER_UNSURE' as CanonicalConditionCode, selectedAt: now };
      }
      return { code: canonicalCode, selectedAt: now };
    })
    .filter((condition, index, array) => 
      // Remove duplicates, keeping first occurrence
      array.findIndex(c => c.code === condition.code) === index
    );
}

// Convert Czech labels to canonical conditions
export function convertCzechLabelsToCanonical(
  czechLabels: string[], 
  selectedAt?: string
): CanonicalCondition[] {
  const timestamp = selectedAt || new Date().toISOString();
  
  return czechLabels
    .map(label => {
      const canonicalCode = getCanonicalConditionCode(label);
      if (!canonicalCode) {
        console.warn(`Unknown Czech label: ${label}, skipping`);
        return null;
      }
      return { code: canonicalCode, selectedAt: timestamp };
    })
    .filter((condition): condition is CanonicalCondition => condition !== null)
    .filter((condition, index, array) => 
      // Remove duplicates, keeping first occurrence
      array.findIndex(c => c.code === condition.code) === index
    );
}

// Convert Czech detail labels to canonical details
export function convertCzechDetailLabelsToCanonical(
  czechLabels: string[], 
  selectedAt?: string
): CanonicalDetail[] {
  const timestamp = selectedAt || new Date().toISOString();
  
  return czechLabels
    .map(label => {
      const canonicalCode = getCanonicalDetailCode(label);
      if (!canonicalCode) {
        console.warn(`Unknown Czech detail label: ${label}, skipping`);
        return null;
      }
      return { code: canonicalCode, selectedAt: timestamp };
    })
    .filter((detail): detail is CanonicalDetail => detail !== null)
    .filter((detail, index, array) => 
      // Remove duplicates, keeping first occurrence
      array.findIndex(d => d.code === detail.code) === index
    );
}

// Convert canonical conditions back to Czech labels for display
export function convertCanonicalToCzechLabels(conditions: CanonicalCondition[]): string[] {
  return conditions.map(condition => getCzechConditionLabel(condition.code));
}

// Convert canonical details back to Czech labels for display
export function convertCanonicalDetailsToCzechLabels(details: CanonicalDetail[]): string[] {
  return details.map(detail => getCzechDetailLabel(detail.code));
}

// Get all available Czech condition labels
export function getAllCzechConditionLabels(): string[] {
  return Object.keys(CANONICAL_CONDITIONS);
}

// Get all available Czech detail labels
export function getAllCzechDetailLabels(): string[] {
  return Object.keys(CANONICAL_DETAIL_TAGS);
}

// Validation functions
export function validateCanonicalConditions(conditions: CanonicalCondition[]): boolean {
  return conditions.every(condition => 
    condition.code && 
    condition.selectedAt && 
    Object.values(CANONICAL_CONDITIONS).includes(condition.code)
  );
}

export function validateCanonicalDetails(details: CanonicalDetail[]): boolean {
  return details.every(detail => 
    detail.code && 
    detail.selectedAt && 
    Object.values(CANONICAL_DETAIL_TAGS).includes(detail.code)
  );
}
