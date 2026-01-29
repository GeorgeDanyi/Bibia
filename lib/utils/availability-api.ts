// getAvailability API with preferences matching
// Implements Part B requirements for future seam

import { Therapist } from '@/lib/types/therapist';
import { getAvailabilityDisplay, UserPreferences } from '@/lib/utils/availability-display';

export interface AvailabilityResult {
  hasSlots: boolean;
  nextSlotIso?: string;
  availabilityScore: number;
  status: 'not-accepting' | 'available' | 'waiting';
  message: string;
  nextAvailableDays?: number;
}

export interface AvailabilityPreferences {
  timePreferences: string[]; // ['morning', 'afternoon', 'evening', 'weekend']
  urgency: 'asap' | 'this-week' | 'flexible';
  maxDistance?: number; // km
  city?: string;
}

/**
 * Get availability for a therapist with user preferences
 * Today = stub implementation, later = real calendars
 */
export function getAvailability(
  therapistId: string,
  preferences: AvailabilityPreferences
): AvailabilityResult {
  // TODO: Replace with real therapist lookup
  // For now, this is a stub implementation
  const therapist = getTherapistStub(therapistId);
  
  if (!therapist) {
    return {
      hasSlots: false,
      availabilityScore: 0,
      status: 'not-accepting',
      message: 'Terapeut nenalezen'
    };
  }
  
  // Get availability display information
  const userPrefs: UserPreferences = {
    timePreferences: preferences.timePreferences,
    urgency: preferences.urgency
  };
  
  const display = getAvailabilityDisplay(therapist, userPrefs);
  
  // Calculate next slot ISO string
  let nextSlotIso: string | undefined;
  if (therapist.nextAvailableDays !== null) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + therapist.nextAvailableDays);
    nextSlotIso = nextDate.toISOString();
  }
  
  // Apply "Co nejdřív" boost for therapists available within 7 days
  let finalScore = display.availabilityScore;
  if (therapist.nextAvailableDays !== null && therapist.nextAvailableDays <= 7) {
    finalScore = Math.min(100, Math.round(finalScore * 1.1)); // +10% boost
  }
  
  return {
    hasSlots: display.status !== 'not-accepting',
    nextSlotIso,
    availabilityScore: finalScore,
    status: display.status,
    message: display.message,
    nextAvailableDays: therapist.nextAvailableDays || undefined
  };
}

/**
 * Get availability for multiple therapists
 */
export function getMultipleAvailability(
  therapistIds: string[],
  preferences: AvailabilityPreferences
): Record<string, AvailabilityResult> {
  const results: Record<string, AvailabilityResult> = {};
  
  therapistIds.forEach(id => {
    results[id] = getAvailability(id, preferences);
  });
  
  return results;
}

/**
 * Filter therapists by availability preferences
 */
export function filterByAvailability(
  therapists: Therapist[],
  preferences: AvailabilityPreferences
): Therapist[] {
  return therapists.filter(therapist => {
    const result = getAvailability(therapist.id, preferences);
    return result.hasSlots;
  });
}

/**
 * Sort therapists by availability score
 */
export function sortByAvailability(
  therapists: Therapist[],
  preferences: AvailabilityPreferences
): Therapist[] {
  return therapists
    .map(therapist => ({
      therapist,
      result: getAvailability(therapist.id, preferences)
    }))
    .sort((a, b) => b.result.availabilityScore - a.result.availabilityScore)
    .map(item => item.therapist);
}

/**
 * Get availability statistics for a set of therapists
 */
export function getAvailabilityStats(
  therapists: Therapist[],
  preferences: AvailabilityPreferences
): {
  total: number;
  available: number;
  notAccepting: number;
  waiting: number;
  avgScore: number;
  timePreferenceMatches: number;
} {
  const results = therapists.map(t => getAvailability(t.id, preferences));
  
  const available = results.filter(r => r.status === 'available').length;
  const notAccepting = results.filter(r => r.status === 'not-accepting').length;
  const waiting = results.filter(r => r.status === 'waiting').length;
  
  const avgScore = results.length > 0 
    ? results.reduce((sum, r) => sum + r.availabilityScore, 0) / results.length 
    : 0;
  
  // Count therapists that match time preferences
  const timePreferenceMatches = therapists.filter(therapist => {
    const { workingHours } = therapist;
    return preferences.timePreferences.some(pref => {
      switch (pref) {
        case 'morning': return workingHours.morning;
        case 'afternoon': return workingHours.midday;
        case 'evening': return workingHours.evening;
        case 'weekend': return workingHours.weekend;
        default: return false;
      }
    });
  }).length;
  
  return {
    total: therapists.length,
    available,
    notAccepting,
    waiting,
    avgScore: Math.round(avgScore),
    timePreferenceMatches
  };
}

/**
 * Stub implementation for therapist lookup
 * TODO: Replace with real database/API call
 */
function getTherapistStub(therapistId: string): Therapist | null {
  // This is a stub - in real implementation, this would query the database
  // For now, return a mock therapist for testing
  return {
    id: therapistId,
    fullName: 'Mock Therapist',
    city: 'Praha',
    latitude: 50.0755,
    longitude: 14.4378,
    regions: ['Praha'],
    languages: ['cs'],
    practiceType: 'private',
    acceptingNew: true,
    yearsExperience: 5,
    pricePerSession: 1200,
    nextAvailableDays: 3,
    workingHours: {
      morning: true,
      midday: true,
      evening: false,
      weekend: false
    },
    availability: [],
    specialties: ['Sportovní fyzioterapie'],
    diagnoses: [],
    tags: [],
    diagnosisTags: [],
    modalities: [],
    worksWith: [],
    rating: { average: 4.5, count: 10 },
    reviewsCount: 10,
    bio: 'Mock therapist for testing'
  };
}

/**
 * Future implementation hook for real calendar integration
 */
export async function getAvailabilityFromCalendar(
  therapistId: string,
  preferences: AvailabilityPreferences
): Promise<AvailabilityResult> {
  // TODO: Implement real calendar integration
  // This would:
  // 1. Connect to therapist's calendar (Google, Outlook, etc.)
  // 2. Get real availability data
  // 3. Match against user preferences
  // 4. Return real availability information
  
  console.log(`Getting real calendar availability for therapist ${therapistId}`);
  
  // For now, fallback to stub implementation
  return getAvailability(therapistId, preferences);
}

/**
 * Check if therapist has availability in next N days
 */
export function hasAvailabilityInDays(
  therapist: Therapist,
  days: number
): boolean {
  if (!therapist.acceptingNew) {
    return false;
  }
  
  if (therapist.nextAvailableDays === null) {
    return true; // Available now
  }
  
  return therapist.nextAvailableDays <= days;
}

/**
 * Get therapists available in next N days
 */
export function getTherapistsAvailableInDays(
  therapists: Therapist[],
  days: number
): Therapist[] {
  return therapists.filter(therapist => hasAvailabilityInDays(therapist, days));
}
