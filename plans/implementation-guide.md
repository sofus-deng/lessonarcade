# LessonArcade Data Model Implementation Guide

## File Structure to Create

### 1. `/lib/lessonarcade/schema.ts`
```typescript
import { z } from "zod"

// Base video schema
const videoSchema = z.object({
  provider: z.string(),
  videoId: z.string(),
  startAtSeconds: z.number().optional(),
  endAtSeconds: z.number().optional(),
})

// Multiple choice option schema
const multipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
})

// Base item schema with discriminator
const baseItemSchema = z.object({
  kind: z.enum(["multiple_choice", "open_ended", "checkpoint"]),
  id: z.string(),
  prompt: z.string(),
})

// Multiple choice item schema
const multipleChoiceItemSchema = baseItemSchema.extend({
  kind: z.literal("multiple_choice"),
  options: z.array(multipleChoiceOptionSchema).min(1, "Multiple choice questions must have at least one option"),
  correctOptionIds: z.array(z.string()).min(1, "Multiple choice questions must have at least one correct option"),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  points: z.number().optional(),
})

// Open ended item schema
const openEndedItemSchema = baseItemSchema.extend({
  kind: z.literal("open_ended"),
  placeholder: z.string().optional(),
  guidance: z.string().optional(),
  maxCharacters: z.number().optional(),
})

// Checkpoint item schema
const checkpointItemSchema = baseItemSchema.extend({
  kind: z.literal("checkpoint"),
  message: z.string(),
  actionHint: z.string().optional(),
})

// Discriminated union for all item types
const lessonArcadeItemSchema = z.discriminatedUnion("kind", [
  multipleChoiceItemSchema,
  openEndedItemSchema,
  checkpointItemSchema,
])

// Time range schema for levels
const timeRangeSchema = z.object({
  startSeconds: z.number(),
  endSeconds: z.number(),
}).optional()

// Level schema
const lessonArcadeLevelSchema = z.object({
  id: z.string(),
  index: z.number(),
  title: z.string(),
  summary: z.string(),
  timeRange: timeRangeSchema,
  keyPoints: z.array(z.string()),
  items: z.array(lessonArcadeItemSchema),
})

// Main lesson schema
const lessonArcadeLessonSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  longDescription: z.string().optional(),
  estimatedDurationMinutes: z.number().optional(),
  tags: z.array(z.string()),
  language: z.string(),
  video: videoSchema,
  levels: z.array(lessonArcadeLevelSchema).min(1, "Lessons must have at least one level"),
})

// Export schemas
export {
  videoSchema,
  multipleChoiceOptionSchema,
  baseItemSchema,
  multipleChoiceItemSchema,
  openEndedItemSchema,
  checkpointItemSchema,
  lessonArcadeItemSchema,
  timeRangeSchema,
  lessonArcadeLevelSchema,
  lessonArcadeLessonSchema,
}

// Export inferred types
export type LessonArcadeVideo = z.infer<typeof videoSchema>
export type LessonArcadeMultipleChoiceOption = z.infer<typeof multipleChoiceOptionSchema>
export type LessonArcadeBaseItem = z.infer<typeof baseItemSchema>
export type LessonArcadeMultipleChoiceItem = z.infer<typeof multipleChoiceItemSchema>
export type LessonArcadeOpenEndedItem = z.infer<typeof openEndedItemSchema>
export type LessonArcadeCheckpointItem = z.infer<typeof checkpointItemSchema>
export type LessonArcadeItem = z.infer<typeof lessonArcadeItemSchema>
export type LessonArcadeTimeRange = z.infer<typeof timeRangeSchema>
export type LessonArcadeLevel = z.infer<typeof lessonArcadeLevelSchema>
export type LessonArcadeLesson = z.infer<typeof lessonArcadeLessonSchema>
```

