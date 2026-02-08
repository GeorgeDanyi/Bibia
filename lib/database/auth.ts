/**
 * Database functions for authentication
 * Uses PostgreSQL via @/lib/db
 */

import { query } from '@/lib/db'

export interface User {
  id: string
  email: string
  emailVerifiedAt: Date | null
  name: string | null
  image: string | null
  role: 'patient' | 'therapist' | 'admin'
  passwordHash: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: string
  userId: string
  provider: string
  providerAccountId: string
  accessToken?: string | null
  refreshToken?: string | null
  expiresAt?: number | null
  tokenType?: string | null
  scope?: string | null
  idToken?: string | null
  createdAt: Date
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  )
  
  if (result.rows.length === 0) {
    return null
  }
  
  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    name: row.name,
    image: row.image,
    role: row.role,
    passwordHash: row.password_hash || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  )
  
  if (result.rows.length === 0) {
    return null
  }
  
  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    name: row.name,
    image: row.image,
    role: row.role,
    passwordHash: row.password_hash || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Create new user
 */
export async function createUser(data: {
  email: string
  name?: string | null
  image?: string | null
  emailVerifiedAt?: Date | null
  passwordHash?: string | null
  role?: 'patient' | 'therapist' | 'admin'
}): Promise<User> {
  const result = await query(
    `INSERT INTO users (email, name, image, email_verified_at, password_hash, role) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [
      data.email.toLowerCase(),
      data.name || null,
      data.image || null,
      data.emailVerifiedAt || null,
      data.passwordHash || null,
      data.role || 'patient',
    ]
  )
  
  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    name: row.name,
    image: row.image,
    role: row.role,
    passwordHash: row.password_hash || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Update user email verification
 */
export async function verifyUserEmail(userId: string): Promise<void> {
  await query(
    'UPDATE users SET email_verified_at = NOW() WHERE id = $1',
    [userId]
  )
}

/**
 * Find account by provider and provider account ID
 */
export async function findAccountByProvider(
  provider: string,
  providerAccountId: string
): Promise<Account | null> {
  const result = await query(
    'SELECT * FROM accounts WHERE provider = $1 AND provider_account_id = $2',
    [provider, providerAccountId]
  )
  
  if (result.rows.length === 0) {
    return null
  }
  
  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    tokenType: row.token_type,
    scope: row.scope,
    idToken: row.id_token,
    createdAt: row.created_at,
  }
}

/**
 * Link account to user
 */
export async function linkAccount(data: {
  userId: string
  provider: string
  providerAccountId: string
  accessToken?: string | null
  refreshToken?: string | null
  expiresAt?: number | null
  tokenType?: string | null
  scope?: string | null
  idToken?: string | null
}): Promise<Account> {
  const result = await query(
    `INSERT INTO accounts (
      user_id, provider, provider_account_id, 
      access_token, refresh_token, expires_at, 
      token_type, scope, id_token
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (provider, provider_account_id) 
    DO UPDATE SET 
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      token_type = EXCLUDED.token_type,
      scope = EXCLUDED.scope,
      id_token = EXCLUDED.id_token
    RETURNING *`,
    [
      data.userId,
      data.provider,
      data.providerAccountId,
      data.accessToken || null,
      data.refreshToken || null,
      data.expiresAt || null,
      data.tokenType || null,
      data.scope || null,
      data.idToken || null,
    ]
  )
  
  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    tokenType: row.token_type,
    scope: row.scope,
    idToken: row.id_token,
    createdAt: row.created_at,
  }
}

/**
 * Update user name
 */
export async function updateUserName(userId: string, name: string | null): Promise<User> {
  const result = await query(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
    [name, userId]
  )
  
  if (result.rows.length === 0) {
    throw new Error('User not found')
  }
  
  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    name: row.name,
    image: row.image,
    role: row.role,
    passwordHash: row.password_hash || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Create magic token (hash the code before storing)
 */
// Magic-link token helpers removed – using classic email+password auth now
