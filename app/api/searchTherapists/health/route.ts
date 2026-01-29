import { NextRequest, NextResponse } from 'next/server'

// Health endpoint for search therapists API
export async function GET(request: NextRequest) {
  try {
    // Load therapist data to get total count
    let therapistsTotal = 0
    
    try {
      // Try to load fixtures first
      const fs = await import('fs')
      const path = await import('path')
      
      const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
      const fixturesData = await fs.promises.readFile(fixturesPath, 'utf-8')
      const fixtures = JSON.parse(fixturesData)
      therapistsTotal = fixtures.length
    } catch (error) {
      // Fallback to therapists.json
      try {
        const fs = await import('fs')
        const path = await import('path')
        
        const therapistsPath = path.join(process.cwd(), 'data', 'therapists.json')
        const therapistsData = await fs.promises.readFile(therapistsPath, 'utf-8')
        const therapists = JSON.parse(therapistsData)
        therapistsTotal = therapists.length
      } catch (therapistError) {
        // If both fail, return 0
        therapistsTotal = 0
      }
    }
    
    return NextResponse.json({
      ok: true,
      therapistsTotal,
      timestamp: new Date().toISOString(),
      service: 'searchTherapists'
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      service: 'searchTherapists'
    }, { status: 500 })
  }
}