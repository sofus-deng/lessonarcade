/**
 * Session Helper Module
 *
 * LA3-P0-02: Minimal demo sign-in and session handling
 *
 * IMPORTANT: This is NOT production-grade authentication.
 * This is a demo-only implementation for Phase 3 SaaS development.
 *
 * For production, replace with:
 * - NextAuth.js or similar auth library
 * - OAuth providers (Google, GitHub, etc.)
 * - Proper JWT session management
 * - CSRF protection
 * - Rate limiting
 *
 * @module lib/saas/session
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Session cookie name
 */
export const SESSION_COOKIE_NAME = 'la-demo-session'

/**
 * Session secret for signing tokens
 * In production, this should be an environment variable
 */
const SESSION_SECRET = process.env.SESSION_SECRET || 'demo-secret-change-in-production'

/**
 * Session duration in milliseconds (24 hours)
 */
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000

// ============================================================================
// TYPES
// ============================================================================

/**
 * Session data stored in cookie
 */
export interface SessionData {
  userId: string
  activeWorkspaceId: string
  createdAt: number
}

/**
 * Parsed session with validation
 */
export interface Session extends SessionData {
  isValid: boolean
  isExpired: boolean
}

/**
 * Empty session (not signed in)
 */
export const EMPTY_SESSION: Session = {
  userId: '',
  activeWorkspaceId: '',
  createdAt: 0,
  isValid: false,
  isExpired: false,
}

// ============================================================================
// TOKEN SIGNING
// ============================================================================

/**
 * Sign session data into a token
 * Format: base64(data).base64(signature)
 */
function signToken(data: SessionData): string {
  const dataStr = JSON.stringify(data)
  const dataBase64 = Buffer.from(dataStr).toString('base64')
  const signature = createHash('sha256')
    .update(`${dataBase64}.${SESSION_SECRET}`)
    .digest('base64')
  return `${dataBase64}.${signature}`
}

/**
 * Verify and parse token
 */
function verifyToken(token: string): SessionData | null {
  try {
    const [dataBase64, signature] = token.split('.')
    if (!dataBase64 || !signature) {
      return null
    }

    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${dataBase64}.${SESSION_SECRET}`)
      .digest('base64')

    if (signature !== expectedSignature) {
      return null
    }

    // Parse data
    const dataStr = Buffer.from(dataBase64, 'base64').toString('utf-8')
    const data = JSON.parse(dataStr) as SessionData

    // Validate structure
    if (!data.userId || !data.activeWorkspaceId || !data.createdAt) {
      return null
    }

    // Check expiration
    const now = Date.now()
    if (now - data.createdAt > SESSION_MAX_AGE) {
      return null
    }

    return data
  } catch {
    return null
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get current session from cookie
 *
 * @returns Session object (empty if not signed in)
 */
export async function getCurrentSession(): Promise<Session> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return EMPTY_SESSION
  }

  const data = verifyToken(token)
  if (!data) {
    return EMPTY_SESSION
  }

  const now = Date.now()
  const isExpired = now - data.createdAt > SESSION_MAX_AGE

  return {
    ...data,
    isValid: !isExpired,
    isExpired,
  }
}

/**
 * Set session cookie
 *
 * @param userId - User ID
 * @param activeWorkspaceId - Active workspace ID
 */
export async function setSession(
  userId: string,
  activeWorkspaceId: string
): Promise<void> {
  const cookieStore = await cookies()
  const data: SessionData = {
    userId,
    activeWorkspaceId,
    createdAt: Date.now(),
  }
  const token = signToken(data)

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE / 1000, // Convert to seconds
    path: '/',
  })
}

/**
 * Clear session cookie (sign out)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Require authentication - redirect to sign-in if not signed in
 *
 * @returns Session data (throws redirect if not signed in)
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getCurrentSession()

  if (!session.isValid || session.isExpired) {
    redirect('/auth/demo-signin')
  }

  return {
    userId: session.userId,
    activeWorkspaceId: session.activeWorkspaceId,
    createdAt: session.createdAt,
  }
}

/**
 * Get session data without requiring authentication
 *
 * @returns Session data or null if not signed in
 */
export async function getSessionData(): Promise<SessionData | null> {
  const session = await getCurrentSession()

  if (!session.isValid || session.isExpired) {
    return null
  }

  return {
    userId: session.userId,
    activeWorkspaceId: session.activeWorkspaceId,
    createdAt: session.createdAt,
  }
}
