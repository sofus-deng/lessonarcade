"use client"

import { ElevenLabsConversation } from "@/components/agents/elevenlabs-conversation"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface LessonContext {
  id: string
  title: string
  summary: string
  keyPoints: string[]
  suggestedQuestions: string[]
}

interface LessonContextResponse {
  ok: true
  lesson: LessonContext
}

interface ErrorResponse {
  ok: false
  error: {
    code: string
    message: string
  }
}

function AgentsPageContent() {
  const searchParams = useSearchParams()
  const lessonSlug = searchParams.get("lesson")

  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonSlug) {
      setLessonContext(null)
      setError(null)
      return
    }

    const fetchLessonContext = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/lessons/context?lesson=${encodeURIComponent(lessonSlug)}`)
        const data = (await response.json()) as LessonContextResponse | ErrorResponse

        if (data.ok) {
          setLessonContext(data.lesson)
        } else {
          setError(data.error.message)
        }
      } catch {
        setError("Failed to load lesson context")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLessonContext()
  }, [lessonSlug])

  const handleRetry = () => {
    if (lessonSlug) {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-la-bg" data-testid="la-agents-page">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-la-surface mb-2">
            Voice Conversation with AI Agent
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Have a natural voice conversation with an AI agent. Click the button below to start.
            Please note that microphone permission is required for this feature to work.
          </p>
        </div>

        {lessonContext && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6" data-testid="la-lesson-context-panel">
            <h2 className="text-xl font-semibold text-blue-900 mb-2" data-testid="la-lesson-context-title">
              Talking about: {lessonContext.title}
            </h2>
            <p className="text-blue-800 mb-4" data-testid="la-lesson-context-summary">{lessonContext.summary}</p>

            <div className="mb-4">
              <h3 className="font-medium text-blue-900 mb-2" data-testid="la-lesson-context-key-points-heading">Key Points:</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                {lessonContext.keyPoints.slice(0, 5).map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-blue-900 mb-2" data-testid="la-lesson-context-suggested-questions-heading">Suggested Questions:</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                {lessonContext.suggestedQuestions.slice(0, 5).map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {isLoading && lessonSlug && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6" data-testid="la-lesson-context-loading">
            <p className="text-gray-600">Loading lesson context...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6" data-testid="la-lesson-context-error">
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <ElevenLabsConversation lessonContext={lessonContext} />
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Click {`Start Conversation`} to begin</li>
            <li>Grant microphone permission when prompted</li>
            <li>Speak naturally with AI agent</li>
            <li>Click {`Stop Conversation`} to end</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-la-bg" data-testid="la-agents-page-loading">Loading...</div>}>
      <AgentsPageContent />
    </Suspense>
  )
}
