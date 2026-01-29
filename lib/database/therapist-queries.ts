/**
 * Database query functions for therapist search
 * Supports both PostGIS and Haversine distance calculations
 */

export interface TherapistQueryParams {
  userLat: number
  userLng: number
  radiusKm: number
  diagnosisTags?: string[]
  practiceTypes?: string[]
  languages?: string[]
  acceptingNew?: boolean
  onlineOnly?: boolean
  page: number
  pageSize: number
}

export interface TherapistQueryResult {
  id: string
  name: string
  city: string
  latitude: number
  longitude: number
  distanceKm: number
  diagnosisTags: string[]
  practiceType: string
  languages: string[]
  acceptingNew: boolean
  rating: { average: number; count: number }
  priceRange?: { minCZK: number; maxCZK: number }
  tags: string[]
}

/**
 * PostGIS query for therapist search with proper ST_DWithin and ST_Distance
 * @param params Query parameters
 * @returns SQL query string and parameters
 */
export function buildPostGISQuery(params: TherapistQueryParams): { query: string; queryParams: any[] } {
  const {
    userLat,
    userLng,
    radiusKm,
    diagnosisTags = [],
    practiceTypes = [],
    languages = [],
    acceptingNew,
    onlineOnly = false,
    page,
    pageSize
  } = params

  const queryParams: any[] = []
  let paramIndex = 1

  // Base query with PostGIS distance calculation
  let query = `
    SELECT 
      t.id,
      t.name,
      t.city,
      t.latitude,
      t.longitude,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)::geography
      ) / 1000 AS distanceKm,
      t.diagnosis_tags as "diagnosisTags",
      t.practice_type as "practiceType",
      t.languages,
      t.accepting_new as "acceptingNew",
      t.rating,
      t.price_range as "priceRange",
      t.tags
    FROM therapists t
    WHERE 1=1
  `

  queryParams.push(userLng, userLat)
  paramIndex += 2

  // Online-only: skip geo filter, only filter by practice type
  if (onlineOnly) {
    query += ` AND t.practice_type = 'online'`
  } else {
    // PostGIS geo filter: ST_DWithin with radius in meters
    query += ` AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint($${paramIndex - 2}, $${paramIndex - 1}), 4326)::geography,
      $${paramIndex} * 1000
    )`
    queryParams.push(radiusKm)
    paramIndex++
  }

  // Diagnosis tags: array intersection (OR logic)
  if (diagnosisTags.length > 0) {
    query += ` AND array_length(
      ARRAY(
        SELECT UNNEST(t.diagnosis_tags) 
        INTERSECT 
        SELECT UNNEST($${paramIndex}::text[])
      ), 1
    ) > 0`
    queryParams.push(diagnosisTags)
    paramIndex++
  }

  // Practice types filter
  if (practiceTypes.length > 0) {
    query += ` AND t.practice_type = ANY($${paramIndex}::text[])`
    queryParams.push(practiceTypes)
    paramIndex++
  }

  // Languages filter (only if mustHave)
  if (languages.length > 0) {
    query += ` AND array_length(
      ARRAY(
        SELECT UNNEST(t.languages) 
        INTERSECT 
        SELECT UNNEST($${paramIndex}::text[])
      ), 1
    ) > 0`
    queryParams.push(languages)
    paramIndex++
  }

  // Accepting new patients (only if explicitly requested)
  if (acceptingNew !== undefined) {
    query += ` AND t.accepting_new = $${paramIndex}`
    queryParams.push(acceptingNew)
    paramIndex++
  }

  // Order by distance (or score for online)
  if (onlineOnly) {
    query += ` ORDER BY t.rating DESC, t.name ASC`
  } else {
    query += ` ORDER BY distanceKm ASC, t.rating DESC`
  }

  // Pagination
  const offset = (page - 1) * pageSize
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  queryParams.push(pageSize, offset)

  return { query, queryParams }
}

/**
 * Haversine query for therapist search (fallback when PostGIS not available)
 * @param params Query parameters
 * @returns SQL query string and parameters
 */
