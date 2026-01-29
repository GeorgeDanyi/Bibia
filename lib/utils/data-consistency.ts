// Data consistency checker for therapist data and search results

import { Therapist } from '@/lib/types/therapist'
import { telemetry } from './telemetry'

export interface ConsistencyIssue {
  type: 'missing_field' | 'invalid_value' | 'data_mismatch' | 'duplicate' | 'outdated'
  severity: 'low' | 'medium' | 'high' | 'critical'
  field: string
  message: string
  expected?: any
  actual?: any
  therapistId?: string
}

export interface ConsistencyReport {
  totalTherapists: number
  issuesFound: number
  issues: ConsistencyIssue[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

// Check therapist data consistency
export function checkTherapistConsistency(therapist: Therapist): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []

  // Check required fields
  if (!therapist.id || therapist.id.trim() === '') {
    issues.push({
      type: 'missing_field',
      severity: 'critical',
      field: 'id',
      message: 'Therapist ID is missing or empty',
      therapistId: therapist.id
    })
  }

  if (!therapist.fullName || therapist.fullName.trim() === '') {
    issues.push({
      type: 'missing_field',
      severity: 'high',
      field: 'fullName',
      message: 'Therapist name is missing or empty',
      therapistId: therapist.id
    })
  }

  if (!therapist.city || therapist.city.trim() === '') {
    issues.push({
      type: 'missing_field',
      severity: 'high',
      field: 'city',
      message: 'Therapist city is missing or empty',
      therapistId: therapist.id
    })
  }

  // Check coordinates
  if (typeof therapist.latitude !== 'number' || therapist.latitude < -90 || therapist.latitude > 90) {
    issues.push({
      type: 'invalid_value',
      severity: 'high',
      field: 'latitude',
      message: 'Invalid latitude value',
      expected: 'number between -90 and 90',
      actual: therapist.latitude,
      therapistId: therapist.id
    })
  }

  if (typeof therapist.longitude !== 'number' || therapist.longitude < -180 || therapist.longitude > 180) {
    issues.push({
      type: 'invalid_value',
      severity: 'high',
      field: 'longitude',
      message: 'Invalid longitude value',
      expected: 'number between -180 and 180',
      actual: therapist.longitude,
      therapistId: therapist.id
    })
  }

  // Check Czech Republic bounds (approximate)
  if (therapist.latitude && therapist.longitude) {
    if (therapist.latitude < 48.5 || therapist.latitude > 51.1 || 
        therapist.longitude < 12.0 || therapist.longitude > 18.9) {
      issues.push({
        type: 'invalid_value',
        severity: 'medium',
        field: 'coordinates',
        message: 'Coordinates appear to be outside Czech Republic',
        expected: 'Czech Republic bounds',
        actual: { lat: therapist.latitude, lng: therapist.longitude },
        therapistId: therapist.id
      })
    }
  }

  // Check languages
  if (!Array.isArray(therapist.languages) || therapist.languages.length === 0) {
    issues.push({
      type: 'missing_field',
      severity: 'medium',
      field: 'languages',
      message: 'Languages array is missing or empty',
      therapistId: therapist.id
    })
  } else {
    const validLanguages = ['cs', 'en', 'de', 'ru', 'uk', 'sk', 'fr', 'es', 'it']
    const invalidLanguages = therapist.languages.filter(lang => !validLanguages.includes(lang))
    if (invalidLanguages.length > 0) {
      issues.push({
        type: 'invalid_value',
        severity: 'low',
        field: 'languages',
        message: 'Invalid language codes found',
        expected: 'valid language codes',
        actual: invalidLanguages,
        therapistId: therapist.id
      })
    }
  }

  // Check practice type
  const validPracticeTypes = ['private', 'clinic', 'hospital', 'home_visits', 'online']
  if (!validPracticeTypes.includes(therapist.practiceType)) {
    issues.push({
      type: 'invalid_value',
      severity: 'medium',
      field: 'practiceType',
      message: 'Invalid practice type',
      expected: validPracticeTypes,
      actual: therapist.practiceType,
      therapistId: therapist.id
    })
  }

  // Check rating
  if (therapist.rating) {
    if (typeof therapist.rating.average !== 'number' || 
        therapist.rating.average < 0 || therapist.rating.average > 5) {
      issues.push({
        type: 'invalid_value',
        severity: 'medium',
        field: 'rating.average',
        message: 'Invalid rating average',
        expected: 'number between 0 and 5',
        actual: therapist.rating.average,
        therapistId: therapist.id
      })
    }

    if (typeof therapist.rating.count !== 'number' || therapist.rating.count < 0) {
      issues.push({
        type: 'invalid_value',
        severity: 'low',
        field: 'rating.count',
        message: 'Invalid rating count',
        expected: 'non-negative number',
        actual: therapist.rating.count,
        therapistId: therapist.id
      })
    }
  }

  // Check price
  if (typeof therapist.pricePerSession !== 'number' || therapist.pricePerSession < 0) {
    issues.push({
      type: 'invalid_value',
      severity: 'medium',
      field: 'pricePerSession',
      message: 'Invalid price per session',
      expected: 'non-negative number',
      actual: therapist.pricePerSession,
      therapistId: therapist.id
    })
  }

  // Check price range consistency
  if (therapist.priceRange) {
    if (therapist.priceRange.minCZK > therapist.priceRange.maxCZK) {
      issues.push({
        type: 'data_mismatch',
        severity: 'medium',
        field: 'priceRange',
        message: 'Minimum price is higher than maximum price',
        expected: 'minCZK <= maxCZK',
        actual: { min: therapist.priceRange.minCZK, max: therapist.priceRange.maxCZK },
        therapistId: therapist.id
      })
    }

    if (therapist.pricePerSession && 
        (therapist.pricePerSession < therapist.priceRange.minCZK || 
         therapist.pricePerSession > therapist.priceRange.maxCZK)) {
      issues.push({
        type: 'data_mismatch',
        severity: 'low',
        field: 'price_consistency',
        message: 'Price per session is outside price range',
        expected: 'pricePerSession within priceRange',
        actual: { 
          pricePerSession: therapist.pricePerSession,
          range: therapist.priceRange 
        },
        therapistId: therapist.id
      })
    }
  }

  // Check experience
  if (typeof therapist.yearsExperience !== 'number' || 
      therapist.yearsExperience < 0 || therapist.yearsExperience > 50) {
    issues.push({
      type: 'invalid_value',
      severity: 'low',
      field: 'yearsExperience',
      message: 'Invalid years of experience',
      expected: 'number between 0 and 50',
      actual: therapist.yearsExperience,
      therapistId: therapist.id
    })
  }

  // Check specialties and diagnosis tags
  if (!Array.isArray(therapist.specialties) || therapist.specialties.length === 0) {
    issues.push({
      type: 'missing_field',
      severity: 'medium',
      field: 'specialties',
      message: 'Specialties array is missing or empty',
      therapistId: therapist.id
    })
  }

  if (!Array.isArray(therapist.diagnosisTags)) {
    issues.push({
      type: 'missing_field',
      severity: 'low',
      field: 'diagnosisTags',
      message: 'Diagnosis tags array is missing',
      therapistId: therapist.id
    })
  }

  // Check last active date
  if (therapist.lastActive) {
    const lastActiveDate = new Date(therapist.lastActive)
    if (isNaN(lastActiveDate.getTime())) {
      issues.push({
        type: 'invalid_value',
        severity: 'low',
        field: 'lastActive',
        message: 'Invalid last active date format',
        expected: 'valid ISO date string',
        actual: therapist.lastActive,
        therapistId: therapist.id
      })
    } else {
      const daysSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceActive > 365) {
        issues.push({
          type: 'outdated',
          severity: 'medium',
          field: 'lastActive',
          message: 'Therapist data appears outdated',
          expected: 'recent activity',
          actual: `${Math.round(daysSinceActive)} days ago`,
          therapistId: therapist.id
        })
      }
    }
  }

