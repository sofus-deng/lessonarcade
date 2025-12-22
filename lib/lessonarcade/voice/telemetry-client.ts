import { createHash } from "crypto"

/**
 * Creates a SHA-256 hash of text content for telemetry
 * This should only include the script text, not voice parameters
 */
export function createTextHash(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

/**
 * Creates a session ID for client-side telemetry tracking
 * Generates a random UUID-like string
 */
export function createSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + 
         Date.now().toString(36)
}