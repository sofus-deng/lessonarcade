import { Metadata } from "next"
import { loadLessonBySlug, LessonLoadError } from "@/lib/lessonarcade/loaders"
import { type LessonArcadeLesson } from "@/lib/lessonarcade/schema"
import { LessonPlayer } from "@/components/lesson/lesson-player"
import { LessonError } from "@/components/lesson/lesson-error"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface LessonPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const lesson = await loadLessonBySlug(slug)
    
    return {
      title: `${lesson.title} | LessonArcade`,
      description: lesson.shortDescription,
      keywords: lesson.tags,
      openGraph: {
        title: lesson.title,
        description: lesson.shortDescription,
        type: "article",
      },
    }
  } catch (error) {
    if (error instanceof LessonLoadError) {
      const title = error.code === 'NOT_FOUND'
        ? "Lesson Not Found"
        : "Lesson Unavailable"
      
      return {
        title: `${title} | LessonArcade`,
        description: error.message,
      }
    }
    
    return {
      title: "Lesson Unavailable | LessonArcade",
      description: "The requested lesson could not be loaded.",
    }
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  let lesson: LessonArcadeLesson | null = null
  let error: unknown = null
  
  try {
    const { slug } = await params
    lesson = await loadLessonBySlug(slug)
  } catch (e) {
    error = e
  }

  // Handle LessonLoadError with friendly UI
  if (error instanceof LessonLoadError) {
    return <LessonError error={error} />
  }

  // Fallback for any other unexpected errors
  if (error) {
    return (
      <div className="min-h-screen bg-la-bg p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
            <h1 className="text-3xl font-bold text-la-bg mb-4">
              Lesson Unavailable
            </h1>
            <p className="text-la-muted mb-6">
              An unexpected error occurred while loading this lesson.
            </p>
            <div className="space-y-4">
              <Link href="/demo">
                <Button>
                  Browse Demo Lessons
                </Button>
              </Link>
              <div className="text-sm text-la-muted">
                or{" "}
                <Link
                  href="/studio"
                  className="text-la-accent hover:text-la-accent/80 underline"
                >
                  create your own lesson
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state - render lesson
  if (lesson) {
    return (
      <div className="min-h-screen bg-la-bg">
        <LessonPlayer lesson={lesson} />
      </div>
    )
  }
  
  // Fallback if lesson is null for some reason
  return (
    <div className="min-h-screen bg-la-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
          <h1 className="text-3xl font-bold text-la-bg mb-4">
            Lesson Unavailable
          </h1>
          <p className="text-la-muted mb-6">
            The lesson could not be loaded.
          </p>
          <div className="space-y-4">
            <Link href="/demo">
              <Button>
                Browse Demo Lessons
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}