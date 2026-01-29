/**
 * Fixture mode configuration for testing and development
 * Allows switching between production data and test fixtures via environment variables
 * 
 * PART A Implementation:
 * - Guarantee realistic test hits within 10–30 km of Prague and Ostrava to validate geo & scoring
 * - Enable fixture mode via ENV without touching production data
 * 
 * PART B Implementation:
 * - NEXT_PUBLIC_BIBIA_FIXTURES=true for client-side fixture mode
 * - Specific therapist data with isFixture=true markers
 * - Cleanup commands to remove fixture data
 */

export interface FixtureConfig {
  enabled: boolean
  useMockData: boolean
  useDeterministicData: boolean
  testRadiusKm: number
  targetCities: string[]
  minDistanceKm: number
  maxDistanceKm: number
}

/**
 * Get fixture configuration from environment variables
 */
export function getFixtureConfig(): FixtureConfig {
  const enabled = process.env.BIBIA_USE_FIXTURES === 'true' || 
                  process.env.NEXT_PUBLIC_BIBIA_FIXTURES === 'true' ||
                  process.env.FIXTURE_MODE === 'true' || 
                  process.env.NODE_ENV === 'test'
  const useMockData = process.env.USE_MOCK_DATA === 'true' || enabled
  const useDeterministicData = process.env.USE_DETERMINISTIC_DATA === 'true' || process.env.DETERMINISTIC_MODE === 'true'
  const testRadiusKm = parseInt(process.env.TEST_RADIUS_KM || '30', 10)
  const targetCities = (process.env.TARGET_CITIES || 'Praha,Ostrava,Brno').split(',')
  const minDistanceKm = parseInt(process.env.MIN_DISTANCE_KM || '5', 10) // Changed from 10 to 5
  const maxDistanceKm = parseInt(process.env.MAX_DISTANCE_KM || '30', 10)

  return {
    enabled,
    useMockData,
    useDeterministicData,
    testRadiusKm,
    targetCities,
    minDistanceKm,
    maxDistanceKm
  }
}

/**
 * Check if fixture mode is enabled
 */
export function isFixtureMode(): boolean {
  return getFixtureConfig().enabled
}

/**
 * Check if mock data should be used
 */
export function shouldUseMockData(): boolean {
  return getFixtureConfig().useMockData
}

/**
 * Get test radius in kilometers
 */
export function getTestRadiusKm(): number {
  return getFixtureConfig().testRadiusKm
}

/**
 * Get target cities for testing
 */
export function getTargetCities(): string[] {
  return getFixtureConfig().targetCities
}

/**
 * Check if deterministic data should be used
 */
export function shouldUseDeterministicData(): boolean {
  return getFixtureConfig().useDeterministicData
}

/**
 * Get minimum distance for test data generation
 */
export function getMinDistanceKm(): number {
  return getFixtureConfig().minDistanceKm
}

/**
 * Get maximum distance for test data generation
 */
export function getMaxDistanceKm(): number {
  return getFixtureConfig().maxDistanceKm
}

/**
 * Check if Part A requirements are met
 */
export function isPartAMode(): boolean {
  const config = getFixtureConfig()
  return config.enabled && config.useDeterministicData && 
         config.minDistanceKm >= 30 && config.maxDistanceKm <= 50 &&
         config.targetCities.includes('Praha') && config.targetCities.includes('Ostrava') && config.targetCities.includes('Brno')
}

/**
 * Check if Part A deterministic mode is enabled
 */
export function isPartADeterministicMode(): boolean {
  return process.env.PART_A_MODE === 'true' || process.env.PART_A_DETERMINISTIC === 'true'
}

/**
 * Check if Part B mode is enabled (NEXT_PUBLIC_BIBIA_FIXTURES)
 */
export function isPartBMode(): boolean {
  return process.env.NEXT_PUBLIC_BIBIA_FIXTURES === 'true'
}

/**
 * Check if client-side fixture mode is enabled
 */
export function isClientSideFixtureMode(): boolean {
  return process.env.NEXT_PUBLIC_BIBIA_FIXTURES === 'true'
}

/**
 * Check if server-side fixture mode is enabled
 */
export function isServerSideFixtureMode(): boolean {
  return process.env.BIBIA_USE_FIXTURES === 'true'
}
