// Final test script to fix gender issue
const testGenderFinalFix = async () => {
  console.log('🔍 Final gender fix test...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  // Test 1: Check if questionnaire page loads and has gender options
  console.log('Test 1: Check questionnaire page structure')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    const html = await response.text()
    
    // Check for gender question
    if (html.includes('Preferuješ fyzioterapeuta určitého pohlaví?')) {
      console.log('✅ Gender question found in questionnaire')
    } else {
      console.log('❌ Gender question NOT found in questionnaire')
    }
    
    // Check for gender options
    if (html.includes('Muž') && html.includes('Žena') && html.includes('Nezáleží mi na tom')) {
      console.log('✅ Gender options found in questionnaire')
    } else {
      console.log('❌ Gender options NOT found in questionnaire')
    }
    
    // Check for gender selection logic
    if (html.includes('gender: gender.key as')) {
      console.log('✅ Gender selection logic found in questionnaire')
    } else {
      console.log('❌ Gender selection logic NOT found in questionnaire')
    }
    
    // Check for setAnswers function
    if (html.includes('setAnswers(prev => ({')) {
      console.log('✅ setAnswers function found in questionnaire')
    } else {
      console.log('❌ setAnswers function NOT found in questionnaire')
    }
    
    // Check for buildSearchRequest function
    if (html.includes('buildSearchRequest(answers)')) {
      console.log('✅ buildSearchRequest function found in questionnaire')
    } else {
      console.log('❌ buildSearchRequest function NOT found in questionnaire')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }
  
  // Test 2: Check if gender is properly handled in questionnaire
  console.log('Test 2: Check gender handling in questionnaire')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    const html = await response.text()
    
    // Check for gender selection logic
    if (html.includes('gender: gender.key as')) {
      console.log('✅ Gender selection logic found in questionnaire')
    } else {
      console.log('❌ Gender selection logic NOT found in questionnaire')
    }
    
    // Check for strictGender logic
    if (html.includes('strictGender: gender.key !== \'any\'')) {
      console.log('✅ strictGender logic found in questionnaire')
    } else {
      console.log('❌ strictGender logic NOT found in questionnaire')
    }
    
    // Check for gender fallback logic
    if (html.includes('gender: answers.gender || \'any\'')) {
      console.log('✅ Gender fallback logic found in questionnaire')
    } else {
      console.log('❌ Gender fallback logic NOT found in questionnaire')
    }
    
    // Check for strictGender logic in buildSearchRequest
    if (html.includes('strictGender: Boolean(answers.strictGender)')) {
      console.log('✅ strictGender logic found in buildSearchRequest')
    } else {
      console.log('❌ strictGender logic NOT found in buildSearchRequest')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
  }
  
  // Test 3: Check if gender is properly passed to API
  console.log('Test 3: Check gender API integration')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    const html = await response.text()
    
    // Check for gender in payload
    if (html.includes('gender: answers.gender || \'any\'')) {
      console.log('✅ Gender in payload found in questionnaire')
    } else {
      console.log('❌ Gender in payload NOT found in questionnaire')
    }
    
    // Check for strictGender in payload
    if (html.includes('strictGender: Boolean(answers.strictGender)')) {
      console.log('✅ strictGender in payload found in questionnaire')
    } else {
      console.log('❌ strictGender in payload NOT found in questionnaire')
    }
    
    // Check for searchRequest spread
    if (html.includes('...searchRequest')) {
      console.log('✅ searchRequest spread found in questionnaire')
    } else {
      console.log('❌ searchRequest spread NOT found in questionnaire')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
  }
  
  console.log('🎉 Final gender fix test completed!')
  console.log('\n🔍 If gender filtering still doesn\'t work:')
  console.log('  1. Check browser console for JavaScript errors')
  console.log('  2. Check if gender is properly selected in UI')
  console.log('  3. Check if gender is properly saved to localStorage')
  console.log('  4. Check if gender is properly passed to API')
  console.log('  5. Check network tab for API requests')
  console.log('  6. Check if gender is properly handled in questionnaire-v1')
  console.log('  7. Check if gender is properly handled in API')
}

// Run the test
testGenderFinalFix().catch(console.error)
