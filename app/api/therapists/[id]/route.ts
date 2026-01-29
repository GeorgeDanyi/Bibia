import { NextResponse } from 'next/server'
import { isFixtureMode, shouldUseMockData, shouldUseDeterministicData, isPartAMode } from '@/lib/config/fixture'
import { getFixtureTherapists } from '@/lib/data/fixture-therapists'
import { getPartBFixtureTherapists } from '@/lib/data/part-b-fixtures'
import { getDeterministicFixtures } from '@/lib/data/deterministic-fixtures'
import { getTherapists } from '@/src/data/therapists'
import { normalizeTherapistGender } from '@/lib/utils/normalize'
import fs from 'node:fs'
import path from 'node:path'

type RouteParams = {
  params: Promise<{
    id: string
  }> | {
    id: string
  }
}

export async function GET(request: Request, routeParams: RouteParams) {
  try {
    // Handle both sync and async params (Next.js 13+ vs 15+)
    const params = 'then' in routeParams.params 
      ? await routeParams.params 
      : routeParams.params
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 })
    }

    let allTherapists: any[] = []

    // Check if fixture mode is enabled
    if (isFixtureMode() && shouldUseMockData()) {
      console.log(`🔧 API: Fixture mode enabled - loading therapist ${id}`)
      
      // Check if Part A deterministic mode is enabled
      if (shouldUseDeterministicData() || isPartAMode()) {
        console.log('🎯 API: Part A deterministic mode - using guaranteed 10-30km coverage data')
        allTherapists = getDeterministicFixtures()
      } else {
        // Try to load seeded fixtures first, fallback to generated fixtures
        try {
          const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
          const fixturesData = await fs.promises.readFile(fixturesPath, 'utf-8')
          const seededFixtures = JSON.parse(fixturesData)
          console.log(`📊 API: Loaded ${seededFixtures.length} seeded fixtures`)
          allTherapists = seededFixtures
        } catch (error) {
          console.log('🔄 API: No seeded fixtures found, using generated fixtures')
          allTherapists = getPartBFixtureTherapists()
        }
      }
    } else {
      // Try to load from data/therapists.json first (primary source)
      // Use require() for better performance with large files (same approach as searchTherapists)
      try {
        const dataPath = path.join(process.cwd(), 'data', 'therapists.json')
        console.log(`📂 API: Loading therapists from ${dataPath}`)
        
        if (fs.existsSync(dataPath)) {
          // Use require() for better performance (cached by Node.js)
          // eslint-disable-next-line
          const dataTherapists = require(dataPath) as any[]
          
          if (Array.isArray(dataTherapists) && dataTherapists.length > 0) {
            console.log(`📊 API: Loaded ${dataTherapists.length} therapists from data/therapists.json`)
            allTherapists = dataTherapists
          } else {
            console.warn(`⚠️ API: data/therapists.json is not a valid array or is empty`)
          }
        } else {
          console.log(`⚠️ API: data/therapists.json does not exist at ${dataPath}`)
        }
      } catch (error) {
        console.error('❌ API: Error loading from data/therapists.json:', error)
        if (error instanceof Error) {
          console.error('Error message:', error.message)
        }
        
        // Fallback: try reading file directly if require() fails
        try {
          const dataPath = path.join(process.cwd(), 'data', 'therapists.json')
          if (fs.existsSync(dataPath)) {
            console.log(`🔄 API: Retrying with readFile...`)
            const dataContent = await fs.promises.readFile(dataPath, 'utf-8')
            const dataTherapists = JSON.parse(dataContent)
            if (Array.isArray(dataTherapists) && dataTherapists.length > 0) {
              console.log(`📊 API: Loaded ${dataTherapists.length} therapists via readFile`)
              allTherapists = dataTherapists
            }
          }
        } catch (fallbackError) {
          console.error('❌ API: Fallback readFile also failed:', fallbackError)
        }
      }
      
      // Fallback to getTherapists() if data/therapists.json is empty or doesn't exist
      if (allTherapists.length === 0) {
        console.log('🔄 API: Falling back to getTherapists()')
        try {
          allTherapists = await getTherapists()
          console.log(`📊 API: getTherapists() returned ${allTherapists.length} therapists`)
        } catch (error) {
          console.error('❌ API: getTherapists() failed:', error)
        }
      }
      
      // Filter out fixture data in production (only if explicitly marked)
      const beforeFilter = allTherapists.length
      allTherapists = allTherapists.filter((therapist: any) => {
        // Only filter if isFixture is explicitly true
        return therapist.isFixture !== true
      })
      
      if (beforeFilter !== allTherapists.length) {
        console.log(`📊 API: Filtered ${beforeFilter - allTherapists.length} fixture therapists`)
      }
      console.log(`📊 API: Total therapists after filtering: ${allTherapists.length}`)
    }

    // Normalize gender and data structure for all therapists
    allTherapists = allTherapists.map((therapist: any) => {
      // Normalize gender
      if (therapist.gender !== undefined) {
        therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
      }
      
      // Normalize data structure - support multiple formats
      // Map lat/lng to latitude/longitude if needed
      if (therapist.lat && !therapist.latitude) {
        therapist.latitude = therapist.lat
      }
      if (therapist.lng && !therapist.longitude) {
        therapist.longitude = therapist.lng
      }
      
      // Map name to fullName if needed
      if (therapist.name && !therapist.fullName) {
        therapist.fullName = therapist.name
      }
      
      return therapist
    })

    // Find therapist by ID - support multiple ID formats and field names
    console.log(`🔍 API: Searching for therapist with ID: ${id}`)
    console.log(`🔍 API: Searching in ${allTherapists.length} therapists`)
    
    const therapist = allTherapists.find((t: any) => {
      const therapistId = t.id || t.therapist?.id || (t as any)._id
      if (!therapistId) return false
      
      // Exact match
      if (therapistId === id) return true
      
      // String comparison
      if (String(therapistId) === String(id)) return true
      
      // Case-insensitive comparison
      if (String(therapistId).toLowerCase() === String(id).toLowerCase()) return true
      
      return false
    })

    if (!therapist) {
      console.log(`❌ API: Therapist ${id} not found. Total therapists loaded: ${allTherapists.length}`)
      const sampleIds = allTherapists.slice(0, 10).map((t: any) => t.id || t.therapist?.id || (t as any)._id)
      console.log(`📋 API: Sample IDs from loaded data:`, sampleIds)
      
      // Check if ID exists with different case
      const foundCaseInsensitive = allTherapists.find((t: any) => {
        const therapistId = t.id || t.therapist?.id || (t as any)._id
        return therapistId && String(therapistId).toLowerCase() === String(id).toLowerCase()
      })
      
      if (foundCaseInsensitive) {
        console.log(`⚠️ API: Found therapist with different case: ${foundCaseInsensitive.id || foundCaseInsensitive.therapist?.id}`)
      }
      
      return NextResponse.json(
        { error: 'Therapist not found', searchedId: id, totalLoaded: allTherapists.length, sampleIds },
        { status: 404 }
      )
    }
    
    console.log(`✅ API: Found therapist ${id}: ${therapist.name || therapist.fullName || 'Unknown'}`)

    // Return therapist data
    return NextResponse.json(therapist)
  } catch (err) {
    console.error('Failed to load therapist:', err)
    
    // Fallback to fixture data if production data fails
    if (isFixtureMode()) {
      console.log('🔄 API: Falling back to fixture data due to error')
      try {
        // Handle both sync and async params in catch block
        const params = 'then' in routeParams.params 
          ? await routeParams.params 
          : routeParams.params
        const { id } = params
        
        const fixtureData = getPartBFixtureTherapists()
        const therapist = fixtureData.find((t: any) => 
          t.id === id || 
          t.therapist?.id === id || 
          (t as any)._id === id ||
          String(t.id) === String(id)
        )
        
        if (therapist) {
          return NextResponse.json(therapist)
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to load therapist' },
      { status: 500 }
    )
  }
}
