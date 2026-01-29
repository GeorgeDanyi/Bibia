// Utility functions for normalizing questionnaire data at API level

import { 
  CanonicalCondition, 
  CanonicalDetail, 
  CanonicalConditionCode, 
  CanonicalDetailCode 
} from '../types/questionnaire';
import { 
  isValidCanonicalConditionCode,
  isValidCanonicalDetailCode,
  getCanonicalConditionCode,
  getCanonicalDetailCode
} from '../constants/canonical-taxonomy';
import { telemetry } from './telemetry';

export interface NormalizationResult {
  normalizedConditions: CanonicalCondition[];
  normalizedDetails: CanonicalDetail[];
  removedUnknowns: {
    conditions: string[];
    details: string[];
  };
  removedDuplicates: {
    conditions: CanonicalConditionCode[];
    details: CanonicalDetailCode[];
  };
}

/**
 * Normalize questionnaire data to ensure clean, deduplicated data
 * with proper validation and telemetry logging
 */
export function normalizeQuestionnaireData(
  conditionsMain: CanonicalCondition[] = [],
  conditionsDetail: CanonicalDetail[] = []
): NormalizationResult {
  const result: NormalizationResult = {
    normalizedConditions: [],
    normalizedDetails: [],
    removedUnknowns: {
      conditions: [],
      details: []
    },
    removedDuplicates: {
      conditions: [],
      details: []
    }
  };

  // Normalize conditions
  const seenConditions = new Set<CanonicalConditionCode>();
  for (const condition of conditionsMain) {
    // Validate canonical code
    if (!isValidCanonicalConditionCode(condition.code)) {
      telemetry.logDataConsistencyIssue('api_normalization', `Invalid condition code: ${condition.code}`, {
        type: 'invalid_condition_code',
        code: condition.code
      });
      continue;
    }

    // Check for duplicates
    if (seenConditions.has(condition.code)) {
      result.removedDuplicates.conditions.push(condition.code);
      telemetry.logDataConsistencyIssue('api_normalization', `Duplicate condition removed: ${condition.code}`, {
        type: 'duplicate_condition',
        code: condition.code
      });
      continue;
    }

    seenConditions.add(condition.code);
    result.normalizedConditions.push(condition);
  }

  // Normalize details
  const seenDetails = new Set<CanonicalDetailCode>();
  for (const detail of conditionsDetail) {
    // Validate canonical code
    if (!isValidCanonicalDetailCode(detail.code)) {
      telemetry.logDataConsistencyIssue('api_normalization', `Invalid detail code: ${detail.code}`, {
        type: 'invalid_detail_code',
        code: detail.code
      });
      continue;
    }

    // Check for duplicates
    if (seenDetails.has(detail.code)) {
      result.removedDuplicates.details.push(detail.code);
      telemetry.logDataConsistencyIssue('api_normalization', `Duplicate detail removed: ${detail.code}`, {
        type: 'duplicate_detail',
        code: detail.code
      });
      continue;
    }

    seenDetails.add(detail.code);
    result.normalizedDetails.push(detail);
  }

  // Log normalization summary
  if (result.removedUnknowns.conditions.length > 0 || result.removedUnknowns.details.length > 0 ||
      result.removedDuplicates.conditions.length > 0 || result.removedDuplicates.details.length > 0) {
    telemetry.logDataConsistencyIssue('api_normalization', 'Questionnaire data normalized', {
      type: 'normalization_summary',
      removedUnknowns: result.removedUnknowns,
      removedDuplicates: result.removedDuplicates,
      finalConditionsCount: result.normalizedConditions.length,
      finalDetailsCount: result.normalizedDetails.length
    });
  }

  return result;
}

/**
 * Validate and normalize Czech labels to canonical codes
 * This is used when processing form data that might contain Czech labels
 */
export function normalizeCzechLabelsToCanonical(
  czechConditionLabels: string[] = [],
  czechDetailLabels: string[] = []
): {
  conditions: CanonicalCondition[];
  details: CanonicalDetail[];
  unknownLabels: {
    conditions: string[];
    details: string[];
  };
} {
  const result = {
    conditions: [] as CanonicalCondition[],
    details: [] as CanonicalDetail[],
    unknownLabels: {
      conditions: [] as string[],
      details: [] as string[]
    }
  };

  // Process condition labels
  const seenConditionCodes = new Set<CanonicalConditionCode>();
  for (const label of czechConditionLabels) {
    const canonicalCode = getCanonicalConditionCode(label);
    if (!canonicalCode) {
      result.unknownLabels.conditions.push(label);
      telemetry.logDataConsistencyIssue('api_normalization', `Unknown condition label: ${label}`, {
        type: 'unknown_condition_label',
        label
      });
      continue;
    }

    // Avoid duplicates
    if (seenConditionCodes.has(canonicalCode)) {
      continue;
    }

    seenConditionCodes.add(canonicalCode);
    result.conditions.push({
      code: canonicalCode,
      selectedAt: new Date().toISOString()
    });
  }

  // Process detail labels
  const seenDetailCodes = new Set<CanonicalDetailCode>();
  for (const label of czechDetailLabels) {
    const canonicalCode = getCanonicalDetailCode(label);
    if (!canonicalCode) {
      result.unknownLabels.details.push(label);
      telemetry.logDataConsistencyIssue('api_normalization', `Unknown detail label: ${label}`, {
        type: 'unknown_detail_label',
        label
      });
      continue;
    }

    // Avoid duplicates
    if (seenDetailCodes.has(canonicalCode)) {
      continue;
    }

    seenDetailCodes.add(canonicalCode);
    result.details.push({
      code: canonicalCode,
      selectedAt: new Date().toISOString()
    });
  }

  return result;
}

/**
 * Check for and log preserved overlaps (e.g., POST_INJURY + specific region)
 * This helps with later scoring optimizations
 */
export function checkAndLogOverlaps(conditions: CanonicalCondition[]): void {
  const codes = conditions.map(c => c.code);
  
  // Check for POST_INJURY + specific region overlaps
  if (codes.includes('POST_INJURY')) {
    const specificRegions: CanonicalConditionCode[] = ['BACK_PAIN', 'NECK', 'SHOULDER_UPPER_LIMB', 'KNEE_LOWER_LIMB'];
    for (const region of specificRegions) {
      if (codes.includes(region)) {
        telemetry.logDataConsistencyIssue('api_normalization', `Preserved overlap detected: POST_INJURY + ${region}`, {
          type: 'preserved_overlap',
          condition1: 'POST_INJURY',
          condition2: region,
          totalConditions: codes.length
        });
      }
    }
  }

  // Check for other potential overlaps
  const overlapPatterns = [
    { conditions: ['POST_SURGERY', 'SPORT_OVERUSE'], description: 'Post-surgery + sport overuse' },
    { conditions: ['PEDIATRIC', 'PREGNANCY_POSTPARTUM'], description: 'Pediatric + pregnancy' }
  ];

  for (const pattern of overlapPatterns) {
    const hasAll = pattern.conditions.every(code => codes.includes(code as CanonicalConditionCode));
    if (hasAll) {
      telemetry.logDataConsistencyIssue('api_normalization', `Overlap pattern detected: ${pattern.description}`, {
        type: 'overlap_pattern',
        pattern: pattern.conditions,
        description: pattern.description
      });
    }
  }
}
