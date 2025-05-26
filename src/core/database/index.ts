import { getDatabaseProtected } from './internal/protected'
import { DatabaseUnprotected } from './internal/unprotected'

export const Database = {
  getUnprotected: () => DatabaseUnprotected,
  get: getDatabaseProtected,
}

// Export db for API routes
export const db = DatabaseUnprotected
