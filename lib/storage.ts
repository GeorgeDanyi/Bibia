/**
 * localStorage utility with JSON serialization and error handling
 * Safe for SSR environments with proper window checks
 */

const STORAGE_KEY = 'questionnaire:v1'

export interface QuestionnaireStorageData {
  formData: {
    step1?: Record<string, unknown>
    step2?: Record<string, unknown>
    step3?: Record<string, unknown>
    step4?: Record<string, unknown>
  }
  currentStep: number
  completedSteps: number[]
}

/**
 * Check if we're in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Get questionnaire data from localStorage
 */
export const getQuestionnaireData = (): QuestionnaireStorageData | null => {
  if (!isBrowser()) {
    return null
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as QuestionnaireStorageData
    
    // Validate the structure
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.formData === 'object' &&
      typeof parsed.currentStep === 'number' &&
      Array.isArray(parsed.completedSteps)
    ) {
      return parsed
    }

    // If structure is invalid, clear it
    localStorage.removeItem(STORAGE_KEY)
    return null
  } catch (error) {
    console.warn('Failed to parse questionnaire data from localStorage:', error)
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore errors when clearing
    }
    return null
  }
}

/**
 * Save questionnaire data to localStorage
 */
export const setQuestionnaireData = (data: QuestionnaireStorageData): boolean => {
  if (!isBrowser()) {
    return false
  }

  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch (error) {
    console.warn('Failed to save questionnaire data to localStorage:', error)
    return false
  }
}

/**
 * Clear questionnaire data from localStorage
 */
export const clearQuestionnaireData = (): boolean => {
  if (!isBrowser()) {
    return false
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.warn('Failed to clear questionnaire data from localStorage:', error)
    return false
  }
}

/**
 * Check if questionnaire data exists in localStorage
 */
export const hasQuestionnaireData = (): boolean => {
  if (!isBrowser()) {
    return false
  }

  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}
