/**
 * Webhook API Route
 *
 * LA3-P2-02: API endpoints for webhook management
 *
 * PATCH - Update webhook (toggle active status)
 * DELETE - Delete webhook
 *
 * @module app/api/studio/settings/integrations/webhooks/[id]/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * Schema for updating a webhook
 */
const UpdateWebhookSchema = z.object({
  isActive: z.boolean(),
})

/**
 * PATCH /api/studio/settings/integrations/webhooks/[id]
 *
 * Update a webhook (e.g., toggle active status)
 *
 * Requires:
 * - Authentication (valid session)
 * - Webhook belongs to active workspace
 *
 * Request body:
 * - isActive: boolean (required)
 *
 * Returns:
 * - 200: { webhook: WorkspaceWebhook }
 * - 400: Bad request (invalid input)
 * - 401: Unauthorized (no valid session)
 * - 404: Not found (webhook not found or not in active workspace)
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth()

    // Parse and validate request body
    const body = await request.json()
    const { isActive } = UpdateWebhookSchema.parse(body)

    // Verify webhook belongs to active workspace
    const webhook = await prisma.workspaceWebhook.findFirst({
      where: {
        id: params.id,
        workspaceId: session.activeWorkspaceId,
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Update webhook
    const updated = await prisma.workspaceWebhook.update({
      where: { id: params.id },
      data: { isActive },
    })

    return NextResponse.json({ webhook: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/studio/settings/integrations/webhooks/[id]
 *
 * Delete a webhook
 *
 * Requires:
 * - Authentication (valid session)
 * - Webhook belongs to active workspace
 *
 * Returns:
 * - 200: { ok: true }
 * - 401: Unauthorized (no valid session)
 * - 404: Not found (webhook not found or not in active workspace)
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth()

    // Verify webhook belongs to active workspace
    const webhook = await prisma.workspaceWebhook.findFirst({
      where: {
        id: params.id,
        workspaceId: session.activeWorkspaceId,
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Delete webhook
    await prisma.workspaceWebhook.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
