/**
 * Webhooks API Route
 *
 * LA3-P2-02: API endpoints for webhook management
 *
 * POST - Create a new webhook endpoint
 *
 * @module app/api/studio/settings/integrations/webhooks/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * Schema for creating a new webhook
 */
const CreateWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  eventType: z.enum(['LESSON_COMMENT_CREATED']),
})

/**
 * POST /api/studio/settings/integrations/webhooks
 *
 * Create a new webhook endpoint for the active workspace
 *
 * Requires:
 * - Authentication (valid session)
 *
 * Request body:
 * - url: string (required, valid URL)
 * - eventType: string (required, must be "LESSON_COMMENT_CREATED")
 *
 * Returns:
 * - 201: { webhook: WorkspaceWebhook }
 * - 400: Bad request (invalid input)
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()

    // Parse and validate request body
    const body = await request.json()
    const { url, eventType } = CreateWebhookSchema.parse(body)

    // Create webhook
    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: session.activeWorkspaceId,
        url,
        eventType,
        isActive: true,
      },
    })

    return NextResponse.json({ webhook }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
