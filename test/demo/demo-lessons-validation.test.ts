import { describe, it, expect } from 'vitest'
import { lessonRegistry } from '@/lib/lessonarcade/loaders'
import { lessonArcadeLessonSchema } from '@/lib/lessonarcade/schema'

/**
 * Comprehensive test that validates all demo lessons against Zod schema.
 * This prevents broken demo content from shipping.
 */
describe('Demo Lessons Schema Validation', () => {
  const demoSlugs = Object.keys(lessonRegistry)

  it('has expected number of demo lessons registered', () => {
    expect(demoSlugs.length).toBe(6)
  })

  it('contains all expected demo slugs', () => {
    const expectedSlugs = [
      'react-hooks-intro',
      'effective-meetings',
      'design-feedback-basics',
      'decision-making-uncertainty',
      'feedback-that-lands',
      'effective-one-on-ones',
    ]
    
    expectedSlugs.forEach(slug => {
      expect(demoSlugs).toContain(slug)
    })
  })

  it.each(demoSlugs)('validates demo lesson "%s" against Zod schema', (slug) => {
    const loader = lessonRegistry[slug]
    expect(loader).toBeDefined()
    
    const lesson = loader()
    
    // Validate lesson against schema
    const result = lessonArcadeLessonSchema.safeParse(lesson)
    
    expect(result.success).toBe(true)
    
    if (!result.success) {
      // If validation fails, show errors for debugging
      const errors = result.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      )
      console.error(`Validation errors for ${slug}:`, errors)
    }
  })

  it.each(demoSlugs)('demo lesson "%s" has required top-level fields', (slug) => {
    const lesson = lessonRegistry[slug]()
    
    expect(lesson).toBeDefined()
    expect(lesson.id).toBeTruthy()
    expect(lesson.slug).toBe(slug)
    expect(lesson.title).toBeTruthy()
    expect(lesson.shortDescription).toBeTruthy()
    expect(lesson.tags).toBeInstanceOf(Array)
    expect(lesson.tags.length).toBeGreaterThan(0)
    expect(lesson.language).toBe('en')
    expect(lesson.video).toBeDefined()
    expect(lesson.video.provider).toBe('youtube')
    expect(lesson.video.videoId).toBeTruthy()
  })

  it.each(demoSlugs)('demo lesson "%s" has valid levels structure', (slug) => {
    const lesson = lessonRegistry[slug]()
    
    expect(lesson.levels).toBeInstanceOf(Array)
    expect(lesson.levels.length).toBeGreaterThanOrEqual(1)
    
    lesson.levels.forEach((level, levelIndex) => {
      expect(level.id).toBeTruthy()
      expect(level.index).toBe(levelIndex)
      expect(level.title).toBeTruthy()
      expect(level.summary).toBeTruthy()
      expect(level.timeRange).toBeDefined()
      expect(level.timeRange?.startSeconds).toBeGreaterThanOrEqual(0)
      expect(level.timeRange?.endSeconds).toBeGreaterThan(level.timeRange?.startSeconds || 0)
      expect(level.keyPoints).toBeInstanceOf(Array)
      expect(level.keyPoints.length).toBeGreaterThan(0)
      expect(level.items).toBeInstanceOf(Array)
      expect(level.items.length).toBeGreaterThan(0)
    })
  })

  it.each(demoSlugs)('demo lesson "%s" contains mixed item types', (slug) => {
    const lesson = lessonRegistry[slug]()
    
    let hasMultipleChoice = false
    let hasOpenEnded = false
    let hasCheckpoint = false
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        if (item.kind === 'multiple_choice') hasMultipleChoice = true
        else if (item.kind === 'open_ended') hasOpenEnded = true
        else if (item.kind === 'checkpoint') hasCheckpoint = true
      })
    })
    
    expect(hasMultipleChoice).toBe(true)
    expect(hasOpenEnded).toBe(true)
    expect(hasCheckpoint).toBe(true)
  })

  it.each(demoSlugs)('demo lesson "%s" has valid multiple choice items', (slug) => {
    const lesson = lessonRegistry[slug]()
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        if (item.kind === 'multiple_choice') {
          expect(item.prompt).toBeTruthy()
          expect(item.options).toBeInstanceOf(Array)
          expect(item.options.length).toBeGreaterThan(0)
          expect(item.correctOptionIds).toBeInstanceOf(Array)
          expect(item.correctOptionIds.length).toBeGreaterThan(0)
          expect(item.explanation).toBeTruthy()
          
          // Verify each option has required fields
          item.options.forEach(option => {
            expect(option.id).toBeTruthy()
            expect(option.text).toBeTruthy()
          })
        }
      })
    })
  })

  it.each(demoSlugs)('demo lesson "%s" has valid open ended items', (slug) => {
    const lesson = lessonRegistry[slug]()
    
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

  it.each(demoSlugs)('demo lesson "%s" has valid checkpoint items', (slug) => {
    const lesson = lessonRegistry[slug]()
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        if (item.kind === 'checkpoint') {
          expect(item.message).toBeTruthy()
          expect(item.actionHint).toBeTruthy()
        }
      })
    })
  })

  it.each(demoSlugs)('demo lesson "%s" has bilingual I18nText support', (slug) => {
    const lesson = lessonRegistry[slug]()
    
    let hasI18nText = false
    
    lesson.levels.forEach(level => {
      level.items.forEach(item => {
        // Check for i18n fields in multiple choice items
        if (item.kind === 'multiple_choice') {
          if (item.promptI18n && item.promptI18n.zh) hasI18nText = true
          if (item.explanationI18n && item.explanationI18n.zh) hasI18nText = true
          
          item.options.forEach(option => {
            if (option.textI18n && option.textI18n.zh) hasI18nText = true
          })
        }
        // Check for i18n fields in open ended items
        else if (item.kind === 'open_ended') {
          if (item.promptI18n && item.promptI18n.zh) hasI18nText = true
          if (item.placeholderI18n && item.placeholderI18n.zh) hasI18nText = true
          if (item.guidanceI18n && item.guidanceI18n.zh) hasI18nText = true
        }
        // Check for i18n fields in checkpoint items
        else if (item.kind === 'checkpoint') {
          if (item.messageI18n && item.messageI18n.zh) hasI18nText = true
          if (item.actionHintI18n && item.actionHintI18n.zh) hasI18nText = true
        }
      })
    })
    
    // At least some items should have i18n support
    expect(hasI18nText).toBe(true)
  })
})
