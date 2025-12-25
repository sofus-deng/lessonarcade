// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock server-only module
vi.mock('server-only', () => ({}))

import { GET } from '@/app/api/get-signed-url/route'

// Store original environment
const originalEnv = { ...process.env }

describe('/api/get-signed-url', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    // Reset environment to a clean state
    process.env = { ...originalEnv, NODE_ENV: 'test' }
  })

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv }
  })

  describe('E2E Mock Mode', () => {
    it('should return mock signed URL when E2E_ELEVENLABS_SIGNED_URL is set', async () => {
      process.env.E2E_ELEVENLABS_SIGNED_URL = 'https://mock-signed-url-e2e-test.com'
      process.env.ELEVENLABS_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_AGENT_ID = 'test-agent-id'

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.signedUrl).toBe('https://mock-signed-url-e2e-test.com')
    })

    it('should return mock signed URL even when env vars are missing', async () => {
      process.env.E2E_ELEVENLABS_SIGNED_URL = 'https://mock-signed-url-e2e-test.com'
      delete process.env.ELEVENLABS_API_KEY
      delete process.env.NEXT_PUBLIC_AGENT_ID

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.signedUrl).toBe('https://mock-signed-url-e2e-test.com')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when ELEVENLABS_API_KEY is missing', async () => {
      delete process.env.E2E_ELEVENLABS_SIGNED_URL
      delete process.env.ELEVENLABS_API_KEY
      process.env.NEXT_PUBLIC_AGENT_ID = 'test-agent-id'

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('CONFIG_ERROR')
      expect(data.error.message).toContain('ELEVENLABS_API_KEY not configured')
    })

    it('should return 500 when NEXT_PUBLIC_AGENT_ID is missing', async () => {
      delete process.env.E2E_ELEVENLABS_SIGNED_URL
      process.env.ELEVENLABS_API_KEY = 'test-api-key'
      delete process.env.NEXT_PUBLIC_AGENT_ID

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('CONFIG_ERROR')
      expect(data.error.message).toContain('NEXT_PUBLIC_AGENT_ID not configured')
    })

    it('should return 500 when ElevenLabs API returns non-200', async () => {
      delete process.env.E2E_ELEVENLABS_SIGNED_URL
      process.env.ELEVENLABS_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_AGENT_ID = 'test-agent-id'

      // Mock fetch to return 401
      vi.stubGlobal('fetch', () =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => Promise.resolve({ error: 'Unauthorized' }),
          headers: new Headers(),
          url: '',
        } as unknown as Response)
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('ELEVENLABS_ERROR')
      expect(data.error.message).toContain('ElevenLabs API error: 401')
    })
  })

  describe('Success Path', () => {
    it('should call ElevenLabs API and return signed URL', async () => {
      delete process.env.E2E_ELEVENLABS_SIGNED_URL
      process.env.ELEVENLABS_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_AGENT_ID = 'test-agent-id'

      // Mock fetch to return successful response
      vi.stubGlobal('fetch', () =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => Promise.resolve({ signed_url: 'https://api.elevenlabs.io/signed-url-123' }),
          headers: new Headers(),
          url: '',
        } as unknown as Response)
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.signedUrl).toBe('https://api.elevenlabs.io/signed-url-123')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.elevenlabs.io/v1/convai/conversation/get-signed-url'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'xi-api-key': 'test-api-key',
          }),
        })
      )
    })
  })
})
