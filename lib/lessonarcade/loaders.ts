import { lessonArcadeLessonSchema, type LessonArcadeLesson } from './schema'
import { loadUserLessonBySlug } from './storage'

// Import demo lessons
import reactHooksLesson from '@/data/demo-lessons/react-hooks-intro.json'
import effectiveMeetingsLesson from '@/data/demo-lessons/effective-meetings.json'

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
 * Loads and validates the React Hooks demo lesson
 */
export function loadReactHooksLesson(): LessonArcadeLesson {
  try {
    return validateLesson(reactHooksLesson)
  } catch (error) {
    throw new Error(`Failed to load React Hooks demo lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Loads and validates the Effective Meetings demo lesson
 */
export function loadEffectiveMeetingsLesson(): LessonArcadeLesson {
  try {
    return validateLesson(effectiveMeetingsLesson)
  } catch (error) {
    throw new Error(`Failed to load Effective Meetings demo lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Simple lesson registry for future expansion
 */
export interface LessonRegistry {
  [key: string]: () => LessonArcadeLesson
}

export const lessonRegistry: LessonRegistry = {
  'react-hooks-intro': loadReactHooksLesson,
  'effective-meetings': loadEffectiveMeetingsLesson,
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

/**
 * Demo lesson summary interface for UI listing
 */
export interface DemoLessonSummary {
  slug: string
  title: string
  shortDescription: string
  tags: string[]
  estimatedDurationMinutes: number
  language: string
}

/**
 * Returns summaries of all demo lessons for UI listing
 */
export function getDemoLessonSummaries(): DemoLessonSummary[] {
  const lessons: DemoLessonSummary[] = []
  
  // Load React Hooks lesson summary
  try {
    const reactHooks = loadReactHooksLesson()
    lessons.push({
      slug: reactHooks.slug,
      title: reactHooks.title,
      shortDescription: reactHooks.shortDescription,
      tags: reactHooks.tags,
      estimatedDurationMinutes: reactHooks.estimatedDurationMinutes || 0,
      language: reactHooks.language
    })
  } catch (error) {
    console.error('Error loading React Hooks lesson summary:', error)
  }
  
  // Load Effective Meetings lesson summary
  try {
    const effectiveMeetings = loadEffectiveMeetingsLesson()
    lessons.push({
      slug: effectiveMeetings.slug,
      title: effectiveMeetings.title,
      shortDescription: effectiveMeetings.shortDescription,
      tags: effectiveMeetings.tags,
      estimatedDurationMinutes: effectiveMeetings.estimatedDurationMinutes || 0,
      language: effectiveMeetings.language
    })
  } catch (error) {
    console.error('Error loading Effective Meetings lesson summary:', error)
  }
  
  return lessons
}