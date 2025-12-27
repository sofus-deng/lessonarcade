/**
 * Embeddable Lesson Page
 *
 * This page provides an embeddable version of LessonArcade lesson player
 * that can be embedded in an iframe on external websites or LMS platforms.
 *
 * For Phase 3, only the "demo" workspace is supported.
 */

import { Metadata } from "next"
import { loadLessonBySlug } from "@/lib/lessonarcade/loaders"
import { type LessonArcadeLesson } from "@/lib/lessonarcade/schema"
import { LessonPlayer } from "@/components/lesson/lesson-player"
import { normalizeLessonLoadError } from "@/lib/lessonarcade/lesson-load-error"

interface EmbedLessonPageProps {
  params: Promise<{
    workspaceSlug: string
    lessonSlug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Pick<EmbedLessonPageProps, 'params'>): Promise<Metadata> {
  try {
    const { workspaceSlug, lessonSlug } = await params

    // Only support demo workspace in Phase 3
    if (workspaceSlug !== "demo") {
      return {
        title: "Workspace Not Available | LessonArcade",
        description: "This workspace is not available for embedding.",
      }
    }

    const lesson = await loadLessonBySlug(lessonSlug)

    return {
      title: `${lesson.title} | LessonArcade`,
      description: lesson.shortDescription,
      keywords: lesson.tags,
    }
  } catch {
    return {
      title: "Lesson Not Found | LessonArcade",
      description: "The lesson you're looking for doesn't exist.",
    }
  }
}

export default async function EmbedLessonPage({ params, searchParams }: EmbedLessonPageProps) {
  const { workspaceSlug, lessonSlug } = await params
  const { debug } = await searchParams

  // Validate workspaceSlug - only "demo" is supported in Phase 3
  if (workspaceSlug !== "demo") {
    return (
      <div
        data-testid="la-embed-lesson-page"
        className="h-full min-h-screen bg-la-bg flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full bg-la-surface rounded-lg border border-la-border p-6 text-center">
          <h1 className="text-xl font-bold text-la-bg mb-2">Workspace Not Available</h1>
          <p className="text-la-muted text-sm">
            {"This workspace is not available for embedding. In Phase 3, only the \"demo\" workspace is supported."}
          </p>
        </div>
      </div>
    )
  }

  let lesson: LessonArcadeLesson | null = null
  let loadError: unknown = null

  try {
    lesson = await loadLessonBySlug(lessonSlug)
  } catch (e) {
    loadError = e
  }

  if (loadError) {
    const normalizedError = normalizeLessonLoadError(loadError)
    return (
      <div
        data-testid="la-embed-lesson-page"
        className="h-full min-h-screen bg-la-bg flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full bg-la-surface rounded-lg border border-la-border p-6 text-center">
          <h1 className="text-xl font-bold text-la-bg mb-2">Lesson Not Found</h1>
          <p className="text-la-muted text-sm mb-4">
            {normalizedError.kind === 'not_found'
              ? `The lesson "${lessonSlug}" could not be found.`
              : normalizedError.message}
          </p>
          {debug === "1" || debug === "true" ? (
            <div className="text-left">
              <div className="text-xs font-semibold text-la-muted uppercase tracking-wider mb-2">
                Debug Information
              </div>
              <div className="bg-la-bg/5 rounded-lg p-3 border border-la-border/50">
                <div className="text-xs font-mono text-la-muted break-all">
                  <div><span className="text-la-accent font-semibold">Kind:</span> {normalizedError.kind}</div>
                  {normalizedError.slug && <div><span className="text-la-accent font-semibold">Slug:</span> {normalizedError.slug}</div>}
                  <div><span className="text-la-accent font-semibold">Message:</span> {normalizedError.message}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  if (lesson) {
    return (
      <div
        data-testid="la-embed-lesson-page"
        className="h-full min-h-screen bg-la-bg"
      >
        <main className="h-full">
          <LessonPlayer lesson={lesson} />
        </main>
      </div>
    )
  }

  // Final fallback
  const fallbackError = normalizeLessonLoadError(new Error("The lesson could not be loaded."))
  return (
    <div
      data-testid="la-embed-lesson-page"
      className="h-full min-h-screen bg-la-bg flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full bg-la-surface rounded-lg border border-la-border p-6 text-center">
        <h1 className="text-xl font-bold text-la-bg mb-2">Lesson Not Available</h1>
        <p className="text-la-muted text-sm">
          {fallbackError.message}
        </p>
      </div>
    </div>
  )
}
