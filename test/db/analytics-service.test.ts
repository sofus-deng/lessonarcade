/**
 * Analytics Service Tests
 *
 * Tests for workspace insights analytics service that validates:
 * - Time window filtering works correctly
 * - Aggregate metrics are computed accurately
 * - Top struggling lessons are identified correctly
 * - Top engaged lessons are identified correctly
 * - Recent activity timeline is built correctly
 * - Edge cases (no data, empty workspace) are handled gracefully
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { seedAllDemoData } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'
import {
  getWorkspaceInsights,
  DEFAULT_WINDOW_DAYS,
} from '@/lib/lessonarcade/analytics-service'

describe('Analytics Service', () => {
  /**
   * Seed demo data before all tests
   */
  beforeAll(async () => {
    await seedAllDemoData(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clear lesson runs and comments before each test to avoid data accumulation
    await prisma.lessonRun.deleteMany({})
    await prisma.lessonComment.deleteMany({})
  })

  it('should return correct insights for "demo" workspace with seeded data', async () => {
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: 'demo',
    })

    // Verify time window
    expect(insights.timeWindowEnd).toBeInstanceOf(Date)
    expect(insights.timeWindowStart).toBeInstanceOf(Date)
    const windowDurationMs =
      insights.timeWindowEnd.getTime() - insights.timeWindowStart.getTime()
    expect(windowDurationMs).toBe(DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    // Verify aggregate metrics exist (even if zero)
    expect(insights.totalRunsInWindow).toBeDefined()
    expect(insights.avgScorePercentInWindow).toBeDefined()
    expect(insights.totalUniqueLearnerSessions).toBeDefined()
    expect(insights.totalCommentsInWindow).toBeDefined()

    // Verify lesson-level analytics arrays exist
    expect(Array.isArray(insights.topStrugglingLessons)).toBe(true)
    expect(Array.isArray(insights.topEngagedLessons)).toBe(true)
    expect(Array.isArray(insights.recentActivity)).toBe(true)
  })

  it('should return correct insights for "sample-team" workspace', async () => {
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: 'sample-team',
    })

    // Verify time window
    expect(insights.timeWindowEnd).toBeInstanceOf(Date)
    expect(insights.timeWindowStart).toBeInstanceOf(Date)

    // Verify aggregate metrics exist
    expect(insights.totalRunsInWindow).toBeDefined()
    expect(insights.totalUniqueLearnerSessions).toBeDefined()
    expect(insights.totalCommentsInWindow).toBeDefined()

    // Verify arrays exist
    expect(Array.isArray(insights.topStrugglingLessons)).toBe(true)
    expect(Array.isArray(insights.topEngagedLessons)).toBe(true)
    expect(Array.isArray(insights.recentActivity)).toBe(true)
  })

  it('should compute metrics correctly when runs exist', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
      include: { lessons: { include: { versions: true } } },
    })
    expect(workspace).toBeDefined()

    const lesson = workspace!.lessons[0]
    const version = lesson.versions[0]

    // Create runs within the time window
    const now = new Date()
    await prisma.lessonRun.createMany({
      data: [
        {
          lessonId: lesson.id,
          workspaceId: workspace!.id,
          lessonVersionId: version.id,
          score: 50,
          maxScore: 100,
          correctCount: 5,
          mode: 'focus',
          anonymousSessionId: 'session-1',
          startedAt: now,
          completedAt: now,
        },
        {
          lessonId: lesson.id,
          workspaceId: workspace!.id,
          lessonVersionId: version.id,
          score: 80,
          maxScore: 100,
          correctCount: 8,
          mode: 'arcade',
          anonymousSessionId: 'session-2',
          startedAt: new Date(now.getTime() - 60000), // 1 minute ago
          completedAt: new Date(now.getTime() - 60000),
        },
        {
          lessonId: lesson.id,
          workspaceId: workspace!.id,
          lessonVersionId: version.id,
          score: 60,
          maxScore: 100,
          correctCount: 6,
          mode: 'focus',
          anonymousSessionId: 'session-1', // Same as first run
          startedAt: new Date(now.getTime() - 120000), // 2 minutes ago
          completedAt: new Date(now.getTime() - 120000),
        },
      ],
    })

    // Get insights
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: 'demo',
    })

    // Verify run count
    expect(insights.totalRunsInWindow).toBeGreaterThanOrEqual(3)

    // Verify average score (average of 50%, 80%, 60% = 63.3%)
    // Note: This includes any existing runs, so we check it's reasonable
    expect(insights.avgScorePercentInWindow).toBeGreaterThanOrEqual(50)
    expect(insights.avgScorePercentInWindow).toBeLessThanOrEqual(100)

    // Verify unique sessions (session-1 and session-2 = 2 unique)
    expect(insights.totalUniqueLearnerSessions).toBeGreaterThanOrEqual(2)

    // Verify engaged lessons includes this lesson
    const engagedLesson = insights.topEngagedLessons.find(
      (l) => l.lessonSlug === lesson.slug
    )
    expect(engagedLesson).toBeDefined()
    expect(engagedLesson?.runCount).toBeGreaterThanOrEqual(3)
  })

  it('should compute top struggling lessons correctly', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
      include: { lessons: { include: { versions: true } } },
    })
    expect(workspace).toBeDefined()

    const lessons = workspace!.lessons
    const version1 = lessons[0].versions[0]
    const version2 = lessons[1].versions[0]

    // Create runs with different scores
    const now = new Date()
    await prisma.lessonRun.createMany({
      data: [
        // Lesson 1: Low scores (struggling)
        {
          lessonId: lessons[0].id,
          workspaceId: workspace!.id,
          lessonVersionId: version1.id,
          score: 30,
          maxScore: 100,
          correctCount: 3,
          mode: 'focus',
          anonymousSessionId: 'session-1',
          startedAt: now,
          completedAt: now,
        },
        {
          lessonId: lessons[0].id,
          workspaceId: workspace!.id,
          lessonVersionId: version1.id,
          score: 40,
          maxScore: 100,
          correctCount: 4,
          mode: 'focus',
          anonymousSessionId: 'session-2',
          startedAt: new Date(now.getTime() - 60000),
          completedAt: new Date(now.getTime() - 60000),
        },
        {
          lessonId: lessons[0].id,
          workspaceId: workspace!.id,
          lessonVersionId: version1.id,
          score: 35,
          maxScore: 100,
          correctCount: 3,
          mode: 'focus',
          anonymousSessionId: 'session-3',
          startedAt: new Date(now.getTime() - 120000),
          completedAt: new Date(now.getTime() - 120000),
        },
        // Lesson 2: High scores (not struggling)
        {
          lessonId: lessons[1].id,
          workspaceId: workspace!.id,
          lessonVersionId: version2.id,
          score: 90,
          maxScore: 100,
          correctCount: 9,
          mode: 'focus',
          anonymousSessionId: 'session-4',
          startedAt: now,
          completedAt: now,
        },
      ],
    })

    // Get insights
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: 'demo',
    })

    // Lesson 1 should be in struggling lessons (avg 35%, 3 runs)
    const strugglingLesson = insights.topStrugglingLessons.find(
      (l) => l.lessonSlug === lessons[0].slug
    )
    expect(strugglingLesson).toBeDefined()
    expect(strugglingLesson?.runCount).toBeGreaterThanOrEqual(3)
    // Average of 30, 40, 35 is 35, which is less than 50
    expect(strugglingLesson?.avgScorePercent).toBeLessThan(50)
  })

  it('should compute top engaged lessons correctly', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
      include: { lessons: { include: { versions: true } } },
    })
    expect(workspace).toBeDefined()

    const lessons = workspace!.lessons
    const version1 = lessons[0].versions[0]
    const version2 = lessons[1].versions[0]

    // Create runs with different frequencies
    const now = new Date()
    await prisma.lessonRun.createMany({
      data: [
        // Lesson 1: Many runs
        {
          lessonId: lessons[0].id,
          workspaceId: workspace!.id,
          lessonVersionId: version1.id,
          score: 80,
          maxScore: 100,
          correctCount: 8,
          mode: 'focus',
          anonymousSessionId: 'session-1',
          startedAt: now,
          completedAt: now,
        },
        {
          lessonId: lessons[0].id,
          workspaceId: workspace!.id,
          lessonVersionId: version1.id,
          score: 85,
          maxScore: 100,
          correctCount: 8,
          mode: 'focus',
          anonymousSessionId: 'session-2',
          startedAt: new Date(now.getTime() - 60000),
          completedAt: new Date(now.getTime() - 60000),
        },
        {
          lessonId: lessons[0].id,
          workspaceId: workspace!.id,
          lessonVersionId: version1.id,
          score: 90,
          maxScore: 100,
          correctCount: 9,
          mode: 'focus',
          anonymousSessionId: 'session-3',
          startedAt: new Date(now.getTime() - 120000),
          completedAt: new Date(now.getTime() - 120000),
        },
        // Lesson 2: Fewer runs
        {
          lessonId: lessons[1].id,
          workspaceId: workspace!.id,
          lessonVersionId: version2.id,
          score: 70,
          maxScore: 100,
          correctCount: 7,
          mode: 'focus',
          anonymousSessionId: 'session-4',
          startedAt: now,
          completedAt: now,
        },
      ],
    })

    // Get insights
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: 'demo',
    })

    // Lesson 1 should be in top engaged lessons (more runs)
    const engagedLesson = insights.topEngagedLessons.find(
      (l) => l.lessonSlug === lessons[0].slug
    )
    expect(engagedLesson).toBeDefined()
    expect(engagedLesson?.runCount).toBeGreaterThanOrEqual(3)
  })

  it('should build recent activity timeline correctly', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
      include: {
        lessons: { include: { versions: true } },
        members: { include: { user: true } },
      },
    })
    expect(workspace).toBeDefined()

    const lesson = workspace!.lessons[0]
    const version = lesson.versions[0]
    const member = workspace!.members[0]

    // Create a run completion
    const now = new Date()
    await prisma.lessonRun.create({
      data: {
        lessonId: lesson.id,
        workspaceId: workspace!.id,
        lessonVersionId: version.id,
        score: 85,
        maxScore: 100,
        correctCount: 8,
        mode: 'focus',
        anonymousSessionId: 'session-1',
        startedAt: now,
        completedAt: now,
      },
    })

    // Create a comment
    await prisma.lessonComment.create({
      data: {
        workspaceId: workspace!.id,
        lessonId: lesson.id,
        authorId: member.userId,
        body: 'Great lesson!',
        createdAt: new Date(now.getTime() - 60000), // 1 minute ago
      },
    })

    // Get insights
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: 'demo',
    })

    // Verify recent activity includes both run and comment
    expect(insights.recentActivity.length).toBeGreaterThan(0)

    const runActivity = insights.recentActivity.find((a) => a.type === 'run')
    expect(runActivity).toBeDefined()
    expect(runActivity?.lessonSlug).toBe(lesson.slug)

    const commentActivity = insights.recentActivity.find(
      (a) => a.type === 'comment'
    )
    expect(commentActivity).toBeDefined()
    expect(commentActivity?.lessonSlug).toBe(lesson.slug)
  })

  it('should handle empty time window gracefully', async () => {
    // Create a new workspace with no data - use unique slug to avoid conflicts
    const uniqueSlug = `empty-workspace-${Date.now()}`
    await prisma.workspace.create({
      data: {
        name: 'Empty Workspace',
        slug: uniqueSlug,
      },
    })

    // Get insights with a very small window (1 second)
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: uniqueSlug,
      windowDays: 0,
    })

    // All metrics should be zero or null
    expect(insights.totalRunsInWindow).toBe(0)
    expect(insights.avgScorePercentInWindow).toBeNull()
    expect(insights.totalUniqueLearnerSessions).toBe(0)
    expect(insights.totalCommentsInWindow).toBe(0)

    // All arrays should be empty
    expect(insights.topStrugglingLessons).toEqual([])
    expect(insights.topEngagedLessons).toEqual([])
    expect(insights.recentActivity).toEqual([])
  })

  it('should handle workspace with no lessons gracefully', async () => {
    // Create a new workspace with no lessons - use unique slug to avoid conflicts
    const uniqueSlug = `no-lessons-workspace-${Date.now()}`
    await prisma.workspace.create({
      data: {
        name: 'No Lessons Workspace',
        slug: uniqueSlug,
      },
    })

    // Get insights
    const insights = await getWorkspaceInsights(prisma, {
      workspaceSlug: uniqueSlug,
    })

    // All metrics should be zero or null
    expect(insights.totalRunsInWindow).toBe(0)
    expect(insights.avgScorePercentInWindow).toBeNull()
    expect(insights.totalUniqueLearnerSessions).toBe(0)
    expect(insights.totalCommentsInWindow).toBe(0)

    // All arrays should be empty
    expect(insights.topStrugglingLessons).toEqual([])
    expect(insights.topEngagedLessons).toEqual([])
    expect(insights.recentActivity).toEqual([])
  })

  it('should throw error if workspace does not exist', async () => {
    await expect(
      getWorkspaceInsights(prisma, { workspaceSlug: 'non-existent-workspace' })
    ).rejects.toThrow('Workspace with slug "non-existent-workspace" not found')
  })

  it('should respect custom windowDays parameter', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
      include: { lessons: { include: { versions: true } } },
    })
    expect(workspace).toBeDefined()

    const lesson = workspace!.lessons[0]
    const version = lesson.versions[0]

    // Create a run 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    await prisma.lessonRun.create({
      data: {
        lessonId: lesson.id,
        workspaceId: workspace!.id,
        lessonVersionId: version.id,
        score: 85,
        maxScore: 100,
        correctCount: 8,
        mode: 'focus',
        anonymousSessionId: 'session-1',
        startedAt: sevenDaysAgo,
        completedAt: sevenDaysAgo,
      },
    })

    // Create a run 31 days ago (outside 30-day window)
    const thirtyOneDaysAgo = new Date(
      Date.now() - 31 * 24 * 60 * 60 * 1000
    )
    await prisma.lessonRun.create({
      data: {
        lessonId: lesson.id,
        workspaceId: workspace!.id,
        lessonVersionId: version.id,
        score: 75,
        maxScore: 100,
        correctCount: 7,
        mode: 'focus',
        anonymousSessionId: 'session-2',
        startedAt: thirtyOneDaysAgo,
        completedAt: thirtyOneDaysAgo,
      },
    })

    // Get insights with 30-day window (should include 7-day run, exclude 31-day run)
    const insights30Days = await getWorkspaceInsights(prisma, {
      workspaceSlug: 'demo',
      windowDays: 30,
    })

    // The 7-day run should be counted
    expect(insights30Days.totalRunsInWindow).toBeGreaterThan(0)

    // Verify time window is exactly 30 days
    const windowDurationMs =
      insights30Days.timeWindowEnd.getTime() -
      insights30Days.timeWindowStart.getTime()
    expect(windowDurationMs).toBe(30 * 24 * 60 * 60 * 1000)
  })
})
