import { NextRequest, NextResponse } from "next/server"
import {
  generateGeminiText,
  type Message,
  type GenerateGeminiTextOptions,
  isVertexAIConfigured,
} from "@/lib/ai/gemini-vertex"

// Explicitly declare Node.js runtime for Cloud Run compatibility
export const runtime = "nodejs"

/**
 * Request body schema for the Vertex AI Gemini API endpoint
 */
interface GenerateGeminiRequest {
  /** Array of messages with role and content */
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  /** Optional generation options */
  options?: {
    model?: string
    temperature?: number
    maxOutputTokens?: number
  }
}

/**
 * Response body schema for the Vertex AI Gemini API endpoint
 */
interface GenerateGeminiResponse {
  /** The generated text */
  text: string
  /** Usage metadata if available */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Error response schema
 */
interface ErrorResponse {
  ok: false
  error: {
    code: string
    message: string
  }
}

/**
 * API endpoint for generating text using Vertex AI Gemini
 *
 * This endpoint provides a production-grade interface to Vertex AI's Gemini models
 * using Application Default Credentials (ADC) for authentication, which is the
 * recommended pattern for Cloud Run deployments.
 *
 * @route POST /api/ai/gemini
 *
 * @example Request:
 * ```json
 * {
 *   "messages": [
 *     { "role": "system", "content": "You are a helpful assistant." },
 *     { "role": "user", "content": "What is the capital of France?" }
 *   ],
 *   "options": {
 *     "temperature": 0.5,
 *     "maxOutputTokens": 1000
 *   }
 * }
 * ```
 *
 * @example Success Response (200):
 * ```json
 * {
 *   "text": "The capital of France is Paris.",
 *   "usage": {
 *     "promptTokens": 15,
 *     "completionTokens": 8,
 *     "totalTokens": 23
 *   }
 * }
 * ```
 *
 * @example Error Response (400):
 * ```json
 * {
 *   "ok": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "At least one message is required"
 *   }
 * }
 * ```
 *
 * @example Error Response (500):
 * ```json
 * {
 *   "ok": false,
 *   "error": {
 *     "code": "VERTEX_AI_ERROR",
 *     "message": "GCP_PROJECT_ID environment variable is not set"
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateGeminiResponse | ErrorResponse>> {
  try {
    // Check if Vertex AI is configured
    if (!isVertexAIConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message:
              "Vertex AI is not configured. " +
              "Please set GCP_PROJECT_ID environment variable. " +
              "For local development, you may use the developer API key instead.",
          },
        },
        { status: 503 }
      )
    }

    // Parse request body
    const body: GenerateGeminiRequest = await request.json()

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "At least one message is required",
          },
        },
        { status: 400 }
      )
    }

    // Validate message structure
    for (const msg of body.messages) {
      if (!msg.role || typeof msg.role !== "string") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Each message must have a valid role (system, user, or assistant)",
            },
          },
          { status: 400 }
        )
      }
      if (!msg.content || typeof msg.content !== "string") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Each message must have a valid content string",
            },
          },
          { status: 400 }
        )
      }
    }

    // Extract system prompt if present
    const systemMessage = body.messages.find((msg) => msg.role === "system")
    const systemPrompt = systemMessage?.content
    const conversationMessages = body.messages.filter((msg) => msg.role !== "system")

    // Convert to internal format
    const messages: Message[] = conversationMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Build options
    const options: GenerateGeminiTextOptions = {}
    if (body.options?.model) {
      options.model = body.options.model
    }
    if (body.options?.temperature !== undefined) {
      options.temperature = body.options.temperature
    }
    if (body.options?.maxOutputTokens !== undefined) {
      options.maxOutputTokens = body.options.maxOutputTokens
    }

    // Generate text using Vertex AI
    const result = await generateGeminiText({
      messages,
      systemPrompt,
      options,
    })

    // Return success response
    return NextResponse.json({
      text: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("Error in Vertex AI Gemini API endpoint:", error)

    // Determine error code based on error message
    let errorCode = "VERTEX_AI_ERROR"
    let errorMessage = "Failed to generate text"

    if (error instanceof Error) {
      if (error.message.includes("GCP_PROJECT_ID")) {
        errorCode = "CONFIGURATION_ERROR"
        errorMessage = error.message
      } else if (error.message.includes("At least one message")) {
        errorCode = "VALIDATION_ERROR"
        errorMessage = error.message
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if Vertex AI is configured
 *
 * @route GET /api/ai/gemini
 *
 * @example Success Response (200):
 * ```json
 * {
 *   "configured": true,
 *   "config": {
 *     "projectId": "my-project",
 *     "region": "us-central1",
 *     "model": "gemini-2.0-flash-exp"
 *   }
 * }
 * ```
 *
 * @example Not Configured Response (200):
 * ```json
 * {
 *   "configured": false,
 *   "config": null
 * }
 * ```
 */
export async function GET(): Promise<NextResponse> {
  const configured = isVertexAIConfigured()
  const config = configured
    ? {
        projectId: process.env.GCP_PROJECT_ID,
        region: process.env.GCP_REGION || "us-central1",
        model: process.env.GCP_VERTEX_MODEL || "gemini-2.0-flash-exp",
      }
    : null

  return NextResponse.json({
    configured,
    config,
  })
}
