// Test script to search for gender in questionnaire
const testGenderSearch = async () => {
  console.log('🔍 Searching for gender in questionnaire...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  // Test 1: Search for gender in questionnaire
  console.log('Test 1: Search for gender in questionnaire')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    const html = await response.text()
    
    // Search for gender-related content
    const genderMatches = html.match(/gender/gi)
    if (genderMatches) {
      console.log(`✅ Found ${genderMatches.length} gender matches in questionnaire`)
    } else {
      console.log('❌ No gender matches found in questionnaire')
    }
    
    // Search for specific gender terms
    const maleMatches = html.match(/male/gi)
    if (maleMatches) {
      console.log(`✅ Found ${maleMatches.length} male matches in questionnaire`)
    } else {
      console.log('❌ No male matches found in questionnaire')
    }
    
    const femaleMatches = html.match(/female/gi)
    if (femaleMatches) {
      console.log(`✅ Found ${femaleMatches.length} female matches in questionnaire`)
    } else {
      console.log('❌ No female matches found in questionnaire')
    }
    
    const anyMatches = html.match(/any/gi)
    if (anyMatches) {
      console.log(`✅ Found ${anyMatches.length} any matches in questionnaire`)
    } else {
      console.log('❌ No any matches found in questionnaire')
    }
    
    // Search for gender question
    const questionMatches = html.match(/Preferuješ fyzioterapeuta určitého pohlaví/gi)
    if (questionMatches) {
      console.log(`✅ Found ${questionMatches.length} gender question matches in questionnaire`)
    } else {
      console.log('❌ No gender question matches found in questionnaire')
    }
    
    // Search for gender options
    const optionMatches = html.match(/Muž|Žena|Nezáleží mi na tom/gi)
    if (optionMatches) {
      console.log(`✅ Found ${optionMatches.length} gender option matches in questionnaire`)
    } else {
      console.log('❌ No gender option matches found in questionnaire')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }
  
  // Test 2: Search for gender logic in questionnaire
  console.log('Test 2: Search for gender logic in questionnaire')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    const html = await response.text()
    
    // Search for gender selection logic
    const selectionMatches = html.match(/gender: gender\.key as/gi)
    if (selectionMatches) {
      console.log(`✅ Found ${selectionMatches.length} gender selection logic matches in questionnaire`)
    } else {
      console.log('❌ No gender selection logic matches found in questionnaire')
    }
    
    // Search for strictGender logic
    const strictMatches = html.match(/strictGender/gi)
    if (strictMatches) {
      console.log(`✅ Found ${strictMatches.length} strictGender matches in questionnaire`)
    } else {
      console.log('❌ No strictGender matches found in questionnaire')
    }
    
    // Search for setAnswers function
    const setAnswersMatches = html.match(/setAnswers/gi)
    if (setAnswersMatches) {
      console.log(`✅ Found ${setAnswersMatches.length} setAnswers matches in questionnaire`)
    } else {
      console.log('❌ No setAnswers matches found in questionnaire')
    }
    
    // Search for buildSearchRequest function
    const buildMatches = html.match(/buildSearchRequest/gi)
    if (buildMatches) {
      console.log(`✅ Found ${buildMatches.length} buildSearchRequest matches in questionnaire`)
    } else {
      console.log('❌ No buildSearchRequest matches found in questionnaire')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
  }
  
  // Test 3: Search for gender in API payload
  console.log('Test 3: Search for gender in API payload')
  try {
    const response = await fetch(`${baseUrl}/questionnaire-v1`)
    const html = await response.text()
    
    // Search for gender in payload
    const payloadMatches = html.match(/gender: answers\.gender/gi)
    if (payloadMatches) {
      console.log(`✅ Found ${payloadMatches.length} gender in payload matches in questionnaire`)
    } else {
      console.log('❌ No gender in payload matches found in questionnaire')
    }
    
    // Search for strictGender in payload
    const strictPayloadMatches = html.match(/strictGender: Boolean/gi)
    if (strictPayloadMatches) {
      console.log(`✅ Found ${strictPayloadMatches.length} strictGender in payload matches in questionnaire`)
    } else {
      console.log('❌ No strictGender in payload matches found in questionnaire')
    }
    
    // Search for searchRequest spread
    const spreadMatches = html.match(/\.\.\.searchRequest/gi)
    if (spreadMatches) {
      console.log(`✅ Found ${spreadMatches.length} searchRequest spread matches in questionnaire`)
    } else {
      console.log('❌ No searchRequest spread matches found in questionnaire')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
  }
  
  console.log('🎉 Gender search test completed!')
  console.log('\n🔍 If gender filtering still doesn\'t work:')
  console.log('  1. Check browser console for JavaScript errors')
  console.log('  2. Check if gender is properly selected in UI')
  console.log('  3. Check if gender is properly saved to localStorage')
  console.log('  4. Check if gender is properly passed to API')
  console.log('  5. Check network tab for API requests')
  console.log('  6. Check if gender is properly handled in questionnaire-v1')
}

// Run the test
testGenderSearch().catch(console.error)
