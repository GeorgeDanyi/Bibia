/**
 * Initialize auth database connection
 * Call this once at app startup
 */

import { initAuthDb } from './auth'

// For MVP: Create a simple in-memory mock DB client
// TODO: Replace with actual PostgreSQL client
let isInitialized = false

export function initializeAuthDatabase() {
  if (isInitialized) {
    return
  }

  // TODO: Replace with actual database client
  // Example:
  // import { pool } from './pool'
  // initAuthDb({
  //   query: (text: string, params?: any[]) => pool.query(text, params)
  // })

  // For MVP: Mock database client that throws helpful error
  // TODO: Replace with actual database client
  initAuthDb({
    query: async (text: string, params?: any[]) => {
      console.error('❌ Database client not configured!')
      console.error('Please set up your database connection.')
      console.error('See AUTH_SETUP.md for instructions.')
      console.error('Query attempted:', text.substring(0, 100))
      throw new Error(
        'Database client not configured. ' +
        'Please set up your database connection and call initAuthDb() with your DB client. ' +
        'See AUTH_SETUP.md for instructions. ' +
        'To use a mock DB for testing, see lib/database/auth-init.ts'
      )
    }
  })

  isInitialized = true
}

// Auto-initialize on import (for MVP)
if (typeof window === 'undefined') {
  // Only run on server
  initializeAuthDatabase()
}

