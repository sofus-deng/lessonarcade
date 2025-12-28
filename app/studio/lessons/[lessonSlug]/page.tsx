import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/saas/session'
import { StudioHeader } from '@/components/studio/studio-header'
import { LessonCommentsPanel } from './lesson-comments-panel'

export const metadata: Metadata = {
  title: 'Lesson Review | LessonArcade Studio',
  description: 'Review lesson and collaborate with comments',
}

/**
 * Lesson Review Page
 *
 * LA3-P2-01: Studio page for reviewing lessons with comments
 *
 * This page:
 * - Requires authentication
 * - Shows lesson metadata
 * - Displays comments panel with role-based editing
 * - Editors and above can add comments
 * - Viewers see comments in read-only mode
 */
export default async function LessonReviewPage({
  params,
}: {
  params: { lessonSlug: string }
}) {
  const { lessonSlug } = await params
  const session = await requireAuth()

  // Fetch workspace and lesson
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.activeWorkspaceId },
  })

  if (!workspace) {
    throw new Error('Active workspace not found')
  }

  const lesson = await prisma.lesson.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: lessonSlug,
      },
    },
  })

  if (!lesson) {
    throw new Error('Lesson not found')
  }

  // Fetch user's role in workspace
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.userId,
        workspaceId: workspace.id,
      },
    },
  })

  // Fetch user's workspaces for header
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

  const workspaces = user?.workspaceMembers.map((m) => m.workspace) ?? []

  // Determine if user can edit (EDITOR, ADMIN, or OWNER)
  const canEdit = member && ['EDITOR', 'ADMIN', 'OWNER'].includes(member.role)

  return (
    <div data-testid="la-studio-lesson-review-page" className="min-h-screen bg-la-bg">
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={workspaces}
        redirectTo={`/studio/lessons/${lessonSlug}`}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Lesson Header */}
          <div>
            <p className="text-sm text-la-muted mb-2">{workspace.name}</p>
            <h1 className="text-4xl font-bold text-la-surface mb-2">{lesson.title}</h1>
            <p className="text-la-muted">/{lesson.slug}</p>
          </div>

          {/* Comments Panel */}
          <LessonCommentsPanel
            workspaceSlug={workspace.slug}
            lessonSlug={lessonSlug}
            canEdit={canEdit}
          />
        </div>
      </main>
    </div>
  )
}
