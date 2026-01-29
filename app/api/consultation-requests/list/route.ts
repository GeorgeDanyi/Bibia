import { NextRequest, NextResponse } from 'next/server'
import { getAllConsultationRequests, getConsultationRequestsByTherapist } from '@/lib/database/consultation-requests'

/**
 * GET /api/consultation-requests/list
 * Get all consultation requests (for admin dashboard)
 * Query params: therapistId (optional), status (optional), limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const therapistId = searchParams.get('therapistId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let requests

    if (therapistId) {
      requests = await getConsultationRequestsByTherapist(
        therapistId,
        status as any || undefined
      )
      return NextResponse.json({
        requests,
        total: requests.length
      })
    } else {
      const result = await getAllConsultationRequests(limit, offset)
      return NextResponse.json(result)
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch consultation requests' },
      { status: 500 }
    )
  }
}

