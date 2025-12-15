import { NextRequest, NextResponse } from "next/server"
import { generateLessonDualMode, type LessonGenerationInput } from "@/lib/lessonarcade/generate"
import { generateRateLimiter } from "@/lib/utils/rate-limiter"
import { logStudioEvent, Timer, type ErrorCode } from "@/lib/utils/logger"

// Explicitly declare Node.js runtime for potential filesystem access
export const runtime = "nodejs"

/**
 * API endpoint for lesson generation with rate limiting
 */
export async function POST(request: NextRequest) {
  const timer = new Timer()
  let errorCode: ErrorCode = null
  
  try {
    // Check rate limit
    const rateLimitResult = generateRateLimiter.checkLimit(request)
    
    if (!rateLimitResult.allowed) {
      errorCode = "RATE_LIMIT"
      logStudioEvent(
        "studio_generate",
        request,
        false,
        undefined,
        timer.getElapsed(),
        errorCode
      )
      
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: errorCode,
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: rateLimitResult.retryAfter
          }
        },
        {
          status: 429,
          headers: rateLimitResult.retryAfter
            ? { 'Retry-After': rateLimitResult.retryAfter.toString() }
            : undefined
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const generationInput: LessonGenerationInput = body

    // Validate required fields
    if (!generationInput.youtubeUrl) {
      errorCode = "VALIDATION"
      logStudioEvent(
        "studio_generate",
        request,
        false,
        generationInput.generationMode,
        timer.getElapsed(),
        errorCode
      )
      
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: errorCode,
            message: "YouTube URL is required"
          }
        },
        { status: 400 }
      )
    }

    if (generationInput.generationMode === "accurate" &&
        (!generationInput.transcriptText || generationInput.transcriptText.trim().length === 0)) {
      errorCode = "VALIDATION"
      logStudioEvent(
        "studio_generate",
        request,
        false,
        generationInput.generationMode,
        timer.getElapsed(),
        errorCode
      )
      
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: errorCode,
            message: "Transcript text is required for accurate mode"
          }
        },
        { status: 400 }
      )
    }

    // Generate the lesson
    const lesson = await generateLessonDualMode(generationInput)

    logStudioEvent(
      "studio_generate",
      request,
      true,
      generationInput.generationMode,
      timer.getElapsed()
    )

    return NextResponse.json({
      ok: true,
      data: {
        lesson,
        message: "Lesson generated successfully"
      }
    })

  } catch (error) {
    console.error("Error generating lesson:", error)
    
    // Determine error code based on error message
    if (error instanceof Error) {
      if (error.message.includes("Gemini") || error.message.includes("AI")) {
        errorCode = "GEMINI_ERROR"
      }
    }
    
    logStudioEvent(
      "studio_generate",
      request,
      false,
      undefined,
      timer.getElapsed(),
      errorCode
    )
    
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: errorCode || "GEMINI_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate lesson"
        }
      },
      { status: 500 }
    )
  }
}