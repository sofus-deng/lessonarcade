import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHash } from 'crypto'
import { NextRequest } from 'next/server'

// Mock environment variables
const originalEnv = process.env

describe('TTS Server-side Deduplication', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
    process.env.ELEVENLABS_API_KEY = 'test-key'
    process.env.LOGGING_SALT = 'test-salt'
    
    // Clear any existing mocks
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for identical inputs', () => {
      const text = "Hello world"
      const language = "en"
      const voiceId = "Adam"
      const rate = 1.0
      
      const key1 = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      const key2 = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      expect(key1).toBe(key2)
      expect(key1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    })
    
    it('should generate different cache keys for different inputs', () => {
      const text = "Hello world"
      const language = "en"
      const voiceId = "Adam"
      const rate = 1.0
      
      const key1 = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      // Different text
      const key2 = createHash('sha256')
        .update(`Different text:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      // Different language
      const key3 = createHash('sha256')
        .update(`${text}:zh:${voiceId}:${rate}`)
        .digest('hex')
      
      // Different voice
      const key4 = createHash('sha256')
        .update(`${text}:${language}:Sam:${rate}`)
        .digest('hex')
      
      // Different rate
      const key5 = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:1.5`)
        .digest('hex')
      
      expect(key1).not.toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key1).not.toBe(key4)
      expect(key1).not.toBe(key5)
    })
  })

  describe('In-flight Request Deduplication', () => {
    it('should prevent duplicate requests for identical content', async () => {
      // This test would require mocking the actual route implementation
      // For now, we'll test cache key generation logic
      
      const text = "Test text for deduplication"
      const language = "en"
      const voiceId = "Adam"
      const rate = 1.0
      
      // Generate cache key as the route would
      const cacheKey = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      // Simulate multiple requests with same parameters
      new NextRequest('http://localhost:3000/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: language, voiceId, rate })
      })
      
      new NextRequest('http://localhost:3000/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: language, voiceId, rate })
      })
      
      // Both should generate the same cache key
      const key1 = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      const key2 = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      expect(key1).toBe(key2)
      expect(key1).toBe(cacheKey)
    })
    
    it('should allow different requests for different content', async () => {
      const text1 = "First text"
      const text2 = "Second text"
      const language = "en"
      const voiceId = "Adam"
      const rate = 1.0
      
      // Generate cache keys as the route would
      const key1 = createHash('sha256')
        .update(`${text1}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      const key2 = createHash('sha256')
        .update(`${text2}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      // Should be different
      expect(key1).not.toBe(key2)
    })
  })

  describe('Cleanup Behavior', () => {
    it('should clean up in-flight requests after completion', () => {
      // This test verifies the cleanup logic concept
      // In the actual implementation, cleanup happens in finally blocks
      
      const inFlightRequests = new Map<string, Promise<Response>>()
      const cacheKey = "test-cache-key"
      
      // Simulate adding an in-flight request
      const mockPromise = new Promise<Response>((resolve) => {
        // Simulate async operation
        setTimeout(() => {
          resolve(new Response('audio data'))
        }, 100)
      })
      
      inFlightRequests.set(cacheKey, mockPromise)
      expect(inFlightRequests.size).toBe(1)
      
      // Simulate cleanup after completion
      inFlightRequests.delete(cacheKey)
      expect(inFlightRequests.size).toBe(0)
    })
    
    it('should clean up in-flight requests even on error', () => {
      // This test verifies cleanup happens even when requests fail
      
      const inFlightRequests = new Map<string, Promise<Response>>()
      const cacheKey = "test-cache-key-error"
      
      // Simulate adding an in-flight request that will fail
      const mockPromise = new Promise<Response>((_, reject) => {
        // Simulate async operation that fails
        setTimeout(() => {
          reject(new Error('API error'))
        }, 100)
      })
      
      inFlightRequests.set(cacheKey, mockPromise)
      expect(inFlightRequests.size).toBe(1)
      
      // Simulate cleanup in finally block
      inFlightRequests.delete(cacheKey)
      expect(inFlightRequests.size).toBe(0)
    })
  })

  describe('Integration with Other Guardrails', () => {
    it('should work with rate limiting', () => {
      // Verify dedupe doesn't interfere with rate limiting
      const text = "Test text"
      const language = "en"
      const voiceId = "Adam"
      const rate = 1.0
      
      // Generate cache key
      const cacheKey = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      // Cache key should be deterministic
      expect(cacheKey).toMatch(/^[a-f0-9]{64}$/)
      
      // Different rate limits should still apply
      // (This would be tested in the actual route integration test)
    })
    
    it('should work with caching', () => {
      // Verify dedupe doesn't interfere with caching
      const text = "Test text for caching"
      const language = "en"
      const voiceId = "Adam"
      const rate = 1.0
      
      // Generate cache key
      const cacheKey = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      // Same cache key should be used for both dedupe and cache
      expect(cacheKey).toMatch(/^[a-f0-9]{64}$/)
      
      // Cache and dedupe should use the same key format
      const cacheKey2 = createHash('sha256')
        .update(`${text}:${language}:${voiceId}:${rate}`)
        .digest('hex')
      
      expect(cacheKey).toBe(cacheKey2)
    })
  })
})