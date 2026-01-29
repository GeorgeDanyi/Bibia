import { NextRequest, NextResponse } from 'next/server'
import { generateAvailableSlots, getDefaultAvailabilityConfig } from '@/lib/utils/slot-generation'

/**
 * GET /api/therapists/:id/slots
 * Get available slots for a therapist
 * 
 * Query params:
 * - serviceId: required
 * - from: ISO date string (default: today)
 * - to: ISO date string (default: 30 days from now)
 * - form: 'online' | 'in_person' (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = params.id
    const { searchParams } = new URL(request.url)

    const serviceId = searchParams.get('serviceId')
    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      )
    }

    // Parse date range
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const from = fromParam ? new Date(fromParam) : new Date()
    const to = toParam ? new Date(toParam) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const form = searchParams.get('form') as 'online' | 'in_person' | null

    // Get service duration (in production, fetch from DB)
    // For MVP, default to 60 minutes
    const serviceDurationMin = 60

    // Get availability config (in production, fetch from therapist record)
    // For MVP, use default config
    const availabilityConfig = getDefaultAvailabilityConfig()

    // Generate slots
    const slots = await generateAvailableSlots(
      therapistId,
      serviceId,
      serviceDurationMin,
      availabilityConfig,
      from,
      to,
      form || undefined
    )

    return NextResponse.json({
      slots,
      therapistId,
      serviceId,
      from: from.toISOString(),
      to: to.toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch slots' },
      { status: 500 }
    )
  }
}

