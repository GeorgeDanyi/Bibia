import diagnoses from '@/data/diagnoses.json'

function normalizeText(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

// Build lookup maps once
const idByToken: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const d of diagnoses as Array<{ id: string; canonical_cs?: string; synonyms?: string[] }>) {
    if (!d || !d.id) continue
    // Canonical Czech name
    if (d.canonical_cs) {
      map[normalizeText(d.canonical_cs)] = d.id
    }
    // Synonyms
    if (Array.isArray(d.synonyms)) {
      for (const s of d.synonyms) {
        if (s) map[normalizeText(String(s))] = d.id
      }
    }
    // Also allow direct id usage
    map[normalizeText(d.id)] = d.id
  }
  return map
})()

export function toDiagnosisIds(raw: string[] | undefined): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!item) continue
    const key = normalizeText(String(item))
    const id = idByToken[key]
    if (id && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

import diagnosesData from '@/data/diagnoses.json'

export interface DiagnosisItem {
  id: string
  canonical_cz: string
  synonyms: string[]
  category: string
  body_region: string
  related_therapist_tags: string[]
  min_experts: number
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function loadDiagnoses(): DiagnosisItem[] {
  return (diagnosesData as unknown as DiagnosisItem[]) || []
}

export type DiagnosisMatchType = 'exact' | 'synonym' | 'category' | 'body_region'

export interface DiagnosisMatch {
  item: DiagnosisItem
  type: DiagnosisMatchType
  score: number // 1.0 exact, 0.9 synonym, 0.75 category/body_region
  matchedOn?: string
}

export function fuzzyIncludes(haystack: string, needle: string): boolean {
  const h = normalize(haystack)
  const n = normalize(needle)
  if (h.includes(n)) return true
  // naive 1-2 edit tolerance via substring window
  if (n.length <= 3) return false
  const window = Math.max(3, Math.min(h.length, n.length + 2))
  for (let i = 0; i <= h.length - window; i++) {
    const seg = h.slice(i, i + window)
    let diff = 0
    for (let j = 0; j < Math.min(seg.length, n.length); j++) {
      if (seg[j] !== n[j]) diff++
      if (diff > 2) break
    }
    if (diff <= 2) return true
  }
  return false
}

export function findDiagnosisMatches(input: string): DiagnosisMatch[] {
  const items = loadDiagnoses()
  const norm = normalize(input)
  if (!norm) return []

  const matches: DiagnosisMatch[] = []

  for (const item of items) {
    const canon = normalize(item.canonical_cz)
    if (canon === norm || fuzzyIncludes(canon, norm)) {
      matches.push({ item, type: 'exact', score: 1.0, matchedOn: item.canonical_cz })
      continue
    }
    for (const syn of item.synonyms) {
      if (fuzzyIncludes(syn, norm)) {
        matches.push({ item, type: 'synonym', score: 0.9, matchedOn: syn })
        break
      }
    }
  }

  // If nothing, propose category/body region suggestions
  if (matches.length === 0) {
    const byCategory = new Map<string, DiagnosisItem[]>()
    for (const item of items) {
      const list = byCategory.get(item.category) || []
      list.push(item)
      byCategory.set(item.category, list)
    }
    for (const [category, list] of byCategory) {
      if (fuzzyIncludes(category, norm)) {
        for (const item of list.slice(0, 3)) {
          matches.push({ item, type: 'category', score: 0.75 })
        }
      }
    }
    const byRegion = new Map<string, DiagnosisItem[]>()
    for (const item of items) {
      const list = byRegion.get(item.body_region) || []
      list.push(item)
      byRegion.set(item.body_region, list)
    }
    for (const [region, list] of byRegion) {
      if (fuzzyIncludes(region, norm)) {
        for (const item of list.slice(0, 3)) {
          matches.push({ item, type: 'body_region', score: 0.75 })
        }
      }
    }
  }

  // Deduplicate by item id keeping best score
  const best = new Map<string, DiagnosisMatch>()
  for (const m of matches) {
    const prev = best.get(m.item.id)
    if (!prev || m.score > prev.score) best.set(m.item.id, m)
  }
  return Array.from(best.values()).sort((a,b)=> b.score - a.score)
}

export function suggestTop(input: string, limit = 6): { label: string; id: string; score: number; type: DiagnosisMatchType }[] {
  const matches = findDiagnosisMatches(input)
  return matches.slice(0, limit).map(m => ({ label: m.item.canonical_cz, id: m.item.id, score: m.score, type: m.type }))
}

export function toTherapistTags(match: DiagnosisMatch): string[] {
  return match.item.related_therapist_tags || []
}


