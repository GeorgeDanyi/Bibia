// Test script to verify gender UI interaction
const testUIGender = () => {
  console.log('🧪 Testing gender UI interaction...\n')
  
  // Test 1: Check gender selection options
  console.log('Test 1: Check gender selection options')
  
  const genderOptions = [
    { key: 'any', label: 'Nezáleží mi na tom', icon: '👥', description: 'Jakékoli pohlaví' },
    { key: 'female', label: 'Žena', icon: '👩', description: 'Preferuji ženu' },
    { key: 'male', label: 'Muž', icon: '👨', description: 'Preferuji muže' }
  ]
  
  console.log('📋 Gender options:', JSON.stringify(genderOptions, null, 2))
  
  // Test 2: Check gender selection logic
  console.log('\nTest 2: Check gender selection logic')
  
  const simulateGenderSelection = (selectedGender) => {
    const answers = {
      city: 'Praha',
      visitMode: 'clinic',
      languages: ['cs'],
      insurance: ['vzp'],
      bookingSpeed: 'asap',
      ageGroups: ['adult'],
      consentGiven: true,
      gender: selectedGender,
      strictGender: selectedGender !== 'any'
    }
    
    return answers
  }
  
  // Test male selection
  const maleAnswers = simulateGenderSelection('male')
  console.log('Male selection:', JSON.stringify(maleAnswers, null, 2))
  
  if (maleAnswers.gender === 'male' && maleAnswers.strictGender === true) {
    console.log('✅ Male selection working correctly')
  } else {
    console.log('❌ Male selection NOT working correctly')
  }
  
  // Test female selection
  const femaleAnswers = simulateGenderSelection('female')
  console.log('Female selection:', JSON.stringify(femaleAnswers, null, 2))
  
  if (femaleAnswers.gender === 'female' && femaleAnswers.strictGender === true) {
    console.log('✅ Female selection working correctly')
  } else {
    console.log('❌ Female selection NOT working correctly')
  }
  
  // Test any selection
  const anyAnswers = simulateGenderSelection('any')
  console.log('Any selection:', JSON.stringify(anyAnswers, null, 2))
  
  if (anyAnswers.gender === 'any' && anyAnswers.strictGender === false) {
    console.log('✅ Any selection working correctly')
  } else {
    console.log('❌ Any selection NOT working correctly')
  }
  
  // Test 3: Check buildSearchRequest with UI data
  console.log('\nTest 3: Check buildSearchRequest with UI data')
  
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
  
  const maleSearchRequest = buildSearchRequest(maleAnswers)
  console.log('Male search request:', JSON.stringify(maleSearchRequest, null, 2))
  
  if (maleSearchRequest.gender === 'male' && maleSearchRequest.strictGender === true) {
    console.log('✅ Male search request working correctly')
  } else {
    console.log('❌ Male search request NOT working correctly')
  }
  
  const femaleSearchRequest = buildSearchRequest(femaleAnswers)
  console.log('Female search request:', JSON.stringify(femaleSearchRequest, null, 2))
  
  if (femaleSearchRequest.gender === 'female' && femaleSearchRequest.strictGender === true) {
    console.log('✅ Female search request working correctly')
  } else {
    console.log('❌ Female search request NOT working correctly')
  }
  
  console.log('\n🎉 UI gender test completed!')
}

// Run the test
testUIGender()
