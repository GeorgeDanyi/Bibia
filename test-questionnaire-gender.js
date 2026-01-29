// Test script to verify gender is passed correctly from questionnaire
const testQuestionnaireGender = async () => {
  console.log('🧪 Testing gender from questionnaire...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  // Test 1: Check if questionnaire page loads and has gender options
  console.log('Test 1: Check questionnaire page structure')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    const html = await response.text()
    
    if (html.includes('Preferuješ fyzioterapeuta určitého pohlaví?')) {
      console.log('✅ Gender question found in questionnaire')
    } else {
      console.log('❌ Gender question NOT found in questionnaire')
    }
    
    if (html.includes('Muž') && html.includes('Žena') && html.includes('Nezáleží mi na tom')) {
      console.log('✅ Gender options found in questionnaire')
    } else {
      console.log('❌ Gender options NOT found in questionnaire')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }
  
  // Test 2: Simulate questionnaire submission with male gender
  console.log('Test 2: Simulate questionnaire submission with male gender')
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
    
    console.log('📤 Sending questionnaire payload:', JSON.stringify(questionnairePayload, null, 2))
    
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
  
  // Test 3: Check API logs for gender debug info
  console.log('Test 3: Check if API receives gender correctly')
  console.log('🔍 Look for [GENDER DEBUG] logs in the terminal output above')
  console.log('Expected logs:')
  console.log('  - [GENDER DEBUG] Setting therapistGenderPref: male from raw.gender: male')
  console.log('  - [GENDER DEBUG] originalGenderPref: male strictGender: true')
  console.log('  - [GENDER DEBUG] Filtering by gender: male from X therapists')
  console.log('  - [GENDER DEBUG] After gender filter: Y therapists')
  
  console.log('')
  console.log('🎉 Questionnaire gender test completed!')
}

// Run the test
testQuestionnaireGender().catch(console.error)
