import { describe, it, expect } from 'vitest'
import { loadDesignFeedbackLesson, loadLessonBySlug } from '@/lib/lessonarcade/loaders'

describe('Design Feedback Basics Lesson', () => {
  it('loads and validates the design feedback lesson without errors', () => {
    const lesson = loadDesignFeedbackLesson()
    
    expect(lesson).toBeDefined()
    expect(lesson.id).toBe('design-feedback-basics-guide')
    expect(lesson.slug).toBe('design-feedback-basics')
    expect(lesson.title).toBe('Design Feedback Basics')
    expect(lesson.language).toBe('en')
    expect(lesson.tags).toContain('design')
    expect(lesson.tags).toContain('feedback')
    expect(lesson.levels).toHaveLength(3)
  })

  it('has the correct lesson structure with required fields', () => {
    const lesson = loadDesignFeedbackLesson()
    
    // Check top-level fields
    expect(lesson.shortDescription).toBeTruthy()
    expect(lesson.longDescription).toBeTruthy()
    expect(lesson.estimatedDurationMinutes).toBe(35)
    expect(lesson.video).toBeDefined()
    expect(lesson.video.provider).toBe('youtube')
    expect(lesson.video.videoId).toBe('VLwZc0JNAT8')
  })

  it('contains at least the required number of items by type', () => {
    const lesson = loadDesignFeedbackLesson()
    
    let multipleChoiceCount = 0
    let openEndedCount = 0
    let checkpointCount = 0
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        if (item.kind === 'multiple_choice') multipleChoiceCount++
        else if (item.kind === 'open_ended') openEndedCount++
        else if (item.kind === 'checkpoint') checkpointCount++
      })
    })
    
    expect(multipleChoiceCount).toBeGreaterThanOrEqual(3)
    expect(openEndedCount).toBeGreaterThanOrEqual(2)
    expect(checkpointCount).toBeGreaterThanOrEqual(1)
  })

  it('can be loaded by slug through the main loader', async () => {
    const lesson = await loadLessonBySlug('design-feedback-basics')
    
    expect(lesson).toBeDefined()
    expect(lesson.slug).toBe('design-feedback-basics')
    expect(lesson.title).toBe('Design Feedback Basics')
  })

  it('has valid level structure with time ranges', () => {
    const lesson = loadDesignFeedbackLesson()
    
    lesson.levels.forEach((level, index) => {
      expect(level.id).toBeTruthy()
      expect(level.index).toBe(index)
      expect(level.title).toBeTruthy()
      expect(level.summary).toBeTruthy()
      expect(level.timeRange).toBeDefined()
      expect(level.timeRange?.startSeconds).toBeGreaterThanOrEqual(0)
      expect(level.timeRange?.endSeconds).toBeGreaterThan(level.timeRange?.startSeconds || 0)
      expect(level.keyPoints).toBeInstanceOf(Array)
      expect(level.items).toBeInstanceOf(Array)
    })
  })

  it('multiple choice items have correct structure', () => {
    const lesson = loadDesignFeedbackLesson()
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        if (item.kind === 'multiple_choice') {
          expect(item.prompt).toBeTruthy()
          expect(item.options).toBeInstanceOf(Array)
          expect(item.options.length).toBeGreaterThan(0)
          expect(item.correctOptionIds).toBeInstanceOf(Array)
          expect(item.correctOptionIds.length).toBeGreaterThan(0)
          expect(item.explanation).toBeTruthy()
        }
      })
    })
  })

  it('open ended items have correct structure', () => {
    const lesson = loadDesignFeedbackLesson()
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        if (item.kind === 'open_ended') {
          expect(item.prompt).toBeTruthy()
          expect(item.placeholder).toBeTruthy()
          expect(item.guidance).toBeTruthy()
          expect(item.maxCharacters).toBeGreaterThan(0)
        }
      })
    })
  })

  it('checkpoint items have correct structure', () => {
    const lesson = loadDesignFeedbackLesson()
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        if (item.kind === 'checkpoint') {
          expect(item.message).toBeTruthy()
          expect(item.actionHint).toBeTruthy()
        }
      })
    })
  })
})