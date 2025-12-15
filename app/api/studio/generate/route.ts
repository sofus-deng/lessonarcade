import { NextRequest, NextResponse } from "next/server"
import { generateLessonDualMode, type LessonGenerationInput } from "@/lib/lessonarcade/generate"
import { generateRateLimiter } from "@/lib/utils/rate-limiter"

// Explicitly declare Node.js runtime for potential filesystem access
export const runtime = "nodejs"

/**
 * API endpoint for lesson generation with rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = generateRateLimiter.checkLimit(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
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
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      )
    }

    if (generationInput.generationMode === "accurate" && 
        (!generationInput.transcriptText || generationInput.transcriptText.trim().length === 0)) {
      return NextResponse.json(
        { error: "Transcript text is required for accurate mode" },
        { status: 400 }
      )
    }

    // Generate the lesson
    const lesson = await generateLessonDualMode(generationInput)

    return NextResponse.json({ 
      success: true, 
      lesson,
      message: "Lesson generated successfully" 
    })

  } catch (error) {
    console.error("Error generating lesson:", error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to generate lesson"
      },
      { status: 500 }
    )
  }
}