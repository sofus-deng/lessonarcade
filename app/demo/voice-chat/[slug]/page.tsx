import { Metadata } from "next"
import { loadLessonBySlug } from "@/lib/lessonarcade/loaders"
import { type LanguageCode } from "@/lib/lessonarcade/schema"
import { VoiceChatFlow } from "@/components/lesson/voice-chat-flow"
import { LessonLoadErrorView } from "@/components/lesson/lesson-load-error-view"
import { normalizeLessonLoadError } from "@/lib/lessonarcade/lesson-load-error"

interface VoiceChatPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    displayLanguage?: string
    debug?: string
  }>
}

const resolveDisplayLanguage = (value?: string): LanguageCode | undefined => {
  if (value === 'en' || value === 'zh') {
    return value
  }
  return undefined
}

export async function generateMetadata({ params }: Pick<VoiceChatPageProps, 'params'>): Promise<Metadata> {
  const { slug } = await params
  
  try {
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
    const normalized = normalizeLessonLoadError(error)
    const title = normalized.kind === 'not_found'
      ? "Voice Chat Lesson Not Found"
      : "Voice Chat Lesson Unavailable"

    return {
      title: `${title} | LessonArcade`,
      description: normalized.message,
    }
  }
}

export default async function VoiceChatPage({ params, searchParams }: VoiceChatPageProps) {
  const { slug } = await params
  const sp = await searchParams || {}
  
  let lessonData;
  try {
    lessonData = await loadLessonBySlug(slug)
  } catch (error) {
    const normalizedError = normalizeLessonLoadError(error)
    return (
      <div data-testid="la-voice-chat-page" className="min-h-screen bg-la-bg">
        <LessonLoadErrorView 
          error={normalizedError} 
          debug={sp.debug === "1" || sp.debug === "true"} 
        />
      </div>
    )
  }

  const displayLanguage = resolveDisplayLanguage(sp.displayLanguage)
  return (
    <div data-testid="la-voice-chat-page">
      <VoiceChatFlow lesson={lessonData} initialDisplayLanguage={displayLanguage} />
    </div>
  )
}
