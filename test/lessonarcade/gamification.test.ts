/**
 * Unit tests for gamification domain model.
 */

import { describe, it, expect } from 'vitest'
import {
  getInitialGamificationState,
  applyLessonRun,
  getAllBadges,
  getUnlockedBadges,
  getLockedBadges,
  BADGES,
  type GamificationState,
} from '@/lib/lessonarcade/gamification'

describe('getInitialGamificationState', () => {
  it('returns initial empty state', () => {
    const state = getInitialGamificationState()

    expect(state.totalLessonsCompleted).toBe(0)
    expect(state.totalRuns).toBe(0)
    expect(state.currentStreakDays).toBe(0)
    expect(state.longestStreakDays).toBe(0)
    expect(state.badgesUnlocked).toEqual([])
    expect(state.history).toEqual([])
    expect(state.bestScoresByLesson).toEqual({})
  })
})

describe('applyLessonRun', () => {
  it('first completed lesson unlocks "first-lesson" badge', () => {
    const initialState = getInitialGamificationState()
    const run = {
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    }

    const { state, newlyUnlockedBadges } = applyLessonRun(initialState, run)

    expect(state.totalLessonsCompleted).toBe(1)
    expect(state.totalRuns).toBe(1)
    expect(newlyUnlockedBadges).toContain('first-lesson')
    expect(state.badgesUnlocked).toContain('first-lesson')
  })

  it('after 5 completed lessons, "five-lessons" badge is unlocked', () => {
    let currentState = getInitialGamificationState()

    // Complete 4 lessons
    for (let i = 1; i <= 4; i++) {
      const run = {
        lessonId: `lesson-${i}`,
        score: 10,
        maxScore: 10,
        correctCount: 1,
        completedAt: new Date(`2025-01-0${i}T10:00:00.000Z`),
        mode: 'focus' as const,
      }
      const result = applyLessonRun(currentState, run)
      currentState = result.state
    }

    // Complete 5th lesson
    const run = {
      lessonId: 'lesson-5',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-05T10:00:00.000Z'),
      mode: 'focus' as const,
    }
    const { state: finalState, newlyUnlockedBadges } = applyLessonRun(currentState, run)

    expect(finalState.totalLessonsCompleted).toBe(5)
    expect(newlyUnlockedBadges).toContain('five-lessons')
    expect(finalState.badgesUnlocked).toContain('five-lessons')
  })

  it('a run where score === maxScore unlocks "perfect-score" badge', () => {
    const initialState = getInitialGamificationState()
    const run = {
      lessonId: 'lesson-1',
      score: 100,
      maxScore: 100,
      correctCount: 10,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    }

    const { state, newlyUnlockedBadges } = applyLessonRun(initialState, run)

    expect(newlyUnlockedBadges).toContain('perfect-score')
    expect(state.badgesUnlocked).toContain('perfect-score')
  })

  it('a run where score < maxScore does not unlock "perfect-score" badge', () => {
    const initialState = getInitialGamificationState()
    const run = {
      lessonId: 'lesson-1',
      score: 80,
      maxScore: 100,
      correctCount: 8,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    }

    const { state, newlyUnlockedBadges } = applyLessonRun(initialState, run)

    expect(newlyUnlockedBadges).not.toContain('perfect-score')
    expect(state.badgesUnlocked).not.toContain('perfect-score')
  })

  it('three consecutive days of completions unlock "three-day-streak" badge', () => {
    let currentState = getInitialGamificationState()

    // Day 1
    let result = applyLessonRun(currentState, {
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    })
    currentState = result.state

    expect(currentState.currentStreakDays).toBe(1)
    expect(currentState.longestStreakDays).toBe(1)
    expect(result.newlyUnlockedBadges).not.toContain('three-day-streak')

    // Day 2
    result = applyLessonRun(currentState, {
      lessonId: 'lesson-2',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-02T10:00:00.000Z'),
      mode: 'focus' as const,
    })
    currentState = result.state

    expect(currentState.currentStreakDays).toBe(2)
    expect(currentState.longestStreakDays).toBe(2)
    expect(result.newlyUnlockedBadges).not.toContain('three-day-streak')

    // Day 3
    result = applyLessonRun(currentState, {
      lessonId: 'lesson-3',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-03T10:00:00.000Z'),
      mode: 'focus' as const,
    })
    currentState = result.state

    expect(currentState.currentStreakDays).toBe(3)
    expect(currentState.longestStreakDays).toBe(3)
    expect(result.newlyUnlockedBadges).toContain('three-day-streak')
    expect(currentState.badgesUnlocked).toContain('three-day-streak')
  })

  it('same-day completions do not break streak', () => {
    let currentState = getInitialGamificationState()

    // First completion on day 1
    let result = applyLessonRun(currentState, {
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    })
    currentState = result.state

    expect(currentState.currentStreakDays).toBe(1)

    // Second completion on same day
    result = applyLessonRun(currentState, {
      lessonId: 'lesson-2',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T15:00:00.000Z'),
      mode: 'focus' as const,
    })
    currentState = result.state

    expect(currentState.currentStreakDays).toBe(1) // Still 1, not incremented
  })

  it('gap of more than 1 day resets streak to 1', () => {
    let currentState = getInitialGamificationState()

    // Day 1
    let result = applyLessonRun(currentState, {
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    })
    currentState = result.state

    expect(currentState.currentStreakDays).toBe(1)

    // Day 3 (gap of 2 days)
    result = applyLessonRun(currentState, {
      lessonId: 'lesson-2',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-03T10:00:00.000Z'),
      mode: 'focus' as const,
    })
    currentState = result.state

    expect(currentState.currentStreakDays).toBe(1) // Reset to 1
  })

  it('longestStreakDays is updated when currentStreakDays exceeds previous maximum', () => {
    let currentState = getInitialGamificationState()

    // Build a 3-day streak
    for (let i = 1; i <= 3; i++) {
      const result = applyLessonRun(currentState, {
        lessonId: `lesson-${i}`,
        score: 10,
        maxScore: 10,
        correctCount: 1,
        completedAt: new Date(`2025-01-0${i}T10:00:00.000Z`),
        mode: 'focus' as const,
      })
      currentState = result.state
    }

    expect(currentState.longestStreakDays).toBe(3)

    // Reset streak
    currentState = applyLessonRun(currentState, {
      lessonId: 'lesson-4',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-06T10:00:00.000Z'),
      mode: 'focus' as const,
    }).state

    expect(currentState.longestStreakDays).toBe(3) // Still 3, not reset
  })

  describe('leaderboard logic', () => {
    it('bestScoresByLesson keeps the best run by score', () => {
      let currentState = getInitialGamificationState()

      // First run with score 80
      currentState = applyLessonRun(currentState, {
        lessonId: 'lesson-1',
        score: 80,
        maxScore: 100,
        correctCount: 8,
        completedAt: new Date('2025-01-01T10:00:00.000Z'),
        mode: 'focus' as const,
      }).state

      expect(currentState.bestScoresByLesson['lesson-1'].score).toBe(80)

      // Second run with higher score 90
      currentState = applyLessonRun(currentState, {
        lessonId: 'lesson-1',
        score: 90,
        maxScore: 100,
        correctCount: 9,
        completedAt: new Date('2025-01-02T10:00:00.000Z'),
        mode: 'focus' as const,
      }).state

      expect(currentState.bestScoresByLesson['lesson-1'].score).toBe(90)
    })

    it('when scores tie, the latest completedAt wins', () => {
      let currentState = getInitialGamificationState()

      // First run with score 90
      currentState = applyLessonRun(currentState, {
        lessonId: 'lesson-1',
        score: 90,
        maxScore: 100,
        correctCount: 9,
        completedAt: new Date('2025-01-01T10:00:00.000Z'),
        mode: 'focus' as const,
      }).state

      const firstBest = currentState.bestScoresByLesson['lesson-1']
      expect(firstBest.score).toBe(90)
      expect(firstBest.completedAt).toBe('2025-01-01T10:00:00.000Z')

      // Second run with same score 90 but later time
      currentState = applyLessonRun(currentState, {
        lessonId: 'lesson-1',
        score: 90,
        maxScore: 100,
        correctCount: 9,
        completedAt: new Date('2025-01-02T10:00:00.000Z'),
        mode: 'focus' as const,
      }).state

      const secondBest = currentState.bestScoresByLesson['lesson-1']
      expect(secondBest.score).toBe(90)
      expect(secondBest.completedAt).toBe('2025-01-02T10:00:00.000Z')
    })

    it('lower score does not replace best score', () => {
      let currentState = getInitialGamificationState()

      // First run with score 90
      currentState = applyLessonRun(currentState, {
        lessonId: 'lesson-1',
        score: 90,
        maxScore: 100,
        correctCount: 9,
        completedAt: new Date('2025-01-01T10:00:00.000Z'),
        mode: 'focus' as const,
      }).state

      expect(currentState.bestScoresByLesson['lesson-1'].score).toBe(90)

      // Second run with lower score 80
      currentState = applyLessonRun(currentState, {
        lessonId: 'lesson-1',
        score: 80,
        maxScore: 100,
        correctCount: 8,
        completedAt: new Date('2025-01-02T10:00:00.000Z'),
        mode: 'focus' as const,
      }).state

      expect(currentState.bestScoresByLesson['lesson-1'].score).toBe(90) // Still 90
    })
  })

  it('history array appends each run', () => {
    let currentState = getInitialGamificationState()

    currentState = applyLessonRun(currentState, {
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    }).state

    currentState = applyLessonRun(currentState, {
      lessonId: 'lesson-2',
      score: 20,
      maxScore: 20,
      correctCount: 2,
      completedAt: new Date('2025-01-02T10:00:00.000Z'),
      mode: 'arcade' as const,
    }).state

    expect(currentState.history.length).toBe(2)
    expect(currentState.history[0].lessonId).toBe('lesson-1')
    expect(currentState.history[1].lessonId).toBe('lesson-2')
  })

  it('totalRuns increments for each run', () => {
    let currentState = getInitialGamificationState()

    currentState = applyLessonRun(currentState, {
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    }).state

    expect(currentState.totalRuns).toBe(1)

    currentState = applyLessonRun(currentState, {
      lessonId: 'lesson-2',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-02T10:00:00.000Z'),
      mode: 'focus' as const,
    }).state

    expect(currentState.totalRuns).toBe(2)
  })

  it('badge is not unlocked twice', () => {
    const currentState = getInitialGamificationState()

    // First completion
    const { state: state1, newlyUnlockedBadges: badges1 } = applyLessonRun(currentState, {
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
      mode: 'focus' as const,
    })

    expect(badges1).toContain('first-lesson')
    expect(state1.badgesUnlocked).toContain('first-lesson')

    // Second completion
    const { state: state2, newlyUnlockedBadges: badges2 } = applyLessonRun(state1, {
      lessonId: 'lesson-2',
      score: 10,
      maxScore: 10,
      correctCount: 1,
      completedAt: new Date('2025-01-02T10:00:00.000Z'),
      mode: 'focus' as const,
    })

    expect(badges2).not.toContain('first-lesson')
    expect(state2.badgesUnlocked.filter((b) => b === 'first-lesson').length).toBe(1)
  })
})

