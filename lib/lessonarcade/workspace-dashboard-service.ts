/**
 * Workspace Dashboard Service
 *
 * This module provides data access functions for the workspace dashboard.
 * It aggregates workspace-level statistics and provides a clean DTO for the UI components.
 */

import { PrismaClient } from '@prisma/client'

// ============================================================================
// DTO TYPES
// ============================================================================

/**
 * Top lesson info for the dashboard.
 */
export interface TopLesson {
  id: string
  slug: string
  title: string
  totalRuns: number
  averageScorePercent: number | null
}

/**
 * Complete DTO for the workspace dashboard overview.
 */
export interface WorkspaceOverviewDTO {
  workspaceName: string
  workspaceSlug: string
  totalLessons: number
  totalLessonRuns: number
  avgScorePercent: number | null
  lastCompletedAt: Date | null
  topLessons: TopLesson[]
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get the workspace overview with aggregated statistics by workspace slug.
 *
 * This function:
 * 1. Resolves the Workspace row by slug
 * 2. Aggregates workspace-level stats
 * 3. Identifies top lessons by run count
 *
 * @param prisma - Prisma client instance
 * @param workspaceSlug - Workspace slug
 * @returns DTO with workspace info and aggregated stats
 * @throws Error if workspace not found or database error occurs
 */
export async function getWorkspaceOverviewBySlug(
  prisma: PrismaClient,
  workspaceSlug: string
): Promise<WorkspaceOverviewDTO> {
  // 1. Resolve workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      lessons: {
        include: {
          runs: true,
        },
      },
    },
  })

  if (!workspace) {
    throw new Error(`Workspace with slug "${workspaceSlug}" not found`)
  }

  // 2. Aggregate stats
  const totalLessons = workspace.lessons.length
  let totalLessonRuns = 0
  let totalScoreSum = 0
  let validScoreCount = 0
  let lastCompletedAt: Date | null = null

  const lessonStats = workspace.lessons.map((lesson) => {
    const runs = lesson.runs
    const runCount = runs.length
    totalLessonRuns += runCount

    let lessonScoreSum = 0
    let lessonValidScoreCount = 0

    for (const run of runs) {
      if (run.completedAt) {
        // Track overall last completed
        if (!lastCompletedAt || run.completedAt > lastCompletedAt) {
          lastCompletedAt = run.completedAt
        }

        // Aggregate scores if valid
        if (run.maxScore > 0) {
          const scorePercent = (run.score / run.maxScore) * 100
          totalScoreSum += scorePercent
          validScoreCount++
          
          lessonScoreSum += scorePercent
          lessonValidScoreCount++
        }
      }
    }

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      totalRuns: runCount,
      averageScorePercent: lessonValidScoreCount > 0 
        ? Math.round((lessonScoreSum / lessonValidScoreCount) * 10) / 10 
        : null,
    }
  })

  // 3. Compute top lessons (top 3 by run count)
  const topLessons = [...lessonStats]
    .sort((a, b) => b.totalRuns - a.totalRuns)
    .slice(0, 3)

  const avgScorePercent = validScoreCount > 0
    ? Math.round((totalScoreSum / validScoreCount) * 10) / 10
    : null

  return {
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    totalLessons,
    totalLessonRuns,
    avgScorePercent,
    lastCompletedAt,
    topLessons,
  }
}
