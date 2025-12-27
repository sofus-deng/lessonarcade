/**
 * Unit tests for personalization domain model.
 */

import { describe, it, expect } from 'vitest'
import {
  buildPersonalizationSuggestions,
  getTotalRunsForLesson,
  type PersonalizationContext,
} from '@/lib/lessonarcade/personalization'

describe('buildPersonalizationSuggestions', () => {
  const baseContext: PersonalizationContext = {
    workspaceSlug: 'demo',
    lessonSlug: 'test-lesson',
    mode: 'focus',
    score: 50,
    maxScore: 100,
    totalRunsForLesson: 1,
    streakDays: 0,
    completedAt: new Date('2025-01-01T10:00:00.000Z'),
  }

  describe('low score case (< 60%)', () => {
    it('includes a retry_lesson suggestion with a replay URL', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 50,
        maxScore: 100,
        totalRunsForLesson: 1,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      expect(suggestions.length).toBeGreaterThan(0)
      const retrySuggestion = suggestions.find((s) => s.type === 'retry_lesson')
      expect(retrySuggestion).toBeDefined()
      expect(retrySuggestion?.primaryActionHref).toBe('/demo/lesson/test-lesson')
      expect(retrySuggestion?.primaryActionLabel).toBeDefined()
    })

    it('shows steady improvement message after 3+ attempts with low scores', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 40,
        maxScore: 100,
        totalRunsForLesson: 3,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const steadyImprovement = suggestions.find((s) => s.id === 'steady-improvement')
      expect(steadyImprovement).toBeDefined()
      expect(steadyImprovement?.title).toContain('effort')
      expect(steadyImprovement?.description).toContain('progress')
    })

    it('shows review message for first or second attempt with low score', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 30,
        maxScore: 100,
        totalRunsForLesson: 2,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const reviewSuggestion = suggestions.find((s) => s.id === 'low-score-review')
      expect(reviewSuggestion).toBeDefined()
      expect(reviewSuggestion?.title).toContain('Review')
      expect(reviewSuggestion?.description).toContain('reinforce')
    })
  })

  describe('mid score case (60-89%)', () => {
    it('includes a review_levels suggestion', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 70,
        maxScore: 100,
        totalRunsForLesson: 1,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const reviewLevelsSuggestion = suggestions.find((s) => s.type === 'review_levels')
      expect(reviewLevelsSuggestion).toBeDefined()
      expect(reviewLevelsSuggestion?.title).toContain('Revisit')
      expect(reviewLevelsSuggestion?.description).toContain('master')
    })

    it('includes try_voice_mode suggestion when in focus mode', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 75,
        maxScore: 100,
        totalRunsForLesson: 1,
        mode: 'focus',
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const voiceSuggestion = suggestions.find((s) => s.type === 'try_voice_mode')
      expect(voiceSuggestion).toBeDefined()
      expect(voiceSuggestion?.primaryActionHref).toBe('/demo/voice/test-lesson')
    })
  })

  describe('high score case (≥ 90%)', () => {
    it('includes a celebrate suggestion', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 95,
        maxScore: 100,
        totalRunsForLesson: 1,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const celebrateSuggestion = suggestions.find((s) => s.type === 'celebrate')
      expect(celebrateSuggestion).toBeDefined()
      expect(celebrateSuggestion?.title).toContain('Excellent')
    })

    it('includes try_voice_mode suggestion in focus mode', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 90,
        maxScore: 100,
        totalRunsForLesson: 1,
        mode: 'focus',
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const voiceSuggestion = suggestions.find((s) => s.type === 'try_voice_mode')
      expect(voiceSuggestion).toBeDefined()
      expect(voiceSuggestion?.title).toContain('voice mode')
      expect(voiceSuggestion?.primaryActionHref).toBe('/demo/voice/test-lesson')
    })

    it('includes try_voice_mode suggestion with voice-chat URL in arcade mode', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 92,
        maxScore: 100,
        totalRunsForLesson: 1,
        mode: 'arcade',
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const voiceChatSuggestion = suggestions.find((s) => s.id === 'high-score-voice-chat')
      expect(voiceChatSuggestion).toBeDefined()
      expect(voiceChatSuggestion?.primaryActionHref).toBe('/demo/voice-chat/test-lesson')
      expect(voiceChatSuggestion?.primaryActionLabel).toContain('Voice Chat')
    })
  })

  describe('null or zero maxScore', () => {
    it('returns a reasonable default suggestion when maxScore is null', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 50,
        maxScore: null,
        totalRunsForLesson: 1,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      expect(suggestions.length).toBeGreaterThan(0)
      const defaultSuggestion = suggestions.find((s) => s.id === 'no-score-encourage')
      expect(defaultSuggestion).toBeDefined()
      expect(defaultSuggestion?.type).toBe('next_lesson')
    })

    it('returns a reasonable default suggestion when maxScore is zero', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 50,
        maxScore: 0,
        totalRunsForLesson: 1,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      expect(suggestions.length).toBeGreaterThan(0)
      const defaultSuggestion = suggestions.find((s) => s.id === 'no-score-encourage')
      expect(defaultSuggestion).toBeDefined()
    })

    it('returns a reasonable default suggestion when score is null', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: null,
        maxScore: 100,
        totalRunsForLesson: 1,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      expect(suggestions.length).toBeGreaterThan(0)
      const defaultSuggestion = suggestions.find((s) => s.id === 'no-score-encourage')
      expect(defaultSuggestion).toBeDefined()
    })
  })

  describe('streak-based encouragement', () => {
    it('includes streak encouragement when streak is 3+ days', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 70,
        maxScore: 100,
        totalRunsForLesson: 1,
        streakDays: 3,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const streakSuggestion = suggestions.find((s) => s.id === 'streak-encourage')
      expect(streakSuggestion).toBeDefined()
      expect(streakSuggestion?.title).toContain('3-day')
      expect(streakSuggestion?.title).toContain('🔥')
    })

    it('includes streak encouragement when streak is 5+ days', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 80,
        maxScore: 100,
        totalRunsForLesson: 1,
        streakDays: 5,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const streakSuggestion = suggestions.find((s) => s.id === 'streak-encourage')
      expect(streakSuggestion).toBeDefined()
      expect(streakSuggestion?.title).toContain('5-day')
    })
  })

  describe('edge cases', () => {
    it('always returns at least one suggestion', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: null,
        maxScore: null,
        totalRunsForLesson: 0,
        streakDays: 0,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      expect(suggestions.length).toBeGreaterThanOrEqual(1)
    })

    it('returns at most 3 suggestions', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 95,
        maxScore: 100,
        totalRunsForLesson: 1,
        streakDays: 5,
      }

      const suggestions = buildPersonalizationSuggestions(context)

      expect(suggestions.length).toBeLessThanOrEqual(3)
    })
  })

  describe('URL generation', () => {
    it('generates correct replay URL for retry_lesson', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 40,
        maxScore: 100,
        totalRunsForLesson: 1,
        lessonSlug: 'react-hooks-intro',
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const retrySuggestion = suggestions.find((s) => s.type === 'retry_lesson')
      expect(retrySuggestion?.primaryActionHref).toBe('/demo/lesson/react-hooks-intro')
    })

    it('generates correct voice URL for try_voice_mode', () => {
      const context: PersonalizationContext = {
        ...baseContext,
        score: 75,
        maxScore: 100,
        totalRunsForLesson: 1,
        mode: 'focus',
        lessonSlug: 'design-feedback-basics',
      }

      const suggestions = buildPersonalizationSuggestions(context)

      const voiceSuggestion = suggestions.find((s) => s.type === 'try_voice_mode')
      expect(voiceSuggestion?.primaryActionHref).toBe('/demo/voice/design-feedback-basics')
    })
  })
})

