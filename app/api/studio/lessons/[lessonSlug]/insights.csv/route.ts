/**
 * Studio Lesson Insights CSV Export API Route
 *
 * LA3-P2-05: CSV export endpoint for lesson-level insights.
 *
 * GET /api/studio/lessons/[lessonSlug]/insights.csv
 *
 * Returns CSV download of lesson insights for active workspace.
 *
 * Requires:
 * - Authentication (valid session)
 * - Active workspace in session
 *
 * Query parameters:
 * - window: number (optional, 7 or 30, default 30)
 *
 * Returns:
 * - 200: text/csv with Content-Disposition header for download
 * - 401: Unauthorized (no valid session)
 * - 400: Bad request (invalid window parameter)
 * - 404: Not found (workspace or lesson not found)
 * - 500: Internal server error
 *
 * @module app/api/studio/lessons/[lessonSlug]/insights.csv/route
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
import { buildLessonInsightsCsv } from '@/lib/lessonarcade/lesson-insights-export'
import { sanitizeFilename } from '@/lib/utils/filename-sanitizer'

/**
 * GET /api/studio/lessons/[lessonSlug]/insights.csv
 *
 * Export lesson insights as CSV for download.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonSlug: string }> }
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

    // Build CSV
    const csv = buildLessonInsightsCsv(insights)

    // Generate safe filename
    const sanitizedWorkspaceSlug = sanitizeFilename(workspace.slug)
    const sanitizedLessonSlug = sanitizeFilename(resolvedParams.lessonSlug)
    const filename = `lessonarcade-lesson-insights-${sanitizedWorkspaceSlug}-${sanitizedLessonSlug}-${windowDays}d.csv`

    // Return CSV with download headers
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    // Handle not found errors
    if (error instanceof WorkspaceNotFoundError || error instanceof LessonNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    // Handle other errors
    console.error('Error exporting lesson insights CSV:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
