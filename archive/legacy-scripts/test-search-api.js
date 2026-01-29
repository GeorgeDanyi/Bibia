// Simple test script for the search API
// Run with: node test-search-api.js

const testSearchAPI = async () => {
  const testQuery = {
    location: { cityOrZip: "Praha" },
    radiusKm: 30,
    problems: ["back pain"],
    diagnosisTags: ["bolesti zad"],
    preferences: {
      gender: "any",
      languages: ["cs"]
    },
    mustHave: {
      practiceType: ["clinic", "private"],
      languages: ["cs"]
    },
    prefer: {
      distance: true,
      price: true,
      availability: true
    },
    page: 1,
    pageSize: 12
  }

  try {
    const response = await fetch('http://localhost:3000/api/searchTherapists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testQuery)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Search API Test Results:')
    console.log('========================')
    console.log(`Query ID: ${data.searchInfo.queryId}`)
    console.log(`Results found: ${data.searchInfo.resultsCount}`)
    console.log(`Radius used: ${data.searchInfo.radiusKmUsed}km`)
    if (data.searchInfo.expandedRadiusKm) {
      console.log(`Expanded to: ${data.searchInfo.expandedRadiusKm}km`)
      console.log(`Reason: ${data.searchInfo.expansionReason}`)
    }
    console.log(`Pagination: page ${data.pagination.page} of ${data.pagination.totalPages} (${data.pagination.total} total)`)
    console.log('\nTherapists:')
    data.therapists.forEach((therapist, index) => {
      console.log(`${index + 1}. ${therapist.name} - ${therapist.city} (${therapist.distanceKm}km)`)
      console.log(`   Practice: ${therapist.practiceType}, Accepting: ${therapist.acceptingNew}`)
      console.log(`   Tags: ${therapist.tags.join(', ')}`)
      console.log(`   Price: ${therapist.priceRange ? `${therapist.priceRange.minCZK}-${therapist.priceRange.maxCZK} CZK` : 'N/A'}`)
    })
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

// Run the test
testSearchAPI()
