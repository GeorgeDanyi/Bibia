import { normalizeSearchInputs, normalizeGenderPref } from '@/lib/matching/normalization'
import type { Answers } from '@/lib/types/answers'

describe('Gender preference normalization pipeline', () => {
  test('normalizeGenderPref handles explicit canonical values', () => {
    expect(normalizeGenderPref('female')).toBe('female')
    expect(normalizeGenderPref('male')).toBe('male')
  })

  test('normalizeGenderPref is case- and whitespace-insensitive for canonical values', () => {
    expect(normalizeGenderPref('Female')).toBe('female')
    expect(normalizeGenderPref(' female ')).toBe('female')
  })

  test('normalizeGenderPref maps Czech feminine variants to "female"', () => {
    expect(normalizeGenderPref('zena')).toBe('female')
    expect(normalizeGenderPref('žena')).toBe('female')
  })

  test('normalizeGenderPref maps Czech masculine variants to "male"', () => {
    expect(normalizeGenderPref('muz')).toBe('male')
    expect(normalizeGenderPref('muž')).toBe('male')
  })

  test('normalizeGenderPref never treats canonical "female" as male (regression for includes("male"))', () => {
    // If implementation used normalized.includes('male'), this would incorrectly map to 'male'.
    expect(normalizeGenderPref('female')).toBe('female')
  })

  test('Answers.genderPreference="female" → normalizedInputs.therapistGenderPref="female"', () => {
    const answers: Answers = {
      city: 'Praha',
      radiusKm: 30,
      meetingType: 'clinic',
      problemArea: 'back-pain',
      problemDetail: 'bolest zad',
      ageGroup: 'adult',
      genderPreference: 'female',
      strictGender: true,
      barrierFree: false,
      languages: ['cs'],
      insuranceMode: 'insurance',
      timesOfDay: [],
      weekdays: []
    }

    // Simulate payload as sent to normalizeSearchInputs:
    // - carry over both genderPreference and therapistGenderPref
    const rawPayload: any = {
      ...answers,
      genderPreference: answers.genderPreference,
      therapistGenderPref: answers.genderPreference,
      strictGender: answers.strictGender
    }

    const normalized = normalizeSearchInputs(rawPayload)

    expect(normalized.therapistGenderPref).toBe('female')
    expect(normalized.strictGender).toBe(true)
  })
})


