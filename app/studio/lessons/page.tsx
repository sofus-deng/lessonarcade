import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/saas/session'
import { getWorkspaceLessonsOverviewById } from '@/lib/lessonarcade/lesson-dashboard-service'
import { LessonsTableClient } from './lessons-table-client'
import { StudioHeader } from '@/components/studio/studio-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Lessons Overview | LessonArcade Studio',
  description: 'View and manage lessons in your workspace with aggregated analytics.',
  keywords: ['lessons', 'analytics', 'workspace', 'studio'],
}

/**
 * Server component for the lessons overview page.
 *
 * This page:
 * - Requires authentication (redirects to sign-in if not signed in)
 * - Fetches workspace and lessons data from the database
 * - Displays a summary panel with totals
 * - Renders a searchable table of lessons with stats
 */
export default async function LessonsOverviewPage() {
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

  // Fetch lessons overview for active workspace
  let overview: Awaited<ReturnType<typeof getWorkspaceLessonsOverviewById>> | null = null

  try {
    overview = await getWorkspaceLessonsOverviewById(prisma, session.activeWorkspaceId)
  } catch {
    // If workspace not found, provide a fallback empty state
    overview = null
  }

  return (
    <div data-testid="la-lessons-overview-page" className="min-h-screen bg-la-bg">
      {/* Studio Header */}
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={workspaces}
        redirectTo="/studio/lessons"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-la-surface mb-2">
              {overview ? overview.workspace.name : 'Lessons Overview'}
            </h1>
            <p className="text-lg text-la-muted">
              View and manage lessons with aggregated analytics
            </p>
          </div>

          {/* Summary Panel */}
          {overview ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Lessons</CardDescription>
                  <CardTitle className="text-4xl">{overview.totals.totalLessons}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Runs</CardDescription>
                  <CardTitle className="text-4xl">{overview.totals.totalRuns}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Score</CardDescription>
                  <CardTitle className="text-4xl">
                    {overview.totals.averageScorePercent !== null
                      ? `${overview.totals.averageScorePercent}%`
                      : '—'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-la-muted">
                No lessons found in this workspace.
              </CardContent>
            </Card>
          )}

          {/* Lessons Table */}
          {overview && (
            <Card>
              <CardHeader>
                <CardTitle>Lessons</CardTitle>
                <CardDescription>
                  All lessons in this workspace with aggregated statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LessonsTableClient lessons={overview.lessons} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
