/**
 * Demo Seed Tests
 *
 * Tests for demo workspace and lesson seeding
 *
 * Tests for demo seed that validates:
 * - Workspace and lesson creation
 * - User and workspace member relationships
 * - Lesson version and content creation
 * - Idempotency (running twice should not create duplicates)
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { seedDemoWorkspaceAndLessons } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'

describe('Demo Seed', () => {
  /**
   * Clear database before all tests
   */
  beforeAll(async () => {
    // Clean up any existing data
    await prisma.lessonComment.deleteMany()
    await prisma.lessonRun.deleteMany()
    await prisma.lessonContent.deleteMany()
    await prisma.lessonVersion.deleteMany()
    await prisma.lesson.deleteMany()
    await prisma.workspaceMember.deleteMany()
    await prisma.workspace.deleteMany()
    await prisma.user.deleteMany()
  })

  /**
   * Disconnect Prisma client after all tests
   */
  afterEach(async () => {
    await prisma.$disconnect()
  })

  it('should create demo workspace and lessons', async () => {
    const summary = await seedDemoWorkspaceAndLessons(prisma)

    expect(summary.workspaceId).toBeDefined()
    expect(summary.lessonsSeeded).toBeGreaterThanOrEqual(2)
    expect(summary.totalLessons).toBeGreaterThanOrEqual(2)
  })

  it('should create demo owner user', async () => {
    await seedDemoWorkspaceAndLessons(prisma)

    const owner = await prisma.user.findUnique({
      where: { email: 'demo-owner@example.com' },
    })

    expect(owner).toBeDefined()
    expect(owner?.name).toBe('Demo Owner')
  })

  it('should create demo editor user', async () => {
    await seedDemoWorkspaceAndLessons(prisma)

    const editor = await prisma.user.findUnique({
      where: { email: 'demo-editor@example.com' },
    })

    expect(editor).toBeDefined()
    expect(editor?.name).toBe('Demo Editor')
  })

  it('should create demo viewer user', async () => {
    await seedDemoWorkspaceAndLessons(prisma)

    const viewer = await prisma.user.findUnique({
      where: { email: 'demo-viewer@example.com' },
    })

    expect(viewer).toBeDefined()
    expect(viewer?.name).toBe('Demo Viewer')
  })

  it('should create workspace members with correct roles', async () => {
    await seedDemoWorkspaceAndLessons(prisma)

    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    expect(workspace).toBeDefined()

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace!.id },
      orderBy: { role: 'asc' },
    })

    expect(members).toHaveLength(3)

    const roles = members.map((m) => m.role)
    expect(roles).toContain('OWNER')
    expect(roles).toContain('EDITOR')
    expect(roles).toContain('VIEWER')
  })

  it('should be idempotent - running twice should not create duplicates', async () => {
    // First seed
    await seedDemoWorkspaceAndLessons(prisma)

    const workspaces1 = await prisma.workspace.findMany()
    const users1 = await prisma.user.findMany()
    const members1 = await prisma.workspaceMember.findMany()

    // Second seed - should update existing records, not create new ones
    await seedDemoWorkspaceAndLessons(prisma)

    const workspaces2 = await prisma.workspace.findMany()
    const users2 = await prisma.user.findMany()
    const members2 = await prisma.workspaceMember.findMany()

    // Should have the same number of workspaces, users, and members (no new records created)
    expect(workspaces2).toHaveLength(workspaces1.length)
    expect(users2).toHaveLength(users1.length)
    expect(members2).toHaveLength(members1.length)
  })
})
