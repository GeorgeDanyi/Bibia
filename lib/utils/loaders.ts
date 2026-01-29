import { Therapist } from '../types/therapist'
import { checkDatasetConsistency, autoFixTherapistData } from './data-consistency'
import { telemetry } from './telemetry'
import { isFixtureMode, shouldUseMockData, shouldUseDeterministicData, isPartAMode } from '../config/fixture'
import { getFixtureTherapists } from '../data/fixture-therapists'
import { getPartBFixtureTherapists } from '../data/part-b-fixtures'
import { getDeterministicFixtures } from '../data/deterministic-fixtures'
import { getTherapists } from '@/src/data/therapists'
import { normalizeTherapistGender } from './normalize'
import { promises as fs } from 'fs'
import path from 'path'

export interface CzPlace {
  name: string
  zip: string
  lat: number
  lon: number
}

let therapistsCache: Therapist[] | null = null
let placesCache: CzPlace[] | null = null

export async function loadTherapists(): Promise<Therapist[]> {
  if (therapistsCache) {
    return therapistsCache
  }

  // Check if fixture mode is enabled
  if (isFixtureMode() && shouldUseMockData()) {
    console.log('🔧 Fixture mode enabled - using test data for Prague and Ostrava')
    
    // Check if Part A deterministic mode is enabled
    if (shouldUseDeterministicData() || isPartAMode()) {
      console.log('🎯 Part A deterministic mode - using guaranteed 10-30km coverage data')
      const fixtures = getDeterministicFixtures()
      // Normalize gender for fixtures
      therapistsCache = fixtures.map((therapist: any) => {
        if (therapist.gender !== undefined) {
          therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
        }
        return therapist
      })
      return therapistsCache
    }
    
    // Try to load seeded fixtures first, fallback to generated fixtures
    try {
      const fixturesPath = path.join(process.cwd(), 'data', 'fixtures.json')
      const fixturesData = await fs.readFile(fixturesPath, 'utf-8')
      const seededFixtures = JSON.parse(fixturesData)
      console.log(`📊 Loaded ${seededFixtures.length} seeded fixtures`)
      // Normalize gender for seeded fixtures
      const normalizedFixtures = seededFixtures.map((therapist: any) => {
        if (therapist.gender !== undefined) {
          therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
        }
        return therapist
      })
      therapistsCache = normalizedFixtures
      return normalizedFixtures
    } catch (error) {
      console.log('🔄 No seeded fixtures found, using generated fixtures')
      const fixtures = getPartBFixtureTherapists()
      // Normalize gender for generated fixtures
      const normalizedFixtures = fixtures.map((therapist: any) => {
        if (therapist.gender !== undefined) {
          therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
        }
        return therapist
      })
      therapistsCache = normalizedFixtures
      return normalizedFixtures
    }
  }

  try {
    const rawTherapists = await getTherapists()
    
    // Filter out fixture data in production
    const productionTherapists = rawTherapists.filter((therapist: any) => !therapist.isFixture)
    
    // Check data consistency (cast to any[] since src/data/therapists returns a simpler Therapist type)
    const consistencyReport = checkDatasetConsistency(productionTherapists as any[])
    
    if (consistencyReport.issuesFound > 0) {
      console.warn(`Data consistency issues found:`, {
        totalIssues: consistencyReport.issuesFound,
        critical: consistencyReport.summary.critical,
        high: consistencyReport.summary.high,
        medium: consistencyReport.summary.medium,
        low: consistencyReport.summary.low
      })
      
      // Log critical issues
      consistencyReport.issues
        .filter(issue => issue.severity === 'critical')
        .forEach(issue => {
          telemetry.logDataConsistencyIssue('therapist_loader', issue.message, {
            therapistId: issue.therapistId,
            field: issue.field,
            severity: issue.severity
          })
        })
    }
    
    // Auto-fix common issues and normalize gender
    const fixedTherapists = productionTherapists.map((therapist: any) => {
      const fixed = autoFixTherapistData(therapist) as any
      // Normalize gender to strict 'male' | 'female'
      if (fixed.gender !== undefined) {
        fixed.gender = normalizeTherapistGender(fixed.gender, fixed.id)
      }
      return fixed
    })
    
    // Debug: Print therapist statistics
    const totalTherapists = fixedTherapists.length
    const inPersonTherapists = fixedTherapists.filter((t: any) => {
      const modes = t.modes || t.meetingTypes || []
      return Array.isArray(modes) && (modes.includes('clinic') || modes.includes('home_visit') || modes.includes('ordinace') || modes.includes('dojíždění') || modes.includes('dojizdeni'))
    }).length
    const therapistsWithValidLocation = fixedTherapists.filter((t: any) => {
      const lat = typeof t.latitude === 'number' ? t.latitude : parseFloat(t.latitude)
      const lon = typeof t.longitude === 'number' ? t.longitude : parseFloat(t.longitude)
      return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 48.5 && lat <= 51.1 && lon >= 12.0 && lon <= 18.9
    }).length
    
    console.log('📊 [DATA LOADER] Therapist Statistics:')
    console.log(`   Total therapists: ${totalTherapists}`)
    console.log(`   In-person therapists: ${inPersonTherapists}`)
    console.log(`   Therapists with valid location: ${therapistsWithValidLocation}`)
    
    // Debug: Print per-city statistics for target cities
    const targetCities = ['Praha', 'Brno', 'Plzeň', 'Karlovy Vary', 'Kladno', 'Liberec', 'Ostrava', 'Olomouc']
    console.log('🏙️ [DATA LOADER] Per-city in-person statistics:')
    for (const city of targetCities) {
      const cityTherapists = fixedTherapists.filter((t: any) => t.city === city)
      const cityInPerson = cityTherapists.filter((t: any) => {
        const modes = t.modes || t.meetingTypes || []
        return Array.isArray(modes) && (modes.includes('clinic') || modes.includes('home_visit') || modes.includes('ordinace') || modes.includes('dojíždění') || modes.includes('dojizdeni'))
      }).length
      console.log(`   ${city}: ${cityInPerson} in-person (${cityTherapists.length} total)`)
      
      // If no in-person therapists, suggest adding one or enabling centroid
      if (cityInPerson === 0) {
        console.log(`   ⚠️  ${city}: No in-person therapists - consider adding data or enabling centroid fallback`)
      }
    }
    
    therapistsCache = fixedTherapists
    return therapistsCache
  } catch (error) {
    console.error('Error loading therapists:', error)
    
    // Fallback to fixture data if production data fails
    if (isFixtureMode()) {
      console.log('🔄 Falling back to fixture data due to error')
      const fixtures = getPartBFixtureTherapists()
      // Normalize gender for fallback fixtures
      therapistsCache = fixtures.map((therapist: any) => {
        if (therapist.gender !== undefined) {
          therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id)
        }
        return therapist
      })
      return therapistsCache
    }
    
    return []
  }
}