### 2. `/data/demo-lessons/react-hooks-intro.json`
```json
{
  "id": "intro-to-react-hooks",
  "slug": "react-hooks-intro",
  "title": "Introduction to React Hooks",
  "shortDescription": "Learn the fundamentals of React Hooks and how they revolutionize state management in functional components.",
  "longDescription": "This comprehensive introduction covers the core concepts of React Hooks, including useState, useEffect, and custom hooks. You'll learn how to manage state and side effects in functional components, making your React code more readable and maintainable.",
  "estimatedDurationMinutes": 45,
  "tags": ["react", "hooks", "javascript", "frontend"],
  "language": "en",
  "video": {
    "provider": "youtube",
    "videoId": "TNhaISOUy6Q",
    "startAtSeconds": 0,
    "endAtSeconds": 2700
  },
  "levels": [
    {
      "id": "level-1",
      "index": 0,
      "title": "Understanding useState Hook",
      "summary": "Learn how to use useState to manage state in functional components",
      "timeRange": {
        "startSeconds": 0,
        "endSeconds": 900
      },
      "keyPoints": [
        "useState replaces this.setState in functional components",
        "Always returns a stateful value and a setter function",
        "State updates trigger re-renders",
        "Can handle primitive values and objects"
      ],
      "items": [
        {
          "kind": "multiple_choice",
          "id": "q1",
          "prompt": "What does the useState hook return?",
          "options": [
            {
              "id": "a",
              "text": "A single state value"
            },
            {
              "id": "b",
              "text": "A stateful value and a setter function"
            },
            {
              "id": "c",
              "text": "A setter function only"
            },
            {
              "id": "d",
              "text": "A state object and updater function"
            }
          ],
          "correctOptionIds": ["b"],
          "explanation": "useState always returns an array with exactly two elements: the current state value and a function to update it.",
          "difficulty": "easy",
          "points": 10
        },
        {
          "kind": "open_ended",
          "id": "q2",
          "prompt": "Describe a scenario where useState would be more appropriate than using a class component with this.state.",
          "placeholder": "Enter your response here...",
          "guidance": "Think about component simplicity, readability, and modern React patterns.",
          "maxCharacters": 500
        },
        {
          "kind": "checkpoint",
          "id": "cp1",
          "message": "Great! You now understand the basics of useState. Let's move on to managing side effects.",
          "actionHint": "Ready to learn about useEffect? Continue to the next section."
        }
      ]
    },
    {
      "id": "level-2",
      "index": 1,
      "title": "Managing Side Effects with useEffect",
      "summary": "Master the useEffect hook for handling side effects in functional components",
      "timeRange": {
        "startSeconds": 900,
        "endSeconds": 1800
      },
      "keyPoints": [
        "useEffect replaces componentDidMount and componentDidUpdate",
        "Dependency array controls when effect runs",
        "Cleanup functions prevent memory leaks",
        "Can run after every render or selectively"
      ],
      "items": [
        {
          "kind": "multiple_choice",
          "id": "q3",
          "prompt": "When does useEffect run with an empty dependency array []?",
          "options": [
            {
              "id": "a",
              "text": "Never"
            },
            {
              "id": "b",
              "text": "Only once after initial render"
            },
            {
              "id": "c",
              "text": "After every render"
            },
            {
              "id": "d",
              "text": "Only when props change"
            }
          ],
          "correctOptionIds": ["b"],
          "explanation": "An empty dependency array tells React to run the effect only once, similar to componentDidMount.",
          "difficulty": "medium",
          "points": 15
        },
        {
          "kind": "checkpoint",
          "id": "cp2",
          "message": "Excellent! You understand how useEffect works with dependencies.",
          "actionHint": "Let's explore custom hooks next."
        }
      ]
    },
    {
      "id": "level-3",
      "index": 2,
      "title": "Creating Custom Hooks",
      "summary": "Learn to build your own reusable hooks for shared logic",
      "timeRange": {
        "startSeconds": 1800,
        "endSeconds": 2700
      },
      "keyPoints": [
        "Custom hooks start with 'use' prefix",
        "Can call other hooks inside custom hooks",
        "Encapsulate reusable stateful logic",
        "Follow the rules of hooks"
      ],
      "items": [
        {
          "kind": "multiple_choice",
          "id": "q4",
          "prompt": "What is a key benefit of custom hooks?",
          "options": [
            {
              "id": "a",
              "text": "Better performance than class components"
            },
            {
              "id": "b",
              "text": "Sharing stateful logic between components"
            },
            {
              "id": "c",
              "text": "Automatic memoization"
            },
            {
              "id": "d",
              "text": "Built-in state management"
            }
          ],
          "correctOptionIds": ["b"],
          "explanation": "Custom hooks allow you to extract and reuse stateful logic between components without changing component hierarchy.",
          "difficulty": "medium",
          "points": 20
        },
        {
          "kind": "open_ended",
          "id": "q5",
          "prompt": "Describe a custom hook you would create for a real-world application and what problem it would solve.",
          "placeholder": "Think about common patterns in your apps...",
          "guidance": "Consider authentication, data fetching, form handling, or UI state patterns.",
          "maxCharacters": 600
        },
        {
          "kind": "checkpoint",
          "id": "cp3",
          "message": "Congratulations! You've completed the introduction to React Hooks.",
          "actionHint": "Ready to build your first hook-based component?"
        }
      ]
    }
  ]
}
```

