import { computeTherapistMatchScore, type MatchInput, type Therapist } from './score'

function makeTherapist(overrides: Partial<Therapist> = {}): Therapist {
  return {
    id: 't1',
    coords: [50.0755, 14.4378],
    skills: [],
    calendar: {},
    gender: 'male',
    city: 'Praha',
    ...overrides
  }
}

function makeInput(overrides: Partial<MatchInput> = {}): MatchInput {
  return {
    diagnosisIds: [],
    city: 'Praha',
    when: { day: '', timeSlot: '' },
    genderPref: 'any',
    ...overrides
  }
}

describe('computeTherapistMatchScore', () => {
  test('perfect match = 1.0 (ignoring distance fallback)', () => {
    const t = makeTherapist({
      skills: ['dx.back_pain'],
      calendar: { mon: ['morning'] },
      gender: 'male'
    })
    const input = makeInput({ diagnosisIds: ['dx.back_pain'], when: { day: 'mon', timeSlot: 'morning' }, genderPref: 'male' })
    const score = computeTherapistMatchScore(input, t)
    expect(score).toBeCloseTo(0.5*1 + 0.25*0.25 + 0.15*1 + 0.10*1, 6)
  })

  test('medium match ≈ 0.6 (category, day match, any gender)', () => {
    const t = makeTherapist({
      skills: ['dx:spine'],
      calendar: { tue: ['afternoon'] },
      gender: 'female'
    })
    const input = makeInput({ diagnosisIds: ['dx:spine.sciatica'], when: { day: 'tue', timeSlot: 'morning' }, genderPref: 'any' })
    const expected = 0.5*0.75 + 0.25*0.25 + 0.15*0.75 + 0.10*0.75
    const score = computeTherapistMatchScore(input, t)
    expect(score).toBeCloseTo(expected, 3)
  })

  test('low match ≈ 0.3 (no dx, no time, gender mismatch)', () => {
    const t = makeTherapist({
      skills: ['other'],
      calendar: {},
      gender: 'female'
    })
    const input = makeInput({ diagnosisIds: ['dx.other'], when: { day: 'wed', timeSlot: 'evening' }, genderPref: 'male' })
    const expected = 0.5*0 + 0.25*0.25 + 0.15*0 + 0.10*0
    const score = computeTherapistMatchScore(input, t)
    expect(score).toBeCloseTo(expected, 3)
  })
})


describe('time availability scoring via computeTherapistMatchScore', () => {
  // Baseline components when isolating time:
  // diagnosis=0, distance=0.25, genderPref='any' => gender=0.75
  // total = 0.5*0 + 0.25*0.25 + 0.15*time + 0.10*0.75
  //        = 0.0625 + 0.15*time + 0.075
  //        = 0.1375 + 0.15*time

  test('time=1.0 when exact day+slot present', () => {
    const t = makeTherapist({ calendar: { mon: ['morning'] } })
    const input = makeInput({ when: { day: 'mon', timeSlot: 'morning' }, genderPref: 'any', diagnosisIds: [] })
    const score = computeTherapistMatchScore(input, t)
    const expected = 0.1375 + 0.15*1.0
    expect(score).toBeCloseTo(expected, 6)
  })

  test('time=0.75 when day has some availability but not the slot', () => {
    const t = makeTherapist({ calendar: { tue: ['afternoon'] } })
    const input = makeInput({ when: { day: 'tue', timeSlot: 'morning' }, genderPref: 'any', diagnosisIds: [] })
    const score = computeTherapistMatchScore(input, t)
    const expected = 0.1375 + 0.15*0.75
    expect(score).toBeCloseTo(expected, 6)
  })

  test('time=0.5 when slot exists on some other day', () => {
    const t = makeTherapist({ calendar: { wed: ['evening'] } })
    const input = makeInput({ when: { day: 'thu', timeSlot: 'evening' }, genderPref: 'any', diagnosisIds: [] })
    const score = computeTherapistMatchScore(input, t)
    const expected = 0.1375 + 0.15*0.5
    expect(score).toBeCloseTo(expected, 6)
  })

  test('time=0 when no day or slot matches', () => {
    const t = makeTherapist({ calendar: { fri: ['morning'] } })
    const input = makeInput({ when: { day: 'mon', timeSlot: 'evening' }, genderPref: 'any', diagnosisIds: [] })
    const score = computeTherapistMatchScore(input, t)
    const expected = 0.1375 + 0.15*0
    expect(score).toBeCloseTo(expected, 6)
  })
})


