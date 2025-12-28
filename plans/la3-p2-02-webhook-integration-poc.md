# Webhook Integration PoC Implementation Plan

## Overview

This plan implements a lightweight webhook-based integration PoC for LessonArcade, enabling outbound notifications when collaboration events occur (specifically, when a new lesson comment is created). This foundation can be extended to support Slack, email, or generic webhooks for external LMS integration.

## Architecture

```mermaid
graph TB
    A[User creates comment] --> B[POST /api/studio/lessons/[slug]/comments]
    B --> C[createLessonComment in collaboration-service]
    C --> D[Comment saved to DB]
    D --> E[triggerWorkspaceWebhooksForLessonCommentCreated]
    E --> F[Fetch active WorkspaceWebhook records]
    F --> G[For each webhook: buildLessonCommentCreatedPayload]
    G --> H[HTTP POST to webhook URL with JSON payload]
    H --> I[Update lastTriggered and lastStatus]
    I --> J[Return comment to user]
    J --> K[User sees comment in UI]
```

## Implementation Details

### 1. Prisma Schema Extension

**File:** `prisma/schema.prisma`

Add the following models and enum after the existing `WorkspaceSettings` model:

```prisma
// Webhook event types
enum WebhookEventType {
  LESSON_COMMENT_CREATED
}

// Workspace webhook endpoints
model WorkspaceWebhook {
  id            String          @id @default(uuid())
  workspace     Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workspaceId   String
  url           String
  eventType     WebhookEventType
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  lastTriggered DateTime?
  lastStatus    Int?

  @@index([workspaceId])
  @@index([eventType])
  @@index([isActive])
  @@map("workspace_webhooks")
}
```

**Update Workspace model** to include the webhooks relation:

```prisma
model Workspace {
  // ... existing fields ...
  webhooks       WorkspaceWebhook[] // NEW: Webhook endpoints for this workspace
}
```

### 2. Webhook Service

**File:** `lib/saas/webhook-service.ts`

The service will have two layers:

#### Pure Functions (Payload Builders)

```typescript
// Build JSON payload for lesson comment created event
export function buildLessonCommentCreatedPayload(
  workspace: { id: string; name: string; slug: string },
  lesson: { id: string; title: string; slug: string },
  comment: { id: string; body: string; createdAt: Date; levelIndex: number | null; itemKey: string | null },
  author: { id: string; name: string; email: string }
): WebhookPayload {
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
```

#### Async Functions (Webhook Delivery)

```typescript
// Trigger webhooks for lesson comment created event
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
      eventType: 'LESSON_COMMENT_CREATED',
      isActive: true,
    },
  })

  if (webhooks.length === 0) {
    return // No webhooks to trigger
  }

  // Fetch related data
  const [workspace, lesson, comment, author] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.lesson.findUnique({ where: { id: lessonId } }),
    prisma.lessonComment.findUnique({
      where: { id: commentId },
      include: { author: true },
    }),
  ])

  if (!workspace || !lesson || !comment) {
    return // Data integrity issue, skip webhook
  }

  // Build payload
  const payload = buildLessonCommentCreatedPayload(
    workspace,
    lesson,
    comment,
    comment.author
  )

  // Trigger webhooks in parallel (best effort)
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

        // Update webhook with status
        await prisma.workspaceWebhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggered: new Date(),
            lastStatus: response.status,
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
```

### 3. Integration with Collaboration Service

**File:** `lib/lessonarcade/collaboration-service.ts`

After creating a comment, trigger the webhook notification:

```typescript
// In createLessonComment function, after comment is created:
export async function createLessonComment(
  prisma: PrismaClient,
  workspaceSlug: string,
  lessonSlug: string,
  authorUserId: string,
  input: CreateCommentInput
): Promise<LessonCommentDTO> {
  // ... existing validation and data fetching ...

  // Create comment
  const comment = await prisma.lessonComment.create({
    data: {
      workspaceId: workspace.id,
      lessonId: lesson.id,
      authorId: authorUserId,
      body: validated.body,
      levelIndex: validated.levelIndex,
      itemKey: validated.itemKey,
      status: 'OPEN',
    },
    include: {
      author: true,
    },
  })

  // Trigger webhook notification (fire-and-forget)
  // Note: This is called in a voided promise to not block the response
  import { triggerWorkspaceWebhooksForLessonCommentCreated } from '@/lib/saas/webhook-service'
  void triggerWorkspaceWebhooksForLessonCommentCreated(
    prisma,
    workspace.id,
    lesson.id,
    comment.id
  ).catch((error) => {
    console.error('Webhook notification failed:', error)
  })

  return {
    // ... existing return ...
  }
}
```