  return issues
}

// Check dataset consistency
export function checkDatasetConsistency(therapists: Therapist[]): ConsistencyReport {
  const allIssues: ConsistencyIssue[] = []
  const therapistIds = new Set<string>()
  const duplicateIds: string[] = []

  // Check each therapist
  for (const therapist of therapists) {
    const issues = checkTherapistConsistency(therapist)
    allIssues.push(...issues)

    // Check for duplicate IDs
    if (therapist.id) {
      if (therapistIds.has(therapist.id)) {
        duplicateIds.push(therapist.id)
        allIssues.push({
          type: 'duplicate',
          severity: 'critical',
          field: 'id',
          message: 'Duplicate therapist ID found',
          actual: therapist.id,
          therapistId: therapist.id
        })
      } else {
        therapistIds.add(therapist.id)
      }
    }
  }

  // Calculate summary
  const summary = {
    critical: allIssues.filter(i => i.severity === 'critical').length,
    high: allIssues.filter(i => i.severity === 'high').length,
    medium: allIssues.filter(i => i.severity === 'medium').length,
    low: allIssues.filter(i => i.severity === 'low').length
  }

  // Log critical and high severity issues
  allIssues
    .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
    .forEach(issue => {
      telemetry.logDataConsistencyIssue('dataset_check', issue.message, {
        therapistId: issue.therapistId,
        field: issue.field,
        severity: issue.severity
      })
    })

  return {
    totalTherapists: therapists.length,
    issuesFound: allIssues.length,
    issues: allIssues,
    summary
  }
}

