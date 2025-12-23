import { loadReactHooksLesson } from '@/lib/lessonarcade/loaders'
import { type LessonArcadeLesson } from '@/lib/lessonarcade/schema'

export default function DebugLessonPage() {
  let lesson: LessonArcadeLesson | null = null
  let error: string | null = null
  
  try {
    lesson = loadReactHooksLesson()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Lesson</h1>
        <pre className="bg-red-50 p-4 rounded border border-red-200 text-red-800">
          {error}
        </pre>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">No Lesson Data</h1>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Lesson Debug: {lesson.title}</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="font-medium">ID:</span> {lesson.id}
          </div>
          <div>
            <span className="font-medium">Slug:</span> {lesson.slug}
          </div>
          <div>
            <span className="font-medium">Language:</span> {lesson.language}
          </div>
          <div>
            <span className="font-medium">Duration:</span> {lesson.estimatedDurationMinutes} minutes
          </div>
        </div>
        
        <div className="mb-4">
          <span className="font-medium">Tags:</span> {lesson.tags.join(', ')}
        </div>
        
        <div className="mb-4">
          <span className="font-medium">Short Description:</span>
          <p className="mt-1">{lesson.shortDescription}</p>
        </div>
        
        {lesson.longDescription && (
          <div className="mb-4">
            <span className="font-medium">Long Description:</span>
            <p className="mt-1">{lesson.longDescription}</p>
          </div>
        )}
        
        <div className="mb-4">
          <span className="font-medium">Video:</span>
          <div className="mt-1 bg-gray-100 p-3 rounded">
            <div>Provider: {lesson.video.provider}</div>
            <div>Video ID: {lesson.video.videoId}</div>
            {lesson.video.startAtSeconds !== undefined && (
              <div>Start: {lesson.video.startAtSeconds}s</div>
            )}
            {lesson.video.endAtSeconds !== undefined && (
              <div>End: {lesson.video.endAtSeconds}s</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Levels ({lesson.levels.length})</h2>
        {lesson.levels.map((level, index) => (
          <div key={level.id} className="mb-6 border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">
              Level {index + 1}: {level.title}
            </h3>
            
            <div className="mb-3">
              <span className="font-medium">Summary:</span>
              <p className="mt-1">{level.summary}</p>
            </div>
            
            {level.timeRange && (
              <div className="mb-3">
                <span className="font-medium">Time Range:</span>
                <span className="ml-2">
                  {level.timeRange.startSeconds}s - {level.timeRange.endAtSeconds}s
                </span>
              </div>
            )}
            
            <div className="mb-3">
              <span className="font-medium">Key Points:</span>
              <ul className="mt-1 ml-4 list-disc">
                {level.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
            
            <div className="mb-3">
              <span className="font-medium">Items ({level.items.length}):</span>
              <div className="mt-2 space-y-2">
                {level.items.map((item) => (
                  <div key={item.id} className="pl-4 border-l-2 border-gray-300">
                    <div className="text-sm font-medium">
                      {item.kind}: {item.prompt}
                    </div>
                    {item.kind === 'multiple_choice' && (
                      <div className="mt-1 text-sm">
                        <div>Options: {item.options.length}</div>
                        <div>Correct: {item.correctOptionIds.length}</div>
                        {item.difficulty && <div>Difficulty: {item.difficulty}</div>}
                        {item.points && <div>Points: {item.points}</div>}
                      </div>
                    )}
                    {item.kind === 'open_ended' && (
                      <div className="mt-1 text-sm">
                        {item.placeholder && <div>Placeholder: {item.placeholder}</div>}
                        {item.guidance && <div>Guidance: {item.guidance}</div>}
                        {item.maxCharacters && <div>Max Characters: {item.maxCharacters}</div>}
                      </div>
                    )}
                    {item.kind === 'checkpoint' && (
                      <div className="mt-1 text-sm">
                        <div>Message: {item.message}</div>
                        {item.actionHint && <div>Action Hint: {item.actionHint}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Raw JSON</h2>
        <details className="bg-gray-100 p-4 rounded">
          <summary className="cursor-pointer font-medium">Click to expand JSON</summary>
          <pre className="mt-4 text-xs overflow-auto bg-white p-4 rounded border">
            {JSON.stringify(lesson, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}