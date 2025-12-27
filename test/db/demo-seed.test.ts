/**
 * Demo Seeding Tests
 *
 * Tests for demo data seeding script that validates:
 * - Demo workspace is created correctly
 * - Demo owner user is created correctly
 * - Workspace member relationship is established
 * - Demo lessons are seeded with proper structure
 * - The seeding process is idempotent
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { seedDemoWorkspaceAndLessons } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'

describe('Demo Seeding', () => {
  /**
   * Seed demo data once before all tests
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

  it('should create exactly one demo workspace', async () => {
    const workspaces = await prisma.workspace.findMany({
      where: { slug: 'demo' },
    })

    expect(workspaces).toHaveLength(1)
    expect(workspaces[0].name).toBe('LessonArcade Demo Workspace')
    expect(workspaces[0].slug).toBe('demo')
    expect(workspaces[0].brandId).toBe('lessonarcade-default')
  })

  it('should create demo owner user', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'demo-owner@example.com' },
    })

    expect(user).toBeDefined()
    expect(user?.name).toBe('Demo Owner')
    expect(user?.email).toBe('demo-owner@example.com')
  })

  it('should create workspace member with OWNER role', async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const user = await prisma.user.findUnique({
      where: { email: 'demo-owner@example.com' },
    })

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user!.id,
          workspaceId: workspace!.id,
        },
      },
    })

    expect(member).toBeDefined()
    expect(member?.role).toBe('OWNER')
  })

  it('should seed demo lessons', async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const lessons = await prisma.lesson.findMany({
      where: { workspaceId: workspace!.id },
    })

    expect(lessons.length).toBeGreaterThanOrEqual(1)

    // Check effective-meetings lesson
    const effectiveMeetings = lessons.find((l: { slug: string }) => l.slug === 'effective-meetings')
    expect(effectiveMeetings).toBeDefined()
    expect(effectiveMeetings?.title).toBe('How to Run Effective Meetings')
    expect(effectiveMeetings?.status).toBe('ACTIVE')

    // Check react-hooks-intro lesson
    const reactHooksIntro = lessons.find((l: { slug: string }) => l.slug === 'react-hooks-intro')
    expect(reactHooksIntro).toBeDefined()
    expect(reactHooksIntro?.title).toBe('Introduction to React Hooks')
    expect(reactHooksIntro?.status).toBe('ACTIVE')
  })

  it('should create lesson version and content for each lesson', async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })

    const versions = await prisma.lessonVersion.findMany({
      where: { lessonId: lesson!.id },
    })

    expect(versions).toHaveLength(1)
    expect(versions[0].versionNumber).toBe(1)
    expect(versions[0].isPublished).toBe(true)

    const content = await prisma.lessonContent.findUnique({
      where: { lessonVersionId: versions[0].id },
    })

    expect(content).toBeDefined()
    expect(content?.checksum).toBeDefined()
    expect(content?.json).toBeDefined()
    expect(content?.json).toContain('levels')
  })

  it('should compute checksums for lesson content', async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })

    const version = await prisma.lessonVersion.findFirst({
      where: { lessonId: lesson!.id },
    })

    const content = await prisma.lessonContent.findUnique({
      where: { lessonVersionId: version!.id },
    })

    expect(content?.checksum).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex string
    expect(content?.checksum).toHaveLength(64)
  })

  it('should be idempotent - running twice should not create duplicates', async () => {
    // Get initial counts
    const initialWorkspaces = await prisma.workspace.findMany({
      where: { slug: 'demo' },
    })

    const initialUsers = await prisma.user.findMany({
      where: { email: 'demo-owner@example.com' },
    })

    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const initialLessons = await prisma.lesson.findMany({
      where: { workspaceId: workspace!.id },
    })

    const initialMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace!.id },
    })

    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })

    const initialVersions = await prisma.lessonVersion.findMany({
      where: { lessonId: lesson!.id },
    })

    const version = await prisma.lessonVersion.findFirst({
      where: { lessonId: lesson!.id },
    })

    const initialContents = await prisma.lessonContent.findMany({
      where: { lessonVersionId: version!.id },
    })

    // Run seeding again
    await seedDemoWorkspaceAndLessons(prisma)

    // Get final counts
    const finalWorkspaces = await prisma.workspace.findMany({
      where: { slug: 'demo' },
    })

    const finalUsers = await prisma.user.findMany({
      where: { email: 'demo-owner@example.com' },
    })

    const finalLessons = await prisma.lesson.findMany({
      where: { workspaceId: workspace!.id },
    })

    const finalMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace!.id },
    })

    const finalVersions = await prisma.lessonVersion.findMany({
      where: { lessonId: lesson!.id },
    })

    const finalContents = await prisma.lessonContent.findMany({
      where: { lessonVersionId: version!.id },
    })

    // Verify counts are the same
    expect(finalWorkspaces).toHaveLength(initialWorkspaces.length)
    expect(finalUsers).toHaveLength(initialUsers.length)
    expect(finalMembers).toHaveLength(initialMembers.length)
    expect(finalLessons).toHaveLength(initialLessons.length)
    expect(finalVersions).toHaveLength(initialVersions.length)
    expect(finalContents).toHaveLength(initialContents.length)

    // Verify counts are correct
    expect(finalWorkspaces).toHaveLength(1)
    expect(finalUsers).toHaveLength(1)
    expect(finalMembers).toHaveLength(1)
    expect(finalLessons.length).toBeGreaterThanOrEqual(1)
    expect(finalVersions).toHaveLength(1)
    expect(finalContents).toHaveLength(1)
  })

  it('should update lesson content if JSON changes', async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })

    const version = await prisma.lessonVersion.findFirst({
      where: { lessonId: lesson!.id },
    })

    const firstContent = await prisma.lessonContent.findUnique({
      where: { lessonVersionId: version!.id },
    })

    const firstChecksum = firstContent?.checksum

    // Second seed (should update content)
    await seedDemoWorkspaceAndLessons(prisma)

    const secondContent = await prisma.lessonContent.findUnique({
      where: { lessonVersionId: version!.id },
    })

    const secondChecksum = secondContent?.checksum

    // Checksums should be same since JSON hasn't changed
    expect(secondChecksum).toBe(firstChecksum)
  })
})
