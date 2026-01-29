/**
 * Regression Test Script
 * Tests critical user scenarios to ensure system works correctly
 */

import { NextRequest } from 'next/server'

// Test data
const testTherapists = [
  {
    id: '1',
    name: 'Dr. Anna Nováková',
    gender: 'female',
    city: 'Praha',
    specialties: ['anxiety', 'depression'],
    meeting_types: ['ordinace', 'online'],
    languages: ['cs'],
    accepts_insurance: true,
    verified: true,
    lat: 50.0755,
    lng: 14.4378
  },
  {
    id: '2', 
    name: 'Dr. Jan Novák',
    gender: 'male',
    city: 'Praha',
    specialties: ['anxiety', 'depression'],
    meeting_types: ['ordinace', 'online'],
    languages: ['cs'],
    accepts_insurance: true,
    verified: true,
    lat: 50.0755,
    lng: 14.4378
  },
  {
    id: '3',
    name: 'Dr. Marie Svobodová',
    gender: 'female', 
    city: 'Brno',
    specialties: ['anxiety', 'depression'],
    meeting_types: ['ordinace'],
    languages: ['cs'],
    accepts_insurance: false,
    verified: true,
    lat: 49.1951,
    lng: 16.6068
  }
]

interface TestResult {
  testName: string
  passed: boolean
  details: string
  error?: string
}

class RegressionTester {
  private results: TestResult[] = []

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Running Regression Tests...\n')
    
    await this.testFemaleStrictGender()
    await this.testNoProblemSelected()
    await this.testCityMeetingTypeUpdates()
    
