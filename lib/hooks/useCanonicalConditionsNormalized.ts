// Enhanced hook for managing canonical conditions with normalization and guardrails

import { useCallback } from 'react';
import { 
  CanonicalCondition, 
  CanonicalDetail
} from '../types/questionnaire';
import { 
  getCanonicalConditionCode, 
  getCanonicalDetailCode,
  getCzechConditionLabel,
  getCzechDetailLabel,
  isValidCanonicalConditionCode,
  isValidCanonicalDetailCode,
  CANONICAL_CONDITIONS,
  CANONICAL_DETAIL_TAGS
} from '../constants/canonical-taxonomy';
import { telemetry } from '../utils/telemetry';

// Telemetry counters for data hygiene
interface NormalizationCounters {
  unknownConditions: number;
  unknownDetails: number;
  duplicateConditions: number;
  duplicateDetails: number;
  preservedOverlaps: number;
}

class NormalizationTelemetry {
  private counters: NormalizationCounters = {
    unknownConditions: 0,
    unknownDetails: 0,
    duplicateConditions: 0,
    duplicateDetails: 0,
    preservedOverlaps: 0
  };

  logUnknownCondition(czechLabel: string): void {
    this.counters.unknownConditions++;
    telemetry.logDataConsistencyIssue('questionnaire_normalization', `Unknown condition label: ${czechLabel}`, {
      type: 'unknown_condition',
      label: czechLabel,
      counter: this.counters.unknownConditions
    });
  }

  logUnknownDetail(czechLabel: string): void {
    this.counters.unknownDetails++;
    telemetry.logDataConsistencyIssue('questionnaire_normalization', `Unknown detail label: ${czechLabel}`, {
      type: 'unknown_detail',
      label: czechLabel,
      counter: this.counters.unknownDetails
    });
  }

  logDuplicateCondition(canonicalCode: CanonicalCondition['code']): void {
    this.counters.duplicateConditions++;
    telemetry.logDataConsistencyIssue('questionnaire_normalization', `Duplicate condition detected: ${canonicalCode}`, {
      type: 'duplicate_condition',
      code: canonicalCode,
      counter: this.counters.duplicateConditions
    });
  }

  logDuplicateDetail(canonicalCode: CanonicalDetail['code']): void {
    this.counters.duplicateDetails++;
    telemetry.logDataConsistencyIssue('questionnaire_normalization', `Duplicate detail detected: ${canonicalCode}`, {
      type: 'duplicate_detail',
      code: canonicalCode,
      counter: this.counters.duplicateDetails
    });
  }

  logPreservedOverlap(condition1: CanonicalCondition['code'], condition2: CanonicalCondition['code']): void {
    this.counters.preservedOverlaps++;
    telemetry.logDataConsistencyIssue('questionnaire_normalization', `Preserved overlap: ${condition1} + ${condition2}`, {
      type: 'preserved_overlap',
      condition1,
      condition2,
      counter: this.counters.preservedOverlaps
    });
  }

  getCounters(): NormalizationCounters {
    return { ...this.counters };
  }

  resetCounters(): void {
    this.counters = {
      unknownConditions: 0,
      unknownDetails: 0,
      duplicateConditions: 0,
      duplicateDetails: 0,
      preservedOverlaps: 0
    };
  }
}

const normalizationTelemetry = new NormalizationTelemetry();

