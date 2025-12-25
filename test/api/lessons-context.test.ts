// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { GET } from '@/app/api/lessons/context/route'
import { loadLessonBySlug } from '@/lib/lessonarcade/loaders'

vi.mock('@/lib/lessonarcade/loaders', () => ({
  loadLessonBySlug: vi.fn(),
}))

describe('/api/lessons/context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success Path', () => {
    it('should return lesson context for valid lesson slug', async () => {
      const mockLesson: Partial<import('@/lib/lessonarcade/schema').LessonArcadeLesson> = {
        id: 'test-lesson-id',
        slug: 'test-lesson',
        title: 'Test Lesson',
        shortDescription: 'A test lesson',
        longDescription: 'A longer description of test lesson',
        levels: [
          {
            id: 'level-1',
            index: 0,
            title: 'Level 1',
            summary: 'First level',
            timeRange: { startSeconds: 0, endAtSeconds: 60 },
            keyPoints: ['Key point 1', 'Key point 2'],
            items: [],
          },
        ],
        tags: ['test'],
        language: 'en',
        video: { provider: 'youtube', videoId: 'test' },
      }

      vi.mocked(loadLessonBySlug).mockResolvedValue(mockLesson as import('@/lib/lessonarcade/schema').LessonArcadeLesson)

      const request = new Request('http://localhost/api/lessons/context?lesson=test-lesson')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.lesson.id).toBe('test-lesson-id')
      expect(data.lesson.title).toBe('Test Lesson')
      expect(data.lesson.summary).toBe('A longer description of test lesson')
      expect(data.lesson.keyPoints).toEqual(['Key point 1', 'Key point 2'])
      expect(data.lesson.suggestedQuestions).toHaveLength(4)
      expect(data.lesson.suggestedQuestions[0]).toContain('Test Lesson')
    })
  })

  describe('Error Handling', () => {
    it('should return 400 when lesson query param is missing', async () => {
      const request = new Request('http://localhost/api/lessons/context')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('VALIDATION')
      expect(data.error.message).toContain('Missing')
    })

    it('should return 404 when lesson is not found', async () => {
      const error = new Error('Lesson not found')
      Object.assign(error, {
        code: 'NOT_FOUND',
        debug: {
          slug: 'non-existent',
          source: 'demo' as const,
        },
      })
      vi.mocked(loadLessonBySlug).mockRejectedValue(error)

      const request = new Request('http://localhost/api/lessons/context?lesson=non-existent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Lesson not found')
    })

    it('should return 500 for internal errors', async () => {
      vi.mocked(loadLessonBySlug).mockRejectedValue(new Error('Internal error'))

      const request = new Request('http://localhost/api/lessons/context?lesson=test-lesson')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.ok).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})
