import { Metadata } from "next"
import { requireAuth } from "@/lib/saas/session"
import { prisma } from "@/lib/db/prisma"
import { LessonStudioForm } from "@/components/studio/lesson-studio-form"
import { StudioHeader } from "@/components/studio/studio-header"

export const metadata: Metadata = {
  title: "Lesson Studio - Create Interactive Lessons | LessonArcade",
  description: "Create interactive lessons from YouTube videos with AI-powered generation. Choose between Quick mode (URL only) or Accurate mode (URL + transcript).",
  keywords: ["lesson creator", "interactive lessons", "youtube education", "ai generation"],
}

/**
 * Server component for the Studio home page.
 *
 * This page:
 * - Requires authentication (redirects to sign-in if not signed in)
 * - Shows workspace switcher in header
 * - Displays lesson creation form
 */
export default async function StudioPage() {
  // Require authentication
  const session = await requireAuth()

  // Fetch user's workspaces
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      workspaceMembers: {
        include: {
          workspace: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const workspaces = user.workspaceMembers.map((m) => m.workspace)

  return (
    <div className="min-h-screen bg-la-bg">
      {/* Studio Header */}
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={workspaces}
        redirectTo="/studio"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-la-surface mb-4">
              Lesson Studio
            </h1>
            <p className="text-lg text-la-muted">
              Transform YouTube videos into interactive lessons with AI-powered generation
            </p>
          </div>

          {/* Studio Form */}
          <div className="bg-la-surface rounded-lg border border-la-border p-6 shadow-sm">
            <LessonStudioForm />
          </div>
        </div>
      </main>
    </div>
  )
}
