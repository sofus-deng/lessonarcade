/**
 * Collaboration Service Tests
 *
 * LA3-P2-01: Tests for lesson comments and collaboration roles
 *
 * Tests for collaboration service that validates:
 * - Comment creation for an EDITOR in a workspace with seeded lessons
 * - VIEWER attempting to create a comment → expected error
 * - Listing comments by workspace + lessonSlug returns only that workspace's comments
 * - Permission helper enforces role hierarchy correctly
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { seedDemoWorkspaceAndLessons } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'
import {
  createLessonComment,
  listLessonComments,
  requireWorkspaceMemberWithRole,
} from '@/lib/lessonarcade/collaboration-service'

describe('Collaboration Service', () => {
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

  it('should allow EDITOR to create a comment', async () => {
    // Get demo editor user
    const editor = await prisma.user.findUnique({
      where: { email: 'demo-editor@example.com' },
    })
    expect(editor).toBeDefined()

    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Get a lesson
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    // Create comment
    const comment = await createLessonComment(
      prisma,
      workspace!.slug,
      lesson!.slug,
      editor!.id,
      { body: 'Test comment from editor' }
    )

    expect(comment).toBeDefined()
    expect(comment.body).toBe('Test comment from editor')
    expect(comment.authorEmail).toBe('demo-editor@example.com')
    expect(comment.status).toBe('OPEN')
  })

  it('should block VIEWER from creating comments via permission check', async () => {
    // Get demo viewer user
    const viewer = await prisma.user.findUnique({
      where: { email: 'demo-viewer@example.com' },
    })
    expect(viewer).toBeDefined()

    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Expect error when requiring editor role
    await expect(
      requireWorkspaceMemberWithRole(prisma, viewer!.id, workspace!.id, 'editor')
    ).rejects.toThrow('does not meet minimum requirement editor')
  })

  it('should allow VIEWER to pass viewer permission check', async () => {
    // Get demo viewer user
    const viewer = await prisma.user.findUnique({
      where: { email: 'demo-viewer@example.com' },
    })
    expect(viewer).toBeDefined()

    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Should NOT throw error for viewer role
    const member = await requireWorkspaceMemberWithRole(
      prisma,
      viewer!.id,
      workspace!.id,
      'viewer'
    )

    expect(member).toBeDefined()
    expect(member.role).toBe('VIEWER')
  })

  it('should allow EDITOR to pass editor permission check', async () => {
    // Get demo editor user
    const editor = await prisma.user.findUnique({
      where: { email: 'demo-editor@example.com' },
    })
    expect(editor).toBeDefined()

    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Should NOT throw error for editor role
    const member = await requireWorkspaceMemberWithRole(
      prisma,
      editor!.id,
      workspace!.id,
      'editor'
    )

    expect(member).toBeDefined()
    expect(member.role).toBe('EDITOR')
  })

  it('should allow OWNER to pass editor permission check', async () => {
    // Get demo owner user
    const owner = await prisma.user.findUnique({
      where: { email: 'demo-owner@example.com' },
    })
    expect(owner).toBeDefined()

    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Should NOT throw error for owner role
    const member = await requireWorkspaceMemberWithRole(
      prisma,
      owner!.id,
      workspace!.id,
      'editor'
    )

    expect(member).toBeDefined()
    expect(member.role).toBe('OWNER')
  })

  it('should list comments scoped to workspace and lesson', async () => {
    // Get demo workspace and lesson
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    // Get sample team workspace
    const sampleTeam = await prisma.workspace.findUnique({
      where: { slug: 'sample-team' },
    })
    expect(sampleTeam).toBeDefined()

    // Create a comment in demo workspace
    const editor = await prisma.user.findUnique({
      where: { email: 'demo-editor@example.com' },
    })

    await createLessonComment(
      prisma,
      workspace!.slug,
      lesson!.slug,
      editor!.id,
      { body: 'Demo workspace comment' }
    )

    // Create a comment in sample team workspace
    const sampleLesson = await prisma.lesson.findFirst({
      where: { workspaceId: sampleTeam!.id },
    })

    if (sampleLesson) {
      await createLessonComment(
        prisma,
        sampleTeam!.slug,
        sampleLesson.slug,
        editor!.id,
        { body: 'Sample team comment' }
      )
    }

    // List comments for demo workspace lesson
    const demoComments = await listLessonComments(
      prisma,
      workspace!.slug,
      lesson!.slug
    )

    // Should only contain demo workspace comment
    expect(demoComments.some((c) => c.body === 'Demo workspace comment')).toBe(true)
    expect(demoComments.some((c) => c.body === 'Sample team comment')).toBe(false)
  })

  it('should return empty list for lesson with no comments', async () => {
    // Get demo workspace and lesson
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    // Clear all comments for this lesson
    await prisma.lessonComment.deleteMany({
      where: { lessonId: lesson!.id },
    })

    // List comments
    const comments = await listLessonComments(
      prisma,
      workspace!.slug,
      lesson!.slug
    )

    expect(comments).toEqual([])
  })

  it('should throw error for non-existent workspace', async () => {
    await expect(
      listLessonComments(prisma, 'non-existent-workspace', 'any-lesson')
    ).rejects.toThrow('Workspace with slug "non-existent-workspace" not found')
  })

  it('should throw error for non-existent lesson in workspace', async () => {
    await expect(
      listLessonComments(prisma, 'demo', 'non-existent-lesson')
    ).rejects.toThrow('Lesson with slug "non-existent-lesson" not found in workspace')
  })
})
