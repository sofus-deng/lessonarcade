/**
 * Comments API Route
 *
 * LA3-P2-01: API endpoints for lesson comments
 *
 * GET  - List comments for a lesson in active workspace
 * POST - Create a new comment on a lesson
 *
 * @module app/api/studio/lessons/[lessonSlug]/comments/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/saas/session'
import {
  listLessonComments,
  createLessonComment,
  requireWorkspaceMemberWithRole,
  CreateCommentSchema,
} from '@/lib/lessonarcade/collaboration-service'

/**
 * GET /api/studio/lessons/[lessonSlug]/comments
 *
 * List comments for a lesson in the active workspace
 *
 * Requires:
 * - Authentication (valid session)
 * - Workspace membership (viewer minimum)
 *
 * Returns:
 * - 200: { comments: LessonCommentDTO[] }
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (not a workspace member)
 * - 404: Not found (workspace or lesson not found)
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonSlug: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    const resolvedParams = await params

    // Get active workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.activeWorkspaceId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Active workspace not found' },
        { status: 404 }
      )
    }

    // Check user is a member (viewer minimum)
    await requireWorkspaceMemberWithRole(prisma, session.userId, workspace.id, 'viewer')

    // List comments
    const comments = await listLessonComments(
      prisma,
      workspace.slug,
      resolvedParams.lessonSlug
    )

    return NextResponse.json({ comments })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not a member') || error.message.includes('does not meet')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/studio/lessons/[lessonSlug]/comments
 *
 * Create a new comment on a lesson
 *
 * Requires:
 * - Authentication (valid session)
 * - Workspace membership with editor role or higher
 *
 * Request body:
 * - body: string (required, 1-2000 characters)
 * - levelIndex: number (optional, non-negative integer)
 * - itemKey: string (optional)
 *
 * Returns:
 * - 201: { ok: true, comment: LessonCommentDTO }
 * - 400: Bad request (invalid input)
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (insufficient role)
 * - 404: Not found (workspace or lesson not found)
 * - 500: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonSlug: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    const resolvedParams = await params

    // Get active workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.activeWorkspaceId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Active workspace not found' },
        { status: 404 }
      )
    }

    // Check user has editor role or higher
    await requireWorkspaceMemberWithRole(prisma, session.userId, workspace.id, 'editor')

    // Parse and validate request body
    const body = await request.json()
    const input = CreateCommentSchema.parse(body)

    // Create comment
    const comment = await createLessonComment(
      prisma,
      workspace.slug,
      resolvedParams.lessonSlug,
      session.userId,
      input
    )

    return NextResponse.json({ ok: true, comment }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      // Zod validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid input', details: error.message },
          { status: 400 }
        )
      }
      // Permission errors
      if (error.message.includes('not a member') || error.message.includes('does not meet')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      // Not found errors
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
