import { NextRequest, NextResponse } from 'next/server'
import { kmDistance, isWithinBoundingBox } from '@/lib/distance'

// Debug endpoint to count therapists near a specific location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.lat || !body.lng || !body.radiusKm) {
      return NextResponse.json({
        error: 'Missing required fields: lat, lng, radiusKm'
      }, { status: 400 })
    }
    
    const { lat, lng, radiusKm } = body
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || typeof radiusKm !== 'number') {
      return NextResponse.json({
        error: 'Invalid data types: lat, lng, radiusKm must be numbers'
      }, { status: 400 })
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({
        error: 'Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180'
      }, { status: 400 })
    }
    
    if (radiusKm <= 0 || radiusKm > 1000) {
      return NextResponse.json({
        error: 'Invalid radius: must be between 0 and 1000 km'
      }, { status: 400 })
    }
    
    // Load therapist data
    let allTherapists: any[] = []
    
    try {
      // Try to load fixtures first
      const fs = await import('fs')
      const path = await import('path')
      
      const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
      const fixturesData = await fs.promises.readFile(fixturesPath, 'utf-8')
      allTherapists = JSON.parse(fixturesData)
    } catch (error) {
      // Fallback to therapists.json
      try {
        const fs = await import('fs')
        const path = await import('path')
        
        const therapistsPath = path.join(process.cwd(), 'data', 'therapists.json')
        const therapistsData = await fs.promises.readFile(therapistsPath, 'utf-8')
        const rawTherapists = JSON.parse(therapistsData)
        
        // Transform the data to match expected structure
        allTherapists = rawTherapists.map((therapist: any) => ({
          id: therapist.id,
          latitude: therapist.location?.lat || therapist.latitude,
          longitude: therapist.location?.lon || therapist.longitude,
          city: therapist.city,
          name: therapist.name || therapist.fullName
        }))
      } catch (therapistError) {
        return NextResponse.json({
          error: 'Failed to load therapist data'
        }, { status: 500 })
      }
    }
    
    // Filter therapists within radius
    const userLocation = { lat, lng }
    const nearbyTherapists = allTherapists.filter(therapist => {
      // Check if therapist has valid coordinates
      if (typeof therapist.latitude !== 'number' || typeof therapist.longitude !== 'number') {
        return false
      }
      
      const therapistLocation = { lat: therapist.latitude, lng: therapist.longitude }
      
      // Use bounding box for pre-filtering
      if (!isWithinBoundingBox(therapistLocation, userLocation, radiusKm)) {
        return false
      }
      
      // Calculate exact distance
      const distance = kmDistance(userLocation, therapistLocation)
      return distance <= radiusKm
    })
    
    // Calculate some additional statistics
    const distances = nearbyTherapists.map(therapist => {
      const therapistLocation = { lat: therapist.latitude, lng: therapist.longitude }
      return kmDistance(userLocation, therapistLocation)
    }).sort((a, b) => a - b)
    
    const minDistance = distances.length > 0 ? distances[0] : null
    const maxDistance = distances.length > 0 ? distances[distances.length - 1] : null
    const avgDistance = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : null
    
    return NextResponse.json({
      count: nearbyTherapists.length,
      totalTherapists: allTherapists.length,
      location: { lat, lng },
      radiusKm,
      statistics: {
        minDistance,
        maxDistance,
        avgDistance: avgDistance ? Math.round(avgDistance * 100) / 100 : null
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug countNearby failed:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
