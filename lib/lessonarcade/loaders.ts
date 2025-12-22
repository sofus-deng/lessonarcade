import { lessonArcadeLessonSchema, type LessonArcadeLesson } from './schema'
import { loadUserLessonBySlug } from './storage'

// Import demo lessons
import reactHooksLesson from '@/data/demo-lessons/react-hooks-intro.json'
import effectiveMeetingsLesson from '@/data/demo-lessons/effective-meetings.json'
import designFeedbackLesson from '@/data/demo-lessons/design-feedback-basics.json'

/**
 * Typed error for lesson loading failures
 */
export class LessonLoadError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'VALIDATION' | 'VERSION_MISMATCH' | 'LOAD_FAILED',
    message: string,
    public debug: {
      slug: string;
      source: 'demo' | 'user';
      issues?: string[];
    }
  ) {
    super(message);
    this.name = 'LessonLoadError';
  }
}

/**
 * Validates a lesson object against the schema
 */
function validateLesson(data: unknown, slug: string, source: 'demo' | 'user'): LessonArcadeLesson {
  // Check for version mismatch before validation
  if (data && typeof data === 'object' && 'schemaVersion' in data) {
    const version = (data as { schemaVersion?: unknown }).schemaVersion
    if (typeof version === 'number' && version !== 1) {
      throw new LessonLoadError(
        'VERSION_MISMATCH',
        'This lesson was created with a newer version of LessonArcade and cannot be loaded.',
        { slug, source }
      )
    }
  }

  const result = lessonArcadeLessonSchema.safeParse(data)
  
  if (!result.success) {
    const errorMessages = result.error.issues.map(issue =>
      `${issue.path.join('.')}: ${issue.message}`
    )
    
    throw new LessonLoadError(
      'VALIDATION',
      'There is an issue with the lesson data that prevents it from loading properly.',
      {
        slug,
        source,
        issues: errorMessages
      }
    )
  }
  
  return result.data
}

/**
 * Loads and validates the React Hooks demo lesson
 */
export function loadReactHooksLesson(): LessonArcadeLesson {
  try {
    return validateLesson(reactHooksLesson, 'react-hooks-intro', 'demo')
  } catch (error) {
    if (error instanceof LessonLoadError) {
      throw error
    }
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to load React Hooks demo lesson',
      { slug: 'react-hooks-intro', source: 'demo' }
    )
  }
}

/**
 * Loads and validates the Effective Meetings demo lesson
 */
export function loadEffectiveMeetingsLesson(): LessonArcadeLesson {
  try {
    return validateLesson(effectiveMeetingsLesson, 'effective-meetings', 'demo')
  } catch (error) {
    if (error instanceof LessonLoadError) {
      throw error
    }
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to load Effective Meetings demo lesson',
      { slug: 'effective-meetings', source: 'demo' }
    )
  }
}

/**
 * Loads and validates the Design Feedback Basics demo lesson
 */
export function loadDesignFeedbackLesson(): LessonArcadeLesson {
  try {
    return validateLesson(designFeedbackLesson, 'design-feedback-basics', 'demo')
  } catch (error) {
    if (error instanceof LessonLoadError) {
      throw error
    }
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to load Design Feedback Basics demo lesson',
      { slug: 'design-feedback-basics', source: 'demo' }
    )
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
  'design-feedback-basics': loadDesignFeedbackLesson,
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
      if (error instanceof LessonLoadError) {
        // Re-throw LessonLoadError from demo lesson
        throw error
      }
      console.error(`Error loading demo lesson "${slug}":`, error)
      // Continue to try user lessons if demo lesson fails
    }
  }

  // If no demo lesson found or demo lesson failed, try user lessons
  try {
    return await loadUserLessonBySlug(slug)
  } catch (error) {
    if (error instanceof LessonLoadError) {
      // Re-throw LessonLoadError from user lesson
      throw error
    }
    
    // If neither found, throw NOT_FOUND error
    throw new LessonLoadError(
      'NOT_FOUND',
      'The lesson you\'re looking for doesn\'t exist or may have been removed.',
      { slug, source: 'demo' } // Default to demo since we tried demo first
    )
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
  
  // Load Design Feedback Basics lesson summary
  try {
    const designFeedback = loadDesignFeedbackLesson()
    lessons.push({
      slug: designFeedback.slug,
      title: designFeedback.title,
      shortDescription: designFeedback.shortDescription,
      tags: designFeedback.tags,
      estimatedDurationMinutes: designFeedback.estimatedDurationMinutes || 0,
      language: designFeedback.language
    })
  } catch (error) {
    console.error('Error loading Design Feedback Basics lesson summary:', error)
  }
  
  return lessons
}