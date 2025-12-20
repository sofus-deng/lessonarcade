import { DEFAULT_TTS_MAX_CHARS } from './constants'

/**
 * Chunks text for TTS processing with intelligent splitting
 * 
 * Splitting priority:
 * 1. Sentence boundaries: ".!?" and "。！？"
 * 2. Commas: ", 、 ，"
 * 3. Whitespace
 * 
 * Guarantees:
 * - Each chunk <= maxChars
 * - No empty chunks
 * - Preserves original text content
 * 
 * @param text The text to chunk
 * @param maxChars Maximum characters per chunk (default: DEFAULT_TTS_MAX_CHARS)
 * @returns Array of text chunks
 */
export function chunkTextForTts(text: string, maxChars: number = DEFAULT_TTS_MAX_CHARS): string[] {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    return []
  }
  
  if (maxChars <= 0) {
    throw new Error('maxChars must be a positive number')
  }
  
  // If text is already within limit, return as single chunk
  if (text.length <= maxChars) {
    return [text]
  }
  
  const chunks: string[] = []
  let remainingText = text
  
  while (remainingText.length > 0) {
    // If remaining text fits in one chunk, add it and we're done
    if (remainingText.length <= maxChars) {
      chunks.push(remainingText)
      break
    }
    
    // Try to find the best split point within the limit
    let splitIndex = -1
    const searchEnd = Math.min(maxChars, remainingText.length)
    
    // Priority 1: Look for sentence endings (.!? or 。！？)
    const sentenceEndings = /[.!?。！？]/g
    let match
    while ((match = sentenceEndings.exec(remainingText)) !== null) {
      if (match.index < searchEnd) {
        splitIndex = match.index + 1 // Include the punctuation
      } else {
        break
      }
    }
    
    // Priority 2: Look for commas (, 、 ，)
    if (splitIndex === -1) {
      const commas = /[,, 、，]/g
      sentenceEndings.lastIndex = 0 // Reset regex
      while ((match = commas.exec(remainingText)) !== null) {
        if (match.index < searchEnd) {
          splitIndex = match.index + 1 // Include the comma
        } else {
          break
        }
      }
    }
    
    // Priority 3: Look for whitespace
    if (splitIndex === -1) {
      const whitespace = /\s/g
      sentenceEndings.lastIndex = 0 // Reset regex
      while ((match = whitespace.exec(remainingText)) !== null) {
        if (match.index < searchEnd) {
          splitIndex = match.index + 1 // Include the space
        } else {
          break
        }
      }
    }
    
    // Fallback: Force split at maxChars
    if (splitIndex === -1) {
      splitIndex = maxChars
    }
    
    // Extract the chunk and add it to the array
    const chunk = remainingText.substring(0, splitIndex).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    // Remove the chunk from remaining text
    remainingText = remainingText.substring(splitIndex).trim()
  }
  
  return chunks
}