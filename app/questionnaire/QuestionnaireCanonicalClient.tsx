"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ROUTES } from '@/src/config/routes'
import { useQuestionnaireCanonical as useQuestionnaireV1, QuestionnaireCanonicalAnswers as QuestionnaireV1Answers, featureFlags } from "./QuestionnaireCanonicalContext"
import type { Answers } from "@/lib/types/answers"
import { migrateToAnswers } from "@/lib/types/answers"
import { setStep1 as storeSetStep1, setStep2 as storeSetStep2, setStep3 as storeSetStep3, setStep4 as storeSetStep4, setTestMode as storeSetTestMode } from '@/lib/bibiaStore'
import { STEPS_V1, STEP_V1 } from "./canonical-steps"
import CityInput from '@/components/ui/CityInput'
import { CityResolution } from '@/lib/services/CityService'
import { suggestTop } from '@/lib/utils/diagnosis'
import "./questionnaire-canonical.css"
import { 
  MapPin,
  Building2,
  Home,
  Laptop,
  Activity,
  Bone,
  Dumbbell,
  Headphones,
  Zap,
  Hospital,
  Bandage,
  Baby,
  HelpCircle,
  ClipboardList,
  CalendarDays,
  AlarmClock,
  Globe,
  Sun,
  Sunrise,
  Sunset,
  MoonStar,
  CreditCard,
  Shield,
  User,
  Users,
  UserCircle,
  Circle,
  HeartPulse,
  CheckCircle,
  Timer,
  Accessibility,
  Venus,
  Mars,
  Handshake,
  ArrowRight,
  Loader2,
  Footprints
} from "lucide-react"

// Mapping function from questionnaire answers to SearchCriteria
// Accepts both legacy QuestionnaireV1Answers and the new Answers shape.
export function mapAnswersToSearchCriteria(answers: QuestionnaireV1Answers | Answers | any) {
  const result = {
    // Location
    city: answers.city,
    practice: answers.visitMode || 'clinic',
    
    // Conditions
    conditions: [
      ...(Array.isArray(answers.conditionsMain) ? answers.conditionsMain : []),
      ...(Array.isArray(answers.conditionsDetail) ? answers.conditionsDetail : [])
    ],

    
    
    // Availability (from step4 preferred, fallback to legacy fields)
    availability: Array.isArray(answers.availability) && answers.availability.length > 0 
      ? answers.availability.join(',') 
      : undefined,
    time: (answers.step4?.timeOfDay && answers.step4.timeOfDay.length > 0)
      ? answers.step4.timeOfDay
      : (Array.isArray(answers.availability) && answers.availability.length > 0 ? answers.availability : undefined),
    day: (answers.step4?.weekdays && answers.step4.weekdays.length > 0)
      ? answers.step4.weekdays
      : (Array.isArray((answers as any).weekdays) && (answers as any).weekdays.length > 0 ? (answers as any).weekdays : undefined),
    
    // Languages
    languages: answers.languages,
    
    // Insurance
    // Pokud není označená žádná odpověď v sekci Pojišťovna, automaticky se počítá jako pojišťovny i samoplátci
    insurance: Array.isArray(answers.insurance) && answers.insurance.length > 0 
      ? answers.insurance 
      : ['with-insurance', 'self-pay'],
    
    // Age groups
    ageGroups: answers.ageGroups,
    
    // Accessibility
    workplaceAccessibility: answers.workplaceAccessibility,
    // Gender preference (optional)
    therapistGender: (answers as any).therapistGender
  }
  
  return result
}

export default function QuestionnaireCanonicalClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, actions } = useQuestionnaireV1()
  const currentStep = state.step
  const answers = state.answers
  const setCurrentStep = actions.setStep
  const setAnswers = actions.setAnswers

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [diagnosisInput, setDiagnosisInput] = useState('')
  const [diagMode, setDiagMode] = useState<'has'|'unsure'|null>(null)
  const [suggestions, setSuggestions] = useState<{label:string,id:string,score:number,type:string}[]>([])
  const [activeDxCategory, setActiveDxCategory] = useState<string>('chronic')
  const [cityResolution, setCityResolution] = useState<CityResolution | null>(null)
  const [isDxModalOpen, setIsDxModalOpen] = useState(false)
  // Auth modal (prepared, off by default)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authSubmitting, setAuthSubmitting] = useState<null | 'email' | 'google' | 'apple'>(null)
  const [dxModalCategory, setDxModalCategory] = useState<string | null>(null)
  const [dxModalTemp, setDxModalTemp] = useState<Set<string>>(new Set())

  // Test mode toggle from query
  const isTestMode = (searchParams.get('test') === '1')

  // Normalize to stable snake_case without diacritics
  const normalizeKey = useCallback((label: string): string => {
    return (label || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }, [])

  // Step 2 — categories and dynamic pills mapping
  const CATEGORY_PILLS: Record<string, string[]> = {
    'upper-limb': ['Rameno', 'Loket', 'Zápěstí', 'Prsty'],
    'lower-limb': ['Koleno', 'Kotník', 'Chodidlo', 'Prsty'],
    'back': ['Bederní', 'Hrudní'],
    'neck-head': ['Ztuhlost', 'Bolest hlavy', 'Migréna', 'Tlak za očima'],
    'children': ['Růstové bolesti', 'Držení těla'],
    'post-injury': ['Podvrtnutí', 'Naražení', 'Natržení'],
    'post-surgery': ['Rekonvalescence', 'Jizvy'],
    'sports-overuse': ['Tendinopatie', 'Svalové přetížení'],
    'pregnancy': ['Diastáza', 'Pánevní dno', 'Jizvy po porodu'],
    'womens-health': ['Pánevní dno', 'Menstruační obtíže', 'Intimní bolest', 'Inkontinence']
  }

  const CATEGORY_OPTIONS: { key: string; label: string; icon: any; subtitle?: string }[] = [
    // Body areas first
    { key: 'upper-limb', label: 'Horní končetiny', icon: Bone },
    { key: 'lower-limb', label: 'Dolní končetiny', icon: Bone },
    { key: 'back', label: 'Záda', icon: Activity },
    { key: 'neck-head', label: 'Krk a hlava', icon: Headphones },
    { key: 'children', label: 'Dětské obtíže', icon: Baby },
    // Situational next
    { key: 'post-injury', label: 'Po úrazu', icon: Bandage },
    { key: 'post-surgery', label: 'Po operaci', icon: Hospital },
    { key: 'sports-overuse', label: 'Sportovní přetížení', icon: Zap },
    { key: 'pregnancy', label: 'Těhotenství / po porodu', icon: HeartPulse },
    { key: 'womens-health', label: 'Ženské zdraví', icon: Circle },
  ]

  const setActiveCategory = useCallback((categoryKey: string | undefined) => {
    setAnswers(prev => ({ ...prev, activeRefinementCategory: categoryKey }))
  }, [setAnswers])

  const updateFlattenedDetails = useCallback((byCat: Record<string, string[]>) => {
    const flattened: string[] = Object.values(byCat).flat()
    setAnswers(prev => ({ ...prev, conditionsDetail: flattened }))
  }, [setAnswers])

  // Handle city input change
  const handleCityChange = (value: string) => {
    setAnswers(prev => ({ ...prev, city: value }))
    
    // Clear city error when user starts typing
    if (fieldErrors.city) {
      setFieldErrors(prev => ({ ...prev, city: '' }))
    }
  }

  // Handle city resolution
  const handleCityResolved = (resolution: CityResolution | null) => {
    setCityResolution(resolution)
    if (resolution) {
      setFieldErrors(prev => ({ ...prev, city: '' }))
    }
  }

  const handleVisitModeSelect = (visitMode: "clinic" | "home_visit" | "online" | "any") => {
    setAnswers(prev => ({ ...prev, visitMode }))
    // Clear visit mode error when user selects
    if (fieldErrors.visitMode) {
      setFieldErrors(prev => ({ ...prev, visitMode: '' }))
    }
  }

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('bibiaQuestionnaireV1')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const normalizeArr = (v: any): string[] => Array.isArray(v) ? v : []
        const norm = {
          city: typeof data?.answers?.city === 'string' ? data.answers.city : undefined,
          visitMode: data?.answers?.visitMode,
          conditionsMain: normalizeArr(data?.answers?.conditionsMain),
          conditionsDetail: normalizeArr(data?.answers?.conditionsDetail),
          modalities: normalizeArr(data?.answers?.modalities),
          diagnosisHasDoctor: data?.answers?.diagnosisHasDoctor,
          diagnosisText: typeof data?.answers?.diagnosisText === 'string' ? data.answers.diagnosisText : '',
          diagnosisTags: normalizeArr(data?.answers?.diagnosisTags),
          availability: normalizeArr(data?.answers?.availability),
          bookingSpeed: data?.answers?.bookingSpeed,
          languages: normalizeArr(data?.answers?.languages),
          insurance: normalizeArr(data?.answers?.insurance),
          ageGroups: normalizeArr(data?.answers?.ageGroups),
          workplaceAccessibility: normalizeArr(data?.answers?.workplaceAccessibility),
          therapistGender: ((): 'muz' | 'zena' | 'nezalezi' => {
            const g = data?.answers?.therapistGender
            return g === 'muz' || g === 'zena' || g === 'nezalezi' ? g : 'nezalezi'
          })(),
          consentGiven: !!data?.answers?.consentGiven
        }
        setAnswers(() => migrateToAnswers(norm))
        setCurrentStep(data.currentStep ?? 0)
        // City is already loaded through setAnswers above
      } catch (e) {
        console.error('Failed to load saved progress:', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Persist Step 1 to central store
  useEffect(() => {
    const practiceType =
      answers.meetingType === 'clinic' ? 'office' :
      answers.meetingType === 'home' ? 'home' :
      answers.meetingType === 'online' ? 'online' :
      null
    storeSetStep1({ city: answers.city, practiceType })
  }, [answers.city, answers.meetingType])

  // Persist Step 2 to central store (normalized keys)
  useEffect(() => {
    const categories = (answers.conditionsMain || []).map(normalizeKey)
    const byCat = answers.conditionsDetailByCategory || {}
    const refinements: Record<string, string[]> = {}
    Object.keys(byCat).forEach(k => {
      refinements[normalizeKey(k)] = (byCat[k] || []).map(normalizeKey)
    })
    storeSetStep2({ categories, refinements })
  }, [answers.conditionsMain, answers.conditionsDetailByCategory, normalizeKey])

  // Persist Step 3 to central store
  useEffect(() => {
    storeSetStep3({
      hasDiagnosis: !!answers.hasDiagnosis,
      diagnosis: Array.isArray(answers.diagnosis) ? answers.diagnosis : [],
      customDiagnosis: answers.customDiagnosis || undefined,
      priority: answers.hasDiagnosis ? 'diagnosis' : 'none'
    })
  }, [answers.hasDiagnosis, answers.diagnosis, answers.customDiagnosis])

  // Persist Step 4 to central store
  useEffect(() => {
    const timesRaw = Array.isArray(answers.step4?.timeOfDay) ? answers.step4!.timeOfDay : []
    const times = timesRaw.includes('asap') ? ['asap'] : timesRaw
    const weekdays = Array.isArray(answers.step4?.weekdays) ? answers.step4!.weekdays : []
    storeSetStep4({ times, weekdays })
  }, [answers.step4?.timeOfDay, answers.step4?.weekdays])

  // Persist test mode
  useEffect(() => {
    storeSetTestMode(isTestMode)
  }, [isTestMode])

  // Save progress (debounced ~150ms)
  const saveTimeoutRef = useRef<number | null>(null)
  const saveProgress = useCallback(() => {
    if (!isHydrated) return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem('bibiaQuestionnaireV1', JSON.stringify({
          answers,
          currentStep,
          timestamp: Date.now()
        }))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist questionnaire:', e)
      }
    }, 150)
  }, [isHydrated, answers, currentStep])

  useEffect(() => {
    saveProgress()
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [answers, currentStep, saveProgress])

  const progress = ((currentStep + 1) / STEPS_V1.length) * 100

  const validateStep = (stepIndex: number, answers: QuestionnaireV1Answers | Answers | any): string | null => {
    switch (stepIndex) {
      case STEP_V1.LOCATION:
        if (!answers.city || answers.city.trim() === '') return "Vyber prosím město."
        if (!cityResolution) return "Prosím zadej platné město v ČR"
        if (!answers.visitMode) return "Vyber prosím formu péče."
        break
      case STEP_V1.DIAGNOSIS:
        // Enable CTA when: No selected OR Yes and (>=1 diagnosis OR custom text)
        if (typeof answers.hasDiagnosis === 'undefined') return "Vyber prosím Ano/Ne."
        if (answers.hasDiagnosis === false) return null
        if ((answers.diagnosis && answers.diagnosis.length > 0) || (answers.customDiagnosis && answers.customDiagnosis.trim().length > 0)) return null
        return "Vyber diagnózu nebo napiš vlastní (volitelné)."
      case STEP_V1.CONDITIONS:
        if ((answers.conditionsMain || []).length === 0) return "Vyber prosím aspoň jednu možnost."
        break
      // Removed MODALITIES in v1 canonical steps
      // case STEP_V1.MODALITIES:
        // Optional step - no validation needed
        // break
      case STEP_V1.AVAILABILITY:
        {
          const hasTime = Array.isArray(answers.step4?.timeOfDay) ? answers.step4!.timeOfDay.length > 0 : (Array.isArray(answers.availability) && answers.availability.length > 0)
          const hasDay = Array.isArray(answers.step4?.weekdays) ? answers.step4!.weekdays.length > 0 : (Array.isArray((answers as any).weekdays) && (answers as any).weekdays.length > 0)
          if (!hasTime && !hasDay) return "Vyber aspoň jednu možnost dostupnosti."
        }
        break
      case STEP_V1.PREFERENCES:
        if (answers.languages.length === 0) return "Vyber alespoň jeden jazyk."
        break
      case STEP_V1.SPECIAL_NEEDS:
        if (!Array.isArray(answers.ageGroups) || answers.ageGroups.length === 0) return "Vyber pro koho hledáš."
        if (!answers.consentGiven) return "Musíš souhlasit se zpracováním odpovědí."
        break
    }
    return null
  }

  const handleNext = async () => {
    console.log('🔍 [QUESTIONNAIRE] handleNext called, currentStep:', currentStep, 'totalSteps:', STEPS_V1.length);
    const error = validateStep(currentStep, answers)
    console.log('🔍 [QUESTIONNAIRE] Validation error:', error);
    
    if (error) {
      console.log('🔍 [QUESTIONNAIRE] Validation failed, setting errors');
      setErrors({ [currentStep]: error })
      
      // Set specific field errors for step 1
      if (currentStep === STEP_V1.LOCATION) {
        const fieldErrors: {[key: string]: string} = {}
        if (!answers.city || answers.city.trim() === '') {
          fieldErrors.city = 'Vyber prosím město.'
        } else if (!cityResolution) {
          fieldErrors.city = 'Prosím zadej platné město v ČR'
        }
        if (!answers.visitMode) {
          fieldErrors.visitMode = 'Vyber prosím formu péče.'
        }
        setFieldErrors(fieldErrors)
      }
      return
    }

    setErrors({})
    setFieldErrors({})
    
    if (currentStep < STEPS_V1.length - 1) {
      // If submitting Step 6 (Special Needs), build payload and test the matching API
      if (currentStep === STEP_V1.SPECIAL_NEEDS) {
        // Set loading state
        setIsSubmitting(true)
        
        try {
          const practiceType = answers.visitMode === 'clinic' ? 'office'
            : answers.visitMode === 'home_visit' ? 'home'
            : answers.visitMode === 'online' ? 'online'
            : null
          const categories = (answers.conditionsMain || []).map(normalizeKey)
          const byCat = answers.conditionsDetailByCategory || {}
          const refinements: Record<string, string[]> = {}
          Object.keys(byCat).forEach(k => {
            refinements[normalizeKey(k)] = (byCat[k] || []).map(normalizeKey)
          })
          const payload = {
            step1: { city: answers.city, practiceType },
            step2: { categories, refinements },
            step3: {
              hasDiagnosis: !!answers.hasDiagnosis,
              diagnosis: Array.isArray(answers.diagnosis) ? answers.diagnosis : [],
              customDiagnosis: answers.customDiagnosis || undefined,
              priority: answers.hasDiagnosis ? 'diagnosis' : 'none'
            },
            // Add gender preference
            gender: answers.therapistGender === 'zena' ? 'female' : 
                   answers.therapistGender === 'muz' ? 'male' : 'any',
            strictGender: answers.therapistGender !== 'nezalezi',
            testMode: isTestMode
          }
          console.log('🚀🚀🚀 [UKLÁDÁM DO LOCALSTORAGE] answers.therapistGender:', answers.therapistGender)
          console.log('🚀🚀🚀 [UKLÁDÁM DO LOCALSTORAGE] payload.gender:', payload.gender)
          console.log('🚀🚀🚀 [UKLÁDÁM DO LOCALSTORAGE] payload.strictGender:', payload.strictGender)
          
          // Convert old format to new Answers format for storage
          const { migrateToAnswers } = await import('@/lib/types/answers')
          const { setAnswers } = await import('@/lib/utils/answers')
          
          // Create old format object for migration
          const oldFormatAnswers = {
            ...answers,
            gender: payload.gender,
            therapistGender: answers.therapistGender,
            strictGender: payload.strictGender
          }
          
          // Migrate to new format
          const newFormatAnswers = migrateToAnswers(oldFormatAnswers)
          console.log('🚀🚀🚀 [MIGRACE] Starý formát:', JSON.stringify(oldFormatAnswers, null, 2))
          console.log('🚀🚀🚀 [MIGRACE] Nový formát:', JSON.stringify(newFormatAnswers, null, 2))
          
          // Store in new format using utility function
          setAnswers(newFormatAnswers)
          
          // Also store old format for backward compatibility
          localStorage.setItem('bibiaQuestionnaireV1', JSON.stringify({ 
            answers: oldFormatAnswers,
            currentStep: currentStep 
          }))
          
          // Also store the payload
          localStorage.setItem('bibiaQuestionnairePayload', JSON.stringify(payload))
          
          // Create URL parameters instead of calling API directly
          const params = new URLSearchParams()
          
          // Map answers to URL parameters
          if (answers.city) params.set('city', answers.city)
          if (answers.coords) {
            params.set('lat', String(answers.coords.lat))
            params.set('lng', String(answers.coords.lng))
          }
          if (answers.conditions && answers.conditions.length > 0) {
            params.set('conditions', answers.conditions.join(','))
          }
          if (answers.visitMode) params.set('meetingType', answers.visitMode)
          if (answers.therapistGender) params.set('therapistGender', answers.therapistGender)
          if (answers.radiusKm) params.set('radiusKm', String(answers.radiusKm))
          if (answers.languages && answers.languages.length > 0) {
            params.set('languages', answers.languages.join(','))
          }
          if (answers.timeSlot) params.set('timeSlot', answers.timeSlot)
          if (answers.day) params.set('day', answers.day)
          if (answers.strictGender) params.set('strictGender', String(answers.strictGender))
          
          const url = params.toString() ? `${ROUTES.results}?${params.toString()}` : ROUTES.results
          console.log('🚀🚀🚀 [NAVIGATING TO] URL:', url)
          
          // Navigate to results page with URL parameters
          router.push(url)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Search error', e)
          setIsSubmitting(false)
        }
      }
      setCurrentStep(currentStep + 1)
    } else {
      // Auth-gate (prepared, off by default)
      if (featureFlags.requireAuthToViewResults) {
        // telemetry: cta_results_clicked
        // eslint-disable-next-line no-console
        console.log('cta_results_clicked')
        setIsAuthModalOpen(true)
        return
      }
      // Final step - navigate to results
      console.log('🔍 [QUESTIONNAIRE] Final step - saving answers and navigating...');
      setIsSubmitting(true);
      
      try {
        // Import utilities for saving answers
        const { setAnswers } = await import('@/lib/utils/answers');
        const { migrateToAnswers } = await import('@/lib/types/answers');
        
        // Migrate old format to new Answers format
        const oldFormatAnswers = {
          ...answers,
          therapistGender: answers.therapistGender,
          strictGender: answers.strictGender !== undefined ? answers.strictGender : (answers.therapistGender !== 'nezalezi')
        };
        const newFormatAnswers = migrateToAnswers(oldFormatAnswers);
        console.log('🔍 [QUESTIONNAIRE] Migrated answers to new format:', newFormatAnswers);
        
        // Save to localStorage using new format
        setAnswers(newFormatAnswers);
        console.log('🔍 [QUESTIONNAIRE] Answers saved to localStorage');
        
        // Also build search criteria for URL params (backward compatibility)
        const searchCriteria = mapAnswersToSearchCriteria(answers as any)
        const params = new URLSearchParams()
        
        // Build URL parameters
        if (searchCriteria.city) params.set('city', searchCriteria.city)
        if (searchCriteria.practice) params.set('practice', searchCriteria.practice)
        if (Array.isArray(searchCriteria.conditions) && searchCriteria.conditions.length > 0) {
          params.set('conditions', searchCriteria.conditions.join(','))
        }
        // New diagnosis payload
        if (typeof answers.hasDiagnosis !== 'undefined') params.set('hasDiagnosis', String(answers.hasDiagnosis))
        if (answers.diagnosis && answers.diagnosis.length > 0) params.set('diagnosis', answers.diagnosis.join(','))
        if (answers.customDiagnosis && answers.customDiagnosis.trim()) params.set('customDiagnosis', answers.customDiagnosis.trim())
        if (answers.hasDiagnosis === true) params.set('priority', 'diagnosis')
        
        if (searchCriteria.availability) params.set('availability', searchCriteria.availability)
        if (Array.isArray(searchCriteria.time) && searchCriteria.time.length > 0) {
          params.set('time', searchCriteria.time.join(','))
        }
        if (Array.isArray(searchCriteria.day) && searchCriteria.day.length > 0) {
          params.set('day', searchCriteria.day.join(','))
        }
        if (Array.isArray(searchCriteria.languages) && searchCriteria.languages.length > 0) {
          params.set('languages', searchCriteria.languages.join(','))
        }
        if (Array.isArray(searchCriteria.insurance) && searchCriteria.insurance.length > 0) {
          params.set('insurance', searchCriteria.insurance.join(','))
        }
        if (Array.isArray(searchCriteria.ageGroups) && searchCriteria.ageGroups.length > 0) {
          params.set('ageGroups', searchCriteria.ageGroups.join(','))
        }
        if (Array.isArray(searchCriteria.workplaceAccessibility) && searchCriteria.workplaceAccessibility.length > 0) {
          params.set('workplaceAccessibility', searchCriteria.workplaceAccessibility.join(','))
        }
        
        if ((searchCriteria as any).therapistGender) {
          params.set('therapistGender', (searchCriteria as any).therapistGender)
        }
        
        const url = params.toString() ? `${ROUTES.results}?${params.toString()}` : ROUTES.results
        console.log('🔍 [QUESTIONNAIRE] Navigating to:', url);
        router.push(url)
        setIsSubmitting(false);
      } catch (error) {
        console.error('🔍 [QUESTIONNAIRE] Navigation error:', error)
        setIsSubmitting(false);
        // Still navigate even if saving fails
        router.push(ROUTES.results)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Navigate to results after auth success (shared)
  const handleNextAfterAuth = async () => {
    try {
      const searchCriteria = mapAnswersToSearchCriteria(answers as any)
      const params = new URLSearchParams()
      if (searchCriteria.city) params.set('city', searchCriteria.city)
      if (searchCriteria.practice) params.set('practice', searchCriteria.practice)
      if (searchCriteria.conditions.length > 0) params.set('conditions', searchCriteria.conditions.join(','))
      if (typeof answers.hasDiagnosis !== 'undefined') params.set('hasDiagnosis', String(answers.hasDiagnosis))
      if (answers.diagnosis && answers.diagnosis.length > 0) params.set('diagnosis', answers.diagnosis.join(','))
      if (answers.customDiagnosis && answers.customDiagnosis.trim()) params.set('customDiagnosis', answers.customDiagnosis.trim())
      if (answers.hasDiagnosis === true) params.set('priority', 'diagnosis')
      if (searchCriteria.availability) params.set('availability', searchCriteria.availability)
      if (searchCriteria.time) params.set('time', (searchCriteria.time as string[]).join(','))
      if (searchCriteria.day) params.set('day', (searchCriteria.day as string[]).join(','))
      if (searchCriteria.languages.length > 0) params.set('languages', searchCriteria.languages.join(','))
      if (searchCriteria.insurance.length > 0) params.set('insurance', searchCriteria.insurance.join(','))
      if (Array.isArray(searchCriteria.ageGroups) && searchCriteria.ageGroups.length > 0) params.set('ageGroups', searchCriteria.ageGroups.join(','))
      if (Array.isArray(searchCriteria.workplaceAccessibility) && searchCriteria.workplaceAccessibility.length > 0) params.set('workplaceAccessibility', searchCriteria.workplaceAccessibility.join(','))
      if ((searchCriteria as any).therapistGender) params.set('therapistGender', (searchCriteria as any).therapistGender)
      const url = params.toString() ? `${ROUTES.results}?${params.toString()}` : ROUTES.results
      router.push(url)
    } catch (error) {
      console.error('Navigation error:', error)
      router.push(ROUTES.results)
    }
  }

  const isStepValid = () => {
    const error = validateStep(currentStep, answers)
    const isValid = !error
    if (currentStep === STEPS_V1.length - 1) {
      console.log('🔍 [QUESTIONNAIRE] isStepValid check for final step:', isValid, 'error:', error, 'currentStep:', currentStep, 'totalSteps:', STEPS_V1.length);
    }
    return isValid
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-green-700">Načítání dotazníku...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Auth Modal (prepared; controlled by featureFlags.requireAuthToViewResults) */}
      {isAuthModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center"
          data-testid="auth-modal"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              // telemetry: auth_cancel
              // eslint-disable-next-line no-console
              console.log('auth_cancel')
              setIsAuthModalOpen(false)
            }
          }}
        >
          <div className="absolute inset-0 bg-black/30" onClick={() => {
            // telemetry: auth_cancel
            // eslint-disable-next-line no-console
            console.log('auth_cancel')
            setIsAuthModalOpen(false)
          }}></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-6">
            <h2 id="auth-modal-title" className="text-lg font-semibold text-gray-900 mb-1">Pokračuj přihlášením</h2>
            <p className="text-sm text-gray-600 mb-5">Stačí se rychle přihlásit a ukážeme ti výsledky na míru.</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="h-11 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={async () => {
                  setAuthSubmitting('email')
                  // simulate auth; on success -> navigate
                  try {
                    // telemetry: auth_success
                    // eslint-disable-next-line no-console
                    console.log('auth_success', 'email')
                    setIsAuthModalOpen(false)
                    await handleNextAfterAuth()
                  } finally {
                    setAuthSubmitting(null)
                  }
                }}
                disabled={authSubmitting !== null}
                data-testid="login-email"
              >
                {authSubmitting === 'email' ? 'Načítání…' : 'Přihlásit e-mailem'}
              </button>
              <button
                type="button"
                className="h-11 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={async () => {
                  setAuthSubmitting('google')
                  try {
                    // eslint-disable-next-line no-console
                    console.log('auth_success', 'google')
                    setIsAuthModalOpen(false)
                    await handleNextAfterAuth()
                  } finally {
                    setAuthSubmitting(null)
                  }
                }}
                disabled={authSubmitting !== null}
                data-testid="login-google"
              >
                {authSubmitting === 'google' ? 'Načítání…' : 'Pokračovat přes Google'}
              </button>
              <button
                type="button"
                className="h-11 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={async () => {
                  setAuthSubmitting('apple')
                  try {
                    // eslint-disable-next-line no-console
                    console.log('auth_success', 'apple')
                    setIsAuthModalOpen(false)
                    await handleNextAfterAuth()
                  } finally {
                    setAuthSubmitting(null)
                  }
                }}
                disabled={authSubmitting !== null}
                data-testid="login-apple"
              >
                {authSubmitting === 'apple' ? 'Načítání…' : 'Pokračovat přes Apple'}
              </button>
              <button
                type="button"
                className="h-10 text-sm text-gray-600 underline mt-1 self-center"
                onClick={() => {
                  // telemetry: auth_cancel
                  // eslint-disable-next-line no-console
                  console.log('auth_cancel')
                  setIsAuthModalOpen(false)
                }}
                data-testid="auth-close"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Home Button */}
      <div className="fixed top-4 right-4 z-50">
        <Link 
          href="/" 
          className="w-11 h-11 bg-gradient-to-br from-[#118A73] to-[#0F7A66] border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          aria-label="Zpět na úvodní stránku"
        >
          <Home className="w-5 h-5 text-white group-hover:text-white/90" />
        </Link>
      </div>

      {/* Aria-live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {Object.values(fieldErrors).join(' ')}
      </div>

      {/* Desktop Layout with Sidebar */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-6 flex flex-col h-full">
            {/* Progress Circle */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#0d9488"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40 * (progress / 100)}, ${2 * Math.PI * 40}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-900">{Math.round(progress)}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">Krok {currentStep + 1} z {STEPS_V1.length}</p>
            </div>

            {/* Steps List */}
            <div className="space-y-2 flex-1">
              {STEPS_V1.map((step, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                const isFuture = index > currentStep
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#0d9488] text-white shadow-md' 
                        : isCompleted 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'text-gray-500 opacity-60'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
            
            {/* Začít znovu Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  if (confirm('Opravdu chceš začít znovu? Všechny odpovědi budou smazány.')) {
                    // Clear all local state
                    setErrors({})
                    setFieldErrors({})
                    setIsSubmitting(false)
                    
                    // Reset questionnaire state
                    actions.reset()
                  }
                }}
                className="w-full px-4 py-3 text-sm text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Začít znovu
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col items-stretch justify-center p-4">
            <div className="max-w-[920px] w-full mx-auto flex flex-col items-center">
        {/* Step Content */}
        {currentStep === STEP_V1.LOCATION && (
          <div className="text-center">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">Jaké setkání ti vyhovuje?</h1>
              <p className="text-base text-gray-400 leading-relaxed font-normal">Vyber město a formu péče, která ti sedí nejvíc.</p>
            </div>

            {/* City Input Group - Primary Focal Element */}
            <div className="flex justify-center mb-12">
              <div className="min-w-[360px]">
                <CityInput
                  value={answers.city || ''}
                  onChange={handleCityChange}
                  onCityResolved={handleCityResolved}
                  placeholder="Začni psát město…"
                  featureFlags={{
                    citiesAutocomplete: featureFlags.citiesAutocomplete,
                    useGeolocation: featureFlags.useGeolocation
                  }}
                  showHelperText={true}
                />
              </div>
            </div>
            {fieldErrors.city && (
              <p className="text-red-500 text-sm mt-2">
                {fieldErrors.city}
              </p>
            )}

            {/* Visit Mode Cards - Secondary Elements */}
            <div className="flex justify-center gap-6 mb-16">
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[920px] w-full"
                role="radiogroup"
                aria-label="Vyber formu péče"
              >
                {[
                  { 
                    key: 'clinic', 
                    label: 'Ordinace', 
                    subtitle: 'Osobní návštěva',
                    icon: () => (
                      <Building2 className="w-6 h-6" />
                    )
                  },
                  { 
                    key: 'home_visit', 
                    label: 'Návštěva doma', 
                    subtitle: 'U tebe doma',
                    icon: () => (
                      <Home className="w-6 h-6" />
                    )
                  },
                  { 
                    key: 'online', 
                    label: 'Online konzultace', 
                    subtitle: 'Videohovor',
                    icon: () => (
                      <Laptop className="w-6 h-6" />
                    )
                  },
                  { 
                    key: 'any', 
                    label: 'Nezáleží mi na tom', 
                    subtitle: 'Jakákoli forma',
                    icon: () => (
                      <Globe className="w-6 h-6" />
                    )
                  }
                ].map((option, index) => {
                  const IconComponent = option.icon
                  const isSelected = answers.visitMode === option.key
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        handleVisitModeSelect(option.key as "clinic" | "home_visit" | "online" | "any")
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleVisitModeSelect(option.key as "clinic" | "home_visit" | "online" | "any")
                        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                          e.preventDefault()
                          const nextIndex = (index + 1) % 4
                          const nextOption = [
                            { key: 'clinic' }, { key: 'home_visit' }, { key: 'online' }, { key: 'any' }
                          ][nextIndex]
                          handleVisitModeSelect(nextOption.key as "clinic" | "home_visit" | "online" | "any")
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                          e.preventDefault()
                          const prevIndex = index === 0 ? 3 : index - 1
                          const prevOption = [
                            { key: 'clinic' }, { key: 'home_visit' }, { key: 'online' }, { key: 'any' }
                          ][prevIndex]
                          handleVisitModeSelect(prevOption.key as "clinic" | "home_visit" | "online" | "any")
                        }
                      }}
                      className={`w-full h-36 p-6 rounded-[18px] border transition-all duration-300 flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2 ${
                        isSelected 
                          ? 'border border-[#14b8a6] bg-gradient-to-br from-[#f0fdfa] to-[#ecfdf5] shadow-[0_4px_16px_rgba(20,184,166,0.12)] scale-[1.01]' 
                          : 'border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#0d9488]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:scale-[1.01]'
                      }`}
                      aria-label={`${option.label} - ${option.subtitle}`}
                      aria-checked={isSelected}
                      role="radio"
                      tabIndex={isSelected ? 0 : -1}
                    >
                      <div className={`mb-3 ${isSelected ? 'text-[#14b8a6]' : 'text-[#0d9488]'}`}>
                        <IconComponent />
                      </div>
                      <h3 className="text-base font-medium text-gray-700 mb-1">{option.label}</h3>
                      <p className="text-sm text-gray-500">{option.subtitle}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            {fieldErrors.visitMode && (
              <p className="text-red-500 text-sm mt-3 text-center">
                {fieldErrors.visitMode}
              </p>
            )}

            {errors[STEP_V1.LOCATION] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.LOCATION]}</p>}
          </div>
        )}

        {currentStep === STEP_V1.CONDITIONS && (
          <div className="w-full flex items-center justify-center min-h-screen">
            <div className="text-center flex flex-col items-center justify-center w-full min-h-screen pb-24 translate-y-4 md:translate-y-6">
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">S čím ti můžeme pomoct?</h1>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">Můžeš vybrat i více možností.</p>
            </div>

            {/* Primary grid — generalized categories */}
            <div className="flex justify-center gap-2 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 max-w-[920px] w-full" role="group" aria-label="Vyber oblasti">
                {CATEGORY_OPTIONS.map((option, index) => {
                  const IconComponent = option.icon
                  const conditionsMain = answers.conditionsMain || []
                  const isSelected = conditionsMain.includes(option.key)
                  return (
                    <button
                      key={option.key}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`Vybrat ${option.label}`}
                      onClick={() => {
                        const wasSelected = isSelected
                        const updated = wasSelected
                          ? conditionsMain.filter((c: string) => c !== option.key)
                          : [...conditionsMain, option.key]
                        // Update selected categories
                        setAnswers(prev => ({ ...prev, conditionsMain: updated }))
                        // If deselecting, clear its pills and update flattened details
                        if (wasSelected) {
                          const nextByCat: Record<string, string[]> = { ...(answers.conditionsDetailByCategory || {}) }
                          delete nextByCat[option.key]
                          setAnswers(prev => ({ ...prev, conditionsDetailByCategory: nextByCat }))
                          updateFlattenedDetails(nextByCat)
                          // If we removed the active, choose next active by grid order
                          if (answers.activeRefinementCategory === option.key) {
                            const ordered = CATEGORY_OPTIONS.map(o => o.key).filter(k => updated.includes(k))
                            const nextActive = ordered[0]
                            setActiveCategory(nextActive)
                          }
                        } else {
                          // When selecting a new category, make it the active refinement immediately
                          setActiveCategory(option.key)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          const wasSelected = isSelected
                          const conditionsMain = answers.conditionsMain || []
                          const updated = wasSelected
                            ? conditionsMain.filter((c: string) => c !== option.key)
                            : [...conditionsMain, option.key]
                          setAnswers(prev => ({ ...prev, conditionsMain: updated }))
                          if (wasSelected) {
                            const nextByCat: Record<string, string[]> = { ...(answers.conditionsDetailByCategory || {}) }
                            delete nextByCat[option.key]
                            setAnswers(prev => ({ ...prev, conditionsDetailByCategory: nextByCat }))
                            updateFlattenedDetails(nextByCat)
                            if (answers.activeRefinementCategory === option.key) {
                              const ordered = CATEGORY_OPTIONS.map(o => o.key).filter(k => updated.includes(k))
                              const nextActive = ordered[0]
                              setActiveCategory(nextActive)
                            }
                          } else {
                            // On select via keyboard, also make newly selected category active
                            setActiveCategory(option.key)
                          }
                        }
                      }}
                      className={`w-full h-24 p-3 rounded-[14px] border transition-all duration-300 flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2 ${
                        isSelected 
                          ? 'border border-[#14b8a6] bg-gradient-to-br from-[#f0fdfa] to-[#ecfdf5] shadow-[0_4px_16px_rgba(20,184,166,0.12)] scale-[1.01]'
                          : 'border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#0d9488]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:scale-[1.01]'
                      }`}
                    >
                      <div className={`mb-2 ${isSelected ? 'text-[#14b8a6]' : 'text-[#0d9488]'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-700 leading-tight">{option.label}</h3>
                    </button>
                  )
                })}
              </div>
            </div>
            {errors[STEP_V1.CONDITIONS] && (
              <p className="text-red-500 text-sm mt-2">{errors[STEP_V1.CONDITIONS]}</p>
            )}

            {/* Dynamic refinement pills — single active block with navigation chips */}
            {/* Stable refinement region to prevent layout jump */}
            <div className="w-full max-w-[920px] mx-auto mt-4 min-h-40 md:min-h-44" aria-live="polite">
              {/* Navigation chips row with fixed height placeholder */}
              <div className="min-h-9 mb-4 flex items-center justify-center">
                {(answers.conditionsMain || []).length > 0 && (
                  <div
                    role="tablist"
                    aria-label="Vybrané oblasti"
                    className="flex flex-wrap justify-center gap-2"
                  >
                    {CATEGORY_OPTIONS.filter(o => (answers.conditionsMain || []).includes(o.key)).map((option, idx) => {
                      const conditionsMain = answers.conditionsMain || []
                      const isActive = (answers.activeRefinementCategory || conditionsMain[0]) === option.key
                      return (
                        <button
                          key={option.key}
                          role="tab"
                          id={`tab-${option.key}`}
                          aria-selected={isActive}
                          aria-controls={`refine-${option.key}`}
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => setActiveCategory(option.key)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowRight') {
                              e.preventDefault()
                              const conditionsMain = answers.conditionsMain || []
                              const ordered = CATEGORY_OPTIONS.filter(o => conditionsMain.includes(o.key))
                              const next = ordered[(idx + 1) % ordered.length]
                              setActiveCategory(next.key)
                            } else if (e.key === 'ArrowLeft') {
                              e.preventDefault()
                              const conditionsMain = answers.conditionsMain || []
                              const ordered = CATEGORY_OPTIONS.filter(o => conditionsMain.includes(o.key))
                              const prev = ordered[idx === 0 ? ordered.length - 1 : idx - 1]
                              setActiveCategory(prev.key)
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full border text-sm transition-all ${isActive ? 'border-[#1A8E76] bg-[#E9F7F3] font-medium' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Active block area */}
              {(answers.conditionsMain || []).length > 0 && (() => {
                const conditionsMain = answers.conditionsMain || []
                const activeKey = (answers.activeRefinementCategory && conditionsMain.includes(answers.activeRefinementCategory))
                  ? answers.activeRefinementCategory
                  : conditionsMain[0]
                if (!activeKey) return null
                const option = CATEGORY_OPTIONS.find(o => o.key === activeKey)
                if (!option) return null
                const pillOptions = CATEGORY_PILLS[activeKey] || []
                const byCat = answers.conditionsDetailByCategory || {}
                const selectedForCat = byCat[activeKey] || []
                return (
                  <section
                    id={`refine-${activeKey}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${activeKey}`}
                  >
                    <div className="text-center mb-2">
                      <h3 className="text-sm font-semibold text-gray-800">Můžeš to upřesnit (volitelné).</h3>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3" role="group" aria-label={`Upřesnění pro ${option.label}`}>
                      {pillOptions.map((pill) => {
                        const isSelected = selectedForCat.includes(pill)
                        return (
                          <button
                            key={pill}
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            aria-label={`Vybrat ${pill}`}
                            onClick={() => {
                              const nextByCat: Record<string, string[]> = { ...byCat }
                              const base = nextByCat[activeKey] || []
                              nextByCat[activeKey] = isSelected ? base.filter(p => p !== pill) : [...base, pill]
                              setAnswers(prev => ({ ...prev, conditionsDetailByCategory: nextByCat }))
                              updateFlattenedDetails(nextByCat)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                const nextByCat: Record<string, string[]> = { ...byCat }
                                const base = nextByCat[activeKey] || []
                                nextByCat[activeKey] = isSelected ? base.filter(p => p !== pill) : [...base, pill]
                                setAnswers(prev => ({ ...prev, conditionsDetailByCategory: nextByCat }))
                                updateFlattenedDetails(nextByCat)
                              }
                            }}
                            className={`questionnaire-v1-pill ${isSelected ? 'active' : ''}`}
                          >
                            {pill}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })()}
            </div>
            </div>
          </div>
        )}

        {currentStep === STEP_V1.DIAGNOSIS && (
          <div className="w-full flex items-center justify-center min-h-screen">
            <div className="text-center flex flex-col items-center justify-center w-full min-h-screen pb-24">
              {/* Headline */}
              <div className="mt-[56px] md:mt-[80px] mb-3">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">Stanovil ti lékař konkrétní diagnózu?</h1>
                <p className="text-xs text-gray-400 leading-relaxed font-normal">Pomůžeš nám, když vybereš tu, která ti sedí nejvíc.</p>
              </div>

              {/* Yes/No cards */}
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto mb-6 mt-1 md:mt-2">
                {[{ key: 'has', label: 'Ano, mám diagnózu' }, { key: 'unsure', label: 'Ne / nejsem si jistý/á' }].map(opt => {
                  const active = (answers.hasDiagnosis === true && opt.key === 'has') || (answers.hasDiagnosis === false && opt.key === 'unsure')
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        const isHas = opt.key === 'has'
                        setDiagMode(isHas ? 'has' : 'unsure')
                        setAnswers(prev => ({
                          ...prev,
                          hasDiagnosis: isHas,
                          // If selecting No, clear any previous diagnosis selections
                          diagnosis: isHas ? (prev.diagnosis || []) : [],
                          customDiagnosis: isHas ? (prev.customDiagnosis || '') : '',
                          priority: isHas ? 'diagnosis' : 'none'
                        }))
                      }}
                      className={`min-h-[72px] px-10 rounded-[18px] border transition-all flex items-center justify-center ${active ? 'border-[#14b8a6] bg-gradient-to-br from-[#f0fdfa] to-[#ecfdf5] shadow-[0_8px_22px_rgba(20,184,166,0.16)]' : 'border-gray-200 bg-white hover:border-[#0d9488]/30 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]'}`}
                    >
                      <div className={`${active ? 'text-[#0d9488] font-semibold' : 'text-gray-700'} text-[18px]`}>{opt.label}</div>
                    </button>
                  )
                })}
              </div>

              {/* Expanded area placeholder to prevent layout jump */}
              <div className="w-full max-w-[920px] mx-auto">
                <div className="border-t border-gray-200 mt-4 pt-5">
                  <div className="min-h-[460px] transition-opacity duration-200" aria-live="polite">
                    {answers.hasDiagnosis === true && (
                      <div>
                        <div className="text-center mb-3">
                          <h3 className="text-sm font-semibold text-gray-800">Vyber svoji diagnózu nebo ji napiš (volitelné).</h3>
                        </div>
                        {/* Category switcher */}
                        <div className="flex flex-wrap justify-center gap-2 mb-5" role="tablist" aria-label="Kategorie diagnóz">
                          {[
                            { key: 'chronic', label: 'Chronické obtíže' },
                            { key: 'injury_postop', label: 'Úrazy a pooperační stavy' },
                            { key: 'neuro', label: 'Neurologické diagnózy' },
                            { key: 'onco_rare', label: 'Onkologické a vzácné' }
                          ].map(cat => (
                            <button
                              key={cat.key}
                              role="tab"
                              aria-selected={activeDxCategory === cat.key}
                              onClick={() => setActiveDxCategory(cat.key)}
                              className={`px-3 py-1.5 rounded-full border text-sm transition-all ${activeDxCategory === cat.key ? 'border-[#1A8E76] bg-[#E9F7F3] font-medium' : 'border-gray-200 bg-white hover:bg-gray-50'} text-gray-800`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        {/* Diagnosis grid by category */
                        }
                        {(() => {
                          const byCat: Record<string, { id: string; label: string }[]> = {
                            chronic: [
                              { id: 'skolioza', label: 'Skolióza' },
                              { id: 'bechterev', label: 'Bechtěrev' },
                              { id: 'chronic_back_pain', label: 'Chronická bolest zad' },
                              { id: 'artroza', label: 'Artróza' },
                              { id: 'tendinopatie', label: 'Tendinopatie' },
                              { id: 'plantarni_fasciitida', label: 'Plantární fasciitida' }
                            ],
                            injury_postop: [
                              { id: 'ankle_sprain', label: 'Podvrtnutí kotníku' },
                              { id: 'knee_injury_acl_mcl', label: 'Poranění kolene (ACL/MCL)' },
                              { id: 'post_fracture_rehab', label: 'Po zlomenině (rehabilitace)' },
                              { id: 'post_spine_surgery', label: 'Po operaci páteře' },
                              { id: 'post_meniscus_surgery', label: 'Po operaci menisku' },
                              { id: 'post_hip_arthroplasty', label: 'Po endoprotéze kyčle' }
                            ],
                            neuro: [
                              { id: 'rs', label: 'Roztroušená skleróza' },
                              { id: 'parkinson', label: 'Parkinsonova choroba' },
                              { id: 'post_stroke', label: 'Po CMP (mrtvice)' },
                              { id: 'polyneuropatie', label: 'Polyneuropatie' },
                              { id: 'radikulopatie', label: 'Radikulopatie (výhřez)' },
                              { id: 'dmo', label: 'Dětská mozková obrna' }
                            ],
                            onco_rare: [
                              { id: 'lymfedem', label: 'Lymfedém' },
                              { id: 'onko_rehab', label: 'Onkologická rehabilitace' },
                              { id: 'scar_management_onco', label: 'Jizvy po ozařování/operaci' },
                              { id: 'cipn', label: 'Chemoterapií indukovaná neuropatie' },
                              { id: 'cancer_related_fatigue', label: 'Únava související s onemocněním' },
                              { id: 'rare_diagnosis_consult', label: 'Vzácná diagnóza (konzultace)' }
                            ]
                          }
                          const options = byCat[activeDxCategory] || []
                          const topSix = options.slice(0, 6)
                          const display: ({id:string; label:string; fallback?:boolean})[] = [...topSix]
                          if (display.length < 6) {
                            const padCount = 6 - display.length
                            for (let i = 0; i < padCount; i++) display.push({ id: `__more__-${i}`, label: 'Další diagnózy…', fallback: true })
                          }
                          const showMoreLink = options.length > 6
                          const selected = new Set(answers.diagnosis || [])
                          return (
                            <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2 max-w-2xl mx-auto" role="group" aria-label="Diagnózy">
                              {display.map(item => {
                                const isSelected = !item.fallback && selected.has(item.id)
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      if (item.fallback) {
                                        setDxModalCategory(activeDxCategory)
                                        setDxModalTemp(new Set(answers.diagnosis || []))
                                        setIsDxModalOpen(true)
                                        return
                                      }
                                      const base = answers.diagnosis || []
                                      const updated = isSelected ? base.filter(d => d !== item.id) : [...base, item.id]
                                      setAnswers(prev => ({ ...prev, diagnosis: updated }))
                                    }}
                                    className={`h-16 p-3 rounded-[12px] border transition-all text-center focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2 flex items-center justify-center ${item.fallback ? 'border-dashed border-gray-300 bg-white hover:border-[#0d9488]/30' : (isSelected ? 'border-[#1A8E76] bg-[#E9F7F3] font-medium shadow-[0_2px_8px_rgba(20,184,166,0.12)]' : 'border-gray-200 bg-white hover:border-[#0d9488]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]')}`}
                                  >
                                    <span className={`text-[13px] leading-snug ${item.fallback ? 'text-gray-600' : 'text-gray-800'}`}>{item.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                            {showMoreLink && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDxModalCategory(activeDxCategory)
                                  setDxModalTemp(new Set(answers.diagnosis || []))
                                  setIsDxModalOpen(true)
                                }}
                                className="text-xs text-[#0d9488] hover:underline"
                              >
                                Zobrazit vše
                              </button>
                            )}
                            </>
                          )
                        })()}

                        {/* Custom input */}
                        <div className="max-w-2xl mx-auto mt-6">
                          <input
                            type="text"
                            value={answers.customDiagnosis || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, customDiagnosis: e.target.value }))}
                            placeholder="Nenalezl/a jsi? Napiš vlastní diagnózu…"
                            className="w-full h-10 px-3 rounded-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488] text-sm text-gray-700 placeholder:text-gray-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {errors[STEP_V1.DIAGNOSIS] && (
                <p className="text-red-500 text-sm mt-2">{errors[STEP_V1.DIAGNOSIS]}</p>
              )}
              {/* Modal for full diagnosis list */}
              {isDxModalOpen && dxModalCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/30" onClick={() => setIsDxModalOpen(false)}></div>
                  <div className="relative bg-white rounded-[14px] border border-gray-200 shadow-xl w-full max-w-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Vyber diagnózy</h4>
                    {(() => {
                      const allByCat: Record<string, { id: string; label: string }[]> = {
                        chronic: [
                          { id: 'skolioza', label: 'Skolióza' },
                          { id: 'bechterev', label: 'Bechtěrev' },
                          { id: 'chronic_back_pain', label: 'Chronická bolest zad' },
                          { id: 'artroza', label: 'Artróza' },
                          { id: 'tendinopatie', label: 'Tendinopatie' },
                          { id: 'plantarni_fasciitida', label: 'Plantární fasciitida' }
                        ],
                        injury_postop: [
                          { id: 'ankle_sprain', label: 'Podvrtnutí kotníku' },
                          { id: 'knee_injury_acl_mcl', label: 'Poranění kolene (ACL/MCL)' },
                          { id: 'post_fracture_rehab', label: 'Po zlomenině (rehabilitace)' },
                          { id: 'post_spine_surgery', label: 'Po operaci páteře' },
                          { id: 'post_meniscus_surgery', label: 'Po operaci menisku' },
                          { id: 'post_hip_arthroplasty', label: 'Po endoprotéze kyčle' }
                        ],
                        neuro: [
                          { id: 'rs', label: 'Roztroušená skleróza' },
                          { id: 'parkinson', label: 'Parkinsonova choroba' },
                          { id: 'post_stroke', label: 'Po CMP (mrtvice)' },
                          { id: 'polyneuropatie', label: 'Polyneuropatie' },
                          { id: 'radikulopatie', label: 'Radikulopatie (výhřez)' },
                          { id: 'dmo', label: 'Dětská mozková obrna' }
                        ],
                        onco_rare: [
                          { id: 'lymfedem', label: 'Lymfedém' },
                          { id: 'onko_rehab', label: 'Onkologická rehabilitace' },
                          { id: 'scar_management_onco', label: 'Jizvy po ozařování/operaci' },
                          { id: 'cipn', label: 'Chemoterapií indukovaná neuropatie' },
                          { id: 'cancer_related_fatigue', label: 'Únava související s onemocněním' },
                          { id: 'rare_diagnosis_consult', label: 'Vzácná diagnóza (konzultace)' }
                        ]
                      }
                      const items = allByCat[dxModalCategory] || []
                      return (
                        <div className="max-h-80 overflow-y-auto pr-1">
                          {items.map(item => {
                            const checked = dxModalTemp.has(item.id)
                            return (
                              <label key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-800">{item.label}</span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setDxModalTemp(prev => {
                                      const next = new Set(prev)
                                      if (e.target.checked) next.add(item.id)
                                      else next.delete(item.id)
                                      return next
                                    })
                                  }}
                                />
                              </label>
                            )
                          })}
                        </div>
                      )
                    })()}
                    <div className="mt-4 flex justify-end gap-2">
                      <button onClick={() => setIsDxModalOpen(false)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">Zrušit</button>
                      <button onClick={() => {
                        const merged = Array.from(new Set([...(answers.diagnosis || []), ...Array.from(dxModalTemp)]))
                        setAnswers(prev => ({ ...prev, diagnosis: merged }))
                        setIsDxModalOpen(false)
                      }} className="px-4 py-2 text-sm rounded-[10px] bg-[#14b8a6] text-white hover:bg-[#0d9488]">Potvrdit</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

            

            {currentStep === STEP_V1.AVAILABILITY && (
              <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">Kdy se ti to hodí?</h1>
            <p className="text-sm text-gray-500 mb-8">Vyber časy a dny, které ti sedí. Můžeš zvolit více možností.</p>
                
                <div className="max-w-4xl mx-auto">
                  {/* Time Slots */}
                  <div className="mb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                      {[
                        { key: 'morning', label: 'Ráno (7–11)', icon: Sunrise },
                        { key: 'late_morning', label: 'Dopoledne (9–13)', icon: Sun },
                        { key: 'afternoon', label: 'Odpoledne (13–17)', icon: Sunset },
                        { key: 'evening', label: 'Večer (17–21)', icon: MoonStar },
                        { key: 'weekend', label: 'Víkend (So–Ne)', icon: CalendarDays },
                        { key: 'asap', label: 'Co nejdřív', icon: Timer }
                      ].map((slot) => {
                        const selected = Array.isArray(answers.step4?.timeOfDay) && answers.step4!.timeOfDay.includes(slot.key)
                        const IconComponent = slot.icon as any
                        return (
                          <button
                            key={slot.key}
                            onClick={() => {
                              setAnswers(prev => {
                                const current = prev.step4?.timeOfDay || []
                                let next: string[]
                                if (slot.key === 'asap') {
                                  next = current.includes('asap') ? [] : ['asap']
                                } else {
                                  const withoutAsap = current.filter(k => k !== 'asap')
                                  next = selected
                                    ? withoutAsap.filter(k => k !== slot.key)
                                    : [...withoutAsap, slot.key]
                                }
                                return { ...prev, step4: { ...(prev.step4 || { timeOfDay: [], weekdays: [] }), timeOfDay: next } }
                              })
                            }}
                            className={`questionnaire-v1-card time-card w-full max-w-[220px] h-32 min-w-0 ${selected ? 'active' : ''}`}
                          >
                            <div className="flex flex-col items-center justify-center text-center h-full gap-1">
                              {IconComponent && <IconComponent className="questionnaire-v1-card-icon mb-0" />}
                              <span className="questionnaire-v1-card-label">{slot.label}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Weekdays (optional) */}
                  <div>
                    <div className="text-sm text-gray-600 mb-5 flex items-center justify-center gap-2 font-semibold text-center"><CalendarDays className="w-4 h-4 text-gray-500" /> Volitelné: dny v týdnu</div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {[
                        { key: 'po', label: 'Po' },
                        { key: 'ut', label: 'Út' },
                        { key: 'st', label: 'St' },
                        { key: 'ct', label: 'Čt' },
                        { key: 'pa', label: 'Pá' },
                        { key: 'so', label: 'So' },
                        { key: 'ne', label: 'Ne' }
                      ].map((day) => {
                        const selected = Array.isArray(answers.step4?.weekdays) && answers.step4!.weekdays.includes(day.key)
                        return (
                          <button
                            key={day.key}
                            onClick={() => {
                              setAnswers(prev => {
                                const current = prev.step4?.weekdays || []
                                const next = selected ? current.filter(d => d !== day.key) : [...current, day.key]
                                return { ...prev, step4: { ...(prev.step4 || { timeOfDay: [], weekdays: [] }), weekdays: next } }
                              })
                            }}
                            className={`questionnaire-v1-pill ${selected ? 'active' : ''}`}
                          >
                            {day.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {errors[STEP_V1.AVAILABILITY] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.AVAILABILITY]}</p>}
              </div>
            )}

            {currentStep === STEP_V1.PREFERENCES && (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-2">Vyber si jazyk a způsob úhrady</h1>
                <p className="text-base text-gray-400 leading-relaxed font-normal mb-8">Vyber jazyky a zvol, zda chceš uplatnit pojišťovnu.</p>
                
                <div className="max-w-4xl mx-auto space-y-10">
                  {/* Languages */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">V jakém jazyce chceš komunikovat?</label>
                    <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Výběr jazyka">
                      {[
                        { key: 'cs', label: 'Čeština', flag: '🇨🇿' },
                        { key: 'en', label: 'Angličtina', flag: '🇬🇧' },
                        { key: 'de', label: 'Němčina', flag: '🇩🇪' },
                        { key: 'ru', label: 'Ruština', flag: '🇷🇺' },
                        { key: 'uk', label: 'Ukrajinština', flag: '🇺🇦' },
                        { key: 'sk', label: 'Slovenština', flag: '🇸🇰' }
                      ].map((lang) => {
                        const selectedLanguage = Array.isArray(answers.languages) ? answers.languages[0] : undefined
                        const isSelected = selectedLanguage === lang.key
                        return (
                          <button
                            type="button"
                            key={lang.key}
                            onClick={() => {
                              const updated = isSelected ? [lang.key] : [lang.key]
                              setAnswers(prev => ({ ...prev, languages: updated }))
                            }}
                            role="radio"
                            aria-checked={isSelected}
                            data-selected={isSelected}
                            data-testid={`language-${lang.key}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                const updated = [lang.key]
                                setAnswers(prev => ({ ...prev, languages: updated }))
                              }
                            }}
                            className={`option-card ${isSelected ? '' : ''}`}
                            
                          >
                            <span className="text-lg leading-none">{lang.flag}</span>
                            <span className="text-sm text-gray-700">{lang.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Insurance */}
                  <div className="mt-10">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pojišťovna (volitelné)</label>
                    <p className="text-sm text-gray-500 mb-4">Chceš uplatnit zdravotní pojišťovnu, nebo budeš platit sám/sama?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto" role="radiogroup" aria-label="Způsob úhrady">
                      {[
                        { key: 'with-insurance', label: 'Chci uplatnit pojišťovnu', testId: 'payment-insurance' },
                        { key: 'self-pay', label: 'Budu platit sám/sama (Self-pay)', testId: 'payment-selfpay' }
                      ].map((option) => {
                        const selectedPayment = Array.isArray(answers.insurance) ? answers.insurance[0] : undefined
                        const isSelected = selectedPayment === option.key
                        return (
                          <button
                            type="button"
                            key={option.key}
                            onClick={() => {
                              // Pokud klikne na již vybranou možnost, odznačí ji
                              const updated = isSelected ? [] : [option.key]
                              setAnswers(prev => ({ ...prev, insurance: updated }))
                            }}
                            role="radio"
                            aria-checked={isSelected}
                            data-selected={isSelected}
                            data-testid={option.testId}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                // Pokud klikne na již vybranou možnost, odznačí ji
                                const updated = isSelected ? [] : [option.key]
                                setAnswers(prev => ({ ...prev, insurance: updated }))
                              }
                            }}
                            className={`option-card ${isSelected ? '' : ''}`}
                            
                          >
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {errors[STEP_V1.PREFERENCES] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.PREFERENCES]}</p>}
              </div>
            )}

            {currentStep === STEP_V1.SPECIAL_NEEDS && (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">Další potřeby</h1>
                <p className="text-sm text-gray-500 mb-6">Vyber věkovou skupinu a další preference.</p>
                
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Age Groups (required) */}
                  <div className="mt-10">
                    <div className="flex items-baseline justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">Pro koho hledáš?</label>
                      {errors[STEP_V1.SPECIAL_NEEDS] && (!Array.isArray(answers.ageGroups) || answers.ageGroups.length === 0) && (
                        <span className="text-xs text-red-500">Vyber pro koho hledáš.</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto" role="radiogroup" aria-label="Pro koho hledáš?">
                      {[
                        { key: 'child', label: 'Dítě', icon: Baby, description: 'Do 18 let' },
                        { key: 'adult', label: 'Dospělý/á', icon: User, description: '18–65 let' },
                        { key: 'senior', label: 'Senior/ka', icon: UserCircle, description: 'Nad 65 let' }
                      ].map((age) => {
                        const selectedKey = Array.isArray(answers.ageGroups) && answers.ageGroups.length > 0 ? answers.ageGroups[0] : undefined
                        const isSelected = selectedKey === age.key
                        return (
                          <button
                            key={age.key}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            data-testid={`age-${age.key === 'child' ? 'child' : age.key === 'adult' ? 'adult' : 'senior'}`}
                            onClick={() => {
                              setAnswers(prev => ({ ...prev, ageGroups: [age.key] }))
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setAnswers(prev => ({ ...prev, ageGroups: [age.key] }))
                              }
                            }}
                            className={`option-card ${
                              isSelected
                                ? ''
                                : ''
                            }`}
                            data-selected={isSelected}
                          >
                            <div className="text-center">
                              <div className="mb-2 flex items-center justify-center">{(() => { const Icon = age.icon; return <Icon className="w-5 h-5 text-[#0d9488]" /> })()}</div>
                              <h3 className="font-semibold text-gray-900 mb-1">{age.label}</h3>
                              <p className="text-sm text-gray-600">{age.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Therapist Gender (optional, single-select) */}
                  <div className="mt-8">
                    <div className="flex items-baseline justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Pohlaví fyzioterapeuta</label>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto" role="radiogroup" aria-label="Pohlaví fyzioterapeuta">
                      {[
                        { key: 'muz', label: 'Muž', icon: Mars, testId: 'gender-muz' },
                        { key: 'zena', label: 'Žena', icon: Venus, testId: 'gender-zena' },
                        { key: 'nezalezi', label: 'Nezáleží', icon: Handshake, testId: 'gender-nezalezi' }
                      ].map((g) => {
                        const isSelected = answers.therapistGender === (g.key as any)
                        return (
                          <button
                            key={g.key}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            data-testid={g.testId}
                            onClick={() => {
                              console.log('🔍 [GENDER CLICK] Setting therapistGender to:', g.key)
                              setAnswers(prev => {
                                console.log('🔍 [GENDER CLICK] Previous therapistGender:', prev.therapistGender)
                                const newAnswers = { ...prev, therapistGender: g.key as any }
                                console.log('🔍 [GENDER CLICK] New therapistGender:', newAnswers.therapistGender)
                                return newAnswers
                              })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                console.log('🔍 [GENDER KEYDOWN] Setting therapistGender to:', g.key)
                                setAnswers(prev => ({ ...prev, therapistGender: g.key as any }))
                              }
                            }}
                            className={`option-card ${isSelected ? '' : ''}`}
                            data-selected={isSelected}
                          >
                            <div className="text-center">
                              <div className="mb-1 flex items-center justify-center">{(() => { const Icon = g.icon; return <Icon className="w-5 h-5 text-[#0d9488]" /> })()}</div>
                              <span className="font-semibold text-gray-900 text-sm">{g.label}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Potřebuješ bezbariérový přístup?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto" role="radiogroup" aria-label="Potřebuješ bezbariérový přístup?">
                      {[
                        { key: 'yes', label: 'Ano', icon: Accessibility, testId: 'access-ano' },
                        { key: 'no', label: 'Ne', icon: Footprints, testId: 'access-ne' }
                      ].map((access) => {
                        const selectedAccess = Array.isArray(answers.workplaceAccessibility) && answers.workplaceAccessibility.length > 0 ? answers.workplaceAccessibility[0] : undefined
                        const isSelected = selectedAccess === access.key
                        return (
                          <button
                            key={access.key}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            data-testid={access.testId}
                            onClick={() => setAnswers(prev => ({ ...prev, workplaceAccessibility: [access.key] }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setAnswers(prev => ({ ...prev, workplaceAccessibility: [access.key] }))
                              }
                            }}
                            className={`option-card ${isSelected ? '' : ''}`}
                            data-selected={isSelected}
                          >
                            <div className="text-center">
                              <div className="mb-1 flex items-center justify-center">{(() => { const Icon = access.icon; return <Icon className="w-5 h-5 text-[#0d9488]" /> })()}</div>
                              <span className="font-medium text-sm text-gray-900">{access.label}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="max-w-md mx-auto">
                    <label className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={answers.consentGiven}
                        onChange={(e) => setAnswers(prev => ({ ...prev, consentGiven: e.target.checked }))}
                        className="w-5 h-5 text-[#1A8E76] border-gray-300 rounded focus:ring-[#1A8E76]"
                        data-testid="consent-checkbox"
                      />
                      <span className="text-sm text-gray-700">
                        Souhlasím se zpracováním odpovědí pro vyhledání vhodného fyzioterapeuta
                      </span>
                    </label>
                  </div>
                </div>

                {errors[STEP_V1.SPECIAL_NEEDS] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.SPECIAL_NEEDS]}</p>}
              </div>
            )}

            </div>
          </div>
          
          {/* CTA Row - Fixed at bottom */}
          <div className="border-t border-gray-200 bg-white px-6 py-4 sticky bottom-0 z-20">
            <div className="max-w-[920px] mx-auto">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleBack}
                  disabled={currentStep <= 0}
                  className="px-4 py-3 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zpět
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={!isStepValid() || isSubmitting}
                  className="h-12 px-8 rounded-[14px] bg-[#14b8a6] text-white font-semibold hover:bg-[#0d9488] hover:shadow-[0_4px_12px_rgba(20,184,166,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  data-testid={currentStep === STEPS_V1.length - 1 ? 'cta-find-therapists' : undefined}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" aria-hidden />
                  )}
                  <span className="text-lg">
                    {isSubmitting ? 'Načítání...' : 
                     currentStep === STEPS_V1.length - 1 ? 'Najít terapeuty' : 'Pokračovat'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Mobile Layout */}
          <div className="lg:hidden w-full">
            {/* Mobile Progress Bar */}
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#0d9488"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40 * (progress / 100)}, ${2 * Math.PI * 40}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-900">{Math.round(progress)}%</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600">Krok {currentStep + 1} z {STEPS_V1.length}</span>
              </div>
            </div>

            {/* Mobile Content */}
            <div className="w-full flex flex-col items-center justify-center">

        {/* Mobile Step Content - Same as desktop but with mobile-specific styling */}
        {currentStep === STEP_V1.LOCATION && (
          <div className="text-center">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-xl font-bold text-gray-800 mb-2 leading-tight">Jaké setkání ti vyhovuje?</h1>
              <p className="text-base text-gray-400 leading-relaxed font-normal">Vyber město a formu péče, která ti sedí nejvíc.</p>
            </div>
            
            {/* Mobile City Selection - Stacked */}
            <div className="mb-10">
              <CityInput
                value={answers.city || ''}
                onChange={handleCityChange}
                onCityResolved={handleCityResolved}
                placeholder="Začni psát město…"
                featureFlags={{
                  citiesAutocomplete: featureFlags.citiesAutocomplete,
                  useGeolocation: featureFlags.useGeolocation
                }}
                showHelperText={true}
              />
            </div>
            {fieldErrors.city && (
              <p className="text-red-500 text-sm mt-2">
                {fieldErrors.city}
              </p>
            )}

            {/* Mobile Visit Mode Selection - Responsive Grid */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
              role="radiogroup"
              aria-label="Vyber formu péče"
            >
              {[
                { 
                  key: 'clinic', 
                  label: 'Ordinace', 
                  subtitle: 'Osobní návštěva',
                  icon: () => (
                    <Building2 className="w-6 h-6" />
                  )
                },
                { 
                  key: 'home_visit', 
                  label: 'Návštěva doma', 
                  subtitle: 'U tebe doma',
                  icon: () => (
                    <Home className="w-6 h-6" />
                  )
                },
                { 
                  key: 'online', 
                  label: 'Online konzultace', 
                  subtitle: 'Videohovor',
                  icon: () => (
                    <Laptop className="w-6 h-6" />
                  )
                },
                { 
                  key: 'any', 
                  label: 'Nezáleží mi na tom', 
                  subtitle: 'Jakákoli forma',
                  icon: () => (
                    <Globe className="w-6 h-6" />
                  )
                }
              ].map((option, index) => {
                const IconComponent = option.icon
                const isSelected = answers.visitMode === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      handleVisitModeSelect(option.key as "clinic" | "home_visit" | "online" | "any")
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleVisitModeSelect(option.key as "clinic" | "home_visit" | "online" | "any")
                      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        const nextIndex = (index + 1) % 4
                        const nextOption = [
                          { key: 'clinic' }, { key: 'home_visit' }, { key: 'online' }, { key: 'any' }
                        ][nextIndex]
                        handleVisitModeSelect(nextOption.key as "clinic" | "home_visit" | "online" | "any")
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault()
                        const prevIndex = index === 0 ? 3 : index - 1
                        const prevOption = [
                          { key: 'clinic' }, { key: 'home_visit' }, { key: 'online' }, { key: 'any' }
                        ][prevIndex]
                        handleVisitModeSelect(prevOption.key as "clinic" | "home_visit" | "online" | "any")
                      }
                    }}
                    className={`w-full h-36 p-6 rounded-[18px] border transition-all duration-300 flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2 ${
                      isSelected 
                        ? 'border border-[#14b8a6] bg-gradient-to-br from-[#f0fdfa] to-[#ecfdf5] shadow-[0_4px_16px_rgba(20,184,166,0.12)] scale-[1.01]' 
                        : 'border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#0d9488]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:scale-[1.01]'
                    }`}
                    aria-label={`${option.label} - ${option.subtitle}`}
                    aria-checked={isSelected}
                    role="radio"
                    tabIndex={isSelected ? 0 : -1}
                  >
                    <div className={`mb-3 ${isSelected ? 'text-[#14b8a6]' : 'text-[#0d9488]'}`}>
                      <IconComponent />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-1">{option.label}</h3>
                    <p className="text-sm text-gray-500">{option.subtitle}</p>
                  </button>
                )
              })}
            </div>
            {fieldErrors.visitMode && (
              <p className="text-red-500 text-sm mt-3 text-center">
                {fieldErrors.visitMode}
              </p>
            )}

            {errors[STEP_V1.LOCATION] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.LOCATION]}</p>}
          </div>
        )}

        {/* Mobile versions of other steps - simplified for mobile */}
        {currentStep === STEP_V1.CONDITIONS && (
            <div className="text-center flex flex-col items-center justify-center min-h-screen pb-24 translate-y-4 md:translate-y-6">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-800 mb-2 leading-tight">S čím ti můžeme pomoct?</h1>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">Můžeš vybrat i více možností.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { key: 'back-pain', label: 'Bolesti zad', icon: Activity },
                { key: 'neck-pain', label: 'Krční páteř', icon: Headphones },
                { key: 'shoulder-upper-limb', label: 'Rameno / horní končetiny', icon: Bone },
                { key: 'knee-lower-limb', label: 'Koleno / dolní končetiny', icon: Bone },
                { key: 'post-injury', label: 'Po úrazu', icon: Bandage },
                { key: 'post-surgery', label: 'Po operaci', icon: Hospital },
                { key: 'sports-overuse', label: 'Sportovní přetížení', icon: Zap },
                { key: 'children-issues', label: 'Dětské obtíže', icon: Baby },
                { key: 'pregnancy-postpartum', label: 'Těhotenství / po porodu', icon: HeartPulse },
                { key: 'other-unsure', label: 'Jiná / nejsem si jistý', icon: HelpCircle }
              ].map((condition) => {
                const IconComponent = condition.icon
                const conditionsMain = answers.conditionsMain || []
                const isSelected = conditionsMain.includes(condition.key)
                return (
                  <button
                    key={condition.key}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? conditionsMain.filter((c: string) => c !== condition.key)
                        : [...conditionsMain, condition.key]
                      setAnswers(prev => ({ ...prev, conditionsMain: updated }))
                    }}
                    className={`w-full h-36 p-6 rounded-[18px] border transition-all duration-300 flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2 ${
                      isSelected 
                        ? 'border border-[#14b8a6] bg-gradient-to-br from-[#f0fdfa] to-[#ecfdf5] shadow-[0_4px_16px_rgba(20,184,166,0.12)] scale-[1.01]' 
                        : 'border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#0d9488]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:scale-[1.01]'
                    }`}
                    aria-label={`Vybrat ${condition.label}`}
                    aria-checked={isSelected}
                    role="checkbox"
                  >
                    <div className={`mb-3 ${isSelected ? 'text-[#14b8a6]' : 'text-[#0d9488]'}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-1">{condition.label}</h3>
                  </button>
                )
              })}
            </div>
            {errors[STEP_V1.CONDITIONS] && (
              <p className="text-red-500 text-sm mt-4">
                {errors[STEP_V1.CONDITIONS]}
              </p>
            )}
          </div>
        )}

        {/* Add other mobile steps here - simplified versions */}
        {currentStep === STEP_V1.DIAGNOSIS && (
            <div className="text-center flex flex-col items-center justify-center min-h-screen pb-24">
            <div className="mt-[48px] mb-4">
              <h1 className="text-xl font-bold text-gray-800 mb-2 leading-tight">Stanovil ti lékař konkrétní diagnózu?</h1>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">Pomůžeš nám, když vybereš tu, která ti sedí nejvíc.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto mb-5 mt-1">
              {[{ key: 'has', label: 'Ano, mám diagnózu' }, { key: 'unsure', label: 'Ne / nejsem si jistý/á' }].map(opt => {
                const active = (answers.hasDiagnosis === true && opt.key === 'has') || (answers.hasDiagnosis === false && opt.key === 'unsure')
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      const isHas = opt.key === 'has'
                      setDiagMode(isHas ? 'has' : 'unsure')
                      setAnswers(prev => ({
                        ...prev,
                        hasDiagnosis: isHas,
                        diagnosis: isHas ? (prev.diagnosis || []) : [],
                        customDiagnosis: isHas ? (prev.customDiagnosis || '') : '',
                        priority: isHas ? 'diagnosis' : 'none'
                      }))
                    }}
                    className={`min-h-[64px] px-7 rounded-[16px] border transition-all flex items-center justify-center ${active ? 'border-[#14b8a6] bg-gradient-to-br from-[#f0fdfa] to-[#ecfdf5] shadow-[0_6px_18px_rgba(20,184,166,0.14)]' : 'border-gray-200 bg-white hover:border-[#0d9488]/30 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]'}`}
                  >
                    <div className={`${active ? 'text-[#0d9488] font-semibold' : 'text-gray-700'} text-[16px]`}>{opt.label}</div>
                  </button>
                )
              })}
            </div>

            {/* Expanded area with reserved space */}
            <div className="border-t border-gray-200 mt-4 pt-5">
              <div className="min-h-[420px] transition-opacity duration-200" aria-live="polite">
                {answers.hasDiagnosis === true && (
                  <div>
                    <div className="text-center mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">Vyber svoji diagnózu nebo ji napiš (volitelné).</h3>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mb-5" role="tablist" aria-label="Kategorie diagnóz">
                      {[
                        { key: 'chronic', label: 'Chronické obtíže' },
                        { key: 'injury_postop', label: 'Úrazy a pooperační stavy' },
                        { key: 'neuro', label: 'Neurologické diagnózy' },
                        { key: 'onco_rare', label: 'Onkologické a vzácné' }
                      ].map(cat => (
                        <button
                          key={cat.key}
                          role="tab"
                          aria-selected={activeDxCategory === cat.key}
                          onClick={() => setActiveDxCategory(cat.key)}
                          className={`px-3 py-1.5 rounded-full border text-sm transition-all ${activeDxCategory === cat.key ? 'border-[#1A8E76] bg-[#E9F7F3] font-medium' : 'border-gray-200 bg-white hover:bg-gray-50'} text-gray-800`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const byCat: Record<string, { id: string; label: string }[]> = {
                        chronic: [
                          { id: 'skolioza', label: 'Skolióza' },
                          { id: 'bechterev', label: 'Bechtěrev' },
                          { id: 'chronic_back_pain', label: 'Chronická bolest zad' },
                          { id: 'artroza', label: 'Artróza' },
                          { id: 'tendinopatie', label: 'Tendinopatie' },
                          { id: 'plantarni_fasciitida', label: 'Plantární fasciitida' }
                        ],
                        injury_postop: [
                          { id: 'ankle_sprain', label: 'Podvrtnutí kotníku' },
                          { id: 'knee_injury_acl_mcl', label: 'Poranění kolene (ACL/MCL)' },
                          { id: 'post_fracture_rehab', label: 'Po zlomenině (rehabilitace)' },
                          { id: 'post_spine_surgery', label: 'Po operaci páteře' },
                          { id: 'post_meniscus_surgery', label: 'Po operaci menisku' },
                          { id: 'post_hip_arthroplasty', label: 'Po endoprotéze kyčle' }
                        ],
                        neuro: [
                          { id: 'rs', label: 'Roztroušená skleróza' },
                          { id: 'parkinson', label: 'Parkinsonova choroba' },
                          { id: 'post_stroke', label: 'Po CMP (mrtvice)' },
                          { id: 'polyneuropatie', label: 'Polyneuropatie' },
                          { id: 'radikulopatie', label: 'Radikulopatie (výhřez)' },
                          { id: 'dmo', label: 'Dětská mozková obrna' }
                        ],
                        onco_rare: [
                          { id: 'lymfedem', label: 'Lymfedém' },
                          { id: 'onko_rehab', label: 'Onkologická rehabilitace' },
                          { id: 'scar_management_onco', label: 'Jizvy po ozařování/operaci' },
                          { id: 'cipn', label: 'Chemoterapií indukovaná neuropatie' },
                          { id: 'cancer_related_fatigue', label: 'Únava související s onemocněním' },
                          { id: 'rare_diagnosis_consult', label: 'Vzácná diagnóza (konzultace)' }
                        ]
                      }
                      const options = byCat[activeDxCategory] || []
                      const topSix = options.slice(0, 6)
                      const display: ({id:string; label:string; fallback?:boolean})[] = [...topSix]
                      if (display.length < 6) {
                        const padCount = 6 - display.length
                        for (let i = 0; i < padCount; i++) display.push({ id: `__more__-${i}`, label: 'Další diagnózy…', fallback: true })
                      }
                      const showMoreLink = options.length > 6
                      const selected = new Set(answers.diagnosis || [])
                      return (
                        <>
                        <div className="grid grid-cols-2 gap-3 mb-2 max-w-2xl mx-auto" role="group" aria-label="Diagnózy">
                          {display.map(item => {
                            const isSelected = !item.fallback && selected.has(item.id)
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (item.fallback) {
                                    setDxModalCategory(activeDxCategory)
                                    setDxModalTemp(new Set(answers.diagnosis || []))
                                    setIsDxModalOpen(true)
                                    return
                                  }
                                  const base = answers.diagnosis || []
                                  const updated = isSelected ? base.filter(d => d !== item.id) : [...base, item.id]
                                  setAnswers(prev => ({ ...prev, diagnosis: updated }))
                                }}
                                className={`h-14 p-3 rounded-[12px] border transition-all text-center focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2 flex items-center justify-center ${item.fallback ? 'border-dashed border-gray-300 bg-white hover:border-[#0d9488]/30' : (isSelected ? 'border-[#1A8E76] bg-[#E9F7F3] font-medium shadow-[0_2px_8px_rgba(20,184,166,0.12)]' : 'border-gray-200 bg-white hover:border-[#0d9488]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]')}`}
                              >
                                <span className={`text-[13px] leading-snug ${item.fallback ? 'text-gray-600' : 'text-gray-800'}`}>{item.label}</span>
                              </button>
                            )
                          })}
                        </div>
                        {showMoreLink && (
                          <button
                            type="button"
                            onClick={() => {
                              setDxModalCategory(activeDxCategory)
                              setDxModalTemp(new Set(answers.diagnosis || []))
                              setIsDxModalOpen(true)
                            }}
                            className="text-xs text-[#0d9488] hover:underline"
                          >
                            Zobrazit vše
                          </button>
                        )}
                        </>
                      )
                    })()}

                    <div className="mt-6">
                      <input
                        type="text"
                        value={answers.customDiagnosis || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, customDiagnosis: e.target.value }))}
                        placeholder="Nenalezl/a jsi? Napiš vlastní diagnózu…"
                        className="w-full h-10 px-3 rounded-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488] text-sm text-gray-700 placeholder:text-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {errors[STEP_V1.DIAGNOSIS] && (
              <p className="text-red-500 text-sm mt-2">{errors[STEP_V1.DIAGNOSIS]}</p>
            )}
            {/* Modal for full diagnosis list (mobile) */}
            {isDxModalOpen && dxModalCategory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/30" onClick={() => setIsDxModalOpen(false)}></div>
                <div className="relative bg-white rounded-[14px] border border-gray-200 shadow-xl w-full max-w-xl p-4 mx-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Vyber diagnózy</h4>
                  {(() => {
                    const allByCat: Record<string, { id: string; label: string }[]> = {
                      chronic: [
                        { id: 'skolioza', label: 'Skolióza' },
                        { id: 'bechterev', label: 'Bechtěrev' },
                        { id: 'chronic_back_pain', label: 'Chronická bolest zad' },
                        { id: 'artroza', label: 'Artróza' },
                        { id: 'tendinopatie', label: 'Tendinopatie' },
                        { id: 'plantarni_fasciitida', label: 'Plantární fasciitida' }
                      ],
                      injury_postop: [
                        { id: 'ankle_sprain', label: 'Podvrtnutí kotníku' },
                        { id: 'knee_injury_acl_mcl', label: 'Poranění kolene (ACL/MCL)' },
                        { id: 'post_fracture_rehab', label: 'Po zlomenině (rehabilitace)' },
                        { id: 'post_spine_surgery', label: 'Po operaci páteře' },
                        { id: 'post_meniscus_surgery', label: 'Po operaci menisku' },
                        { id: 'post_hip_arthroplasty', label: 'Po endoprotéze kyčle' }
                      ],
                      neuro: [
                        { id: 'rs', label: 'Roztroušená skleróza' },
                        { id: 'parkinson', label: 'Parkinsonova choroba' },
                        { id: 'post_stroke', label: 'Po CMP (mrtvice)' },
                        { id: 'polyneuropatie', label: 'Polyneuropatie' },
                        { id: 'radikulopatie', label: 'Radikulopatie (výhřez)' },
                        { id: 'dmo', label: 'Dětská mozková obrna' }
                      ],
                      onco_rare: [
                        { id: 'lymfedem', label: 'Lymfedém' },
                        { id: 'onko_rehab', label: 'Onkologická rehabilitace' },
                        { id: 'scar_management_onco', label: 'Jizvy po ozařování/operaci' },
                        { id: 'cipn', label: 'Chemoterapií indukovaná neuropatie' },
                        { id: 'cancer_related_fatigue', label: 'Únava související s onemocněním' },
                        { id: 'rare_diagnosis_consult', label: 'Vzácná diagnóza (konzultace)' }
                      ]
                    }
                    const items = allByCat[dxModalCategory] || []
                    return (
                      <div className="max-h-80 overflow-y-auto pr-1">
                        {items.map(item => {
                          const checked = dxModalTemp.has(item.id)
                          return (
                            <label key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-800">{item.label}</span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setDxModalTemp(prev => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.add(item.id)
                                    else next.delete(item.id)
                                    return next
                                  })
                                }}
                              />
                            </label>
                          )
                        })}
                      </div>
                    )
                  })()}
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setIsDxModalOpen(false)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">Zrušit</button>
                    <button onClick={() => {
                      const merged = Array.from(new Set([...(answers.diagnosis || []), ...Array.from(dxModalTemp)]))
                      setAnswers(prev => ({ ...prev, diagnosis: merged }))
                      setIsDxModalOpen(false)
                    }} className="px-4 py-2 text-sm rounded-[10px] bg-[#14b8a6] text-white hover:bg-[#0d9488]">Potvrdit</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODALITIES step removed in canonical v1 */}
        {false && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">Jaké přístupy preferuješ?</h1>
            <p className="text-sm text-gray-600 mb-6">Záleží ti na konkrétní metodě? (volitelné)</p>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'dns', label: 'DNS' },
                { key: 'vojta', label: 'Vojta' },
                { key: 'mckenzie', label: 'McKenzie' },
                { key: 'manual-therapy', label: 'Manuální terapie' },
                { key: 'mobilization', label: 'Mobilizace' },
                { key: 'kinesiotaping', label: 'Kineziotaping' },
                { key: 'breathing-therapy', label: 'Dechová terapie' },
                { key: 'sports-physio', label: 'Sportovní fyzio' },
                { key: 'no-preference', label: 'Žádná preference' }
              ].map((modality) => {
                const isSelected = false
                return (
                  <button
                    key={modality.key}
                    onClick={() => {
                      // modalities step removed in v1
                    }}
                    className={`p-4 rounded-lg border transition-all cursor-pointer text-left hover:shadow-md ${
                      isSelected
                        ? 'border-2 border-[#1A8E76] bg-[#E9F7F3]'
                        : 'border border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <span className="font-medium text-sm text-gray-900">{modality.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {currentStep === STEP_V1.AVAILABILITY && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">Kdy se ti to hodí?</h1>
            <p className="text-sm text-gray-600 mb-6">Vyber časy a dny, které ti sedí.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Kdy můžeš?</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'morning', label: 'Ráno (7–11)' },
                    { key: 'lateMorning', label: 'Dopoledne (9–13)' },
                    { key: 'afternoon', label: 'Odpoledne (13–17)' },
                    { key: 'evening', label: 'Večer (17–21)' },
                    { key: 'weekend', label: 'Víkend (So–Ne)' }
                  ].map((slot) => {
                    const availability = Array.isArray(answers.availability) ? answers.availability : []
                    const isSelected = availability.includes(slot.key)
                    return (
                      <button
                        key={slot.key}
                        onClick={() => {
                          const updated = isSelected
                            ? availability.filter(a => a !== slot.key)
                            : [...availability, slot.key]
                          setAnswers(prev => ({ ...prev, availability: updated }))
                        }}
                        className={`p-4 rounded-lg border transition-all cursor-pointer text-left hover:shadow-md ${
                          isSelected
                            ? 'border-2 border-[#1A8E76] bg-[#E9F7F3]'
                            : 'border border-gray-200 bg-white'
                        }`}
                      >
                        <div className="text-center">
                          <span className="font-medium text-sm text-gray-900">{slot.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Weekdays (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Dny v týdnu (volitelné)</label>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { key: 'Mon', label: 'Po' },
                    { key: 'Tue', label: 'Út' },
                    { key: 'Wed', label: 'St' },
                    { key: 'Thu', label: 'Čt' },
                    { key: 'Fri', label: 'Pá' },
                    { key: 'Sat', label: 'So' },
                    { key: 'Sun', label: 'Ne' }
                  ].map((day) => {
                    const selected = Array.isArray((answers as any).weekdays) && (answers as any).weekdays.includes(day.key)
                    return (
                      <button
                        key={day.key}
                        onClick={() => {
                          const prevDays = ((answers as any).weekdays || []) as string[]
                          const next = selected ? prevDays.filter(d => d !== day.key) : [...prevDays, day.key]
                          setAnswers(prev => ({ ...prev, weekdays: next }))
                        }}
                        className={`px-4 py-2 rounded-full border transition-all ${
                          selected
                            ? 'border-2 border-[#1A8E76] bg-[#1A8E76] text-white font-semibold'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {errors[STEP_V1.AVAILABILITY] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.AVAILABILITY]}</p>}
          </div>
        )}

        {currentStep === STEP_V1.PREFERENCES && (
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800 leading-tight mb-2">Vyber si jazyk a způsob úhrady</h1>
            <p className="text-base text-gray-400 leading-relaxed font-normal mb-8">Vyber jazyky a zvol, zda chceš uplatnit pojišťovnu.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">V jakém jazyce chceš komunikovat?</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'cs', label: 'Čeština', flag: '🇨🇿' },
                    { key: 'en', label: 'Angličtina', flag: '🇬🇧' },
                    { key: 'de', label: 'Němčina', flag: '🇩🇪' },
                    { key: 'ru', label: 'Ruština', flag: '🇷🇺' },
                    { key: 'uk', label: 'Ukrajinština', flag: '🇺🇦' },
                    { key: 'sk', label: 'Slovenština', flag: '🇸🇰' }
                  ].map((lang) => {
                    const isSelected = answers.languages.includes(lang.key)
                    return (
                      <button
                        key={lang.key}
                        onClick={() => {
                          const updated = isSelected
                            ? answers.languages.filter(l => l !== lang.key)
                            : [...answers.languages, lang.key]
                          setAnswers(prev => ({ ...prev, languages: updated }))
                        }}
                        className={`p-3 rounded-2xl border border-gray-300 bg-white text-gray-800 transition-transform transform hover:scale-105 hover:border-[#1A8E76] hover:bg-[#E9F7F3] text-center w-full flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'border-[#1A8E76] bg-[#E9F7F3] shadow-sm'
                            : ''
                        }`}
                      >
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <span className="text-sm text-gray-700">{lang.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Price Range removed */}

              {/* Insurance simplified above */}
            </div>

            {errors[STEP_V1.PREFERENCES] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.PREFERENCES]}</p>}
          </div>
        )}

        {currentStep === STEP_V1.SPECIAL_NEEDS && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">Další potřeby</h1>
            <p className="text-sm text-gray-600 mb-6">Vyber věkovou skupinu a další preference.</p>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Pro koho hledáš?</label>
                  {errors[STEP_V1.SPECIAL_NEEDS] && (!Array.isArray(answers.ageGroups) || answers.ageGroups.length === 0) && (
                    <span className="text-xs text-red-500">Vyber pro koho hledáš.</span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Pro koho hledáš?">
                  {[
                    { key: 'child', label: 'Dítě', icon: Baby, description: 'Do 18 let' },
                    { key: 'adult', label: 'Dospělý/á', icon: User, description: '18–65 let' },
                    { key: 'senior', label: 'Senior/ka', icon: UserCircle, description: 'Nad 65 let' }
                  ].map((age) => {
                    const selectedKey = Array.isArray(answers.ageGroups) && answers.ageGroups.length > 0 ? answers.ageGroups[0] : undefined
                    const isSelected = selectedKey === age.key
                    return (
                      <button
                        key={age.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-testid={`age-${age.key === 'child' ? 'child' : age.key === 'adult' ? 'adult' : 'senior'}`}
                        onClick={() => setAnswers(prev => ({ ...prev, ageGroups: [age.key] }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setAnswers(prev => ({ ...prev, ageGroups: [age.key] }))
                          }
                        }}
                        className={`option-card ${isSelected ? '' : ''}`}
                        data-selected={isSelected}
                      >
                        <div className="text-center">
                          <div className="mb-2 flex items-center justify-center">{(() => { const Icon = age.icon; return <Icon className="w-5 h-5 text-[#0d9488]" /> })()}</div>
                          <h3 className="font-semibold text-gray-900 mb-1">{age.label}</h3>
                          <p className="text-sm text-gray-600">{age.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Therapist Gender (optional) */}
              <div className="mt-8">
                <div className="flex items-baseline justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Pohlaví fyzioterapeuta</label>
                </div>
                
                <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Pohlaví fyzioterapeuta">
                      {[
                        { key: 'muz', label: 'Muž', icon: Mars, testId: 'gender-muz' },
                        { key: 'zena', label: 'Žena', icon: Venus, testId: 'gender-zena' },
                        { key: 'nezalezi', label: 'Nezáleží', icon: Handshake, testId: 'gender-nezalezi' }
                      ].map((g) => {
                    const isSelected = answers.therapistGender === (g.key as any)
                    return (
                      <button
                        key={g.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-testid={g.testId}
                        onClick={() => {
                          console.log('🔍 [GENDER CLICK MOBILE] Setting therapistGender to:', g.key)
                          setAnswers(prev => {
                            console.log('🔍 [GENDER CLICK MOBILE] Previous therapistGender:', prev.therapistGender)
                            const newAnswers = { ...prev, therapistGender: g.key as any }
                            console.log('🔍 [GENDER CLICK MOBILE] New therapistGender:', newAnswers.therapistGender)
                            return newAnswers
                          })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            console.log('🔍 [GENDER KEYDOWN MOBILE] Setting therapistGender to:', g.key)
                            setAnswers(prev => ({ ...prev, therapistGender: g.key as any }))
                          }
                        }}
                            className={`option-card ${isSelected ? '' : ''}`}
                        data-selected={isSelected}
                      >
                            <div className="text-center">
                              <div className="mb-1 flex items-center justify-center">{(() => { const Icon = g.icon; return <Icon className="w-5 h-5 text-[#0d9488]" /> })()}</div>
                              <span className="font-semibold text-gray-900 text-sm">{g.label}</span>
                            </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Potřebuješ bezbariérový přístup?</label>
                <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Potřebuješ bezbariérový přístup?">
                      {[
                        { key: 'yes', label: 'Ano', icon: Accessibility, testId: 'access-ano' },
                        { key: 'no', label: 'Ne', icon: Footprints, testId: 'access-ne' }
                      ].map((access) => {
                    const selectedAccess = Array.isArray(answers.workplaceAccessibility) && answers.workplaceAccessibility.length > 0 ? answers.workplaceAccessibility[0] : undefined
                    const isSelected = selectedAccess === access.key
                    return (
                      <button
                        key={access.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-testid={access.testId}
                        onClick={() => setAnswers(prev => ({ ...prev, workplaceAccessibility: [access.key] }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setAnswers(prev => ({ ...prev, workplaceAccessibility: [access.key] }))
                          }
                        }}
                            className={`option-card ${isSelected ? '' : ''}`}
                        data-selected={isSelected}
                      >
                            <div className="text-center">
                              <div className="mb-1 flex items-center justify-center">{(() => { const Icon = access.icon; return <Icon className="w-5 h-5 text-[#0d9488]" /> })()}</div>
                              <span className="font-medium text-sm text-gray-900">{access.label}</span>
                            </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="max-w-md mx-auto">
                <label className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={answers.consentGiven}
                    onChange={(e) => setAnswers(prev => ({ ...prev, consentGiven: e.target.checked }))}
                    className="w-5 h-5 text-[#1A8E76] border-gray-300 rounded focus:ring-[#1A8E76]"
                  />
                  <span className="text-sm text-gray-700">
                    Souhlasím se zpracováním odpovědí pro vyhledání vhodného fyzioterapeuta
                  </span>
                </label>
              </div>
            </div>

            {errors[STEP_V1.SPECIAL_NEEDS] && <p className="text-red-500 text-sm mt-4">{errors[STEP_V1.SPECIAL_NEEDS]}</p>}
          </div>
        )}

          </div>
        </div>
        
        {/* Mobile CTA Row - Fixed at bottom */}
        <div className="lg:hidden border-t border-gray-200 bg-white p-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep <= 0}
              className="px-4 py-3 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zpět
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className="h-12 px-8 rounded-[14px] bg-[#14b8a6] text-white font-semibold hover:bg-[#0d9488] hover:shadow-[0_4px_12px_rgba(20,184,166,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              data-testid={currentStep === STEPS_V1.length - 1 ? 'cta-find-therapists' : undefined}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" aria-hidden />
              )}
              <span>
                {isSubmitting ? 'Načítání...' : 
                 currentStep === STEPS_V1.length - 1 ? 'Najít terapeuty' : 'Pokračovat ➝'}
              </span>
            </button>
          </div>
        </div>
      </div>
  )
}
