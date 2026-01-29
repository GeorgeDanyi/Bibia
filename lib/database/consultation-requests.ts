/**
 * Database functions for consultation requests
 * 
 * Note: This is a simplified implementation. In production, you would use
 * a proper database client (pg, Prisma, Drizzle, etc.)
 */

import type { 
  ConsultationRequest, 
  CreateConsultationRequestInput,
  ConsultationStatus 
} from '@/lib/types/consultation-request'

// For MVP, we'll use in-memory storage
// In production, replace this with actual database queries
let consultationRequestsStore: ConsultationRequest[] = []

/**
 * Create a new consultation request
 */
export async function createConsultationRequest(
  input: CreateConsultationRequestInput
): Promise<ConsultationRequest> {
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

  const now = new Date()
  const request: ConsultationRequest = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    userId: input.userId || null,
    userEmail: input.userEmail || null,
    userPhone: input.userPhone || null,
    therapistId: input.therapistId,
    serviceId: input.serviceId,
    form: input.form,
    preferredLanguages: input.preferredLanguages || [],
    note: input.note || null,
    status: 'pending',
    proposedSlots: input.proposedSlots || [],
    metadata: {}
  }

  // In production, replace with: await db.query('INSERT INTO consultation_requests ...')
  consultationRequestsStore.push(request)

  return request
}

/**
 * Get consultation request by ID
 */
export async function getConsultationRequestById(id: string): Promise<ConsultationRequest | null> {
  // In production: SELECT * FROM consultation_requests WHERE id = $1
  return consultationRequestsStore.find(r => r.id === id) || null
}

/**
 * Get consultation requests by therapist ID
 */
export async function getConsultationRequestsByTherapist(
  therapistId: string,
  status?: ConsultationStatus
): Promise<ConsultationRequest[]> {
  // In production: SELECT * FROM consultation_requests WHERE therapist_id = $1 [AND status = $2]
  let results = consultationRequestsStore.filter(r => r.therapistId === therapistId)
  if (status) {
    results = results.filter(r => r.status === status)
  }
  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Update consultation request status
 */
export async function updateConsultationRequestStatus(
  id: string,
  status: ConsultationStatus
): Promise<ConsultationRequest | null> {
  // In production: UPDATE consultation_requests SET status = $1, updated_at = NOW() WHERE id = $2
  const request = consultationRequestsStore.find(r => r.id === id)
  if (!request) {
    return null
  }

  request.status = status
  request.updatedAt = new Date()
  return request
}

/**
 * Get all consultation requests (for admin dashboard)
 */
export async function getAllConsultationRequests(
  limit: number = 100,
  offset: number = 0
): Promise<{ requests: ConsultationRequest[]; total: number }> {
  // In production: SELECT * FROM consultation_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2
  const sorted = [...consultationRequestsStore].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
  return {
    requests: sorted.slice(offset, offset + limit),
    total: sorted.length
  }
}

/**
 * Generate a simple ID (in production, use UUID from database)
 */
function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

