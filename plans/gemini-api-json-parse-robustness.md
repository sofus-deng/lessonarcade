# Plan: Make /api/ai/gemini Robust to Invalid JSON Request Bodies

## Overview
The `/api/ai/gemini` endpoint currently throws unhandled JSON.parse errors when receiving invalid or non-JSON request bodies. This task will make the endpoint robust by:

1. Wrapping `request.json()` in try/catch to handle parse errors gracefully
2. Returning a clean 400 JSON response with a stable error shape
3. Logging a single concise line (no stack trace spam)
4. Preserving existing successful JSON behavior and E2E mock mode

## Current State

### Route Implementation (`app/api/ai/gemini/route.ts`)
- Line 133: `const body: GenerateGeminiRequest = await request.json()` - This throws on invalid JSON
- Lines 224-253: Generic catch block that returns 500 with `VERTEX_AI_ERROR` code
- No specific handling for JSON parse errors

### Error Response Schema (Lines 48-54)
```typescript
interface ErrorResponse {
  ok: false
  error: {
    code: string
    message: string
  }
}
```

### E2E Tests (`e2e/vertex-ai-gemini.spec.ts`)
- Line 160-167: Tests malformed JSON but doesn't verify stable error shape
- Line 169-177: Tests wrong content type but accepts multiple status codes

## Implementation Plan

### Step 1: Edit `app/api/ai/gemini/route.ts`

#### Changes to POST function:

1. **Add JSON parse error handling** (insert before line 133):
```typescript
// Parse request body with error handling
let body: GenerateGeminiRequest
try {
  body = await request.json()
} catch (parseError) {
  // Read request text for debugging (best-effort, don't log secrets)
  const requestText = await request.text().catch(() => '(unable to read request body)')
  console.error('JSON parse error in /api/ai/gemini: request is not valid JSON')
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "BAD_REQUEST",
        message: "Expected JSON body"
      }
    },
    { status: 400 }
  )
}
```

2. **Replace line 133** with the parsed `body` variable from above

3. **Preserve existing behavior**:
   - Keep all validation logic (lines 136-199)
   - Keep mock mode logic (lines 201-210)
   - Keep existing error handling for other errors (lines 224-253)

#### Error Response Shape
The new error response will match the existing `ErrorResponse` interface:
```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Expected JSON body"
  }
}
```

### Step 2: Create Unit Tests (`test/api/ai/gemini.test.ts`)

Create new test file with the following test cases:

```typescript
// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST } from '@/app/api/ai/gemini/route'

vi.mock('server-only', () => ({}))

const originalEnv = { ...process.env }

describe('/api/ai/gemini', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, NODE_ENV: 'test' }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('JSON Parse Error Handling', () => {
    it('should return 400 with stable error shape for plain text body "Hello"', async () => {
      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'Hello'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('BAD_REQUEST')
      expect(data.error.message).toBe('Expected JSON body')
    })

    it('should return 400 with stable error shape for invalid JSON "{"', async () => {
      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('BAD_REQUEST')
      expect(data.error.message).toBe('Expected JSON body')
    })

    it('should return 400 with stable error shape for malformed JSON', async () => {
      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"messages": invalid}'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('BAD_REQUEST')
      expect(data.error.message).toBe('Expected JSON body')
    })
  })

  describe('Valid JSON Requests Still Work', () => {
    it('should return 200 for valid JSON request in mock mode', async () => {
      process.env.GEMINI_VERTEX_MOCK = '1'

      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.text).toBe('Mock Gemini response')
      expect(data.usage).toBeDefined()
    })

    it('should return 200 for valid JSON with system prompt in mock mode', async () => {
      process.env.GEMINI_VERTEX_MOCK = '1'

      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are helpful.' },
            { role: 'user', content: 'Hello' }
          ]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.text).toBe('Mock Gemini response')
    })

    it('should return 200 for valid JSON with options in mock mode', async () => {
      process.env.GEMINI_VERTEX_MOCK = '1'

      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello' }
          ],
          options: {
            temperature: 0.5,
            maxOutputTokens: 1000
          }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.text).toBe('Mock Gemini response')
    })
  })

  describe('Existing Validation Still Works', () => {
    beforeEach(() => {
      process.env.GEMINI_VERTEX_MOCK = '1'
    })

    it('should return 400 for missing messages array', async () => {
      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for empty messages array', async () => {
      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid role', async () => {
      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'invalid', content: 'Hello' }
          ]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing content', async () => {
      const request = new Request('http://localhost/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user' }
          ]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })
})
```

### Step 3: Update E2E Tests (`e2e/vertex-ai-gemini.spec.ts`)

Update the existing malformed JSON test (lines 160-167) to verify the stable error shape:

```typescript
test('POST /api/ai/gemini returns 400 for malformed JSON with stable error shape', async ({ request }) => {
  const response = await request.post('/api/ai/gemini', {
    headers: { 'Content-Type': 'application/json' },
    data: 'invalid json'
  })

  expect(response.status()).toBe(400)

  const body = await response.json()

  // Verify stable error shape
  expect(body.ok).toBe(false)
  expect(body.error.code).toBe('BAD_REQUEST')
  expect(body.error.message).toBe('Expected JSON body')
})
```

Add new test cases for additional invalid JSON scenarios:

```typescript
test('POST /api/ai/gemini returns 400 for plain text body with stable error shape', async ({ request }) => {
  const response = await request.post('/api/ai/gemini', {
    headers: { 'Content-Type': 'application/json' },
    data: 'Hello'
  })

  expect(response.status()).toBe(400)

  const body = await response.json()

  expect(body.ok).toBe(false)
  expect(body.error.code).toBe('BAD_REQUEST')
  expect(body.error.message).toBe('Expected JSON body')
})

test('POST /api/ai/gemini returns 400 for incomplete JSON with stable error shape', async ({ request }) => {
  const response = await request.post('/api/ai/gemini', {
    headers: { 'Content-Type': 'application/json' },
    data: '{'
  })

  expect(response.status()).toBe(400)

  const body = await response.json()

  expect(body.ok).toBe(false)
  expect(body.error.code).toBe('BAD_REQUEST')
  expect(body.error.message).toBe('Expected JSON body')
})
```

## Verification Steps

1. **Run lint**: `pnpm lint`
2. **Run typecheck**: `pnpm typecheck`
3. **Run unit tests**: `CI=1 pnpm test`
4. **Run E2E tests**: `pnpm test:e2e`

All tests must pass before committing.

## Commit Message

```
Make /api/ai/gemini robust to invalid JSON request bodies

- Wrap request.json() in try/catch to handle parse errors gracefully
- Return 400 with stable error shape { ok: false, error: { code: "BAD_REQUEST", message: "Expected JSON body" } }
- Log single concise line without stack trace
- Add unit tests for JSON parse error handling
- Update E2E tests to verify stable error shape
- Preserve existing successful JSON behavior and mock mode

Work item: la3-p0-03
```

## Notes

- The error response shape matches the existing `ErrorResponse` interface used throughout the codebase
- The error code "BAD_REQUEST" is consistent with HTTP 400 semantics
- The mock mode behavior is completely preserved - the JSON parse error handling occurs before mock mode checks
- No secrets are logged; only a single console.error line is used
- The implementation is backward compatible - existing valid requests continue to work exactly as before