// Check search result consistency
export function checkSearchResultConsistency(results: any[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []

  // Check for required fields in results
  for (const result of results) {
    if (!result.therapist || !result.therapist.id) {
      issues.push({
        type: 'missing_field',
        severity: 'critical',
        field: 'therapist.id',
        message: 'Search result missing therapist ID'
      })
      continue
    }

    // Check score consistency
    if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
      issues.push({
        type: 'invalid_value',
        severity: 'medium',
        field: 'score',
        message: 'Invalid match score',
        expected: 'number between 0 and 100',
        actual: result.score,
        therapistId: result.therapist.id
      })
    }

    // Check distance consistency
    if (typeof result.distanceKm !== 'number' || result.distanceKm < 0) {
      issues.push({
        type: 'invalid_value',
        severity: 'medium',
        field: 'distanceKm',
        message: 'Invalid distance value',
        expected: 'non-negative number',
        actual: result.distanceKm,
        therapistId: result.therapist.id
      })
    }

    // Check match reasons
    if (!Array.isArray(result.matchReasons)) {
      issues.push({
        type: 'missing_field',
        severity: 'low',
        field: 'matchReasons',
        message: 'Match reasons should be an array',
        therapistId: result.therapist.id
      })
    }
  }

  return issues
}

// Auto-fix common issues
export function autoFixTherapistData(therapist: Therapist): Therapist {
  const fixed = { ...therapist }

  // Fix empty strings
  if (fixed.fullName && fixed.fullName.trim() === '') {
    fixed.fullName = 'Unknown Therapist'
  }

  if (fixed.city && fixed.city.trim() === '') {
    fixed.city = 'Unknown City'
  }

  // Fix invalid coordinates (use Prague as fallback)
  if (typeof fixed.latitude !== 'number' || fixed.latitude < -90 || fixed.latitude > 90) {
    fixed.latitude = 50.0755
  }

  if (typeof fixed.longitude !== 'number' || fixed.longitude < -180 || fixed.longitude > 180) {
    fixed.longitude = 14.4378
  }

  // Fix empty arrays
  if (!Array.isArray(fixed.languages)) {
    fixed.languages = ['cs']
  }

  if (!Array.isArray(fixed.specialties)) {
    fixed.specialties = ['general']
  }

  if (!Array.isArray(fixed.diagnosisTags)) {
    fixed.diagnosisTags = []
  }

  // Fix invalid practice type
  const validPracticeTypes = ['private', 'clinic', 'hospital', 'home_visits', 'online']
  if (!validPracticeTypes.includes(fixed.practiceType)) {
    fixed.practiceType = 'private'
  }

  // Fix invalid rating
  if (fixed.rating) {
    if (typeof fixed.rating.average !== 'number' || fixed.rating.average < 0 || fixed.rating.average > 5) {
      fixed.rating.average = 0
    }
    if (typeof fixed.rating.count !== 'number' || fixed.rating.count < 0) {
      fixed.rating.count = 0
    }
  }

  // Fix invalid price
  if (typeof fixed.pricePerSession !== 'number' || fixed.pricePerSession < 0) {
    fixed.pricePerSession = 0
  }

  // Fix invalid experience
  if (typeof fixed.yearsExperience !== 'number' || fixed.yearsExperience < 0 || fixed.yearsExperience > 50) {
    fixed.yearsExperience = 0
  }

  return fixed
}
