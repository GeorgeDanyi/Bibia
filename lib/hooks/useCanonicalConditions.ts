// Hook for managing canonical conditions in the questionnaire

import { useCallback } from 'react';
import { 
  CanonicalCondition, 
  CanonicalDetail
} from '../types/questionnaire';
import { 
  getCanonicalConditionCode, 
  getCanonicalDetailCode,
  getCzechConditionLabel,
  getCzechDetailLabel
} from '../constants/canonical-taxonomy';

export function useCanonicalConditions() {
  // Add a condition by Czech label
  const addConditionByLabel = useCallback((
    currentConditions: CanonicalCondition[],
    czechLabel: string
  ): CanonicalCondition[] => {
    const canonicalCode = getCanonicalConditionCode(czechLabel);
    if (!canonicalCode) {
      console.warn(`Unknown Czech condition label: ${czechLabel}`);
      return currentConditions;
    }

    // Check if already exists
    if (currentConditions.some(c => c.code === canonicalCode)) {
      return currentConditions;
    }

    const newCondition: CanonicalCondition = {
      code: canonicalCode,
      selectedAt: new Date().toISOString()
    };

    return [...currentConditions, newCondition];
  }, []);

  // Remove a condition by canonical code
  const removeConditionByCode = useCallback((
    currentConditions: CanonicalCondition[],
    canonicalCode: CanonicalCondition['code']
  ): CanonicalCondition[] => {
    return currentConditions.filter(c => c.code !== canonicalCode);
  }, []);

  // Toggle a condition by Czech label
  const toggleConditionByLabel = useCallback((
    currentConditions: CanonicalCondition[],
    czechLabel: string
  ): CanonicalCondition[] => {
    const canonicalCode = getCanonicalConditionCode(czechLabel);
    if (!canonicalCode) {
      console.warn(`Unknown Czech condition label: ${czechLabel}`);
      return currentConditions;
    }

    const exists = currentConditions.some(c => c.code === canonicalCode);
    if (exists) {
      return removeConditionByCode(currentConditions, canonicalCode);
    } else {
      return addConditionByLabel(currentConditions, czechLabel);
    }
  }, [addConditionByLabel, removeConditionByCode]);

  // Check if a condition is selected by Czech label
  const isConditionSelected = useCallback((
    currentConditions: CanonicalCondition[],
    czechLabel: string
  ): boolean => {
    const canonicalCode = getCanonicalConditionCode(czechLabel);
    if (!canonicalCode) return false;
    return currentConditions.some(c => c.code === canonicalCode);
  }, []);

  // Add a detail by Czech label
  const addDetailByLabel = useCallback((
    currentDetails: CanonicalDetail[],
    czechLabel: string
  ): CanonicalDetail[] => {
    const canonicalCode = getCanonicalDetailCode(czechLabel);
    if (!canonicalCode) {
      console.warn(`Unknown Czech detail label: ${czechLabel}`);
      return currentDetails;
    }

    // Check if already exists
    if (currentDetails.some(d => d.code === canonicalCode)) {
      return currentDetails;
    }

    const newDetail: CanonicalDetail = {
      code: canonicalCode,
      selectedAt: new Date().toISOString()
    };

    return [...currentDetails, newDetail];
  }, []);

  // Remove a detail by canonical code
  const removeDetailByCode = useCallback((
    currentDetails: CanonicalDetail[],
    canonicalCode: CanonicalDetail['code']
  ): CanonicalDetail[] => {
    return currentDetails.filter(d => d.code !== canonicalCode);
  }, []);

  // Toggle a detail by Czech label
  const toggleDetailByLabel = useCallback((
    currentDetails: CanonicalDetail[],
    czechLabel: string
  ): CanonicalDetail[] => {
    const canonicalCode = getCanonicalDetailCode(czechLabel);
    if (!canonicalCode) {
      console.warn(`Unknown Czech detail label: ${czechLabel}`);
      return currentDetails;
    }

    const exists = currentDetails.some(d => d.code === canonicalCode);
    if (exists) {
      return removeDetailByCode(currentDetails, canonicalCode);
    } else {
      return addDetailByLabel(currentDetails, czechLabel);
    }
  }, [addDetailByLabel, removeDetailByCode]);

  // Check if a detail is selected by Czech label
  const isDetailSelected = useCallback((
    currentDetails: CanonicalDetail[],
    czechLabel: string
  ): boolean => {
    const canonicalCode = getCanonicalDetailCode(czechLabel);
    if (!canonicalCode) return false;
    return currentDetails.some(d => d.code === canonicalCode);
  }, []);

  // Get Czech labels for display
  const getConditionLabels = useCallback((conditions: CanonicalCondition[]): string[] => {
    return conditions.map(c => getCzechConditionLabel(c.code));
  }, []);

  const getDetailLabels = useCallback((details: CanonicalDetail[]): string[] => {
    return details.map(d => getCzechDetailLabel(d.code));
  }, []);

  return {
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
    getDetailLabels
  };
}
