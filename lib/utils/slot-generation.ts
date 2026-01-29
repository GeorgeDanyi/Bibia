/**
 * Slot generation utilities for instant booking
 */

import type { AvailableSlot, TherapistAvailabilityConfig, WeeklyAvailability } from '@/lib/types/booking'
import { getBookingsForTherapist } from '@/lib/database/bookings'

/**
 * Generate available slots for a therapist based on weekly availability
 */
export async function generateAvailableSlots(
  therapistId: string,
  serviceId: string,
  serviceDurationMin: number,
  config: TherapistAvailabilityConfig,
  from: Date,
  to: Date,
  form?: 'online' | 'in_person'
): Promise<AvailableSlot[]> {
  const slots: AvailableSlot[] = []
  const { availabilityWeekly, slotStepMin, leadTimeHours } = config

  // Get existing bookings for this therapist in the time range
  const existingBookings = await getBookingsForTherapist(therapistId, from, to)
  const bookedStartTimes = new Set(
    existingBookings.map(b => b.startsAt.getTime())
  )

  // Minimum time in advance (lead time)
  const minStartTime = new Date()
  minStartTime.setHours(minStartTime.getHours() + leadTimeHours)

  // Iterate through each day in the range
  const currentDate = new Date(from)
  while (currentDate < to) {
    const dayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const timeBands = availabilityWeekly[dayOfWeek] || []

    // Generate slots for each time band on this day
    for (const [startHour, endHour] of timeBands) {
      let currentMinute = 0
      const startMinutes = startHour * 60
      const endMinutes = endHour * 60
      
      while (startMinutes + currentMinute + serviceDurationMin <= endMinutes) {
        const slotStart = new Date(currentDate)
        const totalMinutes = startMinutes + currentMinute
        slotStart.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
        
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + serviceDurationMin)

        // Check lead time
        if (slotStart >= minStartTime) {
          // Check if slot is not already booked
          if (!bookedStartTimes.has(slotStart.getTime())) {
            slots.push({
              startsAt: slotStart.toISOString(),
              endsAt: slotEnd.toISOString(),
              durationMin: serviceDurationMin,
            })
          }
        }

        // Move to next slot
        currentMinute += slotStepMin
        if (startMinutes + currentMinute + serviceDurationMin > endMinutes) break
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate.setHours(0, 0, 0, 0)
  }

  // Sort by start time
  slots.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  return slots
}

/**
 * Get default availability config for a therapist (MVP)
 */
export function getDefaultAvailabilityConfig(): TherapistAvailabilityConfig {
  return {
    availabilityWeekly: {
      1: [[9, 17]], // Monday: 9:00 - 17:00
      2: [[9, 17]], // Tuesday: 9:00 - 17:00
      3: [[9, 17]], // Wednesday: 9:00 - 17:00
      4: [[9, 17]], // Thursday: 9:00 - 17:00
      5: [[9, 17]], // Friday: 9:00 - 17:00
    },
    slotStepMin: 15, // 15 minute steps
    leadTimeHours: 2, // Can book at least 2 hours in advance
  }
}

