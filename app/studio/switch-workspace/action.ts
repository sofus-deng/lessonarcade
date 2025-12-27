/**
 * Workspace Switch Server Action
 *
 * LA3-P0-02: Workspace switching action
 *
 * @module app/studio/switch-workspace/action
 */

'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { setSession, getCurrentSession } from '@/lib/saas/session'

/**
 * Switch to a different workspace
 *
 * This action:
 * 1. Validates user has access to target workspace
 * 2. Updates session's activeWorkspaceId
 * 3. Redirects back to current page
 *
 * @param workspaceId - Target workspace ID
 * @param redirectTo - Path to redirect after switching (default: /studio)
 * @returns Success/error message
 */
export async function switchWorkspaceAction(formData: FormData) {
  const workspaceId = formData.get('workspaceId') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/studio'

  if (!workspaceId || typeof workspaceId !== 'string') {
    return { error: 'Workspace ID is required' }
  }

  // Get current session
  const session = await getCurrentSession()

  if (!session.isValid || session.isExpired) {
    redirect('/auth/demo-signin')
  }

  // Verify user has access to target workspace
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.userId,
        workspaceId,
      },
    },
  })

  if (!membership) {
    return { error: 'You do not have access to this workspace' }
  }

  // Update session with new workspace
  await setSession(session.userId, workspaceId)

  // Redirect to specified path
  redirect(redirectTo)
}
