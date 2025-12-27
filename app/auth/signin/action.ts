/**
 * Sign-in Server Action
 *
 * LA3-P0-02: Demo sign-in action
 *
 * IMPORTANT: This is NOT production-grade authentication.
 * This is a demo-only implementation for Phase 3 SaaS development.
 *
 * @module app/auth/signin/action
 */

'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { setSession } from '@/lib/saas/session'

/**
 * Sign-in state for useFormState
 */
export interface SignInState {
  error: string | null
}

/**
 * Sign in by email
 *
 * This action:
 * 1. Looks up user by email
 * 2. If user exists, creates a session
 * 3. Sets active workspace to first accessible workspace
 * 4. Redirects to /studio
 *
 * @param prevState - Previous state (for useFormState)
 * @param formData - Form data with email
 * @returns New state or redirects
 */
export async function signInAction(
  prevState: SignInState | null,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get('email') as string

  if (!email || typeof email !== 'string') {
    return { error: 'Email is required' }
  }

  // Look up user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workspaceMembers: {
        include: {
          workspace: true,
        },
      },
    },
  })

  if (!user) {
    return { error: 'User not found' }
  }

  // Get first accessible workspace
  const firstWorkspace = user.workspaceMembers[0]?.workspace
  if (!firstWorkspace) {
    return { error: 'No accessible workspaces' }
  }

  // Set session
  await setSession(user.id, firstWorkspace.id)

  // Redirect to Studio
  redirect('/studio')
}

/**
 * Sign in as demo owner (one-click for demo purposes)
 *
 * This action:
 * 1. Looks up demo owner user
 * 2. Creates a session
 * 3. Sets active workspace to demo workspace
 * 4. Redirects to /studio
 *
 * @returns Redirects to /studio
 */
export async function signInAsDemoOwnerAction() {
  // Look up demo owner user
  const user = await prisma.user.findUnique({
    where: { email: 'demo-owner@example.com' },
    include: {
      workspaceMembers: {
        include: {
          workspace: true,
        },
      },
    },
  })

  if (!user) {
    // For demo purposes, redirect with error message in URL
    redirect('/auth/demo-signin?error=demo-owner-not-found')
  }

  // Get demo workspace
  const demoWorkspace = user.workspaceMembers.find(
    (m) => m.workspace.slug === 'demo'
  )?.workspace

  if (!demoWorkspace) {
    redirect('/auth/demo-signin?error=demo-workspace-not-found')
  }

  // Set session
  await setSession(user.id, demoWorkspace.id)

  // Redirect to Studio
  redirect('/studio')
}
