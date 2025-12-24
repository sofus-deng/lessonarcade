import { test, expect } from '@playwright/test'

/**
 * Playwright smoke tests for Vertex AI Gemini API endpoint
 *
 * These tests use a mocked mode for CI determinism. The tests verify:
 * 1. The API route is accessible
 * 2. Response structure is correct
 * 3. Error handling works as expected
 *
 * Note: These tests do not make actual Vertex API calls. They test the
 * API contract and response format using mocked responses.
 */

test.describe('Vertex AI Gemini API', () => {
  test('GET /api/ai/gemini returns configuration status', async ({ request }) => {
    const response = await request.get('/api/ai/gemini')

    // Should return 200 regardless of configuration
    expect(response.status()).toBe(200)

    const body = await response.json()

    // Response should have configured boolean and config object
    expect(body).toHaveProperty('configured')
    expect(typeof body.configured).toBe('boolean')
    expect(body).toHaveProperty('config')
  })

  test('POST /api/ai/gemini returns 503 when Vertex AI is not configured', async ({ request }) => {
    // This test assumes Vertex AI is not configured in the test environment
    // (no GCP_PROJECT_ID set)

    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }
    })

    // Should return 503 Service Unavailable when not configured
    expect(response.status()).toBe(503)

    const body = await response.json()

    expect(body.ok).toBe(false)
    expect(body.error).toHaveProperty('code')
    expect(body.error).toHaveProperty('message')
    expect(body.error.code).toBe('CONFIGURATION_ERROR')
  })

  test('POST /api/ai/gemini returns 400 for missing messages', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: []
      }
    })

    expect(response.status()).toBe(400)

    const body = await response.json()

    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.message).toContain('message')
  })

  test('POST /api/ai/gemini returns 400 for invalid message structure', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [
          { role: 'user' } // Missing content
        ]
      }
    })

    expect(response.status()).toBe(400)

    const body = await response.json()

    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  test('POST /api/ai/gemini returns 400 for invalid role', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [
          { role: 'invalid', content: 'Hello' }
        ]
      }
    })

    expect(response.status()).toBe(400)

    const body = await response.json()

    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  test('POST /api/ai/gemini accepts valid request with system prompt', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ]
      }
    })

    // Will return 503 if not configured, but should validate input first
    // If configured, would return 200 with generated text
    expect([200, 503]).toContain(response.status())

    const body = await response.json()

    if (response.status() === 200) {
      // If configured, should have text field
      expect(body).toHaveProperty('text')
      expect(typeof body.text).toBe('string')
      expect(body.text.length).toBeGreaterThan(0)
    } else {
      // If not configured, should have error
      expect(body.ok).toBe(false)
      expect(body.error.code).toBe('CONFIGURATION_ERROR')
    }
  })

  test('POST /api/ai/gemini accepts valid request with options', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        options: {
          temperature: 0.5,
          maxOutputTokens: 1000
        }
      }
    })

    // Will return 503 if not configured, but should validate input first
    expect([200, 503]).toContain(response.status())

    const body = await response.json()

    if (response.status() === 200) {
      expect(body).toHaveProperty('text')
      expect(typeof body.text).toBe('string')
    } else {
      expect(body.ok).toBe(false)
      expect(body.error.code).toBe('CONFIGURATION_ERROR')
    }
  })

  test('POST /api/ai/gemini handles multi-turn conversation', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [
          { role: 'user', content: 'What is 2+2?' },
          { role: 'assistant', content: '4' },
          { role: 'user', content: 'What is 3+3?' }
        ]
      }
    })

    expect([200, 503]).toContain(response.status())

    const body = await response.json()

    if (response.status() === 200) {
      expect(body).toHaveProperty('text')
      expect(typeof body.text).toBe('string')
    } else {
      expect(body.ok).toBe(false)
    }
  })

  test('POST /api/ai/gemini returns 400 for malformed JSON', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'application/json' },
      data: 'invalid json'
    })

    expect(response.status()).toBe(400)
  })

  test('POST /api/ai/gemini returns 415 for wrong content type', async ({ request }) => {
    const response = await request.post('/api/ai/gemini', {
      headers: { 'Content-Type': 'text/plain' },
      data: 'Hello'
    })

    // Next.js will return 415 or handle the request differently
    expect([400, 415, 500]).toContain(response.status())
  })
})
