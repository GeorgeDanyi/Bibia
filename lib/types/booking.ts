/**
 * Booking Types - Instant Booking System
 */

export type BookingStatus = 'booked' | 'cancelled'

export interface Booking {
  id: string
  createdAt: Date
  
  // Booking details
  therapistId: string
  serviceId: string
  form: 'online' | 'in_person'
  language: string
  
  // Time slot
  startsAt: Date // ISO datetime
  endsAt: Date // ISO datetime
  
  // Optional
  note?: string | null
  
  // Status
  status: BookingStatus
  
  // User identification (optional for MVP)
  userId?: string | null
  userEmail?: string | null
  userPhone?: string | null
}

export interface CreateBookingInput {
  therapistId: string
  serviceId: string
  form: 'online' | 'in_person'
  language: string
  startsAt: string // ISO datetime
  endsAt?: string // ISO datetime (optional - can be calculated on server)
  note?: string
  userId?: string
  userEmail?: string
  userPhone?: string
}

export interface BookingResponse {
  bookingId: string
  status: BookingStatus
  startsAt: string
  endsAt: string
}

export interface WeeklyAvailability {
  // Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Each day has array of time bands [startHour, endHour]
  [dayOfWeek: number]: Array<[number, number]> // [startHour, endHour]
}

export interface TherapistAvailabilityConfig {
  availabilityWeekly: WeeklyAvailability
  slotStepMin: number // 10, 15, or 30 minutes
  leadTimeHours: number // Minimum hours in advance (e.g., 2 = can't book less than 2h ahead)
}

export interface AvailableSlot {
  startsAt: string // ISO datetime
  endsAt: string // ISO datetime
  durationMin: number
}

