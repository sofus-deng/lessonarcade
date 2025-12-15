import { lessonArcadeLessonSchema, type LessonArcadeLesson } from './schema'
import { loadUserLessonBySlug } from './storage'

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
 * Loads a lesson by slug, checking demo lessons first, then falling back to user lessons
 * Demo lessons always take precedence over user lessons
 */
export async function loadLessonBySlug(slug: string): Promise<LessonArcadeLesson> {
  // First try to load from demo lessons (highest priority)
  const demoLoader = lessonRegistry[slug]
  if (demoLoader) {
    try {
      return demoLoader()
    } catch (error) {
      console.error(`Error loading demo lesson "${slug}":`, error)
      // Continue to try user lessons if demo lesson fails
    }
  }

  // If no demo lesson found or demo lesson failed, try user lessons
  try {
    return await loadUserLessonBySlug(slug)
  } catch {
    // If neither found, throw error
    throw new Error(`Lesson not found: ${slug}`)
  }
}