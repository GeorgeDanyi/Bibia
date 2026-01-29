/**
 * Utility functions for consistent display of therapist information
 */

export interface TherapistDisplayData {
  id: string;
  distanceKm?: number;
  nextAvailableSlot?: string;
  rating?: number | { avg: number; count: number };
  yearsExp?: number;
  specialties?: string[];
  diagnosisHighlights?: string[];
  languages?: string[];
}

export interface AvailabilityDisplay {
  text: string;
  tone: 'emerald' | 'teal' | 'slate';
  urgency: 'high' | 'medium' | 'low';
}

export interface DistanceDisplay {
  text: string;
  tone: 'emerald' | 'teal' | 'slate';
}

/**
 * Get consistent availability display
 */
export function getConsistentAvailabilityDisplay(therapist: TherapistDisplayData): AvailabilityDisplay {
  if (!therapist.nextAvailableSlot) {
    return {
      text: 'Kontaktujte pro termín',
      tone: 'slate',
      urgency: 'low'
    };
  }

  const daysUntil = Math.ceil((new Date(therapist.nextAvailableSlot).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil <= 1) {
    return {
      text: 'Dnes/zítra',
      tone: 'emerald',
      urgency: 'high'
    };
  } else if (daysUntil <= 3) {
    return {
      text: `za ${daysUntil} dny`,
      tone: 'emerald',
      urgency: 'high'
    };
  } else if (daysUntil <= 7) {
    return {
      text: `za ${daysUntil} dní`,
      tone: 'teal',
      urgency: 'medium'
    };
  } else if (daysUntil <= 14) {
    return {
      text: `za ${daysUntil} dní`,
      tone: 'teal',
      urgency: 'medium'
    };
  } else {
    return {
      text: `za ${daysUntil} dní`,
      tone: 'slate',
      urgency: 'low'
    };
  }
}

/**
 * Get consistent distance display
 */
export function getConsistentDistanceDisplay(therapist: TherapistDisplayData): DistanceDisplay {
  if (typeof therapist.distanceKm !== 'number') {
    return {
      text: 'Vzdálenost neznámá',
      tone: 'slate'
    };
  }

  const distance = therapist.distanceKm;
  
  if (distance <= 5) {
    return {
      text: `${distance.toFixed(1)} km`,
      tone: 'emerald'
    };
  } else if (distance <= 15) {
    return {
      text: `${distance.toFixed(0)} km`,
      tone: 'emerald'
    };
  } else if (distance <= 30) {
    return {
      text: `${distance.toFixed(0)} km`,
      tone: 'teal'
    };
  } else {
    return {
      text: `${distance.toFixed(0)} km`,
      tone: 'slate'
    };
  }
}

/**
 * Get consistent language display
 */
export function getConsistentLanguageDisplay(languages?: string[]): string[] {
  if (!languages || languages.length === 0) {
    return ['CZ'];
  }
  
  return languages.slice(0, 2).map(lang => {
    const langMap: Record<string, string> = {
      'cs': 'CZ',
      'en': 'EN', 
      'de': 'DE',
      'ru': 'RU',
      'uk': 'UK',
      'sk': 'SK'
    };
    return langMap[lang.toLowerCase()] || lang.toUpperCase();
  });
}

/**
 * Get consistent rating display
 */
export function getConsistentRatingDisplay(rating?: number | { avg: number; count: number }): string | null {
  if (!rating) return null;
  
  const avg = typeof rating === 'number' ? rating : rating.avg;
  return avg.toFixed(1);
}

/**
 * Get consistent experience display
 */
export function getConsistentExperienceDisplay(yearsExp?: number): string | null {
  if (!yearsExp) return null;
  
  if (yearsExp >= 20) {
    return `${yearsExp}+ let`;
  } else if (yearsExp >= 10) {
    return `${yearsExp} let`;
  } else {
    return `${yearsExp} let`;
  }
}
