// Debug script to test gender flow from questionnaire to results
const debugGenderFlow = async () => {
  console.log('🔍 Debugging gender flow from questionnaire to results...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  // Test 1: Simulate questionnaire-v1 payload with male gender
  console.log('Test 1: Questionnaire-v1 payload with male gender')
  try {
    const questionnairePayload = {
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
    
    console.log('📤 Sending payload:', JSON.stringify(questionnairePayload, null, 2))
    
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
      let otherCount = 0
      
      data.results.forEach((result, index) => {
        const therapistGender = result.therapist?.gender
        console.log(`  ${index + 1}. ${result.name} - Gender: ${therapistGender}`)
        
        if (therapistGender === 'male') maleCount++
        else if (therapistGender === 'female') femaleCount++
        else otherCount++
      })
      
      console.log(`📊 Gender distribution: Male: ${maleCount}, Female: ${femaleCount}, Other: ${otherCount}`)
      
      if (femaleCount > 0) {
        console.log('❌ PROBLEM: Found female therapists when male was requested!')
      } else {
        console.log('✅ Gender filtering working correctly')
      }
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }
  
  // Test 2: Test with female gender
  console.log('Test 2: Questionnaire-v1 payload with female gender')
  try {
    const questionnairePayload = {
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
      } else {
        console.log('✅ Gender filtering working correctly')
      }
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
  }
  
  console.log('🎉 Gender flow debugging completed!')
}

// Run the debug
debugGenderFlow().catch(console.error)
