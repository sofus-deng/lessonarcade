/**
 * Sign-out Server Action
 *
 * LA3-P0-02: Sign-out action
 *
 * @module app/auth/signout/action
 */

'use server'

import { redirect } from 'next/navigation'
import { clearSession } from '@/lib/saas/session'

/**
 * Sign out current user
 *
 * This action:
 * 1. Clears the session cookie
 * 2. Redirects to sign-in page
 *
 * @returns Redirects to /auth/demo-signin
 */
export async function signOutAction() {
  await clearSession()
  redirect('/auth/demo-signin')
}
