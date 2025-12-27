/**
 * API route for creating lesson runs.
 *
 * This endpoint accepts POST requests to record lesson completion data in the database.
 * It validates the request payload using Zod, then delegates to the service layer.
 *
 * Response codes:
 * - 201: Lesson run created successfully
 * - 400: Invalid request payload
 * - 404: Workspace or lesson not found
 * - 503: Database error
 * - 500: Unexpected error
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { CreateLessonRunSchema } from '@/lib/lessonarcade/lesson-run-schema'
import { createLessonRun } from '@/lib/lessonarcade/lesson-run-service'

/**
 * POST handler for creating a lesson run.
 *
 * Expected request body:
 * {
 *   workspaceSlug: string,
 *   lessonSlug: string,
 *   mode: 'focus' | 'arcade',
 *   score: number,
 *   maxScore: number,
 *   completedAt: string (ISO datetime),
 *   durationMs?: number,
 *   anonymousSessionId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate payload
    const validationResult = CreateLessonRunSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Call service
    const result = await createLessonRun(prisma, validationResult.data)

    // Map result to HTTP response
    if (result.ok) {
      return NextResponse.json(
        { ok: true, lessonRunId: result.lessonRunId },
        { status: 201 }
      )
    } else {
      switch (result.kind) {
        case 'workspace-not-found':
          return NextResponse.json(
            { error: 'Workspace not found' },
            { status: 404 }
          )
        case 'lesson-not-found':
          return NextResponse.json(
            { error: 'Lesson not found' },
            { status: 404 }
          )
        case 'db-error':
          console.error('Database error creating lesson run:', result.error)
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 503 }
          )
      }
    }
  } catch (error) {
    console.error('Unexpected error in lesson-runs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
