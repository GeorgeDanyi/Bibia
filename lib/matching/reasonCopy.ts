/**
 * Czech copy mapper for canonical explainability reason codes.
 *
 * IMPORTANT:
 * - Do NOT introduce new criteria – only explain existing codes.
 * - Do NOT use numbers, procenta ani technické kódy v uživatelském UI.
 */

export type MatchReasonCode =
  | 'MEETING_TYPE_MATCH'
  | 'DISTANCE_CLOSE'
  | 'AGE_GROUP_MATCH'
  | 'BARRIER_FREE_MATCH'
  | 'GENDER_PREFERRED'
  | 'LANGUAGE_MATCH'
  | 'SPECIALTY_MATCH'
  | 'ASAP_AVAILABILITY'
  | 'PROFILE_QUALITY'
  | string

/**
 * Short Czech summary copy for a given reason code.
 * Používá se pro kompaktní řádek na kartě výsledku.
 */
export function mapReasonCodeToSummaryCs(code: MatchReasonCode): string {
  switch (code) {
    case 'DISTANCE_CLOSE':
      return 'Blízko vás – je v rozumné dojezdové vzdálenosti.'
    case 'SPECIALTY_MATCH':
      return 'Zaměřuje se na vaše potíže a podobné diagnózy.'
    case 'MEETING_TYPE_MATCH':
      return 'Nabízí formu setkání, kterou preferujete.'
    case 'LANGUAGE_MATCH':
      return 'Domluvíte se společným jazykem.'
    case 'GENDER_PREFERRED':
      return 'Respektuje vaše přání ohledně pohlaví terapeuta.'
    case 'AGE_GROUP_MATCH':
      return 'Pracuje s vaší věkovou skupinou.'
    case 'BARRIER_FREE_MATCH':
      return 'Nabízí bezbariérový přístup, pokud ho potřebujete.'
    case 'ASAP_AVAILABILITY':
      return 'Má volné termíny v období, které vám vyhovuje.'
    case 'PROFILE_QUALITY':
      return 'Má pečlivě vyplněný profil s užitečnými informacemi.'
    default:
      // Fallback – keep machine code out of UI, return empty and let caller drop it.
      return ''
  }
}

/**
 * O něco delší vysvětlující text pro detail profilu.
 * Vždy zůstává u stejného významu jako původní reason code.
 */
export function mapReasonCodeToDetailCs(code: MatchReasonCode): string {
  switch (code) {
    case 'DISTANCE_CLOSE':
      return 'Terapeut je blízko vás, takže cesta na fyzioterapii nebude zbytečně dlouhá a můžete docházet pravidelně.'
    case 'SPECIALTY_MATCH':
      return 'Terapeut se zaměřuje na potíže podobné těm vašim a má zkušenosti s příbuznými diagnózami.'
    case 'MEETING_TYPE_MATCH':
      return 'Nabízí takovou formu setkání (online, ordinace nebo dojíždění), kterou ve svém dotazníku preferujete.'
    case 'LANGUAGE_MATCH':
      return 'Domluvíte se společným jazykem, takže můžete své potíže popsat přirozeně a bez bariér.'
    case 'GENDER_PREFERRED':
      return 'Respektuje vaše přání ohledně pohlaví terapeuta, které jste uvedli v dotazníku.'
    case 'AGE_GROUP_MATCH':
      return 'Běžně pracuje s klienty ve vaší věkové skupině, takže je zvyklý na typické potřeby a situace.'
    case 'BARRIER_FREE_MATCH':
      return 'Jeho pracoviště je bezbariérové, což odpovídá vašim potřebám na přístupnost.'
    case 'ASAP_AVAILABILITY':
      return 'Má volné termíny v období, kdy chcete začít s fyzioterapií, takže nemusíte dlouho čekat.'
    case 'PROFILE_QUALITY':
      return 'Má pečlivě vyplněný profil s důležitými informacemi o praxi, zkušenostech a zaměření.'
    default:
      return ''
  }
}

/**
 * Returns Czech text for a reason object based on variant.
 * 
 * Prefers engine-provided Czech copy:
 * - for 'detail': reason.detailCs (if present)
 * - for 'card':  reason.labelCs (if present)
 * 
 * Falls back to code->copy mapping table if missing.
 * 
 * @param reason - Reason object with code, labelCs, detailCs, or a string
 * @param variant - 'card' for short text, 'detail' for longer text
 * @returns Czech text string (empty if no valid text found)
 */
