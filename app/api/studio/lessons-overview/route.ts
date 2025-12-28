/**
 * Studio Lessons Overview API Route
 *
 * LA3-P2-04: Read-only reporting API endpoint for lessons overview.
 *
 * GET /api/studio/lessons-overview
 *
 * Returns same data as /studio/lessons page for active workspace.
 *
 * Requires:
 * - Authentication (valid session)
 * - Active workspace in session
 *
 * Returns:
 * - 200: { ok: true, lessons: LessonsOverviewDTO }
 * - 401: Unauthorized (no valid session)
 * - 404: Not found (workspace not found)
 * - 500: Internal server error
 *
 * @module app/api/studio/lessons-overview/route
 */

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { getWorkspaceLessonsOverviewById } from '@/lib/lessonarcade/lesson-dashboard-service'

/**
 * GET /api/studio/lessons-overview
 *
 * Get lessons overview for active workspace.
 */
export async function GET() {
  try {
    // Require authentication
    const session = await requireAuth()

    // Get lessons overview for active workspace
    const overview = await getWorkspaceLessonsOverviewById(prisma, session.activeWorkspaceId)

    return NextResponse.json({ ok: true, lessons: overview })
  } catch (error) {
    console.error('Error fetching lessons overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
