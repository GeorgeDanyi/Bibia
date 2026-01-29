import { NextRequest, NextResponse } from 'next/server'
import { SearchCriteria } from '@/src/types/search'

// Adapter function to convert new SearchCriteria to existing API format
function adaptSearchCriteria(criteria: SearchCriteria) {
  return {
    location: criteria.location.cityOrZip 
      ? { cityOrZip: criteria.location.cityOrZip }
      : { lat: criteria.location.lat!, lng: criteria.location.lng! },
    radiusKm: criteria.radiusKm,
    problems: criteria.conditions,
    diagnosisTags: criteria.conditions, // Map conditions to diagnosis tags
    preferences: {
      languages: criteria.languages
    },
    mustHave: {
      practiceType: criteria.practice === 'online' ? ['online'] : 
                   criteria.practice === 'inperson' ? ['private', 'clinic'] : undefined
    },
    prefer: {
      expertEvenIfFarther: criteria.preferExpert
    },
    onlineOnly: criteria.practice === 'online',
    // Map availability to time preferences
    timePreferences: criteria.availability === 'today' ? ['asap'] :
                    criteria.availability === 'next3' ? ['this-week'] :
                    criteria.availability === 'next7' ? ['flexible'] : undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert new format to existing format
    const adaptedBody = adaptSearchCriteria(body as SearchCriteria)
    
    // Call the existing search logic
    const existingResponse = await fetch(`${request.nextUrl.origin}/api/searchTherapists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adaptedBody)
    })
    
    if (!existingResponse.ok) {
      throw new Error(`Search failed: ${existingResponse.statusText}`)
    }
    
    const result = await existingResponse.json()
    
    // Convert response to new format
    const newFormatResult = {
      total: result.pagination?.total || result.results?.length || 0,
      expandedRadiusKm: result.searchInfo?.expandedRadiusKm,
      items: (result.results || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        city: item.city,
        distanceKm: item.distanceKm,
        practiceType: item.practiceType === 'online' ? 'online' : 'inperson',
        diagnosisTags: item.diagnosisTags || [],
        languages: item.languages || [],
        acceptingNew: item.acceptingNew,
        nextAvailableDays: item.nextAvailableDays || 7,
        score: item.score || 0,
        matchReasons: item.reasons || []
      }))
    }
    
    return NextResponse.json(newFormatResult)
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
