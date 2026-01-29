export function toArray<T>(value: T[] | ReadonlyArray<T> | null | undefined): T[] {
  if (Array.isArray(value)) return value as T[]
  return []
}

export function toObject<T extends object>(value: T | null | undefined): T {
  return (value && typeof value === 'object') ? value : ({} as T)
}

export function safeLogError(context: string, payload?: any, error?: unknown) {
  const err = error instanceof Error ? error : new Error(String(error || 'Unknown error'))
  // Single descriptive line with context and keys
  try {
    // Avoid crashing on circular structures
    const preview = payload && typeof payload === 'object'
      ? Object.keys(payload as Record<string, unknown>).slice(0, 10)
      : undefined
    // eslint-disable-next-line no-console
    console.error(`❌ ${context} — ${err.message}`, preview ? { keys: preview } : undefined)
  } catch {
    // eslint-disable-next-line no-console
    console.error(`❌ ${context} — ${err.message}`)
  }
}


// Normalization helpers used by questionnaire -> search payload

export function normalizeCity(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .toLowerCase()
    .normalize('NFD')
    // remove all diacritic marks
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

export function normalizeGender(value: string | undefined | null): 'female' | 'male' | 'any' {
  const v = (value || '').toString().toLowerCase().trim()
  if (v === 'zena' || v === 'žena' || v === 'female') return 'female'
  if (v === 'muz' || v === 'muž' || v === 'male') return 'male'
  return 'any'
}

/**
 * Normalize therapist gender to strict 'male' | 'female'
 * Handles various input formats: 'M', 'F', 'žena', 'muž', 'Female', 'Male', 'MALE', 'FEMALE', etc.
 * This is used for therapist records (not user preferences).
 * Unrecognized values default to 'female' with a console warning.
 */
export function normalizeTherapistGender(value: string | undefined | null, therapistId?: string): 'male' | 'female' {
  if (!value) {
    if (process.env.NODE_ENV !== 'production' && therapistId) {
      console.warn(`[GENDER_NORMALIZE] Missing gender for therapist ${therapistId}, defaulting to 'female'`)
    }
    return 'female'
  }
  
  const v = String(value).toLowerCase().trim()
  
  // Direct matches - male (handles: male, m, muž, muz, Male, MALE, M, etc.)
  if (v === 'male' || v === 'm' || v === 'muž' || v === 'muz' || v === 'muž' || v === 'muz') return 'male'
  
  // Direct matches - female (handles: female, f, žena, zena, Female, FEMALE, F, etc.)
  if (v === 'female' || v === 'f' || v === 'žena' || v === 'zena') return 'female'
  
  // Unrecognized value - default to 'female' with warning
  if (process.env.NODE_ENV !== 'production' && therapistId) {
    console.warn(`[GENDER_NORMALIZE] Unrecognized gender value "${value}" for therapist ${therapistId}, defaulting to 'female'`)
  }
  return 'female'
}

export function normalizeSlot(value: string | undefined | null): 'morning' | 'late_morning' | 'afternoon' | 'evening' | null {
  const v = (value || '').toString().toLowerCase().trim()
  if (!v) return null
  if (v === 'rano' || v === 'ráno' || v === 'morning') return 'morning'
  if (v === 'dopoledne' || v === 'late_morning' || v === 'late-morning') return 'late_morning'
  if (v === 'odpoledne' || v === 'afternoon') return 'afternoon'
  if (v === 'vecer' || v === 'večer' || v === 'evening') return 'evening'
  return null
}


