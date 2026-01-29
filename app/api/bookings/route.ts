import { NextRequest, NextResponse } from 'next/server'
import { createBooking } from '@/lib/database/bookings'
import type { CreateBookingInput } from '@/lib/types/booking'
import { sendBookingNotification } from '@/lib/notifications/email'

/**
 * POST /api/bookings
 * Create a new booking (instant reservation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      )
    }

    if (!body.therapistId) {
      return NextResponse.json(
        { error: 'therapistId is required' },
        { status: 400 }
      )
    }

    if (!body.form || (body.form !== 'online' && body.form !== 'in_person')) {
      return NextResponse.json(
        { error: 'form must be "online" or "in_person"' },
        { status: 400 }
      )
    }

    if (!body.startsAt) {
      return NextResponse.json(
        { error: 'startsAt is required' },
        { status: 400 }
      )
    }

    if (!body.language) {
      return NextResponse.json(
        { error: 'language is required' },
        { status: 400 }
      )
    }

    // Calculate endsAt based on service duration
    // In production, fetch service.durationMin from DB
    const serviceDurationMin = 60 // Default for MVP
    const startsAt = new Date(body.startsAt)
    const endsAt = new Date(startsAt.getTime() + serviceDurationMin * 60 * 1000)

    // Create booking
    const input: CreateBookingInput = {
      therapistId: body.therapistId,
      serviceId: body.serviceId,
      form: body.form,
      language: body.language,
      startsAt: body.startsAt,
      endsAt: endsAt.toISOString(),
      note: body.note,
      userId: body.userId,
      userEmail: body.userEmail,
      userPhone: body.userPhone,
    }

    try {
      const booking = await createBooking(input)

      // Send notification to therapist (async, don't wait)
      sendBookingNotification(booking).catch(err => {
        console.error('Failed to send booking notification:', err)
      })

      // Log success event
      console.log('[EVENT] booking_created', {
        bookingId: booking.id,
        therapistId: booking.therapistId,
        serviceId: booking.serviceId,
        startsAt: booking.startsAt.toISOString(),
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        bookingId: booking.id,
        status: booking.status,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
      })
    } catch (error: any) {
      // Handle slot conflict
      if (error.code === 'SLOT_TAKEN' || error.statusCode === 409) {
        return NextResponse.json(
          { 
            error: 'Slot is already taken',
            code: 'slot_taken'
          },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}

