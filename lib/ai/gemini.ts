import "server-only"
import { GoogleGenAI } from "@google/genai"

/**
 * Server-only Gemini AI client initialization
 * This file should never be imported from client components
 */

// Get API key from environment variables
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  // During build time, we don't want to fail the build
  // The actual validation will happen at runtime
  console.warn("GEMINI_API_KEY environment variable is not set. This is required for lesson generation.")
}

// Initialize Gemini client only if API key is available
export const geminiClient = apiKey ? new GoogleGenAI({ apiKey }) : null

/**
 * Generate content using Gemini model
 * @param model - The model name to use (default: gemini-1.5-flash)
 * @param content - The content to generate
 * @param options - Additional options for generation
 */
export async function generateContent(
  model = "gemini-1.5-flash",
  content: string,
  options: {
    temperature?: number
    maxOutputTokens?: number
    responseSchema?: Record<string, unknown>
  } = {}
) {
  if (!geminiClient) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it to use lesson generation.")
  }

  try {
    const response = await geminiClient.models.generateContent({
      model,
      contents: content,
      config: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxOutputTokens || 8192,
        responseSchema: options.responseSchema,
      },
    })
    return response
  } catch (error) {
    console.error("Error generating content with Gemini:", error)
    throw error
  }
}

/**
 * Server-only flag to prevent accidental client-side imports
 */
export const SERVER_ONLY = true