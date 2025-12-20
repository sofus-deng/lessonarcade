import { NextRequest, NextResponse } from "next/server"
import { telemetryRateLimiter } from "@/lib/utils/rate-limiter"
import { VoiceTelemetryEventSchema, appendTelemetryEvent } from "@/lib/lessonarcade/voice/telemetry"

// Configure runtime for Node.js
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = telemetryRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "RATE_LIMIT", 
            message: "Too many telemetry requests. Please try again later.",
            retryAfterSeconds: rateLimitResult.retryAfter 
          } 
        },
        { status: 429 }
      )
    }

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "VALIDATION", 
            message: "Invalid JSON in request body" 
          } 
        },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validationResult = VoiceTelemetryEventSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "VALIDATION", 
            message: "Invalid telemetry event format" 
          } 
        },
        { status: 400 }
      )
    }

    // Append to daily JSONL file (server will add ipHash and fingerprintHash)
    await appendTelemetryEvent(validationResult.data, request)

    // Return success response
    return NextResponse.json({ ok: true })

  } catch (error) {
    // Never expose internal errors or stack traces
    console.error('Telemetry endpoint error:', error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "Internal server error" 
        } 
      },
      { status: 500 }
    )
  }
}