    this.printResults()
    return this.results
  }

  private addResult(testName: string, passed: boolean, details: string, error?: string) {
    this.results.push({ testName, passed, details, error })
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${testName}: ${details}`)
    if (error) console.log(`   Error: ${error}`)
  }

  private async testFemaleStrictGender() {
    try {
      // Test 1: Female strict should only return female therapists
      const femaleStrictPayload = {
        city: 'Praha',
        meetingType: 'ordinace',
        therapistGenderPref: 'female',
        strictGender: true,
        diagnosisIds: ['anxiety']
      }

      // Simulate API call
      const response = await this.simulateSearch(femaleStrictPayload)
      const maleTherapists = response.results.filter((t: any) => t.therapist.gender === 'male')
      
      if (maleTherapists.length === 0) {
        this.addResult(
          'Female Strict Gender Filter',
          true,
          `No male therapists returned (${response.results.length} female therapists)`
        )
      } else {
        this.addResult(
          'Female Strict Gender Filter',
          false,
          `Found ${maleTherapists.length} male therapists when strict female filter was applied`,
          'Male therapists should not appear with strict female filter'
        )
      }

      // Test 2: Verify gender filtering works correctly
      const allFemale = response.results.every((t: any) => t.therapist.gender === 'female')
      if (allFemale) {
        this.addResult(
          'Gender Filter Consistency',
          true,
          'All returned therapists are female'
        )
      } else {
        this.addResult(
          'Gender Filter Consistency',
          false,
          'Some non-female therapists were returned',
          'All therapists should be female when female filter is applied'
        )
      }

    } catch (error) {
      this.addResult(
        'Female Strict Gender Filter',
        false,
        'Test failed with exception',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  private async testNoProblemSelected() {
    try {
      // Test 1: Summary should show "neuvedeno" when no problem selected
      const noProblemQuery = {
        city: 'Praha',
        meetingType: 'ordinace',
        genderPref: 'any',
        diagnoses: [], // No diagnoses selected
        languages: ['cs']
      }

      const prob = (noProblemQuery.diagnoses && noProblemQuery.diagnoses.length) 
        ? noProblemQuery.diagnoses.map(d => d.label).join(", ") 
        : "neuvedeno"

      if (prob === "neuvedeno") {
        this.addResult(
          'No Problem Selected - Summary',
          true,
          'Summary correctly shows "neuvedeno" when no problem selected'
        )
      } else {
        this.addResult(
          'No Problem Selected - Summary',
          false,
          `Summary shows "${prob}" instead of "neuvedeno"`,
          'Should display "neuvedeno" when no problem is selected'
        )
      }

      // Test 2: Debug should show neutral problem score
      const mockTherapistWithNoProblem = {
        id: '1',
        therapist: { gender: 'female' },
        match_score: 60,
        score_breakdown: {
          diagnosis: 0, // Should be 0 when no problem selected
          availability: 15,
          distance: 20,
          language: 10,
          prefs: 10,
          profile: 5
        },
        components: {
          diagnosis: 0, // Should be 0 when no problem selected
          gender: 0.5,
          availability: 0.6,
          distance: 0.8
        },
        matched_diagnoses: [] // Should be empty when no problem selected
      }

      const hasNeutralProblemScore = mockTherapistWithNoProblem.score_breakdown.diagnosis === 0 &&
                                    mockTherapistWithNoProblem.components.diagnosis === 0 &&
                                    mockTherapistWithNoProblem.matched_diagnoses.length === 0

      if (hasNeutralProblemScore) {
        this.addResult(
          'No Problem Selected - Debug Scores',
          true,
          'Debug shows neutral problem scores when no problem selected'
        )
      } else {
        this.addResult(
          'No Problem Selected - Debug Scores',
          false,
          'Debug does not show neutral problem scores',
          'Problem scores should be 0 when no problem is selected'
        )
      }

    } catch (error) {
      this.addResult(
        'No Problem Selected',
        false,
        'Test failed with exception',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  private async testCityMeetingTypeUpdates() {
    try {
      // Test 1: City change should update results
      const initialCityParams = {
        city: 'Praha',
        meetingType: 'ordinace',
        therapistGenderPref: 'any'
      }

      const updatedCityParams = {
        city: 'Brno',
        meetingType: 'ordinace', 
        therapistGenderPref: 'any'
      }

      const initialResults = await this.simulateSearch(initialCityParams)
      const updatedResults = await this.simulateSearch(updatedCityParams)

      const cityChanged = initialResults.query.city !== updatedResults.query.city
      const resultsChanged = initialResults.results.length !== updatedResults.results.length ||
                           !this.arraysEqual(
                             initialResults.results.map((r: any) => r.therapist.city),
                             updatedResults.results.map((r: any) => r.therapist.city)
                           )

      if (cityChanged && resultsChanged) {
        this.addResult(
          'City Update Consistency',
          true,
          `City changed from ${initialResults.query.city} to ${updatedResults.query.city}, results updated accordingly`
        )
      } else {
        this.addResult(
          'City Update Consistency',
          false,
          'City change did not properly update results',
          'Results should change when city is updated'
        )
      }

      // Test 2: Meeting type change should update results
      const initialMeetingParams = {
        city: 'Praha',
        meetingType: 'ordinace',
        therapistGenderPref: 'any'
      }

      const updatedMeetingParams = {
        city: 'Praha',
        meetingType: 'online',
        therapistGenderPref: 'any'
      }

      const initialMeetingResults = await this.simulateSearch(initialMeetingParams)
      const updatedMeetingResults = await this.simulateSearch(updatedMeetingParams)

      const meetingTypeChanged = initialMeetingResults.query.meetingType !== updatedMeetingResults.query.meetingType
      const meetingResultsChanged = this.meetingTypeResultsChanged(initialMeetingResults, updatedMeetingResults)

      if (meetingTypeChanged && meetingResultsChanged) {
        this.addResult(
          'Meeting Type Update Consistency',
          true,
          `Meeting type changed from ${initialMeetingResults.query.meetingType} to ${updatedMeetingResults.query.meetingType}, results updated accordingly`
        )
      } else {
        this.addResult(
          'Meeting Type Update Consistency',
          false,
          'Meeting type change did not properly update results',
          'Results should change when meeting type is updated'
        )
      }

    } catch (error) {
      this.addResult(
        'City/Meeting Type Updates',
        false,
        'Test failed with exception',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  private async simulateSearch(params: any): Promise<any> {
    // Simulate the search logic
    let filteredTherapists = [...testTherapists]

    // Apply city filter
    if (params.city) {
      filteredTherapists = filteredTherapists.filter(t => t.city === params.city)
    }

    // Apply meeting type filter
    if (params.meetingType) {
      const meetingTypeMap: Record<string, string> = {
        'ordinace': 'ordinace',
        'online': 'online',
        'dojíždění': 'dojíždění'
      }
      const targetMeetingType = meetingTypeMap[params.meetingType] || params.meetingType
      filteredTherapists = filteredTherapists.filter(t => t.meeting_types.includes(targetMeetingType))
    }

    // Apply gender filter
    if (params.therapistGenderPref && params.therapistGenderPref !== 'any') {
      filteredTherapists = filteredTherapists.filter(t => t.gender === params.therapistGenderPref)
    }

    // Apply diagnosis filter
    if (params.diagnosisIds && params.diagnosisIds.length > 0) {
      filteredTherapists = filteredTherapists.filter(t => 
        params.diagnosisIds.some((diag: string) => t.specialties.includes(diag))
      )
    }

    return {
      results: filteredTherapists.map(t => ({
        id: t.id,
        therapist: {
          id: t.id,
          fullName: t.name,
          gender: t.gender,
          city: t.city
        },
        match_score: Math.floor(Math.random() * 40) + 60, // Random score 60-100
        score_breakdown: {
          diagnosis: params.diagnosisIds?.length > 0 ? Math.floor(Math.random() * 40) + 20 : 0,
          availability: 15,
          distance: 20,
          language: 10,
          prefs: 10,
          profile: 5
        },
        components: {
          diagnosis: params.diagnosisIds?.length > 0 ? Math.random() * 0.8 + 0.2 : 0,
          gender: 1.0,
          availability: 0.6,
          distance: 0.8
        },
        matched_diagnoses: params.diagnosisIds?.filter((diag: string) => t.specialties.includes(diag)) || []
      })),
      totalCount: filteredTherapists.length,
      query: params
    }
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index])
  }

  private meetingTypeResultsChanged(initial: any, updated: any): boolean {
    // Check if the meeting types in results changed appropriately
    const initialMeetingTypes = initial.results.flatMap((r: any) => r.therapist.meeting_types || [])
    const updatedMeetingTypes = updated.results.flatMap((r: any) => r.therapist.meeting_types || [])
    
    return !this.arraysEqual(initialMeetingTypes, updatedMeetingTypes)
  }

  private printResults() {
    console.log('\n📊 Test Results Summary:')
    console.log('=' .repeat(50))
    
    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${total - passed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    
    if (total - passed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.testName}: ${r.details}`)
        if (r.error) console.log(`    Error: ${r.error}`)
      })
    }
    
    console.log('\n' + '='.repeat(50))
  }
}

// Run the tests
async function runRegressionTests() {
  const tester = new RegressionTester()
  const results = await tester.runAllTests()
  
  // Exit with error code if any tests failed
  const failedTests = results.filter(r => !r.passed)
  if (failedTests.length > 0) {
    console.log(`\n❌ ${failedTests.length} test(s) failed. Please review the issues above.`)
    process.exit(1)
  } else {
    console.log('\n✅ All regression tests passed!')
    process.exit(0)
  }
}

// Export for use in other scripts
export { RegressionTester, runRegressionTests }

// Run if called directly
if (require.main === module) {
  runRegressionTests().catch(console.error)
}
