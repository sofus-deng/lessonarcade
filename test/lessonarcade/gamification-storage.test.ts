/**
 * Unit tests for gamification storage layer.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadGamificationStateSafe,
  saveGamificationStateSafe,
  clearGamificationStateSafe,
  GAMIFICATION_STORAGE_KEY,
} from '@/lib/lessonarcade/gamification-storage'
import { getInitialGamificationState } from '@/lib/lessonarcade/gamification'
import type { GamificationState } from '@/lib/lessonarcade/gamification'

// Mock localStorage
const mockLocalStorage: Record<string, string | null> = {}

const mockGetItem = vi.fn((key: string) => mockLocalStorage[key] ?? null)
const mockSetItem = vi.fn((key: string, value: string | null) => {
  if (value === null) {
    delete mockLocalStorage[key]
  } else {
    mockLocalStorage[key] = value
  }
})
const mockRemoveItem = vi.fn((key: string) => {
  delete mockLocalStorage[key]
})

const mockLocalStorageImpl = {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: mockRemoveItem,
  clear: vi.fn(() => {
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key])
  }),
}

describe('gamification-storage', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key])
    mockGetItem.mockClear()
    mockSetItem.mockClear()
    mockRemoveItem.mockClear()

    // Mock localStorage directly (not window.localStorage)
    vi.stubGlobal('localStorage', mockLocalStorageImpl)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('loadGamificationStateSafe', () => {
    it('returns initial state when window is not available', () => {
      vi.unstubAllGlobals()

      const state = loadGamificationStateSafe()

      expect(state).toEqual(getInitialGamificationState())
      // When window is not available, localStorage.getItem is not called
      expect(mockGetItem).not.toHaveBeenCalled()
    })

    it('returns initial state when there is no stored value', () => {
      mockLocalStorage[GAMIFICATION_STORAGE_KEY] = null

      const state = loadGamificationStateSafe()

      expect(state).toEqual(getInitialGamificationState())
      expect(mockGetItem).toHaveBeenCalledWith(GAMIFICATION_STORAGE_KEY)
    })

    it('returns stored state when valid JSON is present', () => {
      const storedState: GamificationState = {
        totalLessonsCompleted: 5,
        totalRuns: 7,
        currentStreakDays: 3,
        longestStreakDays: 5,
        badgesUnlocked: ['first-lesson', 'five-lessons', 'three-day-streak'],
        history: [
          {
            lessonId: 'lesson-1',
            score: 100,
            maxScore: 100,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
        ],
        bestScoresByLesson: {
          'lesson-1': {
            lessonId: 'lesson-1',
            score: 100,
            maxScore: 100,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
        },
      }

      mockLocalStorage[GAMIFICATION_STORAGE_KEY] = JSON.stringify(storedState)

      const state = loadGamificationStateSafe()

      expect(state).toEqual(storedState)
    })

    it('returns initial state when invalid JSON is stored', () => {
      mockLocalStorage[GAMIFICATION_STORAGE_KEY] = 'invalid json{{{'

      const state = loadGamificationStateSafe()

      expect(state).toEqual(getInitialGamificationState())
    })

    it('handles empty string stored value', () => {
      mockLocalStorage[GAMIFICATION_STORAGE_KEY] = ''

      const state = loadGamificationStateSafe()

      expect(state).toEqual(getInitialGamificationState())
    })
  })

  describe('saveGamificationStateSafe', () => {
    it('does nothing when window is not available', () => {
      vi.unstubAllGlobals()

      const state = getInitialGamificationState()
      saveGamificationStateSafe(state)

      expect(mockSetItem).not.toHaveBeenCalled()
    })

    it('saves state to localStorage', () => {
      const state: GamificationState = {
        totalLessonsCompleted: 1,
        totalRuns: 1,
        currentStreakDays: 1,
        longestStreakDays: 1,
        badgesUnlocked: ['first-lesson'],
        history: [
          {
            lessonId: 'lesson-1',
            score: 10,
            maxScore: 10,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
        ],
        bestScoresByLesson: {
          'lesson-1': {
            lessonId: 'lesson-1',
            score: 10,
            maxScore: 10,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
        },
      }

      saveGamificationStateSafe(state)

      expect(mockSetItem).toHaveBeenCalledWith(
        GAMIFICATION_STORAGE_KEY,
        JSON.stringify(state)
      )
    })

    it('serializes state correctly', () => {
      const state: GamificationState = {
        totalLessonsCompleted: 5,
        totalRuns: 10,
        currentStreakDays: 3,
        longestStreakDays: 5,
        badgesUnlocked: ['first-lesson', 'five-lessons'],
        history: [],
        bestScoresByLesson: {},
      }

      saveGamificationStateSafe(state)

      const storedValue = mockLocalStorage[GAMIFICATION_STORAGE_KEY]
      expect(JSON.parse(storedValue as string)).toEqual(state)
    })
  })

  describe('clearGamificationStateSafe', () => {
    it('does nothing when window is not available', () => {
      vi.unstubAllGlobals()

      clearGamificationStateSafe()

      expect(mockRemoveItem).not.toHaveBeenCalled()
    })

    it('removes state from localStorage', () => {
      mockLocalStorage[GAMIFICATION_STORAGE_KEY] = JSON.stringify(getInitialGamificationState())

      clearGamificationStateSafe()

      expect(mockRemoveItem).toHaveBeenCalledWith(GAMIFICATION_STORAGE_KEY)
      expect(mockLocalStorage[GAMIFICATION_STORAGE_KEY]).toBeUndefined()
    })

    it('does not throw when key does not exist', () => {
      expect(() => {
        clearGamificationStateSafe()
      }).not.toThrow()
    })
  })

  describe('integration: load and save cycle', () => {
    it('can save and load same state', () => {
      const originalState: GamificationState = {
        totalLessonsCompleted: 3,
        totalRuns: 5,
        currentStreakDays: 2,
        longestStreakDays: 3,
        badgesUnlocked: ['first-lesson', 'perfect-score'],
        history: [
          {
            lessonId: 'lesson-1',
            score: 80,
            maxScore: 100,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
          {
            lessonId: 'lesson-2',
            score: 100,
            maxScore: 100,
            completedAt: '2025-01-02T10:00:00.000Z',
            mode: 'arcade',
          },
        ],
        bestScoresByLesson: {
          'lesson-1': {
            lessonId: 'lesson-1',
            score: 80,
            maxScore: 100,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
          'lesson-2': {
            lessonId: 'lesson-2',
            score: 100,
            maxScore: 100,
            completedAt: '2025-01-02T10:00:00.000Z',
            mode: 'arcade',
          },
        },
      }

      saveGamificationStateSafe(originalState)
      const loadedState = loadGamificationStateSafe()

      expect(loadedState).toEqual(originalState)
    })

    it('overwrites previous state when saving', () => {
      const firstState: GamificationState = {
        totalLessonsCompleted: 1,
        totalRuns: 1,
        currentStreakDays: 1,
        longestStreakDays: 1,
        badgesUnlocked: ['first-lesson'],
        history: [
          {
            lessonId: 'lesson-1',
            score: 10,
            maxScore: 10,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
        ],
        bestScoresByLesson: {
          'lesson-1': {
            lessonId: 'lesson-1',
            score: 10,
            maxScore: 10,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
        },
      }

      const secondState: GamificationState = {
        totalLessonsCompleted: 2,
        totalRuns: 2,
        currentStreakDays: 2,
        longestStreakDays: 2,
        badgesUnlocked: ['first-lesson', 'five-lessons'],
        history: [
          {
            lessonId: 'lesson-1',
            score: 10,
            maxScore: 10,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
          {
            lessonId: 'lesson-2',
            score: 20,
            maxScore: 20,
            completedAt: '2025-01-02T10:00:00.000Z',
            mode: 'focus',
          },
        ],
        bestScoresByLesson: {
          'lesson-1': {
            lessonId: 'lesson-1',
            score: 10,
            maxScore: 10,
            completedAt: '2025-01-01T10:00:00.000Z',
            mode: 'focus',
          },
          'lesson-2': {
            lessonId: 'lesson-2',
            score: 20,
            maxScore: 20,
            completedAt: '2025-01-02T10:00:00.000Z',
            mode: 'focus',
          },
        },
      }

      saveGamificationStateSafe(firstState)
      saveGamificationStateSafe(secondState)
      const loadedState = loadGamificationStateSafe()

      expect(loadedState).toEqual(secondState)
    })
  })
})
