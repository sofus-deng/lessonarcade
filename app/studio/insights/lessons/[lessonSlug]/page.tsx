import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { StudioHeader } from '@/components/studio/studio-header'
import {
  getLessonInsights,
  DEFAULT_WINDOW_DAYS,
  WorkspaceNotFoundError,
  LessonNotFoundError,
} from '@/lib/lessonarcade/lesson-insights-service'
import { Download, PlayCircle, BarChart3, Users, MessageSquare, Clock } from 'lucide-react'
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

export const metadata: Metadata = {
  title: 'Lesson Insights | LessonArcade Studio',
  description: 'Learning effectiveness metrics and analytics for a specific lesson.',
  keywords: ['insights', 'analytics', 'lesson', 'workspace', 'studio'],
}

/**
 * Server component for the lesson insights drilldown page.
 *
 * This page:
 * - Requires authentication (redirects to sign-in if not signed in)
 * - Fetches lesson insights with time-windowed metrics
 * - Displays aggregate metrics, mode breakdown, daily buckets, and recent activity
 * - Supports time window selection via query params (?window=7 or ?window=30)
 * - Provides CSV export functionality
 */
export default async function LessonInsightsPage({
  params,
  searchParams,
}: {
  params: { lessonSlug: string }
  searchParams: { window?: string }
}) {
  // Require authentication
  const session = await requireAuth()
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

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
  const windowDays = resolvedSearchParams.window
    ? parseInt(resolvedSearchParams.window, 10)
    : DEFAULT_WINDOW_DAYS
  const validWindowDays =
    windowDays === 0 || windowDays === 7 || windowDays === 30
      ? windowDays
      : DEFAULT_WINDOW_DAYS

  // Fetch lesson insights
  let insights: Awaited<ReturnType<typeof getLessonInsights>> | null = null

  try {
    insights = await getLessonInsights(prisma, {
      workspaceSlug: activeWorkspace.slug,
      lessonSlug: resolvedParams.lessonSlug,
      windowDays: validWindowDays,
    })
  } catch (error) {
    if (error instanceof WorkspaceNotFoundError || error instanceof LessonNotFoundError) {
      notFound()
    }
    // If other error, provide fallback
    insights = null
  }

  // Format time window label
  const timeWindowLabel =
    validWindowDays === 7
      ? 'Last 7 days'
      : validWindowDays === 0
        ? 'Last 0 days'
        : 'Last 30 days'

  const hasDailyActivity =
    insights?.dailyBuckets.some(
      (bucket) => bucket.runs > 0 || bucket.avgScorePercent !== null
    ) ?? false

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
    <div data-testid="la-studio-lesson-insights-page" className="min-h-screen bg-la-bg">
      {/* Studio Header */}
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={workspaces}
        redirectTo={`/studio/insights/lessons/${resolvedParams.lessonSlug}`}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-la-surface">
                {insights ? insights.lesson.title : 'Lesson Insights'}
              </h1>
              <p className="text-la-muted">
                {insights ? (
                  <>
                    {insights.lesson.slug} • {timeWindowLabel}
                  </>
                ) : (
                  'Loading lesson insights...'
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Window Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-la-muted">Time window:</span>
                <div className="flex rounded-lg border border-la-border overflow-hidden">
                  <Link
                    href={`?window=7`}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      validWindowDays === 7
                        ? 'bg-la-accent text-la-bg'
                        : 'bg-la-surface text-la-surface hover:bg-la-muted/25'
                    }`}
                  >
                    7 days
                  </Link>
                  <Link
                    href={`?window=30`}
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

              {/* Export CSV Button */}
              {insights && (
                <Link
                  href={`/api/studio/lessons/${resolvedParams.lessonSlug}/insights.csv?window=${validWindowDays}`}
                  data-testid="la-lesson-insights-export-csv"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-la-bg bg-la-accent rounded-lg hover:bg-la-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Link>
              )}
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
                    <div className="text-2xl font-bold">{insights.totalRuns}</div>
                    <p className="text-xs text-la-muted">{timeWindowLabel}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-la-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {insights.avgScorePercent !== null
                        ? `${insights.avgScorePercent}%`
                        : '—'}
                    </div>
                    <p className="text-xs text-la-muted">{timeWindowLabel}</p>
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
                      {insights.uniqueSessions}
                    </div>
                    <p className="text-xs text-la-muted">{timeWindowLabel}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Comments</CardTitle>
                    <MessageSquare className="h-4 w-4 text-la-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">
                        {insights.openComments}
                      </div>
                      <span className="text-la-muted">/</span>
                      <div className="text-2xl font-bold text-la-muted">
                        {insights.resolvedComments}
                      </div>
                    </div>
                    <p className="text-xs text-la-muted">
                      Open / Resolved • {timeWindowLabel}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Mode Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Mode Breakdown</CardTitle>
                  <CardDescription>
                    Distribution of runs by play mode
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-la-muted mb-1">Focus Mode</p>
                      <p className="text-2xl font-bold">
                        {insights.modeBreakdown.focusRuns}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-la-muted mb-1">Arcade Mode</p>
                      <p className="text-2xl font-bold">
                        {insights.modeBreakdown.arcadeRuns}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Buckets Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity (UTC)</CardTitle>
                  <CardDescription>
                    Runs and average scores by day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasDailyActivity ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date (UTC)</TableHead>
                          <TableHead className="text-right">Runs</TableHead>
                          <TableHead className="text-right">
                            Avg Score %
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.dailyBuckets.map((bucket) => (
                          <TableRow key={bucket.date}>
                            <TableCell className="font-medium">
                              {bucket.date}
                            </TableCell>
                            <TableCell className="text-right">
                              {bucket.runs}
                            </TableCell>
                            <TableCell className="text-right">
                              {bucket.avgScorePercent !== null
                                ? `${bucket.avgScorePercent}%`
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-12 text-center text-la-muted">
                      No daily activity data in this time window
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-la-accent" />
                    <CardTitle>Recent Activity</CardTitle>
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
                              <span className="font-medium text-la-surface capitalize">
                                {activity.type}
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
                    <div className="py-12 text-center text-la-muted">
                      No recent activity in this time window
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-la-muted">
                Unable to load lesson insights. Please try again later.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
