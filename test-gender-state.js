// Test script to verify gender state management
const testGenderState = () => {
  console.log('🧪 Testing gender state management...\n')
  
  // Test 1: Check if gender is properly set in answers
  console.log('Test 1: Check gender state structure')
  
  // Simulate the answers object structure
  const mockAnswers = {
    city: 'Praha',
    visitMode: 'clinic',
    languages: ['cs'],
    insurance: ['vzp'],
    bookingSpeed: 'asap',
    ageGroups: ['adult'],
    consentGiven: true,
    gender: 'male',
    strictGender: true
  }
  
  console.log('📋 Mock answers:', JSON.stringify(mockAnswers, null, 2))
  
  // Test 2: Check buildSearchRequest function
  console.log('\nTest 2: Check buildSearchRequest function')
  
  const buildSearchRequest = (answers) => {
    return {
      city: answers.city || '',
      meetingType: (answers.visitMode) || 'clinic',
      radiusKm: 20,
      languageCodes: answers.languages || ['cs'],
      insuranceAccepted: answers.insurance.length > 0,
      availability: answers.bookingSpeed === 'asap' ? 'asap' : 
                   answers.bookingSpeed === 'this-week' ? 'weekdays' : 'any',
      problemAreaIds: answers.problemAreaIds || [],
      problemAreaLabels: answers.problemAreaLabels || [],
      diagnosisIds: answers.diagnosisIds || [],
      gender: answers.gender || 'any',
      strictGender: Boolean(answers.strictGender)
    }
  }
  
  const searchRequest = buildSearchRequest(mockAnswers)
  console.log('📤 Generated search request:', JSON.stringify(searchRequest, null, 2))
  
  // Test 3: Check if gender is properly passed
  console.log('\nTest 3: Check gender propagation')
  console.log(`Input gender: ${mockAnswers.gender}`)
  console.log(`Output gender: ${searchRequest.gender}`)
  console.log(`Input strictGender: ${mockAnswers.strictGender}`)
  console.log(`Output strictGender: ${searchRequest.strictGender}`)
  
  if (searchRequest.gender === mockAnswers.gender && searchRequest.strictGender === mockAnswers.strictGender) {
    console.log('✅ Gender propagation working correctly')
  } else {
    console.log('❌ Gender propagation NOT working correctly')
  }
  
  console.log('\n🎉 Gender state test completed!')
}

// Run the test
testGenderState()
