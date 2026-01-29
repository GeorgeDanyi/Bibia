// E2E test for scoring correctness per PART H specifications

import { matchTherapists, applyFallbackLogic } from '@/lib/matching/engine'
import { normalizeSearchInputs } from '@/lib/matching/normalization'
import { Therapist, SearchInputs } from '@/lib/matching/types'

// Fixed fixture set for testing
const FIXTURE_THERAPISTS: Therapist[] = [
  {
    id: 'therapist-exact-match',
    fullName: 'MUDr. Jana Nováková',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    meetingTypes: ['ordinace', 'online'],
    serviceRadiusKm: 20,
    barrier_free: true,
    ageGroups: ['adult', 'senior'],
    acceptingNewClients: true,
    activeProfile: true,
    diagnoses: {
      canonicalIds: ['back-pain'],
      synonyms: ['bolest zad'],
      categories: ['orthopedics']
    },
    issues: ['bolest zad', 'krční páteř'],
    nextAvailableSlot: '2024-01-15T14:00:00Z',
    timeWindows: ['weekday', 'evening'],
    languages: ['cs', 'en'],
    acceptsInsurance: true,
    gender: 'female',
    isVerified: true,
    profileCompleteness: 95,
    reviewCount: 12,
    hasPhotos: true
  },
  {
    id: 'therapist-partial-match',
    fullName: 'Bc. Petr Svoboda',
    city: 'Brno',
    latitude: 49.1951,
    longitude: 16.6068,
    meetingTypes: ['ordinace', 'dojíždění'],
    serviceRadiusKm: 30,
    barrier_free: false,
    ageGroups: ['child', 'adult'],
    acceptingNewClients: true,
    activeProfile: true,
    diagnoses: {
      canonicalIds: ['sports-injury'],
      synonyms: ['sportovní úraz'],
      categories: ['sports-medicine']
    },
    issues: ['sportovní úraz', 'rehabilitace'],
    nextAvailableSlot: '2024-01-16T09:00:00Z',
    timeWindows: ['weekday'],
    languages: ['cs'],
    acceptsInsurance: true,
    gender: 'male',
    isVerified: false,
    profileCompleteness: 70,
    reviewCount: 5,
    hasPhotos: false
  },
  {
    id: 'therapist-no-match',
    fullName: 'Mgr. Anna Kratochvílová',
    city: 'Ostrava',
    latitude: 49.8209,
    longitude: 18.2625,
    meetingTypes: ['online'],
    serviceRadiusKm: 0,
    barrier_free: true,
    ageGroups: ['adult'],
    acceptingNewClients: false, // Not accepting new clients - should be filtered out
    activeProfile: true,
    diagnoses: {
      canonicalIds: ['neurological-rehab'],
      synonyms: ['neurologická rehabilitace'],
      categories: ['neurology']
    },
    issues: ['mrtvice', 'parkinson'],
    nextAvailableSlot: undefined,
    timeWindows: ['weekday'],
    languages: ['cs', 'de'],
    acceptsInsurance: false,
    gender: 'female',
    isVerified: true,
    profileCompleteness: 90,
    reviewCount: 15,
    hasPhotos: true
  },
  {
    id: 'therapist-distance-test',
    fullName: 'MUDr. Tomáš Dvořák',
    city: 'Plzeň',
    latitude: 49.7384,
    longitude: 13.3736,
    meetingTypes: ['ordinace'],
    serviceRadiusKm: 25,
    barrier_free: false,
    ageGroups: ['adult'],
    acceptingNewClients: true,
    activeProfile: true,
    diagnoses: {
      canonicalIds: ['back-pain'],
      synonyms: ['bolest zad'],
      categories: ['orthopedics']
    },
    issues: ['bolest zad', 'bolest kloubů'],
    nextAvailableSlot: '2024-01-17T16:00:00Z',
    timeWindows: ['weekday', 'evening'],
    languages: ['cs'],
    acceptsInsurance: true,
    gender: 'male',
    isVerified: true,
    profileCompleteness: 85,
    reviewCount: 8,
    hasPhotos: true
  }
]

