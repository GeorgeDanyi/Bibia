import { NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/database/auth'
import { createPasswordResetToken } from '@/lib/database/password-reset'
import { sendPasswordResetEmail } from '@/lib/utils/email'
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail je povinný.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Zadejte platnou e-mailovou adresu.' },
        { status: 400 }
      )
    }

    // Always return 200 to prevent email enumeration
    // Check if user exists silently
    const user = await findUserByEmail(email)

    if (user) {
      // Generate secure token (32 bytes = 256 bits)
      const token = randomBytes(32).toString('hex')
      
      // Token expires in 30 minutes
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 30)

      // Store token hash in database
      await createPasswordResetToken(user.id, token, expiresAt)

      // Send reset email
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`
      await sendPasswordResetEmail(email, resetUrl)
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json(
      { message: 'Pokud účet s tímto e-mailem existuje, poslali jsme odkaz pro obnovu hesla.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in /api/auth/forgot-password:', error)
    // Still return 200 to prevent information leakage
    return NextResponse.json(
      { message: 'Pokud účet s tímto e-mailem existuje, poslali jsme odkaz pro obnovu hesla.' },
      { status: 200 }
    )
  }
}

