/**
 * Booking Provider Integration Types
 * 
 * Interface for future API integrations with booking providers
 */

export type BookingProvider = 'none' | 'zaptime' | 'reservanto'

export type BookingMode = 'redirect' | 'iframe'  // default "iframe"

/**
 * Booking slot/availability from provider
 */
export interface BookingSlot {
  startTime: string // ISO datetime
  endTime: string // ISO datetime
  durationMinutes: number
  serviceId?: string
  available: boolean
}

/**
 * Booking request payload
 */
export interface BookingRequest {
  therapistId: string
  serviceId?: string
  startTime: string // ISO datetime
  endTime: string // ISO datetime
  clientName: string
  clientEmail: string
  clientPhone?: string
  note?: string
}

/**
 * Booking response from provider
 */
export interface BookingResponse {
  bookingId: string
  status: 'confirmed' | 'pending' | 'cancelled'
  startTime: string
  endTime: string
  confirmationUrl?: string
  cancelUrl?: string
}

/**
 * Booking Provider Adapter Interface
 * 
 * Future interface for API integrations with booking providers.
 * Currently MVP uses embed/redirect, but this interface prepares
 * for full API integration (availability checks, booking creation, cancellation).
 */
export interface IBookingProviderAdapter {
  /**
   * Provider identifier
   */
  provider: BookingProvider

  /**
   * Check if provider is configured for therapist
   */
  isConfigured(therapist: { bookingProvider?: BookingProvider; bookingUrl?: string }): boolean

  /**
   * Get available booking slots for a date range
   * @param therapistId - Therapist ID
   * @param startDate - Start of date range (ISO date)
   * @param endDate - End of date range (ISO date)
   * @param serviceId - Optional service ID filter
   */
  getAvailability?(
    therapistId: string,
    startDate: string,
    endDate: string,
    serviceId?: string
  ): Promise<BookingSlot[]>

  /**
   * Create a new booking
   * @param request - Booking request details
   */
  createBooking?(request: BookingRequest): Promise<BookingResponse>

  /**
   * Cancel an existing booking
   * @param bookingId - Booking ID from provider
   * @param therapistId - Therapist ID
   */
  cancelBooking?(bookingId: string, therapistId: string): Promise<void>

  /**
   * Get booking details
   * @param bookingId - Booking ID from provider
   * @param therapistId - Therapist ID
   */
  getBooking?(bookingId: string, therapistId: string): Promise<BookingResponse>

  /**
   * Get booking URL with optional service prefill
   * @param therapist - Therapist object with bookingProvider and bookingUrl
   * @param selectedServiceId - Optional service ID to prefill in booking
   * @returns Booking URL (for redirect or iframe)
   */
  getBookingUrl?(therapist: { bookingProvider?: BookingProvider; bookingUrl?: string }, selectedServiceId?: string): string

  /**
   * Get embed URL for iframe mode
   * @param therapistId - Therapist ID
   * @param bookingUrl - Base booking URL from therapist data
   * @param serviceId - Optional service ID
   */
  getEmbedUrl?(therapistId: string, bookingUrl: string, serviceId?: string): string

  /**
   * Get redirect URL for redirect mode
   * @param therapistId - Therapist ID
   * @param bookingUrl - Base booking URL from therapist data
   * @param serviceId - Optional service ID
   */
  getRedirectUrl?(therapistId: string, bookingUrl: string, serviceId?: string): string
}

/**
 * Default adapter for MVP (embed/redirect only)
 */
export class DefaultBookingAdapter implements IBookingProviderAdapter {
  provider: BookingProvider = 'none'

  isConfigured(therapist: { bookingProvider?: BookingProvider; bookingUrl?: string }): boolean {
    return Boolean(
      therapist.bookingProvider &&
      therapist.bookingProvider !== 'none' &&
      therapist.bookingUrl
    )
  }

  /**
   * Get booking URL with optional service prefill
   * For MVP, returns the base bookingUrl. Future implementations can add service-specific URLs.
   */
  getBookingUrl(therapist: { bookingProvider?: BookingProvider; bookingUrl?: string }, selectedServiceId?: string): string {
    if (!therapist.bookingUrl) {
      return ''
    }
    
    // MVP: Return base URL. Future: Add service-specific URL construction per provider
    // Example for future:
    // if (therapist.bookingProvider === 'zaptime' && selectedServiceId) {
    //   return `${therapist.bookingUrl}?service=${selectedServiceId}`
    // }
    
    return therapist.bookingUrl
  }

  getRedirectUrl(therapistId: string, bookingUrl: string, serviceId?: string): string {
    return this.getBookingUrl({ bookingUrl }, serviceId) || bookingUrl
  }

  getEmbedUrl(therapistId: string, bookingUrl: string, serviceId?: string): string {
    return this.getBookingUrl({ bookingUrl }, serviceId) || bookingUrl
  }
}


