import { migrateToAnswers } from '@/lib/types/answers'

describe('migrateToAnswers - gender preference mapping', () => {
  test('maps legacy therapistGender="zena" to genderPreference="female"', () => {
    const legacy = {
      city: 'Praha',
      therapistGender: 'zena'
    }

    const migrated = migrateToAnswers(legacy)

    expect(migrated.genderPreference).toBe('female')
  })

  test('maps legacy therapistGender="muz" to genderPreference="male"', () => {
    const legacy = {
      city: 'Praha',
      therapistGender: 'muz'
    }

    const migrated = migrateToAnswers(legacy)

    expect(migrated.genderPreference).toBe('male')
  })

  test('maps missing/empty therapistGender to genderPreference="any"', () => {
    const legacy = {
      city: 'Praha'
    }

    const migrated = migrateToAnswers(legacy)

    expect(migrated.genderPreference).toBe('any')
  })

  test('maps therapistGender="nezalezi" to genderPreference="any"', () => {
    const legacy = {
      city: 'Praha',
      therapistGender: 'nezalezi'
    }

    const migrated = migrateToAnswers(legacy)

    expect(migrated.genderPreference).toBe('any')
  })
})






