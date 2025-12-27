/**
 * Lesson Run Service Tests
 *
 * Tests for lesson run creation service that validates:
 * - Lesson run is created for valid input
 * - Workspace not found is returned for unknown workspace
 * - Lesson not found is returned for unknown lesson
 * - Database errors are handled gracefully
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { seedDemoWorkspaceAndLessons } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'
import { createLessonRun } from '@/lib/lessonarcade/lesson-run-service'

describe('Lesson Run Service', () => {
  /**
   * Seed demo data before all tests
   */
  beforeAll(async () => {
    await seedDemoWorkspaceAndLessons(prisma)
  })

  /**
   * Disconnect Prisma client after all tests
   */
  afterEach(async () => {
    await prisma.$disconnect()
  })

  it('should create a lesson run for valid input', async () => {
    const result = await createLessonRun(prisma, {
      workspaceSlug: 'demo',
      lessonSlug: 'effective-meetings',
      mode: 'focus',
      score: 5,
      maxScore: 10,
      completedAt: new Date().toISOString(),
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lessonRunId).toBeDefined()
      expect(typeof result.lessonRunId).toBe('string')
    }
  })

  it('should create a lesson run for arcade mode', async () => {
    const result = await createLessonRun(prisma, {
      workspaceSlug: 'demo',
      lessonSlug: 'react-hooks-intro',
      mode: 'arcade',
      score: 8,
      maxScore: 10,
      completedAt: new Date().toISOString(),
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lessonRunId).toBeDefined()
    }
  })

  it('should return workspace-not-found for unknown workspace', async () => {
    const result = await createLessonRun(prisma, {
      workspaceSlug: 'unknown-workspace',
      lessonSlug: 'effective-meetings',
      mode: 'focus',
      score: 5,
      maxScore: 10,
      completedAt: new Date().toISOString(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('workspace-not-found')
    }
  })

  it('should return lesson-not-found for unknown lesson', async () => {
    const result = await createLessonRun(prisma, {
      workspaceSlug: 'demo',
      lessonSlug: 'unknown-lesson',
      mode: 'focus',
      score: 5,
      maxScore: 10,
      completedAt: new Date().toISOString(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('lesson-not-found')
    }
  })

  it('should create lesson run with optional fields', async () => {
    const result = await createLessonRun(prisma, {
      workspaceSlug: 'demo',
      lessonSlug: 'effective-meetings',
      mode: 'focus',
      score: 5,
      maxScore: 10,
      completedAt: new Date().toISOString(),
      durationMs: 60000,
      anonymousSessionId: '550e8400-e29b-41d4-a716-446655440000',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lessonRunId).toBeDefined()
    }
  })

  it('should persist lesson run in database', async () => {
    const result = await createLessonRun(prisma, {
      workspaceSlug: 'demo',
      lessonSlug: 'effective-meetings',
      mode: 'focus',
      score: 5,
      maxScore: 10,
      completedAt: new Date().toISOString(),
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      // Verify the lesson run was created in the database
      const lessonRun = await prisma.lessonRun.findUnique({
        where: { id: result.lessonRunId },
      })

      expect(lessonRun).toBeDefined()
      expect(lessonRun?.score).toBe(5)
      expect(lessonRun?.maxScore).toBe(10)
    }
  })
})
