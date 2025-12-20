import { describe, it, expect } from 'vitest'
import { chunkTextForTts } from '@/lib/lessonarcade/voice/chunk-text'
import { DEFAULT_TTS_MAX_CHARS } from '@/lib/lessonarcade/voice/constants'

describe('chunkTextForTts', () => {
  it('should return empty array for empty or null input', () => {
    expect(chunkTextForTts('')).toEqual([])
    expect(chunkTextForTts(null as unknown as string)).toEqual([])
    expect(chunkTextForTts(undefined as unknown as string)).toEqual([])
  })

  it('should return single chunk for text within limit', () => {
    const shortText = "This is a short text."
    const result = chunkTextForTts(shortText, 100)
    expect(result).toEqual([shortText])
  })

  it('should throw error for non-positive maxChars', () => {
    expect(() => chunkTextForTts("test", 0)).toThrow('maxChars must be a positive number')
    expect(() => chunkTextForTts("test", -5)).toThrow('maxChars must be a positive number')
  })

  it('should split at sentence boundaries when possible', () => {
    const text = "First sentence. Second sentence! Third sentence? Fourth sentence."
    const result = chunkTextForTts(text, 30)
    
    // Should split at sentence boundaries
    expect(result.length).toBeGreaterThan(1)
    
    // Each chunk should end with sentence punctuation when possible
    const firstChunkEnds = result[0].slice(-1)
    expect(['.', '!', '?']).toContain(firstChunkEnds)
    
    // No chunk should exceed limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(30)
    })
  })

  it('should split at Chinese sentence boundaries when possible', () => {
    const text = "第一句话。第二句话！第三句话？第四句话。"
    const result = chunkTextForTts(text, 15)
    
    // Should split at Chinese sentence boundaries
    expect(result.length).toBeGreaterThan(1)
    
    // Each chunk should end with Chinese sentence punctuation when possible
    const firstChunkEnds = result[0].slice(-1)
    expect(['。', '！', '？']).toContain(firstChunkEnds)
    
    // No chunk should exceed limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(15)
    })
  })

  it('should split at commas when sentence boundaries not available', () => {
    const text = "First part, second part, third part, fourth part"
    const result = chunkTextForTts(text, 15)
    
    // Should split at commas
    expect(result.length).toBeGreaterThan(1)
    
    // No chunk should exceed limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(15)
    })
  })

  it('should split at Chinese commas when sentence boundaries not available', () => {
    const text = "第一部分、第二部分、第三部分、第四部分"
    const result = chunkTextForTts(text, 12)
    
    // Should split at Chinese commas
    expect(result.length).toBeGreaterThan(1)
    
    // No chunk should exceed limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(12)
    })
  })

  it('should split at whitespace as last resort', () => {
    const text = "FirstPart SecondPart ThirdPart FourthPart"
    const result = chunkTextForTts(text, 12)
    
    // Should split at whitespace
    expect(result.length).toBeGreaterThan(1)
    
    // No chunk should exceed limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(12)
    })
  })

  it('should force split at maxChars when no boundaries available', () => {
    const text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const result = chunkTextForTts(text, 10)
    
    expect(result).toEqual([
      "ABCDEFGHIJ",
      "KLMNOPQRST",
      "UVWXYZ"
    ])
  })

  it('should never produce empty chunks', () => {
    const text = "Test text."
    const result = chunkTextForTts(text, 5)
    
    result.forEach(chunk => {
      expect(chunk.trim().length).toBeGreaterThan(0)
    })
  })

  it('should preserve original text content when recombined', () => {
    const text = "First sentence. Second sentence! Third sentence?"
    const result = chunkTextForTts(text, 20)
    const combined = result.join(' ').replace(/\s+/g, ' ')
    
    // Remove extra spaces and normalize
    const normalizedOriginal = text.replace(/\s+/g, ' ')
    expect(combined).toBe(normalizedOriginal)
  })

  it('should use default maxChars when not specified', () => {
    const text = "A".repeat(DEFAULT_TTS_MAX_CHARS + 100)
    const result = chunkTextForTts(text)
    
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(DEFAULT_TTS_MAX_CHARS)
    })
  })

  it('should handle mixed punctuation correctly', () => {
    const text = "First sentence. Second part, third sentence! Fourth part; fifth sentence?"
    const result = chunkTextForTts(text, 25)
    
    // Should prefer sentence boundaries over commas
    expect(result.length).toBeGreaterThan(1)
    
    // No chunk should exceed limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(25)
    })
  })

  it('should handle very long text efficiently', () => {
    // Create a long text with sentences
    const sentences = Array(100).fill("This is a test sentence. ")
    const longText = sentences.join('')
    
    const result = chunkTextForTts(longText, 200)
    
    // Should produce multiple chunks
    expect(result.length).toBeGreaterThan(1)
    
    // No chunk should exceed limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(200)
    })
    
    // Should not produce empty chunks
    expect(result.every(chunk => chunk.trim().length > 0)).toBe(true)
  })
})