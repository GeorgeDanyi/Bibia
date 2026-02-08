"use client"
// Design tokens for sizing and hierarchy
import { STEP3_TOKENS } from "@/styles/tokens/questionnaire"

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react"
import ReactDOM from 'react-dom'
import axe from '@axe-core/react'
import { useRouter, useSearchParams } from "next/navigation"
import { ROUTES } from '@/src/config/routes'
import { QuestionnaireAnswers } from "@/lib/types/questionnaire"
import { formatNextSlot } from "@/lib/utils/matching"
// Removed unused imports - matching is now server-side only
import { ISSUE_TAGS } from "@/lib/constants/mappings"
import { SPECIALIZATION_LABELS, INSURANCE_LABELS } from "@/lib/data/therapists"
import { loadPlaces, searchPlaces, CzechPlace } from "@/lib/data/cz-places"
import { processQuestionnaire, buildResultsUrl } from "@/lib/utils/query"
import { mapQuestionnaireToCriteria } from "@/src/lib/search/mapQuestionnaireToCriteria"
import { canonicalizeCity } from "@/lib/geo/cityIndex"
import { normalizeCondition, type SimpleQuery } from "@/lib/search/simple"
// Removed loadTherapists import - will use API endpoint instead
// Removed matchTherapists import - matching is now server-side only

// loadTherapistsViaAPI function removed - therapists are now loaded server-side only
// Removed splitResults import - results are now handled server-side only
import { useQuestionnaire } from "./QuestionnaireContext"
import { STEPS, STEP } from "./steps"
import { useCanonicalConditionsNormalized } from "@/lib/hooks/useCanonicalConditionsNormalized"
import { CANONICAL_CONDITIONS } from "@/lib/constants/canonical-taxonomy"
import { 
  trackStep2View, 
  trackMainSelected, 
  trackDetailSelected, 
  trackErrorNoMain, 
  trackNextClicked 
} from "@/lib/analytics/questionnaireAnalytics"
import { QuestionnaireAnalyticsDebug } from "@/components/debug/QuestionnaireAnalyticsDebug"
import { 
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
  Paperclip,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  CalendarDays,
  AlarmClock,
  Building2,
  Home,
  Laptop,
  MapPin,
  Star,
  Globe,
  MoreHorizontal,
  User,
  Users,
  Circle,
  HeartPulse,
  Plus,
  ChevronDown
} from "lucide-react"
import "./questionnaire.css"

