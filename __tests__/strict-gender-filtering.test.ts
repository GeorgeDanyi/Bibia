// Tests for strict gender filtering and hard filters
// Ensures matching logic correctly handles strictGender flag and hard filters

import { matchTherapists } from '@/lib/matching/engine'
import { SearchInputs, Therapist } from '@/lib/matching/types'

// Helper function to create a minimal therapist
function createTherapist(
  id: string,
  gender: 'male' | 'female',
  meetingTypes: ('ordinace' | 'dojíždění' | 'online')[] = ['ordinace'],
  barrierFree: boolean = false
): Therapist {
  return {
    id,
    fullName: gender === 'female' ? 'Anna Nováková' : 'Jan Svoboda',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    meetingTypes,
    serviceRadiusKm: 20,
    barrier_free: barrierFree,
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
    gender,
    isVerified: true,
    profileCompleteness: 95,
    reviewCount: 12,
    hasPhotos: true
  }
}

// Helper function to create base search inputs
function createBaseInputs(overrides: Partial<SearchInputs> = {}): SearchInputs {
  return {
    location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } },
    meetingType: 'ordinace',
    issues: [],
    diagnosis: { canonicalId: 'back-pain' },
    timeFit: 'weekday',
    language: 'cs',
    wantsInsurance: true,
    ageGroup: 'adult',
    therapistGenderPref: 'any',
    barrierFree: false,
    ...overrides
  }
}

describe('Strict Gender Filtering', () => {
  test('strict female preference: only returns female therapists', () => {
    const therapists: Therapist[] = [
      createTherapist('female-1', 'female'),
      createTherapist('male-1', 'male')
    ]

    const inputs: SearchInputs = createBaseInputs({
      therapistGenderPref: 'female',
      strictGender: true
    })

    const results = matchTherapists(therapists, inputs)

    // Should return exactly one result (the female therapist)
    expect(results).toHaveLength(1)
    expect(results[0].therapist.gender).toBe('female')
    expect(results[0].therapist.id).toBe('female-1')

    // Should NOT include male therapists
    const maleResults = results.filter(r => r.therapist.gender === 'male')
    expect(maleResults).toHaveLength(0)
  })

  test('strict male preference: only returns male therapists', () => {
    const therapists: Therapist[] = [
      createTherapist('male-1', 'male'),
      createTherapist('female-1', 'female')
    ]

    const inputs: SearchInputs = createBaseInputs({
      therapistGenderPref: 'male',
      strictGender: true
    })

    const results = matchTherapists(therapists, inputs)

    // Should return exactly one result (the male therapist)
    expect(results).toHaveLength(1)
    expect(results[0].therapist.gender).toBe('male')
    expect(results[0].therapist.id).toBe('male-1')

    // Should NOT include female therapists
    const femaleResults = results.filter(r => r.therapist.gender === 'female')
    expect(femaleResults).toHaveLength(0)
  })

  test('non-strict preference: both genders appear, preferred gender scores higher', () => {
    const therapists: Therapist[] = [
      createTherapist('female-1', 'female'),
      createTherapist('male-1', 'male')
    ]

    const inputs: SearchInputs = createBaseInputs({
      therapistGenderPref: 'female',
      strictGender: false // Non-strict: allow other genders
    })

    const results = matchTherapists(therapists, inputs)

    // Should return both therapists
    expect(results.length).toBeGreaterThanOrEqual(2)

    // Both genders should be present
    const femaleResults = results.filter(r => r.therapist.gender === 'female')
    const maleResults = results.filter(r => r.therapist.gender === 'male')
    expect(femaleResults.length).toBeGreaterThan(0)
    expect(maleResults.length).toBeGreaterThan(0)

    // Female therapist should have higher score than male therapist
    const femaleScore = femaleResults[0].match_score
    const maleScore = maleResults[0].match_score
    expect(femaleScore).toBeGreaterThan(maleScore)
  })

  test('strict gender with "any" preference: returns all genders', () => {
    const therapists: Therapist[] = [
      createTherapist('female-1', 'female'),
      createTherapist('male-1', 'male')
    ]

    const inputs: SearchInputs = createBaseInputs({
      therapistGenderPref: 'any',
      strictGender: true // Even with strictGender=true, "any" means no filtering
    })

    const results = matchTherapists(therapists, inputs)

    // Should return both therapists
    expect(results.length).toBeGreaterThanOrEqual(2)

    // Both genders should be present
    const femaleResults = results.filter(r => r.therapist.gender === 'female')
    const maleResults = results.filter(r => r.therapist.gender === 'male')
    expect(femaleResults.length).toBeGreaterThan(0)
    expect(maleResults.length).toBeGreaterThan(0)
  })
})

