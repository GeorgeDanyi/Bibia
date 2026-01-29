// Hook for extracting user problem profile from questionnaire data
// Provides clean shape for matching module consumption

import { useMemo } from 'react';
import { 
  CanonicalCondition, 
  CanonicalDetail, 
  QuestionnaireAnswers 
} from '../types/questionnaire';
import { CanonicalDetailCode } from '../constants/canonical-taxonomy';

export type UserProblemProfile = {
  main: CanonicalCondition[];
  details: CanonicalDetail[];
  // derived flags (for later boosts)
  isAcute: boolean;
  isChronic: boolean;
};

/**
 * Hook that extracts and normalizes user problem profile from questionnaire answers
 * Returns canonical codes and derived flags for matching module consumption
 */
export function useUserProblemProfile(answers: QuestionnaireAnswers): UserProblemProfile {
  return useMemo(() => {
    // Extract main conditions and details from questionnaire answers
    const main = answers.conditionsMain || [];
    const details = answers.conditionsDetail || [];
    
    // Derive flags from detail codes
    const isAcute = details.some(detail => detail.code === 'ACUTE');
    const isChronic = details.some(detail => detail.code === 'CHRONIC');
    
    return {
      main,
      details,
      isAcute,
      isChronic
    };
  }, [answers.conditionsMain, answers.conditionsDetail]);
}

/**
 * Standalone function version for non-React contexts
 * Extracts user problem profile from questionnaire answers
 */
export function getUserProblemProfile(answers: QuestionnaireAnswers): UserProblemProfile {
  // Extract main conditions and details from questionnaire answers
  const main = answers.conditionsMain || [];
  const details = answers.conditionsDetail || [];
  
  // Derive flags from detail codes
  const isAcute = details.some(detail => detail.code === 'ACUTE');
  const isChronic = details.some(detail => detail.code === 'CHRONIC');
  
  return {
    main,
    details,
    isAcute,
    isChronic
  };
}
