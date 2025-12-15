import { NextRequest, NextResponse } from "next/server"
import { saveUserLesson } from "@/lib/lessonarcade/storage"
import { lessonArcadeLessonSchema } from "@/lib/lessonarcade/schema"
import { publishRateLimiter } from "@/lib/utils/rate-limiter"
import { lessonRegistry } from "@/lib/lessonarcade/loaders"
import { logStudioEvent, Timer, type ErrorCode } from "@/lib/utils/logger"

// Explicitly declare Node.js runtime for filesystem access
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const timer = new Timer()
  let errorCode: ErrorCode = null
  
  try {
    // Check rate limit
    const rateLimitResult = publishRateLimiter.checkLimit(request)
    
    if (!rateLimitResult.allowed) {
      errorCode = "RATE_LIMIT"
      logStudioEvent(
        "studio_publish",
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

    const body = await request.json()
    const { lesson } = body

    // Validate the lesson data
    const validationResult = lessonArcadeLessonSchema.safeParse(lesson)
    
    if (!validationResult.success) {
      errorCode = "VALIDATION"
      const errorMessages = validationResult.error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      ).join('; ')
      
      logStudioEvent(
        "studio_publish",
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
            message: `Invalid lesson data: ${errorMessages}`
          }
        },
        { status: 400 }
      )
    }

    // Check if the slug collides with any demo lesson
    if (lessonRegistry[validationResult.data.slug]) {
      errorCode = "SLUG_COLLISION"
      logStudioEvent(
        "studio_publish",
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
            message: `The slug "${validationResult.data.slug}" is reserved for a demo lesson. Please choose a different slug.`,
            reservedSlug: validationResult.data.slug,
            suggestion: `${validationResult.data.slug}-user`
          }
        },
        { status: 409 } // Conflict status code
      )
    }

    // Save the lesson
    const slug = await saveUserLesson(validationResult.data)

    logStudioEvent(
      "studio_publish",
      request,
      true,
      undefined,
      timer.getElapsed()
    )

    return NextResponse.json({
      ok: true,
      data: {
        slug,
        message: "Lesson published successfully"
      }
    })

  } catch (error) {
    console.error("Error publishing lesson:", error)
    
    logStudioEvent(
      "studio_publish",
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
          code: errorCode || "VALIDATION",
          message: error instanceof Error ? error.message : "Failed to publish lesson"
        }
      },
      { status: 500 }
    )
  }
}