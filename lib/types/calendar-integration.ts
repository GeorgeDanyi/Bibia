// Calendar integration interfaces for future real calendar slots
// This provides the structure for integrating with real calendar systems

export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'custom';
  isConnected: boolean;
  lastSync?: string; // ISO datetime
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  isAvailable: boolean;
  isRecurring: boolean;
  recurrencePattern?: string;
}

export interface TherapistCalendar {
  therapistId: string;
  provider: CalendarProvider;
  events: CalendarEvent[];
  workingHours: {
    [key in 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun']: {
      start: string; // "09:00"
      end: string;   // "17:00"
      isWorking: boolean;
    }
  };
  timezone: string;
  lastUpdated: string; // ISO datetime
}

export interface BookingRequest {
  therapistId: string;
  patientId: string;
  requestedStart: string; // ISO datetime
  requestedEnd: string;   // ISO datetime
  notes?: string;
  urgency: 'asap' | 'this-week' | 'flexible';
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  confirmedStart?: string; // ISO datetime
  confirmedEnd?: string;    // ISO datetime
  message?: string;
  alternatives?: {
    start: string;
    end: string;
    reason: string;
  }[];
}

// Future calendar integration service interface
export interface CalendarIntegrationService {
  // Connect therapist's calendar
  connectCalendar(therapistId: string, provider: CalendarProvider): Promise<boolean>;
  
  // Disconnect calendar
  disconnectCalendar(therapistId: string): Promise<boolean>;
  
  // Sync calendar data
  syncCalendar(therapistId: string): Promise<TherapistCalendar>;
  
  // Get available slots
  getAvailableSlots(
    therapistId: string, 
    startDate: string, 
    endDate: string
  ): Promise<CalendarEvent[]>;
  
  // Book appointment
  bookAppointment(request: BookingRequest): Promise<BookingResponse>;
  
  // Cancel appointment
  cancelAppointment(bookingId: string): Promise<boolean>;
  
  // Get therapist's calendar
  getTherapistCalendar(therapistId: string): Promise<TherapistCalendar | null>;
}

// Mock implementation for development
export class MockCalendarIntegrationService implements CalendarIntegrationService {
  async connectCalendar(therapistId: string, provider: CalendarProvider): Promise<boolean> {
    // Mock implementation
    console.log(`Connecting calendar for therapist ${therapistId} with provider ${provider.name}`);
    return true;
  }
  
  async disconnectCalendar(therapistId: string): Promise<boolean> {
    // Mock implementation
    console.log(`Disconnecting calendar for therapist ${therapistId}`);
    return true;
  }
  
  async syncCalendar(therapistId: string): Promise<TherapistCalendar> {
    // Mock implementation - return mock calendar data
    return {
      therapistId,
      provider: {
        id: 'mock-provider',
        name: 'Mock Calendar',
        type: 'custom',
        isConnected: true,
        lastSync: new Date().toISOString()
      },
      events: [],
      workingHours: {
        Mon: { start: '09:00', end: '17:00', isWorking: true },
        Tue: { start: '09:00', end: '17:00', isWorking: true },
        Wed: { start: '09:00', end: '17:00', isWorking: true },
        Thu: { start: '09:00', end: '17:00', isWorking: true },
        Fri: { start: '09:00', end: '17:00', isWorking: true },
        Sat: { start: '10:00', end: '14:00', isWorking: true },
        Sun: { start: '10:00', end: '14:00', isWorking: false }
      },
      timezone: 'Europe/Prague',
      lastUpdated: new Date().toISOString()
    };
  }
  
  async getAvailableSlots(
    therapistId: string, 
    startDate: string, 
    endDate: string
  ): Promise<CalendarEvent[]> {
    // Mock implementation - generate available slots
    const slots: CalendarEvent[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Generate mock available slots for each day
      for (let hour = 9; hour < 17; hour += 2) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        
        slots.push({
          id: `slot-${therapistId}-${slotStart.getTime()}`,
          title: 'Available',
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          isAvailable: true,
          isRecurring: false
        });
      }
    }
    
    return slots;
  }
  
  async bookAppointment(request: BookingRequest): Promise<BookingResponse> {
    // Mock implementation
    console.log(`Booking appointment for therapist ${request.therapistId}`);
    return {
      success: true,
      bookingId: `booking-${Date.now()}`,
      confirmedStart: request.requestedStart,
      confirmedEnd: request.requestedEnd,
      message: 'Appointment booked successfully'
    };
  }
  
  async cancelAppointment(bookingId: string): Promise<boolean> {
    // Mock implementation
    console.log(`Cancelling appointment ${bookingId}`);
    return true;
  }
  
  async getTherapistCalendar(therapistId: string): Promise<TherapistCalendar | null> {
    return this.syncCalendar(therapistId);
  }
}

// Export singleton instance
export const calendarService = new MockCalendarIntegrationService();
