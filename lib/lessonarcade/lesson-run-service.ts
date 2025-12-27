/**
 * Service layer for lesson run creation.
 *
 * This module handles the business logic for creating lesson runs in the database.
 * It validates input, resolves workspace and lesson entities, and creates the LessonRun record.
 */

import { PrismaClient, LessonRunMode } from '@prisma/client'
import type { CreateLessonRunInput } from './lesson-run-schema'

/**
 * Result type for lesson run creation.
 *
 * - `{ ok: true, lessonRunId: string }` - Success with the created run's ID
 * - `{ ok: false, kind: 'workspace-not-found' }` - Workspace does not exist
 * - `{ ok: false, kind: 'lesson-not-found' }` - Lesson does not exist in workspace
 * - `{ ok: false, kind: 'db-error', error?: Error }` - Database error occurred
 */
export type CreateLessonRunResult =
  | { ok: true; lessonRunId: string }
  | { ok: false; kind: 'workspace-not-found' | 'lesson-not-found' | 'db-error'; error?: Error }

/**
 * Create a lesson run in the database.
 *
 * This function:
 * 1. Resolves the workspace by slug
 * 2. Resolves the lesson by workspaceId and slug
 * 3. Finds the published lesson version
 * 4. Creates a LessonRun record
 *
 * @param prisma - Prisma client instance
 * @param input - Validated lesson run input
 * @returns Result object indicating success or failure
 */
export async function createLessonRun(
  prisma: PrismaClient,
  input: CreateLessonRunInput
): Promise<CreateLessonRunResult> {
  try {
    // 1. Resolve workspace by slug
    const workspace = await prisma.workspace.findUnique({
      where: { slug: input.workspaceSlug },
    })
    if (!workspace) {
      return { ok: false, kind: 'workspace-not-found' }
    }

    // 2. Resolve lesson by workspaceId and slug
    const lesson = await prisma.lesson.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: input.lessonSlug,
      },
      include: {
        versions: {
          where: { isPublished: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    })
    if (!lesson || lesson.versions.length === 0) {
      return { ok: false, kind: 'lesson-not-found' }
    }

    // 3. Create LessonRun record
    const lessonRun = await prisma.lessonRun.create({
      data: {
        lessonId: lesson.id,
        workspaceId: workspace.id,
        lessonVersionId: lesson.versions[0].id,
        anonymousSessionId: input.anonymousSessionId,
        score: input.score,
        maxScore: input.maxScore,
        correctCount: 0, // Will be computed from lesson data in future
        mode: input.mode as LessonRunMode,
        completedAt: new Date(input.completedAt),
      },
    })

    return { ok: true, lessonRunId: lessonRun.id }
  } catch (error) {
    console.error('Error creating lesson run:', error)
    return {
      ok: false,
      kind: 'db-error',
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}