export async function loadPlaces(): Promise<CzPlace[]> {
  if (placesCache) {
    return placesCache
  }

  try {
    const response = await fetch('/data/cz_places.json')
    if (!response.ok) {
      throw new Error(`Failed to load places: ${response.statusText}`)
    }
    const places = await response.json()
    placesCache = places
    return places
  } catch (error) {
    console.error('Error loading Czech places:', error)
    return []
  }
}

/**
 * Clear fixture data from therapists
 * This function removes all therapists marked with isFixture=true
 */
export async function clearFixtureData(): Promise<void> {
  try {
    const therapistsPath = path.join(process.cwd(), 'data', 'therapists.json')
    const therapistsContent = await fs.readFile(therapistsPath, 'utf-8')
    const allTherapists = JSON.parse(therapistsContent)
    
    // Filter out fixture data
    const productionTherapists = allTherapists.filter((therapist: any) => !therapist.isFixture)
    
    // Save cleaned data
    await fs.writeFile(therapistsPath, JSON.stringify(productionTherapists, null, 2))
    
    // Clear cache
    therapistsCache = null
    
    console.log(`🧹 Cleaned fixture data. Removed ${allTherapists.length - productionTherapists.length} fixture therapists.`)
    console.log(`📊 ${productionTherapists.length} production therapists remaining.`)
    
  } catch (error) {
    console.error('Error clearing fixture data:', error)
    throw error
  }
}

/**
 * Get fixture statistics
 */
export async function getFixtureStats(): Promise<{
  total: number
  fixtures: number
  production: number
  byCity: Record<string, { total: number; fixtures: number; production: number }>
}> {
  try {
    const therapistsPath = path.join(process.cwd(), 'data', 'therapists.json')
    const therapistsContent = await fs.readFile(therapistsPath, 'utf-8')
    const allTherapists = JSON.parse(therapistsContent)
    
    const fixtures = allTherapists.filter((t: any) => t.isFixture)
    const production = allTherapists.filter((t: any) => !t.isFixture)
    
    const byCity: Record<string, { total: number; fixtures: number; production: number }> = {}
    
    allTherapists.forEach((therapist: any) => {
      const city = therapist.city || 'Unknown'
      if (!byCity[city]) {
        byCity[city] = { total: 0, fixtures: 0, production: 0 }
      }
      byCity[city].total++
      if (therapist.isFixture) {
        byCity[city].fixtures++
      } else {
        byCity[city].production++
      }
    })
    
    return {
      total: allTherapists.length,
      fixtures: fixtures.length,
      production: production.length,
      byCity
    }
    
  } catch (error) {
    console.error('Error getting fixture stats:', error)
    return { total: 0, fixtures: 0, production: 0, byCity: {} }
  }
}
