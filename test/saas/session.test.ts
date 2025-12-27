/**
 * Session Helper Tests
 *
 * LA3-P0-02: Tests for session management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCurrentSession,
  setSession,
  clearSession,
  SESSION_COOKIE_NAME,
  EMPTY_SESSION,
} from '@/lib/saas/session'
import { cookies } from 'next/headers'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

describe('Session Helper', () => {
  const mockCookies = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(cookies as any).mockResolvedValue(mockCookies)
  })

  it('should return empty session when no cookie is present', async () => {
    mockCookies.get.mockReturnValue(undefined)

    const session = await getCurrentSession()

    expect(session).toEqual(EMPTY_SESSION)
  })

  it('should return valid session when valid cookie is present', async () => {
    const userId = 'user-123'
    const workspaceId = 'workspace-456'

    // First set a session to get a valid token
    await setSession(userId, workspaceId)
    const setCall = mockCookies.set.mock.calls[0]
    const token = setCall[1]

    // Mock cookie get for the token
    mockCookies.get.mockReturnValue({ value: token })

    const session = await getCurrentSession()

    expect(session.isValid).toBe(true)
    expect(session.userId).toBe(userId)
    expect(session.activeWorkspaceId).toBe(workspaceId)
  })

  it('should return invalid session when token is tampered', async () => {
    const userId = 'user-123'
    const workspaceId = 'workspace-456'

    // First set a session to get a valid token
    await setSession(userId, workspaceId)
    const setCall = mockCookies.set.mock.calls[0]
    const token = setCall[1]

    // Tamper with the token
    const tamperedToken = token.replace(/.$/, token.endsWith('A') ? 'B' : 'A')

    // Mock cookie get for the tampered token
    mockCookies.get.mockReturnValue({ value: tamperedToken })

    const session = await getCurrentSession()

    expect(session).toEqual(EMPTY_SESSION)
  })

  it('should clear session cookie on clearSession', async () => {
    await clearSession()

    expect(mockCookies.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })
})
