/**
 * Webhook Service
 *
 * LA3-P2-02: Webhook-based integration PoC for lesson comments
 *
 * This module provides:
 * - Pure functions to build webhook payloads for different event types
 * - Async functions to deliver webhooks to configured endpoints
 *
 * IMPORTANT: This is demo-grade code, not production-ready.
 * - No retry logic for failed deliveries
 * - No signature verification for security
 * - No rate limiting or circuit breakers
 *
 * @module lib/saas/webhook-service
 */

import type { PrismaClient } from '@prisma/client'
import type { WebhookEventType } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Webhook payload for lesson comment created event
 */
export interface LessonCommentCreatedPayload {
  type: 'lesson.comment.created'
  workspace: {
    id: string
    name: string
    slug: string
  }
  lesson: {
    id: string
    title: string
    slug: string
  }
  comment: {
    id: string
    body: string
    createdAt: string
    levelIndex: number | null
    itemKey: string | null
  }
  author: {
    id: string
    name: string
    email: string
  }
  timestamp: string
}

/**
 * Union type of all webhook payloads
 */
export type WebhookPayload = LessonCommentCreatedPayload

// ============================================================================
// PAYLOAD BUILDERS (Pure Functions)
// ============================================================================

/**
 * Build JSON payload for lesson comment created event
 *
 * This is a pure function that constructs the payload structure
 * from the provided entities. It does not perform any I/O.
 *
 * @param workspace - Workspace entity
 * @param lesson - Lesson entity
 * @param comment - Comment entity
 * @param author - Author user entity
 * @returns Webhook payload for lesson comment created event
 */
export function buildLessonCommentCreatedPayload(
  workspace: { id: string; name: string; slug: string },
  lesson: { id: string; title: string; slug: string },
  comment: { id: string; body: string; createdAt: Date; levelIndex: number | null; itemKey: string | null },
  author: { id: string; name: string; email: string }
): LessonCommentCreatedPayload {
  return {
    type: 'lesson.comment.created',
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    lesson: {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
    },
    comment: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      levelIndex: comment.levelIndex,
      itemKey: comment.itemKey,
    },
    author: {
      id: author.id,
      name: author.name,
      email: author.email,
    },
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// WEBHOOK DELIVERY (Async Functions)
// ============================================================================

/**
 * Trigger webhooks for lesson comment created event
 *
 * This function:
 * 1. Fetches all active WorkspaceWebhook records for the workspace with matching event type
 * 2. Builds the payload for each webhook
 * 3. Sends HTTP POST requests to each webhook URL
 * 4. Updates lastTriggered and lastStatus for each webhook
 * 5. Swallows errors - failures are logged but do not throw
 *
 * This is a "best effort" delivery strategy - failures do not block the main application flow.
 *
 * @param prisma - Prisma client instance
 * @param workspaceId - Workspace ID
 * @param lessonId - Lesson ID
 * @param commentId - Comment ID
 * @returns Promise that resolves when all webhook deliveries are attempted
 */
export async function triggerWorkspaceWebhooksForLessonCommentCreated(
  prisma: PrismaClient,
  workspaceId: string,
  lessonId: string,
  commentId: string
): Promise<void> {
  // Fetch all active webhooks for this workspace and event type
  const webhooks = await prisma.workspaceWebhook.findMany({
    where: {
      workspaceId,
      eventType: 'LESSON_COMMENT_CREATED' as WebhookEventType,
      isActive: true,
    },
  })

  if (webhooks.length === 0) {
    return // No webhooks to trigger
  }

  // Fetch related data
  const [workspace, lesson, comment] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.lesson.findUnique({ where: { id: lessonId } }),
    prisma.lessonComment.findUnique({
      where: { id: commentId },
      include: { author: true },
    }),
  ])

  if (!workspace || !lesson || !comment) {
    // Data integrity issue, skip webhook delivery
    console.error('Webhook delivery skipped: missing data', {
      workspace: !!workspace,
      lesson: !!lesson,
      comment: !!comment,
    })
    return
  }

  // Build payload
  const payload = buildLessonCommentCreatedPayload(
    workspace,
    lesson,
    comment,
    comment.author
  )

  // Trigger webhooks in parallel (best effort)
  // Using Promise.allSettled to ensure all webhooks are attempted
  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LessonArcade-Webhook/1.0',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Update webhook with status - handle case where response might be undefined on error
        const status = response && 'status' in response ? response.status : 0
        await prisma.workspaceWebhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggered: new Date(),
            lastStatus: status,
          },
        })
      } catch (error) {
        // Log error but don't throw - best effort delivery
        console.error(`Webhook delivery failed for ${webhook.url}:`, error)

        // Update webhook with error status
        await prisma.workspaceWebhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggered: new Date(),
            lastStatus: 0, // 0 indicates error
          },
        })
      }
    })
  )
}
