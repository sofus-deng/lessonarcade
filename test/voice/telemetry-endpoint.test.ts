import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/voice/telemetry/route'
import { telemetryRateLimiter } from '@/lib/utils/rate-limiter'

// Mock environment variables
const originalEnv = process.env

describe('Telemetry Endpoint', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
    process.env.LOGGING_SALT = 'test-salt'
    
    // Clear any existing mocks
    vi.clearAllMocks()
    
    // Mock rate limiter
    vi.mock('@/lib/utils/rate-limiter', () => ({
      telemetryRateLimiter: {
        checkLimit: vi.fn().mockReturnValue({ allowed: true })
      }
    }))
  })
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('POST /api/voice/telemetry', () => {
    it('should accept valid telemetry event', async () => {
      const requestBody = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_play',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123'
      }

      const request = new NextRequest('http://localhost:3000/api/voice/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toEqual({ ok: true })
    })

    it('should reject invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('VALIDATION')
      expect(data.error.message).toBe('Invalid JSON in request body')
    })

    it('should reject invalid event schema', async () => {
      const requestBody = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'invalid_event', // Invalid event type
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123'
      }

      const request = new NextRequest('http://localhost:3000/api/voice/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('VALIDATION')
      expect(data.error.message).toBe('Invalid telemetry event format')
    })

    it('should handle rate limiting', async () => {
      // Mock rate limiter to return rate limit exceeded
      const mockRateLimiter = vi.mocked(telemetryRateLimiter)
      mockRateLimiter.checkLimit.mockReturnValueOnce({
        allowed: false,
        retryAfter: 30
      })

      const requestBody = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_play',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123'
      }

      const request = new NextRequest('http://localhost:3000/api/voice/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(429)
      
      const data = await response.json()
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('RATE_LIMIT')
      expect(data.error.message).toBe('Too many telemetry requests. Please try again later.')
      expect(data.error.retryAfterSeconds).toBe(30)
    })

    it('should handle server errors gracefully', async () => {
      // Mock rate limiter to throw an error
      const mockRateLimiter = vi.mocked(telemetryRateLimiter)
      mockRateLimiter.checkLimit.mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const requestBody = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_play',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123'
      }

      const request = new NextRequest('http://localhost:3000/api/voice/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('Internal server error')
    })

    it('should not expose stack traces or internal errors', async () => {
      // Mock rate limiter to throw an error with stack trace
      const mockRateLimiter = vi.mocked(telemetryRateLimiter)
      const errorWithStack = new Error('Internal error') as Error & { stack: string }
      errorWithStack.stack = 'Error: Internal error\n    at test.js:123:45'
      mockRateLimiter.checkLimit.mockImplementationOnce(() => {
        throw errorWithStack
      })

      const requestBody = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_play',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123'
      }

      const request = new NextRequest('http://localhost:3000/api/voice/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('Internal server error')
      expect(data.error.stack).toBeUndefined()
    })
  })
})