// Mock availability data for therapists
// Provides believable availability patterns without real calendar integrations

import { TherapistAvailability, generateMockAvailability } from '@/lib/types/availability';

// Pre-generated availability for known therapists
const mockAvailabilityData: Record<string, TherapistAvailability> = {};

// Generate availability for a therapist
export function getTherapistAvailability(therapistId: string): TherapistAvailability {
  if (!mockAvailabilityData[therapistId]) {
    mockAvailabilityData[therapistId] = generateMockAvailability(therapistId);
  }
  return mockAvailabilityData[therapistId];
}

// Update availability (for future real calendar integration)
export function updateTherapistAvailability(
  therapistId: string, 
  availability: TherapistAvailability
): void {
  mockAvailabilityData[therapistId] = availability;
}

// Get availability for multiple therapists
export function getMultipleTherapistAvailability(therapistIds: string[]): Record<string, TherapistAvailability> {
  const result: Record<string, TherapistAvailability> = {};
  
  therapistIds.forEach(id => {
    result[id] = getTherapistAvailability(id);
  });
  
  return result;
}

// Check if therapist has availability in next N days
export function hasAvailabilityInNextDays(
  therapistId: string, 
  days: number = 7
): boolean {
  const availability = getTherapistAvailability(therapistId);
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  if (availability.nextAvailableSlot) {
    const nextSlot = new Date(availability.nextAvailableSlot);
    return nextSlot <= futureDate;
  }
  
  return false;
}

// Get therapists with availability in next N days
export function getTherapistsWithAvailability(
  therapistIds: string[], 
  days: number = 7
): string[] {
  return therapistIds.filter(id => hasAvailabilityInNextDays(id, days));
}
