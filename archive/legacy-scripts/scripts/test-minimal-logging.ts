// Test script for minimal logging and health monitoring
// Part A: Demonstrate zero results diagnosis without heavy tracing

import { 
  healthLogger,
  logSearchStart,
  logGeocoding,
  logDbQuery,
  logFiltering,
  logZeroResults,
  logHealthSummary
} from '../lib/utils/minimal-health-logger'

// Simulate a search scenario with zero results
function simulateZeroResultsScenario() {
  console.log('🧪 Testing minimal logging for zero results diagnosis...\n')
  
  const queryId = 'test_query_123'
  
  // Simulate search start
  logSearchStart(queryId, { city: 'Prague', maxKm: 5 })
  
  // Simulate geocoding success
  logGeocoding(queryId, true, 'Prague')
  
  // Simulate database query finding therapists
  logDbQuery(queryId, true, 15)
  
  // Simulate filtering removing all therapists
  logFiltering(queryId, 15, 0)
  
  // Simulate zero results health check
  const healthCheck = logZeroResults(queryId, {
    location: 'Prague',
    radiusKm: 5,
    mustHave: { languages: ['en'], practiceType: ['online'] }
  }, {
    geocodingSuccess: true,
    coordinatesResolved: true,
    dbQuerySuccess: true,
    filtersApplied: 3,
    therapistsFound: 15,
    finalResults: 0
  })
  
  console.log('\n📊 Health check result:')
  console.log(`Likely cause: ${healthCheck.diagnosis.likelyCause}`)
  console.log(`Confidence: ${healthCheck.diagnosis.confidence}`)
  console.log(`Suggestions: ${healthCheck.diagnosis.suggestions.join(', ')}`)
  
  // Show health summary
  console.log('\n📈 Health Summary:')
  logHealthSummary()
}

// Simulate multiple scenarios
function simulateMultipleScenarios() {
  console.log('\n🔄 Simulating multiple zero results scenarios...\n')
  
  // Scenario 1: Geocoding failure
  const queryId1 = 'test_query_456'
  logSearchStart(queryId1, { city: 'InvalidCity', maxKm: 30 })
  logGeocoding(queryId1, false, 'InvalidCity')
  logZeroResults(queryId1, { location: 'InvalidCity' }, {
    geocodingSuccess: false,
    coordinatesResolved: false,
    dbQuerySuccess: false,
    filtersApplied: 1,
    therapistsFound: 0,
    finalResults: 0
  })
  
  // Scenario 2: No therapists in area
  const queryId2 = 'test_query_789'
  logSearchStart(queryId2, { city: 'SmallVillage', maxKm: 10 })
  logGeocoding(queryId2, true, 'SmallVillage')
  logDbQuery(queryId2, true, 0)
  logZeroResults(queryId2, { location: 'SmallVillage', radiusKm: 10 }, {
    geocodingSuccess: true,
    coordinatesResolved: true,
    dbQuerySuccess: true,
    filtersApplied: 1,
    therapistsFound: 0,
    finalResults: 0
  })
  
  // Scenario 3: Filters too restrictive
  const queryId3 = 'test_query_101'
  logSearchStart(queryId3, { city: 'Prague', maxKm: 20 })
  logGeocoding(queryId3, true, 'Prague')
  logDbQuery(queryId3, true, 25)
  logFiltering(queryId3, 25, 0)
  logZeroResults(queryId3, { 
    location: 'Prague', 
    radiusKm: 20,
    mustHave: { languages: ['de'], practiceType: ['online'], specialties: ['rare_specialty'] }
  }, {
    geocodingSuccess: true,
    coordinatesResolved: true,
    dbQuerySuccess: true,
    filtersApplied: 5,
    therapistsFound: 25,
    finalResults: 0
  })
  
  // Show final health summary
  console.log('\n📈 Final Health Summary:')
  logHealthSummary()
}

// Run the tests
if (require.main === module) {
  simulateZeroResultsScenario()
  simulateMultipleScenarios()
  
  console.log('\n✅ Minimal logging test completed!')
  console.log('💡 In browser console, you can also use:')
  console.log('   - window.searchHealth.logSummary()')
  console.log('   - window.searchHealth.summary()')
  console.log('   - window.searchHealth.recentZeroResults()')
}

export { simulateZeroResultsScenario, simulateMultipleScenarios }
