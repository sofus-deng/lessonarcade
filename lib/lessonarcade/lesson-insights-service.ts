/**
 * Lesson Insights Analytics Service
 *
 * This module provides analytics functions for lesson-level insights dashboard.
 * It aggregates learning effectiveness metrics for a specific lesson within a configurable time window.
 *
 * LA3-P2-05: Lesson Drilldown Insights (v0.3)
 */

import { PrismaClient, LessonRunMode, CommentStatus } from '@prisma/client'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default time window in days
 */
export const DEFAULT_WINDOW_DAYS = 30

// ============================================================================
// DTO TYPES
// ============================================================================

/**
 * Options for fetching lesson insights
 */
export interface LessonInsightsOptions {
  workspaceSlug: string
  lessonSlug: string
  windowDays?: number
}

/**
 * Mode breakdown for lesson runs
 */
export interface ModeBreakdown {
  focusRuns: number
  arcadeRuns: number
}

/**
 * Daily bucket for time-series analytics
 */
export interface DailyBucket {
  date: string // YYYY-MM-DD format (UTC)
  runs: number
  avgScorePercent: number | null
}

/**
 * Activity entry type for recent activity
 */
export type LessonActivityType = 'run' | 'comment'

/**
 * Activity entry for recent activity timeline
 */
export interface LessonActivityEntry {
  type: LessonActivityType
  timestamp: Date
  description: string
  // Optional structured fields for future use
  authorName?: string
  levelIndex?: number
  itemKey?: string
}

/**
 * Complete DTO for lesson insights
 */
export interface LessonInsights {
  // Time window
  timeWindowStart: Date
  timeWindowEnd: Date

  // Lesson metadata
  lesson: {
    id: string
    slug: string
    title: string
  }

  // Aggregate metrics in window
  totalRuns: number
  avgScorePercent: number | null
  modeBreakdown: ModeBreakdown
  uniqueSessions: number
  totalComments: number
  openComments: number
  resolvedComments: number

  // Daily time-series buckets
  dailyBuckets: DailyBucket[]

  // Recent activity
  recentActivity: LessonActivityEntry[]
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Error thrown when workspace is not found
 */
export class WorkspaceNotFoundError extends Error {
  constructor(workspaceSlug: string) {
    super(`Workspace with slug "${workspaceSlug}" not found`)
    this.name = 'WorkspaceNotFoundError'
  }
}

/**
 * Error thrown when lesson is not found
 */
export class LessonNotFoundError extends Error {
  constructor(lessonSlug: string, workspaceSlug: string) {
    super(`Lesson with slug "${lessonSlug}" not found in workspace "${workspaceSlug}"`)
    this.name = 'LessonNotFoundError'
  }
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get lesson insights with time-windowed metrics
 *
 * This function:
 * 1. Resolves the workspace by slug
 * 2. Resolves the lesson by workspace + lesson slug
 * 3. Computes time window based on windowDays (default 30)
 * 4. Queries LessonRun and LessonComment within the window for the lesson
 * 5. Aggregates metrics and daily buckets
 * 6. Builds recent activity timeline (last 10 events)
 * 7. Returns a complete insights DTO
 *
 * @param prisma - Prisma client instance
 * @param options - Lesson insights options
 * @returns DTO with lesson insights
 * @throws WorkspaceNotFoundError if workspace not found
 * @throws LessonNotFoundError if lesson not found
 */
export async function getLessonInsights(
  prisma: PrismaClient,
  options: LessonInsightsOptions
): Promise<LessonInsights> {
  const { workspaceSlug, lessonSlug, windowDays = DEFAULT_WINDOW_DAYS } = options

  // 1. Resolve workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    throw new WorkspaceNotFoundError(workspaceSlug)
  }

