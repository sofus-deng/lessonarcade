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
 */
export async function getDemoWorkspaceLessonsOverview(
  prisma: PrismaClient
): Promise<LessonsOverviewDTO> {
  // 1. Look up the demo workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: DEMO_WORKSPACE_SLUG },
  })

  if (!workspace) {
    throw new Error(`Workspace with slug "${DEMO_WORKSPACE_SLUG}" not found`)
  }

  // 2. Query all lessons for the workspace
  const lessons = await prisma.lesson.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { title: 'asc' },
  })

  // 3. Query all LessonRun records for these lessons
  const lessonIds = lessons.map((l) => l.id)
  const runs = await prisma.lessonRun.findMany({
    where: {
      lessonId: { in: lessonIds },
    },
    orderBy: { completedAt: 'desc' },
  })

  // 4. Aggregate stats per lesson
  const lessonStatsMap = new Map<string, LessonStats>()

  // Initialize stats for all lessons
  for (const lesson of lessons) {
    lessonStatsMap.set(lesson.id, {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      status: lesson.status,
      runCount: 0,
      averageScorePercent: null,
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
      const scorePercent = (run.score / run.maxScore) * 100
      if (stats.averageScorePercent === null) {
        stats.averageScorePercent = scorePercent
      } else {
        // Running average
        stats.averageScorePercent =
          (stats.averageScorePercent * (stats.runCount - 1) + scorePercent) /
          stats.runCount
      }

      // Track most recent completed run
      if (
        stats.lastCompletedAt === null ||
        run.completedAt > stats.lastCompletedAt
      ) {
        stats.lastCompletedAt = run.completedAt
      }
    }
  }

  // Convert map to array and round average scores
  const lessonsWithStats = Array.from(lessonStatsMap.values()).map(
    (lesson) => ({
      ...lesson,
      averageScorePercent: lesson.averageScorePercent
        ? Math.round(lesson.averageScorePercent * 10) / 10
        : null,
    })
  )

  // 5. Compute totals
  const totalLessons = lessons.length
  const totalRuns = runs.length

  // Calculate average score across all completed runs
  const completedRuns = runs.filter((r) => r.completedAt && r.maxScore > 0)
  let averageScorePercent: number | null = null
  if (completedRuns.length > 0) {
    const totalScorePercent = completedRuns.reduce((sum, run) => {
      return sum + (run.score / run.maxScore) * 100
    }, 0)
    averageScorePercent = Math.round(
      (totalScorePercent / completedRuns.length) * 10
    ) / 10
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
