import { describe, it, expect, afterEach } from 'vitest'
import { loadLessonBySlug, lessonRegistry, LessonLoadError } from '@/lib/lessonarcade/loaders'

describe('loadLessonBySlug', () => {
  // Store original loader to restore after tests
  const originalDesignFeedbackLoader = lessonRegistry['design-feedback-basics']

  afterEach(() => {
    // Restore original loader after each test
    lessonRegistry['design-feedback-basics'] = originalDesignFeedbackLoader
  })

  it('loads an existing demo slug successfully', async () => {
    const lesson = await loadLessonBySlug('design-feedback-basics')
    
    expect(lesson).toBeDefined()
    expect(lesson.slug).toBe('design-feedback-basics')
    expect(lesson.title).toBe('Design Feedback Basics')
    expect(lesson.id).toBe('design-feedback-basics-guide')
  })

  it('rejects unknown slug with LessonLoadError code NOT_FOUND and debug.source user', async () => {
    const unknownSlug = '__vitest_missing_slug__'
    
    try {
      await loadLessonBySlug(unknownSlug)
      expect.fail('Expected loadLessonBySlug to throw an error')
    } catch (error) {
      expect(error).toBeInstanceOf(LessonLoadError)
      
      const lessonError = error as LessonLoadError
      expect(lessonError.code).toBe('NOT_FOUND')
      expect(lessonError.debug.slug).toBe(unknownSlug)
      expect(lessonError.debug.source).toBe('user')
      expect(lessonError.message).toContain('doesn\'t exist')
    }
  })

  it('propagates LessonLoadError from demo loader without fallback', async () => {
    // Temporarily replace the demo loader with one that throws an error
    const throwingLoader = () => {
      throw new LessonLoadError(
        'LOAD_FAILED',
        'Test error from demo loader',
        { slug: 'design-feedback-basics', source: 'demo' }
      )
    }
    
    lessonRegistry['design-feedback-basics'] = throwingLoader
    
    try {
      await loadLessonBySlug('design-feedback-basics')
      expect.fail('Expected loadLessonBySlug to throw an error')
    } catch (error) {
      expect(error).toBeInstanceOf(LessonLoadError)
      
      const lessonError = error as LessonLoadError
      expect(lessonError.code).toBe('LOAD_FAILED')
      expect(lessonError.debug.slug).toBe('design-feedback-basics')
      expect(lessonError.debug.source).toBe('demo')
      expect(lessonError.message).toBe('Test error from demo loader')
    }
  })
})