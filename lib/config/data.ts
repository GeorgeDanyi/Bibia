export const USE_SYNTHETIC: boolean = process.env.USE_SYNTHETIC === 'true' || process.env.NODE_ENV !== 'production'

export function isSyntheticEnabledFromQuery(search?: string | null): boolean {
  if (!search) return USE_SYNTHETIC
  try {
    const q = new URLSearchParams(search)
    const seed = q.get('seed')
    if (seed === 'on') return true
    if (seed === 'off') return false
  } catch {}
  return USE_SYNTHETIC
}
