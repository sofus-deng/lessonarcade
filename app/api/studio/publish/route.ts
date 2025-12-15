import { NextRequest, NextResponse } from "next/server"
import { saveUserLesson } from "@/lib/lessonarcade/storage"
import { lessonArcadeLessonSchema } from "@/lib/lessonarcade/schema"
import { publishRateLimiter } from "@/lib/utils/rate-limiter"
import { lessonRegistry } from "@/lib/lessonarcade/loaders"

// Explicitly declare Node.js runtime for filesystem access
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = publishRateLimiter.checkLimit(request)
    
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

    const body = await request.json()
    const { lesson } = body

    // Validate the lesson data
    const validationResult = lessonArcadeLessonSchema.safeParse(lesson)
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('; ')
      
      return NextResponse.json(
        { error: `Invalid lesson data: ${errorMessages}` },
        { status: 400 }
      )
    }

    // Check if the slug collides with any demo lesson
    if (lessonRegistry[validationResult.data.slug]) {
      return NextResponse.json(
        { 
          error: `The slug "${validationResult.data.slug}" is reserved for a demo lesson. Please choose a different slug.`,
          reservedSlug: validationResult.data.slug,
          suggestion: `${validationResult.data.slug}-user`
        },
        { status: 409 } // Conflict status code
      )
    }

    // Save the lesson
    const slug = await saveUserLesson(validationResult.data)

    return NextResponse.json({ 
      success: true, 
      slug,
      message: "Lesson published successfully" 
    })

  } catch (error) {
    console.error("Error publishing lesson:", error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish lesson" },
      { status: 500 }
    )
  }
}