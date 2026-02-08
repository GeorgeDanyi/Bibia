/**
 * PostgreSQL database client
 * Uses connection pooling for efficient database access
 * Lazy loading: Pool is created only when first query is executed
 */

import { Pool, PoolClient } from 'pg'

// Sanity check: DATABASE_URL must be set (only throw at runtime, not during build)
function checkDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please set DATABASE_URL in your .env.local file. ' +
      'Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname'
    )
  }
}

// Global cache for Pool in development (Next.js hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined
}

let pool: Pool | null = null

/**
 * Get or create the database pool (lazy initialization)
 * This prevents creating the pool during module import, which can slow down page loads
 */
function getPool(): Pool {
  if (pool) {
    return pool
  }

  checkDatabaseUrl()

  if (process.env.NODE_ENV === 'development') {
    // Use global cache in development to avoid creating multiple pools during hot reload
    if (!global.__dbPool) {
      global.__dbPool = new Pool({
        connectionString: process.env.DATABASE_URL!,
        // Reduce connection timeout to fail fast if DB is unavailable
        connectionTimeoutMillis: 5000,
      })
    }
    pool = global.__dbPool
  } else {
    // In production, create a new pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      connectionTimeoutMillis: 5000,
    })
  }

  return pool
}

/**
 * Execute a SQL query
 * @param text SQL query string
 * @param params Query parameters
 * @returns Query result with rows array
 */
export async function query(text: string, params?: any[]): Promise<{ rows: any[] }> {
  const dbPool = getPool()
  const result = await dbPool.query(text, params)
  return { rows: result.rows }
}

/**
 * Execute a transaction
 * @param fn Function that receives a client and returns a promise
 * @returns Result of the transaction function
 */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const dbPool = getPool()
  const client = await dbPool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

