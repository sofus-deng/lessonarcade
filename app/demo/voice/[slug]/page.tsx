import { Metadata } from "next"
import { loadLessonBySlug, LessonLoadError } from "@/lib/lessonarcade/loaders"
import { type LessonArcadeLesson } from "@/lib/lessonarcade/schema"
import { VoiceLessonPlayer } from "@/components/lesson/voice-lesson-player"
import { LessonError } from "@/components/lesson/lesson-error"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface VoiceLessonPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: VoiceLessonPageProps): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const lesson = await loadLessonBySlug(slug)
    
    return {
      title: `${lesson.title} - Voice Mode | LessonArcade`,
      description: `Experience "${lesson.title}" with voice narration for an immersive learning experience.`,
      keywords: [...lesson.tags, "voice", "audio", "tts"],
      openGraph: {
        title: `${lesson.title} - Voice Mode`,
        description: `Experience "${lesson.title}" with voice narration for an immersive learning experience.`,
        type: "article",
      },
    }
  } catch (error) {
    if (error instanceof LessonLoadError) {
      const title = error.code === 'NOT_FOUND'
        ? "Voice Lesson Not Found"
        : "Voice Lesson Unavailable"
      
      return {
        title: `${title} | LessonArcade`,
        description: error.message,
      }
    }
    
    return {
      title: "Voice Lesson Unavailable | LessonArcade",
      description: "The requested voice lesson could not be loaded.",
    }
  }
}

export default async function VoiceLessonPage({ params }: VoiceLessonPageProps) {
  const { slug } = await params
  let lesson: LessonArcadeLesson | null = null
  let error: unknown = null
  
  try {
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
      <div data-testid="la-voice-page" className="min-h-screen bg-la-bg p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
            <h1 className="text-3xl font-bold text-la-bg mb-4">
              Voice Lesson Unavailable
            </h1>
            <p className="text-la-muted mb-6">
              An unexpected error occurred while loading this voice lesson.
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

  // Success state - render voice lesson
  if (lesson) {
    return (
      <div data-testid="la-voice-page" className="min-h-screen bg-la-bg">
        <VoiceLessonPlayer lesson={lesson} />
      </div>
    )
  }
  
  // Fallback if lesson is null for some reason
  return (
    <div data-testid="la-voice-page" className="min-h-screen bg-la-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
          <h1 className="text-3xl font-bold text-la-bg mb-4">
            Voice Lesson Unavailable
          </h1>
          <p className="text-la-muted mb-6">
            The voice lesson could not be loaded.
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