/**
 * Studio Lesson Insights API Route
 *
 * LA3-P2-05: Read-only reporting API endpoint for lesson-level insights.
 *
 * GET /api/studio/lessons/[lessonSlug]/insights
 *
 * Returns lesson-level insights data for the active workspace.
 *
 * Requires:
 * - Authentication (valid session)
 * - Active workspace in session
 *
 * Query parameters:
 * - window: number (optional, 7 or 30, default 30)
 *
 * Returns:
 * - 200: { ok: true, insights: LessonInsights }
 * - 401: Unauthorized (no valid session)
 * - 400: Bad request (invalid window parameter)
 * - 404: Not found (workspace or lesson not found)
 * - 500: Internal server error
 *
 * @module app/api/studio/lessons/[lessonSlug]/insights/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import {
  getLessonInsights,
  DEFAULT_WINDOW_DAYS,
  WorkspaceNotFoundError,
  LessonNotFoundError,
} from '@/lib/lessonarcade/lesson-insights-service'

/**
 * GET /api/studio/lessons/[lessonSlug]/insights
 *
 * Get lesson insights for a specific lesson in the active workspace.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonSlug: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    const resolvedParams = await params

    // Get workspace from session
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.activeWorkspaceId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse window parameter
    const searchParams = request.nextUrl.searchParams
    const windowParam = searchParams.get('window')
    const windowDays = windowParam ? parseInt(windowParam, 10) : DEFAULT_WINDOW_DAYS

    // Validate window parameter
    if (windowDays !== 0 && windowDays !== 7 && windowDays !== 30) {
      return NextResponse.json(
        { error: 'Invalid window parameter. Use 7 or 30.' },
        { status: 400 }
      )
    }

    // Get lesson insights
    const insights = await getLessonInsights(prisma, {
      workspaceSlug: workspace.slug,
      lessonSlug: resolvedParams.lessonSlug,
      windowDays,
    })

    return NextResponse.json({ ok: true, insights })
  } catch (error) {
    // Handle not found errors
    if (error instanceof WorkspaceNotFoundError || error instanceof LessonNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    // Handle other errors
    console.error('Error fetching lesson insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
