// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { VoiceTelemetryEventSchema, appendTelemetryEvent, createTextHash, createSessionId, type VoiceTelemetryEvent } from '@/lib/lessonarcade/voice/telemetry'

// Mock the fs/promises module
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  appendFile: vi.fn().mockResolvedValue(undefined)
}))

// Mock the path module
vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join('/'))
  }
}))

// Mock environment variables
const originalEnv = process.env

describe('Voice Telemetry', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
    process.env.LOGGING_SALT = 'test-salt'
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-20T10:00:00.000Z'))
    
    // Clear any existing mocks
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Schema Validation', () => {
    it('should validate a complete telemetry event', () => {
      const event: VoiceTelemetryEvent = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_play',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        voicePresetKey: 'preset1',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123',
        ipHash: 'ipHash123',
        fingerprintHash: 'fpHash123',
        deduped: false
      }

      const result = VoiceTelemetryEventSchema.safeParse(event)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(event)
      }
    })

    it('should validate event with minimal required fields', () => {
      const event: VoiceTelemetryEvent = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_end',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'ai',
        languageCode: 'zh',
        rate: 1.2,
        textLen: 50,
        textHash: 'def456',
        sessionId: 'sess_minimal'
      }

      const result = VoiceTelemetryEventSchema.safeParse(event)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.voicePresetKey).toBeUndefined()
        expect(result.data.ipHash).toBeUndefined()
        expect(result.data.fingerprintHash).toBeUndefined()
        expect(result.data.deduped).toBeUndefined()
        expect(result.data.reason).toBeUndefined()
      }
    })

    it('should reject invalid event types', () => {
      const event = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'invalid_event',
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

      const result = VoiceTelemetryEventSchema.safeParse(event)
      expect(result.success).toBe(false)
    })

    it('should reject invalid engine types', () => {
      const event = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_play',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'invalid_engine',
        languageCode: 'en',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123'
      }

      const result = VoiceTelemetryEventSchema.safeParse(event)
      expect(result.success).toBe(false)
    })

    it('should reject invalid reason types', () => {
      const event = {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_stop',
        lessonSlug: 'test-lesson',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        rate: 1.0,
        textLen: 100,
        textHash: 'abc123',
        sessionId: 'sess_test123',
        reason: 'invalid_reason'
      }

      const result = VoiceTelemetryEventSchema.safeParse(event)
      expect(result.success).toBe(false)
    })
  })

  describe('Text Hashing', () => {
    it('should create consistent SHA-256 hashes', () => {
      const text = "Hello world"
      const hash1 = createTextHash(text)
      const hash2 = createTextHash(text)
      
      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex format
    })

    it('should create different hashes for different texts', () => {
      const text1 = "Hello world"
      const text2 = "Goodbye world"
      
      const hash1 = createTextHash(text1)
      const hash2 = createTextHash(text2)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should create different hashes for same text in different languages', () => {
      const englishText = "Hello"
      const chineseText = "你好"
      
      const englishHash = createTextHash(englishText)
      const chineseHash = createTextHash(chineseText)
      
      expect(englishHash).not.toBe(chineseHash)
    })
  })

  describe('Session ID Generation', () => {
    it('should generate unique session IDs', () => {
      const sessionId1 = createSessionId()
      const sessionId2 = createSessionId()
      
      expect(sessionId1).not.toBe(sessionId2)
      expect(sessionId1).toMatch(/^sess_[a-z0-9]+$/)
      expect(sessionId2).toMatch(/^sess_[a-z0-9]+$/)
    })

    it('should generate session IDs with reasonable length', () => {
      const sessionId = createSessionId()
      
      expect(sessionId.length).toBeGreaterThan(10)
      expect(sessionId.length).toBeLessThan(30)
    })
  })

  describe('JSONL Append Behavior', () => {
    it('should append telemetry events to daily file', async () => {
      const event: VoiceTelemetryEvent = {
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

      // Mock request for server-side hashing
      const mockRequest = new NextRequest('http://localhost:3000/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-agent',
          'accept-language': 'en-US,en;q=0.9'
        }
      })

      await appendTelemetryEvent(event, mockRequest)

      // Get the mocked functions
      const { mkdir, appendFile } = await import('node:fs/promises')
      const mockedMkdir = vi.mocked(mkdir)
      const mockedAppendFile = vi.mocked(appendFile)

      // Verify directory creation was attempted
      expect(mockedMkdir).toHaveBeenCalledWith(
        expect.stringContaining('data/voice-analytics'),
        { recursive: true }
      )

      // Verify file append was attempted
      expect(mockedAppendFile).toHaveBeenCalledWith(
        expect.stringContaining('events-2025-12-20.jsonl'),
        expect.stringContaining('"schemaVersion":1'),
        'utf8'
      )
    })

    it('should handle missing directory gracefully', async () => {
      const event: VoiceTelemetryEvent = {
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

      // Get the mocked functions
      const { mkdir } = await import('node:fs/promises')
      const mockedMkdir = vi.mocked(mkdir)
      
      // Mock fs.mkdir to throw error (directory doesn't exist)
      mockedMkdir.mockRejectedValueOnce(new Error('Directory creation failed'))

      // Should not throw error
      await expect(appendTelemetryEvent(event)).resolves.toBeUndefined()
    })

    it('should add server-side hashes when request provided', async () => {
      const event: VoiceTelemetryEvent = {
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

      const mockRequest = new NextRequest('http://localhost:3000/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US,en;q=0.9'
        }
      })

      await appendTelemetryEvent(event, mockRequest)

      // Get the mocked functions
      const { appendFile } = await import('node:fs/promises')
      const mockedAppendFile = vi.mocked(appendFile)

      // Verify the event was stored with server-side hashes
      const appendCall = mockedAppendFile.mock.calls[0]
      const storedData = JSON.parse(appendCall[1] as string)
      
      expect(storedData.ipHash).toBeDefined()
      expect(storedData.fingerprintHash).toBeDefined()
      expect(storedData.ipHash).toMatch(/^[a-f0-9]{64}$/)
      expect(storedData.fingerprintHash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('Error Handling', () => {
    it('should handle telemetry failures gracefully', async () => {
      const event: VoiceTelemetryEvent = {
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

      // Get the mocked functions
      const { appendFile } = await import('node:fs/promises')
      const mockedAppendFile = vi.mocked(appendFile)
      
      // Mock fs.appendFile to throw error
      mockedAppendFile.mockRejectedValueOnce(new Error('File system error'))

      // Should not throw error
      await expect(appendTelemetryEvent(event)).resolves.toBeUndefined()
    })
  })
})
