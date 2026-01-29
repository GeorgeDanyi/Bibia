import { NextResponse } from 'next/server'
import { isFixtureMode, shouldUseMockData, shouldUseDeterministicData, isPartAMode } from '@/lib/config/fixture'
import { getFixtureTherapists } from '@/lib/data/fixture-therapists'
import { getPartBFixtureTherapists } from '@/lib/data/part-b-fixtures'
import { getDeterministicFixtures } from '@/lib/data/deterministic-fixtures'
import { getTherapists } from '@/src/data/therapists'
import { normalizeTherapistGender } from '@/lib/utils/normalize'
import fs from 'node:fs'
import path from 'node:path'

export async function GET() {
  try {
    // Check if fixture mode is enabled
    if (isFixtureMode() && shouldUseMockData()) {
      console.log('🔧 API: Fixture mode enabled - returning test data for Prague and Ostrava')
      
      // Check if Part A deterministic mode is enabled
      if (shouldUseDeterministicData() || isPartAMode()) {
        console.log('🎯 API: Part A deterministic mode - using guaranteed 10-30km coverage data')
        const deterministicData = getDeterministicFixtures()
        // Normalize gender for deterministic fixtures
        const normalized = deterministicData.map((therapist: any) => {
          if (therapist.gender !== undefined) {
            therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
          }
          return therapist
        })
        return NextResponse.json(normalized)
      }
      
      // Try to load seeded fixtures first, fallback to generated fixtures
      try {
        const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
        const fixturesData = await fs.promises.readFile(fixturesPath, 'utf-8')
        const seededFixtures = JSON.parse(fixturesData)
        console.log(`📊 API: Loaded ${seededFixtures.length} seeded fixtures`)
        // Normalize gender for seeded fixtures
        const normalized = seededFixtures.map((therapist: any) => {
          if (therapist.gender !== undefined) {
            therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
          }
          return therapist
        })
        return NextResponse.json(normalized)
      } catch (error) {
        console.log('🔄 API: No seeded fixtures found, using generated fixtures')
        const fixtureData = getPartBFixtureTherapists()
        // Normalize gender for generated fixtures
        const normalized = fixtureData.map((therapist: any) => {
          if (therapist.gender !== undefined) {
            therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
          }
          return therapist
        })
        return NextResponse.json(normalized)
      }
    }

    // Use the new server-side data loader
    let data = await getTherapists()
    
    // If no therapists from public data, try loading from data/therapists.json
    if (data.length === 0) {
      try {
        const dataPath = path.join(process.cwd(), 'data', 'therapists.json')
        if (fs.existsSync(dataPath)) {
          const dataContent = await fs.promises.readFile(dataPath, 'utf-8')
          const dataTherapists = JSON.parse(dataContent)
          if (Array.isArray(dataTherapists)) {
            console.log(`📊 API: Loaded ${dataTherapists.length} therapists from data/therapists.json`)
            data = dataTherapists
          }
        }
      } catch (error) {
        console.warn('Could not load from data/therapists.json:', error)
      }
    }
    
    // Filter out fixture data in production (only if explicitly marked) and normalize gender
    const productionData = data
      .filter((therapist: any) => therapist.isFixture !== true)
      .map((therapist: any) => {
        if (therapist.gender !== undefined) {
          therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
        }
        return therapist
      })
    
    return NextResponse.json(productionData)
  } catch (err) {
    console.error('Failed to read therapists.json', err)
    
    // Fallback to fixture data if production data fails
    if (isFixtureMode()) {
      console.log('🔄 API: Falling back to fixture data due to error')
      const fixtureData = getPartBFixtureTherapists()
      return NextResponse.json(fixtureData)
    }
    
    return NextResponse.json({ error: 'Failed to load therapists' }, { status: 500 })
  }
}



