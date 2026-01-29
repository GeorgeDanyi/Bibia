export function normalizeDiagnosis(value?: string | null): string | null {
  if (typeof value !== 'string') return null
  const normalized = value
    .normalize('NFD')
    // @ts-ignore - Unicode property escapes supported in modern runtimes
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
  return normalized.length > 0 ? normalized : null
}


