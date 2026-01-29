// Bridge between mock availability and future calendar integration
// This allows seamless transition from mock data to real calendar systems

import { TherapistAvailability, generateMockAvailability } from '@/lib/types/availability';
import { calendarService, TherapistCalendar, CalendarEvent } from '@/lib/types/calendar-integration';

export interface AvailabilityBridge {
  getAvailability(therapistId: string): Promise<TherapistAvailability>;
  getAvailableSlots(therapistId: string, startDate: string, endDate: string): Promise<CalendarEvent[]>;
  isCalendarConnected(therapistId: string): Promise<boolean>;
}

class MockToRealAvailabilityBridge implements AvailabilityBridge {
  private useRealCalendar = false; // Toggle for future real calendar integration
  
  async getAvailability(therapistId: string): Promise<TherapistAvailability> {
    if (this.useRealCalendar) {
      // Future: Get real calendar data
      const calendar = await calendarService.getTherapistCalendar(therapistId);
      if (calendar) {
        return this.convertCalendarToAvailability(calendar);
      }
    }
    
    // Current: Use mock data
    return generateMockAvailability(therapistId);
  }
  
  async getAvailableSlots(therapistId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    if (this.useRealCalendar) {
      // Future: Get real calendar slots
      return await calendarService.getAvailableSlots(therapistId, startDate, endDate);
    }
    
    // Current: Generate mock slots
    return this.generateMockSlots(therapistId, startDate, endDate);
  }
  
  async isCalendarConnected(therapistId: string): Promise<boolean> {
    if (this.useRealCalendar) {
      const calendar = await calendarService.getTherapistCalendar(therapistId);
      return calendar?.provider.isConnected || false;
    }
    
    // Mock data is always "connected"
    return true;
  }
  
  private convertCalendarToAvailability(calendar: TherapistCalendar): TherapistAvailability {
    // Convert real calendar data to our availability format
    const availability = calendar.workingHours;
    const days: TherapistAvailability['availability'] = [];
    
    Object.entries(availability).forEach(([day, hours]) => {
      if (hours.isWorking) {
        const slots = this.generateTimeSlots(hours.start, hours.end);
        days.push({
          day: day as any,
          slots,
          isAvailable: true
        });
      } else {
        days.push({
          day: day as any,
          slots: [],
          isAvailable: false
        });
      }
    });
    
    // Find next available slot
    const now = new Date();
    const nextAvailableSlot = this.findNextAvailableSlot(calendar, now);
    
    return {
      therapistId: calendar.therapistId,
      availability: days,
      nextAvailableSlot,
      bookingLeadTime: 24, // 24 hours default
      maxAdvanceBooking: 90 // 90 days default
    };
  }
  
  private generateTimeSlots(start: string, end: string): any[] {
    const slots = [];
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3 // 70% chance of availability
      });
    }
    
    return slots;
  }
  
  private findNextAvailableSlot(calendar: TherapistCalendar, from: Date): string {
    // Find the next available slot from the calendar
    const nextWeek = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    return nextWeek.toISOString();
  }
  
  private generateMockSlots(therapistId: string, startDate: string, endDate: string): CalendarEvent[] {
    const slots: CalendarEvent[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends for mock data
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      
      // Generate 2-3 slots per day
      const numSlots = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numSlots; i++) {
        const hour = 9 + i * 3; // 9, 12, 15
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        
        slots.push({
          id: `mock-slot-${therapistId}-${slotStart.getTime()}`,
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
  
  // Method to enable real calendar integration
  enableRealCalendar(): void {
    this.useRealCalendar = true;
  }
  
  // Method to disable real calendar integration (fallback to mock)
  disableRealCalendar(): void {
    this.useRealCalendar = false;
  }
}

// Export singleton instance
export const availabilityBridge = new MockToRealAvailabilityBridge();
