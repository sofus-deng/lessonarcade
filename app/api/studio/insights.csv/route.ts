/**
 * Studio Insights CSV Export API Route
 *
 * LA3-P2-04: CSV export endpoint for workspace insights.
 *
 * GET /api/studio/insights.csv
 *
 * Returns CSV download of workspace insights for active workspace.
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
 * - 404: Not found (workspace not found)
 * - 500: Internal server error
 *
 * @module app/api/studio/insights.csv/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { getWorkspaceInsights, DEFAULT_WINDOW_DAYS } from '@/lib/lessonarcade/analytics-service'
import { buildWorkspaceInsightsCsv } from '@/lib/lessonarcade/analytics-export'

/**
 * GET /api/studio/insights.csv
 *
 * Export workspace insights as CSV for download.
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()

    // Parse window parameter
    const searchParams = request.nextUrl.searchParams
    const windowParam = searchParams.get('window')
    const windowDays = windowParam ? parseInt(windowParam, 10) : DEFAULT_WINDOW_DAYS

    // Validate window parameter
    if (windowDays !== 7 && windowDays !== 30) {
      return NextResponse.json(
        { error: 'Invalid window parameter. Use 7 or 30.' },
        { status: 400 }
      )
    }

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

    // Get insights
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: workspace.slug,
      windowDays,
    })

    // Build CSV
    const csv = buildWorkspaceInsightsCsv(insights)

    // Generate filename
    const filename = `lessonarcade-insights-${workspace.slug}-${windowDays}d.csv`

    // Return CSV with download headers
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting insights CSV:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