describe('Hard Filters', () => {
  test('meetingType hard filter: excludes therapists without matching meeting type', () => {
    const therapists: Therapist[] = [
      createTherapist('ordinace-only', 'female', ['ordinace']),
      createTherapist('online-only', 'female', ['online']),
      createTherapist('both-types', 'female', ['ordinace', 'online'])
    ]

    const inputs: SearchInputs = createBaseInputs({
      meetingType: 'ordinace',
      therapistGenderPref: 'any',
      strictGender: false
    })

    const results = matchTherapists(therapists, inputs)

    // Should return therapists that support 'ordinace'
    expect(results.length).toBeGreaterThan(0)
    
    // All results must support 'ordinace'
    results.forEach(result => {
      expect(result.therapist.meetingTypes).toContain('ordinace')
    })

    // Should include ordinace-only and both-types
    const ordinaceOnly = results.find(r => r.therapist.id === 'ordinace-only')
    const bothTypes = results.find(r => r.therapist.id === 'both-types')
    expect(ordinaceOnly).toBeDefined()
    expect(bothTypes).toBeDefined()

    // Should NOT include online-only (unless it also supports ordinace, which it doesn't)
    const onlineOnly = results.find(r => r.therapist.id === 'online-only')
    expect(onlineOnly).toBeUndefined()
  })

  test('barrierFree hard filter: excludes non-barrier-free therapists when required', () => {
    const therapists: Therapist[] = [
      createTherapist('barrier-free-1', 'female', ['ordinace'], true),
      createTherapist('not-barrier-free-1', 'female', ['ordinace'], false),
      createTherapist('barrier-free-2', 'male', ['ordinace'], true)
    ]

    const inputs: SearchInputs = createBaseInputs({
      meetingType: 'ordinace',
      barrierFree: true, // Require barrier-free
      therapistGenderPref: 'any',
      strictGender: false
    })

    const results = matchTherapists(therapists, inputs)

    // Should return only barrier-free therapists
    expect(results.length).toBeGreaterThan(0)
    
    // All results must be barrier-free
    results.forEach(result => {
      expect(result.therapist.barrier_free).toBe(true)
    })

    // Should include barrier-free therapists
    const barrierFree1 = results.find(r => r.therapist.id === 'barrier-free-1')
    const barrierFree2 = results.find(r => r.therapist.id === 'barrier-free-2')
    expect(barrierFree1).toBeDefined()
    expect(barrierFree2).toBeDefined()

    // Should NOT include non-barrier-free therapist
    const notBarrierFree = results.find(r => r.therapist.id === 'not-barrier-free-1')
    expect(notBarrierFree).toBeUndefined()
  })

  test('barrierFree filter does not apply to online meetings', () => {
    const therapists: Therapist[] = [
      createTherapist('online-not-barrier-free', 'female', ['online'], false),
      createTherapist('online-barrier-free', 'female', ['online'], true)
    ]

    const inputs: SearchInputs = createBaseInputs({
      meetingType: 'online',
      barrierFree: true, // Even if required, online doesn't need barrier-free
      therapistGenderPref: 'any',
      strictGender: false
    })

    const results = matchTherapists(therapists, inputs)

    // Should return both therapists (barrier-free not required for online)
    expect(results.length).toBeGreaterThanOrEqual(2)

    // Both should be included regardless of barrier_free status
    const notBarrierFree = results.find(r => r.therapist.id === 'online-not-barrier-free')
    const barrierFree = results.find(r => r.therapist.id === 'online-barrier-free')
    expect(notBarrierFree).toBeDefined()
    expect(barrierFree).toBeDefined()
  })

  test('combined strict gender and meetingType filters work together', () => {
    const therapists: Therapist[] = [
      createTherapist('female-online', 'female', ['online']),
      createTherapist('female-ordinace', 'female', ['ordinace']),
      createTherapist('male-online', 'male', ['online']),
      createTherapist('male-ordinace', 'male', ['ordinace'])
    ]

    const inputs: SearchInputs = createBaseInputs({
      meetingType: 'ordinace',
      therapistGenderPref: 'female',
      strictGender: true // Strict female preference
    })

    const results = matchTherapists(therapists, inputs)

    // Should return only female therapists with ordinace
    expect(results.length).toBe(1)
    expect(results[0].therapist.gender).toBe('female')
    expect(results[0].therapist.meetingTypes).toContain('ordinace')
    expect(results[0].therapist.id).toBe('female-ordinace')

    // Should NOT include male therapists or online-only therapists
    const maleResults = results.filter(r => r.therapist.gender === 'male')
    const onlineOnly = results.filter(r => !r.therapist.meetingTypes.includes('ordinace'))
    expect(maleResults).toHaveLength(0)
    expect(onlineOnly).toHaveLength(0)
  })
})