  // 2. Resolve lesson (scoped to workspace)
  const lesson = await prisma.lesson.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: lessonSlug,
      },
    },
  })

  if (!lesson) {
    throw new LessonNotFoundError(lessonSlug, workspaceSlug)
  }

  // 3. Compute time window
  const timeWindowEnd = new Date()
  const timeWindowStart = new Date(
    timeWindowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000
  )

  // 4. Query lesson runs within window for this lesson
  const runs = await prisma.lessonRun.findMany({
    where: {
      workspaceId: workspace.id,
      lessonId: lesson.id,
      startedAt: { gte: timeWindowStart },
    },
    orderBy: { startedAt: 'desc' },
  })

  // 5. Query lesson comments within window for this lesson
  const comments = await prisma.lessonComment.findMany({
    where: {
      workspaceId: workspace.id,
      lessonId: lesson.id,
      createdAt: { gte: timeWindowStart },
    },
    include: {
      author: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // 6. Aggregate metrics
  const totalRuns = runs.length

  // Calculate average score percentage (only for valid score/maxScore)
  let totalScorePercent = 0
  let validScoreCount = 0
  for (const run of runs) {
    if (run.maxScore > 0) {
      const scorePercent = (run.score / run.maxScore) * 100
      totalScorePercent += scorePercent
      validScoreCount++
    }
  }
  const avgScorePercent =
    validScoreCount > 0 ? Math.round((totalScorePercent / validScoreCount) * 10) / 10 : null

  // Mode breakdown
  const modeBreakdown: ModeBreakdown = {
    focusRuns: runs.filter((r) => r.mode === LessonRunMode.focus).length,
    arcadeRuns: runs.filter((r) => r.mode === LessonRunMode.arcade).length,
  }

  // Count unique sessions (distinct anonymousSessionId, non-null)
  const uniqueSessionIds = new Set(
    runs
      .map((run) => run.anonymousSessionId)
      .filter((id): id is string => id !== null)
  )
  const uniqueSessions = uniqueSessionIds.size

  // Comment counts
  const totalComments = comments.length
  const openComments = comments.filter((c) => c.status === CommentStatus.OPEN).length
  const resolvedComments = comments.filter(
    (c) => c.status === CommentStatus.RESOLVED
  ).length

  // 7. Build daily buckets (UTC day boundaries)
  const dailyBucketsMap = new Map<string, DailyBucket>()

  // Initialize buckets for each day in window
  const currentStart = new Date(timeWindowStart)
  const currentEnd = new Date(timeWindowEnd)

  // Iterate through each day in window
  for (
    let day = new Date(currentStart);
    day <= currentEnd;
    day.setDate(day.getDate() + 1)
  ) {
    const dateKey = getUtcDateKey(day)
    dailyBucketsMap.set(dateKey, {
      date: dateKey,
      runs: 0,
      avgScorePercent: null,
    })
  }

  // Aggregate runs into daily buckets
  for (const run of runs) {
    if (!run.completedAt) continue // Only count completed runs for daily buckets

    const dateKey = getUtcDateKey(run.completedAt)
    const bucket = dailyBucketsMap.get(dateKey)

    if (bucket) {
      bucket.runs++
      // Update average score for this bucket
      if (run.maxScore > 0) {
        const scorePercent = (run.score / run.maxScore) * 100
        if (bucket.avgScorePercent === null) {
          bucket.avgScorePercent = scorePercent
        } else {
          // Recalculate average
          const completedRunsInBucket = runs.filter(
            (r) =>
              r.completedAt && getUtcDateKey(r.completedAt) === dateKey
          ).length
          bucket.avgScorePercent =
            Math.round(
              ((bucket.avgScorePercent * (completedRunsInBucket - 1) + scorePercent) /
                completedRunsInBucket
            ) * 10
            ) / 10
        }
      }
    }
  }

  // Convert map to array and sort by date
  const dailyBuckets = Array.from(dailyBucketsMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  // 8. Build recent activity timeline (last 10 events)
  const activityEntries: LessonActivityEntry[] = []

  // Add run completions
  for (const run of runs) {
    if (run.completedAt) {
      const scorePercent =
        run.maxScore > 0 ? Math.round((run.score / run.maxScore) * 100) : null
      activityEntries.push({
        type: 'run',
        timestamp: run.completedAt,
        description: scorePercent !== null
          ? `Completed with ${scorePercent}% score`
          : 'Completed',
      })
    }
  }

  // Add comments
  for (const comment of comments) {
    activityEntries.push({
      type: 'comment',
      timestamp: comment.createdAt,
      description: `Comment added by ${comment.author.name}`,
      authorName: comment.author.name,
      levelIndex: comment.levelIndex ?? undefined,
      itemKey: comment.itemKey ?? undefined,
    })
  }

  // Sort by timestamp descending and take last 10
  activityEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const recentActivity = activityEntries.slice(0, 10)

  // 9. Return complete insights
  return {
    timeWindowStart,
    timeWindowEnd,
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
    },
    totalRuns,
    avgScorePercent,
    modeBreakdown,
    uniqueSessions,
    totalComments,
    openComments,
    resolvedComments,
    dailyBuckets,
    recentActivity,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get UTC date key (YYYY-MM-DD) from a Date object
 *
 * @param date - Date to convert
 * @returns UTC date key string
 */
function getUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
