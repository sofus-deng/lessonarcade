import { NextResponse } from "next/server"
import { loadLessonBySlug } from "@/lib/lessonarcade/loaders"

export const runtime = "nodejs"

interface LessonContextResponse {
  ok: true
  lesson: {
    id: string
    title: string
    summary: string
    keyPoints: string[]
    suggestedQuestions: string[]
  }
}

interface ErrorResponse {
  ok: false
  error: {
    code: "NOT_FOUND" | "VALIDATION" | "INTERNAL_ERROR"
    message: string
  }
}

/**
 * Shape-based type guard for LessonLoadError.
 * Checks if the error has the expected structure without using instanceof.
 */
function isLessonLoadError(error: unknown): error is {
  code: 'NOT_FOUND' | 'VALIDATION' | 'VERSION_MISMATCH' | 'LOAD_FAILED'
  message: string
  debug: {
    slug: string
    source: 'demo' | 'user'
    issues?: string[]
  }
  name: string
} {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const err = error as Record<string, unknown>

  return (
    typeof err.code === 'string' &&
    ['NOT_FOUND', 'VALIDATION', 'VERSION_MISMATCH', 'LOAD_FAILED'].includes(err.code) &&
    typeof err.message === 'string' &&
    typeof err.debug === 'object' &&
    err.debug !== null &&
    typeof (err.debug as Record<string, unknown>).slug === 'string' &&
    typeof (err.debug as Record<string, unknown>).source === 'string' &&
    ['demo', 'user'].includes((err.debug as Record<string, unknown>).source as 'demo' | 'user')
  )
}

export async function GET(
  request: Request
): Promise<NextResponse<LessonContextResponse | ErrorResponse>> {
  const { searchParams } = new URL(request.url)
  const lessonSlug = searchParams.get("lesson")

  if (!lessonSlug) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION",
          message: "Missing 'lesson' query parameter",
        },
      },
      { status: 400 }
    )
  }

  try {
    const lesson = await loadLessonBySlug(lessonSlug)

    const keyPoints = lesson.levels.flatMap((level) => level.keyPoints)

    const suggestedQuestions = [
      `Can you explain the main concepts from ${lesson.title}?`,
      `What are the key takeaways from this lesson?`,
      `How can I apply what I learned in ${lesson.title} to real situations?`,
      `What should I focus on when studying ${lesson.title}?`,
    ]

    return NextResponse.json({
      ok: true,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        summary: lesson.longDescription || lesson.shortDescription,
        keyPoints,
        suggestedQuestions,
      },
    })
  } catch (error) {
    if (isLessonLoadError(error)) {
      if (error.code === "NOT_FOUND") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "Lesson not found",
            },
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load lesson context",
        },
      },
      { status: 500 }
    )
  }
}
