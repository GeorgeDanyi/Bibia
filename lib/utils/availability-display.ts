// Display logic for therapist availability
// Implements the specific requirements for Part B

import { Therapist } from '@/lib/types/therapist';

export interface AvailabilityDisplay {
  status: 'not-accepting' | 'available' | 'waiting';
  message: string;
  nextAvailableDays?: number;
  availabilityScore: number;
}

export interface UserPreferences {
  timePreferences: string[]; // ['morning', 'afternoon', 'evening', 'weekend']
  urgency: 'asap' | 'this-week' | 'flexible';
}

/**
 * Get availability display information for a therapist
 */
export function getAvailabilityDisplay(
  therapist: Therapist,
  userPreferences?: UserPreferences
): AvailabilityDisplay {
  // 1. Check if therapist is accepting new clients
  if (!therapist.acceptingNew) {
    return {
      status: 'not-accepting',
      message: 'Nepřijímá nové klienty',
      availabilityScore: 0
    };
  }

  // 2. Check next available days
  if (therapist.nextAvailableDays !== null) {
    const days = therapist.nextAvailableDays;
    let message: string;
    
    // Cap absurd values to prevent "419 days" scenarios
    const cappedDays = Math.min(days, 30); // Cap at 30 days maximum
    
    if (cappedDays === 0) {
      message = 'Nejbližší termín: dnes';
    } else if (cappedDays === 1) {
      message = 'Nejbližší termín: zítra';
    } else if (cappedDays <= 7) {
      message = `Nejbližší termín: za ${cappedDays} dní`;
    } else if (cappedDays <= 14) {
      message = `Nejbližší termín: za ${cappedDays} dní`;
    } else if (cappedDays <= 21) {
      message = `Nejbližší termín: za ${cappedDays} dní`;
    } else {
      message = 'Nejbližší termín: za více než 3 týdny';
    }

    return {
      status: 'waiting',
      message,
      nextAvailableDays: days,
      availabilityScore: calculateAvailabilityScore(therapist, userPreferences)
    };
  }

  // 3. Available now
  return {
    status: 'available',
    message: 'Dostupný',
    availabilityScore: calculateAvailabilityScore(therapist, userPreferences)
  };
}

/**
 * Calculate availability score based on working hours and user preferences
 */
function calculateAvailabilityScore(
  therapist: Therapist,
  userPreferences?: UserPreferences
): number {
  if (!userPreferences?.timePreferences || userPreferences.timePreferences.length === 0) {
    return 50; // Neutral score if no preferences
  }

  const { workingHours } = therapist;
  const { timePreferences } = userPreferences;
  
  let score = 0;
  let totalMatches = 0;

  // Map user preferences to working hours
  for (const preference of timePreferences) {
    let matches = false;
    
    switch (preference) {
      case 'morning':
        matches = workingHours.morning;
        break;
      case 'lateMorning':
      case 'afternoon':
        matches = workingHours.midday;
        break;
      case 'evening':
        matches = workingHours.evening;
        break;
      case 'weekend':
        matches = workingHours.weekend;
        break;
    }
    
    if (matches) {
      score += 25; // Each match adds 25 points
    }
    totalMatches++;
  }

  // Calculate final score (0-100)
  const finalScore = totalMatches > 0 ? (score / totalMatches) * 4 : 50;
  
  // Apply urgency multiplier
  let multiplier = 1.0;
  if (userPreferences.urgency === 'asap') {
    multiplier = 1.2;
  } else if (userPreferences.urgency === 'this-week') {
    multiplier = 1.1;
  }
  
  // Apply "Co nejdřív" boost for therapists available within 7 days
  if (therapist.nextAvailableDays !== null && therapist.nextAvailableDays <= 7) {
    multiplier += 0.1; // +10% rank boost
  }
  
  return Math.min(100, Math.round(finalScore * multiplier));
}

/**
 * Get availability status for display in UI
 */
export function getAvailabilityStatus(therapist: Therapist): string {
  const display = getAvailabilityDisplay(therapist);
  return display.message;
}

/**
 * Check if therapist matches user time preferences
 */
export function matchesTimePreferences(
  therapist: Therapist,
  timePreferences: string[]
): boolean {
  if (!timePreferences || timePreferences.length === 0) {
    return true; // No preferences = matches all
  }

  const { workingHours } = therapist;
  
  for (const preference of timePreferences) {
    let matches = false;
    
    switch (preference) {
      case 'morning':
        matches = workingHours.morning;
        break;
      case 'lateMorning':
      case 'afternoon':
        matches = workingHours.midday;
        break;
      case 'evening':
        matches = workingHours.evening;
        break;
      case 'weekend':
        matches = workingHours.weekend;
        break;
    }
    
    if (matches) {
      return true; // At least one preference matches
    }
  }
  
  return false;
}

/**
 * Get working hours display for therapist
 */
export function getWorkingHoursDisplay(therapist: Therapist): string[] {
  const { workingHours } = therapist;
  const hours: string[] = [];
  
  if (workingHours.morning) hours.push('Ráno (7-11)');
  if (workingHours.midday) hours.push('Dopoledne (11-15)');
  if (workingHours.evening) hours.push('Večer (15-19)');
  if (workingHours.weekend) hours.push('Víkend');
  
  return hours;
}

/**
 * Get availability score for sorting
 */
export function getAvailabilityScore(
  therapist: Therapist,
  userPreferences?: UserPreferences
): number {
  const display = getAvailabilityDisplay(therapist, userPreferences);
  return display.availabilityScore;
}
