"use client"

import { useCallback, useMemo } from 'react'
import { useSyncExternalStore } from 'react'

export type BibiaState = {
  step1: {
    city?: string
    practiceType?: 'office' | 'home' | 'online' | null
  }
  step2: {
    categories: string[]
    refinements: Record<string, string[]>
  }
  step3: {
    hasDiagnosis: boolean
    diagnosis: string[]
    customDiagnosis?: string
    priority: 'diagnosis' | 'none'
  }
  step4: {
    times: string[]
    weekdays: string[]
  }
  testMode: boolean
}

type BibiaStore = {
  get: () => BibiaState
  set: (updater: (prev: BibiaState) => BibiaState) => void
  subscribe: (listener: () => void) => () => void
}

const STORAGE_KEY = 'bibiaStore'

const isBrowser = (): boolean => typeof window !== 'undefined'

const createInitialState = (): BibiaState => ({
  step1: { city: undefined, practiceType: null },
  step2: { categories: [], refinements: {} },
  step3: { hasDiagnosis: false, diagnosis: [], customDiagnosis: undefined, priority: 'none' },
  step4: { times: [], weekdays: [] },
  testMode: false
})

// Debounce helper (200ms)
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 200) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn(...args)
    }, wait)
  }
}

const listeners = new Set<() => void>()

let state: BibiaState = createInitialState()

// Load from localStorage once on module init (client only)
if (isBrowser()) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Minimal validation/normalization
      state = {
        step1: {
          city: typeof parsed?.step1?.city === 'string' ? parsed.step1.city : undefined,
          practiceType: ['office', 'home', 'online', null].includes(parsed?.step1?.practiceType)
            ? parsed.step1.practiceType
            : null
        },
        step2: {
          categories: Array.isArray(parsed?.step2?.categories) ? parsed.step2.categories : [],
          refinements: typeof parsed?.step2?.refinements === 'object' && parsed.step2.refinements !== null
            ? parsed.step2.refinements
            : {}
        },
        step3: {
          hasDiagnosis: Boolean(parsed?.step3?.hasDiagnosis),
          diagnosis: Array.isArray(parsed?.step3?.diagnosis) ? parsed.step3.diagnosis : [],
          customDiagnosis: typeof parsed?.step3?.customDiagnosis === 'string' && parsed.step3.customDiagnosis.trim() !== ''
            ? parsed.step3.customDiagnosis
            : undefined,
          priority: parsed?.step3?.priority === 'diagnosis' ? 'diagnosis' : 'none'
        },
        step4: {
          times: Array.isArray(parsed?.step4?.times) ? parsed.step4.times : [],
          weekdays: Array.isArray(parsed?.step4?.weekdays) ? parsed.step4.weekdays : []
        },
        testMode: Boolean(parsed?.testMode)
      }
    }
  } catch (error) {
    // If parsing fails, fall back to initial
    state = createInitialState()
  }
}

const persist = debounce((next: BibiaState) => {
  if (!isBrowser()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota errors
  }
}, 200)

const store: BibiaStore = {
  get: () => state,
  set: (updater) => {
    const next = updater(state)
    state = next
    persist(state)
    listeners.forEach(l => l())
  },
  subscribe: (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
}

export const bibiaStore = store

export function useBibiaStore<T>(selector: (s: BibiaState) => T): T {
  const getSnapshot = () => bibiaStore.get()
  const subscribe = useCallback((cb: () => void) => bibiaStore.subscribe(cb), [])
  const getServerSnapshot = () => createInitialState()
  const slice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return useMemo(() => selector(slice), [slice, selector])
}

// Convenience setters
export const setStep1 = (partial: Partial<BibiaState['step1']>) => {
  bibiaStore.set(prev => ({ ...prev, step1: { ...prev.step1, ...partial } }))
}

export const setStep2 = (partial: Partial<BibiaState['step2']>) => {
  bibiaStore.set(prev => ({ ...prev, step2: { ...prev.step2, ...partial } }))
}

export const setStep3 = (partial: Partial<BibiaState['step3']>) => {
  bibiaStore.set(prev => ({ ...prev, step3: { ...prev.step3, ...partial } }))
}

export const setStep4 = (partial: Partial<BibiaState['step4']>) => {
  bibiaStore.set(prev => ({ ...prev, step4: { ...prev.step4, ...partial } }))
}

export const setTestMode = (value: boolean) => {
  bibiaStore.set(prev => ({ ...prev, testMode: Boolean(value) }))
}


