import { Metadata } from "next"
import { loadLessonBySlug } from "@/lib/lessonarcade/loaders"
import { type LessonArcadeLesson } from "@/lib/lessonarcade/schema"
import { LessonPlayer } from "@/components/lesson/lesson-player"
import Link from "next/link"

interface LessonPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  try {
    const lesson = await loadLessonBySlug(params.slug)
    
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
  } catch {
    return {
      title: "Lesson Not Found | LessonArcade",
      description: "The requested lesson could not be found.",
    }
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  let lesson: LessonArcadeLesson | null = null
  let error: string | null = null
  
  try {
    lesson = await loadLessonBySlug(params.slug)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-la-bg p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
            <h1 className="text-3xl font-bold text-la-surface mb-4">
              Lesson Not Found
            </h1>
            <p className="text-la-muted mb-6">
              {error || "The lesson you're looking for doesn't exist or may have been removed."}
            </p>
            <div className="space-y-4">
              <Link 
                href="/demo"
                className="inline-block bg-la-primary hover:bg-la-primary/90 text-white px-6 py-2 rounded-md transition-colors"
              >
                Browse Demo Lessons
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
  return (
    <div className="min-h-screen bg-la-bg">
      <LessonPlayer lesson={lesson} />
    </div>
  )
}