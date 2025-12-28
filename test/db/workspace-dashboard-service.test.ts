import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { seedAllDemoData } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'
import { getWorkspaceOverviewBySlug } from '@/lib/lessonarcade/workspace-dashboard-service'

describe('Workspace Dashboard Service', () => {
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
    // Clear lesson runs before each test to avoid data accumulation
    await prisma.lessonRun.deleteMany({})
  })

  it('should return correct overview for "demo" workspace', async () => {
    const overview = await getWorkspaceOverviewBySlug(prisma, 'demo')

    expect(overview.workspaceName).toBe('LessonArcade Demo Workspace')
    expect(overview.workspaceSlug).toBe('demo')
    expect(overview.totalLessons).toBe(2)
    // Runs might be 0 initially unless we create some
    expect(overview.totalLessonRuns).toBeDefined()
    expect(overview.topLessons.length).toBeLessThanOrEqual(3)
  })

  it('should return correct overview for "sample-team" workspace', async () => {
    const overview = await getWorkspaceOverviewBySlug(prisma, 'sample-team')

    expect(overview.workspaceName).toBe('Sample Team')
    expect(overview.workspaceSlug).toBe('sample-team')
    expect(overview.totalLessons).toBe(2)
  })

  it('should compute metrics correctly when runs exist', async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
      include: { lessons: { include: { versions: true } } }
    })
    
    const lesson = workspace!.lessons[0]
    const version = lesson.versions[0]

    // Create a mock run
    await prisma.lessonRun.create({
      data: {
        lessonId: lesson.id,
        workspaceId: workspace!.id,
        lessonVersionId: version.id,
        score: 80,
        maxScore: 100,
        correctCount: 8,
        mode: 'focus',
        completedAt: new Date()
      }
    })

    const overview = await getWorkspaceOverviewBySlug(prisma, 'demo')
    expect(overview.totalLessonRuns).toBeGreaterThan(0)
    expect(overview.avgScorePercent).toBe(80)
    expect(overview.lastCompletedAt).not.toBeNull()
    
    const topLesson = overview.topLessons.find(l => l.slug === lesson.slug)
    expect(topLesson).toBeDefined()
    expect(topLesson?.totalRuns).toBeGreaterThan(0)
    expect(topLesson?.averageScorePercent).toBe(80)
  })

  it('should handle workspace with no lessons gracefully', async () => {
    // Use unique slug to avoid conflicts
    const uniqueSlug = `empty-workspace-${Date.now()}`
    await prisma.workspace.create({
      data: {
        name: 'Empty Workspace',
        slug: uniqueSlug,
      }
    })

    const overview = await getWorkspaceOverviewBySlug(prisma, uniqueSlug)
    expect(overview.totalLessons).toBe(0)
    expect(overview.totalLessonRuns).toBe(0)
    expect(overview.avgScorePercent).toBeNull()
    expect(overview.lastCompletedAt).toBeNull()
    expect(overview.topLessons).toEqual([])
  })

  it('should throw error if workspace does not exist', async () => {
    await expect(getWorkspaceOverviewBySlug(prisma, 'non-existent')).rejects.toThrow()
  })
})