describe('getTotalRunsForLesson', () => {
  it('returns 0 when history is empty', () => {
    const result = getTotalRunsForLesson([], 'lesson-1')
    expect(result).toBe(0)
  })

  it('returns 1 when one run exists for lesson', () => {
    const history = [
      { lessonId: 'lesson-1', score: 10, maxScore: 10, completedAt: '2025-01-01', mode: 'focus' },
    ]
    const result = getTotalRunsForLesson(history, 'lesson-1')
    expect(result).toBe(1)
  })

  it('returns correct count when multiple runs exist for lesson', () => {
    const history = [
      { lessonId: 'lesson-1', score: 10, maxScore: 10, completedAt: '2025-01-01', mode: 'focus' },
      { lessonId: 'lesson-2', score: 10, maxScore: 10, completedAt: '2025-01-02', mode: 'focus' },
      { lessonId: 'lesson-1', score: 15, maxScore: 10, completedAt: '2025-01-03', mode: 'focus' },
      { lessonId: 'lesson-1', score: 20, maxScore: 10, completedAt: '2025-01-04', mode: 'focus' },
    ]
    const result = getTotalRunsForLesson(history, 'lesson-1')
    expect(result).toBe(3)
  })

  it('returns 0 when no runs exist for specified lesson', () => {
    const history = [
      { lessonId: 'lesson-1', score: 10, maxScore: 10, completedAt: '2025-01-01', mode: 'focus' },
      { lessonId: 'lesson-2', score: 10, maxScore: 10, completedAt: '2025-01-02', mode: 'focus' },
    ]
    const result = getTotalRunsForLesson(history, 'lesson-3')
    expect(result).toBe(0)
  })
})
