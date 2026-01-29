/**
 * Test script for visit mode matching logic
 * Validates the four visit modes: clinic, home_visit, online, any
 */

import { rankTherapists, loadAndRankTherapists } from '@/lib/utils/therapist-matching'
import { UserAnswers } from '@/lib/types/therapist-extended'

// Test scenarios based on acceptance criteria
const testScenarios = [
  {
    name: "Clinic in Prague",
    answers: {
      city: "Praha",
      visitMode: "clinic" as const,
      conditionsMain: ["back-pain"],
      conditionsDetail: [],
      modalities: [],
      availability: ["morning"],
      languages: ["cs"],
      insurance: [],
      ageGroups: ["adult"],
      workplaceAccessibility: [],
      consentGiven: true
    },
    expectedBehavior: "Should only return therapists with offersClinic = true"
  },
  {
    name: "Home visit in Prague (within radius)",
    answers: {
      city: "Praha",
      visitMode: "home_visit" as const,
      conditionsMain: ["back-pain"],
      conditionsDetail: [],
      modalities: [],
      availability: ["morning"],
      languages: ["cs"],
      insurance: [],
      ageGroups: ["adult"],
      workplaceAccessibility: [],
      consentGiven: true
    },
    expectedBehavior: "Should only return therapists with offersHomeVisit.enabled = true AND distance <= radiusKm"
  },
  {
    name: "Online consultation (cross-city)",
    answers: {
      city: "Brno",
      visitMode: "online" as const,
      conditionsMain: ["back-pain"],
      conditionsDetail: [],
      modalities: [],
      availability: ["morning"],
      languages: ["cs"],
      insurance: [],
      ageGroups: ["adult"],
      workplaceAccessibility: [],
      consentGiven: true
    },
    expectedBehavior: "Should return therapists with offersOnline = true, ignoring distance"
  },
  {
    name: "Any mode (mixed results)",
    answers: {
      city: "Praha",
      visitMode: "any" as const,
      conditionsMain: ["back-pain"],
      conditionsDetail: [],
      modalities: [],
      availability: ["morning"],
      languages: ["cs"],
      insurance: [],
      ageGroups: ["adult"],
      workplaceAccessibility: [],
      consentGiven: true
    },
    expectedBehavior: "Should return all therapists, with those supporting relevant modes scoring higher"
  },
  {
    name: "Invalid city (should be blocked)",
    answers: {
      city: "InvalidCity123",
      visitMode: "clinic" as const,
      conditionsMain: ["back-pain"],
      conditionsDetail: [],
      modalities: [],
      availability: ["morning"],
      languages: ["cs"],
      insurance: [],
      ageGroups: ["adult"],
      workplaceAccessibility: [],
      consentGiven: true
    },
    expectedBehavior: "Should return empty results due to city normalization failure"
  }
]

async function runTestScenario(scenario: typeof testScenarios[0]) {
  console.log(`\n🧪 Testing: ${scenario.name}`)
  console.log(`Expected: ${scenario.expectedBehavior}`)
  
  try {
    const results = await loadAndRankTherapists(scenario.answers)
    
    console.log(`Results: ${results.length} therapists found`)
    
    if (results.length === 0) {
      console.log("❌ No results found")
      return
    }
    
    // Show top 3 results
    results.slice(0, 3).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.therapist.fullName}`)
      console.log(`   Score: ${result.score}`)
      console.log(`   Distance: ${result.distanceKm.toFixed(1)} km`)
      console.log(`   Visit modes: clinic=${result.therapist.offersClinic}, home=${result.therapist.offersHomeVisit.enabled}, online=${result.therapist.offersOnline}`)
      console.log(`   Reasons: ${result.matchReasons.join(', ')}`)
    })
    
    // Validate results based on visit mode
    const visitMode = scenario.answers.visitMode
    let isValid = true
    
    for (const result of results) {
      switch (visitMode) {
        case 'clinic':
          if (!result.therapist.offersClinic) {
            console.log(`❌ Invalid: ${result.therapist.fullName} doesn't offer clinic visits`)
            isValid = false
          }
          break
        
        case 'home_visit':
          if (!result.therapist.offersHomeVisit.enabled) {
            console.log(`❌ Invalid: ${result.therapist.fullName} doesn't offer home visits`)
            isValid = false
          }
          if (result.distanceKm > result.therapist.offersHomeVisit.radiusKm) {
            console.log(`❌ Invalid: ${result.therapist.fullName} is ${result.distanceKm.toFixed(1)}km away but only serves ${result.therapist.offersHomeVisit.radiusKm}km radius`)
            isValid = false
          }
          break
        
        case 'online':
          if (!result.therapist.offersOnline) {
            console.log(`❌ Invalid: ${result.therapist.fullName} doesn't offer online consultations`)
            isValid = false
          }
          break
        
        case 'any':
          // For 'any' mode, all therapists should be included
          break
      }
    }
    
    if (isValid) {
      console.log("✅ Test passed")
    } else {
      console.log("❌ Test failed")
    }
    
  } catch (error) {
    console.error("❌ Test error:", error)
  }
}

async function runAllTests() {
  console.log("🚀 Starting Visit Mode Matching Tests")
  console.log("=".repeat(50))
  
  for (const scenario of testScenarios) {
    await runTestScenario(scenario)
  }
  
  console.log("\n🏁 All tests completed")
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

export { runAllTests, testScenarios }
