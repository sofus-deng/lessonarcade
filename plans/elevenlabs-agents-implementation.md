# ElevenLabs Agents Voice Conversation - Implementation Plan

## Overview
Implement ElevenLabs Agents voice conversation web integration into LessonArcade without replacing existing product pages.

## Architecture Diagram

```mermaid
graph TB
    A[User Browser] --> B[/agents page]
    B --> C[ElevenLabsConversation Component]
    C --> D[Start Conversation Button]
    D --> E[navigator.mediaDevices.getUserMedia]
    E --> F[/api/get-signed-url]
    F --> G{E2E Mock Mode?}
    G -->|Yes| H[Return E2E_ELEVENLABS_SIGNED_URL]
    G -->|No| I[ElevenLabs API]
    I --> J[GET /v1/convai/conversation/get-signed-url]
    J --> K[Return signedUrl]
    H --> L[conversation.startSession]
    K --> L
    L --> M[WebRTC Connection]
    M --> N[ElevenLabs Agent]
    C --> O[Stop Conversation Button]
    O --> P[conversation.endSession]
```

## Implementation Steps

### 1. Add Dependency
```bash
pnpm add @elevenlabs/react
```

### 2. Environment Variables

Add to `.env.example`:
```bash
# ============================================
# ElevenLabs Agents Configuration
# ============================================

# ElevenLabs API Key (server-only)
# Get your key from: https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=

# ElevenLabs Agent ID (public, safe to expose)
# Create an agent at: https://elevenlabs.io/app/convai/agents
NEXT_PUBLIC_AGENT_ID=

# E2E Testing Mock Mode
# Set to a mock signed URL for deterministic E2E tests
E2E_ELEVENLABS_SIGNED_URL=
```

### 3. API Route: `app/api/get-signed-url/route.ts`

**Purpose**: Server-side proxy to fetch signed URL from ElevenLabs API.

**Implementation Details**:
- Runtime: `nodejs`
- Method: `GET`
- Returns: `{ signedUrl: string }`
- Error handling:
  - Missing `ELEVENLABS_API_KEY` → 500 with error JSON
  - Missing `NEXT_PUBLIC_AGENT_ID` → 500 with error JSON
  - Non-200 response from ElevenLabs → 500 with error JSON
- E2E mock mode: If `E2E_ELEVENLABS_SIGNED_URL` is set, return it directly

**Code Structure**:
```typescript
export const runtime = "nodejs"

export async function GET() {
  // Check E2E mock mode first
  if (process.env.E2E_ELEVENLABS_SIGNED_URL) {
    return NextResponse.json({ signedUrl: process.env.E2E_ELEVENLABS_SIGNED_URL })
  }

  // Validate environment variables
  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: { code: "CONFIG_ERROR", message: "ELEVENLABS_API_KEY not configured" } },
      { status: 500 }
    )
  }

  if (!agentId) {
    return NextResponse.json(
      { ok: false, error: { code: "CONFIG_ERROR", message: "NEXT_PUBLIC_AGENT_ID not configured" } },
      { status: 500 }
    )
  }

  // Call ElevenLabs API
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    {
      headers: { "xi-api-key": apiKey }
    }
  )

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, error: { code: "ELEVENLABS_ERROR", message: `ElevenLabs API error: ${response.status}` } },
      { status: 500 }
    )
  }

  const data = await response.json()
  return NextResponse.json({ signedUrl: data.signed_url })
}
```

### 4. Client Component: `components/agents/elevenlabs-conversation.tsx`

**Purpose**: React component for ElevenLabs voice conversation.

**Implementation Details**:
- Use `useConversation` from `@elevenlabs/react`
- "Start Conversation" button:
  - Requests `navigator.mediaDevices.getUserMedia({ audio: true })` on click
  - Fetches `/api/get-signed-url`
  - Calls `conversation.startSession({ signedUrl, connectionType: "webrtc" })`
- "Stop Conversation" button:
  - Calls `conversation.endSession()`
- Display status and `isSpeaking` state
- No auto-start (user must click button)

**Code Structure**:
```typescript
"use client"

import { useConversation } from "@elevenlabs/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ElevenLabsConversation() {
  const conversation = useConversation()
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setError(null)
    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Get signed URL
      const response = await fetch("/api/get-signed-url")
      if (!response.ok) {
        throw new Error("Failed to get signed URL")
      }
      const { signedUrl } = await response.json()

      // Start session
      await conversation.startSession({
        signedUrl,
        connectionType: "webrtc"
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation")
    }
  }

  const handleStop = async () => {
    try {
      await conversation.endSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop conversation")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-gray-600">
        Status: {conversation.status} | Speaking: {conversation.isSpeaking ? "Yes" : "No"}
      </div>
      {!conversation.isConnected ? (
        <Button onClick={handleStart}>Start Conversation</Button>
      ) : (
        <Button onClick={handleStop} variant="destructive">Stop Conversation</Button>
      )}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  )
}
```

### 5. Page: `app/agents/page.tsx`

**Purpose**: Minimal page that renders the ElevenLabs conversation component.

**Implementation Details**:
- Renders `ElevenLabsConversation` component
- Includes explanation about mic permission requirement
- Uses existing project styling patterns
- Does not disturb existing navigation

