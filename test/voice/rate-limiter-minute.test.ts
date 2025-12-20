import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { ttsRateLimiter } from '@/lib/utils/rate-limiter'

// Mock Date.now for deterministic testing
const mockDateNow = vi.fn()
const originalDateNow = Date.now

describe('Rate Limiter - Minute Window Behavior', () => {
  beforeEach(() => {
    // Clear rate limiter state
    ttsRateLimiter.cleanup()
    
    // Reset Date.now mock
    mockDateNow.mockReturnValue(1000000) // 1 second timestamp
    Date.now = mockDateNow
  })
  
  afterEach(() => {
    // Restore original Date.now
    Date.now = originalDateNow
    vi.restoreAllMocks()
  })

  describe('Minute-level Rate Limits', () => {
    it('should allow requests within minute limit', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-agent',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      // Test IP minute limit (5 requests per minute)
      for (let i = 0; i < 5; i++) {
        const result = ttsRateLimiter.checkMultipleLimits(mockRequest, [
          { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
        ])
        expect(result.allowed).toBe(true)
      }
    })
    
    it('should block requests exceeding minute limit', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.2',
          'user-agent': 'test-agent',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        ttsRateLimiter.checkMultipleLimits(mockRequest, [
          { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
        ])
      }
      
      // 6th request should be blocked
      const result = ttsRateLimiter.checkMultipleLimits(mockRequest, [
        { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
      ])
      
      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter).toBeGreaterThan(0)
      expect(result.retryAfter).toBeLessThanOrEqual(60)
    })
    
    it('should reset minute limit after window expires', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.3',
          'user-agent': 'test-agent',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        ttsRateLimiter.checkMultipleLimits(mockRequest, [
          { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
        ])
      }
      
      // 6th request should be blocked
      let result = ttsRateLimiter.checkMultipleLimits(mockRequest, [
        { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
      ])
      expect(result.allowed).toBe(false)
      
      // Advance time by 61 seconds (past minute window)
      mockDateNow.mockReturnValue(1000000 + 61 * 1000)
      
      // Next request should be allowed
      result = ttsRateLimiter.checkMultipleLimits(mockRequest, [
        { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
      ])
      expect(result.allowed).toBe(true)
    })
    
    it('should calculate retryAfterSeconds correctly', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.4',
          'user-agent': 'test-agent',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      // Start at timestamp 1000000
      mockDateNow.mockReturnValue(1000000)
      
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        // Advance time by 1 second for each request
        mockDateNow.mockReturnValue(1000000 + i * 1000)
        ttsRateLimiter.checkMultipleLimits(mockRequest, [
          { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
        ])
      }
      
      // 6th request at timestamp 1005000 (5 seconds later)
      mockDateNow.mockReturnValue(1000000 + 5 * 1000)
      const result = ttsRateLimiter.checkMultipleLimits(mockRequest, [
        { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 }
      ])
      
      expect(result.allowed).toBe(false)
      // Should retry after approximately 55 seconds (60 - 5)
      expect(result.retryAfter).toBeGreaterThan(50)
      expect(result.retryAfter).toBeLessThan(60)
    })
  })

  describe('Fingerprint Rate Limits', () => {
    it('should allow requests within fingerprint minute limit', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.5',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      // Test fingerprint minute limit (10 requests per minute)
      for (let i = 0; i < 10; i++) {
        const result = ttsRateLimiter.checkMultipleLimits(mockRequest, [
          { key: 'fingerprint', maxRequests: 10, windowMs: 60 * 1000 }
        ])
        expect(result.allowed).toBe(true)
      }
    })
    
    it('should block requests exceeding fingerprint minute limit', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.6',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        ttsRateLimiter.checkMultipleLimits(mockRequest, [
          { key: 'fingerprint', maxRequests: 10, windowMs: 60 * 1000 }
        ])
      }
      
      // 11th request should be blocked
      const result = ttsRateLimiter.checkMultipleLimits(mockRequest, [
        { key: 'fingerprint', maxRequests: 10, windowMs: 60 * 1000 }
      ])
      
      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter).toBeGreaterThan(0)
      expect(result.retryAfter).toBeLessThanOrEqual(60)
    })
  })

  describe('Multiple Limit Tiers', () => {
    it('should identify which limit was exceeded', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.8',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      // Test with different limits to identify which one is exceeded
      const limits = [
        { key: 'ip', maxRequests: 2, windowMs: 60 * 1000 },          // Very low IP limit
        { key: 'fingerprint', maxRequests: 100, windowMs: 60 * 1000 }  // High fingerprint limit
      ]
      
      // Make 2 requests (at IP limit)
      for (let i = 0; i < 2; i++) {
        const result = ttsRateLimiter.checkMultipleLimits(mockRequest, limits)
        expect(result.allowed).toBe(true)
      }
      
      // 3rd request should be blocked by IP limit
      const result = ttsRateLimiter.checkMultipleLimits(mockRequest, limits)
      expect(result.allowed).toBe(false)
      expect(result.exceededLimit).toBe('ip')
    })
    
    it('should handle different IPs separately', () => {
      const mockRequest1 = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.9',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      const mockRequest2 = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.10',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      const limits = [
        { key: 'ip', maxRequests: 3, windowMs: 60 * 1000 }
      ]
      
      // Make 3 requests from IP 1 (at limit)
      for (let i = 0; i < 3; i++) {
        const result = ttsRateLimiter.checkMultipleLimits(mockRequest1, limits)
        expect(result.allowed).toBe(true)
      }
      
      // 4th request from IP 1 should be blocked
      let result = ttsRateLimiter.checkMultipleLimits(mockRequest1, limits)
      expect(result.allowed).toBe(false)
      
      // But IP 2 should still be allowed
      result = ttsRateLimiter.checkMultipleLimits(mockRequest2, limits)
      expect(result.allowed).toBe(true)
    })
  })
})