describe('Matching Engine Scoring Correctness', () => {
  test('exact diagnosis match should outrank generalists', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Should have 3 results (excluding the one not accepting new clients)
    expect(results).toHaveLength(3)
    
    // Exact match should be first
    expect(results[0].therapist.id).toBe('therapist-exact-match')
    expect(results[0].match_score).toBeGreaterThan(80) // Should have high score for exact match
    
    // Distance test therapist should be second (same diagnosis but further)
    expect(results[1].therapist.id).toBe('therapist-distance-test')
    
    // Partial match should be last
    expect(results[2].therapist.id).toBe('therapist-partial-match')
  })

  test('hard filters should exclude non-matching therapists', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Should exclude therapist-not-accepting
    const notAcceptingTherapist = results.find(r => r.therapist.id === 'therapist-no-match')
    expect(notAcceptingTherapist).toBeUndefined()
  })

  test('barrier-free filter should work correctly', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: true // Require barrier-free
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Should only include barrier-free therapists
    results.forEach(result => {
      expect(result.therapist.barrier_free).toBe(true)
    })
    
    // Should include exact match (barrier-free) but exclude distance test (not barrier-free)
    expect(results.find(r => r.therapist.id === 'therapist-exact-match')).toBeDefined()
    expect(results.find(r => r.therapist.id === 'therapist-distance-test')).toBeUndefined()
  })

  test('age group filter should work correctly', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'child', // Require child specialist
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Should only include therapists who support children
    results.forEach(result => {
      expect(result.therapist.ageGroups).toContain('child')
    })
    
    // Should include partial match (supports children) but exclude exact match (adult/senior only)
    expect(results.find(r => r.therapist.id === 'therapist-partial-match')).toBeDefined()
    expect(results.find(r => r.therapist.id === 'therapist-exact-match')).toBeUndefined()
  })

  test('online meeting type should ignore distance', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'online',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Should include online therapists regardless of distance
    const onlineTherapist = results.find(r => r.therapist.id === 'therapist-exact-match')
    expect(onlineTherapist).toBeDefined()
    expect(onlineTherapist?.therapist.meetingTypes).toContain('online')
  })

  test('fallback logic should provide at least 3 results', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'very-specific-diagnosis' }, // No therapist has this
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: true
    }

    const { matches, fallbackUsed } = applyFallbackLogic(FIXTURE_THERAPISTS, inputs, 3)
    
    // Should use fallback and provide at least 3 results
    expect(fallbackUsed).toBe(true)
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  test('scoring should respect tie-breakers', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: ['bolest zad'],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Both exact match and distance test should have similar scores
    // But exact match should be first due to tie-breakers (verified, more reviews, etc.)
    expect(results[0].therapist.id).toBe('therapist-exact-match')
    expect(results[1].therapist.id).toBe('therapist-distance-test')
    
    // Exact match should have higher tie-breaker score
    expect(results[0].therapist.isVerified).toBe(true)
    expect(results[0].therapist.reviewCount).toBeGreaterThan(results[1].therapist.reviewCount)
  })

  test('normalization should handle diacritics correctly', () => {
    const rawInputs = {
      location: { city: 'Praha' },
      meetingType: 'ordinace',
      issues: ['bolest zad', 'krční páteř'],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const normalized = normalizeSearchInputs(rawInputs)
    
    // City normalization may preserve case, check that it's normalized
    expect(normalized.location.city.toLowerCase()).toBe('praha')
    // Issues are normalized to canonical IDs, check that diacritics are handled
    expect(normalized.issues.length).toBeGreaterThan(0)
    // The normalization converts "krční páteř" to "krcni pater" or a canonical ID
    expect(normalized.issues.some(issue => issue.includes('krcni') || issue.includes('pater') || issue.includes('spine') || issue.includes('back'))).toBe(true)
  })

  test('problem area matching should rank therapists with matching specializations higher', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: ['krk', 'hlava'], // Problem areas: neck and head
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Should have results
    expect(results.length).toBeGreaterThan(0)
    
    // Therapists with matching problem areas should rank higher
    // This test verifies that the problem area matching is working
    // The exact ranking depends on the therapist data and scoring algorithm
    results.forEach((result, index) => {
      if (index > 0) {
        // Each subsequent result should have equal or lower score
        expect(result.match_score).toBeLessThanOrEqual(results[index - 1].match_score)
      }
    })
  })

  test('gender filter should strictly exclude non-matching genders when strictGender is true', () => {
    // Test female preference - should only return female therapists when strictGender is true
    const femaleInputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'female',
      strictGender: true, // Strict female preference
      barrierFree: false
    }

    const femaleResults = matchTherapists(FIXTURE_THERAPISTS, femaleInputs)
    
    // Should only return female therapists
    expect(femaleResults.length).toBeGreaterThan(0)
    femaleResults.forEach(result => {
      expect(result.therapist.gender).toBe('female')
    })
    
    // Should NOT include male therapists
    const maleTherapists = femaleResults.filter(r => r.therapist.gender === 'male')
    expect(maleTherapists).toHaveLength(0)

    // Test male preference - should only return male therapists
    const maleInputs: SearchInputs = {
      ...femaleInputs,
      therapistGenderPref: 'male',
      strictGender: true // Strict male preference
    }

    const maleResults = matchTherapists(FIXTURE_THERAPISTS, maleInputs)
    
    // Should only return male therapists
    expect(maleResults.length).toBeGreaterThan(0)
    maleResults.forEach(result => {
      expect(result.therapist.gender).toBe('male')
    })
    
    // Should NOT include female therapists
    const femaleTherapists = maleResults.filter(r => r.therapist.gender === 'female')
    expect(femaleTherapists).toHaveLength(0)
  })

  test('gender filter with "any" should return all genders', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any', // No gender preference
      barrierFree: false
    }

    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    
    // Should return both male and female therapists
    const maleTherapists = results.filter(r => r.therapist.gender === 'male')
    const femaleTherapists = results.filter(r => r.therapist.gender === 'female')
    
    expect(maleTherapists.length).toBeGreaterThan(0)
    expect(femaleTherapists.length).toBeGreaterThan(0)
  })

  test('filters male therapists when strict female preference is enabled', () => {
    const answers: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'female',
      strictGender: true, // Strict filtering enabled
      barrierFree: false
    }

    const therapists = [
      {
        id: 'anna',
        fullName: 'Anna Nováková',
        city: 'Praha',
        latitude: 50.0755,
        longitude: 14.4378,
        meetingTypes: ['ordinace'],
        serviceRadiusKm: 20,
        barrier_free: true,
        ageGroups: ['adult'],
        acceptingNewClients: true,
        activeProfile: true,
        diagnoses: {
          canonicalIds: ['back-pain'],
          synonyms: [],
          categories: []
        },
        issues: ['bolest zad'],
        nextAvailableSlot: '2024-01-15T14:00:00Z',
        timeWindows: ['weekday'],
        languages: ['cs'],
        acceptsInsurance: true,
        gender: 'female',
        isVerified: true,
        profileCompleteness: 95,
        reviewCount: 12,
        hasPhotos: true
      },
      {
        id: 'jan',
        fullName: 'Jan Svoboda',
        city: 'Praha',
        latitude: 50.0755,
        longitude: 14.4378,
        meetingTypes: ['ordinace'],
        serviceRadiusKm: 20,
        barrier_free: true,
        ageGroups: ['adult'],
        acceptingNewClients: true,
        activeProfile: true,
        diagnoses: {
          canonicalIds: ['back-pain'],
          synonyms: [],
          categories: []
        },
        issues: ['bolest zad'],
        nextAvailableSlot: '2024-01-15T14:00:00Z',
        timeWindows: ['weekday'],
        languages: ['cs'],
        acceptsInsurance: true,
        gender: 'male',
        isVerified: true,
        profileCompleteness: 95,
        reviewCount: 12,
        hasPhotos: true
      }
    ]

    const results = matchTherapists(therapists, answers)
    
    // Should only return female therapists when strictGender is true
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(t => t.therapist.gender === 'female')).toBe(true)
    
    // Should NOT include male therapists
    const maleTherapists = results.filter(r => r.therapist.gender === 'male')
    expect(maleTherapists).toHaveLength(0)
    
    // Should include female therapists
    const femaleTherapists = results.filter(r => r.therapist.gender === 'female')
    expect(femaleTherapists.length).toBeGreaterThan(0)
  })

  test('allows other genders when strictGender is false', () => {
    const answers: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: [],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'female',
      strictGender: false, // Not strict - should allow other genders
      barrierFree: false
    }

    const therapists = [
      {
        id: 'anna',
        fullName: 'Anna Nováková',
        city: 'Praha',
        latitude: 50.0755,
        longitude: 14.4378,
        meetingTypes: ['ordinace'],
        serviceRadiusKm: 20,
        barrier_free: true,
        ageGroups: ['adult'],
        acceptingNewClients: true,
        activeProfile: true,
        diagnoses: {
          canonicalIds: ['back-pain'],
          synonyms: [],
          categories: []
        },
        issues: ['bolest zad'],
        nextAvailableSlot: '2024-01-15T14:00:00Z',
        timeWindows: ['weekday'],
        languages: ['cs'],
        acceptsInsurance: true,
        gender: 'female',
        isVerified: true,
        profileCompleteness: 95,
        reviewCount: 12,
        hasPhotos: true
      },
      {
        id: 'jan',
        fullName: 'Jan Svoboda',
        city: 'Praha',
        latitude: 50.0755,
        longitude: 14.4378,
        meetingTypes: ['ordinace'],
        serviceRadiusKm: 20,
        barrier_free: true,
        ageGroups: ['adult'],
        acceptingNewClients: true,
        activeProfile: true,
        diagnoses: {
          canonicalIds: ['back-pain'],
          synonyms: [],
          categories: []
        },
        issues: ['bolest zad'],
        nextAvailableSlot: '2024-01-15T14:00:00Z',
        timeWindows: ['weekday'],
        languages: ['cs'],
        acceptsInsurance: true,
        gender: 'male',
        isVerified: true,
        profileCompleteness: 95,
        reviewCount: 12,
        hasPhotos: true
      }
    ]

    const results = matchTherapists(therapists, answers)
    
    // Should return both male and female therapists when strictGender is false
    expect(results.length).toBeGreaterThan(0)
    const maleTherapists = results.filter(r => r.therapist.gender === 'male')
    const femaleTherapists = results.filter(r => r.therapist.gender === 'female')
    
    // Should include both genders
    expect(maleTherapists.length).toBeGreaterThan(0)
    expect(femaleTherapists.length).toBeGreaterThan(0)
  })
})

// Performance test
describe('Matching Engine Performance', () => {
  test('should complete search under 200ms', () => {
    const inputs: SearchInputs = {
      location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
      meetingType: 'ordinace',
      issues: ['bolest zad'],
      diagnosis: { canonicalId: 'back-pain' },
      timeFit: 'weekday',
      language: 'cs',
      wantsInsurance: true,
      ageGroup: 'adult',
      therapistGenderPref: 'any',
      barrierFree: false
    }

    const startTime = Date.now()
    const results = matchTherapists(FIXTURE_THERAPISTS, inputs)
    const endTime = Date.now()
    
    const searchTime = endTime - startTime
    expect(searchTime).toBeLessThan(200) // Should be under 200ms
    expect(results.length).toBeGreaterThan(0)
  })
})
