/**
 * Consultation Request Types
 */

export type ConsultationForm = 'online' | 'in_person'

export type ConsultationStatus = 'pending' | 'contacted' | 'scheduled' | 'done' | 'cancelled'

export interface ConsultationRequest {
  id: string
  createdAt: Date
  updatedAt: Date
  
  // User identification
  userId?: string | null
  userEmail?: string | null
  userPhone?: string | null
  
  // Request details
  therapistId: string
  serviceId: string
  form: ConsultationForm
  preferredLanguages: string[]
  note?: string | null
  proposedSlots?: string[]
  
  // Status
  status: ConsultationStatus
  
  // Metadata
  metadata?: Record<string, any>
}

export interface CreateConsultationRequestInput {
  therapistId: string
  serviceId: string
  form: ConsultationForm
  preferredLanguages?: string[]
  note?: string
  userEmail?: string
  userPhone?: string
  userId?: string
  proposedSlots?: string[] // ISO datetime strings
}

export interface ConsultationRequestResponse {
  requestId: string
  status: ConsultationStatus
}

