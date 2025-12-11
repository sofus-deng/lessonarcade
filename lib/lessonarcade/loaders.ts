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