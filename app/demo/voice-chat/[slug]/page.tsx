import { Metadata } from "next"
import { loadLessonBySlug, LessonLoadError } from "@/lib/lessonarcade/loaders"
import { type LessonArcadeLesson, type LanguageCode } from "@/lib/lessonarcade/schema"
import { VoiceChatFlow } from "@/components/lesson/voice-chat-flow"
import { LessonError } from "@/components/lesson/lesson-error"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface VoiceChatPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    displayLanguage?: string
  }>
}

const resolveDisplayLanguage = (value?: string): LanguageCode | undefined => {
  if (value === 'en' || value === 'zh') {
    return value
  }
  return undefined
}

export async function generateMetadata({ params }: VoiceChatPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const lesson = await loadLessonBySlug(slug)

    return {
      title: `${lesson.title} - Voice Chat | LessonArcade`,
      description: `Chat through "${lesson.title}" with guided voice prompts.`,
      keywords: [...lesson.tags, "voice", "chat", "conversation"],
      openGraph: {
        title: `${lesson.title} - Voice Chat`,
        description: `Chat through "${lesson.title}" with guided voice prompts.`,
        type: "article",
      },
    }
  } catch (error) {
    if (error instanceof LessonLoadError) {
      const title = error.code === 'NOT_FOUND'
        ? "Voice Chat Lesson Not Found"
        : "Voice Chat Lesson Unavailable"

      return {
        title: `${title} | LessonArcade`,
        description: error.message,
      }
    }

    return {
      title: "Voice Chat Lesson Unavailable | LessonArcade",
      description: "The requested voice chat lesson could not be loaded.",
    }
  }
}

export default async function VoiceChatPage({ params, searchParams }: VoiceChatPageProps) {
  let lesson: LessonArcadeLesson | null = null
  let error: unknown = null

  try {
    const { slug } = await params
    const searchParamsResolved = await searchParams || {}
    lesson = await loadLessonBySlug(slug)
  } catch (e) {
    error = e
  }

  if (error instanceof LessonLoadError) {
    return <LessonError error={error} />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-la-bg p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
            <h1 className="text-3xl font-bold text-la-bg mb-4">
              Voice Chat Lesson Unavailable
            </h1>
            <p className="text-la-muted mb-6">
              An unexpected error occurred while loading this voice chat lesson.
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

  if (lesson) {
    const displayLanguage = resolveDisplayLanguage(searchParamsResolved?.displayLanguage)
    return (
      <VoiceChatFlow lesson={lesson} initialDisplayLanguage={displayLanguage} />
    )
  }

  return (
    <div className="min-h-screen bg-la-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
          <h1 className="text-3xl font-bold text-la-bg mb-4">
            Voice Chat Lesson Unavailable
          </h1>
          <p className="text-la-muted mb-6">
            The voice chat lesson could not be loaded.
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