export function reasonTextCs(reason: any, variant: 'card' | 'detail'): string {
  // Handle string reasons (legacy)
  if (typeof reason === 'string') {
    return reason.trim()
  }

  // Prefer engine-provided Czech copy
  if (variant === 'detail') {
    if (typeof reason?.detailCs === 'string' && reason.detailCs.trim().length > 0) {
      return reason.detailCs.trim()
    }
  }
  
  if (variant === 'card') {
    if (typeof reason?.labelCs === 'string' && reason.labelCs.trim().length > 0) {
      return reason.labelCs.trim()
    }
  }

  // Fallback: use both variants if available
  if (typeof reason?.detailCs === 'string' && reason.detailCs.trim().length > 0) {
    return reason.detailCs.trim()
  }
  if (typeof reason?.labelCs === 'string' && reason.labelCs.trim().length > 0) {
    return reason.labelCs.trim()
  }

  // Fallback to code mapping
  if (typeof reason?.code === 'string') {
    return variant === 'detail' 
      ? mapReasonCodeToDetailCs(reason.code)
      : mapReasonCodeToSummaryCs(reason.code)
  }

  // Fallback to label if present
  if (typeof reason?.label === 'string' && reason.label.trim().length > 0) {
    return reason.label.trim()
  }

  return ''
}

/**
 * Priority tiers for reason ordering:
 * 1. SPECIALTY_MATCH (highest priority)
 * 2. DISTANCE / AVAILABILITY / MEETING_TYPE (medium priority)
 * 3. LANGUAGE / GENDER / OTHER (lower priority)
 */
function getReasonPriority(code: string | undefined): number {
  if (!code) return 999
  
  // Tier 1: Highest priority
  if (code === 'SPECIALTY_MATCH') {
    return 1
  }
  
  // Tier 2: Medium priority
  if (code === 'DISTANCE_CLOSE' || code === 'ASAP_AVAILABILITY' || code === 'MEETING_TYPE_MATCH') {
    return 2
  }
  
  // Tier 3: Lower priority
  if (code === 'LANGUAGE_MATCH' || code === 'GENDER_PREFERRED') {
    return 3
  }
  
  // Other reasons (AGE_GROUP_MATCH, BARRIER_FREE_MATCH, PROFILE_QUALITY, etc.)
  return 4
}

/**
 * Picks the most relevant reasons in priority order and returns unique Czech texts.
 * 
 * Priority order:
 * 1. SPECIALTY_MATCH first
 * 2. DISTANCE / AVAILABILITY / MEETING_TYPE
 * 3. LANGUAGE / GENDER / OTHER
 * 
 * @param reasons - Array of reason objects or strings
 * @param variant - 'card' for short text, 'detail' for longer text
 * @param limit - Maximum number of reasons to return
 * @returns Array of unique Czech text strings
 */
export function pickTopReasonsCs(
  reasons: any[],
  variant: 'card' | 'detail',
  limit: number
): string[] {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return []
  }

  // Convert all reasons to objects with code and text
  const processed = reasons
    .map((r) => {
      const code = typeof r === 'string' ? undefined : r?.code
      const text = reasonTextCs(r, variant)
      return { code, text, original: r }
    })
    .filter((item) => item.text.length > 0)

  // Sort by priority, then by weight (if available), then preserve original order
  const sorted = processed.sort((a, b) => {
    const priorityA = getReasonPriority(a.code)
    const priorityB = getReasonPriority(b.code)
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Within same priority, sort by weight (descending)
    const weightA = typeof a.original === 'object' && typeof a.original?.weight === 'number' 
      ? a.original.weight 
      : 0
    const weightB = typeof b.original === 'object' && typeof b.original?.weight === 'number' 
      ? b.original.weight 
      : 0
    
    if (weightA !== weightB) {
      return weightB - weightA
    }
    
    return 0
  })

  // Deduplicate by text (keep first occurrence)
  const seen = new Set<string>()
  const unique: string[] = []
  
  for (const item of sorted) {
    if (!seen.has(item.text) && unique.length < limit) {
      seen.add(item.text)
      unique.push(item.text)
    }
  }

  return unique
}

