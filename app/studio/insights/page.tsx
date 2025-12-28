import { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { StudioHeader } from '@/components/studio/studio-header'
import { getWorkspaceInsights, DEFAULT_WINDOW_DAYS } from '@/lib/lessonarcade/analytics-service'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  PlayCircle,
  BarChart3,
  Users,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Clock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Workspace Insights | LessonArcade Studio',
  description: 'Learning effectiveness metrics and analytics for your workspace.',
  keywords: ['insights', 'analytics', 'workspace', 'learning effectiveness'],
}

/**
 * Server component for the workspace insights page.
 *
 * This page:
 * - Requires authentication (redirects to sign-in if not signed in)
 * - Fetches workspace insights with time-windowed metrics
 * - Displays aggregate metrics, struggling lessons, engaged lessons, and recent activity
 * - Supports time window selection via query params (?window=7 or ?window=30)
 */
export default async function InsightsPage({
  searchParams,
}: {
  searchParams: { window?: string }
}) {
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
  const activeWorkspace = workspaces.find((w) => w.id === session.activeWorkspaceId)

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-la-muted mb-4">Workspace not found.</p>
          <Link href="/auth/demo-signin" className="text-la-accent hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Parse window parameter (default to 30 days)
  const windowDays = searchParams.window
    ? parseInt(searchParams.window, 10)
    : DEFAULT_WINDOW_DAYS
  const validWindowDays =
    windowDays === 7 || windowDays === 30 ? windowDays : DEFAULT_WINDOW_DAYS

  // Fetch workspace insights
  let insights: Awaited<ReturnType<typeof getWorkspaceInsights>> | null = null

  try {
    insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: activeWorkspace.slug,
      windowDays: validWindowDays,
    })
  } catch {
    // If workspace not found or other error, provide fallback
    insights = null
  }

  // Format time window label
  const timeWindowLabel = validWindowDays === 7 ? 'Last 7 days' : 'Last 30 days'

  // Format relative time for activity entries
  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div data-testid="la-studio-insights-page" className="min-h-screen bg-la-bg">
      {/* Studio Header */}
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={workspaces}
        redirectTo="/studio/insights"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-la-surface">
                {activeWorkspace.name} Insights
              </h1>
              <p className="text-la-muted">
                Learning effectiveness metrics for your workspace
              </p>
            </div>

            {/* Window Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-la-muted">Time window:</span>
              <div className="flex rounded-lg border border-la-border overflow-hidden">
                <Link
                  href="?window=7"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    validWindowDays === 7
                      ? 'bg-la-accent text-la-bg'
                      : 'bg-la-surface text-la-surface hover:bg-la-muted/25'
                  }`}
                >
                  7 days
                </Link>
                <Link
                  href="?window=30"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    validWindowDays === 30
                      ? 'bg-la-accent text-la-bg'
                      : 'bg-la-surface text-la-surface hover:bg-la-muted/25'
                  }`}
                >
                  30 days
                </Link>
              </div>
            </div>
          </div>

          {insights ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                    <PlayCircle className="h-4 w-4 text-la-muted" />
                  </CardHeader>
                  <CardContent>
                    <div
                      data-testid="la-insights-metric-runs"
                      className="text-2xl font-bold"
                    >
                      {insights.totalRunsInWindow}
                    </div>
                    <p className="text-xs text-la-muted">
                      {timeWindowLabel}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-la-muted" />
                  </CardHeader>
                  <CardContent>
                    <div
                      data-testid="la-insights-metric-avg-score"
                      className="text-2xl font-bold"
                    >
                      {insights.avgScorePercentInWindow !== null
                        ? `${insights.avgScorePercentInWindow}%`
                        : '—'}
                    </div>
                    <p className="text-xs text-la-muted">
                      {timeWindowLabel}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      Unique Sessions
                    </CardTitle>
                    <Users className="h-4 w-4 text-la-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {insights.totalUniqueLearnerSessions}
                    </div>
                    <p className="text-xs text-la-muted">
                      {timeWindowLabel}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Comments</CardTitle>
                    <MessageSquare className="h-4 w-4 text-la-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {insights.totalCommentsInWindow}
                    </div>
                    <p className="text-xs text-la-muted">
                      {timeWindowLabel}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Lessons that need attention */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-500" />
                    <CardTitle>Lessons that need attention</CardTitle>
                  </div>
                  <CardDescription>
                    Lessons with lowest average scores (min{' '}
                    {3} runs)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {insights.topStrugglingLessons.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lesson Title</TableHead>
                          <TableHead className="text-right">Runs</TableHead>
                          <TableHead className="text-right">Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.topStrugglingLessons.map((lesson) => (
                          <TableRow key={lesson.lessonSlug}>
                            <TableCell className="font-medium">
                              {lesson.title}
                            </TableCell>
                            <TableCell className="text-right">
                              {lesson.runCount}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-orange-600 font-medium">
                                {lesson.avgScorePercent}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-la-muted mb-2">
                        No lessons need attention right now
                      </p>
                      <p className="text-sm text-la-muted">
                        Lessons need at least 3 runs to be evaluated
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Most engaged lessons */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <CardTitle>Most engaged lessons</CardTitle>
                  </div>
                  <CardDescription>
                    Lessons with highest run counts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {insights.topEngagedLessons.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lesson Title</TableHead>
                          <TableHead className="text-right">Runs</TableHead>
                          <TableHead className="text-right">Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.topEngagedLessons.map((lesson) => (
                          <TableRow key={lesson.lessonSlug}>
                            <TableCell className="font-medium">
                              {lesson.title}
                            </TableCell>
                            <TableCell className="text-right">
                              {lesson.runCount}
                            </TableCell>
                            <TableCell className="text-right">
                              {lesson.avgScorePercent !== null
                                ? `${lesson.avgScorePercent}%`
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-la-muted">
                        No lesson activity in this time window
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent activity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-la-accent" />
                    <CardTitle>Recent activity</CardTitle>
                  </div>
                  <CardDescription>
                    Latest lesson completions and comments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {insights.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {insights.recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 pb-4 border-b border-la-border/50 last:border-0 last:pb-0"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {activity.type === 'run' ? (
                              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <PlayCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-la-surface truncate">
                                {activity.lessonTitle}
                              </span>
                              <span className="text-xs text-la-muted whitespace-nowrap">
                                {formatRelativeTime(activity.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-la-muted">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-la-muted">
                        No recent activity in this time window
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-la-muted">
                Unable to load insights. Please try again later.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
