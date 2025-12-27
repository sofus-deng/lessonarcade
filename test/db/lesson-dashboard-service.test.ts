/**
 * Lesson Dashboard Service Tests
 *
 * Tests for lesson dashboard service that validates:
 * - Workspace info is returned correctly
 * - All lessons for demo workspace are returned
 * - Run count is computed correctly per lesson
 * - Average score percent is computed correctly per lesson
 * - Last completed at is computed correctly per lesson
 * - Totals are computed correctly across all lessons
 * - Lessons with no runs are handled gracefully
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { seedDemoData } from '@/scripts/db/seed-demo-lessons'
import { prisma } from '@/lib/db/prisma'
import {
  getDemoWorkspaceLessonsOverview,
  DEMO_WORKSPACE_SLUG,
} from '@/lib/lessonarcade/lesson-dashboard-service'

describe('Lesson Dashboard Service', () => {
  /**
   * Seed demo data before all tests
   */
  beforeAll(async () => {
    await seedDemoData(prisma)
  })

  /**
   * Disconnect Prisma client after all tests
   */
  afterEach(async () => {
    await prisma.$disconnect()
  })

  it('should return workspace info for demo workspace', async () => {
    const overview = await getDemoWorkspaceLessonsOverview(prisma)

    expect(overview.workspace).toBeDefined()
    expect(overview.workspace.slug).toBe(DEMO_WORKSPACE_SLUG)
    expect(overview.workspace.name).toBe('LessonArcade Demo Workspace')
    expect(overview.workspace.id).toBeDefined()
  })

  it('should return all lessons for demo workspace', async () => {
    const overview = await getDemoWorkspaceLessonsOverview(prisma)

    expect(overview.lessons.length).toBeGreaterThanOrEqual(2)

    // Check for expected demo lessons
    const effectiveMeetings = overview.lessons.find(
      (l) => l.slug === 'effective-meetings'
    )
    expect(effectiveMeetings).toBeDefined()
    expect(effectiveMeetings?.title).toBe('How to Run Effective Meetings')

    const reactHooksIntro = overview.lessons.find(
      (l) => l.slug === 'react-hooks-intro'
    )
    expect(reactHooksIntro).toBeDefined()
    expect(reactHooksIntro?.title).toBe('Introduction to React Hooks')
  })

  it('should compute correct runCount per lesson', async () => {
    // Get the demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: DEMO_WORKSPACE_SLUG },
    })
    expect(workspace).toBeDefined()

    // Get the first lesson
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    // Create some lesson runs for this lesson
    const version = await prisma.lessonVersion.findFirst({
      where: { lessonId: lesson!.id },
    })
    expect(version).toBeDefined()

    const now = new Date()
    await prisma.lessonRun.createMany({
      data: [
        {
          lessonId: lesson!.id,
          workspaceId: workspace!.id,
          lessonVersionId: version!.id,
          score: 5,
          maxScore: 10,
          correctCount: 5,
          mode: 'focus',
          completedAt: now,
        },
        {
          lessonId: lesson!.id,
          workspaceId: workspace!.id,
          lessonVersionId: version!.id,
          score: 8,
          maxScore: 10,
          correctCount: 8,
          mode: 'arcade',
          completedAt: new Date(now.getTime() - 60000), // 1 minute ago
        },
      ],
    })

    // Get overview
    const overview = await getDemoWorkspaceLessonsOverview(prisma)

    // Find the lesson in the overview
    const lessonStats = overview.lessons.find((l) => l.id === lesson!.id)
    expect(lessonStats).toBeDefined()
    expect(lessonStats?.runCount).toBeGreaterThanOrEqual(2)
  })

  it('should compute correct averageScorePercent per lesson', async () => {
    // Get the demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: DEMO_WORKSPACE_SLUG },
    })
    expect(workspace).toBeDefined()

    // Get the first lesson
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    // Get the lesson version
    const version = await prisma.lessonVersion.findFirst({
      where: { lessonId: lesson!.id },
    })
    expect(version).toBeDefined()

    // Clear existing runs for this lesson to get a clean test
    await prisma.lessonRun.deleteMany({
      where: { lessonId: lesson!.id },
    })

    // Create runs with known scores
    const now = new Date()
    await prisma.lessonRun.createMany({
      data: [
        {
          lessonId: lesson!.id,
          workspaceId: workspace!.id,
          lessonVersionId: version!.id,
          score: 5,
          maxScore: 10, // 50%
          correctCount: 5,
          mode: 'focus',
          completedAt: now,
        },
        {
          lessonId: lesson!.id,
          workspaceId: workspace!.id,
          lessonVersionId: version!.id,
          score: 8,
          maxScore: 10, // 80%
          correctCount: 8,
          mode: 'arcade',
          completedAt: new Date(now.getTime() - 60000),
        },
      ],
    })

    // Get overview
    const overview = await getDemoWorkspaceLessonsOverview(prisma)

    // Find the lesson in the overview
    const lessonStats = overview.lessons.find((l) => l.id === lesson!.id)
    expect(lessonStats).toBeDefined()
    // Average of 50% and 80% is 65%
    expect(lessonStats?.averageScorePercent).toBe(65)
  })

  it('should compute correct lastCompletedAt per lesson', async () => {
    // Get the demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: DEMO_WORKSPACE_SLUG },
    })
    expect(workspace).toBeDefined()

    // Get the first lesson
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    // Get the lesson version
    const version = await prisma.lessonVersion.findFirst({
      where: { lessonId: lesson!.id },
    })
    expect(version).toBeDefined()

    // Clear existing runs for this lesson
    await prisma.lessonRun.deleteMany({
      where: { lessonId: lesson!.id },
    })

    // Create runs with different completion times
    const now = new Date()
    const earlierTime = new Date(now.getTime() - 3600000) // 1 hour ago
    const latestTime = new Date(now.getTime() - 1800000) // 30 minutes ago

    await prisma.lessonRun.createMany({
      data: [
        {
          lessonId: lesson!.id,
          workspaceId: workspace!.id,
          lessonVersionId: version!.id,
          score: 5,
          maxScore: 10,
          correctCount: 5,
          mode: 'focus',
          completedAt: earlierTime,
        },
        {
          lessonId: lesson!.id,
          workspaceId: workspace!.id,
          lessonVersionId: version!.id,
          score: 8,
          maxScore: 10,
          correctCount: 8,
          mode: 'arcade',
          completedAt: latestTime,
        },
      ],
    })

    // Get overview
    const overview = await getDemoWorkspaceLessonsOverview(prisma)

    // Find the lesson in the overview
    const lessonStats = overview.lessons.find((l) => l.id === lesson!.id)
    expect(lessonStats).toBeDefined()
    expect(lessonStats?.lastCompletedAt).toBeDefined()

    // The last completed at should be the latest time
    expect(lessonStats?.lastCompletedAt?.getTime()).toBe(latestTime.getTime())
  })

  it('should compute correct totals', async () => {
    const overview = await getDemoWorkspaceLessonsOverview(prisma)

    // Total lessons should match the number of lessons in the overview
    expect(overview.totals.totalLessons).toBe(overview.lessons.length)

    // Total runs should be the sum of all lesson run counts
    const totalRunsFromLessons = overview.lessons.reduce(
      (sum, lesson) => sum + lesson.runCount,
      0
    )
    expect(overview.totals.totalRuns).toBe(totalRunsFromLessons)

    // Average score percent should be computed from all completed runs
    // (or null if no completed runs)
    const completedRuns = overview.lessons.filter(
      (l) => l.averageScorePercent !== null
    )
    if (completedRuns.length > 0) {
      expect(overview.totals.averageScorePercent).not.toBeNull()
    } else {
      expect(overview.totals.averageScorePercent).toBeNull()
    }
  })

  it('should handle lessons with no runs gracefully', async () => {
    // Get the demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: DEMO_WORKSPACE_SLUG },
    })
    expect(workspace).toBeDefined()

    // Get the first lesson
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    // Clear all runs for this lesson
    await prisma.lessonRun.deleteMany({
      where: { lessonId: lesson!.id },
    })

    // Get overview
    const overview = await getDemoWorkspaceLessonsOverview(prisma)

    // Find the lesson in the overview
    const lessonStats = overview.lessons.find((l) => l.id === lesson!.id)
    expect(lessonStats).toBeDefined()
    expect(lessonStats?.runCount).toBe(0)
    expect(lessonStats?.averageScorePercent).toBeNull()
    expect(lessonStats?.lastCompletedAt).toBeNull()
  })

  it('should throw error for non-existent workspace', async () => {
    // Create a mock prisma client that returns null for workspace
    const mockPrisma = {
      ...prisma,
      workspace: {
        ...prisma.workspace,
        findUnique: async () => null,
      },
    } as unknown as typeof prisma

    await expect(
      getDemoWorkspaceLessonsOverview(mockPrisma)
    ).rejects.toThrow('Workspace with slug "demo" not found')
  })
})
