import { NextRequest, NextResponse } from 'next/server'
import { createConsultationRequest } from '@/lib/database/consultation-requests'
import type { CreateConsultationRequestInput } from '@/lib/types/consultation-request'
import { sendTherapistNotification } from '@/lib/notifications/email'

/**
 * POST /api/consultation-requests
 * Create a new consultation request
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

    // Create request
    const input: CreateConsultationRequestInput = {
      therapistId: body.therapistId,
      serviceId: body.serviceId,
      form: body.form,
      preferredLanguages: body.languages || [],
      note: body.note,
      userEmail: body.userEmail,
      userPhone: body.userPhone,
      userId: body.userId
    }

    const consultationRequest = await createConsultationRequest(input)

    // Send notification to therapist (async, don't wait)
    sendTherapistNotification(consultationRequest).catch(err => {
      console.error('Failed to send therapist notification:', err)
    })

    // Log success event
    console.log('[EVENT] submit_request_success', {
      requestId: consultationRequest.id,
      therapistId: consultationRequest.therapistId,
      serviceId: consultationRequest.serviceId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      requestId: consultationRequest.id,
      status: consultationRequest.status
    }, { status: 201 })

  } catch (error: any) {
    console.error('[EVENT] submit_request_fail', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: error.message || 'Failed to create consultation request' },
      { status: 500 }
    )
  }
}

