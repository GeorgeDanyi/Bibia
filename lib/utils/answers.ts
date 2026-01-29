// Answers utility for localStorage management using the new Answers type
import { Answers, defaultAnswers, migrateToAnswers } from '@/lib/types/answers';

const STORAGE_KEY = 'bibiaQuestionnaireV1';

/**
 * Get answers from localStorage, migrating from old format if needed
 */
export const getAnswers = (): Answers => {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.log('🔍 [GET_ANSWERS] No window/localStorage, returning defaults');
    return defaultAnswers;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('🔍 [GET_ANSWERS] No stored data, returning defaults');
      return defaultAnswers;
    }

    const data = JSON.parse(stored);
    console.log('🔍 [GET_ANSWERS] Raw stored data:', JSON.stringify(data, null, 2));
    
    if (!data.answers) {
      console.warn('🔍 [GET_ANSWERS] No answers in stored data, returning defaults');
      return defaultAnswers;
    }

    const answers = data.answers;
    
    // Check if it's already in new format (has meetingType, not visitMode)
    const isNewFormat = typeof answers.meetingType === 'string' && 
                       ['clinic', 'home', 'online', 'any'].includes(answers.meetingType) &&
                       typeof answers.genderPreference === 'string';
    
    if (isNewFormat) {
      console.log('🔍 [GET_ANSWERS] Detected new format, using directly');
      const result = { ...defaultAnswers, ...answers };
      console.log('🔍 [GET_ANSWERS] Final answers (new format):', JSON.stringify(result, null, 2));
      return result;
    }

    // Migrate from old format
    console.log('🔍 [GET_ANSWERS] Detected old format, migrating...');
    console.log('🔍 [GET_ANSWERS] Old format data:', JSON.stringify(answers, null, 2));
    const migrated = migrateToAnswers(answers);
    console.log('🔍 [GET_ANSWERS] Migrated answers:', JSON.stringify(migrated, null, 2));
    return migrated;
  } catch (error) {
    console.error('🔍 [GET_ANSWERS] Failed to parse answers from localStorage:', error);
    return defaultAnswers;
  }
};

/**
 * Save answers to localStorage
 */
export const setAnswers = (answers: Answers): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const data = {
      answers,
      currentStep: 0,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('Failed to save answers to localStorage:', error);
    return false;
  }
};

/**
 * Legacy function for backward compatibility
 */
export const setAnswer = (key: string, value: any) => {
  const prev = getAnswers();
  const updated = { ...prev, [key]: value };
  setAnswers(updated);
};