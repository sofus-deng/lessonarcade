/**
 * Studio Insights API Route
 *
 * LA3-P2-04: Read-only reporting API endpoint for workspace insights.
 *
 * GET /api/studio/insights
 *
 * Returns the same data as /studio/insights page for the active workspace.
 *
 * Requires:
 * - Authentication (valid session)
 * - Active workspace in session
 *
 * Query parameters:
 * - window: number (optional, 7 or 30, default 30)
 *
 * Returns:
 * - 200: { ok: true, insights: WorkspaceInsights }
 * - 401: Unauthorized (no valid session)
 * - 400: Bad request (invalid window parameter)
 * - 404: Not found (workspace not found)
 * - 500: Internal server error
 *
 * @module app/api/studio/insights/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { getWorkspaceInsights, DEFAULT_WINDOW_DAYS } from '@/lib/lessonarcade/analytics-service'

/**
 * GET /api/studio/insights
 *
 * Get workspace insights for the active workspace.
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
    if (windowDays !== 0 && windowDays !== 7 && windowDays !== 30) {
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

    return NextResponse.json({ ok: true, insights })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
