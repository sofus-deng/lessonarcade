import { Metadata } from "next"
import { loadLessonBySlug } from "@/lib/lessonarcade/loaders"
import { type LessonArcadeLesson } from "@/lib/lessonarcade/schema"
import { LessonPlayer } from "@/components/lesson/lesson-player"
import { LessonLoadErrorView } from "@/components/lesson/lesson-load-error-view"
import { normalizeLessonLoadError } from "@/lib/lessonarcade/lesson-load-error"

interface LessonPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Pick<LessonPageProps, 'params'>): Promise<Metadata> {
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
    const normalized = normalizeLessonLoadError(error)
    const title = normalized.kind === 'not_found'
      ? "Lesson Not Found"
      : "Lesson Unavailable"
    
    return {
      title: `${title} | LessonArcade`,
      description: normalized.message,
    }
  }
}

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  let lesson: LessonArcadeLesson | null = null
  let loadError: unknown = null
  
  const { slug } = await params
  const { debug } = await searchParams
  
  try {
    lesson = await loadLessonBySlug(slug)
  } catch (e) {
    loadError = e
  }

  if (loadError) {
    const normalizedError = normalizeLessonLoadError(loadError)
    return (
      <div className="min-h-screen bg-la-bg">
        <LessonLoadErrorView 
          error={normalizedError} 
          debug={debug === "1" || debug === "true"} 
        />
      </div>
    )
  }

  if (lesson) {
    return (
      <div className="min-h-screen bg-la-bg">
        <LessonPlayer lesson={lesson} />
      </div>
    )
  }
  
  // Final fallback
  const fallbackError = normalizeLessonLoadError(new Error("The lesson could not be loaded."))
  return (
    <div className="min-h-screen bg-la-bg">
      <LessonLoadErrorView error={fallbackError} />
    </div>
  )
}