### 3. `/lib/lessonarcade/loaders.ts`
```typescript
import { z } from 'zod'
import { lessonArcadeLessonSchema, type LessonArcadeLesson } from './schema'

// Import demo lesson
import demoLesson from '@/data/demo-lessons/react-hooks-intro.json'

/**
 * Validates a lesson object against the schema
 */
function validateLesson(data: unknown): LessonArcadeLesson {
  const result = lessonArcadeLessonSchema.safeParse(data)
  
  if (!result.success) {
    const errorMessages = result.error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join('; ')
    
    throw new Error(`Invalid lesson data: ${errorMessages}`)
  }
  
  return result.data
}

/**
 * Loads and validates the demo lesson
 */
export function loadDemoLesson(): LessonArcadeLesson {
  try {
    return validateLesson(demoLesson)
  } catch (error) {
    throw new Error(`Failed to load demo lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Simple lesson registry for future expansion
 */
export interface LessonRegistry {
  [key: string]: () => LessonArcadeLesson
}

export const lessonRegistry: LessonRegistry = {
  'react-hooks-intro': loadDemoLesson,
  // Future lessons can be added here
}

/**
 * Loads a lesson by slug from the registry
 */
export function loadLessonBySlug(slug: string): LessonArcadeLesson {
  const loader = lessonRegistry[slug]
  if (!loader) {
    throw new Error(`Lesson not found: ${slug}`)
  }
  
  return loader()
}
```

### 4. `/app/demo/lesson/debug/page.tsx`
```typescript
import { loadDemoLesson, loadLessonBySlug } from '@/lib/lessonarcade/loaders'
import { type LessonArcadeLesson } from '@/lib/lessonarcade/schema'

export default function DebugLessonPage() {
  let lesson: LessonArcadeLesson | null = null
  let error: string | null = null
  
  try {
    lesson = loadDemoLesson()
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
                  {level.timeRange.startSeconds}s - {level.timeRange.endSeconds}s
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
```

## Implementation Steps

1. **Create the schema file** at `/lib/lessonarcade/schema.ts`
2. **Create example lesson data** at `/data/demo-lessons/react-hooks-intro.json`
3. **Create the loader module** at `/lib/lessonarcade/loaders.ts`
4. **Create debug page** at `/app/demo/lesson/debug/page.tsx`
5. **Run quality checks**: `pnpm lint` and `pnpm build`
6. **Commit and push** to main branch with conventional commit message

This implementation provides a complete, type-safe foundation for the LessonArcade platform with comprehensive validation and debugging capabilities.