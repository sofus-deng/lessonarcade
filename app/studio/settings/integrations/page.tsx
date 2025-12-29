import { Metadata } from "next"
import { requireAuth } from "@/lib/saas/session"
import { prisma } from "@/lib/db/prisma"
import { StudioHeader } from "@/components/studio/studio-header"
import { WebhooksClient } from "./webhooks-client"

export const metadata: Metadata = {
  title: "Integrations | LessonArcade Studio",
  description: "Configure webhook integrations for your workspace.",
}

/**
 * Server component for Studio Integrations page.
 *
 * LA3-P2-02: Webhook-based integration PoC
 * This page allows workspace owners and admins to configure webhook endpoints
 * for receiving notifications about collaboration events.
 */
export default async function IntegrationsPage() {
  // Require authentication
  const session = await requireAuth()

  // Fetch user and workspaces
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              webhooks: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const workspaces = user.workspaceMembers.map((m) => m.workspace)
  const activeWorkspace = workspaces.find(w => w.id === session.activeWorkspaceId)

  if (!activeWorkspace) {
    // Fallback if session workspace is invalid
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-la-muted mb-4">Workspace not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="la-studio-integrations-page" className="min-h-screen bg-la-bg">
      {/* Studio Header */}
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={workspaces}
        redirectTo="/studio/settings/integrations"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-la-surface">
              Integrations (Preview)
            </h1>
            <p className="text-la-muted mt-2">
              Configure webhook endpoints to receive notifications about collaboration events.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>PoC Note:</strong> This is a preview/demo feature. Real Slack, email, or LMS integrations would be built on top of this foundation.
              </p>
            </div>
          </div>

          {/* Webhooks Client */}
          <WebhooksClient
            webhooks={activeWorkspace.webhooks}
          />
        </div>
      </main>
    </div>
  )
}
