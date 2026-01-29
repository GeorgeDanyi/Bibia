// Test script to verify complete questionnaire flow
const testQuestionnaireFlow = async () => {
  console.log('🧪 Testing complete questionnaire flow...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  // Test 1: Check if questionnaire page loads
  console.log('Test 1: Check questionnaire page loads')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    if (response.ok) {
      console.log('✅ Questionnaire page loads successfully')
    } else {
      console.log('❌ Questionnaire page failed to load')
    }
    console.log('')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }
  
  // Test 2: Simulate complete questionnaire flow with male gender
  console.log('Test 2: Simulate complete questionnaire flow with male gender')
  try {
    // Simulate the exact payload that questionnaire-v1 sends
    const questionnairePayload = {
      step1: { city: 'Praha', practiceType: 'office' },
      step2: { categories: ['back'], refinements: {} },
      step3: { hasDiagnosis: false, diagnosis: [], customDiagnosis: undefined, priority: 'none' },
      city: 'Praha',
      meetingType: 'clinic',
      radiusKm: 20,
      languageCodes: ['cs'],
      insuranceAccepted: true,
      availability: 'asap',
      problemAreaIds: ['back'],
      problemAreaLabels: ['Bolesti zad'],
      diagnosisIds: [],
      gender: 'male',
      strictGender: true,
      testMode: false
    }
    
    console.log('📤 Sending questionnaire payload with male gender...')
    
    const response = await fetch(`${baseUrl}/api/searchTherapists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionnairePayload)
    })
    
    const data = await response.json()
    console.log(`✅ Response status: ${response.status}`)
    console.log(`📊 Results count: ${data.results?.length || 0}`)
    
    if (data.results && data.results.length > 0) {
      console.log('🔍 Checking gender filtering:')
      let maleCount = 0
      let femaleCount = 0
      
      data.results.forEach((result, index) => {
        const therapistGender = result.therapist?.gender
        console.log(`  ${index + 1}. ${result.name} - Gender: ${therapistGender}`)
        
        if (therapistGender === 'male') maleCount++
        else if (therapistGender === 'female') femaleCount++
      })
      
      console.log(`📊 Gender distribution: Male: ${maleCount}, Female: ${femaleCount}`)
      
      if (femaleCount > 0) {
        console.log('❌ PROBLEM: Found female therapists when male was requested!')
        console.log('🔍 This suggests gender filtering is not working in questionnaire flow')
      } else {
        console.log('✅ Gender filtering working correctly in questionnaire flow')
      }
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
  }
  
  // Test 3: Test with female gender
  console.log('Test 3: Simulate complete questionnaire flow with female gender')
  try {
    const questionnairePayload = {
      step1: { city: 'Praha', practiceType: 'office' },
      step2: { categories: ['back'], refinements: {} },
      step3: { hasDiagnosis: false, diagnosis: [], customDiagnosis: undefined, priority: 'none' },
      city: 'Praha',
      meetingType: 'clinic',
      radiusKm: 20,
      languageCodes: ['cs'],
      insuranceAccepted: true,
      availability: 'asap',
      problemAreaIds: ['back'],
      problemAreaLabels: ['Bolesti zad'],
      diagnosisIds: [],
      gender: 'female',
      strictGender: true,
      testMode: false
    }
    
    console.log('📤 Sending questionnaire payload with female gender...')
    
    const response = await fetch(`${baseUrl}/api/searchTherapists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionnairePayload)
    })
    
    const data = await response.json()
    console.log(`✅ Response status: ${response.status}`)
    console.log(`📊 Results count: ${data.results?.length || 0}`)
    
    if (data.results && data.results.length > 0) {
      console.log('🔍 Checking gender filtering:')
      let maleCount = 0
      let femaleCount = 0
      
      data.results.forEach((result, index) => {
        const therapistGender = result.therapist?.gender
        console.log(`  ${index + 1}. ${result.name} - Gender: ${therapistGender}`)
        
        if (therapistGender === 'male') maleCount++
        else if (therapistGender === 'female') femaleCount++
      })
      
      console.log(`📊 Gender distribution: Male: ${maleCount}, Female: ${femaleCount}`)
      
      if (maleCount > 0) {
        console.log('❌ PROBLEM: Found male therapists when female was requested!')
        console.log('🔍 This suggests gender filtering is not working in questionnaire flow')
      } else {
        console.log('✅ Gender filtering working correctly in questionnaire flow')
      }
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
  }
  
  console.log('🎉 Questionnaire flow test completed!')
  console.log('\n🔍 If gender filtering is working correctly in tests but not in browser:')
  console.log('  1. Check if gender is properly selected in UI')
  console.log('  2. Check if gender is properly saved to localStorage')
  console.log('  3. Check if gender is properly passed to API')
  console.log('  4. Check browser console for errors')
}

// Run the test
testQuestionnaireFlow().catch(console.error)
