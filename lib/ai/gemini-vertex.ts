import { VertexAI } from "@google-cloud/vertexai"

/**
 * Server-only Vertex AI Gemini client initialization
 * This file should never be imported from client components
 */

/**
 * Environment variable validation
 * Validates that required Vertex AI environment variables are set
 * @throws Error if required environment variables are missing
 */
function validateVertexAIConfig(): void {
  const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID
  if (!GCP_PROJECT_ID) {
    throw new Error(
      "GCP_PROJECT_ID environment variable is not set. " +
      "Please configure it to use Vertex AI. " +
      "For local development, you may use GEMINI_API_KEY instead."
    )
  }
}

/**
 * Get the Vertex AI client (lazy initialization)
 * This allows tests to modify environment variables and pick up changes
 */
function getVertexAI(): VertexAI | null {
  try {
    validateVertexAIConfig()
    const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID!
    const GCP_REGION = process.env.GCP_REGION || "us-central1"
    return new VertexAI({
      project: GCP_PROJECT_ID,
      location: GCP_REGION,
    })
  } catch (error) {
    // Only log during module initialization if not in test mode
    if (process.env.NODE_ENV !== "test") {
      console.warn("Vertex AI client not initialized:", error instanceof Error ? error.message : String(error))
    }
    return null
  }
}

/**
 * Message role types supported by the Vertex AI API
 */
export type MessageRole = "system" | "user" | "assistant"

/**
 * Message structure for Vertex AI API
 */
export interface Message {
  role: MessageRole
  content: string
}

/**
 * Options for text generation
 */
export interface GenerateGeminiTextOptions {
  /** The model to use (default: gemini-2.0-flash-exp) */
  model?: string
  /** Temperature for generation (0.0 to 1.0, default: 0.7) */
  temperature?: number
  /** Maximum number of output tokens (default: 8192) */
  maxOutputTokens?: number
}

/**
 * Usage metadata from the generation response
 */
export interface UsageMetadata {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/**
 * Result from text generation
 */
export interface GenerateGeminiTextResult {
  /** The generated text */
  text: string
  /** Usage metadata if available */
  usage?: UsageMetadata
}

/**
 * Generate text using Vertex AI Gemini API
 *
 * This function uses Application Default Credentials (ADC) for authentication,
 * which is the recommended pattern for Cloud Run deployments.
 *
 * @param params - Parameters for generation
 * @param params.messages - Array of messages with role and content
 * @param params.systemPrompt - Optional system prompt to guide the model
 * @param params.options - Optional generation options
 * @returns Generated text with optional usage metadata
 * @throws Error if Vertex AI client is not configured or API call fails
 *
 * @example
 * ```ts
 * const result = await generateGeminiText({
 *   messages: [
 *     { role: "user", content: "What is the capital of France?" }
 *   ],
 *   systemPrompt: "You are a helpful assistant.",
 *   options: { temperature: 0.5 }
 * })
 * console.log(result.text)
 * ```
 */
export async function generateGeminiText({
  messages,
  systemPrompt,
  options = {},
}: {
  messages: Message[]
  systemPrompt?: string
  options?: GenerateGeminiTextOptions
}): Promise<GenerateGeminiTextResult> {
  // Get the Vertex AI client (lazy initialization)
  const vertexAI = getVertexAI()

  // Validate configuration
  if (!vertexAI) {
    validateVertexAIConfig()
    throw new Error(
      "Vertex AI client is not configured. " +
      "Ensure GCP_PROJECT_ID environment variable is set."
    )
  }

  // Validate input
  if (!messages || messages.length === 0) {
    throw new Error("At least one message is required")
  }

  // Get the generative model
  const GCP_VERTEX_MODEL = process.env.GCP_VERTEX_MODEL || "gemini-2.0-flash-exp"
  const model = vertexAI.getGenerativeModel({
    model: options.model || GCP_VERTEX_MODEL,
  })

  // Build the content array from messages
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : msg.role,
    parts: [{ text: msg.content }],
  }))

  // Build generation config
  const generationConfig: Record<string, unknown> = {}
  if (options.temperature !== undefined) {
    generationConfig.temperature = options.temperature
  }
  if (options.maxOutputTokens !== undefined) {
    generationConfig.maxOutputTokens = options.maxOutputTokens
  }

  // Build system instruction if provided
  const systemInstruction = systemPrompt ? {
    role: "system",
    parts: [{ text: systemPrompt }],
  } : undefined

  try {
    // Generate content
    const response = await model.generateContent({
      contents,
      generationConfig,
      systemInstruction,
    })

    // Extract the generated text
    const candidates = response.response.candidates
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Vertex AI")
    }

    const text = candidates[0].content?.parts?.[0]?.text || ""

    // Extract usage metadata if available
    const usageMetadata = response.response.usageMetadata
    const usage: UsageMetadata | undefined = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount || 0,
      completionTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : undefined

    return { text, usage }
  } catch (error) {
    console.error("Error generating text with Vertex AI:", error)
    throw error
  }
}

/**
 * Check if Vertex AI is properly configured
 * @returns true if Vertex AI client can be initialized
 */
export function isVertexAIConfigured(): boolean {
  const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID
  return !!GCP_PROJECT_ID
}

/**
 * Get the current Vertex AI configuration (for debugging/logging)
 * @returns Configuration object or null if not configured
 */
export function getVertexAIConfig(): {
  projectId: string
  region: string
  model: string
} | null {
  const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID
  if (!GCP_PROJECT_ID) {
    return null
  }
  return {
    projectId: GCP_PROJECT_ID,
    region: process.env.GCP_REGION || "us-central1",
    model: process.env.GCP_VERTEX_MODEL || "gemini-2.0-flash-exp",
  }
}
