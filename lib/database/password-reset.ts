/**
 * Database functions for password reset tokens
 */

import { query } from '@/lib/db'
import { createHash } from 'crypto'

export interface PasswordResetToken {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<PasswordResetToken> {
  // Hash the token with SHA-256
  const tokenHash = createHash('sha256').update(token).digest('hex')
  
  const result = await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, tokenHash, expiresAt]
  )
  
  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  }
}

/**
 * Find valid password reset token by token string
 */
export async function findValidPasswordResetToken(
  token: string
): Promise<PasswordResetToken | null> {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  
  const result = await query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1
       AND expires_at > NOW()
       AND used_at IS NULL`,
    [tokenHash]
  )
  
  if (result.rows.length === 0) {
    return null
  }
  
  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  }
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenAsUsed(tokenId: string): Promise<void> {
  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
    [tokenId]
  )
}

