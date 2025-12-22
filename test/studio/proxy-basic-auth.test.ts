// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

describe('Studio Proxy Basic Auth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv
  })

  describe('when Basic Auth credentials are configured', () => {
    beforeEach(() => {
      process.env.STUDIO_BASIC_AUTH_USER = 'testuser'
      process.env.STUDIO_BASIC_AUTH_PASS = 'testpass'
    })

    it('should return 401 for /studio/voice-analytics without Authorization header', () => {
      const request = new NextRequest('https://example.com/studio/voice-analytics', {
        method: 'GET'
      })

      const response = proxy(request)

      expect(response.status).toBe(401)
      expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Lesson Studio"')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should return 401 for /studio/voice-analytics with invalid Authorization header', () => {
      const request = new NextRequest('https://example.com/studio/voice-analytics', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      const response = proxy(request)

      expect(response.status).toBe(401)
      expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Lesson Studio"')
    })

    it('should return 401 for /studio/voice-analytics with incorrect Basic auth credentials', () => {
      const request = new NextRequest('https://example.com/studio/voice-analytics', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from('wronguser:wrongpass').toString('base64')
        }
      })

      const response = proxy(request)

      expect(response.status).toBe(401)
      expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Lesson Studio"')
    })

    it('should allow access to /studio/voice-analytics with correct Basic auth credentials', () => {
      const request = new NextRequest('https://example.com/studio/voice-analytics', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from('testuser:testpass').toString('base64')
        }
      })

      const response = proxy(request)

      // NextResponse.next() returns status 200 by default
      expect(response.status).toBe(200)
      expect(response.headers.get('WWW-Authenticate')).toBeNull()
    })

    it('should allow access to /studio/voice-analytics with correct Basic auth and x-middleware-next header', () => {
      const request = new NextRequest('https://example.com/studio/voice-analytics', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from('testuser:testpass').toString('base64')
        }
      })

      const response = proxy(request)

      // Check for the presence of x-middleware-next header which indicates NextResponse.next()
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('when Basic Auth credentials are NOT configured', () => {
    beforeEach(() => {
      delete process.env.STUDIO_BASIC_AUTH_USER
      delete process.env.STUDIO_BASIC_AUTH_PASS
    })

    it('should allow access to /studio/voice-analytics without credentials in development', () => {
      const request = new NextRequest('https://example.com/studio/voice-analytics', {
        method: 'GET'
      })

      const response = proxy(request)

      // Should allow access when credentials are not configured (development mode)
      expect(response.status).toBe(200)
      expect(response.headers.get('WWW-Authenticate')).toBeNull()
    })
  })

  describe('path protection coverage', () => {
    beforeEach(() => {
      process.env.STUDIO_BASIC_AUTH_USER = 'testuser'
      process.env.STUDIO_BASIC_AUTH_PASS = 'testpass'
    })

    it('should protect /studio/voice-analytics specifically', () => {
      const request = new NextRequest('https://example.com/studio/voice-analytics', {
        method: 'GET'
      })

      const response = proxy(request)

      expect(response.status).toBe(401)
    })

    it('should protect other /studio paths as well', () => {
      const request = new NextRequest('https://example.com/studio/health', {
        method: 'GET'
      })

      const response = proxy(request)

      expect(response.status).toBe(401)
    })

    it('should protect /api/studio paths', () => {
      const request = new NextRequest('https://example.com/api/studio/health', {
        method: 'GET'
      })

      const response = proxy(request)

      expect(response.status).toBe(401)
    })

    it('should not protect non-studio paths', () => {
      const request = new NextRequest('https://example.com/api/voice/presets', {
        method: 'GET'
      })

      const response = proxy(request)

      expect(response.status).toBe(200)
    })
  })
})