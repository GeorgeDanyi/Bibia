#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { CANONICAL_SPECIALTIES } from '@/lib/constants/canonical-taxonomies'

type T = {
  id: string
  city: string
  lat: number
  lng: number
  specialties: string[]
  availability: string[]
}

function isISODate(s: string): boolean {
  // Basic ISO 8601 check with timezone offset allowed
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(s)
}

function main() {
  const file = process.env.DATA || path.join(process.cwd(), 'data', 'therapists.json')
  const raw = fs.readFileSync(file, 'utf-8')
  const data: T[] = JSON.parse(raw)

  const errors: string[] = []

  if (data.length < 1000) {
    errors.push(`Profile count too low: ${data.length} (<1000)`) 
  }

  // Coverage by specialties
  const specCounts: Record<string, number> = Object.fromEntries(CANONICAL_SPECIALTIES.map(s=>[s,0]))
  for (const t of data) {
    if (typeof t.lat !== 'number' || typeof t.lng !== 'number') {
      errors.push(`Missing lat/lng for ${t.id}`)
    }
    if (!Array.isArray(t.availability) || t.availability.length === 0) {
      errors.push(`Missing availability for ${t.id}`)
    } else if (!t.availability.every(isISODate)) {
      errors.push(`Invalid ISO availability for ${t.id}`)
    }
    for (const s of t.specialties) {
      if (specCounts[s] !== undefined) specCounts[s]++
    }
  }

  for (const s of CANONICAL_SPECIALTIES) {
    if ((specCounts[s] || 0) < 30) {
      errors.push(`Specialty coverage too low for ${s}: ${(specCounts[s]||0)} (<30)`) 
    }
  }

  if (errors.length) {
    console.error('VALIDATION FAILED:')
    for (const e of errors) console.error('- ' + e)
    process.exit(1)
  }

  console.log('Validation OK')
}

main()