export default function QuestionnaireClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, actions } = useQuestionnaire()
  const currentStep = state.step
  const answers = state.answers
  const setCurrentStep = actions.setStep
  const setAnswers = (updater: (prev: any) => any) => actions.setAnswers(updater)
  const { toggleConditionByLabel, isConditionSelected, checkAndLogOverlaps, normalizeConditions, normalizeDetails } = useCanonicalConditionsNormalized()
  // moved to context: currentStep, answers
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [bestMatchesNearby, setBestMatchesNearby] = useState<any[]>([])
  const [closestAlternatives, setClosestAlternatives] = useState<any[]>([])
  const [locationSuggestions, setLocationSuggestions] = useState<CzechPlace[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  const [recommendations, setRecommendations] = useState<{bestNearby: any[], closestAlt: any[]}>({bestNearby: [], closestAlt: []})
  const [scoredResults, setScoredResults] = useState<any[]>([])
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(20)
  const [simpleResults, setSimpleResults] = useState<Array<{ id: string; name: string; city: string; distanceKm: number|null; meeting_modes: string[] }>>([])
  const [simpleTags, setSimpleTags] = useState<string[]>([])
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [czPlaces, setCzPlaces] = useState<CzechPlace[]>([])
  const [showOtherLanguage, setShowOtherLanguage] = useState(false)
  const [otherLanguageLabel, setOtherLanguageLabel] = useState<string>('Jiný jazyk')
  const otherDropdownRef = useRef<HTMLDivElement>(null)
  const otherTriggerRef = useRef<HTMLButtonElement>(null)
  const [otherActiveIdx, setOtherActiveIdx] = useState<number>(0)

  // Lightweight Test Mode toggle via URL param
  const isTestMode = (searchParams?.get('test') === '1')

  // UI helpers for Step 6 approved design
  const SectionCard = ({ id, title, subtitle, children }: { id: string, title: string, subtitle?: string, children: React.ReactNode }) => (
    <section role="group" aria-labelledby={id} className="bg-white border border-[#E6ECE8] rounded-xl p-6 h-full flex flex-col">
      <h3 id={id} className="text-base font-semibold text-[#0E3B2E] mb-4">{title}</h3>
      {subtitle && <p className="text-sm text-[#5B736B] mb-4">{subtitle}</p>}
      <div className="flex-1">
        {children}
      </div>
    </section>
  )

  const OptionButton = ({
    label,
    selected,
    onClick,
    icon,
    dataTestId,
  }: {
    label: string,
    selected: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    dataTestId?: string,
  }) => (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      data-testid={dataTestId}
      data-selected={selected ? 'true' : 'false'}
      className={`w-full h-12 transition-all rounded-full px-4 flex items-center gap-3 border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C7F5C] focus-visible:ring-offset-2 ${selected ? 'bg-[#E9F7F3] border-[#1A8E76] text-[#0E3B2E] font-medium shadow-sm' : 'bg-white border-[#E6ECE8] text-[#0E3B2E]/80 hover:bg-[#F5FBF9] hover:border-[#1A8E76]/50'}`}
    >
      <span aria-hidden className="text-[#0E3B2E] w-5 h-5 flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium leading-tight">{label}</span>
    </button>
  )

  const OptionMultiButton = memo(function OptionMultiButton({
    label,
    selected,
    onClick,
    icon,
    dataTestId,
    variant = 'row',
  }: {
    label: string,
    selected: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    dataTestId?: string,
    variant?: 'row' | 'chip',
  }) {
    return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      data-testid={dataTestId}
      data-selected={selected ? 'true' : 'false'}
      className={
        variant === 'chip'
          ? `transition-all rounded-full w-[140px] h-[64px] flex flex-col items-center justify-center gap-2 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C7F5C] focus-visible:ring-offset-2 ${selected ? 'bg-[#E9F7F3] border-[#1A8E76] text-[#0E3B2E] font-medium shadow-sm' : 'bg-white border-[#E6ECE8] text-[#0E3B2E]/80 hover:bg-[#F5FBF9] hover:border-[#1A8E76]/50'}`
          : `w-full h-12 transition-all rounded-full px-4 flex items-center gap-3 border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C7F5C] focus-visible:ring-offset-2 ${selected ? 'bg-[#E9F7F3] border-[#1A8E76] text-[#0E3B2E] font-medium shadow-sm' : 'bg-white border-[#E6ECE8] text-[#0E3B2E]/80 hover:bg-[#F5FBF9] hover:border-[#1A8E76]/50'}`
      }
    >
      <span aria-hidden className="text-[#0E3B2E] w-5 h-5 flex-shrink-0">{icon}</span>
      {variant === 'chip' ? (
        <span className="text-[12px] font-semibold leading-tight text-center">{label}</span>
      ) : (
        <span className="text-sm font-medium leading-tight">{label}</span>
      )}
    </button>
    )
  })

  // Memoized condition card component for performance
  const ConditionCard = memo(function ConditionCard({ 
    czechLabel, 
    canonicalCode, 
    isSelected, 
    onToggle, 
    IconComponent,
    tabIndex = 0
  }: {
    czechLabel: string,
    canonicalCode: string,
    isSelected: boolean,
    onToggle: () => void,
    IconComponent: React.ComponentType<any>,
    tabIndex?: number
  }) {
    return (
    <button
      key={canonicalCode}
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      onClick={onToggle}
      data-testid={`step2-body-${canonicalCode.toLowerCase()}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`aspect-square p-3 rounded-full border bg-white transition-all cursor-pointer text-left hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C7F5C] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        isSelected
          ? 'border-2 border-[#1A8E76] bg-[#E9F7F3]'
          : 'border border-gray-200 shadow-sm'
      }`}
      aria-labelledby={`condition-${canonicalCode}`}
      tabIndex={tabIndex}
    >
      <div className="flex flex-col items-center justify-center text-center h-full">
        {/* Icon */}
        <div className="mb-2" aria-hidden="true">
          <IconComponent className="w-5 h-5 text-gray-700" />
        </div>
        
        {/* Title */}
        <span id={`condition-${canonicalCode}`} className="font-medium text-[#0C2B27] text-xs leading-tight px-1">{czechLabel}</span>
      </div>
    </button>
    )
  })

  // Close others dropdown on outside click or Esc
  useEffect(() => {
    if (!showOtherLanguage) return
    const onClick = (e: MouseEvent) => {
      if (!otherDropdownRef.current) return
      if (!otherDropdownRef.current.contains(e.target as Node)) {
        setShowOtherLanguage(false)
        otherTriggerRef.current?.focus()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowOtherLanguage(false)
        otherTriggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    // Focus first option when opening
    setTimeout(() => {
      const first = otherDropdownRef.current?.querySelector('button') as HTMLButtonElement | null
      first?.focus()
      setOtherActiveIdx(0)
    }, 0)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showOtherLanguage])
  // Therapists are now loaded server-side only
  const locationInputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const [showResetModal, setShowResetModal] = useState(false)
  const [showResetToast, setShowResetToast] = useState(false)

  const SCHEMA_VERSION = 3

  // Performance monitoring
  const measureInteraction = useCallback((name: string, fn: () => void) => {
    if (typeof window !== 'undefined' && window.performance) {
      const start = performance.now()
      fn()
      const end = performance.now()
      const duration = end - start
      
      if (duration > 16) {
        console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms (target: <16ms)`)
      } else {
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
      }
    } else {
      fn()
    }
  }, [])

  // Mount and hydration check
  useEffect(() => {
    console.log('QuestionnaireClient: Component mounted')
    setMounted(true)
    setIsHydrated(true)
    
    // Initialize axe-core for accessibility testing in development
    if (process.env.NODE_ENV === 'development') {
      axe(React, ReactDOM, 1000)
    }
    
    // Measure initial render performance
    if (typeof window !== 'undefined' && window.performance) {
      const renderStart = performance.now()
      requestAnimationFrame(() => {
        const renderEnd = performance.now()
        const renderDuration = renderEnd - renderStart
        if (renderDuration > 150) {
          console.warn(`Performance warning: Initial render took ${renderDuration.toFixed(2)}ms (target: <150ms)`)
        } else {
          console.log(`Performance: Initial render took ${renderDuration.toFixed(2)}ms`)
        }
      })
    }
  }, [])

  // Load saved progress, hide navbar, and load Czech places
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Check for URL parameters first
    const editStep = searchParams?.get('editStep')
    if (editStep) {
      const stepNumber = parseInt(editStep, 10)
      if (stepNumber >= 0 && stepNumber <= STEP.DONE) {
        setCurrentStep(stepNumber)
      }
    }
    
    const saved = localStorage.getItem('bibiaQuestionnaire')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.schemaVersion === SCHEMA_VERSION) {
          // Normalize loaded data to ensure clean state
          const normalizedAnswers = {
            ...data.answers,
            conditionsMain: normalizeConditions(data.answers?.conditionsMain || []),
            conditionsDetail: normalizeDetails(data.answers?.conditionsDetail || [])
          };
          setAnswers(() => normalizedAnswers)
          // Only set step from localStorage if no editStep URL param
          if (!editStep) {
            setCurrentStep(data.currentStep ?? STEP.CONTACT)
          }
        } else {
          localStorage.removeItem('bibiaQuestionnaire')
        }
      } catch (e) {
        console.error('Failed to load saved progress:', e)
      }
    }
    
    // Load Czech places data
    loadPlaces().then(places => {
      setCzPlaces(places)
    }).catch(error => {
      console.error('Failed to load Czech places:', error)
    })
    
    // Therapist data is now loaded server-side only
    
    // Hide navbar and footer
    document.body.classList.add('questionnaire-page')
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('questionnaire-page')
    }
  }, [searchParams, setCurrentStep, setAnswers])

  // Live matches are now handled server-side only

  // Save progress with normalization
  const saveProgress = useCallback(() => {
    if (isHydrated) {
      // Normalize data before saving to ensure clean storage
      const normalizedAnswers = {
        ...answers,
        conditionsMain: normalizeConditions(answers.conditionsMain || []),
        conditionsDetail: normalizeDetails(answers.conditionsDetail || [])
      };
      
      localStorage.setItem('bibiaQuestionnaire', JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        answers: normalizedAnswers,
        currentStep,
        timestamp: Date.now()
      }))
    }
  }, [isHydrated, answers, currentStep, normalizeConditions, normalizeDetails])

  useEffect(() => {
    saveProgress()
  }, [answers, currentStep, isHydrated, saveProgress])

  // Track step2_view when user views step 2 (conditions selection)
  useEffect(() => {
    if (currentStep === STEP.ISSUES && isHydrated) {
      trackStep2View(currentStep);
    }
  }, [currentStep, isHydrated])

  // Global reset questionnaire (delegated to context)
  const resetQuestionnaire = useCallback(() => {
    setShowResetModal(false)
    actions.reset()
  }, [actions])

  // Local fuzzy filtering for location input
  const handleLocationInputChange = useCallback((value: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (value.trim().length > 1 && czPlaces.length > 0) {
        const results = searchPlaces(value, czPlaces).slice(0, 6)
        setLocationSuggestions(results)
        setShowLocationDropdown(true)
        setSelectedSuggestionIndex(-1)
      } else {
        setLocationSuggestions([])
        setShowLocationDropdown(false)
      }
    }, 150) // Faster response for local filtering
  }, [czPlaces])

  // Handle location suggestion selection
  const selectLocationSuggestion = useCallback((suggestion: CzechPlace) => {
    setAnswers(prev => ({ 
      ...prev, 
      locationCity: suggestion.name,
      location: {
        ...(prev as any).location,
        source: 'manual',
        label: `${suggestion.name} (${suggestion.zip})`,
        coords: { lat: suggestion.lat, lon: suggestion.lon }
      } as any
    }))
    if (isTestMode) {
      console.log('[TestMode:onSelect] step1.city', suggestion.name)
    }
    setShowLocationDropdown(false)
    setLocationSuggestions([])
    setSelectedSuggestionIndex(-1)
  }, [])

  // Handle keyboard navigation for location dropdown
  const handleLocationKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showLocationDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < locationSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && locationSuggestions[selectedSuggestionIndex]) {
          selectLocationSuggestion(locationSuggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setShowLocationDropdown(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }, [showLocationDropdown, locationSuggestions, selectedSuggestionIndex, selectLocationSuggestion])

  // Handle geolocation
  const handleUseMyLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationPermissionDenied(true)
      return
    }

    setIsGettingLocation(true)
    setLocationPermissionDenied(false)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        ;(async () => {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
            const data = await response.json()
            const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.display_name || 'Moje poloha'
        setAnswers(prev => ({
          ...prev,
              locationCity: city,
              location: ({
                ...(prev as any).location,
                coords: { lat: latitude, lon: longitude },
                source: 'geo',
                label: city
              } as any)
            }))
            if (isTestMode) {
              console.log('[TestMode:onSelect] step1.city (geo)', city)
            }
          } catch (e) {
            console.error('Reverse geocoding failed:', e)
            setAnswers(prev => ({
              ...prev,
              location: ({
                ...(prev as any).location,
                coords: { lat: latitude, lon: longitude },
                source: 'geo',
                label: 'Moje poloha'
              } as any)
            }))
          } finally {
        setIsGettingLocation(false)
          }
        })()
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLocationPermissionDenied(true)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [setAnswers])

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const progress = ((currentStep + 1) / 8) * 100

  // Dynamic tips for each step
  const getStepTip = (step: number) => {
    const tips = {
      0: "Tip: Zadej své skutečné jméno a e-mail, pošleme ti potvrzení termínu.",
      1: "Tip: Neboj se vybrat více možností! Čím více informací nám dáš, tím lépe ti dokážeme najít ideálního fyzioterapeuta.",
      2: "Tip: I pár slov o diagnóze nám pomůže najít terapeuta se správnou specializací.",
      3: "Tip: Když vybereš víc možností, najdeme volnější termíny rychleji.",
      4: "Tip: Pokud preferuješ konkrétní místo, uveď to. Jinak ti najdeme nejbližší dostupnou ordinaci.",
      5: "Tip: Tvé preference jsou důležité! Pomůžou nám najít terapeuta, který ti bude vyhovovat.",
      6: "Tip: Zkontroluj si všechny údaje před odesláním. Můžeš se vrátit a něco změnit.",
      7: "Tip: Skvěle! Teď už jen počkej na naše doporučení. Ozveme se ti do 24 hodin."
    }
    return tips[step as keyof typeof tips] || "Tip: Každý krok nás přibližuje k tvému cíli."
  }

  const validateStep = (stepIndex: number, answers: any): string | null => {
    switch (stepIndex) {
      case 0: // Contact
        if (!answers.firstName || answers.firstName.trim().length < 2) return "Zkus krátké křestní jméno bez čísel."
        if (!/^[A-Za-zÀ-ž\s\-]{2,30}$/.test(answers.firstName.trim())) return "Zkus krátké křestní jméno bez čísel."
        if (!answers.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) return "Tohle nevypadá jako e-mail. Zkus třeba jana@example.cz."
        break
      case 1: // General Issues
        if (!answers.conditionsMain || answers.conditionsMain.length === 0) return "Vyber prosím aspoň jednu možnost."
        break
      case 2: // Diagnosis (optional - no validation needed)
        break
      case 3: // Time
        {
          const hasTime = Array.isArray((answers as any).timePreferences) && ((answers as any).timePreferences || []).length > 0
          const hasWeekday = Array.isArray((answers as any).weekdays) && ((answers as any).weekdays || []).length > 0
          if (!hasTime && !hasWeekday) return "Vyber aspoň jednu možnost."
        }
        break
      case 4: // Location
        if (!(answers as any).locationPreference) return "Vyber preferované místo."
        if (['clinic', 'home'].includes((answers as any).locationPreference) && !(answers as any).locationCity) {
          return "Doporučujeme upřesnit lokalitu pro lepší výsledky."
        }
        break
      case 5: // Therapist preferences (optional - no validation needed)
        break
      case 6: // Additional wishes (optional - no validation needed)
        break
      case 7: // Summary (no validation needed)
        break
    }
    return null
  }

  const handleNext = async () => {
    if (isTestMode) {
      console.log('[TestMode:onContinue] step', currentStep, {
        step1: { city: (answers as any).locationCity || (answers as any).location?.label, meetingType: (answers as any).locationPreference },
        step2: { bodyRegion: (answers as any).conditionsMain, subSelection: (answers as any).conditionsDetail },
        step3: { diagnosisMainChoice: (answers as any).hasDiagnosis, diagnosisSubChoice: (answers as any).diagnosis }
      })
    }
    const error = validateStep(currentStep, answers)
    
    if (error) {
      setErrors({ [currentStep]: error })
      
      // Track error_no_main when user tries to proceed without selecting main conditions
      if (currentStep === STEP.ISSUES && error.includes('Vyber prosím aspoň jednu možnost')) {
        trackErrorNoMain(currentStep, error);
      }
      
      return
    }

    setErrors({})
    
    // Track next_clicked with current selections
    trackNextClicked(currentStep, answers.conditionsMain, answers.conditionsDetail);
    
    // On leaving Step 2 (Diagnosis), normalize and tag diagnosis
    if (currentStep === STEP.DIAGNOSIS) {
      const raw = ((answers as any).diagnosis || '').toString()
      const normalized = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
      const tags: string[] = []
      const hay = normalized
      if (hay.includes('bechter')) tags.push('bechterev')
      if (hay.includes('skolio')) tags.push('scoliosis')
      if (hay.includes('vyhrez') || hay.includes('hern') || hay.includes('plotenk')) tags.push('discHerniation')
      if (hay.includes('menisk')) tags.push('meniscusSurgery')
      if (hay.includes('kotnik')) tags.push('ankleInjury')
      if (hay.includes('migren')) tags.push('migraine')
      setAnswers(prev => ({ ...prev, diagnosisText: normalized, diagnosisTags: tags }))
      if (isTestMode) {
        console.log('[TestMode:onSelect] step3.diagnosisText', normalized, 'tags', tags)
      }
    }

    // On leaving Step 3 (Time), persist normalized selections for API/summary
    if (currentStep === STEP.TIME) {
      const timePrefs = Array.from(new Set((((answers as any).timePreferences || []) as string[])))
      const weekdays = Array.from(new Set((((answers as any).weekdays || []) as string[])))
      setAnswers(prev => ({ ...prev, timePrefs, weekdays }))
    }

    // Process recommendations after Step 5 or Step 7
    if (currentStep === STEP.PREFERENCES || currentStep === STEP.SUMMARY) {
      setIsSubmitting(true)
      try {
        // Process questionnaire data
        const query = await processQuestionnaire(answers)
        
        // Therapists are now loaded server-side only - skip client-side matching
        const scored: any[] = []
        setScoredResults(scored)
        
        // Results are now handled server-side only
        setRecommendations({ bestNearby: [], closestAlt: [] })
        
        setIsSubmitting(false)
        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error('Error processing recommendations:', error)
        setIsSubmitting(false)
      }
    } else if (currentStep < STEP.SUMMARY) {
      setCurrentStep(currentStep + 1)
    } else {
      // On final step, navigate to canonical /results with query params
      try {
        console.log("🔍 [QUESTIONNAIRE] handleNext - final step, saving answers...");
        
        // Import utilities for saving answers
        const { setAnswers } = await import('@/lib/utils/answers');
        const { migrateToAnswers } = await import('@/lib/types/answers');
        
        // Migrate old format to new Answers format
        const newFormatAnswers = migrateToAnswers(answers);
        console.log("🔍 [QUESTIONNAIRE] Migrated answers to new format:", newFormatAnswers);
        
        // Save to localStorage using new format
        setAnswers(newFormatAnswers);
        console.log("🔍 [QUESTIONNAIRE] Answers saved to localStorage");
        
        // Also build complete payload for API (backward compatibility)
        const payload = buildQuestionnairePayload(answers)
        
        // Store payload in localStorage for results page to consume (backward compatibility)
        localStorage.setItem('bibiaQuestionnairePayload', JSON.stringify(payload))
        
        const url = `/results`
        console.log("🔍 [QUESTIONNAIRE] Navigating to:", url);
        
        // If user came from results editing, go back to results
        if (searchParams?.get('editStep')) {
          router.back()
        } else {
          router.push(url)
        }
      } catch (error) {
        console.error("🔍 [QUESTIONNAIRE] Error in handleNext final step:", error);
        // Still navigate even if saving fails
        if (searchParams?.get('editStep')) {
          router.back()
        } else {
          router.push(ROUTES.results)
        }
      }
    }
  }

  // Build complete questionnaire payload
  const buildQuestionnairePayload = (answers: any) => {
    // Body region to diagnosis mapping
    const regionToDiagnosis: Record<string, string[]> = {
      "hlava": ["head_pain", "migraine"],
      "krk": ["neck_pain", "cervical_tension"],
      "rameno": ["shoulder_pain"],
      "záda": ["back_pain", "spine_pain"],
      "koleno": ["knee_pain"],
      "kotník": ["ankle_pain"],
      "loket": ["elbow_pain"],
      "zápěstí": ["wrist_pain"],
      "kyčel": ["hip_pain"],
      "noha": ["leg_pain"]
    }
    
    // Extract body regions from Step 2
    const conditionsMain = Array.isArray(answers.conditionsMain) ? answers.conditionsMain : []
    const diagnosisIds = conditionsMain.flatMap((region: string) => regionToDiagnosis[region] || [])
    
    // Normalize gender selection
    const genderMap: Record<string, string> = {
      "ženu": "female",
      "muže": "male", 
      "nezáleží": "any"
    }
    const therapistGender = genderMap[answers.therapistGender] || "any"
    
    // Extract time preferences
    const timePrefs = Array.isArray(answers.timePreferences) ? answers.timePreferences : []
    const urgency = timePrefs.includes('asap') ? 'ASAP' : 'normal'
    const day = timePrefs.includes('weekend') ? 'weekend' : 'weekday'
    const timeSlot = timePrefs.includes('evening') ? 'evening' : 'morning'
    
    return {
      city: answers.locationCity || answers.location?.label || '',
      meetingType: answers.locationPreference === 'office' ? 'clinic' 
        : answers.locationPreference === 'home' ? 'home_visit'
        : answers.locationPreference === 'online' ? 'online'
        : 'clinic',
      conditions: conditionsMain,
      hasDiagnosis: answers.hasDiagnosis,
      time: { urgency, day, timeSlot },
      languages: Array.isArray(answers.languages) ? answers.languages : ['čeština'],
      insurance: answers.wantsInsurance ? ['insurance'] : [],
      ageGroup: answers.ageGroup || 'adult',
      therapistGender,
      diagnosisIds,
      radiusKm: answers.radius || 30
    }
  }

  const isStepValid = () => {
    const error = validateStep(currentStep, answers)
    return !error
  }

  const handleBack = () => {
    if (isTestMode) {
      console.log('[TestMode:onBack] step', currentStep)
    }
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDistanceChange = async (newDistance: number) => {
    setMaxDistanceKm(newDistance)
    // Smoothly refetch simple results when radius changes
    if (currentStep === STEP.SUMMARY) {
      await fetchSimpleResults(newDistance)
    }
  }

  const buildSimpleQuery = (): SimpleQuery | null => {
    const rawCity = (answers as any).locationCity || (answers as any).location?.label || ''
    const can = canonicalizeCity(rawCity)
    if (!can) return null
    const hasDiagnosis = (answers as any).hasDiagnosis === true
    const diagnosisText: string = ((answers as any).diagnosis || '').toString()
    const main = (answers as any).conditionsMain || []
    const detail = (answers as any).conditionsDetail || []
    const subRegion = Array.isArray(detail) && detail.length > 0 ? (detail[0] || '') : ''
    let conditionText = ''
    if (hasDiagnosis) {
      conditionText = diagnosisText && diagnosisText.trim().length > 0
        ? diagnosisText
        : (`${main && main.length ? main[0] : ''} ${subRegion}`.trim())
    } else {
      conditionText = (`${main && main.length ? main[0] : ''} ${subRegion}`.trim()) || 'bolest'
    }
    const g = (answers as any).gender
    const gender = g === 'male' || g === 'female' ? g : 'any'
    return { city: can.city, radiusKm: maxDistanceKm, gender, conditionText }
  }

  const fetchSimpleResults = async (overrideRadius?: number) => {
    const q = buildSimpleQuery()
    if (!q) return
    const radius = typeof overrideRadius === 'number' ? overrideRadius : q.radiusKm
    try {
      const params = new URLSearchParams()
      params.set('city', q.city)
      if (typeof radius === 'number') params.set('radiusKm', String(radius))
      if (q.gender) params.set('gender', q.gender)
      params.set('condition', q.conditionText)
      const res = await fetch(`/api/searchSimple?${params.toString()}`)
      if (!res.ok) throw new Error('Search failed')
      const json = await res.json()
      setSimpleResults(Array.isArray(json) ? json : [])
      const norm = normalizeCondition(q.conditionText)
      setSimpleTags(norm.tags)
    } catch (e) {
      console.error('Simple search failed:', e)
      setSimpleResults([])
      setSimpleTags([])
    }
  }

  const handleTestQuery = async () => {
    setIsSubmitting(true)
    try {
      // Prefill test data
      const testAnswers = {
        ...answers,
        issueTags: ["backNeck"],
        diagnosis: "bechterev",
        locationCoords: { lat: 50.0755, lon: 14.4378 }
      }
      
      // Process test query
      const query = await processQuestionnaire(testAnswers)
      
      // Therapists are now loaded server-side only - skip client-side matching
      const scored: any[] = []
      setScoredResults(scored)
      
      // Results are now handled server-side only
      setRecommendations({ bestNearby: [], closestAlt: [] })
      
      setIsSubmitting(false)
      setCurrentStep(8) // Navigate to recommendations step
    } catch (error) {
      console.error('Error processing test query:', error)
      setIsSubmitting(false)
    }
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    
    try {
      // Save final answers
      if (typeof window !== 'undefined') {
        localStorage.setItem('bibiaQuestionnaire', JSON.stringify({
          answers,
          currentStep: 8, // Results step
          timestamp: Date.now()
        }))
      }
      
      // Redirect to canonical results with params
      try {
        // Use new mapping system
        const criteria = mapQuestionnaireToCriteria(answers)
        const params = new URLSearchParams()
        
        // Serialize: strings and CSV for arrays
        if (criteria.location.cityOrZip) params.set("city", criteria.location.cityOrZip);
        params.set("radiusKm", String(criteria.radiusKm));
        if (criteria.conditions.length) params.set("conditions", criteria.conditions.join(","));
        params.set("availability", criteria.availability);
        params.set("practice", criteria.practice);
        if (criteria.languages.length) params.set("languages", criteria.languages.join(","));
        if (criteria.preferExpert) params.set("preferExpert", "true");
        
        const url = `/results?${params.toString()}`
        router.push(url)
      } catch {
        router.push(ROUTES.results)
      }
    } catch (error) {
      console.error('Submit error:', error)
      setErrors({ submit: 'Něco se pokazilo. Zkus to prosím znovu.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // fetchMatches function removed - therapists are now loaded server-side only

  // Component is now client-side only due to dynamic import with ssr: false
  useEffect(() => {
    console.log('QuestionnaireClient: Component mounted and ready')
    setMounted(true)
    setIsHydrated(true)
  }, [])

  return (
    <div className="min-h-screen bg-white flex">
        {/* Left Sidebar with Stepper - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block w-60 lg:w-64 bg-gray-50 border-r border-gray-200 p-6 sticky top-0 h-screen overflow-y-auto">
          {/* Progress Circle */}
          <div className="mb-6">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="#1A8E76"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress / 100)}`}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500">
              Krok {currentStep + 1} z {STEPS.length}
            </div>
          </div>

          {/* Step List */}
          <div className="space-y-2">
            {STEPS.map((s: { label: string }, idx: number) => ({ id: idx, title: s.label, current: currentStep === idx, completed: currentStep > idx })).map((step: { id: number; title: string; current: boolean; completed: boolean }) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  step.current
                    ? 'bg-[#1A8E76] text-white'
                    : step.completed
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-500 hover:bg-gray-100 opacity-60'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step.current
                    ? 'bg-white text-[#1A8E76]'
                    : step.completed
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.completed ? '✓' : step.id + 1}
                </div>
                <span className={`font-medium text-sm ${step.current ? 'font-semibold' : ''}`}>{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Progress Bar - Visible only on mobile */}
          <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      stroke="#1A8E76"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 35}`}
                      strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress / 100)}`}
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-900">{Math.round(progress)}%</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600">Krok {currentStep + 1} z {STEPS.length}</span>
              </div>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center group"
                aria-label="Zpět na úvodní stránku"
              >
                <Home className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
              </button>
            </div>
          </div>

          {/* Floating Home Button - Desktop only */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="hidden lg:block fixed top-4 right-4 z-50 w-11 h-11 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            aria-label="Zpět na úvodní stránku"
          >
            <Home className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
          </button>

          {/* Main Content */}
          <div className={`flex-1 flex ${currentStep === STEP.DIAGNOSIS ? 'items-start' : 'items-center'} justify-center p-6`}>
            <div className={`max-w-[920px] w-full ${currentStep === STEP.DIAGNOSIS ? 'pt-[72px] md:pt-[96px]' : ''}`}>
              {/* Step Content */}
              {currentStep === 0 && (
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Ahoj, já jsem Bibia.</h1>
                  <p className="text-sm text-gray-500 mb-8">Najdu ti fyzioterapeuta na míru. Stačí pár odpovědí.</p>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jak ti říkají?</label>
                      <input
                        type="text"
                        value={answers.firstName || ''}
                        onChange={(e) => {
                          console.log('Input changed:', e.target.value);
                          setAnswers(prev => ({ ...prev, firstName: e.target.value }));
                        }}
                        placeholder="Tvoje křestní jméno"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        autoComplete="given-name"
                        data-testid="firstName-input"
                      />
                      {errors[0] && <p className="text-red-500 text-sm mt-1">{errors[0]}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail pro potvrzení termínu</label>
                      <input
                        type="email"
                        value={answers.email || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="tvoje@email.cz"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Tvá data jsou v bezpečí — <a href="/privacy" className="text-gray-600 hover:text-gray-800 underline">Zásady soukromí</a>
                      </p>
                  </div>
                  {/* CTA Row for Diagnosis step */}
                  <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      data-testid="back-button"
                      className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 order-2 sm:order-1"
                    >
                      Zpět
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        data-testid="next-button"
                        className="h-12 px-6 bg-[#1A8E76] text-white rounded-[10px] text-sm font-medium hover:bg-[#157866] focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Další &gt;
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {currentStep === STEP.LOCATION && (
                <div className="w-full">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Kde a jak se chceš setkat?</h1>
                    <p className="text-sm text-gray-600">Stačí zvolit město a formu péče.</p>
                  </div>

                  {/* City Input Group - Primary Focal Element */}
                  <div className="flex justify-center mb-9">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md sm:max-w-none">
                      <div className="relative w-full sm:w-96">
                        <input
                          ref={locationInputRef}
                          type="text"
                          value={(answers as any).locationCity || ''}
                          data-testid="step1-city-input"
                          onChange={(e) => {
                            const value = e.target.value
                            setAnswers(prev => ({ 
                              ...prev, 
                              locationCity: value,
                              location: (value.trim() 
                                ? { ...(prev as any).location, source: 'manual', coords: null, label: value }
                                : { coords: null, source: null, label: '' }) as any
                            }))
                            handleLocationInputChange(value)
                            if (isTestMode) {
                              console.log('[TestMode:onSelect] step1.city', value)
                            }
                          }}
                          onKeyDown={handleLocationKeyDown}
                          onFocus={() => {
                            if (locationSuggestions.length > 0) {
                              setShowLocationDropdown(true)
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowLocationDropdown(false), 200)
                          }}
                          placeholder="Začni psát město…"
                          className="w-full h-12 px-4 border border-gray-300 rounded-[10px] focus:ring-2 focus:ring-[#1A8E76] focus:border-transparent text-gray-900 placeholder-gray-500"
                        />
                        
                        {/* Location suggestions dropdown */}
                        {showLocationDropdown && locationSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {locationSuggestions.map((suggestion, index) => (
                              <button
                                key={`${suggestion.lat}-${suggestion.lon}`}
                                type="button"
                                onClick={() => selectLocationSuggestion(suggestion)}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                                  index === selectedSuggestionIndex ? 'bg-gray-50' : ''
                                }`}
                              >
                                <div className="font-medium text-gray-900">{suggestion.name}</div>
                                <div className="text-sm text-gray-500">PSČ: {suggestion.zip}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                        <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={isGettingLocation}
                        className="w-full sm:w-auto h-12 px-4 border border-gray-300 rounded-[10px] text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGettingLocation ? (
                          <>
                            <svg className="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Získávám...
                          </>
                        ) : (
                          'Použít moji polohu'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Care Type Cards - Secondary Elements */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-12">
                    {[
                      { 
                        key: 'clinic', 
                        label: 'Osobně', 
                        subtitle: 'Ordinace / návštěva doma',
                        Icon: Building2 
                      },
                      { 
                        key: 'online', 
                        label: 'Online konzultace', 
                        subtitle: 'Videohovor z pohodlí domova',
                        Icon: Laptop 
                      }
                    ].map((opt) => {
                      const selected = (answers as any).locationPreference === opt.key
                      const IconComp = opt.Icon
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          role="button"
                          onClick={() => {
                            setAnswers(prev => ({ ...prev, locationPreference: opt.key }))
                            if (isTestMode) {
                              console.log('[TestMode:onSelect] step1.meetingType', opt.key)
                            }
                          }}
                          data-testid={`step1-meeting-${opt.key}`}
                          className={`w-full sm:w-80 h-36 p-5 rounded-[14px] border transition-all cursor-pointer text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white ${
                            selected
                              ? 'border-2 border-[#1A8E76] bg-[#E9F7F3] shadow-sm'
                              : 'border border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          aria-pressed={selected}
                          aria-labelledby={`care-card-${opt.key}`}
                        >
                          <div className="h-full w-full flex flex-col items-center justify-center text-center">
                            <IconComp className={`w-6 h-6 mb-3 ${selected ? 'text-[#1A8E76]' : 'text-gray-600'}`} />
                            <div id={`care-card-${opt.key}`} className={`font-semibold text-base mb-1 ${selected ? 'text-[#0E3B2E]' : 'text-gray-900'}`}>
                              {opt.label}
                            </div>
                            <div className={`text-sm ${selected ? 'text-[#0E3B2E]' : 'text-gray-600'}`}>
                              {opt.subtitle}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* CTA Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <button
                      type="button"
                      onClick={handleBack}
                        data-testid="back-button"
                      className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 order-2 sm:order-1"
                    >
                      Zpět
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Opravdu chceš začít znovu?')) {
                            actions.reset()
                          }
                        }}
                        className="h-12 px-6 border border-gray-300 rounded-[10px] text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 transition-colors"
                      >
                        Začít znovu
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        data-testid="next-button"
                        className="h-12 px-6 bg-[#1A8E76] text-white rounded-[10px] text-sm font-medium hover:bg-[#157866] focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Další &gt;
                      </button>
                    </div>
                  </div>

                  {/* Location permission denied notice */}
                  {locationPermissionDenied && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-2 inline-block">
                        Nepodařilo se získat polohu. Můžete zadat město ručně výše.
                      </p>
                    </div>
                  )}
                  
                  {/* Location pill with clear when location present */}
                  {((answers as any).location?.coords || (answers as any).location?.label) && (
                    <div className="mt-4 flex justify-center">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${((answers as any).location?.source) === 'geo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {((answers as any).location?.source) === 'geo' ? 'Poloha:' : 'Místo:'}
                        {((answers as any).location?.coords)
                          ? `${(answers as any).location.coords.lat.toFixed(4)}, ${(answers as any).location.coords.lon.toFixed(4)}`
                          : ((answers as any).location?.label || (answers as any).locationCity)}
                        <button
                          type="button"
                          onClick={() => setAnswers(prev => ({ ...prev, location: { coords: null, source: null, label: '' } as any }))}
                          className="ml-1 w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-gray-200"
                          aria-label="Clear location"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {currentStep === STEP.ISSUES && (
                <div className="text-center">
                  <h1 id="conditions-heading" className="text-2xl font-bold text-gray-900 mb-2" tabIndex={-1}>Řekni nám, co tě nejvíc trápí</h1>
                  <p className="text-sm text-gray-500 mb-4" tabIndex={-1}>Můžeš vybrat i více možností.</p>
                  
                  {/* Options Grid - 2x5 with equal sized cards */}
                  <fieldset className="grid grid-cols-5 gap-4 mb-4 max-w-3xl mx-auto border-0 p-0 m-0" role="group" aria-labelledby="conditions-heading">
                    <legend className="sr-only">Vyberte problémy, které vás trápí</legend>
                    {(() => {
                      const iconMap: Record<string, any> = {
                        'BACK_PAIN': Activity,
                        'NECK': Activity,
                        'SHOULDER_UPPER_LIMB': Bone,
                        'KNEE_LOWER_LIMB': Bone,
                        'POST_INJURY': Bandage,
                        'POST_SURGERY': Hospital,
                        'SPORT_OVERUSE': Zap,
                        'PEDIATRIC': Baby,
                        'PREGNANCY_POSTPARTUM': Baby,
                        'OTHER_UNSURE': HelpCircle
                      };
                      return Object.entries(CANONICAL_CONDITIONS).map(([czechLabel, canonicalCode], index) => {
                        const IconComponent = iconMap[canonicalCode] || HelpCircle;
                        const isSelected = isConditionSelected(answers.conditionsMain || [], czechLabel);
                        const handleToggle = () => {
                          measureInteraction(`Condition toggle: ${czechLabel}`, () => {
                            const updatedConditions = toggleConditionByLabel(
                              answers.conditionsMain || [],
                              czechLabel
                            );
                            setAnswers(prev => ({ ...prev, conditionsMain: updatedConditions }))
                            checkAndLogOverlaps(updatedConditions);
                            trackMainSelected(currentStep, updatedConditions);
                            if (isTestMode) {
                              console.log('[TestMode:onSelect] step2.bodyRegion', updatedConditions)
                            }
                          });
                        };
                        return (
                          <ConditionCard
                            key={canonicalCode}
                            czechLabel={czechLabel}
                            canonicalCode={canonicalCode}
                            isSelected={isSelected}
                            onToggle={handleToggle}
                            IconComponent={IconComponent}
                            tabIndex={index + 1}
                          />
                        );
                      });
                    })()}
                  </fieldset>
                  
                  {/* Selected Counter */}
                  <p className="text-sm text-gray-500 mb-4" aria-live="polite" aria-atomic="true" tabIndex={-1}>
                    Vybráno: <span id="selected-count">{(answers.conditionsMain || []).length}</span>
                  </p>
                  {(() => {
                    const selected = (answers.conditionsMain || []) as Array<{ code?: string } | string>
                    if (!selected || selected.length === 0) return null
                    const entries = Object.entries(CANONICAL_CONDITIONS)
                    const codeToLabel: Record<string,string> = entries.reduce((acc, [label, code]) => { acc[String(code)] = String(label); return acc }, {} as Record<string,string>)
                    const toLabel = (item: any) => {
                      if (typeof item === 'string') return item
                      const code = String(item?.code || '')
                      return codeToLabel[code] || code
                    }
                    return (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {selected.map((s, i) => (
                            <span key={`sel-${i}`} className="px-3 py-1 rounded-lg border text-sm bg-[#E6F4F1] border-[#1A8E76] text-[#1A8E76] font-medium">
                              {toLabel(s)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                  
                  {errors[1] && <p className="text-red-500 text-sm">{errors[1]}</p>}
                </div>
              )}

              {currentStep === STEP.DIAGNOSIS && (
                <div className="text-center mt-[40px] md:mt-[56px]">
                  <div className="h-[48px] md:h-[72px]" aria-hidden="true"></div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Máš od lékaře diagnózu?</h1>
                  <p className="text-sm text-gray-400 mb-8">Pokud ano, uveď ji níže. Pomůže nám vybrat správného specialistu.</p>
                  <div className="max-w-3xl mx-auto space-y-6">
                    {/* Two-option primary decision */}
                    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setAnswers(prev => ({ ...prev, hasDiagnosis: true }))
                          if (isTestMode) {
                            console.log('[TestMode:onSelect] step3.diagnosisMainChoice', true)
                          }
                        }}
                        data-testid="step3-yes"
                        aria-pressed={(answers as any).hasDiagnosis === true}
                        className={`h-16 w-full rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white ${
                          (answers as any).hasDiagnosis
                            ? 'border-[#1A8E76] bg-[#E9F7F3] text-[#0C2B27]'
                            : 'border border-gray-200 bg-white text-gray-700 hover:border-[#1A8E76]/30'
                        }`}
                      >
                        <span className="text-sm font-medium">Ano, mám diagnózu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAnswers(prev => ({ ...prev, hasDiagnosis: false, diagnosis: '' }))
                          if (isTestMode) {
                            console.log('[TestMode:onSelect] step3.diagnosisMainChoice', false)
                          }
                        }}
                        data-testid="step3-no"
                        aria-pressed={(answers as any).hasDiagnosis === false}
                        className={`h-16 w-full rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white ${
                          (answers as any).hasDiagnosis === false
                            ? 'border-[#1A8E76] bg-[#E9F7F3] text-[#0C2B27]'
                            : 'border border-gray-200 bg-white text-gray-700 hover:border-[#1A8E76]/30'
                        }`}
                      >
                        <span className="text-sm font-medium">Ne / nejsem si jistý/á</span>
                      </button>
                    </div>

                    {/* Subtle divider */}
                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Expandable diagnosis area with min-height */}
                    <div className="min-h-[400px]">
                      {(answers as any).hasDiagnosis ? (
                        <div>
                          <label htmlFor="diagnosis-textarea" className="block text-sm font-medium text-gray-700 mb-2">Diagnóza (volitelné)</label>
                          <div className="relative">
                            <textarea
                              rows={4}
                              id="diagnosis-textarea"
                              maxLength={200}
                              value={(answers as any).diagnosis || ''}
                              onChange={(e) => {
                                setAnswers(prev => ({ ...prev, diagnosis: e.target.value }))
                                if (isTestMode) {
                                  console.log('[TestMode:onSelect] step3.diagnosisSubChoice:text', e.target.value)
                                }
                              }}
                              data-testid="step3-diagnosis-text"
                              placeholder="Např. Bechtěrevova choroba, skolióza, po operaci menisku…"
                              className="w-full h-[120px] px-4 py-3 border border-[#D8E7E3] rounded-full focus:ring-2 focus:ring-[#1A8E76]/40 focus:border-transparent"
                            />
                            <div className="absolute bottom-2 right-3 text-xs text-gray-400">{(((answers as any).diagnosis || '').length)} / 200</div>
                          </div>
                          {(((answers as any).diagnosis || '').trim().length === 0) && (
                            <p aria-live="polite" className="mt-2 text-xs text-gray-500">Můžeš napsat i orientační název, pokud si nejsi jistý.</p>
                          )}
                          
                          {/* Category chips row - centered */}
                          <div className="mt-6 mb-4">
                            <div className="text-center">
                              <span className="text-sm text-gray-600">Nebo vyber z častých diagnóz:</span>
                            </div>
                          </div>
                          
                          {/* Diagnosis grid - always 6 tiles in 3×2 layout */}
                          <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                            {(() => {
                              const suggestions = [
                                "Bechtěrevova choroba",
                                "Skolióza", 
                                "Výhřez ploténky",
                                "Migrény",
                                "Po operaci menisku",
                                "Po úrazu kotníku"
                              ]
                              const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
                              const currentRaw = ((answers as any).diagnosis || '') as string
                              const parts = currentRaw.split(',').map(s => s.trim()).filter(Boolean)
                              return suggestions.map((term) => {
                                const isActive = parts.map(normalize).includes(normalize(term))
                                return (
                                  <button
                                    key={term}
                                    type="button"
                                    role="button"
                                    onClick={() => {
                                      const normalizedParts = parts.map(normalize)
                                      const idx = normalizedParts.indexOf(normalize(term))
                                      let nextParts = [...parts]
                                      if (idx >= 0) {
                                        nextParts.splice(idx, 1)
                                      } else {
                                        nextParts.push(term)
                                      }
                                      const nextValue = nextParts.join(', ')
                                      setAnswers(prev => ({ ...prev, diagnosis: nextValue }))
                                      if (isTestMode) {
                                        console.log('[TestMode:onSelect] step3.diagnosisSubChoice:chips', nextValue)
                                      }
                                    }}
                                    data-testid={`step3-dx-chip-${normalize(term).replace(/\s+/g,'-')}`}
                                    className={`h-16 w-full rounded-full border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white flex items-center justify-center ${
                                      isActive
                                        ? 'bg-[#1A8E76] text-white border-[#1A8E76]'
                                        : 'border-[#D8E7E3] bg-white text-gray-700 hover:bg-[#E9F7F3]'
                                    }`}
                                    aria-pressed={isActive}
                                    aria-labelledby={`diag-chip-${normalize(term).replace(/\s+/g,'-')}`}
                                  >
                                    <span id={`diag-chip-${normalize(term).replace(/\s+/g,'-')}`} className="text-xs text-center px-2">{term}</span>
                                  </button>
                                )
                              })
                            })()}
                          </div>
                          
                          {/* Input below grid with clear top margin */}
                          <div className="mt-8">
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('Upload placeholder clicked')
                                  alert('Nahrání lékařské zprávy zatím není dostupné.')
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#1A8E76] hover:bg-[#E9F7F3] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white"
                              >
                                <Paperclip className="w-4 h-4" />
                                Připojit lékařskou zprávu (PDF/JPG) — volitelné
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-400">
                            <p className="text-sm">Diagnóza není vyžadována</p>
                            <p className="text-xs mt-1">Pokračujte k dalšímu kroku</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === STEP.TIME && (
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Jaký čas ti vyhovuje?</h1>
                  <p className="text-sm text-gray-500 mb-2">Vyber časy, které ti sedí. Můžeš zvolit i více možností.</p>
                  <div className="mx-auto max-w-4xl">
                    <div className="overflow-y-auto max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-240px)] pr-1 pt-1 pb-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 justify-items-center">
                    {[
                      { key: 'morning', label: 'Ráno (7–11)', Icon: Sunrise },
                      { key: 'lateMorning', label: 'Dopoledne (9–13)', Icon: Sun },
                      { key: 'afternoon', label: 'Odpoledne (13–17)', Icon: Sunset },
                      { key: 'evening', label: 'Večer (17–21)', Icon: Moon },
                      { key: 'weekend', label: 'Víkend (So–Ne)', Icon: CalendarDays },
                      { key: 'asap', label: 'Co nejdřív', Icon: AlarmClock },
                    ].map((slot) => {
                      const selected = ((answers as any).timePreferences || []).includes(slot.key)
                      const IconComp = slot.Icon
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          role="button"
                          onClick={() => {
                            const current = ((answers as any).timePreferences || []) as string[]
                            const next = selected
                              ? current.filter((s) => s !== slot.key)
                              : [...current, slot.key]
                            setAnswers((prev) => ({ ...prev, timePreferences: next }))
                          }}
                          className={`w-44 h-24 sm:w-52 sm:h-28 md:w-60 md:h-32 p-3 sm:p-4 rounded-full border transition-all cursor-pointer text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white ${
                            selected
                              ? 'border-2 border-[#1A8E76] bg-[#E9F7F3]'
                              : 'border-[#D8E7E3] bg-white'
                          }`}
                          aria-pressed={selected}
                          aria-labelledby={`time-card-${slot.key}`}
                        >
                          <div className="h-full w-full flex flex-col items-center justify-center text-center">
                            <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 ${selected ? 'text-[#0C2B27]' : 'text-gray-700'}`} />
                            <div id={`time-card-${slot.key}`} className={`font-semibold text-[#0C2B27] text-xs sm:text-sm leading-tight px-1`}>{slot.label}</div>
                          </div>
                        </button>
                      )
                    })}
                      </div>
                      
                      {/* Urgency selection */}
                      <div className="max-w-3xl mx-auto mt-6">
                        <div className="text-sm text-gray-600 mb-3 flex items-center justify-center gap-2 font-semibold text-center">
                          <AlarmClock className="w-4 h-4 text-gray-500" /> Jak urgentně potřebuješ pomoc?
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { key: 'asap', label: 'Co nejdřív', description: 'Do 3 dnů' },
                            { key: 'this-week', label: 'Tento týden', description: 'Do 7 dnů' },
                            { key: 'flexible', label: 'Není to urgentní', description: 'Kdykoli' },
                          ].map((urgency) => {
                            const selected = (answers as any).urgencyPreference === urgency.key
                            return (
                              <button
                                key={urgency.key}
                                type="button"
                                role="button"
                                onClick={() => setAnswers(prev => ({ ...prev, urgencyPreference: urgency.key }))}
                                className={`p-4 rounded-full border transition-all cursor-pointer text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white ${
                                  selected
                                    ? 'border-2 border-[#1A8E76] bg-[#E9F7F3]'
                                    : 'border-[#D8E7E3] bg-white'
                                }`}
                                aria-pressed={selected}
                              >
                                <div className="font-semibold text-[#0C2B27] text-sm">{urgency.label}</div>
                                <div className="text-xs text-gray-600 mt-1">{urgency.description}</div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      
                      {/* Optional weekdays chips */}
                      <div className="max-w-3xl mx-auto mt-5">
                    <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-2 font-semibold text-center"><CalendarDays className="w-4 h-4 text-gray-500" /> Volitelné: dny v týdnu</div>
                    {(() => {
                      const options = [
                        { label: 'Po', code: 'Mon' },
                        { label: 'Út', code: 'Tue' },
                        { label: 'St', code: 'Wed' },
                        { label: 'Čt', code: 'Thu' },
                        { label: 'Pá', code: 'Fri' },
                        { label: 'So', code: 'Sat' },
                        { label: 'Ne', code: 'Sun' },
                      ]
                      const selectedDays = ((answers as any).weekdays || []) as string[]
                      return (
                        <div className="mt-2 md:mt-3 flex flex-wrap justify-center gap-2">
                          {options.map((opt) => {
                            const selected = selectedDays.includes(opt.code)
                            return (
                              <button
                                key={opt.code}
                                type="button"
                                role="button"
                                onClick={() => {
                                  const next = selected
                                    ? selectedDays.filter((c) => c !== opt.code)
                                    : [...selectedDays, opt.code]
                                  setAnswers((prev) => ({ ...prev, weekdays: next }))
                                }}
                                className={`px-4 py-3 rounded-full border text-sm md:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A8E76] focus:ring-offset-2 focus:ring-offset-white ${
                                  selected
                                    ? 'bg-[#1A8E76] text-white border-[#1A8E76]'
                                    : 'bg-white text-gray-800 border-gray-300 hover:border-[#1A8E76] hover:bg-[#E9F7F3]'
                                }`}
                                aria-pressed={selected}
                                aria-labelledby={`weekday-chip-${opt.code}`}
                              >
                                <span id={`weekday-chip-${opt.code}`}>{opt.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })()}
                      </div>
                    </div>
                  </div>
                  {/* Helper text removed as requested */}
                </div>
              )}

              {currentStep === STEP.PREFERENCES && (
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Máš speciální preference?</h1>
                  <p className="text-sm text-gray-500 mb-6">Vyber možnosti, které jsou pro tebe důležité. Můžeš zvolit více odpovědí.</p>

                  <div className="max-w-6xl mx-auto text-left grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    {/* Section: Gender - single choice */}
                    <SectionCard 
                      id="sec-gender" 
                      title="Pohlaví fyzioterapeuta"
                    >
                      <div className="flex flex-col gap-2">
                        {[
                          {k:'male',l:'Muž',icon:<span aria-hidden className="block leading-none text-blue-600">♂</span>},
                          {k:'female',l:'Žena',icon:<span aria-hidden className="block leading-none text-pink-600">♀</span>},
                          {k:'any',l:'Nezáleží',icon:<span aria-hidden className="block leading-none text-gray-600">⚥</span>}
                        ].map(opt => (
                          <OptionButton
                            key={opt.k}
                            label={opt.l}
                            selected={(answers as any).gender === opt.k}
                            onClick={() => setAnswers(prev => ({ ...prev, gender: opt.k }))}
                            icon={opt.icon}
                            dataTestId={`pref-gender-${opt.k}`}
                          />
                        ))}
                      </div>
                    </SectionCard>

                    {/* Section: Language - multi choice */}
                    <SectionCard 
                      id="sec-lang" 
                      title="Jazyk"
                    >
                      <div className="flex flex-col gap-2">
                        {[
                          {k:'cs',l:'Čeština',icon:<span aria-hidden className="block leading-none">🇨🇿</span>},
                          {k:'en',l:'Angličtina',icon:<span aria-hidden className="block leading-none">🇬🇧</span>},
                          {k:'de',l:'Němčina',icon:<span aria-hidden className="block leading-none">🇩🇪</span>},
                          {k:'ru',l:'Ruština',icon:<span aria-hidden className="block leading-none">🇷🇺</span>},
                          {k:'uk',l:'Ukrajinština',icon:<span aria-hidden className="block leading-none">🇺🇦</span>},
                          {k:'sk',l:'Slovenština',icon:<span aria-hidden className="block leading-none">🇸🇰</span>},
                        ].map(opt => {
                          const list = ((answers as any).languages || []) as string[]
                          const sel = list.includes(opt.k)
                          return (
                            <OptionMultiButton
                              key={opt.k}
                              label={opt.l}
                              selected={sel}
                              onClick={() => {
                                const next = sel ? list.filter(v => v !== opt.k) : [...list, opt.k]
                                setAnswers(prev => ({ ...prev, languages: next }))
                              }}
                              icon={opt.icon}
                              dataTestId={`pref-lang-${opt.k}`}
                              variant="row"
                            />
                          )
                        })}
                      </div>
                    </SectionCard>

                    {/* Section: Experience - multi choice */}
                    <SectionCard 
                      id="sec-exp" 
                      title="Zkušenosti"
                    >
                      <div className="flex flex-col gap-2">
                        {[
                          {k:'sports',l:'Sportovci',icon:<span aria-hidden className="block leading-none">🏃</span>},
                          {k:'kids',l:'Děti',icon:<span aria-hidden className="block leading-none">👶</span>},
                          {k:'seniors',l:'Senioři',icon:<span aria-hidden className="block leading-none">👴</span>},
                          {k:'pregnancy',l:'Těhotenství a porod',icon:<span aria-hidden className="block leading-none">🤰</span>},
                          {k:'womensHealth',l:'Ženské zdraví',icon:<span aria-hidden className="block leading-none">🩺</span>},
                          {k:'rehabInjury',l:'Rehabilitace po úrazu',icon:<span aria-hidden className="block leading-none">🩹</span>},
                        ].map(opt => {
                          const list = ((answers as any).experiences || []) as string[]
                          const sel = list.includes(opt.k)
                          return (
                            <OptionMultiButton
                              key={opt.k}
                              label={opt.l}
                              selected={sel}
                              onClick={() => {
                                const next = sel ? list.filter(v => v !== opt.k) : [...list, opt.k]
                                setAnswers(prev => ({ ...prev, experiences: next }))
                              }}
                              icon={opt.icon}
                              dataTestId={`pref-exp-${opt.k}`}
                              variant="row"
                            />
                          )
                        })}
                      </div>
                    </SectionCard>
                  </div>
                </div>
              )}

              {currentStep === STEP.PREFERENCES - 1 && null}

              {currentStep === STEP.SUMMARY && (
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Shrnutí odpovědí</h1>
                  <p className="text-sm text-gray-500 mb-6 text-center">Zkontroluj své odpovědi. Můžeš je ještě upravit před odesláním.</p>

                  {/* Boolean + Geo preview */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full border text-sm bg-[#E6F4F1] border-[#1A8E76] text-[#1A8E76] font-medium">{(answers as any).locationCity || (answers as any).location?.label || '—'}</span>
                        <span className="px-3 py-1 rounded-full border text-sm bg-gray-50 border-gray-200 text-gray-700 font-medium">{(answers as any).gender === 'male' ? 'Muž' : (answers as any).gender === 'female' ? 'Žena' : 'Nezáleží'}</span>
                        {simpleTags.map(t => (
                          <span key={t} className="px-3 py-1 rounded-full border text-sm bg-gray-50 border-gray-200 text-gray-700 font-medium">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <label htmlFor="radius" className="text-sm text-gray-700">Radius: {maxDistanceKm} km</label>
                        <input id="radius" type="range" min={5} max={60} step={1} value={maxDistanceKm} onChange={(e) => handleDistanceChange(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="mt-4 bg-white border border-gray-200 rounded-xl">
                      <div className="divide-y">
                        {simpleResults.length === 0 && (
                          <div className="p-4 text-sm text-gray-500">Žádné přesné shody v aktuálním radiusu.</div>
                        )}
                        {simpleResults.map(r => (
                          <div key={r.id} className="p-4 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{r.name}</div>
                              <div className="text-sm text-gray-600">{r.city}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              {typeof r.distanceKm === 'number' && (
                                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{Math.round(r.distanceKm)} km</span>
                              )}
                              <div className="flex gap-1">
                                {r.meeting_modes.slice(0,2).map(m => (
                                  <span key={m} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px]">{m}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const genderMap: Record<string,string> = { male:'Muž', female:'Žena', any:'Nezáleží' }
                    const langMap: Record<string,string> = { cs:'Čeština', en:'Angličtina', de:'Němčina', ru:'Ruština', uk:'Ukrajinština', sk:'Slovenština' }
                    const expMap: Record<string,string> = { sports:'Sportovci', kids:'Děti', seniors:'Senioři', pregnancy:'Těhotenství a porod', womensHealth:'Ženské zdraví', rehabInjury:'Rehabilitace po úrazu' }
                    const issueMap: Record<string,string> = {
                      backNeck:'Bolesti zad / krku',
                      joints:'Bolesti kloubů',
                      musclesTendons:'Bolesti svalů / šlach',
                      headaches:'Bolesti hlavy / migrény',
                      sportsInjury:'Sportovní úraz',
                      postSurgery:'Rehabilitace po operaci',
                      postTrauma:'Rehabilitace po úrazu',
                      pregnancyPostpartum:'Těhotenství a poporodní období',
                      chronicCondition:'Dlouhodobé onemocnění / diagnóza',
                      other:'Jiné potíže'
                    }
                    const timeMap: Record<string,string> = { morning:'Ráno (7–11)', lateMorning:'Dopoledne (9–13)', afternoon:'Odpoledne (13–17)', evening:'Večer (17–21)', weekend:'Víkend (So–Ne)', asap:'Co nejdřív' }
                    const urgencyMap: Record<string,string> = { asap:'Co nejdřív (do 3 dnů)', 'this-week':'Tento týden (do 7 dnů)', flexible:'Není to urgentní' }
                    const locMap: Record<string,string> = { clinic:'U fyzioterapeuta v ordinaci', home:'U mě doma', online:'Online konzultace', any:'Nezáleží mi na tom' }

                    const chips = (arr: string[], map: Record<string,string>) => (arr || []).map(v => map[v] || v).filter(Boolean)

                    // Validation helper function
                    const isValidData = (value: any, type: 'email' | 'name' | 'text'): boolean => {
                      if (!value || value.trim() === '') return false
                      if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                      if (type === 'name') return /^[A-Za-zÀ-ž\s\-]{2,30}$/.test(value.trim())
                      if (type === 'text') return value.trim().length >= 2
                      return true
                    }

                    const cards = [
                      {
                        title: 'Kontakt',
                        step: 0,
                        valueChips: [answers.firstName, answers.email].filter(Boolean) as string[],
                        icon: <User className="w-4 h-4" />,
                        hasInvalidData: !isValidData(answers.firstName, 'name') || !isValidData(answers.email, 'email'),
                        isEmpty: !answers.firstName && !answers.email
                      },
                      {
                        title: 'Problémy',
                        step: 1,
                        valueChips: (answers.conditionsMain || []).map((condition: { code: string }) => condition.code),
                        icon: <Activity className="w-4 h-4" />,
                        hasInvalidData: false,
                        isEmpty: !answers.conditionsMain || answers.conditionsMain.length === 0
                      },
                      {
                        title: 'Diagnóza',
                        step: 2,
                        valueChips: [((answers as any).diagnosis || '')].filter(Boolean) as string[],
                        icon: <ClipboardList className="w-4 h-4" />,
                        hasInvalidData: false,
                        isEmpty: !(answers as any).diagnosis || ((answers as any).diagnosis || '').trim() === ''
                      },
                      {
                        title: 'Čas',
                        step: 3,
                        valueChips: [
                          ...chips(((answers as any).timePreferences || []) as string[], timeMap),
                          ...(((answers as any).urgencyPreference) ? [urgencyMap[(answers as any).urgencyPreference]] : [])
                        ].filter(Boolean),
                        icon: <CalendarDays className="w-4 h-4" />,
                        hasInvalidData: false,
                        isEmpty: !(answers as any).timePreferences || ((answers as any).timePreferences || []).length === 0
                      },
                      {
                        title: 'Místo',
                        step: 4,
                        valueChips: [locMap[(answers as any).locationPreference] || undefined, ((answers as any).locationCity || (answers as any).location?.label)].filter(Boolean) as string[],
                        icon: <MapPin className="w-4 h-4" />,
                        hasInvalidData: false,
                        isEmpty: !(answers as any).locationPreference
                      },
                      {
                        title: 'Preference',
                        step: 6,
                        valueChips: [
                          genderMap[(answers as any).gender || ''] || '',
                          ...chips((((answers as any).languages)||[]) as string[], langMap),
                          ...chips((((answers as any).experiences)||[]) as string[], expMap)
                        ].filter(Boolean) as string[],
                        icon: <Star className="w-4 h-4" />,
                        hasInvalidData: false,
                        isEmpty: !(answers as any).gender && (!(answers as any).languages || ((answers as any).languages || []).length === 0) && (!(answers as any).experiences || ((answers as any).experiences || []).length === 0)
                      }
                    ]

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {cards.map((card, idx) => (
                          <div key={idx} className={`bg-white border rounded-xl p-4 transition-all ${
                            card.hasInvalidData 
                              ? 'border-red-200 bg-red-50' 
                              : 'border-gray-200 hover:border-[#1A8E76]/30'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-[#0C2B27]">
                                <span className={`${card.hasInvalidData ? 'text-red-500' : 'text-gray-600'}`}>
                                  {card.icon}
                                </span>
                                <h3 className="font-semibold">{card.title}</h3>
                                {card.hasInvalidData && (
                                  <span className="text-red-500 text-sm">⚠️</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(card.step)}
                                className="text-sm text-[#1A8E76] hover:text-[#157866] font-medium"
                              >
                                Upravit
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {card.valueChips.length > 0 ? card.valueChips.map((chip: string, i: number) => (
                                <span key={`${idx}-${i}`} className="px-3 py-1 rounded-lg border text-sm bg-[#E6F4F1] border-[#1A8E76] text-[#1A8E76] font-medium">
                                  {chip}
                                </span>
                              )) : (
                                <span className="text-sm text-gray-400">Nevyplněno</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Action Buttons */}
                  <div className="mt-8 max-w-lg mx-auto space-y-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          console.log("🔍 [QUESTIONNAIRE] Final step button clicked, saving answers...");
                          
                          // Import utilities for saving answers
                          const { setAnswers } = await import('@/lib/utils/answers');
                          const { migrateToAnswers } = await import('@/lib/types/answers');
                          
                          // Migrate old format to new Answers format
                          const newFormatAnswers = migrateToAnswers(answers);
                          console.log("🔍 [QUESTIONNAIRE] Migrated answers to new format:", newFormatAnswers);
                          
                          // Save to localStorage using new format
                          setAnswers(newFormatAnswers);
                          console.log("🔍 [QUESTIONNAIRE] Answers saved to localStorage");
                          
                          // Also use new mapping system for URL params (backward compatibility)
                          try {
                            const criteria = mapQuestionnaireToCriteria(answers)
                            const params = new URLSearchParams()
                            
                            // Serialize: strings and CSV for arrays
                            if (criteria.location.cityOrZip) params.set("city", criteria.location.cityOrZip);
                            params.set("radiusKm", String(criteria.radiusKm));
                            if (criteria.conditions.length) params.set("conditions", criteria.conditions.join(","));
                            params.set("availability", criteria.availability);
                            params.set("practice", criteria.practice);
                            if (criteria.languages.length) params.set("languages", criteria.languages.join(","));
                            if (criteria.preferExpert) params.set("preferExpert", "true");
                            
                            const url = `/results?${params.toString()}`
                            console.log("🔍 [QUESTIONNAIRE] Navigating to:", url);
                            router.push(url)
                          } catch (e) {
                            console.error("🔍 [QUESTIONNAIRE] Error building URL params, navigating to /results:", e);
                            router.push(ROUTES.results)
                          }
                        } catch (e) {
                          console.error("🔍 [QUESTIONNAIRE] Error in final step button:", e);
                          // Still navigate even if saving fails
                          router.push(ROUTES.results)
                        }
                      }}
                      className="w-full py-4 rounded-full bg-[#1A8E76] text-white font-semibold hover:bg-[#157866] transition-colors shadow-lg hover:shadow-xl"
                    >
                      Potvrdit a pokračovat
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="w-full py-3 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Zpět k úpravám všech kroků
                    </button>
                  </div>
                </div>
              )}

              {currentStep === STEP.DONE && (
                <div>
                  {/* Completion Card */}
                  <div className="max-w-4xl mx-auto bg-white border border-[#E6ECE8] rounded-2xl p-6 md:p-8 shadow-sm">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">Našli jsme ti nejbližší terapeuty, kteří mohou pomoci</h1>
                      <p className="text-sm text-gray-600">Přesný shodný výsledek jsme nenašli, ale tady jsou vhodné alternativy.</p>
                    </div>

                    {/* Mini Results */}
                    {(() => {
                      const source = recommendations.bestNearby.length > 0 ? recommendations.bestNearby : recommendations.closestAlt
                      const mini = source.slice(0, 3)
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {mini.map((result) => (
                            <div key={result.therapist.id} className="bg-[#FAFEFC] border border-[#E6ECE8] rounded-xl p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-semibold text-gray-900 leading-tight">{result.therapist.name}</div>
                                  <div className="text-xs text-gray-600">{result.therapist.city}</div>
                                </div>
                                {result.distanceKm !== undefined && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-medium rounded-full">
                                    {result.distanceKm.toFixed(0)} km
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1 mb-2">
                                {result.therapist.specializations?.slice(0,1).map((spec: string) => (
                                  <span key={spec} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded-full">
                                    {SPECIALIZATION_LABELS[spec] || spec}
                                  </span>
                                ))}
                              </div>

                              {result.nextAvailability && (
                                <div className="text-xs text-gray-600 mb-3">Dostupnost: {formatNextSlot(result.nextAvailability)}</div>
                              )}

                              <div className="flex gap-2">
                                <button className="flex-1 px-3 py-2 bg-[#1A8E76] text-white text-xs rounded-full hover:bg-[#157866]">Rezervovat</button>
                                <button className="px-3 py-2 border border-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-50">Detail</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}

                    {/* CTAs */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                      <button className="px-6 py-3 bg-[#1A8E76] text-white rounded-full font-semibold hover:bg-[#157866] shadow-lg hover:shadow-xl">Zobrazit více alternativ</button>
                      <button onClick={() => setCurrentStep(STEP.PREFERENCES)} className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Upravit preference</button>
                      <button onClick={() => alert('Kontakt – modal stub')} className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Spojit se s námi</button>
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Lightweight Debug Panel — visible only in Test Mode */}
              {isTestMode && (
                <div className="mt-6">
                  <pre
                    aria-hidden
                    className="text-xs bg-gray-100 text-gray-800 p-3 rounded-md overflow-x-auto"
                    data-testid="debug-panel"
                  >{JSON.stringify({
                    step: currentStep,
                    step1: {
                      city: (answers as any).locationCity || (answers as any).location?.label,
                      meetingType: (answers as any).locationPreference
                    },
                    step2: {
                      bodyRegion: (answers as any).conditionsMain,
                      subSelection: (answers as any).conditionsDetail
                    },
                    step3: {
                      diagnosisMainChoice: (answers as any).hasDiagnosis,
                      diagnosisSubChoice: (answers as any).diagnosis
                    }
                  }, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Opravdu chceš začít znovu?</h3>
                <p className="text-sm text-gray-600 mb-4">Tvé dosavadní odpovědi budou smazány.</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowResetModal(false)}
                  >
                    Ne
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                    onClick={() => { setShowResetModal(false); actions.reset() }}
                  >
                    Ano, resetovat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {showResetToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
                Dotazník byl resetován.
              </div>
            </div>
          )}

        </div>
      </div>
  )
}
