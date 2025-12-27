/**
 * Lesson Dashboard Service
 *
 * This module provides data access functions for the lessons overview dashboard.
 * It aggregates lesson statistics from LessonRun records and provides a clean DTO
 * for the UI components.
 */

import { PrismaClient, LessonStatus } from '@prisma/client'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Demo workspace slug constant.
 * This is centralized for easy refactoring when multi-workspace switching is added.
 */
export const DEMO_WORKSPACE_SLUG = 'demo'

// ============================================================================
// DTO TYPES
// ============================================================================

/**
 * Statistics for a single lesson.
 */
export interface LessonStats {
  id: string
  slug: string
  title: string
  status: LessonStatus
  runCount: number
  averageScorePercent: number | null
  lastCompletedAt: Date | null
}

/**
 * Summary information about a workspace.
 */
export interface WorkspaceSummary {
  id: string
  slug: string
  name: string
}

/**
 * Aggregated totals across all lessons in a workspace.
 */
export interface DashboardTotals {
  totalLessons: number
  totalRuns: number
  averageScorePercent: number | null
}

/**
 * Complete DTO for the lessons overview dashboard.
 */
export interface LessonsOverviewDTO {
  workspace: WorkspaceSummary
  lessons: LessonStats[]
  totals: DashboardTotals
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get the demo workspace lessons overview with aggregated statistics.
 *
 * This function:
 * 1. Looks up the "demo" workspace
 * 2. Queries all lessons for that workspace
 * 3. Queries all LessonRun records for those lessons
 * 4. Aggregates stats per lesson (runCount, averageScorePercent, lastCompletedAt)
 * 5. Computes totals across all lessons
 *
 * @param prisma - Prisma client instance
 * @returns DTO with workspace info, lessons with stats, and totals
 * @throws Error if workspace not found or database error occurs
 *
 * @deprecated Use getWorkspaceLessonsOverview instead for multi-workspace support
 */
export async function getDemoWorkspaceLessonsOverview(
  prisma: PrismaClient
): Promise<LessonsOverviewDTO> {
  return getWorkspaceLessonsOverview(prisma, DEMO_WORKSPACE_SLUG)
}

/**
 * Get workspace lessons overview with aggregated statistics by workspace ID.
 *
 * This function:
 * 1. Looks up the workspace by ID
 * 2. Queries all lessons for that workspace
 * 3. Queries all LessonRun records for those lessons
 * 4. Aggregates stats per lesson (runCount, averageScorePercent, lastCompletedAt)
 * 5. Computes totals across all lessons
 *
 * @param prisma - Prisma client instance
 * @param workspaceId - Workspace ID
 * @returns DTO with workspace info, lessons with stats, and totals
 * @throws Error if workspace not found or database error occurs
 */
export async function getWorkspaceLessonsOverviewById(
  prisma: PrismaClient,
  workspaceId: string
): Promise<LessonsOverviewDTO> {
  // Look up the workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  })

  if (!workspace) {
    throw new Error(`Workspace with ID "${workspaceId}" not found`)
  }

  return buildLessonsOverview(prisma, workspace)
}

/**
 * Get workspace lessons overview with aggregated statistics by workspace slug.
 *
 * This function:
 * 1. Looks up the workspace by slug
 * 2. Queries all lessons for that workspace
 * 3. Queries all LessonRun records for those lessons
 * 4. Aggregates stats per lesson (runCount, averageScorePercent, lastCompletedAt)
 * 5. Computes totals across all lessons
 *
 * @param prisma - Prisma client instance
 * @param workspaceSlug - Workspace slug
 * @returns DTO with workspace info, lessons with stats, and totals
 * @throws Error if workspace not found or database error occurs
 */
export async function getWorkspaceLessonsOverview(
  prisma: PrismaClient,
  workspaceSlug: string
): Promise<LessonsOverviewDTO> {
  // Look up the workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    throw new Error(`Workspace with slug "${workspaceSlug}" not found`)
  }

  return buildLessonsOverview(prisma, workspace)
}

/**
 * Internal helper to track statistics for a lesson during aggregation
 */
interface AggregatedStats {
  runCount: number
  completedCount: number
  totalScorePercent: number
  lastCompletedAt: Date | null
}

/**
 * Build lessons overview DTO from workspace data.
 *
 * @param prisma - Prisma client instance
 * @param workspace - Workspace entity
 * @returns DTO with workspace info, lessons with stats, and totals
 */
async function buildLessonsOverview(
  prisma: PrismaClient,
  workspace: { id: string; slug: string; name: string }
): Promise<LessonsOverviewDTO> {
  // Query all lessons for the workspace
  const lessons = await prisma.lesson.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { title: 'asc' },
  })

  // Query all LessonRun records for these lessons
  const lessonIds = lessons.map((l) => l.id)
  const runs = await prisma.lessonRun.findMany({
    where: {
      lessonId: { in: lessonIds },
    },
    orderBy: { completedAt: 'desc' },
  })

  // Aggregate stats per lesson
  const lessonStatsMap = new Map<string, AggregatedStats>()

  // Initialize stats for all lessons
  for (const lesson of lessons) {
    lessonStatsMap.set(lesson.id, {
      runCount: 0,
      completedCount: 0,
      totalScorePercent: 0,
      lastCompletedAt: null,
    })
  }

  // Aggregate runs
  for (const run of runs) {
    const stats = lessonStatsMap.get(run.lessonId)
    if (!stats) continue

    stats.runCount++

    // Only include completed runs in average score calculation
    if (run.completedAt && run.maxScore > 0) {
      stats.completedCount++
      stats.totalScorePercent += (run.score / run.maxScore) * 100

      // Track most recent completed run
      if (
        stats.lastCompletedAt === null ||
        run.completedAt > stats.lastCompletedAt
      ) {
        stats.lastCompletedAt = run.completedAt
      }
    }
  }

  // Convert map to final LessonStats array
  const lessonsWithStats: LessonStats[] = lessons.map((lesson) => {
    const agg = lessonStatsMap.get(lesson.id)!
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      status: lesson.status,
      runCount: agg.runCount,
      averageScorePercent:
        agg.completedCount > 0
          ? Math.round((agg.totalScorePercent / agg.completedCount) * 10) / 10
          : null,
      lastCompletedAt: agg.lastCompletedAt,
    }
  })

  // Compute workspace totals
  const totalLessons = lessons.length
  const totalRuns = runs.length

  // Calculate average score across all completed runs in the workspace
  const completedRuns = runs.filter((r) => r.completedAt && r.maxScore > 0)
  let averageScorePercent: number | null = null
  if (completedRuns.length > 0) {
    const totalWorkspaceScorePercent = completedRuns.reduce((sum, run) => {
      return sum + (run.score / run.maxScore) * 100
    }, 0)
    averageScorePercent =
      Math.round((totalWorkspaceScorePercent / completedRuns.length) * 10) / 10
  }

  return {
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
    },
    lessons: lessonsWithStats,
    totals: {
      totalLessons,
      totalRuns,
      averageScorePercent,
    },
  }
}