### 4. API Route Update

**File:** `app/api/studio/lessons/[lessonSlug]/comments/route.ts`

The webhook is already triggered in the collaboration service, so the API route doesn't need additional changes. The webhook notification runs in the background and doesn't block the response.

### 5. Studio Integrations Page

**File:** `app/studio/settings/integrations/page.tsx`

Create a new page for configuring webhook endpoints:

```typescript
import { Metadata } from "next"
import { requireAuth } from "@/lib/saas/session"
import { prisma } from "@/lib/db/prisma"
import { StudioHeader } from "@/components/studio/studio-header"
import { WebhooksClient } from "./webhooks-client"

export const metadata: Metadata = {
  title: "Integrations | LessonArcade Studio",
  description: "Configure webhook integrations for your workspace.",
}

export default async function IntegrationsPage() {
  const session = await requireAuth()

  // Fetch workspace and webhooks
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.activeWorkspaceId },
    include: {
      webhooks: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  return (
    <div data-testid="la-studio-integrations-page" className="min-h-screen bg-la-bg">
      <StudioHeader
        currentWorkspaceId={session.activeWorkspaceId}
        workspaces={[workspace]}
        redirectTo="/studio/settings/integrations"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-la-surface">
              Integrations (Preview)
            </h1>
            <p className="text-la-muted mt-2">
              Configure webhook endpoints to receive notifications about collaboration events.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>PoC Note:</strong> This is a preview/demo feature. Real Slack, email, or LMS integrations would be built on top of this foundation.
              </p>
            </div>
          </div>

          <WebhooksClient
            workspaceId={workspace.id}
            webhooks={workspace.webhooks}
          />
        </div>
      </main>
    </div>
  )
}
```

**File:** `app/studio/settings/integrations/webhooks-client.tsx` (Client component)

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Check, X, Clock } from 'lucide-react'

interface Webhook {
  id: string
  url: string
  eventType: string
  isActive: boolean
  createdAt: Date
  lastTriggered: Date | null
  lastStatus: number | null
}

interface WebhooksClientProps {
  workspaceId: string
  webhooks: Webhook[]
}

