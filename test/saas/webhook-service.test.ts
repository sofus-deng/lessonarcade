/**
 * Webhook Service Tests
 *
 * LA3-P2-02: Tests for webhook service
 *
 * Tests for webhook service that validates:
 * - Payload structure for lesson comment events
 * - Triggering webhooks for active endpoints
 * - Skipping inactive endpoints
 * - Recording lastTriggered and lastStatus
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { seedDemoWorkspaceAndLessons } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'
import {
  buildLessonCommentCreatedPayload,
  triggerWorkspaceWebhooksForLessonCommentCreated,
} from '@/lib/saas/webhook-service'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Webhook Service', () => {
  beforeAll(async () => {
    await seedDemoWorkspaceAndLessons(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clear all webhooks before each test to avoid interference from seed
    await prisma.workspaceWebhook.deleteMany({})
    // Clear comments created in previous tests
    await prisma.lessonComment.deleteMany({})
    vi.clearAllMocks()
  })

  it('should build correct payload for lesson comment created event', () => {
    const workspace = {
      id: 'workspace-1',
      name: 'Test Workspace',
      slug: 'test-workspace',
    }
    const lesson = {
      id: 'lesson-1',
      title: 'Test Lesson',
      slug: 'test-lesson',
    }
    const comment = {
      id: 'comment-1',
      body: 'Test comment',
      createdAt: new Date('2025-12-28T00:00:00Z'),
      levelIndex: 0,
      itemKey: 'question-1',
    }
    const author = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    }

    const payload = buildLessonCommentCreatedPayload(
      workspace,
      lesson,
      comment,
      author
    )

    expect(payload).toEqual({
      type: 'lesson.comment.created',
      workspace: {
        id: 'workspace-1',
        name: 'Test Workspace',
        slug: 'test-workspace',
      },
      lesson: {
        id: 'lesson-1',
        title: 'Test Lesson',
        slug: 'test-lesson',
      },
      comment: {
        id: 'comment-1',
        body: 'Test comment',
        createdAt: '2025-12-28T00:00:00.000Z',
        levelIndex: 0,
        itemKey: 'question-1',
      },
      author: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
      timestamp: expect.any(String),
    })
  })

  it('should trigger webhooks for active endpoints', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Create an active webhook
    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: workspace!.id,
        url: 'https://example.com/webhook',
        eventType: 'LESSON_COMMENT_CREATED',
        isActive: true,
      },
    })

    // Get a lesson and create a comment
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    const user = await prisma.user.findFirst()
    expect(user).toBeDefined()

    const comment = await prisma.lessonComment.create({
      data: {
        workspaceId: workspace!.id,
        lessonId: lesson!.id,
        authorId: user!.id,
        body: 'Test comment for webhook',
        status: 'OPEN',
      },
    })

    // Mock successful fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    // Trigger webhooks
    await triggerWorkspaceWebhooksForLessonCommentCreated(
      prisma,
      workspace!.id,
      lesson!.id,
      comment.id
    )

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )

    // Verify webhook was updated
    const updatedWebhook = await prisma.workspaceWebhook.findUnique({
      where: { id: webhook.id },
    })
    expect(updatedWebhook?.lastTriggered).not.toBeNull()
    expect(updatedWebhook?.lastStatus).toBe(200)

    // Cleanup
    await prisma.workspaceWebhook.delete({ where: { id: webhook.id } })
  })

  it('should skip inactive webhooks', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Create an inactive webhook
    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: workspace!.id,
        url: 'https://example.com/webhook',
        eventType: 'LESSON_COMMENT_CREATED',
        isActive: false,
      },
    })

    // Get a lesson and create a comment
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    const user = await prisma.user.findFirst()
    expect(user).toBeDefined()

    const comment = await prisma.lessonComment.create({
      data: {
        workspaceId: workspace!.id,
        lessonId: lesson!.id,
        authorId: user!.id,
        body: 'Test comment for webhook',
        status: 'OPEN',
      },
    })

    // Trigger webhooks
    await triggerWorkspaceWebhooksForLessonCommentCreated(
      prisma,
      workspace!.id,
      lesson!.id,
      comment.id
    )

    // Verify fetch was NOT called
    expect(mockFetch).not.toHaveBeenCalled()

    // Cleanup
    await prisma.workspaceWebhook.delete({ where: { id: webhook.id } })
  })

  it('should handle webhook delivery errors gracefully', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Create an active webhook
    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: workspace!.id,
        url: 'https://example.com/webhook',
        eventType: 'LESSON_COMMENT_CREATED',
        isActive: true,
      },
    })

    // Get a lesson and create a comment
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    const user = await prisma.user.findFirst()
    expect(user).toBeDefined()

    const comment = await prisma.lessonComment.create({
      data: {
        workspaceId: workspace!.id,
        lessonId: lesson!.id,
        authorId: user!.id,
        body: 'Test comment for webhook',
        status: 'OPEN',
      },
    })

    // Mock failed fetch
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    // Trigger webhooks - should not throw
    await expect(
      triggerWorkspaceWebhooksForLessonCommentCreated(
        prisma,
        workspace!.id,
        lesson!.id,
        comment.id
      )
    ).resolves.not.toThrow()

    // Verify webhook was updated with error status
    const updatedWebhook = await prisma.workspaceWebhook.findUnique({
      where: { id: webhook.id },
    })
    expect(updatedWebhook?.lastTriggered).not.toBeNull()
    expect(updatedWebhook?.lastStatus).toBe(0) // 0 indicates error

    // Cleanup
    await prisma.workspaceWebhook.delete({ where: { id: webhook.id } })
  })

  it('should return early if no webhooks are configured', async () => {
    // Get demo workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'demo' },
    })
    expect(workspace).toBeDefined()

    // Get a lesson and create a comment
    const lesson = await prisma.lesson.findFirst({
      where: { workspaceId: workspace!.id },
    })
    expect(lesson).toBeDefined()

    const user = await prisma.user.findFirst()
    expect(user).toBeDefined()

    const comment = await prisma.lessonComment.create({
      data: {
        workspaceId: workspace!.id,
        lessonId: lesson!.id,
        authorId: user!.id,
        body: 'Test comment for webhook',
        status: 'OPEN',
      },
    })

    // Ensure no webhooks exist for this workspace (already done in beforeEach)
    await prisma.workspaceWebhook.deleteMany({
      where: { workspaceId: workspace!.id },
    })

    // Trigger webhooks - should return early without errors
    await expect(
      triggerWorkspaceWebhooksForLessonCommentCreated(
        prisma,
        workspace!.id,
        lesson!.id,
        comment.id
      )
    ).resolves.not.toThrow()

    // Verify fetch was NOT called
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
