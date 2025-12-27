import { Metadata } from "next"
import Link from "next/link"
import { requireAuth } from "@/lib/saas/session"
import { prisma } from "@/lib/db/prisma"
import { StudioHeader } from "@/components/studio/studio-header"
import { getWorkspaceOverviewBySlug } from "@/lib/lessonarcade/workspace-dashboard-service"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  PlayCircle, 
  BarChart3, 
  Clock,
  PlusCircle,
  ArrowRight
} from "lucide-react"

export const metadata: Metadata = {
  title: "Studio Dashboard | LessonArcade",
  description: "Workspace overview and performance metrics.",
}

/**
 * Server component for the Studio Workspace Dashboard.
 */
export default async function StudioPage() {
  // 1. Require authentication
  const session = await requireAuth()

  // 2. Fetch user and workspaces
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
  const activeWorkspace = workspaces.find(w => w.id === session.activeWorkspaceId)

  if (!activeWorkspace) {
    // Fallback if session workspace is invalid
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-la-muted mb-4">Workspace not found.</p>
          <Button asChild>
            <Link href="/auth/demo-signin">Return to Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  // 3. Fetch workspace overview
  const overview = await getWorkspaceOverviewBySlug(prisma, activeWorkspace.slug)

  return (
    <div data-testid="la-studio-dashboard-page" className="min-h-screen bg-la-bg">
      {/* Studio Header */}
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={workspaces}
        redirectTo="/studio"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-la-surface">
                {overview.workspaceName} Dashboard
              </h1>
              <p className="text-la-muted">
                Monitor performance and manage your interactive lessons
              </p>
            </div>
            <Button asChild className="w-full md:w-auto">
              <Link href="/studio/lessons">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Lesson
              </Link>
            </Button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Lessons</CardTitle>
                <BookOpen className="h-4 w-4 text-la-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalLessons}</div>
                <p className="text-xs text-la-muted">Active in workspace</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Lesson Runs</CardTitle>
                <PlayCircle className="h-4 w-4 text-la-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalLessonRuns}</div>
                <p className="text-xs text-la-muted">Total completions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-la-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.avgScorePercent !== null ? `${overview.avgScorePercent}%` : "—"}
                </div>
                <p className="text-xs text-la-muted">Across all runs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                <Clock className="h-4 w-4 text-la-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.lastCompletedAt 
                    ? new Date(overview.lastCompletedAt).toLocaleDateString()
                    : "—"}
                </div>
                <p className="text-xs text-la-muted">Latest completion</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Top Lessons & Getting Started */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Lessons */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Lessons</CardTitle>
                <CardDescription>
                  Your most popular lessons by run count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overview.topLessons.length > 0 ? (
                  <div className="space-y-4">
                    {overview.topLessons.map((lesson) => (
                      <div 
                        key={lesson.id} 
                        className="flex items-center justify-between p-4 rounded-lg border border-la-border bg-la-bg/50"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-la-surface">{lesson.title}</span>
                          <span className="text-sm text-la-muted">/{lesson.slug}</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-la-surface">{lesson.totalRuns}</span>
                            <span className="text-xs text-la-muted">runs</span>
                          </div>
                          <div className="flex flex-col items-end min-w-[60px]">
                            <span className="text-sm font-medium text-la-surface">
                              {lesson.averageScorePercent !== null ? `${lesson.averageScorePercent}%` : "—"}
                            </span>
                            <span className="text-xs text-la-muted">avg score</span>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/studio/lessons?search=${lesson.slug}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-la-muted mb-4">No lessons yet in this workspace.</p>
                    <Button variant="outline" asChild>
                      <Link href="/studio/lessons">Create your first lesson</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links / Status */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/studio/lessons">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Manage Lessons
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/pricing">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Plans
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-la-surface/50">
                <CardHeader>
                  <CardTitle className="text-lg">Workspace Info</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-la-muted">Slug:</span>
                    <span className="font-mono text-la-surface">{overview.workspaceSlug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-la-muted">Role:</span>
                    <span className="text-la-surface">Owner</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
