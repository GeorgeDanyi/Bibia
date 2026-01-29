#!/usr/bin/env npx tsx

// Test script for matching engine scoring correctness per PART H specifications

import { matchTherapists, applyFallbackLogic } from '../lib/matching/engine'
import { normalizeSearchInputs } from '../lib/matching/normalization'
import { Therapist, SearchInputs } from '../lib/matching/types'

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

function runTest(testName: string, testFn: () => void) {
  try {
    console.log(`🧪 Running test: ${testName}`)
    testFn()
    console.log(`✅ PASS: ${testName}`)
  } catch (error) {
    console.log(`❌ FAIL: ${testName}`)
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
  }
}

function assertGreaterThan(actual: number, expected: number, message: string) {
  if (actual <= expected) {
    throw new Error(`${message}: expected > ${expected}, got ${actual}`)
  }
}

function assertLessThan(actual: number, expected: number, message: string) {
  if (actual >= expected) {
    throw new Error(`${message}: expected < ${expected}, got ${actual}`)
  }
}

function assertContains<T>(array: T[], item: T, message: string) {
  if (!array.includes(item)) {
    throw new Error(`${message}: array does not contain ${item}`)
  }
}

function assertNotContains<T>(array: T[], item: T, message: string) {
  if (array.includes(item)) {
    throw new Error(`${message}: array should not contain ${item}`)
  }
}

async function main() {
  console.log('🚀 Starting Matching Engine Tests\n')

  // Test 1: Exact diagnosis match should outrank generalists
  runTest('exact diagnosis match should outrank generalists', () => {
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
    assertEqual(results.length, 3, 'Should have 3 results')
    
    // Exact match should be first
    assertEqual(results[0].therapist.id, 'therapist-exact-match', 'Exact match should be first')
    assertGreaterThan(results[0].match_score, 80, 'Exact match should have high score')
    
    // Distance test therapist should be second (same diagnosis but further)
    assertEqual(results[1].therapist.id, 'therapist-distance-test', 'Distance test should be second')
    
    // Partial match should be last
    assertEqual(results[2].therapist.id, 'therapist-partial-match', 'Partial match should be last')
  })

  // Test 2: Hard filters should exclude non-matching therapists
  runTest('hard filters should exclude non-matching therapists', () => {
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
    assert(notAcceptingTherapist === undefined, 'Should exclude therapist not accepting new clients')
  })

  // Test 3: Barrier-free filter should work correctly
  runTest('barrier-free filter should work correctly', () => {
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
      assert(result.therapist.barrier_free, 'All results should be barrier-free')
    })
    
    // Should include exact match (barrier-free) but exclude distance test (not barrier-free)
    assertContains(results.map(r => r.therapist.id), 'therapist-exact-match', 'Should include exact match')
    assertNotContains(results.map(r => r.therapist.id), 'therapist-distance-test', 'Should exclude distance test')
  })

  // Test 4: Age group filter should work correctly
  runTest('age group filter should work correctly', () => {
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
      assertContains(result.therapist.ageGroups, 'child', 'All results should support children')
    })
    
    // Should include partial match (supports children) but exclude exact match (adult/senior only)
    assertContains(results.map(r => r.therapist.id), 'therapist-partial-match', 'Should include partial match')
    assertNotContains(results.map(r => r.therapist.id), 'therapist-exact-match', 'Should exclude exact match')
  })

  // Test 5: Online meeting type should ignore distance
  runTest('online meeting type should ignore distance', () => {
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
    assert(onlineTherapist !== undefined, 'Should include online therapist')
    assertContains(onlineTherapist!.therapist.meetingTypes, 'online', 'Should support online meetings')
  })

  // Test 6: Fallback logic should provide at least 3 results
  runTest('fallback logic should provide at least 3 results', () => {
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
    assert(fallbackUsed, 'Should use fallback')
    assertGreaterThan(matches.length, 2, 'Should provide at least 3 results')
  })

  // Test 7: Scoring should respect tie-breakers
  runTest('scoring should respect tie-breakers', () => {
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
    assertEqual(results[0].therapist.id, 'therapist-exact-match', 'Exact match should be first')
    assertEqual(results[1].therapist.id, 'therapist-distance-test', 'Distance test should be second')
    
    // Exact match should have higher tie-breaker score
    assert(results[0].therapist.isVerified, 'Exact match should be verified')
    assertGreaterThan(results[0].therapist.reviewCount, results[1].therapist.reviewCount, 'Exact match should have more reviews')
  })

  // Test 8: Normalization should handle diacritics correctly
  runTest('normalization should handle diacritics correctly', () => {
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
    
    assertEqual(normalized.location.city, 'praha', 'Should normalize city name')
    assertContains(normalized.issues, 'bolest zad', 'Should preserve normalized issues')
    assertContains(normalized.issues, 'krcni pater', 'Should normalize diacritics')
  })

  // Test 9: Performance test
  runTest('should complete search under 200ms', () => {
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
    assertLessThan(searchTime, 200, 'Should be under 200ms')
    assertGreaterThan(results.length, 0, 'Should return results')
  })

  console.log('\n🎉 All tests passed!')
  console.log('✅ Matching engine scoring correctness verified per PART H specifications')
}

main().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
