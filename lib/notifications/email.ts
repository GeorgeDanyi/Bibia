/**
 * Email notification service (MVP)
 * 
 * In production, integrate with SendGrid, Resend, AWS SES, etc.
 */

import type { ConsultationRequest } from '@/lib/types/consultation-request'
import type { Booking } from '@/lib/types/booking'

/**
 * Send notification email to therapist about new consultation request
 */
export async function sendTherapistNotification(
  request: ConsultationRequest
): Promise<void> {
  // MVP: Log to console
  // In production, use actual email service
  
  const emailContent = `
Nová žádost o konzultaci

ID žádosti: ${request.id}
Datum: ${request.createdAt.toLocaleString('cs-CZ')}

Služba ID: ${request.serviceId}
Forma: ${request.form === 'online' ? 'Online' : 'Osobně'}
Jazyky: ${request.preferredLanguages.join(', ') || 'Neuvedeno'}
Poznámka: ${request.note || 'Žádná poznámka'}

Kontakt:
${request.userEmail ? `Email: ${request.userEmail}` : ''}
${request.userPhone ? `Telefon: ${request.userPhone}` : ''}

Zobrazit v dashboardu: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/consultations/${request.id}
  `.trim()

  console.log('=== THERAPIST NOTIFICATION EMAIL ===')
  console.log(emailContent)
  console.log('=====================================')

  // TODO: In production, send actual email:
  // await emailClient.send({
  //   to: therapistEmail,
  //   subject: 'Nová žádost o konzultaci',
  //   html: formatEmailHtml(emailContent)
  // })
}

/**
 * Send notification email to therapist about new booking
 */
export async function sendBookingNotification(
  booking: Booking
): Promise<void> {
  // MVP: Log to console
  // In production, use actual email service
  
  const emailContent = `
Nová rezervace termínu

ID rezervace: ${booking.id}
Datum vytvoření: ${booking.createdAt.toLocaleString('cs-CZ')}

Služba ID: ${booking.serviceId}
Forma: ${booking.form === 'online' ? 'Online' : 'Osobně'}
Jazyk: ${booking.language}

Termín:
${booking.startsAt.toLocaleString('cs-CZ')} - ${booking.endsAt.toLocaleString('cs-CZ')}

Poznámka: ${booking.note || 'Žádná poznámka'}

Kontakt:
${booking.userEmail ? `Email: ${booking.userEmail}` : ''}
${booking.userPhone ? `Telefon: ${booking.userPhone}` : ''}

Zobrazit v dashboardu: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/bookings/${booking.id}
  `.trim()

  console.log('=== BOOKING NOTIFICATION EMAIL ===')
  console.log(emailContent)
  console.log('===================================')

  // TODO: In production, send actual email:
  // await emailClient.send({
  //   to: therapistEmail,
  //   subject: 'Nová rezervace termínu',
  //   html: formatEmailHtml(emailContent)
  // })
}

