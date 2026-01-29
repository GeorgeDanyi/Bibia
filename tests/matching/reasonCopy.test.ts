import { mapReasonCodeToSummaryCs, reasonTextCs, pickTopReasonsCs } from '@/lib/matching/reasonCopy'

describe('reasonCopy – mapReasonCodeToSummaryCs', () => {
  it('maps DISTANCE_CLOSE to Czech copy starting with "Blízko vás"', () => {
    const text = mapReasonCodeToSummaryCs('DISTANCE_CLOSE')
    expect(text).toContain('Blízko vás')
  })

  it('maps SPECIALTY_MATCH to Czech copy starting with "Zaměřuje se na vaše potíže"', () => {
    const text = mapReasonCodeToSummaryCs('SPECIALTY_MATCH')
    expect(text).toContain('Zaměřuje se na vaše potíže')
  })

  it('maps MEETING_TYPE_MATCH to Czech copy about preferred meeting type', () => {
    const text = mapReasonCodeToSummaryCs('MEETING_TYPE_MATCH')
    expect(text).toContain('formu setkání')
  })

  it('maps LANGUAGE_MATCH to Czech copy starting with "Domluvíte se společným jazykem"', () => {
    const text = mapReasonCodeToSummaryCs('LANGUAGE_MATCH')
    expect(text).toContain('Domluvíte se společným jazykem')
  })

  it('maps GENDER_PREFERRED to Czech copy starting with "Respektuje vaše přání ohledně pohlaví"', () => {
    const text = mapReasonCodeToSummaryCs('GENDER_PREFERRED')
    expect(text).toContain('Respektuje vaše přání ohledně pohlaví')
  })
})

describe('reasonCopy – reasonTextCs', () => {
  it('returns detailCs for detail variant when present', () => {
    const reason = {
      code: 'DISTANCE_CLOSE',
      labelCs: 'Blízko vás',
      detailCs: 'Terapeut je blízko vás, takže cesta na fyzioterapii nebude zbytečně dlouhá.'
    }
    const text = reasonTextCs(reason, 'detail')
    expect(text).toBe('Terapeut je blízko vás, takže cesta na fyzioterapii nebude zbytečně dlouhá.')
  })

  it('returns labelCs for card variant when present', () => {
    const reason = {
      code: 'DISTANCE_CLOSE',
      labelCs: 'Blízko vás',
      detailCs: 'Terapeut je blízko vás, takže cesta na fyzioterapii nebude zbytečně dlouhá.'
    }
    const text = reasonTextCs(reason, 'card')
    expect(text).toBe('Blízko vás')
  })

  it('falls back to code mapping when engine copy missing', () => {
    const reason = {
      code: 'SPECIALTY_MATCH'
    }
    const cardText = reasonTextCs(reason, 'card')
    const detailText = reasonTextCs(reason, 'detail')
    expect(cardText).toContain('Zaměřuje se na vaše potíže')
    expect(detailText).toContain('Terapeut se zaměřuje na potíže')
  })

  it('handles string reasons (legacy)', () => {
    const text = reasonTextCs('Domluvíte se společným jazykem', 'card')
    expect(text).toBe('Domluvíte se společným jazykem')
  })

  it('returns empty string for invalid reason', () => {
    const text = reasonTextCs({}, 'card')
    expect(text).toBe('')
  })
})

describe('reasonCopy – pickTopReasonsCs', () => {
  it('respects priority ordering: SPECIALTY_MATCH first', () => {
    const reasons = [
      { code: 'LANGUAGE_MATCH', labelCs: 'Jazyk', weight: 5 },
      { code: 'SPECIALTY_MATCH', labelCs: 'Specializace', weight: 10 },
      { code: 'GENDER_PREFERRED', labelCs: 'Pohlaví', weight: 3 }
    ]
    const result = pickTopReasonsCs(reasons, 'card', 3)
    expect(result[0]).toBe('Specializace')
  })

  it('respects priority ordering: DISTANCE/AVAILABILITY/MEETING_TYPE second', () => {
    const reasons = [
      { code: 'LANGUAGE_MATCH', labelCs: 'Jazyk', weight: 5 },
      { code: 'DISTANCE_CLOSE', labelCs: 'Vzdálenost', weight: 8 },
      { code: 'GENDER_PREFERRED', labelCs: 'Pohlaví', weight: 3 }
    ]
    const result = pickTopReasonsCs(reasons, 'card', 3)
    expect(result[0]).toBe('Vzdálenost')
  })

  it('respects limit parameter', () => {
    const reasons = [
      { code: 'SPECIALTY_MATCH', labelCs: 'Specializace', weight: 10 },
      { code: 'DISTANCE_CLOSE', labelCs: 'Vzdálenost', weight: 8 },
      { code: 'MEETING_TYPE_MATCH', labelCs: 'Typ setkání', weight: 5 },
      { code: 'LANGUAGE_MATCH', labelCs: 'Jazyk', weight: 3 }
    ]
    const result = pickTopReasonsCs(reasons, 'card', 2)
    expect(result.length).toBe(2)
  })

  it('returns unique texts (no duplicates)', () => {
    const reasons = [
      { code: 'SPECIALTY_MATCH', labelCs: 'Specializace', weight: 10 },
      { code: 'SPECIALTY_MATCH', labelCs: 'Specializace', weight: 10 },
      { code: 'DISTANCE_CLOSE', labelCs: 'Vzdálenost', weight: 8 }
    ]
    const result = pickTopReasonsCs(reasons, 'card', 5)
    expect(result.length).toBe(2)
    expect(result.filter((r) => r === 'Specializace').length).toBe(1)
  })

  it('handles mixed string and object reasons', () => {
    const reasons = [
      'Domluvíte se společným jazykem',
      { code: 'SPECIALTY_MATCH', labelCs: 'Specializace', weight: 10 }
    ]
    const result = pickTopReasonsCs(reasons, 'card', 5)
    expect(result.length).toBe(2)
    expect(result).toContain('Domluvíte se společným jazykem')
    expect(result).toContain('Specializace')
  })

  it('returns empty array for empty input', () => {
    const result = pickTopReasonsCs([], 'card', 3)
    expect(result).toEqual([])
  })

  it('uses detail variant for longer text', () => {
    const reasons = [
      {
        code: 'DISTANCE_CLOSE',
        labelCs: 'Blízko vás',
        detailCs: 'Terapeut je blízko vás, takže cesta na fyzioterapii nebude zbytečně dlouhá.'
      }
    ]
    const cardResult = pickTopReasonsCs(reasons, 'card', 1)
    const detailResult = pickTopReasonsCs(reasons, 'detail', 1)
    expect(cardResult[0]).toBe('Blízko vás')
    expect(detailResult[0]).toContain('Terapeut je blízko vás')
  })

  it('sorts by weight within same priority tier', () => {
    const reasons = [
      { code: 'DISTANCE_CLOSE', labelCs: 'Vzdálenost 1', weight: 5 },
      { code: 'DISTANCE_CLOSE', labelCs: 'Vzdálenost 2', weight: 10 },
      { code: 'MEETING_TYPE_MATCH', labelCs: 'Typ setkání', weight: 3 }
    ]
    const result = pickTopReasonsCs(reasons, 'card', 3)
    // Both DISTANCE_CLOSE reasons should come before MEETING_TYPE_MATCH
    // Higher weight should come first within same priority
    expect(result[0]).toBe('Vzdálenost 2')
    expect(result[1]).toBe('Vzdálenost 1')
  })
})


