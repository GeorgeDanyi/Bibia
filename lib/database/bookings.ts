/**
 * Database functions for bookings
 * 
 * Note: This is a simplified implementation. In production, you would use
 * a proper database client (pg, Prisma, Drizzle, etc.)
 */

import type { 
  Booking, 
  CreateBookingInput,
  BookingStatus 
} from '@/lib/types/booking'

// For MVP, we'll use in-memory storage
// In production, replace this with actual database queries
let bookingsStore: Booking[] = []

function generateId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new booking
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<Booking> {
  // Validate required fields
  if (!input.serviceId) {
    throw new Error('serviceId is required')
  }
  if (!input.therapistId) {
    throw new Error('therapistId is required')
  }
  if (!input.form || (input.form !== 'online' && input.form !== 'in_person')) {
    throw new Error('form must be "online" or "in_person"')
  }
  if (!input.startsAt) {
    throw new Error('startsAt is required')
  }
  if (!input.language) {
    throw new Error('language is required')
  }

  const startsAt = new Date(input.startsAt)
  // endsAt should be provided, but calculate if missing
  const endsAt = input.endsAt ? new Date(input.endsAt) : calculateEndTime(input.startsAt, input.serviceId)

  // Check for conflicts (simplified - in production use DB query)
  const conflictingBooking = bookingsStore.find(
    b => b.therapistId === input.therapistId &&
         b.status === 'booked' &&
         b.startsAt.getTime() === startsAt.getTime()
  )

  if (conflictingBooking) {
    const error: any = new Error('Slot is already taken')
    error.code = 'SLOT_TAKEN'
    error.statusCode = 409
    throw error
  }

  const now = new Date()
  const booking: Booking = {
    id: generateId(),
    createdAt: now,
    therapistId: input.therapistId,
    serviceId: input.serviceId,
    form: input.form,
    language: input.language,
    startsAt,
    endsAt,
    note: input.note || null,
    status: 'booked',
    userId: input.userId || null,
    userEmail: input.userEmail || null,
    userPhone: input.userPhone || null,
  }

  // In production, replace with: await db.query('INSERT INTO bookings ...')
  bookingsStore.push(booking)

  return booking
}

/**
 * Get bookings for a therapist in a time range
 */
export async function getBookingsForTherapist(
  therapistId: string,
  from: Date,
  to: Date
): Promise<Booking[]> {
  return bookingsStore.filter(
    b => b.therapistId === therapistId &&
         b.status === 'booked' &&
         b.startsAt >= from &&
         b.startsAt < to
  )
}

/**
 * Calculate end time based on start time and service duration
 * This is a helper - in production, you'd fetch service.durationMin from DB
 */
function calculateEndTime(startsAt: string, serviceId: string): Date {
  // Default to 60 minutes if we can't determine service duration
  // In production, fetch from services table
  const durationMin = 60
  const start = new Date(startsAt)
  const end = new Date(start.getTime() + durationMin * 60 * 1000)
  return end
}

/**
 * Get booking by ID
 */
export async function getBookingById(id: string): Promise<Booking | null> {
  return bookingsStore.find(b => b.id === id) || null
}

