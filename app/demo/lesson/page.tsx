import { loadDemoLesson } from '@/lib/lessonarcade/loaders'
import { type LessonArcadeLesson } from '@/lib/lessonarcade/schema'
import { LessonPlayer } from '@/components/lesson/lesson-player'

export default function DemoLessonPage() {
  let lesson: LessonArcadeLesson | null = null
  let error: string | null = null
  
  try {
    lesson = loadDemoLesson()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-la-bg p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-la-surface mb-4">Error Loading Lesson</h1>
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-la-bg p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-la-surface mb-4">No Lesson Data</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-la-bg">
      <LessonPlayer lesson={lesson} />
    </div>
  )
}