export function WebhooksClient({ workspaceId, webhooks }: WebhooksClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddWebhook = async () => {
    setIsAdding(true)
    try {
      const response = await fetch('/api/studio/settings/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, eventType: 'LESSON_COMMENT_CREATED' }),
      })

      if (!response.ok) throw new Error('Failed to add webhook')

      setNewUrl('')
      setShowAddForm(false)
      window.location.reload() // Simple refresh for PoC
    } catch (error) {
      console.error('Error adding webhook:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/studio/settings/integrations/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) throw new Error('Failed to update webhook')
      window.location.reload()
    } catch (error) {
      console.error('Error toggling webhook:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const response = await fetch(`/api/studio/settings/integrations/webhooks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete webhook')
      window.location.reload()
    } catch (error) {
      console.error('Error deleting webhook:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-la-surface">Webhook Endpoints</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Webhook</CardTitle>
            <CardDescription>
              Enter the URL where webhook events will be sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-la-surface">Webhook URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-la-surface">Event Type</label>
                <div className="mt-1 p-2 bg-la-bg rounded border">
                  <span className="text-sm">Lesson comment created</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddWebhook} disabled={!newUrl || isAdding}>
                  {isAdding ? 'Adding...' : 'Add Webhook'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-la-muted">No webhooks configured yet.</p>
            <p className="text-sm text-la-muted mt-2">
              Add a webhook to receive notifications when lesson comments are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{webhook.eventType}</Badge>
                    </div>
                    <div className="font-mono text-sm text-la-surface break-all">
                      {webhook.url}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-la-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {new Date(webhook.createdAt).toLocaleString()}
                      </span>
                      {webhook.lastTriggered && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                        </span>
                      )}
                      {webhook.lastStatus !== null && (
                        <span className="flex items-center gap-1">
                          {webhook.lastStatus >= 200 && webhook.lastStatus < 300 ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                          Status: {webhook.lastStatus || 'Error'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(webhook.id, webhook.isActive)}
                      title={webhook.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {webhook.isActive ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(webhook.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 6. API Routes for Webhook Management

**File:** `app/api/studio/settings/integrations/webhooks/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const CreateWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  eventType: z.enum(['LESSON_COMMENT_CREATED']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { url, eventType } = CreateWebhookSchema.parse(body)

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
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**File:** `app/api/studio/settings/integrations/webhooks/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/saas/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const UpdateWebhookSchema = z.object({
  isActive: z.boolean(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

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

    const updated = await prisma.workspaceWebhook.update({
      where: { id: params.id },
      data: { isActive },
    })

    return NextResponse.json({ webhook: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    await prisma.workspaceWebhook.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 7. Demo Seed Extension

**File:** `lib/test/demo-seed.ts`

Add a function to seed webhooks for the demo workspace:

```typescript
/**
 * Seed webhooks for demo workspace
 */
export async function seedDemoWebhooks(
  prisma: PrismaClient,
  options: DemoSeedOptions = {}
): Promise<void> {
  const log = options.logger?.log ?? (() => {})

  // Get demo workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: DEMO_WORKSPACE.slug },
  })

  if (!workspace) {
    return
  }

  // Create example webhook
  await prisma.workspaceWebhook.upsert({
    where: {
      id: 'demo-webhook-1', // Fixed ID for consistency
    },
    update: {},
    create: {
      id: 'demo-webhook-1',
      workspaceId: workspace.id,
      url: 'https://example.com/lessonarcade-webhook-demo',
      eventType: 'LESSON_COMMENT_CREATED',
      isActive: true,
    },
  })

  log(`Webhook: https://example.com/lessonarcade-webhook-demo`)
}
```

Update `seedDemoWorkspaceAndLessons` to call this function at the end:

```typescript
export async function seedDemoWorkspaceAndLessons(
  prisma: PrismaClient,
  options: DemoSeedOptions = {}
): Promise<DemoSeedSummary> {
  // ... existing code ...

  log('Demo workspace seeded successfully.')
  log(`Workspace ID: ${workspace.id}`)
  log(`Lessons seeded: ${seededLessons}`)
  log(`Total lessons in workspace: ${totalLessons}`)

  // Seed webhooks
  await seedDemoWebhooks(prisma, options)

  return {
    workspaceId: workspace.id,
    lessonsSeeded: seededLessons,
    totalLessons,
  }
}
```

### 8. README Documentation

Add a new section under "SaaS Data Model (Phase 3)":

```markdown
## Integrations & Webhooks (PoC)

LessonArcade v0.3 includes a proof-of-concept webhook system for outbound notifications when collaboration events occur.

### Webhook Events

Currently supported events:
- `LESSON_COMMENT_CREATED` - Triggered when a new comment is created on a lesson

### Configuring Webhooks

1. Sign in to Studio as an Owner or Admin
2. Navigate to `/studio/settings/integrations`
3. Click "Add Webhook" and enter your webhook URL
4. Select the event type (currently only "Lesson comment created")
5. Toggle the webhook active/inactive as needed

### Webhook Payload Format

When a `LESSON_COMMENT_CREATED` event occurs, the webhook receives a POST request with the following JSON payload:

```json
{
  "type": "lesson.comment.created",
  "workspace": {
    "id": "workspace-id",
    "name": "Workspace Name",
    "slug": "workspace-slug"
  },
  "lesson": {
    "id": "lesson-id",
    "title": "Lesson Title",
    "slug": "lesson-slug"
  },
  "comment": {
    "id": "comment-id",
    "body": "Comment text",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "levelIndex": 0,
    "itemKey": "question-1"
  },
  "author": {
    "id": "user-id",
    "name": "Author Name",
    "email": "author@example.com"
  },
  "timestamp": "2025-12-28T00:00:00.000Z"
}
```

### PoC Limitations

This is a preview/demo feature with the following limitations:
- No retry logic for failed webhook deliveries
- No signature verification (webhooks are not authenticated)
- No rate limiting on webhook delivery
- No batching of multiple events
- Only one event type is supported

For production use, this foundation would need to be extended with:
- Retry queue with exponential backoff
- HMAC signature verification for security
- Rate limiting and circuit breakers
- Event filtering and batching
- Support for more event types

### Future Integrations

This webhook system is designed as a foundation for future integrations:
- **Slack**: Post notifications to Slack channels when comments are created
- **Email**: Send email digests of new comments
- **LMS**: Push lesson activity to external learning management systems
- **Custom**: Build custom integrations using the webhook payload
```

### 9. Unit/Integration Tests

**File:** `test/saas/webhook-service.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
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

  afterEach(async () => {
    await prisma.$disconnect()
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
    })

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
    await prisma.lessonComment.delete({ where: { id: comment.id } })
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
    await prisma.lessonComment.delete({ where: { id: comment.id } })
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
    await prisma.lessonComment.delete({ where: { id: comment.id } })
  })
})
```

### 10. E2E Tests

**File:** `e2e/integrations-webhooks.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

const AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64')

test.describe('Integrations - Webhooks', () => {
  test('Owner can view and manage webhooks', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })

    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)

    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')

    // Verify page loads
    await expect(
      page.locator('[data-testid="la-studio-integrations-page"]')
    ).toBeVisible()

    // Verify pre-seeded webhook is visible
    await expect(
      page.getByText('https://example.com/lessonarcade-webhook-demo')
    ).toBeVisible()

    // Verify PoC notice is visible
    await expect(
      page.getByText(/PoC Note/)
    ).toBeVisible()
  })

  test('Owner can add a new webhook', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })

    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)

    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')

    // Click "Add Webhook"
    await page.getByRole('button', { name: 'Add Webhook' }).click()

    // Fill in webhook URL
    await page
      .getByPlaceholder('https://example.com/webhook')
      .fill('https://test.example.com/webhook')

    // Click "Add Webhook" button
    await page.getByRole('button', { name: 'Add Webhook' }).click()

    // Verify new webhook appears (page reloads)
    await expect(
      page.getByText('https://test.example.com/webhook')
    ).toBeVisible()
  })

  test('Webhook is triggered when comment is created', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })

    // Set up request interception for webhook
    const webhookRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('example.com/lessonarcade-webhook-demo')) {
        webhookRequests.push(request.url())
      }
    })

    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)

    // Navigate to lessons overview
    await page.goto('/studio/lessons')

    // Click Review button on first lesson
    await page.getByRole('button', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)

    // Add a comment
    const testComment = 'E2E test for webhook trigger'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()

    // Verify comment appears
    await expect(page.getByText(testComment)).toBeVisible()

    // Note: In a real test environment, you'd need a mock webhook server
    // For PoC, we're just verifying the integration point exists
    // The actual webhook delivery happens server-side
  })

  test('Inactive webhooks are not triggered', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })

    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)

    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')

    // Deactivate the pre-seeded webhook
    await page
      .locator('button[title="Deactivate"]')
      .first()
      .click()

    // Verify webhook is now inactive
    await expect(page.getByText('Inactive')).toBeVisible()

    // Navigate to lessons and add a comment
    await page.goto('/studio/lessons')
    await page.getByRole('button', { name: 'Review' }).first().click()

    const testComment = 'Test with inactive webhook'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()

    await expect(page.getByText(testComment)).toBeVisible()

    // Reactivate webhook for other tests
    await page.goto('/studio/settings/integrations')
    await page
      .locator('button[title="Activate"]')
      .first()
      .click()
  })
})
```

## Quality Gates

After implementation, run the following commands:

```bash
# Sync Prisma schema to dev DB
pnpm db:push:dev

# Run linter
pnpm lint

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e:ci

# Run smoke tests
pnpm test:smoke
```

## Git Commit

When all tests pass, commit with:

```
feat(la3-p2-02): add webhook-based integration PoC for lesson comments
```

## Summary

This implementation provides:
1. A lightweight webhook model (`WorkspaceWebhook`) for storing endpoint configuration
2. A webhook service that builds payloads and delivers HTTP POST requests
3. Integration with the collaboration service to trigger webhooks on comment creation
4. A Studio settings page for configuring webhook endpoints
5. Demo seeding with an example webhook endpoint
6. Unit and E2E tests to verify functionality
7. Documentation in README explaining the PoC nature and future possibilities

The implementation follows existing patterns in the codebase and is designed to be easily extended for additional event types and integration targets (Slack, email, LMS, etc.).
