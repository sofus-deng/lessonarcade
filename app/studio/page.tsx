import { Metadata } from "next"
import { LessonStudioForm } from "@/components/studio/lesson-studio-form"

export const metadata: Metadata = {
  title: "Lesson Studio - Create Interactive Lessons | LessonArcade",
  description: "Create interactive lessons from YouTube videos with AI-powered generation. Choose between Quick mode (URL only) or Accurate mode (URL + transcript).",
  keywords: ["lesson creator", "interactive lessons", "youtube education", "ai generation"],
}

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-la-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-la-surface mb-4">
              Lesson Studio
            </h1>
            <p className="text-lg text-la-muted">
              Transform YouTube videos into interactive lessons with AI-powered generation
            </p>
          </div>

          {/* Studio Form */}
          <div className="bg-la-surface rounded-lg border border-la-border p-6 shadow-sm">
            <LessonStudioForm />
          </div>
        </div>
      </div>
    </div>
  )
}