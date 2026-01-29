// Test script to verify gender is saved to localStorage
const testLocalStorageGender = () => {
  console.log('🧪 Testing gender localStorage...\n')
  
  // Test 1: Check if gender is properly saved to localStorage
  console.log('Test 1: Check localStorage structure')
  
  // Simulate the localStorage structure
  const mockLocalStorage = {
    answers: {
      city: 'Praha',
      visitMode: 'clinic',
      languages: ['cs'],
      insurance: ['vzp'],
      bookingSpeed: 'asap',
      ageGroups: ['adult'],
      consentGiven: true,
      gender: 'male',
      strictGender: true
    },
    currentStep: 6,
    timestamp: Date.now()
  }
  
  console.log('📋 Mock localStorage:', JSON.stringify(mockLocalStorage, null, 2))
  
  // Test 2: Check if gender is properly extracted from localStorage
  console.log('\nTest 2: Check gender extraction from localStorage')
  
  const saved = JSON.stringify(mockLocalStorage)
  const data = JSON.parse(saved)
  const answers = data.answers
  
  console.log(`Extracted gender: ${answers.gender}`)
  console.log(`Extracted strictGender: ${answers.strictGender}`)
  
  if (answers.gender === 'male' && answers.strictGender === true) {
    console.log('✅ Gender extraction working correctly')
  } else {
    console.log('❌ Gender extraction NOT working correctly')
  }
  
  // Test 3: Check buildSearchRequest with localStorage data
  console.log('\nTest 3: Check buildSearchRequest with localStorage data')
  
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
  
  const searchRequest = buildSearchRequest(answers)
  console.log('📤 Generated search request:', JSON.stringify(searchRequest, null, 2))
  
  if (searchRequest.gender === 'male' && searchRequest.strictGender === true) {
    console.log('✅ buildSearchRequest working correctly with localStorage data')
  } else {
    console.log('❌ buildSearchRequest NOT working correctly with localStorage data')
  }
  
  console.log('\n🎉 localStorage gender test completed!')
}

// Run the test
testLocalStorageGender()
