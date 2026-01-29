import { NextRequest, NextResponse } from 'next/server'
import { getConsultationRequestById, updateConsultationRequestStatus } from '@/lib/database/consultation-requests'
import type { ConsultationStatus } from '@/lib/types/consultation-request'

/**
 * GET /api/consultation-requests/[id]
 * Get consultation request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const request = await getConsultationRequestById(params.id)
    
    if (!request) {
      return NextResponse.json(
        { error: 'Consultation request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(request)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch consultation request' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/consultation-requests/[id]
 * Update consultation request status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const validStatuses: ConsultationStatus[] = ['pending', 'contacted', 'scheduled', 'done', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updatedRequest = await updateConsultationRequestStatus(params.id, status)

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Consultation request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedRequest)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update consultation request' },
      { status: 500 }
    )
  }
}

