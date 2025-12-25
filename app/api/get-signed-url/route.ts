import { NextResponse } from "next/server"

// Explicitly declare Node.js runtime for Cloud Run compatibility
export const runtime = "nodejs"

/**
 * Response body schema for signed URL endpoint
 */
interface GetSignedUrlResponse {
  signedUrl: string
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
 * ElevenLabs API response schema
 */
interface ElevenLabsSignedUrlResponse {
  signed_url: string
}

/**
 * API endpoint for obtaining a signed URL for ElevenLabs Conversational AI
 *
 * This endpoint acts as a server-side proxy to ElevenLabs API, keeping API key
 * secure on the server side. The signed URL is then used by the client to establish
 * a WebRTC connection with the ElevenLabs agent.
 *
 * @route GET /api/get-signed-url
 *
 * @example Success Response (200):
 * ```json
 * {
 *   "signedUrl": "https://api.elevenlabs.io/v1/convai/conversation/signed-url?..."
 * }
 * ```
 *
 * @example Error Response (500):
 * ```json
 * {
 *   "ok": false,
 *   "error": {
 *     "code": "CONFIG_ERROR",
 *     "message": "ELEVENLABS_API_KEY not configured"
 *   }
 * }
 * ```
 */
export async function GET(): Promise<NextResponse<GetSignedUrlResponse | ErrorResponse>> {
  try {
    // Check for E2E mock mode first (for deterministic CI testing)
    const e2eMockUrl = process.env.E2E_ELEVENLABS_SIGNED_URL
    if (e2eMockUrl) {
      return NextResponse.json({ signedUrl: e2eMockUrl })
    }

    // Validate environment variables
    const apiKey = process.env.ELEVENLABS_API_KEY
    const agentId = process.env.NEXT_PUBLIC_AGENT_ID

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CONFIG_ERROR",
            message: "ELEVENLABS_API_KEY not configured. Please set environment variable.",
          },
        },
        { status: 500 }
      )
    }

    if (!agentId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CONFIG_ERROR",
            message: "NEXT_PUBLIC_AGENT_ID not configured. Please set environment variable.",
          },
        },
        { status: 500 }
      )
    }

    // Call ElevenLabs API to get signed URL
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`

    const response = await fetch(elevenLabsUrl, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "ELEVENLABS_ERROR",
            message: `ElevenLabs API error: ${response.status} ${response.statusText}. ${errorText}`,
          },
        },
        { status: 500 }
      )
    }

    const data = (await response.json()) as ElevenLabsSignedUrlResponse

    // Return signed URL to client
    return NextResponse.json({
      signedUrl: data.signed_url,
    })
  } catch (error) {
    console.error("Error in get-signed-url endpoint:", error)

    const errorMessage = error instanceof Error ? error.message : "Internal server error"

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: errorMessage,
        },
      },
      { status: 500 }
    )
  }
}
