import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { findValidPasswordResetToken, markPasswordResetTokenAsUsed } from '@/lib/database/password-reset'
import { findUserById } from '@/lib/database/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token a nové heslo jsou povinné.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Heslo musí mít alespoň 8 znaků.' },
        { status: 400 }
      )
    }

    // Find valid token
    const resetToken = await findValidPasswordResetToken(token)
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Neplatný nebo expirovaný token pro obnovu hesla.' },
        { status: 400 }
      )
    }

    // Verify user still exists
    const user = await findUserById(resetToken.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Uživatel neexistuje.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 10)

    // Update user password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    )

    // Mark token as used
    await markPasswordResetTokenAsUsed(resetToken.id)

    return NextResponse.json(
      { message: 'Heslo bylo úspěšně změněno.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in /api/auth/reset-password:', error)
    return NextResponse.json(
      { error: 'Došlo k chybě při obnově hesla. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}

