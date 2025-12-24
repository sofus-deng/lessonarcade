import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock VertexAI module
const mockGenerateContent = vi.fn()
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}))

const mockVertexAIInstance = {
  getGenerativeModel: mockGetGenerativeModel,
}

const VertexAIMock = vi.fn().mockImplementation(() => mockVertexAIInstance)

vi.mock('@google-cloud/vertexai', () => ({
  VertexAI: VertexAIMock,
}))

// Store original environment
const originalEnv = { ...process.env }

describe('Vertex AI Gemini Client', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    // Reset environment to a clean state
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
    }
  })

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv }
  })

  describe('Configuration', () => {
    it('should not be configured when GCP_PROJECT_ID is not set', async () => {
      process.env.GCP_PROJECT_ID = ''
      const { isVertexAIConfigured } = await import('@/lib/ai/gemini-vertex')
      expect(isVertexAIConfigured()).toBe(false)
    })

    it('should be configured when GCP_PROJECT_ID is set', async () => {
      process.env.GCP_PROJECT_ID = 'test-project'
      const { isVertexAIConfigured } = await import('@/lib/ai/gemini-vertex')
      expect(isVertexAIConfigured()).toBe(true)
    })

    it('should return configuration when configured', async () => {
      process.env.GCP_PROJECT_ID = 'test-project'
      process.env.GCP_REGION = 'us-central1'
      process.env.GCP_VERTEX_MODEL = 'gemini-2.0-flash-exp'
      const { getVertexAIConfig } = await import('@/lib/ai/gemini-vertex')
      const config = getVertexAIConfig()
      expect(config).toEqual({
        projectId: 'test-project',
        region: 'us-central1',
        model: 'gemini-2.0-flash-exp',
      })
    })

    it('should use default values for region and model when not set', async () => {
      process.env.GCP_PROJECT_ID = 'test-project'
      const { getVertexAIConfig } = await import('@/lib/ai/gemini-vertex')
      const config = getVertexAIConfig()
      expect(config).toEqual({
        projectId: 'test-project',
        region: 'us-central1',
        model: 'gemini-2.0-flash-exp',
      })
    })
  })

  describe('generateGeminiText', () => {
    beforeEach(() => {
      // Set up environment for Vertex AI
      process.env.GCP_PROJECT_ID = 'test-project'
      process.env.GCP_REGION = 'us-central1'
      process.env.GCP_VERTEX_MODEL = 'gemini-2.0-flash-exp'
    })

    it('should generate text successfully with a single user message', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Hello, how are you?' }
      ]

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'I am doing well, thank you!' }]
              }
            }
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 8,
            totalTokenCount: 18,
          },
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await generateGeminiText({ messages })

      expect(result.text).toBe('I am doing well, thank you!')
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      })
      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    })

    it('should handle system prompt correctly', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'What is 2+2?' }
      ]
      const systemPrompt = 'You are a math tutor.'

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: '2+2 equals 4.' }]
              }
            }
          ],
          usageMetadata: {
            promptTokenCount: 15,
            candidatesTokenCount: 5,
            totalTokenCount: 20,
          },
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await generateGeminiText({ messages, systemPrompt })

      expect(result.text).toBe('2+2 equals 4.')
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: {
            role: 'system',
            parts: [{ text: 'You are a math tutor.' }]
          }
        })
      )
    })

    it('should handle multi-turn conversation', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'What is the capital of France?' },
        { role: 'assistant', content: 'The capital of France is Paris.' },
        { role: 'user', content: 'What about Germany?' }
      ]

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'The capital of Germany is Berlin.' }]
              }
            }
          ],
          usageMetadata: {
            promptTokenCount: 25,
            candidatesTokenCount: 8,
            totalTokenCount: 33,
          },
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await generateGeminiText({ messages })

      expect(result.text).toBe('The capital of Germany is Berlin.')
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [
            { role: 'user', parts: [{ text: 'What is the capital of France?' }] },
            { role: 'model', parts: [{ text: 'The capital of France is Paris.' }] },
            { role: 'user', parts: [{ text: 'What about Germany?' }] },
          ],
        })
      )
    })

    it('should apply custom temperature', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Tell me a joke' }
      ]
      const options = {
        temperature: 0.9,
      }

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Why did the chicken cross the road?' }]
              }
            }
          ],
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await generateGeminiText({ messages, options })

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: {
            temperature: 0.9,
          },
        })
      )
    })

    it('should apply custom maxOutputTokens', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Summarize this article' }
      ]
      const options = {
        maxOutputTokens: 500,
      }

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Article summary...' }]
              }
            }
          ],
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await generateGeminiText({ messages, options })

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: {
            maxOutputTokens: 500,
          },
        })
      )
    })

    it('should use custom model when specified in options', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Hello' }
      ]
      const options = {
        model: 'gemini-1.5-pro',
      }

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Hi there!' }]
              }
            }
          ],
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await generateGeminiText({ messages, options })

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro',
      })
    })

    it('should throw error when messages array is empty', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      await expect(generateGeminiText({ messages: [] })).rejects.toThrow(
        'At least one message is required'
      )
    })

    it('should throw error when messages is undefined', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      await expect(
        generateGeminiText({ messages: undefined })
      ).rejects.toThrow('At least one message is required')
    })

    it('should handle API errors gracefully', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Hello' }
      ]

      const apiError = new Error('API quota exceeded')
      mockGenerateContent.mockRejectedValue(apiError)

      await expect(generateGeminiText({ messages })).rejects.toThrow(apiError)
    })

    it('should handle empty response from API', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Hello' }
      ]

      const mockResponse = {
        response: {
          candidates: [],
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await expect(generateGeminiText({ messages })).rejects.toThrow(
        'No candidates returned from Vertex AI'
      )
    })

    it('should handle missing text in candidate', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Hello' }
      ]

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [],
              },
            },
          ],
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await generateGeminiText({ messages })
      expect(result.text).toBe('')
    })

    it('should handle missing usage metadata', async () => {
      const { generateGeminiText } = await import('@/lib/ai/gemini-vertex')
      const messages = [
        { role: 'user', content: 'Hello' }
      ]

      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Hello!' }]
              }
            }
          ],
          // No usageMetadata
        },
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await generateGeminiText({ messages })
      expect(result.text).toBe('Hello!')
      expect(result.usage).toBeUndefined()
    })
  })

  describe('SERVER_ONLY flag', () => {
    it('should export SERVER_ONLY flag', async () => {
      const { SERVER_ONLY } = await import('@/lib/ai/gemini-vertex')
      expect(SERVER_ONLY).toBe(true)
    })
  })
})
