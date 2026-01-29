// Canonical city/clinic registry (static, no network)
// Uses the bundled dataset in /data/cz_places.json as the source of truth.

import rawPlaces from '@/data/cz_places.json'

export type CitySlug = string

export interface CityRecord {
  slug: CitySlug
  display_name: string
  lat: number
  lon: number
  region?: string
  postal_prefixes?: string[]
  synonyms?: string[]
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()

const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Seed from json (name, zip, lat, lon)
const BASE: CityRecord[] = (rawPlaces as any[]).slice(0, 500).map((p) => ({
  slug: slugify(p.name),
  display_name: p.name,
  lat: p.lat,
  lon: p.lon,
  postal_prefixes: p.zip ? [String(p.zip)] : [],
}))

// Add common synonyms for ambiguous names
const SYNONYM_SETS: Record<string, string[]> = {
  praha: ['prague', 'praha 1', 'praha 2', 'hlavni mesto praha'],
  brno: [],
  ostrava: [],
  plzen: ['plzeň', 'pilsen'],
  olomouc: [],
}

const REGISTRY: CityRecord[] = BASE.map((c) => ({
  ...c,
  synonyms: SYNONYM_SETS[c.slug] || [],
}))

export function allCities(): CityRecord[] {
  return REGISTRY
}

export function findBySlugOrSynonym(q: string): CityRecord | undefined {
  const n = normalize(q)
  const bySlug = REGISTRY.find((c) => c.slug === slugify(q))
  if (bySlug) return bySlug
  return REGISTRY.find((c) => c.synonyms?.some((s) => normalize(s) === n))
}

// Simple Levenshtein distance for fuzzy matching
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

export function fuzzyFindCities(query: string, limit = 5): CityRecord[] {
  const q = normalize(query)
  if (!q || q.length < 2) return []
  const scored = REGISTRY.map((c) => {
    const base = normalize(c.display_name)
    const d = levenshtein(q, base)
    return { c, d }
  })
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.c)
  return scored
}

export function resolveCity(query: string): CityRecord | undefined {
  return findBySlugOrSynonym(query) || fuzzyFindCities(query, 1)[0]
}


