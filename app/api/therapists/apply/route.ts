import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { therapistApplicationSchema } from "./schema"

// Simple in-memory rate limiting
// Map<IP, { count: number, resetAt: number }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Rate limit: max 5 requests per 10 minutes per IP
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function getClientIP(request: Request): string {
  // Try to get IP from headers (X-Forwarded-For, X-Real-IP, etc.)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  // Fallback to a default IP if we can't determine it
  return "unknown"
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// Cleanup old entries periodically (simple cleanup on access)
function cleanupRateLimit() {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip)
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        { error: "Neplatný formát dat." },
        { status: 400 }
      )
    }

    // Honeypot check - if website field is filled, it's likely spam
    const website = typeof body.website === "string" ? body.website.trim() : ""
    if (website !== "") {
      // Return success but don't save anything (silent spam rejection)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Rate limiting
    const clientIP = getClientIP(request)
    cleanupRateLimit()
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Zkuste to prosím později." },
        { status: 429 }
      )
    }

    // Validate with zod
    const validationResult = therapistApplicationSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { error: firstError?.message || "Neplatná data." },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Soft dedupe: check if application with same email exists in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existingResult = await query(
      `SELECT id, created_at FROM therapist_applications 
       WHERE email = $1 AND created_at > $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [data.email, oneDayAgo]
    )

    if (existingResult.rows.length > 0) {
      // Update existing application instead of creating new one
      const existingId = existingResult.rows[0].id
      await query(
        `UPDATE therapist_applications 
         SET phone = $1, 
             full_name = COALESCE($2, full_name), 
             city = COALESCE($3, city), 
             is_certified = $4, 
             is_in_training = $5, 
             how_did_you_hear = COALESCE($6, how_did_you_hear), 
             note = COALESCE($7, note),
             status = 'new'
         WHERE id = $8`,
        [
          data.phone,
          data.fullName,
          data.city,
          data.isCertified,
          data.isInTraining,
          data.howDidYouHear,
          data.note,
          existingId
        ]
      )

      // Return success (no email notification for updates)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Insert new application
    await query(
      `INSERT INTO therapist_applications (
        email, phone, full_name, city, 
        is_certified, is_in_training, 
        how_did_you_hear, note, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.email,
        data.phone,
        data.fullName,
        data.city,
        data.isCertified,
        data.isInTraining,
        data.howDidYouHear,
        data.note,
        "new"
      ]
    )

    // Send notification email if configured
    if (process.env.THERAPIST_LEADS_NOTIFY_TO) {
      try {
        const { sendTherapistApplicationNotification } = await import("@/lib/utils/email")
        await sendTherapistApplicationNotification({
          email: data.email,
          phone: data.phone,
          fullName: data.fullName,
          city: data.city,
          isCertified: data.isCertified,
          isInTraining: data.isInTraining,
          howDidYouHear: data.howDidYouHear,
          note: data.note,
        })
      } catch (emailError) {
        // Log error but don't fail the request
        console.error("Error sending notification email:", emailError)
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Error in /api/therapists/apply:", error)
    return NextResponse.json(
      { error: "Došlo k chybě při odesílání přihlášky. Zkuste to prosím znovu." },
      { status: 500 }
    )
  }
}
