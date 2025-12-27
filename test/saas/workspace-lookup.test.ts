/**
 * Workspace Lookup Tests
 *
 * LA3-P0-02: Tests for workspace access and lookup
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { seedAllDemoData, DEMO_OWNER } from '@/lib/test/demo-seed'

describe('Workspace Lookup', () => {
  /**
   * Seed all demo data once before all tests
   */
  beforeAll(async () => {
    await seedAllDemoData(prisma)
  })

  /**
   * Disconnect Prisma client after all tests
   */
  afterEach(async () => {
    await prisma.$disconnect()
  })

  it('should find all workspaces for demo owner', async () => {
    const user = await prisma.user.findUnique({
      where: { email: DEMO_OWNER.email },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    })

    expect(user).toBeDefined()
    const workspaces = user!.workspaceMembers.map((m) => m.workspace)

    expect(workspaces.length).toBeGreaterThanOrEqual(2)
    expect(workspaces.find((w) => w.slug === 'demo')).toBeDefined()
    expect(workspaces.find((w) => w.slug === 'sample-team')).toBeDefined()
  })

  it('should validate workspace membership', async () => {
    const user = await prisma.user.findUnique({
      where: { email: DEMO_OWNER.email },
    })

    const demoWorkspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user!.id,
          workspaceId: demoWorkspace!.id,
        },
      },
    })

    expect(membership).toBeDefined()
    expect(membership?.role).toBe('OWNER')
  })

  it('should not find membership for non-existent user-workspace pair', async () => {
    // Create a new user without any workspaces
    const newUser = await prisma.user.create({
      data: {
        email: 'guest@example.com',
        name: 'Guest User',
      },
    })

    const demoWorkspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: newUser.id,
          workspaceId: demoWorkspace!.id,
        },
      },
    })

    expect(membership).toBeNull()

    // Cleanup
    await prisma.user.delete({ where: { id: newUser.id } })
  })
})
