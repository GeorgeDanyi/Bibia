/**
 * Availability Status Utility
 * 
 * Centralized logic for determining therapist availability status.
 * This prepares the foundation for future calendar integration.
 * 
 * Currently uses match score as a proxy for availability (UI only).
 * In the future, this will be replaced with real calendar data.
 */

import { AvailabilityState, getAvailabilityStateConfig } from '@/lib/constants/availability-states'
import type { AvailabilityStateConfig } from '@/lib/constants/availability-states'

/**
 * Determine availability state based on match score
 * 
 * This is a temporary UI-only implementation. In the future, this will
 * be replaced with real calendar availability data.
 * 
 * @param matchPercent - Match score percentage (0-100) or null
 * @returns AvailabilityState
 */
export function determineAvailabilityState(matchPercent: number | null): AvailabilityState {
  if (matchPercent === null) {
    return AvailabilityState.FULL
  }

  if (matchPercent >= 75) {
    return AvailabilityState.AVAILABLE
  } else if (matchPercent >= 55) {
    return AvailabilityState.LIMITED
  } else {
    return AvailabilityState.FULL
  }
}

/**
 * Get availability status configuration for display
 * 
 * @param matchPercent - Match score percentage (0-100) or null
 * @returns AvailabilityStateConfig with label, colors, etc.
 */
export function getAvailabilityStatus(matchPercent: number | null): AvailabilityStateConfig {
  const state = determineAvailabilityState(matchPercent)
  return getAvailabilityStateConfig(state)
}

/**
 * Future: Get availability status from therapist data
 * 
 * This function signature is prepared for future calendar integration.
 * Currently returns a mock status based on match score.
 * 
 * @param therapist - Therapist data (will include calendar data in future)
 * @param matchPercent - Current match score (temporary proxy)
 * @returns AvailabilityStateConfig
 */
export function getTherapistAvailabilityStatus(
  therapist: any,
  matchPercent: number | null
): AvailabilityStateConfig {
  // TODO: Replace with real calendar data when available
  // const calendarData = therapist.calendarAvailability
  // if (calendarData) {
  //   return getAvailabilityFromCalendar(calendarData)
  // }
  
  // Temporary: Use match score as proxy
  return getAvailabilityStatus(matchPercent)
}

