import { mapMatchResultsToTherapistMatches, selectResultsFromApiResponse } from '@/lib/hooks/useSearchResults'
import type { TherapistMatch } from '@/lib/matching/types'
import { normalizeMatchPercent } from '@/lib/matching/matching-engine'

describe('useSearchResults – result source selection and mapping', () => {
  test('mapMatchResultsToTherapistMatches maps canonical matches into TherapistMatch shape', () => {
    const canonicalMatch = {
      therapist: {
        id: 't1',
        fullName: 'Test Terapeut',
        city: 'Praha',
        meeting_types: ['clinic', 'online'],
        age_groups: ['adult'],
        languages: ['cs', 'en'],
        accepts_insurance: true,
        next_available_slot: '2025-01-01T10:00:00Z'
      },
      totalScore: 24.5,
      matchPercent: 80,
      distanceKm: 12.3,
      reasons: [
        { code: 'MEETING_TYPE_MATCH', detailCs: 'Nabízí formu setkání, kterou hledáte.' },
        { code: 'DISTANCE_CLOSE', label: 'Blízko vaší polohy.' }
      ],
      breakdown: {
        specialties: 10,
        languages: 5,
        timePreference: 3,
        gender: 4,
        distance: 2,
        profileScore: 0.5,
        genderPenalty: 0,
        totalScore: 24.5
      }
    }

    const mapped = mapMatchResultsToTherapistMatches([canonicalMatch])
    expect(mapped).toHaveLength(1)
    const m: TherapistMatch = mapped[0]

    // Therapist is forwarded
    expect((m.therapist as any).id).toBe('t1')
    expect((m.therapist as any).fullName).toBe('Test Terapeut')

    // Score uses matchPercent (rounded) as the primary UI score
    expect(m.match_score).toBe(80)

    // Distance is propagated
    expect(m.distance_km).toBeCloseTo(12.3)

    // Meeting types are converted to Czech labels for the UI
    expect(m.meeting_types).toEqual(expect.arrayContaining(['ordinace', 'online']))

    // Reasons prefer Czech detailCs when available
    expect(m.reasons[0]).toContain('formu setkání')
  })

  test('mapMatchResultsToTherapistMatches prioritizes detailCs, then labelCs/label, trims and drops empty reasons', () => {
    const canonicalMatch = {
      therapist: {
        id: 't3',
        fullName: 'Reasons Terapeut',
        meeting_types: [],
        age_groups: [],
        languages: [],
        accepts_insurance: false
      },
      totalScore: 10,
      matchPercent: 50,
      distanceKm: 1,
      reasons: [
        // detailCs should win over everything else
        { code: 'DETAIL_FIRST', detailCs: '  Detail CZ reason.  ', labelCs: 'Label CZ reason.', label: 'Generic label.' },
        // labelCs when no detailCs
        { code: 'LABEL_CS', labelCs: '  Label only CZ reason.  ' },
        // label when no detailCs/labelCs
        { code: 'LABEL', label: '  Fallback label reason.  ' },
        // raw string reason
        '  Raw string reason.  ',
        // empty / blank values that should be dropped
        '',
        '   ',
        { code: 'EMPTY_DETAIL', detailCs: '   ' },
        { code: 'NO_TEXT' }
      ],
      breakdown: {
        specialties: 0,
        languages: 0,
        timePreference: 0,
        gender: 0,
        distance: 0,
        profileScore: 0,
        genderPenalty: 0,
        totalScore: 10
      }
    }

    const mapped = mapMatchResultsToTherapistMatches([canonicalMatch])
    expect(mapped).toHaveLength(1)
    const m: TherapistMatch = mapped[0]

    // Reasons keep the best available text in priority order and are trimmed
    expect(m.reasons).toEqual([
      'Detail CZ reason.',
      'Label only CZ reason.',
      'Fallback label reason.',
      'Raw string reason.'
    ])

    // No empty or whitespace-only reasons
    expect(m.reasons.every(r => r.trim().length > 0)).toBe(true)
  })

  test('mapMatchResultsToTherapistMatches falls back to normalized totalScore when matchPercent is missing', () => {
    const canonicalMatch = {
      therapist: {
        id: 't2',
        fullName: 'Fallback Terapeut',
        meeting_types: ['clinic'],
        age_groups: ['adult'],
        languages: ['cs'],
        accepts_insurance: true
      },
      totalScore: 30,
      // matchPercent intentionally omitted to exercise fallback
      distanceKm: 5,
      reasons: [],
      breakdown: {
        specialties: 10,
        languages: 5,
        timePreference: 3,
        gender: 4,
        distance: 2,
        profileScore: 0.5,
        genderPenalty: 0,
        totalScore: 30
      }
    }

    const mapped = mapMatchResultsToTherapistMatches([canonicalMatch])
    expect(mapped).toHaveLength(1)
    const m: TherapistMatch = mapped[0]

    const expectedPercent = normalizeMatchPercent(30)
    expect(m.match_score).toBe(expectedPercent)
    expect(m.matchPercent).toBe(expectedPercent)
  })

  test('selectResultsFromApiResponse prefers matchResults.matches over matches/results', () => {
    const fromMatchResults = { therapist: { id: 'mr-1' } }
    const fromMatches = { therapist: { id: 'old-matches-1' } }
    const fromResults = { therapist: { id: 'legacy-1' } }

    const response = {
      matchResults: { matches: [fromMatchResults] },
      matches: [fromMatches],
      results: [fromResults]
    }

    const selected = selectResultsFromApiResponse(response)
    expect(selected).toHaveLength(1)
    expect((selected[0].therapist as any).id).toBe('mr-1')
  })

  test('selectResultsFromApiResponse supports matchResults as a bare array', () => {
    const fromMatchResultsArray = { therapist: { id: 'mr-array-1' } }
    const fromMatches = { therapist: { id: 'old-matches-1' } }
    const fromResults = { therapist: { id: 'legacy-1' } }

    const response = {
      matchResults: [fromMatchResultsArray],
      matches: [fromMatches],
      results: [fromResults]
    }

    const selected = selectResultsFromApiResponse(response)
    expect(selected).toHaveLength(1)
    expect((selected[0].therapist as any).id).toBe('mr-array-1')
  })
})

