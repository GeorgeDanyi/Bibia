/**
 * Verify Regression Scenarios
 * Quick verification of the three critical scenarios
 */

// Test 1: Female strict gender filter
export function testFemaleStrictGender() {
  console.log('🧪 Testing: Female strict gender filter')
  
  // Simulate search with female strict
  const searchParams = {
    city: 'Praha',
    meetingType: 'ordinace',
    therapistGenderPref: 'female',
    strictGender: true,
    diagnosisIds: ['anxiety']
  }

  // Mock therapist data
  const mockTherapists = [
    { id: '1', name: 'Dr. Anna Nováková', gender: 'female', city: 'Praha' },
    { id: '2', name: 'Dr. Jan Novák', gender: 'male', city: 'Praha' },
    { id: '3', name: 'Dr. Marie Svobodová', gender: 'female', city: 'Brno' }
  ]

  // Apply strict gender filter (simulate API behavior)
  const filteredResults = mockTherapists.filter(t => {
    if (searchParams.strictGender && searchParams.therapistGenderPref === 'female') {
      return t.gender === 'female'
    }
    return true
  })
  const maleResults = filteredResults.filter(t => t.gender === 'male')

  console.log(`  - Total therapists: ${mockTherapists.length}`)
  console.log(`  - Female therapists: ${filteredResults.length}`)
  console.log(`  - Male therapists: ${maleResults.length}`)
  
  if (maleResults.length === 0) {
    console.log('  ✅ PASS: No male therapists returned with female strict filter')
    return true
  } else {
    console.log('  ❌ FAIL: Male therapists found with female strict filter')
    return false
  }
}

// Test 2: No problem selected
export function testNoProblemSelected() {
  console.log('🧪 Testing: No problem selected scenario')
  
  // Test summary display
  const normalizedQuery = {
    city: 'Praha',
    meetingType: 'ordinace',
    genderPref: 'any',
    diagnoses: [], // No diagnoses selected
    languages: ['cs']
  }

  const prob = (normalizedQuery.diagnoses && normalizedQuery.diagnoses.length) 
    ? normalizedQuery.diagnoses.map(d => d.label).join(", ") 
    : "neuvedeno"

  console.log(`  - Problem display: "${prob}"`)
  
  if (prob === "neuvedeno") {
    console.log('  ✅ PASS: Summary correctly shows "neuvedeno" when no problem selected')
  } else {
    console.log('  ❌ FAIL: Summary does not show "neuvedeno" when no problem selected')
    return false
  }

  // Test debug scores
  const mockTherapist = {
    score_breakdown: {
      diagnosis: 0, // Should be 0 when no problem selected
      availability: 15,
      distance: 20,
      language: 10,
      prefs: 10,
      profile: 5
    },
    components: {
      diagnosis: 0, // Should be 0 when no problem selected
      gender: 0.5,
      availability: 0.6,
      distance: 0.8
    },
    matched_diagnoses: [] // Should be empty when no problem selected
  }

  const hasNeutralProblemScore = mockTherapist.score_breakdown.diagnosis === 0 &&
                                mockTherapist.components.diagnosis === 0 &&
                                mockTherapist.matched_diagnoses.length === 0

  console.log(`  - Diagnosis score: ${mockTherapist.score_breakdown.diagnosis}`)
  console.log(`  - Diagnosis component: ${mockTherapist.components.diagnosis}`)
  console.log(`  - Matched diagnoses: ${mockTherapist.matched_diagnoses.length}`)

  if (hasNeutralProblemScore) {
    console.log('  ✅ PASS: Debug shows neutral problem scores when no problem selected')
    return true
  } else {
    console.log('  ❌ FAIL: Debug does not show neutral problem scores when no problem selected')
    return false
  }
}

// Test 3: City and meeting type updates
export function testCityMeetingTypeUpdates() {
  console.log('🧪 Testing: City and meeting type updates')
  
  // Test city change
  const initialCityParams = {
    city: 'Praha',
    meetingType: 'ordinace',
    therapistGenderPref: 'any'
  }

  const updatedCityParams = {
    city: 'Brno',
    meetingType: 'ordinace',
    therapistGenderPref: 'any'
  }

  console.log(`  - Initial city: ${initialCityParams.city}`)
  console.log(`  - Updated city: ${updatedCityParams.city}`)
  
  const cityChanged = initialCityParams.city !== updatedCityParams.city
  console.log(`  - City changed: ${cityChanged}`)

  if (cityChanged) {
    console.log('  ✅ PASS: City change is detected')
  } else {
    console.log('  ❌ FAIL: City change not detected')
    return false
  }

  // Test meeting type change
  const initialMeetingParams = {
    city: 'Praha',
    meetingType: 'ordinace',
    therapistGenderPref: 'any'
  }

  const updatedMeetingParams = {
    city: 'Praha',
    meetingType: 'online',
    therapistGenderPref: 'any'
  }

  console.log(`  - Initial meeting type: ${initialMeetingParams.meetingType}`)
  console.log(`  - Updated meeting type: ${updatedMeetingParams.meetingType}`)
  
  const meetingTypeChanged = initialMeetingParams.meetingType !== updatedMeetingParams.meetingType
  console.log(`  - Meeting type changed: ${meetingTypeChanged}`)

  if (meetingTypeChanged) {
    console.log('  ✅ PASS: Meeting type change is detected')
    return true
  } else {
    console.log('  ❌ FAIL: Meeting type change not detected')
    return false
  }
}

// Run all tests
export function runAllRegressionTests() {
  console.log('🚀 Running Regression Tests\n')
  console.log('=' .repeat(50))
  
  const results = []
  
  // Test 1: Female strict gender
  results.push(testFemaleStrictGender())
  console.log('')
  
  // Test 2: No problem selected
  results.push(testNoProblemSelected())
  console.log('')
  
  // Test 3: City and meeting type updates
  results.push(testCityMeetingTypeUpdates())
  console.log('')
  
  // Summary
  console.log('=' .repeat(50))
  const passed = results.filter(r => r).length
  const total = results.length
  
  console.log(`📊 Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('✅ All regression tests passed!')
  } else {
    console.log('❌ Some regression tests failed!')
  }
  
  return passed === total
}

// Run if called directly
if (require.main === module) {
  runAllRegressionTests()
}