**Code Structure**:
```typescript
import { ElevenLabsConversation } from "@/components/agents/elevenlabs-conversation"

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-la-bg" data-testid="la-agents-page">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-la-surface mb-4">
          Voice Conversation with AI Agent
        </h1>
        <p className="text-gray-600 mb-8">
          Have a natural voice conversation with an AI agent. Click the button below to start.
          Please note that microphone permission is required.
        </p>
        <div className="bg-white rounded-lg shadow-md p-8">
          <ElevenLabsConversation />
        </div>
      </div>
    </div>
  )
}
```

### 6. Unit Tests: `test/api/get-signed-url.test.ts`

**Test Cases**:
1. Success path - returns signed URL from ElevenLabs API
2. Error path - missing `ELEVENLABS_API_KEY`
3. Error path - missing `NEXT_PUBLIC_AGENT_ID`
4. Error path - non-200 response from ElevenLabs
5. E2E mock mode - returns mock signed URL without calling ElevenLabs

**Test Structure**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/get-signed-url/route'

describe('/api/get-signed-url', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should return signed URL in E2E mock mode', async () => {
    process.env.E2E_ELEVENLABS_SIGNED_URL = 'https://mock-signed-url.com'
    const response = await GET()
    const data = await response.json()
    expect(data.signedUrl).toBe('https://mock-signed-url.com')
  })

  it('should return 500 when ELEVENLABS_API_KEY is missing', async () => {
    process.env.ELEVENLABS_API_KEY = ''
    process.env.NEXT_PUBLIC_AGENT_ID = 'test-agent-id'
    const response = await GET()
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.ok).toBe(false)
    expect(data.error.code).toBe('CONFIG_ERROR')
  })

  it('should return 500 when NEXT_PUBLIC_AGENT_ID is missing', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-api-key'
    process.env.NEXT_PUBLIC_AGENT_ID = ''
    const response = await GET()
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.ok).toBe(false)
    expect(data.error.code).toBe('CONFIG_ERROR')
  })

  it('should handle non-200 response from ElevenLabs', async () => {
    // Mock fetch to return 401
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      } as Response)
    )

    process.env.ELEVENLABS_API_KEY = 'test-api-key'
    process.env.NEXT_PUBLIC_AGENT_ID = 'test-agent-id'

    const response = await GET()
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.ok).toBe(false)
    expect(data.error.code).toBe('ELEVENLABS_ERROR')
  })
})
```

### 7. E2E Tests: `e2e/elevenlabs-agents.spec.ts`

**Test Cases**:
1. `/api/get-signed-url` returns JSON with `signedUrl` (uses mock mode, no network)
2. `/agents` page renders and shows the start button (do not click to avoid mic requirement)

**Test Structure**:
```typescript
import { test, expect } from '@playwright/test'

test('GET /api/get-signed-url returns signedUrl in mock mode', async ({ request }) => {
  const response = await request.get('/api/get-signed-url')
  expect(response.ok()).toBe(true)

  const data = await response.json()
  expect(data).toHaveProperty('signedUrl')
  expect(typeof data.signedUrl).toBe('string')
})

test('/agents page renders and shows start button', async ({ page }) => {
  await page.goto('/agents')

  // Verify page is visible
  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()

  // Verify start button is visible
  await expect(page.getByText('Start Conversation')).toBeVisible()

  // IMPORTANT: Do not click to avoid mic requirement in CI
})
```

### 8. Update `playwright.config.ts`

Add `E2E_ELEVENLABS_SIGNED_URL` to the webServer env section:
```typescript
webServer: {
  command: process.env.PLAYWRIGHT_WEB_SERVER_CMD ?? 'pnpm dev --port 3100',
  url: 'http://127.0.0.1:3100',
  reuseExistingServer: !process.env.CI,
  env: {
    GEMINI_VERTEX_MOCK: '1',
    E2E_ELEVENLABS_SIGNED_URL: 'https://mock-signed-url-e2e-test.com',
  },
},
```

### 9. Update README.md

Add section after "ElevenLabs API Configuration":
```markdown
# ElevenLabs Agents Configuration

# Create an agent at: https://elevenlabs.io/app/convai/agents
# The agent ID is safe to be public
NEXT_PUBLIC_AGENT_ID=

# E2E Testing Mock Mode (for CI only)
# Set to a mock signed URL for deterministic E2E tests
E2E_ELEVENLABS_SIGNED_URL=
```

## Testing Strategy

### Unit Tests
- Mock `fetch` for ElevenLabs API calls
- Test all error paths
- Test E2E mock mode

### E2E Tests
- Use `E2E_ELEVENLABS_SIGNED_URL` to avoid external network calls
- Do not click buttons that require mic permission in CI
- Verify page renders correctly

### Deterministic CI
- All tests use mock mode
- No external ElevenLabs API calls in CI
- E2E tests verify UI rendering without triggering actual conversations

## File Structure

```
app/
├── api/
│   └── get-signed-url/
│       └── route.ts          # New API route
├── agents/
│   └── page.tsx              # New agents page
components/
└── agents/
    └── elevenlabs-conversation.tsx  # New client component
test/
└── api/
    └── get-signed-url.test.ts # New unit tests
e2e/
└── elevenlabs-agents.spec.ts  # New E2E tests
```

## Notes

- The implementation does NOT replace existing product pages
- The `/agents` page is a standalone feature
- Mic permission is only requested when user clicks "Start Conversation"
- All tests are deterministic and don't require actual ElevenLabs API calls
- E2E tests avoid clicking buttons that require mic permission
