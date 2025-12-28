/**
 * Workspace Insights Analytics Service
 *
 * This module provides analytics functions for workspace insights dashboard.
 * It aggregates learning effectiveness metrics within a configurable time window.
 *
 * LA3-P2-03: Workspace Insights / Learning Effectiveness Dashboard
 */

import { PrismaClient } from '@prisma/client'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default time window in days
 */
export const DEFAULT_WINDOW_DAYS = 30

/**
 * Minimum runs required for a lesson to be considered for "struggling lessons"
 */
export const MIN_RUNS_FOR_STRUGGLING = 3

// ============================================================================
// DTO TYPES
// ============================================================================

/**
 * Options for fetching workspace insights
 */
export interface WorkspaceInsightsOptions {
  workspaceSlug: string
  windowDays?: number
}

/**
 * Struggling lesson entry
 */
export interface StrugglingLesson {
  lessonSlug: string
  title: string
  runCount: number
  avgScorePercent: number
}

/**
 * Engaged lesson entry
 */
export interface EngagedLesson {
  lessonSlug: string
  title: string
  runCount: number
  avgScorePercent: number | null
}

/**
 * Activity entry type
 */
export type ActivityType = 'run' | 'comment'

/**
 * Activity entry for recent activity timeline
 */
export interface ActivityEntry {
  type: ActivityType
  timestamp: Date
  lessonSlug: string
  lessonTitle: string
  description: string
}

/**
 * Complete DTO for workspace insights
 */
export interface WorkspaceInsights {
  // Time window
  timeWindowStart: Date
  timeWindowEnd: Date

  // Aggregate metrics
  totalRunsInWindow: number
  avgScorePercentInWindow: number | null
  totalUniqueLearnerSessions: number
  totalCommentsInWindow: number

  // Lesson-level analytics
  topStrugglingLessons: StrugglingLesson[]
  topEngagedLessons: EngagedLesson[]

  // Recent activity
  recentActivity: ActivityEntry[]
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get workspace insights with time-windowed metrics
 *
 * This function:
 * 1. Resolves the workspace by slug
 * 2. Computes time window based on windowDays (default 30)
 * 3. Queries LessonRun and LessonComment within the window
 * 4. Aggregates metrics and lesson-level statistics
 * 5. Returns a complete insights DTO
 *
 * @param prisma - Prisma client instance
 * @param options - Workspace insights options
 * @returns DTO with workspace insights
 * @throws Error if workspace not found
 */
export async function getWorkspaceInsights(
  prisma: PrismaClient,
  options: WorkspaceInsightsOptions
): Promise<WorkspaceInsights> {
  const { workspaceSlug, windowDays = DEFAULT_WINDOW_DAYS } = options

  // 1. Resolve workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    throw new Error(`Workspace with slug "${workspaceSlug}" not found`)
  }

  // 2. Compute time window
  const timeWindowEnd = new Date()
  const timeWindowStart = new Date(
    timeWindowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000
  )

  // 3. Query lesson runs within window
  const runs = await prisma.lessonRun.findMany({
    where: {
      workspaceId: workspace.id,
      startedAt: { gte: timeWindowStart },
    },
    include: {
      lesson: true,
    },
  })

  // 4. Query lesson comments within window
  const comments = await prisma.lessonComment.findMany({
    where: {
      workspaceId: workspace.id,
      createdAt: { gte: timeWindowStart },
    },
    include: {
      lesson: true,
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // 5. Aggregate metrics
  const totalRunsInWindow = runs.length

  // Calculate average score percentage
  let totalScorePercent = 0
  let validScoreCount = 0
  for (const run of runs) {
    if (run.maxScore > 0) {
      const scorePercent = (run.score / run.maxScore) * 100
      totalScorePercent += scorePercent
      validScoreCount++
    }
  }
  const avgScorePercentInWindow =
    validScoreCount > 0 ? Math.round((totalScorePercent / validScoreCount) * 10) / 10 : null

  // Count unique learner sessions (anonymousSessionId)
  const uniqueSessionIds = new Set(
    runs
      .map((run) => run.anonymousSessionId)
      .filter((id): id is string => id !== null)
  )
  const totalUniqueLearnerSessions = uniqueSessionIds.size

  const totalCommentsInWindow = comments.length

  // 6. Aggregate lesson-level statistics
  const lessonStats = new Map<
    string,
    {
      lessonSlug: string
      title: string
      runCount: number
      totalScorePercent: number
      validScoreCount: number
    }
  >()

  for (const run of runs) {
    const existing = lessonStats.get(run.lessonId) || {
      lessonSlug: run.lesson.slug,
      title: run.lesson.title,
      runCount: 0,
      totalScorePercent: 0,
      validScoreCount: 0,
    }

    existing.runCount++

    if (run.maxScore > 0) {
      const scorePercent = (run.score / run.maxScore) * 100
      existing.totalScorePercent += scorePercent
      existing.validScoreCount++
    }

    lessonStats.set(run.lessonId, existing)
  }

  // 7. Compute top struggling lessons (lowest avg score with min runs)
  const strugglingLessons: StrugglingLesson[] = []
  for (const stats of lessonStats.values()) {
    if (stats.runCount >= MIN_RUNS_FOR_STRUGGLING && stats.validScoreCount > 0) {
      const avgScorePercent =
        Math.round((stats.totalScorePercent / stats.validScoreCount) * 10) / 10
      strugglingLessons.push({
        lessonSlug: stats.lessonSlug,
        title: stats.title,
        runCount: stats.runCount,
        avgScorePercent,
      })
    }
  }
  strugglingLessons.sort((a, b) => a.avgScorePercent - b.avgScorePercent)
  const topStrugglingLessons = strugglingLessons.slice(0, 3)

  // 8. Compute top engaged lessons (highest run count)
  const engagedLessons: EngagedLesson[] = []
  for (const stats of lessonStats.values()) {
    const avgScorePercent =
      stats.validScoreCount > 0
        ? Math.round((stats.totalScorePercent / stats.validScoreCount) * 10) / 10
        : null
    engagedLessons.push({
      lessonSlug: stats.lessonSlug,
      title: stats.title,
      runCount: stats.runCount,
      avgScorePercent,
    })
  }
  engagedLessons.sort((a, b) => b.runCount - a.runCount)
  const topEngagedLessons = engagedLessons.slice(0, 3)

  // 9. Build recent activity timeline (last 5 events)
  const activityEntries: ActivityEntry[] = []

  // Add run completions
  for (const run of runs) {
    if (run.completedAt) {
      const scorePercent =
        run.maxScore > 0 ? Math.round((run.score / run.maxScore) * 100) : 0
      activityEntries.push({
        type: 'run',
        timestamp: run.completedAt,
        lessonSlug: run.lesson.slug,
        lessonTitle: run.lesson.title,
        description: `Completed with ${scorePercent}% score`,
      })
    }
  }

  // Add comments
  for (const comment of comments) {
    activityEntries.push({
      type: 'comment',
      timestamp: comment.createdAt,
      lessonSlug: comment.lesson.slug,
      lessonTitle: comment.lesson.title,
      description: `Comment added by ${comment.author.name}`,
    })
  }

  // Sort by timestamp descending and take last 5
  activityEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const recentActivity = activityEntries.slice(0, 5)

  // 10. Return complete insights
  return {
    timeWindowStart,
    timeWindowEnd,
    totalRunsInWindow,
    avgScorePercentInWindow,
    totalUniqueLearnerSessions,
    totalCommentsInWindow,
    topStrugglingLessons,
    topEngagedLessons,
    recentActivity,
  }
}
