// Availability types for Bibia platform
// Provides believable availability without real calendar integrations

export interface TimeSlot {
  start: string; // ISO time "09:00"
  end: string;   // ISO time "10:00"
  available: boolean;
}

export interface DayAvailability {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  slots: TimeSlot[];
  isAvailable: boolean;
}

export interface TherapistAvailability {
  therapistId: string;
  availability: DayAvailability[];
  nextAvailableSlot?: string; // ISO datetime
  bookingLeadTime: number; // hours
  maxAdvanceBooking: number; // days
}

export interface AvailabilityPreferences {
  preferredDays: string[]; // ['Mon', 'Tue', 'Wed']
  preferredTimes: string[]; // ['morning', 'afternoon', 'evening']
  urgency: 'asap' | 'this-week' | 'flexible';
  maxDistance: number; // km
}

// Mock availability generator
export function generateMockAvailability(therapistId: string): TherapistAvailability {
  const days: DayAvailability['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' }
  ];

  const availability: DayAvailability[] = days.map(day => {
    // Generate random availability pattern
    const isWorkingDay = !['Sat', 'Sun'].includes(day);
    const isAvailable = isWorkingDay && Math.random() > 0.2; // 80% chance of availability
    
    const slots = timeSlots.map(slot => ({
      ...slot,
      available: isAvailable && Math.random() > 0.3 // 70% chance slot is available
    }));

    return {
      day,
      slots,
      isAvailable
    };
  });

  // Generate next available slot (within next 2 weeks)
  const now = new Date();
  const nextAvailableDate = new Date(now.getTime() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000);
  const nextAvailableSlot = nextAvailableDate.toISOString();

  return {
    therapistId,
    availability,
    nextAvailableSlot,
    bookingLeadTime: Math.floor(Math.random() * 24) + 1, // 1-24 hours
    maxAdvanceBooking: 90 // 90 days
  };
}

// Format next available slot for display
export function formatNextSlot(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return 'Zítra';
  } else if (diffDays <= 7) {
    return `Za ${diffDays} dní`;
  } else if (diffDays <= 14) {
    return 'Za 1-2 týdny';
  } else {
    return 'Za více než 2 týdny';
  }
}

// Check if therapist is available for specific time preferences
export function checkAvailabilityMatch(
  therapistAvailability: TherapistAvailability,
  userPreferences: AvailabilityPreferences
): boolean {
  const { availability } = therapistAvailability;
  
  // Check if any preferred days have availability
  const hasPreferredDays = userPreferences.preferredDays.some(day => {
    const dayAvailability = availability.find(a => a.day === day);
    return dayAvailability?.isAvailable && dayAvailability.slots.some(slot => slot.available);
  });
  
  return hasPreferredDays;
}

// Get next available slots for a therapist
export function getNextAvailableSlots(
  therapistAvailability: TherapistAvailability,
  count: number = 3
): string[] {
  const { availability, nextAvailableSlot } = therapistAvailability;
  const slots: string[] = [];
  
  if (nextAvailableSlot) {
    slots.push(nextAvailableSlot);
  }
  
  // Generate additional mock slots
  for (let i = 1; i < count; i++) {
    const baseDate = new Date(nextAvailableSlot || new Date());
    const futureDate = new Date(baseDate.getTime() + (i * 2 + Math.random() * 3) * 24 * 60 * 60 * 1000);
    slots.push(futureDate.toISOString());
  }
  
  return slots.sort();
}