describe('getAllBadges', () => {
  it('returns all badge definitions', () => {
    const allBadges = getAllBadges()

    expect(allBadges).toHaveLength(4)
    expect(allBadges.map((b) => b.id)).toEqual([
      'first-lesson',
      'five-lessons',
      'perfect-score',
      'three-day-streak',
    ])
  })
})

describe('getUnlockedBadges', () => {
  it('returns unlocked badges for a given state', () => {
    const state: GamificationState = {
      totalLessonsCompleted: 1,
      totalRuns: 1,
      currentStreakDays: 1,
      longestStreakDays: 1,
      badgesUnlocked: ['first-lesson', 'perfect-score'],
      history: [],
      bestScoresByLesson: {},
    }

    const unlockedBadges = getUnlockedBadges(state)

    expect(unlockedBadges).toHaveLength(2)
    expect(unlockedBadges.map((b) => b.id)).toEqual(['first-lesson', 'perfect-score'])
  })
})

describe('getLockedBadges', () => {
  it('returns locked badges for a given state', () => {
    const state: GamificationState = {
      totalLessonsCompleted: 1,
      totalRuns: 1,
      currentStreakDays: 1,
      longestStreakDays: 1,
      badgesUnlocked: ['first-lesson'],
      history: [],
      bestScoresByLesson: {},
    }

    const lockedBadges = getLockedBadges(state)

    expect(lockedBadges).toHaveLength(3)
    expect(lockedBadges.map((b) => b.id)).toEqual([
      'five-lessons',
      'perfect-score',
      'three-day-streak',
    ])
  })
})

describe('BADGES', () => {
  it('contains all badge definitions', () => {
    expect(BADGES['first-lesson']).toBeDefined()
    expect(BADGES['five-lessons']).toBeDefined()
    expect(BADGES['perfect-score']).toBeDefined()
    expect(BADGES['three-day-streak']).toBeDefined()

    expect(BADGES['first-lesson'].label).toBe('First Lesson')
    expect(BADGES['first-lesson'].description).toBe('Complete your first lesson')
  })
})
