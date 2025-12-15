"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { generateLessonDualMode, type GenerationMode } from "@/lib/lessonarcade/generate"
import { type LessonArcadeLesson } from "@/lib/lessonarcade/schema"
import { LessonPlayer } from "@/components/lesson/lesson-player"

interface FormData {
  youtubeUrl: string
  generationMode: GenerationMode
  transcriptText: string
  language: string
  desiredLevelCount: number
  desiredItemsPerLevel: number
}

interface FormState {
  data: FormData
  isGenerating: boolean
  generatedLesson: LessonArcadeLesson | null
  error: string | null
  publishedSlug: string | null
}

export function LessonStudioForm() {
  const [formState, setFormState] = useState<FormState>({
    data: {
      youtubeUrl: "",
      generationMode: "quick",
      transcriptText: "",
      language: "en",
      desiredLevelCount: 3,
      desiredItemsPerLevel: 4,
    },
    isGenerating: false,
    generatedLesson: null,
    error: null,
    publishedSlug: null,
  })

  const updateFormData = (field: keyof FormData, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }))
  }

  const handleGenerate = async () => {
    if (!formState.data.youtubeUrl.trim()) {
      setFormState(prev => ({ ...prev, error: "YouTube URL is required" }))
      return
    }

    if (formState.data.generationMode === "accurate" && !formState.data.transcriptText.trim()) {
      setFormState(prev => ({ ...prev, error: "Transcript text is required for Accurate mode" }))
      return
    }

    setFormState(prev => ({ ...prev, isGenerating: true, error: null, generatedLesson: null }))

    try {
      const lesson = await generateLessonDualMode({
        youtubeUrl: formState.data.youtubeUrl,
        generationMode: formState.data.generationMode,
        transcriptText: formState.data.transcriptText || undefined,
        language: formState.data.language,
        desiredLevelCount: formState.data.desiredLevelCount,
        desiredItemsPerLevel: formState.data.desiredItemsPerLevel,
      })

      setFormState(prev => ({ ...prev, generatedLesson: lesson, isGenerating: false }))
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to generate lesson",
        isGenerating: false
      }))
    }
  }

  const handlePublish = async () => {
    if (!formState.generatedLesson) return

    try {
      const response = await fetch("/api/studio/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson: formState.generatedLesson
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to publish lesson")
      }

      const result = await response.json()
      setFormState(prev => ({ ...prev, publishedSlug: result.slug }))
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to publish lesson"
      }))
    }
  }

  const resetForm = () => {
    setFormState({
      data: {
        youtubeUrl: "",
        generationMode: "quick",
        transcriptText: "",
        language: "en",
        desiredLevelCount: 3,
        desiredItemsPerLevel: 4,
      },
      isGenerating: false,
      generatedLesson: null,
      error: null,
      publishedSlug: null,
    })
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      <AnimatePresence>
        {formState.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg"
          >
            {formState.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Display */}
      <AnimatePresence>
        {formState.publishedSlug && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Lesson Published Successfully!</h3>
                <p className="text-sm mt-1">
                  Your lesson is now available at{" "}
                  <a 
                    href={`/demo/lesson/${formState.publishedSlug}`}
                    className="underline hover:text-green-900"
                  >
                    /demo/lesson/{formState.publishedSlug}
                  </a>
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetForm}
                className="ml-4"
              >
                Create New Lesson
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Form */}
      {!formState.generatedLesson && (
        <div className="space-y-6">
          {/* YouTube URL */}
          <div>
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-la-surface mb-2">
              YouTube URL *
            </label>
            <Input
              id="youtubeUrl"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formState.data.youtubeUrl}
              onChange={(e) => updateFormData("youtubeUrl", e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-la-muted mt-1">
              Enter a YouTube video URL to create a lesson from
            </p>
          </div>

          {/* Generation Mode */}
          <div>
            <label className="block text-sm font-medium text-la-surface mb-2">
              Generation Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="generationMode"
                  value="quick"
                  checked={formState.data.generationMode === "quick"}
                  onChange={(e) => updateFormData("generationMode", e.target.value as GenerationMode)}
                  className="text-la-primary"
                />
                <div>
                  <span className="font-medium">Quick Mode</span>
                  <p className="text-xs text-la-muted">Generate from video metadata only</p>
                </div>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="generationMode"
                  value="accurate"
                  checked={formState.data.generationMode === "accurate"}
                  onChange={(e) => updateFormData("generationMode", e.target.value as GenerationMode)}
                  className="text-la-primary"
                />
                <div>
                  <span className="font-medium">Accurate Mode</span>
                  <p className="text-xs text-la-muted">Generate from video transcript</p>
                </div>
              </label>
            </div>
          </div>

          {/* Transcript Text (Conditional) */}
          {formState.data.generationMode === "accurate" && (
            <div>
              <label htmlFor="transcriptText" className="block text-sm font-medium text-la-surface mb-2">
                Transcript Text *
              </label>
              <Textarea
                id="transcriptText"
                placeholder="Paste the video transcript here..."
                value={formState.data.transcriptText}
                onChange={(e) => updateFormData("transcriptText", e.target.value)}
                rows={8}
                className="w-full"
              />
              <p className="text-xs text-la-muted mt-1">
                Paste the full transcript of the video for accurate lesson generation
              </p>
            </div>
          )}

          {/* Advanced Options */}
          <details className="border border-la-border rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-la-surface">
              Advanced Options
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="desiredLevelCount" className="block text-sm font-medium text-la-surface mb-2">
                    Number of Levels
                  </label>
                  <Input
                    id="desiredLevelCount"
                    type="number"
                    min="1"
                    max="10"
                    value={formState.data.desiredLevelCount}
                    onChange={(e) => updateFormData("desiredLevelCount", parseInt(e.target.value) || 3)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="desiredItemsPerLevel" className="block text-sm font-medium text-la-surface mb-2">
                    Items per Level
                  </label>
                  <Input
                    id="desiredItemsPerLevel"
                    type="number"
                    min="1"
                    max="10"
                    value={formState.data.desiredItemsPerLevel}
                    onChange={(e) => updateFormData("desiredItemsPerLevel", parseInt(e.target.value) || 4)}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-la-surface mb-2">
                  Language
                </label>
                <select
                  id="language"
                  value={formState.data.language}
                  onChange={(e) => updateFormData("language", e.target.value)}
                  className="w-full px-3 py-2 border border-la-border rounded-md focus:outline-none focus:ring-2 focus:ring-la-primary"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>
          </details>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={formState.isGenerating}
            className="w-full bg-la-primary hover:bg-la-primary/90 text-white"
          >
            {formState.isGenerating ? "Generating Lesson..." : "Generate Lesson"}
          </Button>
        </div>
      )}

      {/* Preview and Publish */}
      {formState.generatedLesson && !formState.publishedSlug && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-la-surface">Lesson Preview</h2>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-la-border"
              >
                Start Over
              </Button>
              <Button
                onClick={handlePublish}
                className="bg-la-accent hover:bg-la-accent/90 text-white"
              >
                Publish Lesson
              </Button>
            </div>
          </div>

          <Card className="border-la-border">
            <div className="p-4">
              <LessonPlayer lesson={formState.generatedLesson} />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}