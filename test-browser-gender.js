// Test script to verify gender in browser
const testBrowserGender = async () => {
  console.log('🧪 Testing gender in browser...\n')
  
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
    
    if (html.includes('gender: gender.key as')) {
      console.log('✅ Gender selection logic found in questionnaire')
    } else {
      console.log('❌ Gender selection logic NOT found in questionnaire')
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
    
    if (html.includes('setAnswers(prev => ({')) {
      console.log('✅ setAnswers function found in questionnaire')
    } else {
      console.log('❌ setAnswers function NOT found in questionnaire')
    }
    
    if (html.includes('gender: gender.key as')) {
      console.log('✅ Gender key assignment found in questionnaire')
    } else {
      console.log('❌ Gender key assignment NOT found in questionnaire')
    }
    
    if (html.includes('strictGender: gender.key !== \'any\'')) {
      console.log('✅ strictGender logic found in questionnaire')
    } else {
      console.log('❌ strictGender logic NOT found in questionnaire')
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
    
    if (html.includes('buildSearchRequest(answers)')) {
      console.log('✅ buildSearchRequest function found in questionnaire')
    } else {
      console.log('❌ buildSearchRequest function NOT found in questionnaire')
    }
    
    if (html.includes('gender: answers.gender || \'any\'')) {
      console.log('✅ Gender fallback logic found in questionnaire')
    } else {
      console.log('❌ Gender fallback logic NOT found in questionnaire')
    }
    
    if (html.includes('strictGender: Boolean(answers.strictGender)')) {
      console.log('✅ strictGender logic found in questionnaire')
    } else {
      console.log('❌ strictGender logic NOT found in questionnaire')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
  }
  
  console.log('🎉 Browser gender test completed!')
  console.log('\n🔍 If all tests pass but gender filtering still doesn\'t work:')
  console.log('  1. Check browser console for JavaScript errors')
  console.log('  2. Check if gender is properly selected in UI')
  console.log('  3. Check if gender is properly saved to localStorage')
  console.log('  4. Check if gender is properly passed to API')
  console.log('  5. Check network tab for API requests')
}

// Run the test
testBrowserGender().catch(console.error)
