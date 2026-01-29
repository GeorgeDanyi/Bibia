// Test script to check gender in questionnaire file
const testGenderFile = () => {
  console.log('🔍 Checking gender in questionnaire file...\n')
  
  const fs = require('fs')
  const path = require('path')
  
  // Test 1: Check if questionnaire file exists
  console.log('Test 1: Check if questionnaire file exists')
  try {
    const filePath = path.join(__dirname, 'app/questionnaire-v1/QuestionnaireV1Client.tsx')
    if (fs.existsSync(filePath)) {
      console.log('✅ Questionnaire file exists')
    } else {
      console.log('❌ Questionnaire file does NOT exist')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }
  
  // Test 2: Check gender content in questionnaire file
  console.log('Test 2: Check gender content in questionnaire file')
  try {
    const filePath = path.join(__dirname, 'app/questionnaire-v1/QuestionnaireV1Client.tsx')
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Search for gender-related content
    const genderMatches = content.match(/gender/gi)
    if (genderMatches) {
      console.log(`✅ Found ${genderMatches.length} gender matches in questionnaire file`)
    } else {
      console.log('❌ No gender matches found in questionnaire file')
    }
    
    // Search for specific gender terms
    const maleMatches = content.match(/male/gi)
    if (maleMatches) {
      console.log(`✅ Found ${maleMatches.length} male matches in questionnaire file`)
    } else {
      console.log('❌ No male matches found in questionnaire file')
    }
    
    const femaleMatches = content.match(/female/gi)
    if (femaleMatches) {
      console.log(`✅ Found ${femaleMatches.length} female matches in questionnaire file`)
    } else {
      console.log('❌ No female matches found in questionnaire file')
    }
    
    const anyMatches = content.match(/any/gi)
    if (anyMatches) {
      console.log(`✅ Found ${anyMatches.length} any matches in questionnaire file`)
    } else {
      console.log('❌ No any matches found in questionnaire file')
    }
    
    // Search for gender question
    const questionMatches = content.match(/Preferuješ fyzioterapeuta určitého pohlaví/gi)
    if (questionMatches) {
      console.log(`✅ Found ${questionMatches.length} gender question matches in questionnaire file`)
    } else {
      console.log('❌ No gender question matches found in questionnaire file')
    }
    
    // Search for gender options
    const optionMatches = content.match(/Muž|Žena|Nezáleží mi na tom/gi)
    if (optionMatches) {
      console.log(`✅ Found ${optionMatches.length} gender option matches in questionnaire file`)
    } else {
      console.log('❌ No gender option matches found in questionnaire file')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
  }
  
  // Test 3: Check gender logic in questionnaire file
  console.log('Test 3: Check gender logic in questionnaire file')
  try {
    const filePath = path.join(__dirname, 'app/questionnaire-v1/QuestionnaireV1Client.tsx')
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Search for gender selection logic
    const selectionMatches = content.match(/gender: gender\.key as/gi)
    if (selectionMatches) {
      console.log(`✅ Found ${selectionMatches.length} gender selection logic matches in questionnaire file`)
    } else {
      console.log('❌ No gender selection logic matches found in questionnaire file')
    }
    
    // Search for strictGender logic
    const strictMatches = content.match(/strictGender/gi)
    if (strictMatches) {
      console.log(`✅ Found ${strictMatches.length} strictGender matches in questionnaire file`)
    } else {
      console.log('❌ No strictGender matches found in questionnaire file')
    }
    
    // Search for setAnswers function
    const setAnswersMatches = content.match(/setAnswers/gi)
    if (setAnswersMatches) {
      console.log(`✅ Found ${setAnswersMatches.length} setAnswers matches in questionnaire file`)
    } else {
      console.log('❌ No setAnswers matches found in questionnaire file')
    }
    
    // Search for buildSearchRequest function
    const buildMatches = content.match(/buildSearchRequest/gi)
    if (buildMatches) {
      console.log(`✅ Found ${buildMatches.length} buildSearchRequest matches in questionnaire file`)
    } else {
      console.log('❌ No buildSearchRequest matches found in questionnaire file')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
  }
  
  // Test 4: Check gender in API payload
  console.log('Test 4: Check gender in API payload')
  try {
    const filePath = path.join(__dirname, 'app/questionnaire-v1/QuestionnaireV1Client.tsx')
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Search for gender in payload
    const payloadMatches = content.match(/gender: answers\.gender/gi)
    if (payloadMatches) {
      console.log(`✅ Found ${payloadMatches.length} gender in payload matches in questionnaire file`)
    } else {
      console.log('❌ No gender in payload matches found in questionnaire file')
    }
    
    // Search for strictGender in payload
    const strictPayloadMatches = content.match(/strictGender: Boolean/gi)
    if (strictPayloadMatches) {
      console.log(`✅ Found ${strictPayloadMatches.length} strictGender in payload matches in questionnaire file`)
    } else {
      console.log('❌ No strictGender in payload matches found in questionnaire file')
    }
    
    // Search for searchRequest spread
    const spreadMatches = content.match(/\.\.\.searchRequest/gi)
    if (spreadMatches) {
      console.log(`✅ Found ${spreadMatches.length} searchRequest spread matches in questionnaire file`)
    } else {
      console.log('❌ No searchRequest spread matches found in questionnaire file')
    }
    
    console.log('')
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message)
  }
  
  console.log('🎉 Gender file test completed!')
  console.log('\n🔍 If gender filtering still doesn\'t work:')
  console.log('  1. Check browser console for JavaScript errors')
  console.log('  2. Check if gender is properly selected in UI')
  console.log('  3. Check if gender is properly saved to localStorage')
  console.log('  4. Check if gender is properly passed to API')
  console.log('  5. Check network tab for API requests')
  console.log('  6. Check if gender is properly handled in questionnaire-v1')
}

// Run the test
testGenderFile()