export function buildHaversineQuery(params: TherapistQueryParams): { query: string; queryParams: any[] } {
  const {
    userLat,
    userLng,
    radiusKm,
    diagnosisTags = [],
    practiceTypes = [],
    languages = [],
    acceptingNew,
    onlineOnly = false,
    page,
    pageSize
  } = params

  const queryParams: any[] = []
  let paramIndex = 1

  // Base query with Haversine distance calculation
  let query = `
    SELECT 
      t.id,
      t.name,
      t.city,
      t.latitude,
      t.longitude,
      (
        6371 * acos(
          cos(radians($${paramIndex})) * 
          cos(radians(t.latitude)) * 
          cos(radians(t.longitude) - radians($${paramIndex + 1})) + 
          sin(radians($${paramIndex})) * 
          sin(radians(t.latitude))
        )
      ) AS distanceKm,
      t.diagnosis_tags as "diagnosisTags",
      t.practice_type as "practiceType",
      t.languages,
      t.accepting_new as "acceptingNew",
      t.rating,
      t.price_range as "priceRange",
      t.tags
    FROM therapists t
    WHERE 1=1
  `

  queryParams.push(userLat, userLng)
  paramIndex += 2

  // Online-only: skip geo filter, only filter by practice type
  if (onlineOnly) {
    query += ` AND t.practice_type = 'online'`
  } else {
    // Haversine geo filter: compare radiusKm to computed km (not meters)
    query += ` AND (
      6371 * acos(
        cos(radians($${paramIndex - 2})) * 
        cos(radians(t.latitude)) * 
        cos(radians(t.longitude) - radians($${paramIndex - 1})) + 
        sin(radians($${paramIndex - 2})) * 
        sin(radians(t.latitude))
      )
    ) <= $${paramIndex}`
    queryParams.push(radiusKm)
    paramIndex++
  }

  // Diagnosis tags: array intersection (OR logic)
  if (diagnosisTags.length > 0) {
    query += ` AND array_length(
      ARRAY(
        SELECT UNNEST(t.diagnosis_tags) 
        INTERSECT 
        SELECT UNNEST($${paramIndex}::text[])
      ), 1
    ) > 0`
    queryParams.push(diagnosisTags)
    paramIndex++
  }

  // Practice types filter
  if (practiceTypes.length > 0) {
    query += ` AND t.practice_type = ANY($${paramIndex}::text[])`
    queryParams.push(practiceTypes)
    paramIndex++
  }

  // Languages filter (only if mustHave)
  if (languages.length > 0) {
    query += ` AND array_length(
      ARRAY(
        SELECT UNNEST(t.languages) 
        INTERSECT 
        SELECT UNNEST($${paramIndex}::text[])
      ), 1
    ) > 0`
    queryParams.push(languages)
    paramIndex++
  }

  // Accepting new patients (only if explicitly requested)
  if (acceptingNew !== undefined) {
    query += ` AND t.accepting_new = $${paramIndex}`
    queryParams.push(acceptingNew)
    paramIndex++
  }

  // Order by distance (or score for online)
  if (onlineOnly) {
    query += ` ORDER BY t.rating DESC, t.name ASC`
  } else {
    query += ` ORDER BY distanceKm ASC, t.rating DESC`
  }

  // Pagination
  const offset = (page - 1) * pageSize
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  queryParams.push(pageSize, offset)

  return { query, queryParams }
}

/**
 * Check if PostGIS is available in the database
 * @returns Promise<boolean>
 */
export async function isPostGISAvailable(): Promise<boolean> {
  try {
    // This would be implemented based on your database connection
    // For now, return false to use Haversine fallback
    return false
  } catch (error) {
    console.warn('PostGIS availability check failed, using Haversine fallback:', error)
    return false
  }
}

/**
 * Execute therapist search query
 * @param params Query parameters
 * @returns Promise<TherapistQueryResult[]>
 */
export async function executeTherapistQuery(params: TherapistQueryParams): Promise<TherapistQueryResult[]> {
  const usePostGIS = await isPostGISAvailable()
  
  if (usePostGIS) {
    const { query, queryParams } = buildPostGISQuery(params)
    console.log('Using PostGIS query:', query)
    // Execute PostGIS query here
    // return await db.query(query, queryParams)
  } else {
    const { query, queryParams } = buildHaversineQuery(params)
    console.log('Using Haversine query:', query)
    // Execute Haversine query here
    // return await db.query(query, queryParams)
  }
  
  // For now, return empty array since we don't have database connection
  return []
}
