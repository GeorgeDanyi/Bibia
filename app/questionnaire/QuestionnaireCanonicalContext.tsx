"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/src/config/routes'

// Feature flags for questionnaire v1
export const featureFlags = {
  citiesAutocomplete: true,
  useGeolocation: true,
  requireAuthToViewResults: false
} as const

// Import new Answers type
import { Answers, defaultAnswers, migrateToAnswers, migrateFromAnswers } from '@/lib/types/answers';

// Legacy interface for backward compatibility (deprecated - use Answers instead)
export interface QuestionnaireCanonicalAnswers {
  // Step 1: Lokalita & forma péče
  city?: string                    // Maps to SearchCriteria.city
  visitMode?: "clinic" | "home_visit" | "online" | "any"  // Maps to SearchCriteria.practice
  
  // Step 2: Důvod návštěvy (redesigned with dynamic refinement)
  conditionsMain: string[]        // Maps to SearchCriteria.conditions (primary categories)
  conditionsDetail: string[]      // Maps to SearchCriteria.conditions (refinement pills)
  conditionsDetailByCategory?: Record<string, string[]> // Persist pill selections per primary category
  activeRefinementCategory?: string // Currently active category for showing refinement pills
  
  // Step 3: Diagnóza (hlavní vstup)
  diagnosisHasDoctor?: boolean
  diagnosisText?: string          // Free-text diagnosis up to 200 chars (legacy)
  diagnosisTags?: string[]        // Common diagnosis tags (legacy)
  hasDiagnosis?: boolean          // New: Yes/No for having diagnosis
  diagnosis?: string[]            // New: stable diagnosis keys (multi-select)
  customDiagnosis?: string        // New: optional free-text diagnosis
  priority?: 'diagnosis' | 'none' // New: priority signal for matching
  
  // Removed: Preferované modality
  
  // Step 4: Dostupnost
  availability: string[]          // Legacy time blocks (kept for backward compatibility)
  weekdays?: string[]             // Legacy weekdays (Mon..Sun)
  step4?: {
    timeOfDay: string[]           // ['morning','late_morning','afternoon','evening','weekend'] or ['any']
    weekdays: string[]            // ['po','ut','st','ct','pa','so','ne']
  }
  
  // Step 5: Jazyk, cena, pojišťovna
  languages: string[]             // Maps to SearchCriteria.languages
  priceRange?: string             // Maps to SearchCriteria.priceRange
  insurance: string[]             // Maps to SearchCriteria.insurance
  
  // Step 6: Speciální potřeby
  ageGroups: string[]             // Maps to SearchCriteria.ageGroups
  workplaceAccessibility: string[] // Maps to SearchCriteria.workplaceAccessibility
  therapistGender?: 'muz' | 'zena' | 'nezalezi'
  consentGiven: boolean           // Required for proceeding
}

// Re-export new Answers type for convenience
export type { Answers } from '@/lib/types/answers';
export { defaultAnswers, migrateToAnswers, migrateFromAnswers } from '@/lib/types/answers';

type QuestionnaireCanonicalState = {
  step: number
  answers: Answers  // Use new Answers type
}

type QuestionnaireCanonicalActions = {
  setStep: (step: number) => void
  setAnswers: (updater: (prev: Answers) => Answers) => void
  reset: () => Promise<void>
}

const QuestionnaireCanonicalCtx = createContext<{ state: QuestionnaireCanonicalState, actions: QuestionnaireCanonicalActions } | null>(null)

export function QuestionnaireCanonicalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [step, setStepState] = useState<number>(0)
  const [answers, setAnswersState] = useState<Answers>(defaultAnswers)

  const setStep = useCallback((s: number) => setStepState(s), [])
  const setAnswers = useCallback((updater: (prev: Answers) => Answers) => {
    setAnswersState(prev => updater(prev))
  }, [])

  const reset = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        // Clear all questionnaire-related localStorage
        localStorage.removeItem('bibiaQuestionnaireV1')
        localStorage.removeItem('questionnaire_progress')
        localStorage.removeItem('questionnaire_answers')
        
        // Clear any other related storage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('questionnaire') || key.includes('bibia'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
      
      // Reset all state to initial values
      setAnswersState(defaultAnswers)
      setStepState(0)
      
      // Wait for state to update
      await Promise.resolve()
      
      // Navigate to fresh questionnaire
      router.replace(`${ROUTES.questionnaire}?v1=true&step=1`)
    } catch (e) {
      console.error('Reset failed:', e)
      // Fallback: force reload to questionnaire
      if (typeof window !== 'undefined') {
        window.location.href = `${ROUTES.questionnaire}?v1=true`
      }
    }
  }, [router])

  const value = useMemo(() => ({
    state: { step, answers },
    actions: { setStep, setAnswers, reset }
  }), [step, answers, setStep, setAnswers, reset])

  return (
    <QuestionnaireCanonicalCtx.Provider value={value}>{children}</QuestionnaireCanonicalCtx.Provider>
  )
}

export function useQuestionnaireCanonical() {
  const ctx = useContext(QuestionnaireCanonicalCtx)
  if (!ctx) throw new Error('useQuestionnaireCanonical must be used within QuestionnaireCanonicalProvider')
  return ctx
}
