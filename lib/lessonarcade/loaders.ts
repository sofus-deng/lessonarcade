import { lessonArcadeLessonSchema, type LessonArcadeLesson } from './schema'
import { loadUserLessonBySlug } from './storage'

// Import demo lessons
import reactHooksLesson from '@/data/demo-lessons/react-hooks-intro.json'
import effectiveMeetingsLesson from '@/data/demo-lessons/effective-meetings.json'
import designFeedbackLesson from '@/data/demo-lessons/design-feedback-basics.json'
import decisionMakingUncertaintyLesson from '@/data/demo-lessons/decision-making-uncertainty.json'
import feedbackThatLandsLesson from '@/data/demo-lessons/feedback-that-lands.json'
import effectiveOneOnOnesLesson from '@/data/demo-lessons/effective-one-on-ones.json'

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
 * Loads and validates the Decision-Making Under Uncertainty demo lesson
 */
export function loadDecisionMakingUncertaintyLesson(): LessonArcadeLesson {
  try {
    return validateLesson(decisionMakingUncertaintyLesson, 'decision-making-uncertainty', 'demo')
  } catch (error) {
    if (error instanceof LessonLoadError) {
      throw error
    }
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to load Decision-Making Under Uncertainty demo lesson',
      { slug: 'decision-making-uncertainty', source: 'demo' }
    )
  }
}

/**
 * Loads and validates the Giving Feedback That Lands demo lesson
 */
export function loadFeedbackThatLandsLesson(): LessonArcadeLesson {
  try {
    return validateLesson(feedbackThatLandsLesson, 'feedback-that-lands', 'demo')
  } catch (error) {
    if (error instanceof LessonLoadError) {
      throw error
    }
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to load Giving Feedback That Lands demo lesson',
      { slug: 'feedback-that-lands', source: 'demo' }
    )
  }
}

/**
 * Loads and validates the Running Effective 1:1s demo lesson
 */
export function loadEffectiveOneOnOnesLesson(): LessonArcadeLesson {
  try {
    return validateLesson(effectiveOneOnOnesLesson, 'effective-one-on-ones', 'demo')
  } catch (error) {
    if (error instanceof LessonLoadError) {
      throw error
    }
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to load Running Effective 1:1s demo lesson',
      { slug: 'effective-one-on-ones', source: 'demo' }
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
  'decision-making-uncertainty': loadDecisionMakingUncertaintyLesson,
  'feedback-that-lands': loadFeedbackThatLandsLesson,
  'effective-one-on-ones': loadEffectiveOneOnOnesLesson,
  // Future lessons can be added here
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

  // Load Decision-Making Under Uncertainty lesson summary
  try {
    const decisionMakingUncertainty = loadDecisionMakingUncertaintyLesson()
    lessons.push({
      slug: decisionMakingUncertainty.slug,
      title: decisionMakingUncertainty.title,
      shortDescription: decisionMakingUncertainty.shortDescription,
      tags: decisionMakingUncertainty.tags,
      estimatedDurationMinutes: decisionMakingUncertainty.estimatedDurationMinutes || 0,
      language: decisionMakingUncertainty.language
    })
  } catch (error) {
    console.error('Error loading Decision-Making Under Uncertainty lesson summary:', error)
  }

  // Load Giving Feedback That Lands lesson summary
  try {
    const feedbackThatLands = loadFeedbackThatLandsLesson()
    lessons.push({
      slug: feedbackThatLands.slug,
      title: feedbackThatLands.title,
      shortDescription: feedbackThatLands.shortDescription,
      tags: feedbackThatLands.tags,
      estimatedDurationMinutes: feedbackThatLands.estimatedDurationMinutes || 0,
      language: feedbackThatLands.language
    })
  } catch (error) {
    console.error('Error loading Giving Feedback That Lands lesson summary:', error)
  }

  // Load Running Effective 1:1s lesson summary
  try {
    const effectiveOneOnOnes = loadEffectiveOneOnOnesLesson()
    lessons.push({
      slug: effectiveOneOnOnes.slug,
      title: effectiveOneOnOnes.title,
      shortDescription: effectiveOneOnOnes.shortDescription,
      tags: effectiveOneOnOnes.tags,
      estimatedDurationMinutes: effectiveOneOnOnes.estimatedDurationMinutes || 0,
      language: effectiveOneOnOnes.language
    })
  } catch (error) {
    console.error('Error loading Running Effective 1:1s lesson summary:', error)
  }

  return lessons
}

/**
 * Loads a lesson by slug with deterministic behavior:
 * - If slug exists in lessonRegistry (demo), return demoLoader() and let its LessonLoadError propagate
 * - Otherwise, call loadUserLessonBySlug(slug) and let its LessonLoadError propagate
 */
export async function loadLessonBySlug(slug: string): Promise<LessonArcadeLesson> {
  const demoLoader = lessonRegistry[slug]
  if (demoLoader) {
    return demoLoader()
  }

  return await loadUserLessonBySlug(slug)
}
