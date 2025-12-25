// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/gemini/route'

vi.mock('server-only', () => ({}))

const originalEnv = { ...process.env }

describe('/api/ai/gemini', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, NODE_ENV: 'test', GEMINI_VERTEX_MOCK: '1' }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('JSON Parse Error Handling', () => {
    it('should return 400 with stable error shape for plain text body "Hello"', async () => {
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
    it('should return 400 for missing messages array', async () => {
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
      const request = new NextRequest('http://localhost/api/ai/gemini', {
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