export function useCanonicalConditionsNormalized() {
  // Normalize and deduplicate conditions while preserving insertion order
  const normalizeConditions = useCallback((
    conditions: CanonicalCondition[]
  ): CanonicalCondition[] => {
    const seen = new Set<CanonicalCondition['code']>();
    const normalized: CanonicalCondition[] = [];

    for (const condition of conditions) {
      // Validate canonical code
      if (!isValidCanonicalConditionCode(condition.code)) {
        telemetry.logDataConsistencyIssue('questionnaire_normalization', `Invalid condition code: ${condition.code}`, {
          type: 'invalid_condition_code',
          code: condition.code
        });
        continue;
      }

      // Check for duplicates
      if (seen.has(condition.code)) {
        normalizationTelemetry.logDuplicateCondition(condition.code);
        continue;
      }

      seen.add(condition.code);
      normalized.push(condition);
    }

    return normalized;
  }, []);

  // Normalize and deduplicate details while preserving insertion order
  const normalizeDetails = useCallback((
    details: CanonicalDetail[]
  ): CanonicalDetail[] => {
    const seen = new Set<CanonicalDetail['code']>();
    const normalized: CanonicalDetail[] = [];

    for (const detail of details) {
      // Validate canonical code
      if (!isValidCanonicalDetailCode(detail.code)) {
        telemetry.logDataConsistencyIssue('questionnaire_normalization', `Invalid detail code: ${detail.code}`, {
          type: 'invalid_detail_code',
          code: detail.code
        });
        continue;
      }

      // Check for duplicates
      if (seen.has(detail.code)) {
        normalizationTelemetry.logDuplicateDetail(detail.code);
        continue;
      }

      seen.add(detail.code);
      normalized.push(detail);
    }

    return normalized;
  }, []);

  // Add a condition by Czech label with normalization
  const addConditionByLabel = useCallback((
    currentConditions: CanonicalCondition[],
    czechLabel: string
  ): CanonicalCondition[] => {
    const canonicalCode = getCanonicalConditionCode(czechLabel);
    if (!canonicalCode) {
      normalizationTelemetry.logUnknownCondition(czechLabel);
      return currentConditions;
    }

    // Normalize existing conditions first
    const normalizedConditions = normalizeConditions(currentConditions);

    // Check if already exists
    if (normalizedConditions.some(c => c.code === canonicalCode)) {
      return normalizedConditions;
    }

    const newCondition: CanonicalCondition = {
      code: canonicalCode,
      selectedAt: new Date().toISOString()
    };

    return [...normalizedConditions, newCondition];
  }, [normalizeConditions]);

  // Remove a condition by canonical code
  const removeConditionByCode = useCallback((
    currentConditions: CanonicalCondition[],
    canonicalCode: CanonicalCondition['code']
  ): CanonicalCondition[] => {
    const normalizedConditions = normalizeConditions(currentConditions);
    return normalizedConditions.filter(c => c.code !== canonicalCode);
  }, [normalizeConditions]);

  // Toggle a condition by Czech label with normalization
  const toggleConditionByLabel = useCallback((
    currentConditions: CanonicalCondition[],
    czechLabel: string
  ): CanonicalCondition[] => {
    const canonicalCode = getCanonicalConditionCode(czechLabel);
    if (!canonicalCode) {
      normalizationTelemetry.logUnknownCondition(czechLabel);
      return currentConditions;
    }

    const normalizedConditions = normalizeConditions(currentConditions);
    const exists = normalizedConditions.some(c => c.code === canonicalCode);
    
    if (exists) {
      return removeConditionByCode(normalizedConditions, canonicalCode);
    } else {
      return addConditionByLabel(normalizedConditions, czechLabel);
    }
  }, [normalizeConditions, addConditionByLabel, removeConditionByCode]);

  // Check if a condition is selected by Czech label
  const isConditionSelected = useCallback((
    currentConditions: CanonicalCondition[],
    czechLabel: string
  ): boolean => {
    const canonicalCode = getCanonicalConditionCode(czechLabel);
    if (!canonicalCode) return false;
    
    const normalizedConditions = normalizeConditions(currentConditions);
    return normalizedConditions.some(c => c.code === canonicalCode);
  }, [normalizeConditions]);

  // Add a detail by Czech label with normalization
  const addDetailByLabel = useCallback((
    currentDetails: CanonicalDetail[],
    czechLabel: string
  ): CanonicalDetail[] => {
    const canonicalCode = getCanonicalDetailCode(czechLabel);
    if (!canonicalCode) {
      normalizationTelemetry.logUnknownDetail(czechLabel);
      return currentDetails;
    }

    // Normalize existing details first
    const normalizedDetails = normalizeDetails(currentDetails);

    // Check if already exists
    if (normalizedDetails.some(d => d.code === canonicalCode)) {
      return normalizedDetails;
    }

    const newDetail: CanonicalDetail = {
      code: canonicalCode,
      selectedAt: new Date().toISOString()
    };

    return [...normalizedDetails, newDetail];
  }, [normalizeDetails]);

  // Remove a detail by canonical code
  const removeDetailByCode = useCallback((
    currentDetails: CanonicalDetail[],
    canonicalCode: CanonicalDetail['code']
  ): CanonicalDetail[] => {
    const normalizedDetails = normalizeDetails(currentDetails);
    return normalizedDetails.filter(d => d.code !== canonicalCode);
  }, [normalizeDetails]);

  // Toggle a detail by Czech label with normalization
  const toggleDetailByLabel = useCallback((
    currentDetails: CanonicalDetail[],
    czechLabel: string
  ): CanonicalDetail[] => {
    const canonicalCode = getCanonicalDetailCode(czechLabel);
    if (!canonicalCode) {
      normalizationTelemetry.logUnknownDetail(czechLabel);
      return currentDetails;
    }

    const normalizedDetails = normalizeDetails(currentDetails);
    const exists = normalizedDetails.some(d => d.code === canonicalCode);
    
    if (exists) {
      return removeDetailByCode(normalizedDetails, canonicalCode);
    } else {
      return addDetailByLabel(normalizedDetails, czechLabel);
    }
  }, [normalizeDetails, addDetailByLabel, removeDetailByCode]);

  // Check if a detail is selected by Czech label
  const isDetailSelected = useCallback((
    currentDetails: CanonicalDetail[],
    czechLabel: string
  ): boolean => {
    const canonicalCode = getCanonicalDetailCode(czechLabel);
    if (!canonicalCode) return false;
    
    const normalizedDetails = normalizeDetails(currentDetails);
    return normalizedDetails.some(d => d.code === canonicalCode);
  }, [normalizeDetails]);

  // Get Czech labels for display
  const getConditionLabels = useCallback((conditions: CanonicalCondition[]): string[] => {
    const normalizedConditions = normalizeConditions(conditions);
    return normalizedConditions.map(c => getCzechConditionLabel(c.code));
  }, [normalizeConditions]);

  const getDetailLabels = useCallback((details: CanonicalDetail[]): string[] => {
    const normalizedDetails = normalizeDetails(details);
    return normalizedDetails.map(d => getCzechDetailLabel(d.code));
  }, [normalizeDetails]);

  // Check for and log preserved overlaps (e.g., POST_INJURY + specific region)
  const checkAndLogOverlaps = useCallback((conditions: CanonicalCondition[]): void => {
    const normalizedConditions = normalizeConditions(conditions);
    const codes = normalizedConditions.map(c => c.code);
    
    // Check for POST_INJURY + specific region overlaps
    if (codes.includes('POST_INJURY' as CanonicalCondition['code'])) {
      const specificRegions = ['BACK_PAIN', 'NECK', 'SHOULDER_UPPER_LIMB', 'KNEE_LOWER_LIMB'] as CanonicalCondition['code'][];
      for (const region of specificRegions) {
        if (codes.includes(region)) {
          normalizationTelemetry.logPreservedOverlap('POST_INJURY' as CanonicalCondition['code'], region);
        }
      }
    }
  }, [normalizeConditions]);

  // Get telemetry counters
  const getNormalizationCounters = useCallback((): NormalizationCounters => {
    return normalizationTelemetry.getCounters();
  }, []);

  // Reset telemetry counters
  const resetNormalizationCounters = useCallback((): void => {
    normalizationTelemetry.resetCounters();
  }, []);

  return {
    // Normalization methods
    normalizeConditions,
    normalizeDetails,
    
    // Condition methods
    addConditionByLabel,
    removeConditionByCode,
    toggleConditionByLabel,
    isConditionSelected,
    
    // Detail methods
    addDetailByLabel,
    removeDetailByCode,
    toggleDetailByLabel,
    isDetailSelected,
    
    // Display methods
    getConditionLabels,
    getDetailLabels,
    
    // Overlap detection
    checkAndLogOverlaps,
    
    // Telemetry
    getNormalizationCounters,
    resetNormalizationCounters
  };
}
