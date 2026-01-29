import { NextRequest, NextResponse } from 'next/server'
import { searchSimple } from '@/lib/search/booleanGeo'
import { type SimpleQuery } from '@/lib/search/simple'
import { type TherapistNormalized } from '@/lib/types/therapist'
import { normalizeTherapistGender } from '@/lib/utils/normalize'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function loadNormalizedTherapists(): Promise<TherapistNormalized[]> {
  try {
    const localPath = path.join(process.cwd(), 'data', 'therapists.normalized.json')
    const raw = await readFile(localPath, 'utf8')
    const json = JSON.parse(raw)
    const therapists = Array.isArray(json) ? json as TherapistNormalized[] : []
    // Normalize gender for all therapists (strictly 'male' | 'female')
    return therapists.map(t => ({
      ...t,
      gender: normalizeTherapistGender(t.gender, t.id) as 'male' | 'female'
    }))
  } catch {
    try {
      // fallback to canonical dataset if present
      // eslint-disable-next-line
      const data = require('../../../data/therapists.json') as any[]
      // best-effort mapping with gender normalization
      const therapists = (Array.isArray(data) ? data : []) as unknown as TherapistNormalized[]
      return therapists.map(t => ({
        ...t,
        gender: normalizeTherapistGender(t.gender, t.id) as 'male' | 'female'
      }))
    } catch {
      return []
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city = (searchParams.get('city') || '').trim()
  const radiusKm = searchParams.get('radiusKm') ? Number(searchParams.get('radiusKm')) : undefined
  const genderParam = (searchParams.get('gender') || 'any').toLowerCase()
  const gender: 'male'|'female'|'any' = (genderParam === 'male' || genderParam === 'female') ? (genderParam as any) : 'any'
  const condition = (searchParams.get('condition') || '').trim()

  const query: SimpleQuery = { city, radiusKm, gender, conditionText: condition }

  try {
    const therapists = await loadNormalizedTherapists()
    const results = searchSimple({ query, therapists })
    const payload = results.map(r => ({
      id: r.therapist.id,
      name: r.therapist.full_name,
      city: r.therapist.base_city,
      distanceKm: r.distanceKm,
      meeting_modes: r.therapist.meeting_modes
    }))
    return NextResponse.json(payload)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed' }, { status: 400 })
  }
}


